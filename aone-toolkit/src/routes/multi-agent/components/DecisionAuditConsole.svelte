<script lang="ts">
    import {
        agentStore,
        type ExecutableDoDTask,
        type DecisionTraceStage,
        type ExtractedAgentBehavior,
        type ExtractedToolInvocation,
        type ExtractedInterAgentComm,
        type ExtractedCandidatePath,
        type ExtractedVulnerability,
        type ExtractedEvidenceItem
    } from "$lib/stores/agentStore.svelte";
    import {
        Activity,
        AlertCircle,
        AlertOctagon,
        AlertTriangle,
        ArrowRight,
        BarChart3,
        BookOpen,
        Bot,
        Check,
        CheckCircle2,
        CheckSquare,
        ChevronDown,
        ChevronRight,
        ChevronUp,
        Clock,
        Code2,
        Columns,
        Copy,
        Cpu,
        Database,
        Download,
        ExternalLink,
        FileCheck,
        FileSpreadsheet,
        FileText,
        Filter,
        GitCommit,
        GitCompare,
        GitPullRequest,
        Layers,
        Maximize2,
        MessageSquare,
        Minimize2,
        Network,
        Play,
        RotateCcw,
        Scale,
        Search,
        Send,
        ShieldAlert,
        ShieldCheck,
        Sparkles,
        Square,
        Swords,
        Terminal,
        TrendingDown,
        TrendingUp,
        Wrench,
        X,
        Zap
    } from "lucide-svelte";
    import { fade, fly, slide } from "svelte/transition";
    import { auditEventBus } from "$lib/stores/auditEventBus.svelte";

    let viewMode = $state<'modal' | 'drawer'>('modal');
    
    // 3 Primary Workspaces: 'overview' | 'observability' | 'dod_plan'
    let rawTab = $derived(agentStore.decisionConsoleTab);
    let activeMainTab = $derived<'overview' | 'observability' | 'dod_plan'>(
        rawTab === 'dod_plan' ? 'dod_plan' :
        rawTab === 'observability' || rawTab === 'trace' || rawTab === 'behaviors' || rawTab === 'tools' || rawTab === 'comms' ? 'observability' :
        'overview'
    );

    // Observability sub-filter: 'all' | 'trace' | 'tools' | 'comms' | 'behaviors'
    let obsSubTab = $state<'all' | 'trace' | 'tools' | 'comms' | 'behaviors'>('all');
    let obsSearchQuery = $state("");
    let obsAgentFilter = $state<string>("all");
    let obsStatusFilter = $state<'all' | 'success' | 'failed' | 'slow'>('all');

    let decisionTrace = $derived(agentStore.dynamicDecisionTrace);
    let agentBehaviors = $derived(agentStore.dynamicAgentBehaviors);
    let toolInvocations = $derived(agentStore.dynamicToolInvocations);
    let interAgentComms = $derived(agentStore.dynamicInterAgentComms);
    let candidatePaths = $derived(agentStore.dynamicCandidatePaths);
    let vulnerabilities = $derived(agentStore.dynamicVulnerabilities);
    let evidenceItems = $derived(agentStore.dynamicEvidenceItems);
    let dodTasks = $derived(agentStore.dynamicDoDTasks);
    let telemetry = $derived(agentStore.sessionTelemetryStats);

    let copyToast = $state(false);
    let toastMessage = $state("已复制到剪贴板！");
    let dodTimeframeFilter = $state<'all' | '72h' | '7d' | '30d'>('all');
    let dodStatusFilter = $state<'all' | 'pending' | 'completed'>('all');
    let expandedPayloadIds = $state<Record<string, boolean>>({});

    // Filtered DoD tasks
    let filteredDoDTasks = $derived.by(() => {
        let list = dodTasks;
        if (dodTimeframeFilter !== 'all') {
            list = list.filter(t => t.timeframe === dodTimeframeFilter);
        }
        if (dodStatusFilter === 'pending') {
            list = list.filter(t => !t.completed);
        } else if (dodStatusFilter === 'completed') {
            list = list.filter(t => t.completed);
        }
        return list;
    });

    let dodCompletedCount = $derived(dodTasks.filter(t => t.completed).length);
    let dodCompletionRate = $derived(dodTasks.length > 0 ? Math.round((dodCompletedCount / dodTasks.length) * 100) : 0);

    // Filtered Tool Invocations
    let filteredToolInvocations = $derived.by(() => {
        let list = toolInvocations;
        if (obsAgentFilter !== 'all') {
            list = list.filter(t => t.callerAgentId === obsAgentFilter || t.callerAgentName.includes(obsAgentFilter));
        }
        if (obsStatusFilter === 'success') {
            list = list.filter(t => t.status === 'success');
        } else if (obsStatusFilter === 'failed') {
            list = list.filter(t => t.status === 'failed');
        } else if (obsStatusFilter === 'slow') {
            list = list.filter(t => (t.durationMs || 0) >= 1000);
        }
        if (obsSearchQuery.trim()) {
            const q = obsSearchQuery.toLowerCase();
            list = list.filter(t =>
                t.toolName.toLowerCase().includes(q) ||
                t.callerAgentName.toLowerCase().includes(q) ||
                t.inputSummary.toLowerCase().includes(q) ||
                t.outputSummary.toLowerCase().includes(q)
            );
        }
        return list;
    });

    // Filtered Inter-Agent Communications
    let filteredInterAgentComms = $derived.by(() => {
        let list = interAgentComms;
        if (obsAgentFilter !== 'all') {
            list = list.filter(c => c.sourceAgentId === obsAgentFilter || c.targetAgentId === obsAgentFilter || c.sourceAgentName.includes(obsAgentFilter) || c.targetAgentName.includes(obsAgentFilter));
        }
        if (obsSearchQuery.trim()) {
            const q = obsSearchQuery.toLowerCase();
            list = list.filter(c =>
                c.sourceAgentName.toLowerCase().includes(q) ||
                c.targetAgentName.toLowerCase().includes(q) ||
                c.summary.toLowerCase().includes(q)
            );
        }
        return list;
    });

    // Filtered Decision Trace
    let filteredDecisionTrace = $derived.by(() => {
        let list = decisionTrace;
        if (obsAgentFilter !== 'all') {
            list = list.filter(t => t.agentId === obsAgentFilter || t.agentName.includes(obsAgentFilter));
        }
        if (obsSearchQuery.trim()) {
            const q = obsSearchQuery.toLowerCase();
            list = list.filter(t =>
                t.title.toLowerCase().includes(q) ||
                t.coreInsight.toLowerCase().includes(q) ||
                t.evidenceQuote.toLowerCase().includes(q) ||
                t.tradeoffSummary.toLowerCase().includes(q)
            );
        }
        return list;
    });

    // All available agent options for filter dropdown
    let availableAgents = $derived.by(() => {
        const set = new Map<string, string>();
        for (const b of agentBehaviors) set.set(b.agentId, b.agentName);
        for (const t of decisionTrace) if (t.agentId) set.set(t.agentId, t.agentName);
        for (const tool of toolInvocations) if (tool.callerAgentId) set.set(tool.callerAgentId, tool.callerAgentName);
        return Array.from(set.entries()).map(([id, name]) => ({ id, name }));
    });

    function showToast(msg: string) {
        toastMessage = msg;
        copyToast = true;
        setTimeout(() => (copyToast = false), 2500);
    }

    function togglePayloadExpand(id: string) {
        expandedPayloadIds[id] = !expandedPayloadIds[id];
    }

    function handleJumpToMessage(targetIdOrAgentId: string) {
        if (viewMode === 'modal') {
            viewMode = 'drawer';
        }
        const found = agentStore.scrollToMessage(targetIdOrAgentId);
        if (found) {
            showToast("已定位至会话流对应发言");
        } else {
            showToast("已尝试定位关联发言节点");
        }
    }

    function handleExecuteTask(task: ExecutableDoDTask) {
        agentStore.executeSingleDoDTask(task);
        if (viewMode === 'modal') {
            viewMode = 'drawer';
        }
        showToast("已将工单目标载入会话，可直接派发攻坚！");
    }

    function formatPayload(content: string): string {
        if (!content) return "";
        try {
            const parsed = JSON.parse(content);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return content;
        }
    }

    async function copyPayloadText(content: string) {
        try {
            await navigator.clipboard.writeText(content);
            showToast("已复制原始载荷！");
        } catch {}
    }

    async function handleExportMarkdown() {
        const lines: string[] = [
            `# 多 Agent 协同决策全景审计报告与可观察性台账`,
            `*导出时间：${new Date().toLocaleString()}*\n`,
            `## 一、 架构决策记录 (ADR 概览)`,
            `- 采纳方案：${candidatePaths.find(p => p.isChosen)?.name || '综合裁决路径'}`,
            `- 决策置信度：${telemetry.averageConfidenceScore}%`,
            `- 消耗 Tokens：${telemetry.totalEstimatedTokens} (预估费用 $${telemetry.estimatedCostUsd} USD)\n`,
            `## 二、 方案候选矩阵与仲裁结论`,
            ...candidatePaths.map(p => `- **${p.name}** [${p.isChosen ? '✅ 终审采纳' : '❌ 备选'}]\n  - 提出专家：${p.proposerAgentId}\n  - 核心逻辑：${p.coreIdea}\n  - 预期收益：${p.projectedRoi}\n  - 实施代价：${p.estimatedCost}`),
            `\n## 三、 致命假设证伪与风险防御`,
            ...vulnerabilities.map(v => `- **${v.topic}** (审查：${v.discoveredByAgentId})\n  - 假设前提：${v.fatalHypothesis}\n  - 极端灾难：${v.worstCaseScenario}\n  - 应对预案：${v.mitigationStrategy}`),
            `\n## 四、 决策因果演进时间线 (Decision Trace)`,
            ...decisionTrace.map(t => `### 第 ${t.stageIndex} 阶段：${t.title}\n- 推进专家：${t.agentName}\n- 核心洞察：${t.coreInsight}\n- 论据：${t.evidenceQuote}\n- 权衡：${t.tradeoffSummary}\n`),
            `\n## 五、 72h-7d 落地执行工单清单 (DoD)`,
            ...dodTasks.map(t => `- [${t.completed ? 'x' : ' '}] [${t.timeframe}] **${t.action}**\n  - 责任主体：${t.owner}\n  - 验收标准 (DoD)：${t.definitionOfDone}\n  - 熔断策略：${t.fallbackCircuitBreaker}`)
        ];

        const text = lines.join('\n');
        try {
            await navigator.clipboard.writeText(text);
            showToast("完整审计公文已复制！");
        } catch { /* fallback */ }
    }

    async function handleExportADR() {
        const chosenPath = candidatePaths.find(p => p.isChosen)?.name || '终审采纳架构方案';
        const lines: string[] = [
            `# 架构决策记录 (Architecture Decision Record - ADR)`,
            `\n## 状态\n**已采纳 (Accepted)** - ${new Date().toLocaleDateString()}`,
            `\n## 上下文 (Context)\n${agentStore.currentSession.messages.find(m => m.role === 'user')?.content || '复杂技术与架构选型议题'}`,
            `\n## 决策结论 (Decision)\n采纳方案：**${chosenPath}**`,
            `\n### 决策论据与因果链：`,
            ...decisionTrace.map(t => `- **${t.title}** (${t.agentName}): ${t.coreInsight}`),
            `\n## 风险防御与熔断预案 (Consequences & Risk Mitigation)`,
            ...vulnerabilities.map(v => `- **${v.topic}**: ${v.mitigationStrategy}`),
            `\n## 72h-7d 落地验收清单 (DoD)`,
            ...dodTasks.map(t => `- [${t.completed ? 'x' : ' '}] [${t.timeframe}] **${t.action}** (Owner: ${t.owner})`),
            `\n## 效能与置信度`,
            `- 综合置信度：${telemetry.averageConfidenceScore}%`,
            `- 消耗 Tokens：${telemetry.totalEstimatedTokens}`
        ];
        const text = lines.join('\n');
        try {
            await navigator.clipboard.writeText(text);
            showToast("ADR 架构决策公文已复制！");
        } catch { /* fallback */ }
    }

    async function handleExportDoDChecklist() {
        const lines: string[] = [
            `## 📋 72h-7d DoD 落地交付执行清单`,
            `*生成时间：${new Date().toLocaleString()}*`,
            `\n### 交付进度：${dodCompletedCount}/${dodTasks.length} 项已达成 (${dodCompletionRate}%)\n`,
            ...dodTasks.map(t => `- [${t.completed ? 'x' : ' '}] **[${t.timeframe}] ${t.action}**\n  - 责任主体：${t.owner}\n  - 验收及格线 (DoD)：${t.definitionOfDone}\n  - 熔断兜底：${t.fallbackCircuitBreaker}`)
        ];
        const text = lines.join('\n');
        try {
            await navigator.clipboard.writeText(text);
            showToast("DoD 工单 Checklist 已复制！");
        } catch { /* fallback */ }
    }

    function handleExportJson() {
        const data = {
            exportedAt: new Date().toISOString(),
            sessionId: agentStore.currentSession.id,
            telemetry,
            decisionTrace,
            candidatePaths,
            vulnerabilities,
            evidenceItems,
            dodTasks,
            interAgentComms,
            toolInvocations,
            agentBehaviors,
            auditEvents: auditEventBus.events
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `multi-agent-audit-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function handleSyncDoDToChat() {
        agentStore.syncDoDToConversation();
        showToast("已将 DoD 工单下发至主对话流！");
    }
</script>

{#snippet consoleContent()}
    <!-- Header: Title, Telemetry Summary & Primary Actions -->
    <div class="flex flex-col border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <!-- Top Title Bar -->
        <div class="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800/80">
            <div class="flex items-center gap-3 min-w-0">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0">
                    <Scale class="h-4 w-4 text-slate-700 dark:text-slate-300" />
                </div>
                <div class="min-w-0">
                    <div class="flex items-center gap-2">
                        <h2 id="decision-console-title" class="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                            决策审计与工单控制台
                        </h2>
                        <span class="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                            结构化流水
                        </span>
                    </div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        ADR 决策矩阵 · 因果溯源链 · 72h-7d 落地工单
                    </p>
                </div>
            </div>

            <!-- Header Action Buttons -->
            <div class="flex items-center gap-1.5 shrink-0">
                <button
                    type="button"
                    onclick={handleExportADR}
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-medium text-slate-700 dark:text-slate-200 transition cursor-pointer"
                    title="导出为标准 ADR 架构决策记录"
                >
                    <BookOpen class="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    <span class="hidden sm:inline">复制</span> ADR
                </button>

                <button
                    type="button"
                    onclick={handleExportMarkdown}
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-medium text-slate-700 dark:text-slate-200 transition cursor-pointer"
                    title="复制全量 Markdown 审计报告"
                >
                    <Copy class="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    <span>{copyToast ? toastMessage : "复制报告"}</span>
                </button>

                <button
                    type="button"
                    onclick={handleExportJson}
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-medium text-slate-700 dark:text-slate-200 transition cursor-pointer"
                    title="下载 JSON 全量快照"
                >
                    <Download class="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    <span class="hidden sm:inline">JSON</span>
                </button>

                <div class="h-4 w-px bg-slate-200 dark:border-slate-800 mx-0.5"></div>

                <button
                    type="button"
                    onclick={() => (viewMode = viewMode === 'modal' ? 'drawer' : 'modal')}
                    class="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title={viewMode === 'modal' ? "切换为右侧分屏抽屉 (支持边看对话边审计)" : "切换为居中全屏弹窗"}
                >
                    {#if viewMode === 'modal'}
                        <Columns class="h-4 w-4" />
                    {:else}
                        <Maximize2 class="h-4 w-4" />
                    {/if}
                </button>

                <button
                    type="button"
                    onclick={() => (agentStore.decisionConsoleOpen = false)}
                    class="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    aria-label="关闭控制台"
                >
                    <X class="h-4.5 w-4.5" />
                </button>
            </div>
        </div>

        <!-- Sticky Telemetry Summary Strip & 3 Core Workspaces Nav -->
        <div class="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-2.5 bg-slate-50/80 dark:bg-slate-900/60">
            <!-- 3 Consolidated Workspace Tabs -->
            <div class="flex items-center gap-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 p-0.5 text-xs font-medium">
                <button
                    type="button"
                    onclick={() => (agentStore.decisionConsoleTab = 'overview')}
                    class="flex items-center gap-1.5 rounded-md px-3 py-1.5 transition cursor-pointer {activeMainTab === 'overview'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                >
                    <Scale class="h-3.5 w-3.5" />
                    <span>决策矩阵与 ADR</span>
                    {#if candidatePaths.length > 0}
                        <span class="rounded px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                            {candidatePaths.length}
                        </span>
                    {/if}
                </button>

                <button
                    type="button"
                    onclick={() => (agentStore.decisionConsoleTab = 'observability')}
                    class="flex items-center gap-1.5 rounded-md px-3 py-1.5 transition cursor-pointer {activeMainTab === 'observability'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                >
                    <Activity class="h-3.5 w-3.5" />
                    <span>因果演进与流水</span>
                    <span class="rounded px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                        {decisionTrace.length + toolInvocations.length}
                    </span>
                </button>

                <button
                    type="button"
                    onclick={() => (agentStore.decisionConsoleTab = 'dod_plan')}
                    class="flex items-center gap-1.5 rounded-md px-3 py-1.5 transition cursor-pointer {activeMainTab === 'dod_plan'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                >
                    <FileCheck class="h-3.5 w-3.5" />
                    <span>DoD 落地工单</span>
                    {#if dodTasks.length > 0}
                        <span class="rounded px-1.5 py-0.2 {dodCompletedCount === dodTasks.length ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'} text-[10px] font-mono">
                            {dodCompletedCount}/{dodTasks.length}
                        </span>
                    {/if}
                </button>
            </div>

            <!-- Compact Telemetry Metrics Pills -->
            <div class="flex items-center gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400 overflow-x-auto">
                <div class="flex items-center gap-1 px-2 py-0.8 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
                    <span class="text-slate-400">Token:</span>
                    <span class="font-bold text-slate-800 dark:text-slate-200">{telemetry.totalEstimatedTokens}</span>
                </div>
                <div class="flex items-center gap-1 px-2 py-0.8 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
                    <span class="text-slate-400">推演:</span>
                    <span class="font-bold text-slate-800 dark:text-slate-200">{telemetry.roundsCompleted} 轮</span>
                </div>
                <div class="flex items-center gap-1 px-2 py-0.8 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
                    <span class="text-slate-400">置信度:</span>
                    <span class="font-bold text-emerald-600 dark:text-emerald-400">{telemetry.averageConfidenceScore}%</span>
                </div>
                <div class="flex items-center gap-1 px-2 py-0.8 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
                    <span class="text-slate-400">预估费用:</span>
                    <span class="font-bold text-amber-600 dark:text-amber-400">${telemetry.estimatedCostUsd}</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Workspace Content Area (Scrollable with min-h-0) -->
    <div class="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-6">

        <!-- ====================================================================== -->
        <!-- WORKSPACE 1: 决策总览与方案对比 (Decision Matrix & ADR Overview) -->
        <!-- ====================================================================== -->
        {#if activeMainTab === 'overview'}
            <div class="space-y-6" in:fade={{ duration: 100 }}>
                <!-- Section 1.1: 终审决断卡片 (Arbitration Verdict) -->
                {#if candidatePaths.some(p => p.isChosen) || decisionTrace.length > 0}
                    {@const chosen = candidatePaths.find(p => p.isChosen)}
                    <div class="rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-3 shadow-xs">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <div class="flex items-center gap-2">
                                <span class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                                    <Check class="h-3 w-3" />
                                </span>
                                <span class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                    终审采纳方案路径 (Accepted ADR)
                                </span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                    置信度 {telemetry.averageConfidenceScore}%
                                </span>
                                {#if chosen?.proposerAgentId}
                                    <button
                                        type="button"
                                        onclick={() => handleJumpToMessage(chosen.proposerAgentId)}
                                        class="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                        title="定位至对应专家会话发言"
                                    >
                                        <ExternalLink class="w-3 h-3" />
                                        <span>定位发言</span>
                                    </button>
                                {/if}
                            </div>
                        </div>

                        <div class="space-y-1">
                            <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                                {chosen ? chosen.name : '终审综合收敛方案路线'}
                            </h3>
                            <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                {chosen ? chosen.coreIdea : (decisionTrace[decisionTrace.length - 1]?.coreInsight || '基于多小队攻坚对抗与红队证伪提炼出的最优实施方案。')}
                            </p>
                        </div>

                        {#if chosen}
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                                <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                                    <span class="font-bold text-slate-600 dark:text-slate-400">预期核心收益 (ROI)：</span>
                                    <span class="text-emerald-700 dark:text-emerald-300 font-semibold font-mono">{chosen.projectedRoi}</span>
                                </div>
                                <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                                    <span class="font-bold text-slate-600 dark:text-slate-400">实施代价与周期：</span>
                                    <span class="text-amber-700 dark:text-amber-300 font-semibold font-mono">{chosen.estimatedCost}</span>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}

                <!-- Section 1.2: 结构化方案横向参数化量化对比矩阵 (Adaptive Table / Cards) -->
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <Layers class="h-4 w-4 text-slate-700 dark:text-slate-300" />
                                方案对比矩阵 (ADR Matrix)
                            </h3>
                            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                各专家方案候选横向拉齐与最终仲裁状态
                            </p>
                        </div>
                        <span class="text-xs font-mono text-slate-500">共 {candidatePaths.length} 条候选路线</span>
                    </div>

                    {#if candidatePaths.length === 0}
                        <div class="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-400">
                            暂无候选路径数据，启动单小队协同或多小队推演后将自动萃取。
                        </div>
                    {:else if viewMode === 'drawer'}
                        <!-- Drawer Mode: Adaptive Card List (No Horizontal Scroll Overflow) -->
                        <div class="grid grid-cols-1 gap-3">
                            {#each candidatePaths as path}
                                <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-2.5 shadow-xs {path.isChosen ? 'ring-1 ring-emerald-500/50 dark:ring-emerald-500/40' : ''}">
                                    <div class="flex items-center justify-between gap-2">
                                        <div>
                                            <div class="font-bold text-xs text-slate-900 dark:text-slate-100">{path.name}</div>
                                            <div class="text-[10px] text-slate-400 mt-0.5">提出专家：{path.proposerAgentId}</div>
                                        </div>
                                        {#if path.isChosen}
                                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                <Check class="h-3 w-3" /> 终审采纳
                                            </span>
                                        {:else}
                                            <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                备选
                                            </span>
                                        {/if}
                                    </div>
                                    <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{path.coreIdea}</p>
                                    <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                                        <div class="p-1.5 rounded bg-slate-50 dark:bg-slate-950/60">
                                            <span class="text-slate-400 block text-[10px]">预期收益：</span>
                                            <span class="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{path.projectedRoi}</span>
                                        </div>
                                        <div class="p-1.5 rounded bg-slate-50 dark:bg-slate-950/60">
                                            <span class="text-slate-400 block text-[10px]">实施代价：</span>
                                            <span class="font-mono text-slate-700 dark:text-slate-300 font-semibold">{path.estimatedCost}</span>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <!-- Modal Mode: Fluid Data Table -->
                        <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                            <table class="w-full text-xs text-left border-collapse">
                                <thead>
                                    <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 text-slate-600 dark:text-slate-400 font-semibold">
                                        <th class="py-2.5 px-3.5 min-w-[140px]">方案名称 / 提出者</th>
                                        <th class="py-2.5 px-3.5">核心架构逻辑</th>
                                        <th class="py-2.5 px-3.5 min-w-[120px]">预期收益 (ROI)</th>
                                        <th class="py-2.5 px-3.5 min-w-[120px]">实施代价 / 周期</th>
                                        <th class="py-2.5 px-3.5 w-24 text-center">状态</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                                    {#each candidatePaths as path}
                                        <tr class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition {path.isChosen ? 'bg-emerald-50/20 dark:bg-emerald-950/10 font-medium' : ''}">
                                            <td class="py-3 px-3.5 align-top">
                                                <div class="font-bold text-slate-900 dark:text-slate-100">{path.name}</div>
                                                <div class="text-[11px] text-slate-400 mt-0.5">专家：{path.proposerAgentId}</div>
                                            </td>
                                            <td class="py-3 px-3.5 align-top text-slate-700 dark:text-slate-300 leading-relaxed">
                                                {path.coreIdea}
                                            </td>
                                            <td class="py-3 px-3.5 align-top font-mono text-emerald-700 dark:text-emerald-400 font-medium">
                                                {path.projectedRoi}
                                            </td>
                                            <td class="py-3 px-3.5 align-top font-mono text-slate-700 dark:text-slate-300">
                                                {path.estimatedCost}
                                            </td>
                                            <td class="py-3 px-3.5 align-top text-center">
                                                {#if path.isChosen}
                                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                        <Check class="h-3 w-3" />
                                                        采纳
                                                    </span>
                                                {:else}
                                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                        备选
                                                    </span>
                                                {/if}
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    {/if}
                </div>

                <!-- Section 1.3: 致命假设证伪与风险防御审查 (Risk & Vulnerability Audit) -->
                <div class="space-y-3 pt-2">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <AlertTriangle class="h-4 w-4 text-rose-500" />
                                风险与隐患台账 (Risk Audit)
                            </h3>
                            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                审查死穴、极端破坏力情景与止损熔断策略
                            </p>
                        </div>
                        <span class="text-xs font-mono text-slate-500">审查项：{vulnerabilities.length} 处</span>
                    </div>

                    {#if vulnerabilities.length === 0}
                        <div class="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-400">
                            暂无风险证伪记录。攻坚过程中质检专家所发起的红队攻击将实时沉淀在此。
                        </div>
                    {:else}
                        <div class="grid {viewMode === 'drawer' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-3.5">
                            {#each vulnerabilities as v}
                                <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
                                    <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                        <span class="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                            <AlertTriangle class="h-3.5 w-3.5 text-rose-500" />
                                            {v.topic}
                                        </span>
                                        <div class="flex items-center gap-2">
                                            <span class="text-[10px] text-slate-400 font-mono">专家：{v.discoveredByAgentId}</span>
                                            <button
                                                type="button"
                                                onclick={() => handleJumpToMessage(v.discoveredByAgentId)}
                                                class="text-indigo-600 dark:text-indigo-400 hover:underline text-[10px] flex items-center gap-0.5 cursor-pointer"
                                                title="定位发言"
                                            >
                                                <ExternalLink class="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>

                                    <div class="space-y-2 text-xs">
                                        <div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/60">
                                            <div class="text-[10px] font-bold text-slate-500 dark:text-slate-400">前提假设：</div>
                                            <p class="text-slate-700 dark:text-slate-300 text-[11px] mt-0.5">{v.fatalHypothesis}</p>
                                        </div>

                                        <div class="p-2 rounded-lg bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
                                            <div class="text-[10px] font-bold text-rose-700 dark:text-rose-400">极端最差情景：</div>
                                            <p class="text-rose-800 dark:text-rose-200 text-[11px] mt-0.5">{v.worstCaseScenario}</p>
                                        </div>

                                        <div class="p-2 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                                            <div class="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">防御与止损预案：</div>
                                            <p class="text-emerald-800 dark:text-emerald-200 text-[11px] mt-0.5">{v.mitigationStrategy}</p>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        {/if}


        <!-- ====================================================================== -->
        <!-- WORKSPACE 2: 因果演进与全景流水 (Trace & Observability Pipeline) -->
        <!-- ====================================================================== -->
        {#if activeMainTab === 'observability'}
            <div class="space-y-5" in:fade={{ duration: 100 }}>
                <!-- Sub-filters Bar: Segment + Search + Agent Filter + Status Filter -->
                <div class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <!-- Sub-category Segment -->
                    <div class="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
                        <button
                            type="button"
                            onclick={() => (obsSubTab = 'all')}
                            class="px-2.5 py-1 rounded-md transition cursor-pointer {obsSubTab === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                        >
                            全部流水
                        </button>
                        <button
                            type="button"
                            onclick={() => (obsSubTab = 'trace')}
                            class="px-2.5 py-1 rounded-md transition cursor-pointer {obsSubTab === 'trace' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                        >
                            因果链 ({decisionTrace.length})
                        </button>
                        <button
                            type="button"
                            onclick={() => (obsSubTab = 'tools')}
                            class="px-2.5 py-1 rounded-md transition cursor-pointer {obsSubTab === 'tools' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                        >
                            技能调用 ({toolInvocations.length})
                        </button>
                        <button
                            type="button"
                            onclick={() => (obsSubTab = 'comms')}
                            class="px-2.5 py-1 rounded-md transition cursor-pointer {obsSubTab === 'comms' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                        >
                            交接记录 ({interAgentComms.length})
                        </button>
                        <button
                            type="button"
                            onclick={() => (obsSubTab = 'behaviors')}
                            class="px-2.5 py-1 rounded-md transition cursor-pointer {obsSubTab === 'behaviors' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                        >
                            专家分工 ({agentBehaviors.length})
                        </button>
                    </div>

                    <!-- Search & Dropdown Filters -->
                    <div class="flex flex-wrap items-center gap-2 text-xs">
                        <!-- Text Search -->
                        <div class="relative">
                            <Search class="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                            <input
                                type="text"
                                placeholder="搜索流水/论据/技能..."
                                bind:value={obsSearchQuery}
                                class="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder-slate-400 text-xs focus:outline-none focus:border-slate-400 w-44"
                            />
                        </div>

                        <!-- Agent Filter Dropdown -->
                        {#if availableAgents.length > 0}
                            <select
                                bind:value={obsAgentFilter}
                                class="py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs focus:outline-none"
                            >
                                <option value="all">全部专家</option>
                                {#each availableAgents as agent}
                                    <option value={agent.id}>{agent.name}</option>
                                {/each}
                            </select>
                        {/if}

                        <!-- Status Filter (for tools & comms) -->
                        {#if obsSubTab === 'all' || obsSubTab === 'tools'}
                            <select
                                bind:value={obsStatusFilter}
                                class="py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs focus:outline-none"
                            >
                                <option value="all">全部状态</option>
                                <option value="success">仅成功</option>
                                <option value="failed">仅失败</option>
                                <option value="slow">慢调用 (&gt;1000ms)</option>
                            </select>
                        {/if}
                    </div>
                </div>

                <!-- Sub-View 1: Decision Trace Stages (因果时间线) -->
                {#if obsSubTab === 'all' || obsSubTab === 'trace'}
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <GitCommit class="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                                <span>决策因果演进节点 ({filteredDecisionTrace.length})</span>
                            </h4>
                        </div>

                        {#if filteredDecisionTrace.length === 0}
                            <div class="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-400">
                                暂无匹配的决策溯源链数据
                            </div>
                        {:else}
                            <div class="relative pl-6 sm:pl-7 space-y-4 border-l-2 border-slate-200 dark:border-slate-700/80 ml-2">
                                {#each filteredDecisionTrace as stage}
                                    <div class="relative group">
                                        <!-- Clean Node Dot -->
                                        <div class="absolute -left-[31px] sm:-left-[35px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-bold font-mono">
                                            {stage.stageIndex}
                                        </div>

                                        <!-- Content Card -->
                                        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2.5 shadow-xs">
                                            <div class="flex flex-wrap items-center justify-between gap-2">
                                                <div class="flex items-center gap-2">
                                                    <span class="text-xs font-bold text-slate-900 dark:text-slate-100">
                                                        第 {stage.stageIndex} 阶段：{stage.title}
                                                    </span>
                                                    <span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                        达成
                                                    </span>
                                                </div>
                                                <div class="flex items-center gap-2">
                                                    <span class="text-[11px] text-slate-400 font-mono">
                                                        专家：{stage.agentName}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onclick={() => handleJumpToMessage(stage.agentId)}
                                                        class="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                                        title="在会话流中定位该阶段发言"
                                                    >
                                                        <MessageSquare class="w-3 h-3" />
                                                        <span>定位发言</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                                                <div class="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                                    核心决策洞察：
                                                </div>
                                                {stage.coreInsight}
                                            </div>

                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                                                <div class="p-2 rounded-lg bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 text-slate-600 dark:text-slate-400">
                                                    <span class="font-semibold text-slate-700 dark:text-slate-300">论据引用：</span>
                                                    {stage.evidenceQuote}
                                                </div>
                                                <div class="p-2 rounded-lg bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 text-slate-600 dark:text-slate-400">
                                                    <span class="font-semibold text-slate-700 dark:text-slate-300">权衡演进：</span>
                                                    {stage.tradeoffSummary}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}

                <!-- Sub-View 2: Tool Invocations (技能调用流水 + 真实 Payload 展开) -->
                {#if obsSubTab === 'all' || obsSubTab === 'tools'}
                    <div class="space-y-3 pt-2">
                        <div class="flex items-center justify-between">
                            <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Wrench class="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                                <span>认知技能与工具调用流水 ({filteredToolInvocations.length})</span>
                            </h4>
                        </div>

                        {#if filteredToolInvocations.length === 0}
                            <div class="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-400">
                                暂无技能调用记录
                            </div>
                        {:else}
                            <div class="space-y-2.5">
                                {#each filteredToolInvocations as tool}
                                    {@const isExpanded = Boolean(expandedPayloadIds[tool.id])}
                                    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-2.5 shadow-xs">
                                        <div class="flex flex-wrap items-center justify-between gap-2">
                                            <div class="flex items-center gap-2">
                                                <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold {tool.status === 'success' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'}">
                                                    {tool.status.toUpperCase()}
                                                </span>
                                                <h5 class="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                                                    <Code2 class="h-3.5 w-3.5 text-slate-500" />
                                                    {tool.toolName}
                                                </h5>
                                                <span class="text-[10px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                    {tool.category}
                                                </span>
                                            </div>
                                            <div class="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                                                <span>调用者：{tool.callerAgentName}</span>
                                                <span class="flex items-center gap-1 font-semibold {(tool.durationMs || 0) >= 1000 ? 'text-amber-600' : 'text-slate-600 dark:text-slate-400'}">
                                                    <Clock class="h-3 w-3" />
                                                    {tool.durationMs}ms
                                                </span>
                                                <button
                                                    type="button"
                                                    onclick={() => togglePayloadExpand(tool.id)}
                                                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                                                >
                                                    <span>{isExpanded ? "收起载荷" : "展开载荷"}</span>
                                                    {#if isExpanded}
                                                        <ChevronUp class="w-3 h-3" />
                                                    {:else}
                                                        <ChevronDown class="w-3 h-3" />
                                                    {/if}
                                                </button>
                                                <button
                                                    type="button"
                                                    onclick={() => handleJumpToMessage(tool.callerAgentId)}
                                                    class="text-indigo-600 dark:text-indigo-400 hover:underline text-[11px] flex items-center gap-0.5 cursor-pointer"
                                                    title="定位调用者发言"
                                                >
                                                    <ExternalLink class="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>

                                        {#if isExpanded}
                                            <!-- Expanded Full Raw/JSON View -->
                                            <div class="space-y-2 pt-1">
                                                <div class="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs space-y-1">
                                                    <div class="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1">
                                                        <span>INPUT PAYLOAD</span>
                                                        <button
                                                            type="button"
                                                            onclick={() => copyPayloadText(tool.inputSummary)}
                                                            class="hover:text-white flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <Copy class="w-3 h-3" /> 复制
                                                        </button>
                                                    </div>
                                                    <pre class="whitespace-pre-wrap break-all text-[11px] max-h-48 overflow-y-auto">{formatPayload(tool.inputSummary)}</pre>
                                                </div>

                                                <div class="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs space-y-1">
                                                    <div class="flex items-center justify-between text-[10px] text-emerald-400 border-b border-slate-800 pb-1">
                                                        <span>OUTPUT RESULT</span>
                                                        <button
                                                            type="button"
                                                            onclick={() => copyPayloadText(tool.outputSummary)}
                                                            class="hover:text-white flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <Copy class="w-3 h-3" /> 复制
                                                        </button>
                                                    </div>
                                                    <pre class="whitespace-pre-wrap break-all text-[11px] max-h-60 overflow-y-auto text-emerald-300">{formatPayload(tool.outputSummary)}</pre>
                                                </div>
                                            </div>
                                        {:else}
                                            <!-- Truncated Clean Summary -->
                                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300">
                                                    <div class="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Input:</div>
                                                    <p class="text-[11px] line-clamp-2">{tool.inputSummary}</p>
                                                </div>
                                                <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300">
                                                    <div class="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold mb-0.5">Output:</div>
                                                    <p class="text-[11px] line-clamp-2">{tool.outputSummary}</p>
                                                </div>
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}

                <!-- Sub-View 3: Inter-Agent Communications (交接流转) -->
                {#if obsSubTab === 'all' || obsSubTab === 'comms'}
                    <div class="space-y-3 pt-2">
                        <div class="flex items-center justify-between">
                            <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Network class="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                                <span>Agent 间通信交接与交锋记录 ({filteredInterAgentComms.length})</span>
                            </h4>
                        </div>

                        {#if filteredInterAgentComms.length === 0}
                            <div class="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-400">
                                暂无通信交接记录
                            </div>
                        {:else}
                            <div class="space-y-2.5">
                                {#each filteredInterAgentComms as comm}
                                    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-2 shadow-xs">
                                        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                            <div class="flex items-center gap-2 text-xs">
                                                <span class="font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                                                    {comm.sourceAgentName}
                                                </span>
                                                <ArrowRight class="h-3.5 w-3.5 text-slate-400" />
                                                <span class="font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                                                    {comm.targetAgentName}
                                                </span>
                                            </div>

                                            <div class="flex items-center gap-2">
                                                <span class="px-2 py-0.5 rounded-full text-[10px] font-medium {comm.type === 'critique' ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' : comm.type === 'synthesis' ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}">
                                                    {comm.type === 'critique' ? '质检反驳' : comm.type === 'synthesis' ? '共识收敛' : '数据交接'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onclick={() => handleJumpToMessage(comm.sourceAgentName)}
                                                    class="text-indigo-600 dark:text-indigo-400 hover:underline text-[10px] flex items-center gap-0.5 cursor-pointer"
                                                    title="定位交接上下文"
                                                >
                                                    <ExternalLink class="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>

                                        <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                            {comm.summary}
                                        </p>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}

                <!-- Sub-View 4: Agent Behaviors & Roles (专家分工态势) -->
                {#if obsSubTab === 'all' || obsSubTab === 'behaviors'}
                    <div class="space-y-3 pt-2">
                        <div class="flex items-center justify-between">
                            <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Bot class="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                                <span>在岗专家行为与贡献表现 ({agentBehaviors.length})</span>
                            </h4>
                        </div>

                        {#if agentBehaviors.length === 0}
                            <div class="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-400">
                                暂无 Agent 行为数据
                            </div>
                        {:else}
                            <div class="grid {viewMode === 'drawer' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-3.5">
                                {#each agentBehaviors as b}
                                    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
                                        <div class="flex items-start justify-between gap-3">
                                            <div class="flex items-center gap-2.5 min-w-0">
                                                <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0" style="background-color: {b.color}">
                                                    {b.agentName[0]}
                                                </div>
                                                <div class="min-w-0">
                                                    <h5 class="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                                        {b.agentName}
                                                        <span class="text-[10px] font-normal text-slate-400">({b.agentId})</span>
                                                    </h5>
                                                    <p class="text-[11px] text-slate-500 truncate">{b.role}</p>
                                                </div>
                                            </div>

                                            <div class="flex items-center gap-2">
                                                <span class="px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 {b.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}">
                                                    {b.status === 'completed' ? '已达成' : '待命'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onclick={() => handleJumpToMessage(b.agentId)}
                                                    class="text-indigo-600 dark:text-indigo-400 hover:underline text-[10px] flex items-center gap-0.5 cursor-pointer"
                                                    title="定位该专家发言"
                                                >
                                                    <ExternalLink class="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>

                                        <div class="space-y-2 text-xs">
                                            <div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300">
                                                <div class="text-[10px] font-bold text-slate-400 mb-0.5">本位目标：</div>
                                                <p class="text-[11px] leading-relaxed">{b.goal}</p>
                                            </div>

                                            <div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300">
                                                <div class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">核心贡献：</div>
                                                <p class="text-[11px] leading-relaxed">{b.keyContribution}</p>
                                            </div>
                                        </div>

                                        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                                            <div class="flex items-center gap-1">
                                                {#each b.skillsUsed as skill}
                                                    <span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                        #{skill}
                                                    </span>
                                                {/each}
                                            </div>
                                            <div class="flex items-center gap-3 font-mono text-slate-500 text-[10px]">
                                                <span>发信: {b.messagesCount} 条</span>
                                                <span class="text-emerald-600 dark:text-emerald-400 font-bold">置信度: {b.confidenceScore}%</span>
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}


        <!-- ====================================================================== -->
        <!-- WORKSPACE 3: 落地工单与闭环 (DoD Work Orders & Direct Actions) -->
        <!-- ====================================================================== -->
        {#if activeMainTab === 'dod_plan'}
            <div class="space-y-5" in:fade={{ duration: 100 }}>
                <!-- DoD Progress & Direct Actions Bar -->
                <div class="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <div class="space-y-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <FileCheck class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                落地执行工单与 Definition of Done 验收清单
                            </h3>
                        </div>
                        <div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span>交付达成率：<strong class="text-emerald-600 dark:text-emerald-400 font-mono">{dodCompletedCount}/{dodTasks.length} ({dodCompletionRate}%)</strong></span>
                            <div class="w-32 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div class="h-full bg-emerald-500 transition-all duration-300" style="width: {dodCompletionRate}%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2">
                        <!-- Status Filter Segment -->
                        <div class="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-medium">
                            <button
                                type="button"
                                onclick={() => (dodStatusFilter = 'all')}
                                class="px-2.5 py-1 rounded-md transition cursor-pointer {dodStatusFilter === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                            >
                                全部
                            </button>
                            <button
                                type="button"
                                onclick={() => (dodStatusFilter = 'pending')}
                                class="px-2.5 py-1 rounded-md transition cursor-pointer {dodStatusFilter === 'pending' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                            >
                                待执行 ({dodTasks.length - dodCompletedCount})
                            </button>
                            <button
                                type="button"
                                onclick={() => (dodStatusFilter = 'completed')}
                                class="px-2.5 py-1 rounded-md transition cursor-pointer {dodStatusFilter === 'completed' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                            >
                                已达成 ({dodCompletedCount})
                            </button>
                        </div>

                        <!-- Timeframe Segment Filter -->
                        <div class="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-medium">
                            <button
                                type="button"
                                onclick={() => (dodTimeframeFilter = 'all')}
                                class="px-2.5 py-1 rounded-md transition cursor-pointer {dodTimeframeFilter === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                            >
                                周期: 全部
                            </button>
                            <button
                                type="button"
                                onclick={() => (dodTimeframeFilter = '72h')}
                                class="px-2.5 py-1 rounded-md transition cursor-pointer {dodTimeframeFilter === '72h' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                            >
                                72h
                            </button>
                            <button
                                type="button"
                                onclick={() => (dodTimeframeFilter = '7d')}
                                class="px-2.5 py-1 rounded-md transition cursor-pointer {dodTimeframeFilter === '7d' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                            >
                                7d
                            </button>
                            <button
                                type="button"
                                onclick={() => (dodTimeframeFilter = '30d')}
                                class="px-2.5 py-1 rounded-md transition cursor-pointer {dodTimeframeFilter === '30d' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                            >
                                30d
                            </button>
                        </div>

                        <!-- Direct Actions: Copy Checklist & Sync to Chat -->
                        <button
                            type="button"
                            onclick={handleExportDoDChecklist}
                            class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-medium text-slate-700 dark:text-slate-200 transition cursor-pointer"
                            title="复制为 Markdown Checklist"
                        >
                            <Copy class="h-3.5 w-3.5 text-slate-500" />
                            <span>复制清单</span>
                        </button>

                        <button
                            type="button"
                            onclick={handleSyncDoDToChat}
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition active:scale-95 cursor-pointer shadow-xs"
                            title="将全部工单同步下发至主对话流作为门禁"
                        >
                            <Send class="h-3.5 w-3.5" />
                            <span>下发全量工单</span>
                        </button>
                    </div>
                </div>

                {#if filteredDoDTasks.length === 0}
                    <div class="py-14 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-400">
                        <FileCheck class="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                        <span>暂无符合条件的工单项目。</span>
                    </div>
                {:else}
                    <div class="space-y-3">
                        {#each filteredDoDTasks as task}
                            <div class="rounded-xl border {task.completed ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'} p-4 space-y-2.5 shadow-xs transition">
                                <div class="flex flex-wrap items-center justify-between gap-2">
                                    <div class="flex items-center gap-2.5 min-w-0">
                                        <!-- Checkbox Toggle -->
                                        <button
                                            type="button"
                                            onclick={() => auditEventBus.toggleDoDTask(task.id)}
                                            class="p-0.5 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer shrink-0"
                                            title={task.completed ? "标记为未完成" : "标记为已达成验收"}
                                        >
                                            {#if task.completed}
                                                <CheckSquare class="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                                            {:else}
                                                <Square class="h-4.5 w-4.5 text-slate-400" />
                                            {/if}
                                        </button>

                                        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 {task.timeframe === '72h' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800' : task.timeframe === '7d' ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'}">
                                            {task.timeframe}
                                        </span>

                                        <h4 class="text-xs sm:text-sm font-bold truncate {task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}">
                                            {task.action}
                                        </h4>
                                    </div>

                                    <div class="flex items-center gap-2 shrink-0">
                                        <span class="text-[11px] text-slate-500 font-mono">责任主体：{task.owner}</span>
                                        <!-- Actionable Trigger: Launch Single DoD Task into Agent Chat -->
                                        <button
                                            type="button"
                                            onclick={() => handleExecuteTask(task)}
                                            class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition active:scale-95 cursor-pointer shadow-2xs"
                                            title="针对本工单向 Agent 派发落地攻坚与实现指令"
                                        >
                                            <Play class="w-3 h-3 fill-indigo-600 dark:fill-indigo-400" />
                                            <span>发起攻坚</span>
                                        </button>
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300">
                                        <div class="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mb-0.5">DoD 验收及格线：</div>
                                        <p class="text-[11px] leading-relaxed">{task.definitionOfDone}</p>
                                    </div>
                                    <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300">
                                        <div class="text-[10px] text-rose-700 dark:text-rose-400 font-bold mb-0.5">故障熔断底线：</div>
                                        <p class="text-[11px] leading-relaxed">{task.fallbackCircuitBreaker}</p>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
    </div>
{/snippet}

{#if agentStore.decisionConsoleOpen}
    {#if viewMode === 'modal'}
        <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/80 p-3 sm:p-4 backdrop-blur-xs"
            onclick={() => (agentStore.decisionConsoleOpen = false)}
            onkeydown={(e) => { if (e.key === 'Escape') agentStore.decisionConsoleOpen = false; }}
            role="presentation"
            transition:fade={{ duration: 120 }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="decision-console-title"
                tabindex="-1"
                class="relative flex h-[90vh] max-h-[880px] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-2xl"
                onclick={(e) => e.stopPropagation()}
                onkeydown={(e) => e.stopPropagation()}
                transition:fly={{ y: 10, duration: 160 }}
            >
                {@render consoleContent()}
            </div>
        </div>
    {:else}
        <!-- Split-Screen Docked Right Drawer (Supports simultaneous left chat & right audit inspection) -->
        <div
            role="dialog"
            aria-modal="false"
            aria-labelledby="decision-console-title"
            tabindex="-1"
            class="fixed right-0 top-0 bottom-0 z-40 flex h-full w-full max-w-2xl lg:max-w-3xl flex-col border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-2xl"
            transition:fly={{ x: 500, duration: 200 }}
        >
            {@render consoleContent()}
        </div>
    {/if}
{/if}
