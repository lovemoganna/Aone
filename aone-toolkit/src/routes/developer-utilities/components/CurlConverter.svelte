<script lang="ts">
    import { onMount } from "svelte";
    import { Panel, Button, EmptyState, InlineAlert, CodeEditor, CodeBlock } from "$lib/components/ui";
    import ToolWorkspace from "$lib/components/layout/ToolWorkspace.svelte";
    import { 
        Terminal, 
        Copy, 
        Globe, 
        Code2, 
        ClipboardPaste, 
        Trash2, 
        Eye, 
        EyeOff, 
        Download, 
        Settings, 
        FileCode, 
        Upload, 
        Check, 
        RefreshCw,
        Lock,
        HelpCircle,
        ExternalLink,
        Layers,
        Database,
        FileJson,
        KeyRound,
        Cookie as CookieIcon
    } from "lucide-svelte";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import { dataBridge } from "$lib/stores/dataBridge";
    import HandoffDropdown from "$lib/components/ui/HandoffDropdown.svelte";
    import { parseCurl, generateCode, type ParsedRequest } from "../../curl-converter/parser";


    // App state
    let curlInput = $state("");
    let targetLang = $state<"fetch" | "axios" | "python" | "go" | "java" | "php" | "ruby" | "csharp">("fetch");
    let indent = $state(2);
    
    // UI toggle states
    let showPassword = $state(false);
    let isDragging = $state(false);
    let activeTab = $state<"url" | "headers" | "query" | "cookie" | "body" | "auth" | "form">("url");
    let bodyFormat = $state<'beautify' | 'minify'>('beautify');

    // History Item definition
    interface HistoryItem {
        id: string;
        timestamp: number;
        url: string;
        method: string;
        curl: string;
    }
    let historyList = $state<HistoryItem[]>([]);

    // Static placeholder text to prevent Svelte template brace parsing errors
    const placeholderText = `在此粘贴完整 cURL 命令。支持多行反斜杠 (\\) 转义 and Windows (^) 换行。\n示例：\ncurl -X POST https://api.example.com/v1/login -H 'Content-Type: application/json' -d '{"user": "admin"}'`;

    // Derived states (Svelte 5)
    let parsed = $derived(parseCurl(curlInput));
    let parseError = $derived(parsed.error);
    let errorSuggestions = $derived(parsed.errorSuggestions || []);
    let generatedCode = $derived(generateCode(parsed, targetLang, indent));
    let hasValidOutput = $derived(!!parsed.url && !parseError);

    // Sensitive Auth Credentials Detection
    let hasSensitiveCredentials = $derived.by(() => {
        if (parsed.auth && parsed.auth.type !== 'none') return true;
        if (parsed.cookies && parsed.cookies.length > 0) return true;
        return (parsed.headers || []).some((h: { key: string; value: string }) => {
            const k = h.key.toLowerCase();
            return k.includes('auth') || k.includes('token') || k.includes('key') || k.includes('secret') || k.includes('cookie');
        });
    });

    // Cookie & Header counts for badges
    let headerCount = $derived(parsed.headers?.length || 0);
    let queryCount = $derived(parsed.queryParams?.length || 0);
    let cookieCount = $derived(parsed.cookies?.length || 0);
    let formCount = $derived(parsed.formData?.length || 0);
    let hasAuth = $derived(parsed.auth && parsed.auth.type !== 'none');
    let hasBody = $derived(parsed.bodyType && parsed.bodyType !== 'none');

    // Example templates library
    const EXAMPLES = [
        {
            name: "GET 请求 (带 Query 参数)",
            code: `curl "https://api.example.com/v1/users?page=1&limit=10&status=active" \\\n  -H "Accept: application/json" \\\n  -H "User-Agent: Mozilla/5.0"`
        },
        {
            name: "POST 请求 (JSON Payload)",
            code: `curl -X POST "https://api.example.com/v1/users" \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer my_secret_token_123" \\\n  -d '{"name": "张三", "role": "developer", "active": true}'`
        },
        {
            name: "POST 表单上传 (Multipart)",
            code: `curl -X POST "https://api.example.com/v1/upload" \\\n  -H "Authorization: Basic YWRtaW46c2VjcmV0MTIz" \\\n  -F "avatar=@/users/avatar.png" \\\n  -F "description=My profile avatar"`
        },
        {
            name: "携带 Cookie 的请求",
            code: `curl "https://api.example.com/v1/profile" \\\n  -b "session_id=s9a8f7d9a8f7; logged_in=true; theme=dark" \\\n  -H "Referer: https://example.com"`
        }
    ];

    // Language mapping for editor syntax highlighting
    let editorLanguage = $derived.by(() => {
        if (targetLang === "fetch" || targetLang === "axios") return "javascript";
        if (targetLang === "java") return "java";
        if (targetLang === "csharp") return "typescript"; // fallback approximation
        return "text";
    });

    // File inputs
    let fileInputElement: HTMLInputElement | null = $state(null);

    function parseHarToCurl(raw: string): string | null {
        try {
            const har = JSON.parse(raw);
            const entries = har?.log?.entries;
            if (Array.isArray(entries) && entries.length > 0) {
                const req = entries[0].request;
                if (req && req.url) {
                    let cmd = `curl -X ${req.method || 'GET'} "${req.url}"`;
                    if (Array.isArray(req.headers)) {
                        req.headers.forEach((h: any) => {
                            if (!h.name.startsWith(':') && h.name.toLowerCase() !== 'content-length') {
                                cmd += ` \\\n  -H "${h.name}: ${h.value}"`;
                            }
                        });
                    }
                    if (req.postData && req.postData.text) {
                        cmd += ` \\\n  -d '${req.postData.text.replace(/'/g, "'\\''")}'`;
                    }
                    return cmd;
                }
            }
        } catch (_) {}
        return null;
    }

    // Lifecycle and preference persistence
    onMount(() => {
        try {
            const savedLang = localStorage.getItem("aone-curl-target-lang");
            if (savedLang) targetLang = savedLang as any;
            
            const savedIndent = localStorage.getItem("aone-curl-indent");
            if (savedIndent) indent = parseInt(savedIndent, 10);
            
            const stored = localStorage.getItem("aone-curl-history");
            if (stored) {
                historyList = JSON.parse(stored);
            }

            const handoff = dataBridge.consume("/curl-converter");
            if (handoff && handoff.payload) {
                const harCmd = parseHarToCurl(handoff.payload);
                curlInput = harCmd || handoff.payload;
                toastStore.success(`已从 ${handoff.sourceTool} 载入请求数据`);
            }
        } catch (_) {}
    });


    $effect(() => {
        try {
            localStorage.setItem("aone-curl-target-lang", targetLang);
        } catch (_) {}
    });

    $effect(() => {
        try {
            localStorage.setItem("aone-curl-indent", indent.toString());
        } catch (_) {}
    });

    // Auto-save history debouncer
    let historyTimer: any;
    $effect(() => {
        const input = curlInput;
        const url = parsed.url;
        const method = parsed.method;
        
        if (input.trim() && url && !parseError) {
            if (historyTimer) clearTimeout(historyTimer);
            historyTimer = setTimeout(() => {
                addHistoryItem(input, method, url);
            }, 2000);
        }
        return () => clearTimeout(historyTimer);
    });

    function addHistoryItem(curl: string, method: string, url: string) {
        if (!curl.trim() || !url) return;
        if (historyList.length > 0 && historyList[0].curl.trim() === curl.trim()) {
            return;
        }
        const newItem: HistoryItem = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: Date.now(),
            url,
            method,
            curl
        };
        historyList = [newItem, ...historyList.filter(h => h.curl.trim() !== curl.trim()).slice(0, 4)];
        try {
            localStorage.setItem("aone-curl-history", JSON.stringify(historyList));
        } catch (_) {}
    }

    function clearHistory() {
        historyList = [];
        try {
            localStorage.setItem("aone-curl-history", "[]");
        } catch (_) {}
        toastStore.success("转换历史记录已清空");
    }

    function restoreHistory(item: HistoryItem) {
        curlInput = item.curl;
        toastStore.success("已恢复历史 cURL 命令行");
    }

    // Export request spec as Markdown documentation
    async function copyAsMarkdownDoc() {
        if (!parsed.url) return;
        
        let md = `### 接口信息\n\n`;
        md += `* **请求方法**：\`${parsed.method}\`\n`;
        md += `* **接口 URL**：\`${parsed.url}\`\n\n`;
        
        if (parsed.headers.length > 0) {
            md += `#### Headers (请求头)\n\n`;
            md += `| 字段 (Key) | 示例值 (Value) |\n`;
            md += `| --- | --- |\n`;
            parsed.headers.forEach((h: { key: string; value: string }) => {
                md += `| ${h.key} | \`${h.value}\` |\n`;
            });
            md += `\n`;
        }
        
        if (parsed.queryParams.length > 0) {
            md += `#### Query Parameters (查询参数)\n\n`;
            md += `| 参数 (Key) | 示例值 (Value) |\n`;
            md += `| --- | --- |\n`;
            parsed.queryParams.forEach((q: { key: string; value: string }) => {
                md += `| ${q.key} | \`${q.value}\` |\n`;
            });
            md += `\n`;
        }
        
        if (parsed.cookies.length > 0) {
            md += `#### Cookies\n\n`;
            md += `| Cookie 键 | 示例值 (Value) |\n`;
            md += `| --- | --- |\n`;
            parsed.cookies.forEach((c: { key: string; value: string }) => {
                md += `| ${c.key} | \`${c.value}\` |\n`;
            });
            md += `\n`;
        }
        
        if (parsed.bodyType !== 'none') {
            md += `#### 请求体 (${parsed.bodyType})\n\n`;
            if (parsed.bodyType === 'json') {
                try {
                    const prettyBody = JSON.stringify(JSON.parse(parsed.body), null, 2);
                    md += `\`\`\`json\n${prettyBody}\n\`\`\`\n`;
                } catch {
                    md += `\`\`\`text\n${parsed.body}\n\`\`\`\n`;
                }
            } else {
                md += `\`\`\`text\n${parsed.body}\n\`\`\`\n`;
            }
            md += `\n`;
        }
        
        try {
            await navigator.clipboard.writeText(md);
            toastStore.success("已成功生成并复制 Markdown 接口文档！");
        } catch {
            toastStore.error("复制失败");
        }
    }

    // Operations
    async function pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                curlInput = text;
                toastStore.success("已从剪贴板粘贴 cURL 命令");
            }
        } catch {
            toastStore.error("剪贴板读取失败，请使用 Ctrl+V 手动粘贴");
        }
    }

    function triggerFileInput() {
        fileInputElement?.click();
    }

    async function handleFileImport(e: Event) {
        const target = e.target as HTMLInputElement;
        const file = target?.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const harCmd = parseHarToCurl(text);
            if (harCmd) {
                curlInput = harCmd;
                toastStore.success("成功从 HAR 集合提取请求并转换为 cURL 命令");
            } else {
                curlInput = text;
                toastStore.success("导入 cURL 文件成功");
            }
        } catch (err: any) {
            toastStore.error("文件读取失败: " + err.message);
        }
    }


    function loadExample(code: string) {
        curlInput = code;
        toastStore.success("已加载示例命令");
    }

    function clearAll() {
        curlInput = "";
        showPassword = false;
        activeTab = "url";
        if (fileInputElement) {
            fileInputElement.value = "";
        }
        toastStore.info("已清空输入内容");
    }

    function resetConfig() {
        targetLang = "fetch";
        indent = 2;
        toastStore.info("已重置语言与排版配置");
    }

    // Code copy and download utilities
    async function copyGeneratedCode() {
        if (!generatedCode) return;
        try {
            await navigator.clipboard.writeText(generatedCode);
            toastStore.success("转换后的代码已复制");
        } catch {
            toastStore.error("复制失败，请手动选取复制代码");
        }
    }

    async function copyAsMarkdown() {
        if (!generatedCode) return;
        let langLabel = targetLang === "fetch" || targetLang === "axios" ? "javascript" : targetLang;
        const markdown = `\`\`\`${langLabel}\n${generatedCode}\n\`\`\`\n`;
        try {
            await navigator.clipboard.writeText(markdown);
            toastStore.success("Markdown 代码块已复制");
        } catch {
            toastStore.error("复制失败");
        }
    }

    function downloadOutput() {
        if (!generatedCode) return;
        let ext = "txt";
        if (targetLang === "fetch" || targetLang === "axios") ext = "js";
        else if (targetLang === "python") ext = "py";
        else if (targetLang === "go") ext = "go";
        else if (targetLang === "java") ext = "java";
        else if (targetLang === "php") ext = "php";
        else if (targetLang === "ruby") ext = "rb";
        else if (targetLang === "csharp") ext = "cs";

        const blob = new Blob([generatedCode], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `api_request.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        toastStore.success(`代码文件已成功导出 (api_request.${ext})`);
    }

    // Drag and drop handlers
    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        isDragging = true;
    }

    function handleDragLeave() {
        isDragging = false;
    }

    async function handleDrop(e: DragEvent) {
        e.preventDefault();
        isDragging = false;
        
        const file = e.dataTransfer?.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const harCmd = parseHarToCurl(text);
            if (harCmd) {
                curlInput = harCmd;
                toastStore.success("拖入 HAR 集合已自动转换为 cURL 命令");
            } else {
                curlInput = text;
                toastStore.success("拖入文件解析成功");
            }
        } catch (err: any) {
            toastStore.error("文件读取失败: " + err.message);
        }
    }


    // Method Badge Color classes helper
    function getMethodBadgeClass(m: string) {
        const method = m.toUpperCase();
        if (method === 'GET') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50';
        if (method === 'POST') return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
        if (method === 'PUT' || method === 'PATCH') return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
        if (method === 'DELETE') return 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-900/50';
        return 'bg-slate-50 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800';
    }

    // Dynamic helper to format body output (if JSON)
    let formattedBody = $derived.by(() => {
        if (parsed.bodyType === 'json') {
            try {
                return JSON.stringify(JSON.parse(parsed.body), null, 2);
            } catch {
                return parsed.body;
            }
        }
        return parsed.body;
    });
</script>

<svelte:head>
    <title>cURL 命令行转换器 - Aone 工具箱</title>
</svelte:head>

<div class="h-full flex-1 flex flex-col bg-slate-100 dark:bg-slate-950 p-2 gap-2 overflow-hidden">
    <!-- Top Command Toolbar -->
    <div class="h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-xs">
        <div class="flex items-center gap-2">
            <!-- Target Language Pills -->
            <div class="flex p-0.5 bg-slate-200/70 dark:bg-slate-800 rounded-md">
                {#each [
                    { id: 'fetch', label: 'Fetch' },
                    { id: 'axios', label: 'Axios' },
                    { id: 'python', label: 'Python' },
                    { id: 'go', label: 'Go' },
                    { id: 'java', label: 'Java' },
                    { id: 'php', label: 'PHP' },
                    { id: 'csharp', label: 'C#' }
                ] as lang}
                    <button
                        class="px-2 py-0.5 text-xs font-semibold rounded-sm transition {targetLang === lang.id ? 'bg-white dark:bg-slate-900 shadow-2xs text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                        onclick={() => (targetLang = lang.id as any)}
                    >
                        {lang.label}
                    </button>
                {/each}
            </div>

            <!-- Indent option -->
            <div class="flex items-center gap-1 text-xs">
                <span class="text-slate-400 text-[11px]">缩进:</span>
                <select
                    id="indent-select"
                    bind:value={indent}
                    class="py-0.5 px-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"
                >
                    <option value={2}>2 空格</option>
                    <option value={4}>4 空格</option>
                </select>
            </div>
        </div>

        <div class="flex items-center gap-1.5">
            <div class="flex items-center gap-1 mr-2 border-r border-slate-200 dark:border-slate-800 pr-2">
                <span class="text-[10px] text-slate-400">示例:</span>
                {#each EXAMPLES as ex}
                    <button
                        type="button"
                        class="px-1.5 py-0.5 text-[10px] font-medium rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition"
                        onclick={() => loadExample(ex.code)}
                    >
                        {ex.name.split(" ")[0]}
                    </button>
                {/each}
            </div>

            <HandoffDropdown
                sourceTool="cURL 转换器"
                dataType="curl"
                getData={() => curlInput}
            />

            {#if curlInput}
                <button
                    type="button"
                    class="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 transition"
                    onclick={clearAll}
                    title="清空内容"
                >
                    <Trash2 size={13} />
                </button>
            {/if}
        </div>
    </div>

    <!-- Sensitive Credentials warning banner -->
    {#if hasSensitiveCredentials && curlInput.trim() !== ""}
        <div class="px-3 py-1.5 bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 rounded text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2 select-none shrink-0">
            <Lock size={12} class="shrink-0 text-amber-500" />
            <span>已自动遮蔽请求中的敏感凭据（如 Authorization / Cookie）。生成的集成代码仅供参考。</span>
        </div>
    {/if}

    <!-- Main Workspace Split Panel -->
    <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 min-h-0">
        
        <!-- Left Panel: Input & Parsed Structure Preview -->
        <div class="flex flex-col min-h-0 gap-4">
            
            <!-- cURL Input Panel -->
            <div 
                role="region"
                aria-label="cURL 命令行输入区"
                class="flex flex-col h-[280px] shrink-0 border rounded-lg overflow-hidden bg-white dark:bg-[#0A0A0A] shadow-sm relative transition-all duration-200 {isDragging ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-800'}"
                ondragover={handleDragOver}
                ondragleave={handleDragLeave}
                ondrop={handleDrop}
            >
                {#if isDragging}
                    <div class="absolute inset-0 bg-blue-500/5 dark:bg-blue-950/20 border-2 border-dashed border-blue-500 z-50 flex items-center justify-center pointer-events-none animate-in fade-in duration-150">
                        <div class="bg-white dark:bg-[#0E0E0E] px-4 py-3 rounded-lg shadow-lg border border-blue-200 dark:border-blue-950 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                            <Upload size={14} class="animate-bounce" />
                            <span>拖放文件到此处导入</span>
                        </div>
                    </div>
                {/if}

                <div class="px-4 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
                    <span class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                        输入 cURL 命令行
                    </span>
                    <div class="flex items-center gap-1.5">
                        <input
                            type="file"
                            accept=".sh,.curl,.txt"
                            bind:this={fileInputElement}
                            class="hidden"
                            onchange={handleFileImport}
                        />
                        <Button variant="ghost" size="sm" onclick={triggerFileInput} title="导入 cURL 脚本文件" class="h-6 px-2 text-xs">
                            <Upload size={13} class="mr-1" />导入
                        </Button>
                        <Button variant="ghost" size="sm" onclick={pasteFromClipboard} title="从剪贴板粘贴" class="h-6 px-2 text-xs">
                            <ClipboardPaste size={13} class="mr-1" />粘贴
                        </Button>
                    </div>
                </div>

                <textarea
                    bind:value={curlInput}
                    class="flex-1 p-3.5 textarea-editor font-mono text-xs leading-relaxed outline-none resize-none bg-transparent text-slate-800 dark:text-slate-100"
                    placeholder={placeholderText}
                ></textarea>
            </div>

            <!-- Left Panel: Preview Section -->
            <div class="flex-1 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-[#0A0A0A] shadow-sm min-h-0">
                <div class="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
                    <span class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Layers size={14} class="text-slate-400" />
                        结构化解析预览
                    </span>
                </div>

                {#if curlInput.trim() === ""}
                    <!-- Initial Empty State -->
                    <div class="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
                        <EmptyState
                            icon={Globe}
                            title="等待输入 cURL 命令"
                            description="粘贴命令后，系统将在本地快速解析出请求方法、URL、Header 字段及 Body 载荷"
                        />
                    </div>
                {:else if parseError}
                    <!-- Diagnostics & Error Recovery Info -->
                    <div class="flex-1 p-5 overflow-y-auto space-y-4">
                        <InlineAlert type="error" message={parseError} dismissable={false} />
                        
                        {#if errorSuggestions.length > 0}
                            <div class="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-150 dark:border-slate-850">
                                <span class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">💡 排查与修正建议:</span>
                                <ul class="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-2">
                                    {#each errorSuggestions as suggestion}
                                        <li>{suggestion}</li>
                                    {/each}
                                </ul>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <!-- Structured Parsed Tab Content -->
                    <div class="flex-1 flex flex-col min-h-0">
                        <!-- Horizontal Tab Headers -->
                        <div class="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 px-2 shrink-0 overflow-x-auto gap-1">
                            <button
                                class="px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap {activeTab === 'url' ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}"
                                onclick={() => activeTab = 'url'}
                            >
                                URL & 方法
                            </button>
                            <button
                                class="px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1 {activeTab === 'headers' ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}"
                                onclick={() => activeTab = 'headers'}
                            >
                                请求头
                                {#if headerCount > 0}
                                    <span class="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-200 dark:bg-slate-850 text-slate-600 dark:text-slate-300 font-bold">{headerCount}</span>
                                {/if}
                            </button>
                            <button
                                class="px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1 {activeTab === 'query' ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}"
                                onclick={() => activeTab = 'query'}
                            >
                                Query 参数
                                {#if queryCount > 0}
                                    <span class="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-200 dark:bg-slate-850 text-slate-600 dark:text-slate-300 font-bold">{queryCount}</span>
                                {/if}
                            </button>
                            <button
                                class="px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1 {activeTab === 'cookie' ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}"
                                onclick={() => activeTab = 'cookie'}
                            >
                                Cookie
                                {#if cookieCount > 0}
                                    <span class="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-200 dark:bg-slate-850 text-slate-600 dark:text-slate-300 font-bold">{cookieCount}</span>
                                {/if}
                            </button>
                            <button
                                class="px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1 {activeTab === 'body' ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}"
                                onclick={() => activeTab = 'body'}
                            >
                                请求体 (Body)
                                {#if hasBody}
                                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                {/if}
                            </button>
                            <button
                                class="px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1 {activeTab === 'auth' ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}"
                                onclick={() => activeTab = 'auth'}
                            >
                                认证与安全
                                {#if hasAuth}
                                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                {/if}
                            </button>
                            <button
                                class="px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1 {activeTab === 'form' ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}"
                                onclick={() => activeTab = 'form'}
                            >
                                文件表单
                                {#if formCount > 0}
                                    <span class="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-200 dark:bg-slate-850 text-slate-600 dark:text-slate-300 font-bold">{formCount}</span>
                                {/if}
                            </button>
                        </div>

                        <!-- Tab contents (Scrollable) -->
                        <div class="flex-1 p-4 overflow-y-auto min-h-0 bg-slate-50/30 dark:bg-slate-900/5">
                            
                            <!-- Tab: URL & Method -->
                            {#if activeTab === 'url'}
                                <div class="space-y-4">
                                    <div class="flex items-center gap-3">
                                        <span class="text-xs font-bold text-slate-400 dark:text-slate-500 shrink-0 w-16">请求方法:</span>
                                        <span class="px-2.5 py-0.5 text-xs font-bold rounded border uppercase {getMethodBadgeClass(parsed.method)}">
                                            {parsed.method}
                                        </span>
                                    </div>
                                    <div class="flex flex-col gap-1.5">
                                        <span class="text-xs font-bold text-slate-400 dark:text-slate-500">目标 URL:</span>
                                        <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-800 font-mono text-xs break-all flex justify-between items-start gap-4">
                                            <span>{parsed.url}</span>
                                            <button 
                                                class="text-slate-450 hover:text-blue-500 shrink-0 p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-850"
                                                onclick={() => {
                                                    navigator.clipboard.writeText(parsed.url);
                                                    toastStore.success("URL 已复制");
                                                }}
                                                title="复制完整 URL"
                                            >
                                                <Copy size={13} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            <!-- Tab: Headers -->
                            {:else if activeTab === 'headers'}
                                {#if headerCount === 0}
                                    <div class="py-8 text-center text-xs text-slate-400 dark:text-slate-500">暂无自定义 Header 请求头</div>
                                {:else}
                                    <div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                                        <table class="min-w-full text-xs font-mono text-left divide-y divide-slate-200 dark:divide-slate-800">
                                            <thead class="bg-slate-50/50 dark:bg-slate-900/30 text-slate-500 font-bold">
                                                <tr>
                                                    <th class="px-4 py-2 w-1/3">字段 (Key)</th>
                                                    <th class="px-4 py-2">内容值 (Value)</th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-[#0A0A0A]">
                                                {#each parsed.headers as header}
                                                    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                                                        <td class="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-300 select-all">{header.key}</td>
                                                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 break-all select-all">{header.value}</td>
                                                    </tr>
                                                {/each}
                                            </tbody>
                                        </table>
                                    </div>
                                {/if}

                            <!-- Tab: Query Params -->
                            {:else if activeTab === 'query'}
                                {#if queryCount === 0}
                                    <div class="py-8 text-center text-xs text-slate-400 dark:text-slate-500">URL 中未解析到 Query 查询参数</div>
                                {:else}
                                    <div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                                        <table class="min-w-full text-xs font-mono text-left divide-y divide-slate-200 dark:divide-slate-800">
                                            <thead class="bg-slate-50/50 dark:bg-slate-900/30 text-slate-500 font-bold">
                                                <tr>
                                                    <th class="px-4 py-2 w-1/3">参数 (Key)</th>
                                                    <th class="px-4 py-2">数值 (Value)</th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-[#0A0A0A]">
                                                {#each parsed.queryParams as param}
                                                    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                                                        <td class="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-300 select-all">{param.key}</td>
                                                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 break-all select-all">{param.value}</td>
                                                    </tr>
                                                {/each}
                                            </tbody>
                                        </table>
                                    </div>
                                {/if}

                            <!-- Tab: Cookies -->
                            {:else if activeTab === 'cookie'}
                                {#if cookieCount === 0}
                                    <div class="py-8 text-center text-xs text-slate-400 dark:text-slate-500">未包含 Cookies 请求凭证</div>
                                {:else}
                                    <div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                                        <table class="min-w-full text-xs font-mono text-left divide-y divide-slate-200 dark:divide-slate-800">
                                            <thead class="bg-slate-50/50 dark:bg-slate-900/30 text-slate-500 font-bold">
                                                <tr>
                                                    <th class="px-4 py-2 w-1/3">Cookie 键</th>
                                                    <th class="px-4 py-2">Cookie 值</th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-[#0A0A0A]">
                                                {#each parsed.cookies as cookie}
                                                    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                                                        <td class="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-300 select-all">{cookie.key}</td>
                                                        <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 break-all select-all">{cookie.value}</td>
                                                    </tr>
                                                {/each}
                                            </tbody>
                                        </table>
                                    </div>
                                {/if}

                            <!-- Tab: Request Body -->
                            {:else if activeTab === 'body'}
                                {#if !hasBody}
                                    <div class="py-8 text-center text-xs text-slate-400 dark:text-slate-500">未携带 Request Body 数据内容</div>
                                {:else}
                                    <div class="space-y-3">
                                        <div class="flex items-center justify-between">
                                            <div class="flex items-center gap-2">
                                                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                    Payload 格式: <span class="font-bold text-blue-600 dark:text-blue-400 uppercase font-mono">{parsed.bodyType}</span>
                                                </span>
                                                {#if parsed.bodyType === 'json'}
                                                    <div class="flex p-0.5 bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-[10px] select-none">
                                                        <button 
                                                            class="px-1.5 py-0.5 font-semibold rounded {bodyFormat === 'beautify' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'}"
                                                            onclick={() => bodyFormat = 'beautify'}
                                                        >
                                                            美化
                                                        </button>
                                                        <button 
                                                            class="px-1.5 py-0.5 font-semibold rounded {bodyFormat === 'minify' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'}"
                                                            onclick={() => bodyFormat = 'minify'}
                                                        >
                                                            压缩
                                                        </button>
                                                    </div>
                                                {/if}
                                            </div>
                                            <Button variant="ghost" size="sm" class="h-6 text-xs px-2" onclick={() => {
                                                navigator.clipboard.writeText(formattedBody);
                                                toastStore.success("请求体内容已复制");
                                            }}>
                                                <Copy size={12} class="mr-1" />复制 Body
                                            </Button>
                                        </div>

                                        {#if parsed.bodyType === 'json'}
                                            <CodeBlock
                                                code={formattedBody}
                                                language="json"
                                                showHeader={false}
                                                class="!my-0"
                                            />
                                        {:else if parsed.bodyType === 'url-encoded'}
                                            <!-- Structured Url-Encoded Table -->
                                            <div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                                                <table class="min-w-full text-xs font-mono text-left divide-y divide-slate-200 dark:divide-slate-800">
                                                    <thead class="bg-slate-50/50 dark:bg-slate-900/30 text-slate-500 font-bold">
                                                        <tr>
                                                            <th class="px-4 py-2 w-1/3">参数 (Key)</th>
                                                            <th class="px-4 py-2">参数值 (Value)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody class="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-[#0A0A0A]">
                                                        {#each parsed.body.split('&') as p}
                                                            {@const eqIdx = p.indexOf('=')}
                                                            {@const k = eqIdx !== -1 ? decodeURIComponent(p.slice(0, eqIdx)) : p}
                                                            {@const v = eqIdx !== -1 ? decodeURIComponent(p.slice(eqIdx + 1)) : ''}
                                                            <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                                                                <td class="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-300">{k}</td>
                                                                <td class="px-4 py-2.5 text-slate-600 dark:text-slate-400 break-all">{v}</td>
                                                            </tr>
                                                        {/each}
                                                    </tbody>
                                                </table>
                                            </div>
                                        {:else}
                                            <CodeBlock
                                                code={parsed.body}
                                                language="plaintext"
                                                showHeader={false}
                                                wrapLines={true}
                                                class="!my-0"
                                            />
                                        {/if}
                                    </div>
                                {/if}

                            <!-- Tab: Authentication Info -->
                            {:else if activeTab === 'auth'}
                                {#if !hasAuth}
                                    <div class="py-8 text-center text-xs text-slate-400 dark:text-slate-500">此请求未解析到标准 Authorization 认证信息</div>
                                {:else}
                                    <div class="p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-800 rounded-lg space-y-4">
                                        <div class="flex items-center justify-between">
                                            <div class="flex items-center gap-2">
                                                <KeyRound size={15} class="text-amber-500" />
                                                <span class="text-xs font-bold text-slate-750 dark:text-slate-300">身份验证模式:</span>
                                            </div>
                                            <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30">
                                                {parsed.auth.type === 'basic' ? 'Basic Auth (基本密码)' : 'Bearer Token (令牌)'}
                                            </span>
                                        </div>

                                        {#if parsed.auth.type === 'basic'}
                                            <div class="space-y-2.5 text-xs">
                                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <span class="text-slate-400 block mb-1 font-bold text-[10px] uppercase">用户名 (Username)</span>
                                                        <div class="p-2 bg-white dark:bg-[#0E0E0E] rounded border border-slate-200 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300 break-all select-all">
                                                            {parsed.auth.username || '(无)'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div class="flex items-center justify-between mb-1">
                                                            <span class="text-slate-400 font-bold text-[10px] uppercase">密码 (Password)</span>
                                                            <button 
                                                                class="text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1 select-none"
                                                                onclick={() => showPassword = !showPassword}
                                                            >
                                                                {#if showPassword}
                                                                    <EyeOff size={11} /> 隐藏
                                                                {:else}
                                                                    <Eye size={11} /> 显示
                                                                {/if}
                                                            </button>
                                                        </div>
                                                        <div class="p-2 bg-white dark:bg-[#0E0E0E] rounded border border-slate-200 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300 break-all select-all">
                                                            {#if showPassword}
                                                                {parsed.auth.password || '(无)'}
                                                            {:else}
                                                                ••••••••
                                                            {/if}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        {:else if parsed.auth.type === 'bearer'}
                                            <div class="text-xs space-y-1">
                                                <div class="flex items-center justify-between">
                                                    <span class="text-slate-400 font-bold text-[10px] uppercase">Bearer 访问令牌 (Token)</span>
                                                    <button 
                                                        class="text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1 select-none"
                                                        onclick={() => showPassword = !showPassword}
                                                    >
                                                        {#if showPassword}
                                                            <EyeOff size={11} /> 隐藏
                                                        {:else}
                                                            <Eye size={11} /> 显示
                                                        {/if}
                                                    </button>
                                                </div>
                                                <div class="p-2 bg-white dark:bg-[#0E0E0E] rounded border border-slate-200 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300 break-all select-all">
                                                    {#if showPassword}
                                                        {parsed.auth.token}
                                                    {:else}
                                                        eyJhbGciOiJIUzI1NiIsIn... (已隐藏部分令牌)
                                                    {/if}
                                                </div>
                                            </div>
                                        {/if}
                                    </div>
                                {/if}

                            <!-- Tab: Form Data -->
                            {:else if activeTab === 'form'}
                                {#if formCount === 0}
                                    <div class="py-8 text-center text-xs text-slate-400 dark:text-slate-500">无 multipart/form-data 表单参数</div>
                                {:else}
                                    <div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                                        <table class="min-w-full text-xs font-mono text-left divide-y divide-slate-200 dark:divide-slate-800">
                                            <thead class="bg-slate-50/50 dark:bg-slate-900/30 text-slate-500 font-bold">
                                                <tr>
                                                    <th class="px-4 py-2 w-1/3">字段 (Key)</th>
                                                    <th class="px-4 py-2">参数类型 / 内容值 (Value)</th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-[#0A0A0A]">
                                                {#each parsed.formData as fd}
                                                    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                                                        <td class="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-300 select-all">{fd.key}</td>
                                                        <td class="px-4 py-2.5 break-all select-all">
                                                            {#if fd.isFile}
                                                                <span class="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-[10px] text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 font-bold mr-1.5">
                                                                    📂 文件
                                                                </span>
                                                                <span class="text-slate-500 dark:text-slate-400 italic">{fd.fileName || 'file'}</span>
                                                            {:else}
                                                                <span class="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-650 dark:text-slate-305 border border-slate-200 dark:border-slate-750 font-bold mr-1.5">
                                                                    abc 文本
                                                                </span>
                                                                <span class="text-slate-600 dark:text-slate-300">{fd.value}</span>
                                                            {/if}
                                                        </td>
                                                    </tr>
                                                {/each}
                                            </tbody>
                                        </table>
                                    </div>
                                {/if}
                            {/if}

                        </div>
                    </div>
                {/if}

            </div>

        </div>

        <!-- Right Panel: Generated Code Output -->
        <div class="flex flex-col min-h-0 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-[#0A0A0A] shadow-sm">
            
            <!-- Code Config / Toolbar -->
            <div class="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap justify-between items-center gap-3 shrink-0">
                
                <!-- Target Language Select -->
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-slate-550 dark:text-slate-400">目标语言:</span>
                    <select
                        id="target-lang-select"
                        bind:value={targetLang}
                        class="input py-1 px-2.5 text-xs w-32 h-8 cursor-pointer border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none rounded bg-white dark:bg-[#0A0A0A] font-semibold text-slate-750 dark:text-slate-200"
                    >
                        <option value="fetch">Fetch (JS)</option>
                        <option value="axios">Axios (Node)</option>
                        <option value="python">Python requests</option>
                        <option value="go">Go http.Client</option>
                        <option value="java">Java HttpClient</option>
                        <option value="php">PHP cURL</option>
                        <option value="ruby">Ruby Net::HTTP</option>
                        <option value="csharp">C# HttpClient</option>
                    </select>
                </div>

                <!-- Indent option -->
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-slate-550 dark:text-slate-400">代码缩进:</span>
                    <select
                        id="indent-select"
                        bind:value={indent}
                        class="input py-1 px-2 text-xs w-20 h-8 cursor-pointer border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none rounded bg-white dark:bg-[#0A0A0A] font-semibold text-slate-750 dark:text-slate-200"
                    >
                        <option value={2}>2 空格</option>
                        <option value={4}>4 空格</option>
                    </select>
                </div>

            </div>

            <!-- Editor View -->
            <div class="flex-1 min-h-0 relative bg-slate-50/10 dark:bg-slate-900/10">
                {#if hasValidOutput}
                    <CodeEditor
                        value={generatedCode}
                        language={editorLanguage}
                        readOnly={true}
                        placeholder="// 正在为您渲染代码结果..."
                    />
                {:else}
                    <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none bg-white dark:bg-[#0A0A0A]">
                        <EmptyState
                            icon={Code2}
                            title="生成目标代码"
                            description="在左侧输入区粘贴有效的 cURL 命令后，此处将自动转换并高亮展示多语言对应的集成请求代码"
                        />
                    </div>
                {/if}
            </div>

            <!-- Output Action Controls -->
            {#if hasValidOutput}
                <div class="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center gap-3 shrink-0 flex-wrap">
                    <div class="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onclick={copyAsMarkdown} title="复制为带有语言标识的 Markdown 块">
                            复制 Markdown 块
                        </Button>
                        <Button variant="ghost" size="sm" onclick={copyAsMarkdownDoc} title="将 API 请求详情导出为结构化的 Markdown 接口文档">
                            复制 API 文档
                        </Button>
                    </div>
                    <div class="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onclick={downloadOutput} title="保存代码文件至本地">
                            <Download size={14} class="mr-1" />下载代码
                        </Button>
                        <Button variant="primary" size="sm" onclick={copyGeneratedCode} title="直接复制代码内容到剪贴板">
                            <Copy size={14} class="mr-1" />复制代码
                        </Button>
                    </div>
                </div>
            {/if}

        </div>

    </div>
</div>

<style>
    /* Add subtle scrollbar customization for previews and textareas */
    ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }
    ::-webkit-scrollbar-track {
        background: transparent;
    }
    ::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.3);
        border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: rgba(148, 163, 184, 0.5);
    }
</style>

