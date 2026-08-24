<script lang="ts">
    import { onMount } from "svelte";
    import { Panel, Button, EmptyState, CodeEditor, CodeBlock } from "$lib/components/ui";
    import ToolWorkspace from "$lib/components/layout/ToolWorkspace.svelte";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import { dataBridge } from "$lib/stores/dataBridge";
    import HandoffDropdown from "$lib/components/ui/HandoffDropdown.svelte";
    import {
        ShieldAlert,
        ShieldCheck,
        Search,
        Trash2,
        Eye,
        EyeOff,
        Download,
        Copy,
        AlertCircle,
        HelpCircle,
        Terminal,
        Check,
        RefreshCw,
        Info,
        Sparkles
    } from "lucide-svelte";


    interface PatternRule {
        id: string;
        name: string;
        regex: RegExp;
        severity: "critical" | "high" | "medium" | "low";
        confidence: "high" | "medium" | "low";
        description: string;
        remediation: string;
        groupIndex?: number;
    }

    let input = $state("");
    let fileName = $state<string | null>(null);
    let findings = $state<any[]>([]);
    let isScanning = $state(false);
    let activeTab = $state<"pending" | "ignored" | "resolved" | "all">("pending");
    let activeSidebarTab = $state<"rules" | "history" | "whitelist" | "guides">("rules");

    // Scan settings & metrics
    let isGitDiffMode = $state(false);
    let scanDuration = $state(0);
    let searchQuery = $state("");
    let filterSeverity = $state<"all" | "critical" | "high" | "medium" | "low">("all");
    
    // Editor line highlighting
    let errorLine = $state<number | null>(null);
    let activeFindingId = $state<string | null>(null);

    // Security Display Settings
    let showSecretsForFinding = $state<Record<string, boolean>>({});
    let showConfirmReveal = $state(false);
    let findingToReveal = $state<any | null>(null);

    // Ignore Dialog States
    let showIgnoreDialog = $state(false);
    let findingToIgnore = $state<any | null>(null);
    let selectedIgnoreReason = $state("测试用占位符或模拟字段");
    let customIgnoreReason = $state("");

    // Custom Rule creation form states
    let customRuleName = $state("");
    let customRuleRegex = $state("");
    let customRuleSeverity = $state<"critical" | "high" | "medium" | "low">("medium");
    let customRuleDesc = $state("");
    let customRuleRemediation = $state("");
    let customRuleTestStr = $state("");

    // Local Storage Triage State
    let ignoredList = $state<{ key: string; reason: string }[]>([]);
    let resolvedList = $state<string[]>([]);
    let checklistProgress = $state<Record<string, Record<string, boolean>>>({});
    let globalWhitelist = $state<string[]>([]);
    let scanHistory = $state<{ id: string; timestamp: number; fileName: string | null; totalCount: number; resolvedCount: number; content: string }[]>([]);
    let customRules = $state<PatternRule[]>([]);
    let ruleSwitches = $state<Record<string, boolean>>({});

    const PATTERNS: PatternRule[] = [
        {
            id: "aws-access-key",
            name: "AWS Access Key ID",
            regex: /AKIA[0-9A-Z]{16}/g,
            severity: "critical",
            confidence: "high",
            description: "AWS 账户或 IAM 用户的身份凭证，具备直接访问 AWS 服务资源的权限。",
            remediation: "在 IAM 控制台中轮换或失效该密钥，改用 IAM 角色（Role）、AWS Secrets Manager 或本地环境变量。"
        },
        {
            id: "aws-secret-key",
            name: "AWS Secret Access Key",
            regex: /(?:aws_secret_access_key|aws_secret|secret_key|aws_key)\s*[:=]\s*["']([A-Za-z0-9/+=]{40})["']/gi,
            groupIndex: 1,
            severity: "critical",
            confidence: "high",
            description: "AWS Access Key 的配对私钥。一旦泄露，攻击者可能完全控制该 AWS 账户资源。",
            remediation: "立即轮换此密钥，检查 CloudTrail 日志确认是否有异常 API 请求。切勿将其直接硬编码在代码或提交到 Git。"
        },
        {
            id: "github-token",
            name: "GitHub Personal Access Token",
            regex: /gh[pous]_[a-zA-Z0-9]{36,255}/g,
            severity: "critical",
            confidence: "high",
            description: "GitHub 个人访问令牌，可用于通过 API 读写仓库、组织或包管理器资源。",
            remediation: "立即前往 GitHub 设置 > Developer settings 撤销（Revoke）此 Token，并重新生成后存入环境变量。"
        },
        {
            id: "private-key",
            name: "PEM Private Key",
            regex: /-----BEGIN [A-Z ]+ PRIVATE KEY-----/g,
            severity: "critical",
            confidence: "high",
            description: "PEM 格式的非对称加密私钥（如 RSA、SSH 或 SSL），可用于非授权登录服务器或解密数据。",
            remediation: "重新生成证书/密钥对并吊销泄漏证书。将私钥移出代码库，保存在云厂商 KMS 或安全的 Vault 中。"
        },
        {
            id: "google-api-key",
            name: "Google API Key",
            regex: /AIza[0-9A-Za-z-_]{35}/g,
            severity: "high",
            confidence: "high",
            description: "Google Cloud Platform 或 Google Maps 等服务的 API 访问密钥。",
            remediation: "在 Google Cloud Console 中对此密钥进行访问来源限制（IP/域名），并尽快轮换重新生成。"
        },
        {
            id: "slack-webhook",
            name: "Slack Webhook URL",
            regex: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+/g,
            severity: "high",
            confidence: "high",
            description: "Slack Incoming Webhook，允许外部应用向指定的 Slack 频道发送任意通知消息。",
            remediation: "在 Slack App 仪表盘中停用此 Webhook URL 并重新生成，在代码中将配置项移入 .env 文件。"
        },
        {
            id: "stripe-live-key",
            name: "Stripe Live API Key",
            regex: /sk_live_[0-9a-zA-Z]{24,32}/g,
            severity: "critical",
            confidence: "high",
            description: "Stripe 生产环境 API 密钥，可直接发起真实的支付、查询客户交易等敏感操作。",
            remediation: "立即前往 Stripe 控制面板 > Developers > API keys 轮换并失效该密钥，切勿提交至公开或私有代码库。"
        },
        {
            id: "stripe-test-key",
            name: "Stripe Test API Key",
            regex: /sk_test_[0-9a-zA-Z]{24,32}/g,
            severity: "low",
            confidence: "high",
            description: "Stripe 沙箱测试环境 API 密钥，用于模拟交易，不涉及真实资金扣款。",
            remediation: "虽然是测试密钥，仍建议通过 Stripe 控制面板轮换，避免测试凭证外泄被恶意占用配额。"
        },
        {
            id: "database-url",
            name: "Database Connection URL",
            regex: /(?:postgres|postgresql|mysql|mongodb|redis|mssql|oracle):\/\/[^:\s]+:([^@\s]+)@[^@\s]+/gi,
            groupIndex: 1,
            severity: "critical",
            confidence: "high",
            description: "数据库连接字符串，包含明文密码和敏感的数据库主机地址信息。",
            remediation: "修改该数据库用户的密码！改用 Kubernetes Secrets、环境变量或云厂商托管的数据库认证服务。"
        },
        {
            id: "jwt-token",
            name: "JSON Web Token (JWT)",
            regex: /eyJ[A-Za-z0-9-_=]+\.eyJ[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g,
            severity: "medium",
            confidence: "medium",
            description: "JSON Web Token 会话凭证，包含用户身份及权限信息，长期泄露可能面临越权攻击。",
            remediation: "如果对应长期有效令牌，需立即在服务端废弃对应会话或吊销 Token，并减小 JWT 的过期时长限制。"
        },
        {
            id: "generic-password",
            name: "Hardcoded Password / Client Secret",
            regex: /(?:password|passwd|pwd|client_secret|client_token)\s*[:=]\s*["']([^'"\s]{8,})["']/gi,
            groupIndex: 1,
            severity: "medium",
            confidence: "medium",
            description: "代码或配置文件中硬编码的密码或客户端密钥（Client Secret），通常是数据库密码或 OAuth 秘钥。",
            remediation: "评估是否为测试占位符（如 'root', '123456'）。若为真实凭证，请立即重置密码并将配置项抽离至环境变量或密钥服务。"
        }
    ];

    onMount(() => {
        try {
            const ignored = localStorage.getItem("aone-sec-ignored");
            if (ignored) ignoredList = JSON.parse(ignored);

            const resolved = localStorage.getItem("aone-sec-resolved");
            if (resolved) resolvedList = JSON.parse(resolved);

            const whitelistStr = localStorage.getItem("aone-sec-whitelist");
            if (whitelistStr) globalWhitelist = JSON.parse(whitelistStr);

            const historyStr = localStorage.getItem("aone-sec-history");
            if (historyStr) scanHistory = JSON.parse(historyStr);

            const customRulesStr = localStorage.getItem("aone-sec-custom-rules");
            if (customRulesStr) {
                const parsedRules = JSON.parse(customRulesStr);
                customRules = parsedRules.map((r: any) => ({
                    ...r,
                    regex: new RegExp(r.regexSource, r.regexFlags || "g")
                }));
            }

            const switchesStr = localStorage.getItem("aone-sec-rule-switches");
            if (switchesStr) {
                ruleSwitches = JSON.parse(switchesStr);
            } else {
                const defaults: Record<string, boolean> = {};
                PATTERNS.forEach(p => { defaults[p.id] = true; });
                ruleSwitches = defaults;
            }

            // Consume dataBridge
            const handoff = dataBridge.consume("/secret-scanner");
            if (handoff && handoff.payload) {
                input = handoff.payload;
                toastStore.success(`已从 ${handoff.sourceTool} 载入文本并开始扫描`);
                performScan(input);
            }
        } catch (e) {
            console.error("Failed to load local security triage state", e);
        }
    });

    function redactAllSecrets(mode: "mask" | "env" = "mask") {
        if (!input || findings.length === 0) {
            toastStore.error("当前无敏感信息可脱敏");
            return;
        }
        const activeFindings = [...findings]
            .filter(f => f.status !== "ignored" && typeof f.startIndex === "number")
            .sort((a, b) => b.startIndex - a.startIndex);
        
        let updated = input;
        let count = 0;
        for (const f of activeFindings) {
            const replacement = mode === "env" 
                ? `\${${f.name.toUpperCase().replace(/[^A-Z0-9]/g, "_")}}` 
                : mask(f.value, false);
            if (updated.slice(f.startIndex, f.endIndex) === f.value) {
                updated = updated.slice(0, f.startIndex) + replacement + updated.slice(f.endIndex);
                count++;
            }
        }
        input = updated;
        toastStore.success(`一键脱敏完成：已精准替换 ${count} 处敏感凭据`);
        performScan(input);
    }

    function generateEnvExample(): string {
        const keys = new Set<string>();
        findings.forEach(f => {
            const varName = f.name.toUpperCase().replace(/[^A-Z0-9]/g, "_");
            keys.add(`${varName}=your_${varName.toLowerCase()}_here`);
        });
        return Array.from(keys).join("\n");
    }



    function saveIgnoredList() {
        try {
            localStorage.setItem("aone-sec-ignored", JSON.stringify(ignoredList));
        } catch (e) {
            console.error(e);
        }
    }

    function saveResolvedList() {
        try {
            localStorage.setItem("aone-sec-resolved", JSON.stringify(resolvedList));
        } catch (e) {
            console.error(e);
        }
    }

    function saveCustomRules() {
        try {
            const serializable = customRules.map(r => ({
                id: r.id,
                name: r.name,
                regexSource: (r.regex as RegExp).source,
                regexFlags: (r.regex as RegExp).flags,
                severity: r.severity,
                confidence: r.confidence,
                description: r.description,
                remediation: r.remediation
            }));
            localStorage.setItem("aone-sec-custom-rules", JSON.stringify(serializable));
        } catch (e) {
            console.error(e);
        }
    }

    function saveRuleSwitches() {
        try {
            localStorage.setItem("aone-sec-rule-switches", JSON.stringify(ruleSwitches));
        } catch (e) {
            console.error(e);
        }
    }

    // Config Sharing functions
    function exportConfig() {
        const configData = {
            version: "1.0.0",
            customRules: customRules.map(r => ({
                name: r.name,
                regexSource: (r.regex as RegExp).source,
                regexFlags: (r.regex as RegExp).flags,
                severity: r.severity,
                confidence: r.confidence,
                description: r.description,
                remediation: r.remediation
            })),
            whitelist: globalWhitelist
        };
        const blob = new Blob([JSON.stringify(configData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `aone-scanner-config-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toastStore.success("规则配置文件导出成功");
    }

    function handleImportConfig(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            const file = target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse((event.target?.result as string) || "{}");
                    if (imported.customRules) {
                        const parsedRules = imported.customRules.map((r: any) => ({
                            id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                            name: r.name,
                            regex: new RegExp(r.regexSource, r.regexFlags || "g"),
                            severity: r.severity,
                            confidence: r.confidence || "medium",
                            description: r.description || "",
                            remediation: r.remediation || ""
                        }));
                        
                        customRules = [...customRules, ...parsedRules];
                        parsedRules.forEach((r: any) => {
                            ruleSwitches[r.id] = true;
                        });
                        saveCustomRules();
                        saveRuleSwitches();
                    }

                    if (imported.whitelist) {
                        globalWhitelist = Array.from(new Set([...globalWhitelist, ...imported.whitelist]));
                        saveWhitelist();
                    }

                    performScan(input);
                    toastStore.success("扫描规则与白名单导入成功");
                } catch (err) {
                    toastStore.error(`解析配置失败: ${(err as Error).message}`);
                }
            };
            reader.readAsText(file);
        }
    }

    function saveWhitelist() {
        try {
            localStorage.setItem("aone-sec-whitelist", JSON.stringify(globalWhitelist));
        } catch (e) {
            console.error(e);
        }
    }

    function saveScanHistory() {
        try {
            localStorage.setItem("aone-sec-history", JSON.stringify(scanHistory));
        } catch (e) {
            console.error(e);
        }
    }

    // Convert character index to Line & Col, and extract surrounding lines context
    function posToLineColAndContext(text: string, pos: number, matchValue: string) {
        const beforeText = text.substring(0, pos);
        const linesBefore = beforeText.split("\n");
        const lineNum = linesBefore.length;
        const colNum = linesBefore[linesBefore.length - 1].length + 1;

        const allLines = text.split("\n");
        const lineIndex = lineNum - 1;
        const currentLine = allLines[lineIndex] || "";
        const preLine = lineIndex > 0 ? allLines[lineIndex - 1] : null;
        const postLine = lineIndex < allLines.length - 1 ? allLines[lineIndex + 1] : null;

        return {
            line: lineNum,
            col: colNum,
            context: {
                pre: preLine,
                lineText: currentLine,
                post: postLine
            }
        };
    }

    // FNV-1a/DJB2 fast non-crypto hashing to store whitelist hashes
    function hashString(str: string): string {
        let hash = 0;
        if (str.length === 0) return hash.toString();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    function calculateShannonEntropy(str: string): number {
        if (!str) return 0;
        const len = str.length;
        const frequencies: Record<string, number> = {};
        for (let i = 0; i < len; i++) {
            const char = str[i];
            frequencies[char] = (frequencies[char] || 0) + 1;
        }
        let entropy = 0;
        for (const char in frequencies) {
            const p = frequencies[char] / len;
            entropy -= p * Math.log2(p);
        }
        return parseFloat(entropy.toFixed(2));
    }

    function performScan(text: string) {
        if (!text) {
            findings = [];
            scanDuration = 0;
            return;
        }

        const startTime = performance.now();

        // Add history record (last 5, avoid duplicate content)
        if (text.trim() && !scanHistory.some(h => h.content === text)) {
            const newHistoryItem = {
                id: `history-${Date.now()}`,
                timestamp: Date.now(),
                fileName: fileName,
                totalCount: 0,
                resolvedCount: 0,
                content: text
            };
            scanHistory = [newHistoryItem, ...scanHistory].slice(0, 5);
            saveScanHistory();
        }

        const results: any[] = [];
        const activeRules = [...PATTERNS, ...customRules].filter(p => ruleSwitches[p.id] !== false);

        // Preprocess text if Git Diff mode is enabled
        let textToScan = text;
        if (isGitDiffMode) {
            const lines = text.split("\n");
            let reconstructed = "";
            lines.forEach(line => {
                if (line.startsWith("+") && !line.startsWith("+++")) {
                    reconstructed += " " + line.substring(1) + "\n";
                } else {
                    reconstructed += " ".repeat(line.length) + "\n";
                }
            });
            textToScan = reconstructed;
        }

        activeRules.forEach((p) => {
            p.regex.lastIndex = 0;
            let match;
            while ((match = p.regex.exec(textToScan)) !== null) {
                const fullMatch = match[0];
                const val = p.groupIndex !== undefined ? match[p.groupIndex] : fullMatch;
                if (!val) continue;

                const offset = p.groupIndex !== undefined ? fullMatch.indexOf(val) : 0;
                const pos = match.index + offset;

                if (results.some(r => r.ruleId === p.id && r.pos === pos)) continue;

                const secretHash = hashString(val);
                
                // Skip if globally whitelisted
                if (globalWhitelist.includes(secretHash)) continue;

                const loc = posToLineColAndContext(text, pos, val);
                const sigKey = `${p.id}-${secretHash}`;

                // Map triage states
                let status: "active" | "ignored" | "resolved" = "active";
                let ignoreReason = "";
                
                const matchedIgnored = ignoredList.find(item => item.key === sigKey);
                if (matchedIgnored) {
                    status = "ignored";
                    ignoreReason = matchedIgnored.reason;
                } else if (resolvedList.includes(sigKey)) {
                    status = "resolved";
                }

                results.push({
                    id: `${p.id}-${pos}`,
                    ruleId: p.id,
                    name: p.name,
                    value: val,
                    fullMatch: fullMatch,
                    pos: pos,
                    startIndex: pos,
                    endIndex: pos + val.length,
                    severity: p.severity,
                    confidence: p.confidence,
                    remediation: p.remediation,
                    status: status,
                    ignoreReason: ignoreReason,
                    line: loc.line,
                    col: loc.col,
                    context: loc.context,
                    hash: secretHash,
                    entropy: calculateShannonEntropy(val)
                });
            }
        });

        results.sort((a, b) => a.line - b.line);
        findings = results;

        const endTime = performance.now();
        scanDuration = parseFloat((endTime - startTime).toFixed(2));

        // Update findings count in scanHistory
        if (scanHistory.length > 0 && scanHistory[0].content === text) {
            scanHistory[0].totalCount = results.length;
            scanHistory[0].resolvedCount = results.filter(f => f.status === 'resolved').length;
            saveScanHistory();
        }
    }

    let scanTimeout: ReturnType<typeof setTimeout>;
    function debouncedScan() {
        clearTimeout(scanTimeout);
        isScanning = true;
        scanTimeout = setTimeout(() => {
            performScan(input);
            isScanning = false;
        }, 400);
    }

    function handleClear() {
        input = "";
        findings = [];
        fileName = null;
        errorLine = null;
        activeFindingId = null;
        showSecretsForFinding = {};
        clearTimeout(scanTimeout);
        toastStore.success("内容已清空");
    }

    function locateLine(line: number, id: string) {
        errorLine = null;
        setTimeout(() => {
            errorLine = line;
            activeFindingId = id;
            toastStore.success(`已在左侧编辑器中定位至第 ${line} 行`);
        }, 50);
    }

    function triggerReveal(finding: any) {
        if (showSecretsForFinding[finding.id]) {
            showSecretsForFinding[finding.id] = false;
        } else {
            findingToReveal = finding;
            showConfirmReveal = true;
        }
    }

    function confirmReveal() {
        if (findingToReveal) {
            showSecretsForFinding[findingToReveal.id] = true;
        }
        showConfirmReveal = false;
        findingToReveal = null;
        toastStore.success("敏感明文已展开，请防范录屏和窥视风险");
    }

    async function handleCopyFinding(finding: any) {
        const isRevealed = showSecretsForFinding[finding.id] || false;
        if (isRevealed) {
            const ok = await copyToClipboard(finding.value);
            if (ok) {
                toastStore.success("已复制完整敏感原始值！请注意保管安全");
            }
        } else {
            const maskedVal = mask(finding.value, false);
            const ok = await copyToClipboard(maskedVal);
            if (ok) {
                toastStore.success("已复制脱敏值到剪贴板");
            }
        }
    }

    function triggerIgnore(finding: any) {
        findingToIgnore = finding;
        selectedIgnoreReason = "测试用占位符或模拟字段";
        customIgnoreReason = "";
        showIgnoreDialog = true;
    }

    function confirmIgnore() {
        if (findingToIgnore) {
            const reason = selectedIgnoreReason === 'other' ? customIgnoreReason : selectedIgnoreReason;
            const sigKey = `${findingToIgnore.ruleId}-${findingToIgnore.hash}`;
            
            const matchedIdx = ignoredList.findIndex(item => item.key === sigKey);
            const itemData = { key: sigKey, reason: reason || "无具体原因" };
            if (matchedIdx > -1) {
                ignoredList[matchedIdx] = itemData;
            } else {
                ignoredList.push(itemData);
            }
            saveIgnoredList();

            resolvedList = resolvedList.filter(k => k !== sigKey);
            saveResolvedList();

            findingToIgnore.status = "ignored";
            findingToIgnore.ignoreReason = itemData.reason;
            toastStore.success("已将发现项标记为忽略/误报");
        }
        showIgnoreDialog = false;
        findingToIgnore = null;
    }

    function resolveFinding(finding: any) {
        const sigKey = `${finding.ruleId}-${finding.hash}`;
        if (!resolvedList.includes(sigKey)) {
            resolvedList.push(sigKey);
            saveResolvedList();
        }
        ignoredList = ignoredList.filter(item => item.key !== sigKey);
        saveIgnoredList();

        finding.status = "resolved";
        toastStore.success("已标记此风险为已处理");
    }

    function reinstateFinding(finding: any) {
        const sigKey = `${finding.ruleId}-${finding.hash}`;
        ignoredList = ignoredList.filter(item => item.key !== sigKey);
        saveIgnoredList();
        resolvedList = resolvedList.filter(key => key !== sigKey);
        saveResolvedList();

        if (checklistProgress[finding.id]) {
            checklistProgress[finding.id] = { step1: false, step2: false, step3: false };
        }

        finding.status = "active";
        finding.ignoreReason = "";
        toastStore.success("已恢复凭据评估状态为待处理");
    }

    // Whitelist management
    function addToWhitelist(finding: any) {
        if (!globalWhitelist.includes(finding.hash)) {
            globalWhitelist = [...globalWhitelist, finding.hash];
            saveWhitelist();
        }
        findings = findings.filter(f => f.id !== finding.id);
        toastStore.success("已加入全局豁免白名单");
        performScan(input);
    }

    // Whitelist actions
    function removeFromWhitelist(hash: string) {
        globalWhitelist = globalWhitelist.filter(h => h !== hash);
        saveWhitelist();
        performScan(input);
        toastStore.success("已从白名单移除");
    }

    function clearWhitelist() {
        globalWhitelist = [];
        saveWhitelist();
        performScan(input);
        toastStore.success("白名单已全部清空");
    }

    // History loaders
    function loadHistory(item: any) {
        input = item.content;
        fileName = item.fileName || "历史审计记录";
        performScan(input);
        toastStore.success(`已载入历史记录: ${new Date(item.timestamp).toLocaleTimeString()}`);
    }

    function deleteHistoryRecord() {
        scanHistory = [];
        saveScanHistory();
        toastStore.success("历史扫描审计已全部清空");
    }

    // Custom Rules creator
    function addCustomRule() {
        if (!customRuleName || !customRuleRegex) {
            toastStore.warning("请填写规则名称及匹配正则");
            return;
        }
        try {
            const rx = new RegExp(customRuleRegex, "g");
            const newRule: PatternRule = {
                id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                name: customRuleName,
                regex: rx,
                severity: customRuleSeverity,
                confidence: "medium",
                description: customRuleDesc || "用户自定义的检测匹配规则。",
                remediation: customRuleRemediation || "由自定义安全规则定义，请根据自定义说明规范安全移除明文。"
            };
            customRules = [...customRules, newRule];
            ruleSwitches[newRule.id] = true;
            
            saveCustomRules();
            saveRuleSwitches();

            customRuleName = "";
            customRuleRegex = "";
            customRuleDesc = "";
            customRuleRemediation = "";
            customRuleTestStr = "";

            performScan(input);
            toastStore.success("成功添加自定义匹配规则！");
        } catch (e) {
            toastStore.error(`正则表达式语法错误: ${(e as Error).message}`);
        }
    }

    function deleteCustomRule(id: string) {
        customRules = customRules.filter(r => r.id !== id);
        delete ruleSwitches[id];
        saveCustomRules();
        saveRuleSwitches();
        performScan(input);
        toastStore.success("自定义匹配规则已移除");
    }

    // Checklist tracking helpers
    function getChecklistState(findingId: string, step: string): boolean {
        if (!checklistProgress[findingId]) return false;
        return checklistProgress[findingId][step] || false;
    }

    function toggleChecklistStep(findingId: string, step: string, checked: boolean) {
        if (!checklistProgress[findingId]) {
            checklistProgress[findingId] = { step1: false, step2: false, step3: false };
        }
        checklistProgress[findingId][step] = checked;

        // Auto resolve when checklist is fully completed
        const p = checklistProgress[findingId];
        if (p.step1 && p.step2 && p.step3) {
            const f = findings.find(x => x.id === findingId);
            if (f && f.status !== 'resolved') {
                resolveFinding(f);
            }
        }
    }

    function getChecklistCount(findingId: string): number {
        const p = checklistProgress[findingId];
        if (!p) return 0;
        let count = 0;
        if (p.step1) count++;
        if (p.step2) count++;
        if (p.step3) count++;
        return count;
    }

    // Export report securely (masked values only)
    function exportFindings(format: "markdown" | "json") {
        if (findings.length === 0) {
            toastStore.warning("无可导出的安全扫描发现项");
            return;
        }

        let mimeType = "application/json";
        let extension = "json";
        let fileContent = "";

        if (format === "json") {
            const data = findings.map(f => ({
                id: f.id,
                name: f.name,
                severity: f.severity,
                confidence: f.confidence,
                line: f.line,
                col: f.col,
                value: mask(f.value, false),
                status: f.status,
                ignoreReason: f.ignoreReason || undefined,
                remediation: f.remediation
            }));
            fileContent = JSON.stringify(data, null, 2);
        } else {
            mimeType = "text/markdown";
            extension = "md";
            
            let md = `# Aone Toolkit - 敏感凭据本地审计报告\n\n`;
            md += `> 🔒 **信息安全防范提示**：此报告中导出的所有敏感内容均已作脱敏屏蔽处理。\n\n`;
            md += `## 一、审计摘要\n\n`;
            md += `- **审计文件/来源**: ${fileName || "剪贴板粘贴内容"}\n`;
            md += `- **发现隐患总数**: ${findings.length} 项\n`;
            md += `  - 🔴 待处理风险: ${pendingFindings.length} 项\n`;
            md += `  - 🟡 已忽略误报: ${ignoredFindings.length} 项\n`;
            md += `  - 🟢 已标记已解决: ${resolvedFindings.length} 项\n\n`;
            
            md += `## 二、漏洞详细清单\n\n`;
            
            findings.forEach((f, idx) => {
                md += `### ${idx + 1}. [${f.severity.toUpperCase()}] ${f.name}\n\n`;
                md += `- **物理位置**: 第 ${f.line} 行，第 ${f.col} 列\n`;
                md += `- **置信度**: ${f.confidence === 'high' ? '高' : f.confidence === 'medium' ? '中' : '低'}\n`;
                md += `- **脱敏字段值**: \`${mask(f.value, false)}\`\n`;
                md += `- **当前状态**: ${f.status === 'active' ? '🔴 待处理' : f.status === 'ignored' ? '🟡 已忽略（误报）' : '🟢 已解决'}\n`;
                if (f.status === 'ignored' && f.ignoreReason) {
                    md += `- **忽略原由**: ${f.ignoreReason}\n`;
                }
                md += `- **处置建议**: ${f.remediation}\n\n`;
            });
            
            fileContent = md;
        }

        const blob = new Blob([fileContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `secret-scan-report-${Date.now()}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
        toastStore.success(`安全报告已成功下载 (格式: ${extension.toUpperCase()})`);
    }

    // Mask sensitive keys by leaving prefix & suffix intact
    function mask(text: string, show: boolean) {
        if (show) return text;
        if (!text) return "";
        if (text.length <= 8) {
            return text.substring(0, 2) + "****" + text.substring(text.length - 2);
        }
        return text.substring(0, 4) + "****" + text.substring(text.length - 4);
    }

    // Read dropped or browsed file in browser locally
    let isDragging = $state(false);

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        isDragging = true;
    }

    function handleDragLeave() {
        isDragging = false;
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        isDragging = false;
        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            readFileContent(file);
        }
    }

    function handleFileSelect(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            const file = target.files[0];
            readFileContent(file);
        }
    }

    function readFileContent(file: File) {
        fileName = file.name;
        const reader = new FileReader();
        reader.onload = (event) => {
            input = (event.target?.result as string) || "";
            performScan(input);
            toastStore.success(`成功导入本地文件: ${file.name}`);
        };
        reader.onerror = () => {
            toastStore.error(`无法读取本地文件: ${file.name}`);
        };
        reader.readAsText(file);
    }

    // Quick demo loader templates
    function loadDemo(type: "aws-github" | "stripe-google" | "safe") {
        let demoText = "";
        if (type === "aws-github") {
            fileName = "aws_config_leak.js";
            demoText = `// AWS and GitHub Credential Leak Demo Configuration
const config = {
    aws: {
        accessKeyId: "AKIAIOSFODNN7EXAMPLE",
        // Do NOT put production secrets in source code files!
        secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", 
        region: "us-west-2"
    },
    github: {
        token: "ghp_n8fJsh29skJsn19dJshs01ksjdh198shsn12",
        org: "company-internal"
    }
};

function uploadLogs() {
    console.log("Uploading system metrics to AWS...");
}
`;
        } else if (type === "stripe-google") {
            fileName = "payment_processor.py";
            demoText = `# Payment and database configurations
import stripe

stripe.api_key = "sk_test_51MockDemoKey00000000000000" # Stripe Mock Test Key!
google_maps_api = "AIzaSyD-127shsKsi91shsKsi91shsKsi91shs"

# Direct JDBC URL Connection
db_connection_url = "postgres://postgres_admin:PassWord123!@db-prod.internal.local:5432/user_database"

def process_transaction(user_id, amount):
    print(f"Connecting to database to verify user {user_id}...")
`;
        } else if (type === "safe") {
            fileName = "docker-compose.yml";
            demoText = `# docker-compose.yml - Safe Configuration Example
version: '3.8'

services:
  app:
    image: company/web-app:latest
    environment:
      # Secure: Reading credentials dynamically from host environment
      - AWS_ACCESS_KEY_ID=\${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=\${AWS_SECRET_ACCESS_KEY}
      - STRIPE_API_KEY=\${STRIPE_API_KEY}
      - GOOGLE_API_KEY=\${GOOGLE_API_KEY}
      - DATABASE_URL=\${DATABASE_URL}
    ports:
      - "8080:8080"
    restart: always
`;
        }
        input = demoText;
        performScan(input);
        toastStore.success(`已成功加载测试示例: ${fileName}`);
    }

    function getActiveFindingsList() {
        if (activeTab === 'pending') return pendingFindings;
        if (activeTab === 'ignored') return ignoredFindings;
        if (activeTab === 'resolved') return resolvedFindings;
        return findings;
    }

    function getSeverityExplain(severity: string) {
        if (severity === 'critical') return "严重：直接授予全权管理或写入访问的云凭据或私钥，可导致核心资产直接泄漏。";
        if (severity === 'high') return "高：限制作用域或仅授予部分接口调用访问的凭证（如 Slack Webhook、Google API Key）。";
        if (severity === 'medium') return "中：可用于特定受限场景的会话 Token (如 JWT)、普通的硬编码配置文件字段等。";
        return "低：沙箱或测试环境凭证，但仍不建议硬编码硬性提交。";
    }

    // Derived states for findings counters
    let pendingFindings = $derived(findings.filter(f => f.status === 'active'));
    let ignoredFindings = $derived(findings.filter(f => f.status === 'ignored'));
    let resolvedFindings = $derived(findings.filter(f => f.status === 'resolved'));

    // Derived state: regex validation helper
    let customRuleTestMatch = $derived(
        (() => {
            if (!customRuleRegex || !customRuleTestStr) return false;
            try {
                const rx = new RegExp(customRuleRegex, "g");
                return rx.test(customRuleTestStr);
            } catch {
                return false;
            }
        })()
    );

    // Derived state: Security score calculation HUD
    let securityScore = $derived(
        (() => {
            let score = 100;
            pendingFindings.forEach(f => {
                if (f.severity === 'critical') score -= 30;
                else if (f.severity === 'high') score -= 15;
                else if (f.severity === 'medium') score -= 5;
                else if (f.severity === 'low') score -= 2;
            });
            return Math.max(0, score);
        })()
    );

    let securityGrade = $derived(
        (() => {
            const score = securityScore;
            if (score >= 95) return { grade: "A+", label: "安全合规", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
            if (score >= 80) return { grade: "B", label: "轻度风险", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" };
            if (score >= 60) return { grade: "C", label: "中度风险", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
            return { grade: "D", label: "严重暴露", color: "text-red-500 bg-red-500/10 border-red-500/20" };
        })()
    );

    // Derived filtered findings list
    let filteredFindingsList = $derived(
        (() => {
            let list = getActiveFindingsList();
            
            // Search filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                list = list.filter(f => 
                    f.name.toLowerCase().includes(query) ||
                    f.value.toLowerCase().includes(query) ||
                    f.context.lineText.toLowerCase().includes(query) ||
                    f.remediation.toLowerCase().includes(query)
                );
            }

            // Severity filter
            if (filterSeverity !== "all") {
                list = list.filter(f => f.severity === filterSeverity);
            }

            return list;
        })()
    );
</script>

<svelte:head>
    <title>敏感信息扫描器 - Aone Toolkit</title>
</svelte:head>

<ToolWorkspace class="max-w-none w-full !px-2 !py-1">
    {#snippet header()}
        <div class="flex items-center justify-between w-full select-none text-xs">
            <div class="flex items-center gap-2">
                <div
                    class="w-6 h-6 rounded {findings.length > 0
                        ? 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-900/50'
                        : 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900/50'} flex items-center justify-center border"
                >
                    {#if pendingFindings.length > 0}
                        <ShieldAlert size={14} />
                    {:else}
                        <ShieldCheck size={14} />
                    {/if}
                </div>
                <span class="font-bold text-slate-900 dark:text-white">敏感信息本地扫描</span>
                {#if findings.length > 0}
                    <span class="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold {pendingFindings.length > 0 ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'}">
                        {pendingFindings.length} 处待治理 / {findings.length} 处发现
                    </span>
                {/if}
            </div>

            <div class="flex items-center gap-1.5 flex-wrap">
                {#if findings.length > 0}
                    <button
                        type="button"
                        class="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1"
                        onclick={() => redactAllSecrets("mask")}
                        title="将所有检测到的敏感凭据替换为脱敏星号"
                    >
                        <ShieldCheck size={12} /> 一键脱敏
                    </button>
                {/if}

                <HandoffDropdown
                    sourceTool="敏感信息扫描器"
                    dataType="text"
                    getData={() => input}
                />

                <button
                    type="button"
                    class="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 transition"
                    onclick={handleClear}
                    title="清空内容"
                >
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    {/snippet}

    {#snippet sidebar()}
        <div class="flex-1 flex flex-col overflow-hidden border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955/20">
            <!-- HUD Panel: Always visible at the top of the sidebar -->
            <div class="p-3 bg-slate-900 text-white rounded-sm space-y-2.5 border border-slate-800 shadow-inner select-none shrink-0 m-3 mb-1">
                <div class="flex items-center justify-between">
                    <span class="text-[9px] font-bold text-slate-455 uppercase tracking-widest">系统安全等级 (HUD)</span>
                    <span class="scale-90 text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase border {securityGrade.color}">
                        {securityGrade.grade} • {securityGrade.label}
                    </span>
                </div>
                
                <div class="flex items-end justify-between">
                    <div class="flex items-baseline gap-0.5">
                        <span class="text-2xl font-bold tracking-tight font-mono">{securityScore}</span>
                        <span class="text-[9px] text-slate-500 font-bold">/ 100 分</span>
                    </div>
                    <div class="text-[9px] text-slate-400 font-medium">
                        {#if securityScore === 100}
                            🏆 安全状态极佳
                        {:else if securityScore >= 80}
                            ⚠️ 存在轻度泄露隐患
                        {:else}
                            🚨 立即处理高危风险
                        {/if}
                    </div>
                </div>
                
                <div class="w-full h-1 bg-slate-850 rounded-full overflow-hidden flex">
                    <div 
                        class="h-full transition-all duration-300 rounded-full 
                            {securityScore >= 95 ? 'bg-emerald-500' : 
                             securityScore >= 80 ? 'bg-blue-500' : 
                             securityScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}"
                        style="width: {securityScore}%"
                    ></div>
                </div>
            </div>

            <!-- Sidebar tabs -->
            <div class="flex border-b border-slate-200 dark:border-slate-800 text-xs shrink-0 select-none bg-slate-100/50 dark:bg-slate-900/50 p-1 gap-1 m-3 mt-1 mb-2 rounded-sm">
                <button 
                    class="flex-1 py-1 text-center font-bold transition-all rounded-sm text-[10px] {activeSidebarTab === 'rules' ? 'bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200/50 dark:border-slate-800/40' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'}" 
                    onclick={() => activeSidebarTab = 'rules'}
                >
                    规则设置
                </button>
                <button 
                    class="flex-1 py-1 text-center font-bold transition-all rounded-sm text-[10px] {activeSidebarTab === 'history' ? 'bg-white dark:bg-slate-955 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200/50 dark:border-slate-800/40' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'}" 
                    onclick={() => activeSidebarTab = 'history'}
                >
                    扫描历史
                </button>
                <button 
                    class="flex-1 py-1 text-center font-bold transition-all rounded-sm text-[10px] {activeSidebarTab === 'whitelist' ? 'bg-white dark:bg-slate-955 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200/50 dark:border-slate-800/40' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'}" 
                    onclick={() => activeSidebarTab = 'whitelist'}
                >
                    白名单
                </button>
                <button 
                    class="flex-1 py-1 text-center font-bold transition-all rounded-sm text-[10px] {activeSidebarTab === 'guides' ? 'bg-white dark:bg-slate-955 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200/50 dark:border-slate-800/40' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'}" 
                    onclick={() => activeSidebarTab = 'guides'}
                >
                    合规集成
                </button>
            </div>

            <!-- Tab contents -->
            <div class="flex-1 flex flex-col p-3 overflow-y-auto select-none space-y-4 min-h-0">
                {#if activeSidebarTab === 'rules'}
                    <div class="space-y-4 flex-1 flex flex-col min-h-0">
                        <!-- Quick test templates -->
                        <div class="space-y-2 shrink-0">
                            <h3 class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                加载测试示例
                            </h3>
                            <div class="flex flex-col gap-1.5">
                                <button
                                    class="text-left text-xs p-2 rounded-sm border border-slate-200 dark:border-slate-850 bg-white dark:bg-[#0A0A0A] hover:bg-red-500/5 dark:hover:bg-red-500/10 hover:border-red-500/30 transition-all flex items-center justify-between group"
                                    onclick={() => loadDemo("aws-github")}
                                >
                                    <span class="text-slate-700 dark:text-slate-300 font-medium">AWS & GitHub 泄露示例</span>
                                    <span class="text-[10px] bg-red-100 dark:bg-red-950/50 text-red-660 dark:text-red-400 px-1 py-0.5 rounded-sm scale-90 opacity-70 group-hover:opacity-100 transition-opacity">3 处风险</span>
                                </button>
                                <button
                                    class="text-left text-xs p-2 rounded-sm border border-slate-200 dark:border-slate-850 bg-white dark:bg-[#0A0A0A] hover:bg-red-500/5 dark:hover:bg-red-500/10 hover:border-red-500/30 transition-all flex items-center justify-between group"
                                    onclick={() => loadDemo("stripe-google")}
                                >
                                    <span class="text-slate-700 dark:text-slate-300 font-medium">Stripe & GCP & 数据库泄露</span>
                                    <span class="text-[10px] bg-red-100 dark:bg-red-950/50 text-red-665 dark:text-red-400 px-1 py-0.5 rounded-sm scale-90 opacity-70 group-hover:opacity-100 transition-opacity">3 处风险</span>
                                </button>
                                <button
                                    class="text-left text-xs p-2 rounded-sm border border-slate-200 dark:border-slate-855 bg-white dark:bg-[#0A0A0A] hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all flex items-center justify-between group"
                                    onclick={() => loadDemo("safe")}
                                >
                                    <span class="text-slate-700 dark:text-slate-300 font-medium">安全环境变量配置示例</span>
                                    <span class="text-[10px] bg-emerald-100 dark:bg-emerald-950/50 text-emerald-650 dark:text-emerald-400 px-1 py-0.5 rounded-sm scale-90 opacity-70 group-hover:opacity-100 transition-opacity">安全无泄露</span>
                                </button>
                            </div>
                        </div>

                        <!-- Rule switches -->
                        <div class="flex-1 flex flex-col min-h-0 space-y-2">
                            <div class="flex items-center justify-between shrink-0">
                                <h3 class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                    内置检测规则管理
                                </h3>
                                <span class="text-[9px] text-slate-400 font-mono">({PATTERNS.length + customRules.length}条)</span>
                            </div>
                            <div class="flex-1 overflow-y-auto space-y-1.5 pr-1 border border-slate-200/60 dark:border-slate-800/60 p-1.5 bg-slate-100/50 dark:bg-slate-900/30 rounded-sm">
                                {#each [...PATTERNS, ...customRules] as rule}
                                    <div class="text-[11px] p-2 border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-[#0E0E11] rounded-sm flex items-start justify-between gap-2">
                                        <div class="flex items-start gap-2 min-w-0">
                                            <input 
                                                type="checkbox"
                                                checked={ruleSwitches[rule.id] !== false}
                                                onchange={(e) => { ruleSwitches[rule.id] = (e.target as HTMLInputElement).checked; saveRuleSwitches(); performScan(input); }}
                                                class="mt-0.5 rounded-sm border-slate-300 text-red-655 focus:ring-red-500/20 w-3.5 h-3.5 cursor-pointer"
                                            />
                                            <div class="flex flex-col min-w-0">
                                                <span class="font-bold text-slate-750 dark:text-slate-300 truncate" title={rule.name}>{rule.name}</span>
                                                <span class="text-[10px] text-slate-550 dark:text-slate-500 leading-normal line-clamp-2 mt-0.5" title={rule.description}>
                                                    {rule.description}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div class="flex flex-col items-end gap-1.5 shrink-0 select-none">
                                            <span class="scale-75 text-[9px] px-1 py-0.25 font-bold uppercase rounded-sm shrink-0
                                                {rule.severity === 'critical' ? 'bg-red-500 text-white' : 
                                                 rule.severity === 'high' ? 'bg-orange-500 text-white' : 
                                                 rule.severity === 'medium' ? 'bg-blue-500 text-white' : 'bg-slate-400 text-white'}"
                                            >
                                                {rule.severity === 'critical' ? '严重' : rule.severity === 'high' ? '高' : rule.severity === 'medium' ? '中' : '低'}
                                            </span>
                                            
                                            {#if rule.id.startsWith('custom-')}
                                                <button 
                                                    class="text-[9px] text-red-550 hover:underline cursor-pointer"
                                                    onclick={() => deleteCustomRule(rule.id)}
                                                >
                                                    删除
                                                </button>
                                            {/if}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>

                        <!-- Add Custom Rule Form -->
                        <div class="p-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E0E11] rounded-sm space-y-3 shrink-0">
                            <div class="text-[10px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                <span>添加自定义 RegExp 规则</span>
                            </div>
                            
                            <div class="space-y-1.5">
                                <input 
                                    type="text" 
                                    placeholder="规则名称，如：Internal Token" 
                                    bind:value={customRuleName}
                                    class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] px-2 py-1 outline-none rounded-sm focus:border-blue-500 text-slate-705 dark:text-slate-300"
                                />
                            </div>
                            
                            <div class="space-y-1.5">
                                <input 
                                    type="text" 
                                    placeholder="正则表达式，如：mytoken_[a-z0-9]{8}" 
                                    bind:value={customRuleRegex}
                                    class="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-[11px] px-2 py-1 outline-none rounded-sm focus:border-blue-500 text-slate-705 dark:text-slate-300 font-mono"
                                />
                            </div>

                            <!-- Regex validation tester box -->
                            <div class="p-2 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-sm space-y-1.5">
                                <div class="text-[9px] font-bold text-slate-400 uppercase">匹配表达式校验器</div>
                                <input 
                                    type="text" 
                                    placeholder="输入测试文本以校验正则命中..." 
                                    bind:value={customRuleTestStr}
                                    class="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-[10px] px-1.5 py-0.5 outline-none rounded-sm focus:border-blue-550 text-slate-707 dark:text-slate-300 font-mono"
                                />
                                <div class="text-[9px] flex items-center justify-between font-mono">
                                    <span class="text-slate-455">校验结果:</span>
                                    {#if !customRuleRegex}
                                        <span class="text-slate-400">等待正则表达式输入</span>
                                    {:else if customRuleTestMatch}
                                        <span class="text-emerald-650 dark:text-emerald-400 font-bold">✅ 成功匹配命中！</span>
                                    {:else}
                                        <span class="text-red-500 dark:text-red-450">❌ 未命中 / 表达式不匹配</span>
                                    {/if}
                                </div>
                            </div>

                            <div class="flex gap-2">
                                <select 
                                    bind:value={customRuleSeverity}
                                    class="flex-1 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-[11px] px-2 py-1 outline-none rounded-sm text-slate-705 dark:text-slate-300"
                                >
                                    <option value="critical">风险级别: 严重</option>
                                    <option value="high">风险级别: 高危</option>
                                    <option value="medium">风险级别: 中危</option>
                                    <option value="low">风险级别: 低危</option>
                                </select>
                                
                                <Button 
                                    variant="primary" 
                                    size="sm" 
                                    class="h-7 text-[11px] font-bold bg-blue-650 hover:bg-blue-700 text-white rounded-sm shrink-0 px-3"
                                    onclick={addCustomRule}
                                >
                                    添加规则
                                </Button>
                            </div>
                        </div>

                        <!-- Rule sharing configurations -->
                        <div class="grid grid-cols-2 gap-2 border-t border-slate-200/60 dark:border-slate-800/60 pt-3 shrink-0 select-none">
                            <input 
                                type="file" 
                                id="config-uploader" 
                                class="hidden" 
                                onchange={handleImportConfig} 
                                accept=".json" 
                            />
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                class="h-7 text-[10px] rounded-sm border border-slate-250 dark:border-slate-850 hover:bg-slate-100 flex items-center justify-center font-bold"
                                onclick={() => document.getElementById('config-uploader')?.click()}
                            >
                                导入规则配置
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                class="h-7 text-[10px] rounded-sm border border-slate-250 dark:border-slate-850 hover:bg-slate-100 flex items-center justify-center font-bold"
                                onclick={exportConfig}
                            >
                                导出规则配置
                            </Button>
                        </div>
                    </div>
                {:else if activeSidebarTab === 'history'}
                    <!-- Scan history log list -->
                    <div class="space-y-3 flex-1 flex flex-col min-h-0">
                        <div class="flex justify-between items-center shrink-0">
                            <h3 class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                历史审计记录 (最近5条)
                            </h3>
                            {#if scanHistory.length > 0}
                                <button onclick={deleteHistoryRecord} class="text-[10px] text-red-500 hover:underline">
                                    清空
                                </button>
                            {/if}
                        </div>
                        
                        <div class="flex-1 overflow-y-auto space-y-2">
                            {#if scanHistory.length > 0}
                                {#each scanHistory as record}
                                    <button 
                                        class="w-full text-left p-3 border border-slate-200 dark:border-slate-850 bg-white dark:bg-[#0C0C0E] hover:bg-blue-500/5 dark:hover:bg-blue-500/10 hover:border-blue-500/30 transition-all rounded-sm flex flex-col gap-1.5"
                                        onclick={() => loadHistory(record)}
                                    >
                                        <div class="flex justify-between items-center w-full">
                                            <span class="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                                                📄 {record.fileName || "剪贴板代码"}
                                            </span>
                                            <span class="text-[9px] text-slate-400 font-mono">
                                                {new Date(record.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        
                                        <div class="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                            <span>漏洞数: <strong class="text-red-550">{record.totalCount}</strong></span>
                                            <span>已处理: <strong class="text-emerald-650">{record.resolvedCount}</strong></span>
                                        </div>
                                    </button>
                                {/each}
                            {:else}
                                <div class="text-center py-8 text-xs text-slate-450 dark:text-slate-500 space-y-1.5">
                                    <p>📭 暂无本地扫描历史审计记录</p>
                                    <p class="text-[10px]">每次成功的扫描修改将自动归档审计。</p>
                                </div>
                            {/if}
                        </div>
                    </div>
                {:else if activeSidebarTab === 'whitelist'}
                    <!-- Global whitelist hashes display -->
                    <div class="space-y-3 flex-1 flex flex-col min-h-0">
                        <div class="flex justify-between items-center shrink-0">
                            <h3 class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                全局豁免白名单 (散列值)
                            </h3>
                            {#if globalWhitelist.length > 0}
                                <button onclick={clearWhitelist} class="text-[10px] text-red-500 hover:underline">
                                    清空
                                </button>
                            {/if}
                        </div>
                        
                        <div class="flex-1 overflow-y-auto space-y-1.5">
                            {#if globalWhitelist.length > 0}
                                {#each globalWhitelist as hash}
                                    <div class="p-2 border border-slate-200/60 dark:border-slate-850 bg-white dark:bg-[#0E0E11] rounded-sm flex justify-between items-center text-[11px] font-mono">
                                        <span class="text-slate-650 dark:text-slate-400">
                                            🔑 hash:{hash}
                                        </span>
                                        <button 
                                            class="text-[10px] text-red-555 hover:underline"
                                            onclick={() => removeFromWhitelist(hash)}
                                        >
                                            移除
                                        </button>
                                    </div>
                                {/each}
                            {:else}
                                <div class="p-4 border border-dashed border-slate-200 dark:border-slate-800 text-center py-6 text-xs text-slate-450 dark:text-slate-500 leading-relaxed rounded-sm">
                                    💡 暂无白名单豁免规则。<br/>
                                    您可在扫描发现卡片中，将特定的测试占位或无害匹配项一键“加入白名单”进行屏蔽。
                                </div>
                            {/if}
                        </div>
                    </div>
                {:else if activeSidebarTab === 'guides'}
                    <!-- CI integration guides -->
                    <div class="space-y-4 flex-1 flex flex-col overflow-y-auto min-h-0">
                        <div class="space-y-2">
                            <h3 class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                <Terminal size={12} /> Git pre-commit 钩子配置
                            </h3>
                            <p class="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                通过在项目根目录创建 <code>.pre-commit-config.yaml</code>，在本地 commit 前自动进行凭据扫描：
                            </p>
                            <CodeBlock
                                code={`- repo: https://github.com/gitleaks/gitleaks
  rev: v8.18.0
  hooks:
    - id: gitleaks`}
                                language="yaml"
                                filename=".pre-commit-config.yaml"
                                class="!my-1"
                            />
                        </div>

                        <div class="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                            <h3 class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                <Terminal size={12} /> GitHub Actions 工作流
                            </h3>
                            <p class="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                创建 <code>.github/workflows/gitleaks.yml</code> 提交代码时自动触发扫描：
                            </p>
                            <CodeBlock
                                code={`name: Gitleaks Scan
on: [push, pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}`}
                                language="yaml"
                                filename=".github/workflows/gitleaks.yml"
                                class="!my-1"
                            />
                        </div>
                    </div>
                {/if}
            </div>

            <!-- compliance promise -->
            <div class="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/30 text-[10px] text-slate-400/80 leading-normal">
                🔒 <strong>隐私承诺</strong>：扫描均在本地沙箱进行，无网络请求数据更安全。
            </div>
        </div>
    {/snippet}

    <!-- Content Workspace -->
    <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-full w-full p-4 overflow-hidden bg-slate-50/10 dark:bg-slate-900/10 animate-in fade-in duration-200">
        <!-- Left Panel: Input -->
        <div 
            class="flex flex-col h-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A0A0A] overflow-hidden relative rounded-sm"
            class:border-blue-500={isDragging}
            ondragover={handleDragOver}
            ondragleave={handleDragLeave}
            ondrop={handleDrop}
            role="region"
            aria-label="代码拖拽与扫描区域"
        >
            {#if isDragging}
                <div class="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/20 backdrop-blur-sm z-30 flex flex-col items-center justify-center pointer-events-none border-2 border-dashed border-blue-500 select-none">
                    <div class="w-16 h-16 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center mb-3 animate-bounce">
                        <Download size={32} />
                    </div>
                    <p class="text-sm font-bold text-blue-600">释放文件以导入内容</p>
                    <p class="text-xs text-slate-500 mt-1">支持文本、JSON、YML、.env 等开发文件</p>
                </div>
            {/if}

            <div class="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between shrink-0 select-none">
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    粘贴代码或配置文件
                    {#if fileName}
                        <span class="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded-sm border border-blue-100/60 dark:border-blue-900/40">
                           📄 {fileName}
                        </span>
                    {/if}
                </span>

                <!-- Git Diff Scan Toggle -->
                <div class="flex items-center gap-3">
                    <label class="inline-flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 select-none">
                        <input 
                            type="checkbox" 
                            bind:checked={isGitDiffMode} 
                            onchange={() => performScan(input)}
                            class="rounded-sm border-slate-350 dark:border-slate-850 text-red-650 focus:ring-red-500/20 w-3 h-3 cursor-pointer"
                        />
                        <span class="font-bold flex items-center gap-1">
                            {#if isGitDiffMode}
                                🌿 Git Diff 模式 (仅扫新增行)
                            {:else}
                                📝 标准文本模式 (全量扫描)
                            {/if}
                        </span>
                    </label>

                    <input 
                        type="file" 
                        id="file-uploader" 
                        class="hidden" 
                        onchange={handleFileSelect} 
                        accept=".txt,.json,.yml,.yaml,.xml,.properties,.env,.js,.ts,.py,.java,.go,.rb,.sh,.sql,.cfg,.ini" 
                    />
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        class="h-6 text-[10px] px-2 rounded-sm border border-slate-250 dark:border-slate-800 font-bold"
                        onclick={() => document.getElementById('file-uploader')?.click()}
                    >
                        导入文件
                    </Button>
                </div>
            </div>

            <!-- CodeMirror Editor -->
            <div class="flex-1 min-h-0 min-w-0 relative">
                <CodeEditor
                    bind:value={input}
                    onChange={debouncedScan}
                    language="text"
                    {errorLine}
                    placeholder="在此粘贴代码、日志或配置文件内容，或直接拖拽敏感文件到此。
扫描器将实时在浏览器本地分析并显示风险评估..."
                />
            </div>

            <!-- Manual trigger toolbar with performance metrics -->
            <div class="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center shrink-0 select-none">
                <div class="text-[10px] text-slate-450 dark:text-slate-500 font-mono flex items-center gap-2">
                    {#if input}
                        <span>字数: {input.length} | 行数: {input.split('\n').length}</span>
                        <span class="text-slate-300 dark:text-slate-700">|</span>
                        <span>本地匹配用时: <strong class="text-slate-650 dark:text-slate-350">{scanDuration} ms</strong></span>
                        {#if scanDuration > 0}
                            <span class="text-slate-300 dark:text-slate-700">|</span>
                            <span>吞吐量: {Math.round(input.length / (scanDuration || 1))} 字符/ms</span>
                        {/if}
                    {:else}
                        等待输入代码...
                    {/if}
                </div>
                <div class="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        class="h-7 text-xs rounded-sm border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350"
                        onclick={handleClear}
                    >
                        清空
                    </Button>
                    <Button 
                        variant="primary" 
                        size="sm" 
                        class="h-7 text-xs rounded-sm bg-red-650 hover:bg-red-700 active:bg-red-800 text-white font-bold flex items-center gap-1 shadow-sm"
                        loading={isScanning}
                        onclick={() => performScan(input)}
                    >
                        <RefreshCw size={12} class={isScanning ? "animate-spin" : ""} />
                        重新扫描
                    </Button>
                </div>
            </div>
        </div>

        <!-- Right Panel: Results & Remediation Workflows -->
        <div class="flex flex-col h-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A0A0A] overflow-hidden rounded-sm">
            <!-- Header bar with search and filtering controls -->
            <div class="px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col gap-2 shrink-0 select-none">
                <div class="flex items-center justify-between w-full">
                    <div class="flex items-center gap-1.5">
                        <span class="text-xs font-bold text-slate-700 dark:text-slate-300">
                            扫描漏洞发现
                        </span>
                        {#if isScanning}
                            <span class="flex h-2 w-2 relative">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        {/if}
                    </div>
                    
                    <div class="flex items-center gap-2">
                        {#if findings.length > 0}
                            <div class="flex gap-1 border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-955 rounded-sm">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onclick={() => exportFindings("json")}
                                    class="h-5 text-[9px] px-1.5 py-0.5 rounded-sm hover:bg-white dark:hover:bg-slate-900"
                                >
                                    导出 JSON
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onclick={() => exportFindings("markdown")}
                                    class="h-5 text-[9px] px-1.5 py-0.5 rounded-sm hover:bg-white dark:hover:bg-slate-900"
                                >
                                    导出 Markdown
                                </Button>
                            </div>
                        {/if}
                        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-red-500/10 text-red-650 dark:text-red-450 border border-red-200/50 dark:border-red-950">
                            {pendingFindings.length} 项风险
                        </span>
                    </div>
                </div>

                <!-- Search and filtering inputs -->
                <div class="flex gap-2 w-full">
                    <div class="relative flex-1">
                        <Search size={12} class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text"
                            bind:value={searchQuery}
                            placeholder="输入过滤密钥、类型、说明关键字..."
                            class="w-full bg-white dark:bg-slate-955 border border-slate-250 dark:border-slate-800 text-[10px] pl-7 pr-2.5 py-1.5 outline-none rounded-sm focus:border-blue-500 text-slate-700 dark:text-slate-300 font-medium"
                        />
                    </div>
                    
                    <select 
                        bind:value={filterSeverity}
                        class="bg-white dark:bg-slate-955 border border-slate-250 dark:border-slate-800 text-[10px] px-2 py-1 outline-none rounded-sm text-slate-750 dark:text-slate-300 shrink-0 font-bold focus:border-blue-500"
                    >
                        <option value="all">风险级别: 全部</option>
                        <option value="critical">🔴 严重风险</option>
                        <option value="high">🟠 高危风险</option>
                        <option value="medium">🔵 中危风险</option>
                        <option value="low">⚪ 低危风险</option>
                    </select>
                </div>
            </div>

            <!-- Triage Tabs -->
            <div class="border-b border-slate-200/60 dark:border-slate-800/60 flex text-xs shrink-0 select-none bg-slate-50/20">
                <button 
                    class="px-4 py-2 border-b-2 font-bold transition-all {activeTab === 'pending' ? 'border-red-550 text-red-655 dark:text-red-450' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}"
                    onclick={() => activeTab = 'pending'}
                >
                    待处理 ({pendingFindings.length})
                </button>
                <button 
                    class="px-4 py-2 border-b-2 font-bold transition-all {activeTab === 'ignored' ? 'border-amber-500 text-amber-600 dark:text-amber-450' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}"
                    onclick={() => activeTab = 'ignored'}
                >
                    已忽略 ({ignoredFindings.length})
                </button>
                <button 
                    class="px-4 py-2 border-b-2 font-bold transition-all {activeTab === 'resolved' ? 'border-emerald-500 text-emerald-650 dark:text-emerald-450' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}"
                    onclick={() => activeTab = 'resolved'}
                >
                    已解决 ({resolvedFindings.length})
                </button>
                <button 
                    class="px-4 py-2 border-b-2 font-bold transition-all {activeTab === 'all' ? 'border-slate-500 text-slate-700 dark:text-slate-305' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}"
                    onclick={() => activeTab = 'all'}
                >
                    全部 ({findings.length})
                </button>
            </div>

            <!-- Findings Panel list -->
            <div class="flex-1 overflow-y-auto p-4 bg-slate-50/30 dark:bg-slate-955/10 min-h-0">
                {#if filteredFindingsList.length > 0}
                    <div class="space-y-4">
                        <!-- Remediation summary banner -->
                        {#if activeTab === 'pending' && resolvedFindings.length > 0}
                            <div class="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-sm flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 select-none">
                                <span class="flex items-center gap-1.5">
                                    <Check size={14} class="stroke-2" />
                                    已成功治理本页面中 {resolvedFindings.length} 处敏感凭证泄露隐患！
                                </span>
                            </div>
                        {/if}

                        {#each filteredFindingsList as finding (finding.id)}
                            <div
                                class="p-4 bg-white dark:bg-[#0C0C0E] border border-slate-200 dark:border-slate-850 border-l-4 transition-all duration-200 rounded-sm relative group
                                {finding.id === activeFindingId ? 'ring-1 ring-blue-500/50 border-l-blue-500 dark:bg-[#0e0e13]' : ''}
                                {finding.severity === 'critical' ? 'border-l-red-650' : 
                                 finding.severity === 'high' ? 'border-l-orange-500' : 
                                 finding.severity === 'medium' ? 'border-l-blue-500' : 'border-l-slate-400'}"
                            >
                                <!-- Finding Card Header -->
                                <div class="flex justify-between items-start mb-3 gap-2 flex-wrap sm:flex-nowrap select-none">
                                    <div class="flex items-center gap-1.5 flex-wrap">
                                        <h3 class="text-xs font-bold text-slate-800 dark:text-slate-200">
                                            {finding.name}
                                        </h3>
                                        
                                        <span class="scale-90 text-[9px] px-1.5 py-0.25 font-bold uppercase rounded-sm border
                                            {finding.severity === 'critical' ? 'bg-red-500/10 text-red-650 border-red-200/50 dark:border-red-950' : 
                                             finding.severity === 'high' ? 'bg-orange-500/10 text-orange-600 border-orange-200/50 dark:border-orange-950' : 
                                             finding.severity === 'medium' ? 'bg-blue-500/10 text-blue-600 border-blue-200/50 dark:border-blue-950' : 
                                             'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-750'}"
                                            title={getSeverityExplain(finding.severity)}
                                        >
                                            {finding.severity === 'critical' ? '严重' : finding.severity === 'high' ? '高' : finding.severity === 'medium' ? '中' : '低'}
                                        </span>
                                        
                                        <span class="scale-90 text-[9px] px-1.5 py-0.25 font-semibold rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                            置信度: {finding.confidence === 'high' ? '高' : finding.confidence === 'medium' ? '中' : '低'}
                                        </span>
                                        
                                        <span class="scale-90 text-[9px] px-1.5 py-0.25 font-mono bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-450">
                                            第 {finding.line} 行, 第 {finding.col} 列
                                        </span>
                                    </div>

                                    <!-- Action Buttons -->
                                    <div class="flex gap-1 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            class="h-5 text-[10px] px-1.5 py-0.5 rounded-sm border border-slate-200 dark:border-slate-855 bg-slate-50 dark:bg-slate-900 text-slate-655 hover:bg-slate-100 dark:text-slate-400 hover:text-slate-850"
                                            onclick={() => locateLine(finding.line, finding.id)}
                                            title="在代码编辑器中高亮该行"
                                        >
                                            定位
                                        </Button>
                                        
                                        {#if finding.status === 'active'}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                class="h-5 text-[10px] px-1.5 py-0.5 rounded-sm border border-slate-200 dark:border-slate-855 bg-slate-50 dark:bg-slate-900 text-blue-600 hover:bg-blue-500/5 hover:text-blue-700"
                                                onclick={() => addToWhitelist(finding)}
                                                title="豁免此值，不再扫描报警"
                                            >
                                                白名单
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                class="h-5 text-[10px] px-1.5 py-0.5 rounded-sm border border-slate-200 dark:border-slate-855 bg-slate-50 dark:bg-slate-900 text-amber-600 hover:bg-amber-500/5 hover:text-amber-700"
                                                onclick={() => triggerIgnore(finding)}
                                            >
                                                误报
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                class="h-5 text-[10px] px-1.5 py-0.5 rounded-sm border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 font-bold"
                                                onclick={() => resolveFinding(finding)}
                                            >
                                                已解决
                                            </Button>
                                        {:else}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                class="h-5 text-[10px] px-1.5 py-0.5 rounded-sm border border-slate-200 dark:border-slate-855 bg-slate-50 dark:bg-slate-900 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                                onclick={() => reinstateFinding(finding)}
                                            >
                                                撤销标记
                                            </Button>
                                        {/if}
                                    </div>
                                </div>

                                <!-- Ignored alert display -->
                                {#if finding.status === 'ignored'}
                                    <div class="mb-3 px-3 py-2 bg-amber-500/5 border border-amber-500/15 text-[11px] text-amber-700 dark:text-amber-400 flex flex-col gap-0.5 rounded-sm select-none">
                                        <span class="font-bold flex items-center gap-1">ℹ️ 已标记忽略/误报</span>
                                        <span>原因：{finding.ignoreReason || "开发占位符或匹配引擎误判"}</span>
                                    </div>
                                {/if}

                                <!-- Context preview box -->
                                <div class="text-xs font-mono border border-slate-200 dark:border-slate-800/80 rounded-sm overflow-hidden select-text">
                                    {#if finding.context.pre !== null}
                                        <div class="px-3 py-1 bg-slate-50/50 dark:bg-[#0D0D10] text-slate-400 dark:text-slate-600 line-clamp-1 border-b border-slate-150 dark:border-slate-900 select-none">
                                            <span class="inline-block w-8 text-right mr-2.5 font-normal text-slate-350 dark:text-slate-700">{finding.line - 1}</span>{finding.context.pre}
                                        </div>
                                    {/if}
                                    
                                    <div class="px-3 py-2 font-semibold break-all flex items-center justify-between gap-4
                                        {finding.status === 'ignored' ? 'bg-amber-500/5 border-l-4 border-l-amber-500/60 text-slate-550 dark:text-slate-500' : 
                                         finding.status === 'resolved' ? 'bg-emerald-500/5 border-l-4 border-l-emerald-500/60 line-through text-slate-400 dark:text-slate-500' :
                                         'bg-red-500/5 border-l-4 border-l-red-500 text-slate-800 dark:text-slate-200'}"
                                    >
                                        <div class="flex-1 min-w-0">
                                            <span class="inline-block w-8 text-right mr-2.5 font-normal text-slate-400 dark:text-slate-600 select-none">{finding.line}</span>
                                            {mask(finding.context.lineText, showSecretsForFinding[finding.id])}
                                        </div>
                                        
                                        <!-- Reveal / Copy security actions -->
                                        <div class="flex items-center gap-1.5 shrink-0 select-none">
                                            <button
                                                class="p-1 rounded-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                onclick={() => triggerReveal(finding)}
                                                title={showSecretsForFinding[finding.id] ? "折叠为遮蔽值" : "显示完整明文"}
                                            >
                                                {#if showSecretsForFinding[finding.id]}
                                                    <EyeOff size={13} />
                                                {:else}
                                                    <Eye size={13} />
                                                {/if}
                                            </button>
                                            <button
                                                class="p-1 rounded-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                onclick={() => handleCopyFinding(finding)}
                                                title={showSecretsForFinding[finding.id] ? "复制完整敏感原始值" : "仅复制已脱敏屏蔽值"}
                                            >
                                                <Copy size={13} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {#if finding.context.post !== null}
                                        <div class="px-3 py-1 bg-slate-50/50 dark:bg-[#0D0D10] text-slate-400 dark:text-slate-600 line-clamp-1 border-t border-slate-150 dark:border-slate-900 select-none">
                                            <span class="inline-block w-8 text-right mr-2.5 font-normal text-slate-350 dark:text-slate-700">{finding.line + 1}</span>{finding.context.post}
                                        </div>
                                    {/if}
                                </div>

                                <!-- Checklist (Active findings only) -->
                                {#if finding.status === 'active'}
                                    <div class="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                                        <div class="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wide select-none">
                                            <span>🛡️ 凭据泄露自助处置 Checklist</span>
                                            <span>{getChecklistCount(finding.id)} / 3 已完成</span>
                                        </div>
                                        <div class="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                                            <label class="flex items-start gap-2 cursor-pointer hover:text-slate-855 dark:hover:text-slate-200">
                                                <input 
                                                    type="checkbox" 
                                                    checked={getChecklistState(finding.id, 'step1')} 
                                                    onchange={(e) => toggleChecklistStep(finding.id, 'step1', (e.target as HTMLInputElement).checked)}
                                                    class="mt-0.5 rounded-sm border-slate-300 text-red-650 focus:ring-red-500/20 w-3.5 h-3.5 cursor-pointer"
                                                />
                                                <span>1. 从当前源文件代码中删除密钥明文，防止源码提交泄露</span>
                                            </label>
                                            <label class="flex items-start gap-2 cursor-pointer hover:text-slate-855 dark:hover:text-slate-200">
                                                <input 
                                                    type="checkbox" 
                                                    checked={getChecklistState(finding.id, 'step2')} 
                                                    onchange={(e) => toggleChecklistStep(finding.id, 'step2', (e.target as HTMLInputElement).checked)}
                                                    class="mt-0.5 rounded-sm border-slate-300 text-red-650 focus:ring-red-500/20 w-3.5 h-3.5 cursor-pointer"
                                                />
                                                <span>2. 在控制台中轮换并废弃旧凭证使其失效，并在本地改用系统环境变量</span>
                                            </label>
                                            <label class="flex items-start gap-2 cursor-pointer hover:text-slate-855 dark:hover:text-slate-200">
                                                <input 
                                                    type="checkbox" 
                                                    checked={getChecklistState(finding.id, 'step3')} 
                                                    onchange={(e) => toggleChecklistStep(finding.id, 'step3', (e.target as HTMLInputElement).checked)}
                                                    class="mt-0.5 rounded-sm border-slate-300 text-red-650 focus:ring-red-500/20 w-3.5 h-3.5 cursor-pointer"
                                                />
                                                <span>3. 检查 <code>.gitignore</code> 配置文件，防止敏感配置文件被 Git 跟踪</span>
                                            </label>
                                        </div>
                                        
                                        <div class="mt-3 p-2 bg-slate-50 dark:bg-slate-900/35 border border-slate-200/60 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 leading-normal flex gap-1 rounded-sm">
                                            <span>💡</span>
                                            <span>{finding.remediation}</span>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {:else}
                    {#if input}
                        <EmptyState
                            icon={ShieldCheck}
                            title="无匹配的发现项"
                            description="没有符合当前过滤规则或搜索内容的敏感泄露发现项。"
                            variant="success"
                        />
                    {:else}
                        <EmptyState
                            icon={Search}
                            title="等待输入代码"
                            description="在此粘贴代码或导入本地配置文件，开启敏感数据泄露扫描。"
                            variant="muted"
                        />
                    {/if}
                {/if}
            </div>
        </div>
    </div>
</ToolWorkspace>

<!-- Modal: Confirm Reveal Warning -->
{#if showConfirmReveal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm select-none">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div class="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-red-500/5 flex items-center gap-2 text-red-600 dark:text-red-405 font-bold">
                <AlertCircle size={18} />
                <h3 class="text-sm">敏感凭据暴露安全确认</h3>
            </div>
            <div class="p-5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed space-y-2.5">
                <p>⚠️ 您正在尝试在屏幕上展示完整的敏感数据/密钥明文。</p>
                <p>展开明文展示可能会在以下场景导致密码凭证泄露：</p>
                <ul class="list-disc list-inside space-y-1 text-slate-500 dark:text-slate-500">
                    <li>屏幕共享、投屏汇报或会议视频录制中</li>
                    <li>公共或共享办公空间中旁人窥屏</li>
                </ul>
                <p class="font-bold text-slate-700 dark:text-slate-300">请确保周围物理及网络环境安全无虞后再确认显示。</p>
            </div>
            <div class="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <Button variant="ghost" size="sm" class="rounded-sm text-xs border border-slate-250 dark:border-slate-800" onclick={() => { showConfirmReveal = false; findingToReveal = null; }}>
                    取消
                </Button>
                <Button variant="danger" size="sm" class="rounded-sm bg-red-605 hover:bg-red-700 text-white text-xs font-bold" onclick={confirmReveal}>
                    确认显示
                </Button>
            </div>
        </div>
    </div>
{/if}

<!-- Modal: Ignore Triage Dialog -->
{#if showIgnoreDialog}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm select-none">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div class="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 text-slate-755 dark:text-slate-300 font-bold">
                <HelpCircle size={18} class="text-amber-500" />
                <h3 class="text-sm">标记此漏洞为忽略/误报</h3>
            </div>
            <div class="p-5 space-y-4">
                <div class="space-y-1.5">
                    <label for="ignore-reason-select" class="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide">请选择忽略归因</label>
                    <select 
                        id="ignore-reason-select"
                        bind:value={selectedIgnoreReason}
                        class="w-full bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 text-xs px-3 py-2 outline-none rounded-sm focus:border-blue-500 text-slate-700 dark:text-slate-300"
                    >
                        <option value="测试用占位符或模拟字段">测试用占位符或模拟字段 (如 dummy-key)</option>
                        <option value="匹配规则正则表达式误判">匹配规则正则表达式误判 (正常开发内容误伤)</option>
                        <option value="此凭据已被废弃或在控制台注销">此凭据已被废弃或在控制台注销 (无实质资产危害)</option>
                        <option value="other">其他说明原因 (自定义归档)</option>
                    </select>
                </div>
                
                {#if selectedIgnoreReason === 'other'}
                    <div class="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                        <label for="custom-ignore-reason" class="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide">请输入自定义原因</label>
                        <textarea
                            id="custom-ignore-reason"
                            bind:value={customIgnoreReason}
                            placeholder="请简要阐明忽略的原因，以便后续追溯审计记录..."
                            class="w-full h-20 bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 text-xs p-2.5 outline-none rounded-sm focus:border-blue-500 text-slate-700 dark:text-slate-300"
                        ></textarea>
                    </div>
                {/if}
            </div>
            <div class="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <Button variant="ghost" size="sm" class="rounded-sm text-xs border border-slate-250 dark:border-slate-800" onclick={() => { showIgnoreDialog = false; findingToIgnore = null; }}>
                    取消
                </Button>
                <Button variant="primary" size="sm" class="rounded-sm bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold" onclick={confirmIgnore}>
                    确认忽略
                </Button>
            </div>
        </div>
    </div>
{/if}
