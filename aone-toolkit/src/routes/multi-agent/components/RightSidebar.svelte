<script lang="ts">
    import { agentStore, type Message, type SessionHistoryItem } from "$lib/stores/agentStore.svelte";
    import RichMessageContent from "./RichMessageContent.svelte";
    import CollaborationTopologyBoard from "./CollaborationTopologyBoard.svelte";
    import {
        Brain,
        History,
        X,
        Trash2,
        Clock,
        Copy,
        Check,
        RotateCcw,
        Sparkles,
        Search,
        Plus,
        Layers,
        ChevronRight,
        Compass,
        Zap,
        CheckCircle2,
        Loader2,
        FileText,
        Network,
        Scale,
        GitCommit,
        FileCheck,
        Maximize2
    } from "lucide-svelte";
    import { fly, fade } from "svelte/transition";

    let activeTab = $derived(agentStore.rightDrawerTab);
    let searchHistoryQuery = $state("");
    let copiedId = $state<string | null>(null);

    // Thought & Coordinator logs
    let thoughtMessages = $derived(
        agentStore.currentSession.messages.filter(m => m.role === 'thought' || m.agentId === 'coordinator')
    );

    let decisionTrace = $derived(agentStore.dynamicDecisionTrace);
    let dodTasks = $derived(agentStore.dynamicDoDTasks);
    let candidatePaths = $derived(agentStore.dynamicCandidatePaths);

    // History items with search filter
    let filteredHistory = $derived.by(() => {
        const query = searchHistoryQuery.trim().toLowerCase();
        if (!query) return agentStore.sessionHistory;
        return agentStore.sessionHistory.filter(item =>
            item.goal.toLowerCase().includes(query) ||
            item.activeAgentNames?.some(name => name.toLowerCase().includes(query))
        );
    });

    function formatTime(timestamp: number) {
        const date = new Date(timestamp);
        const now = Date.now();
        const diffSec = Math.floor((now - timestamp) / 1000);

        if (diffSec < 60) return "刚刚";
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)} 分钟前`;
        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} 小时前`;
        return date.toLocaleDateString([], { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }

    async function handleCopy(id: string, text: string) {
        try {
            await navigator.clipboard.writeText(text);
            copiedId = id;
            setTimeout(() => { copiedId = null; }, 2000);
        } catch { /* fallback */ }
    }

    function handleStartNewSession() {
        agentStore.clearSession();
        agentStore.addMessage("system", "✨ 已开启全新多 Agent 协同会话，请在下方描述您的目标。");
    }
</script>

{#if agentStore.rightDrawerOpen}
    <!-- Backdrop for smaller screens -->
    <div
        role="presentation"
        class="fixed inset-0 bg-black/20 backdrop-blur-xs z-30 lg:hidden"
        onclick={() => agentStore.closeRightDrawer()}
        transition:fade={{ duration: 200 }}
    ></div>

    <!-- Right Drawer Sidebar -->
    <aside
        class="fixed lg:static top-0 right-0 h-full w-full max-w-[420px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl lg:shadow-none z-40 flex flex-col shrink-0 overflow-hidden transition-all duration-300"
        transition:fly={{ x: 420, duration: 250 }}
    >
        <!-- Header & Tab Navigation -->
        <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 shrink-0">
            <div class="flex items-center justify-between gap-2 mb-2.5">
                <div class="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100 text-sm">
                    {#if activeTab === 'thought'}
                        <Brain class="w-4 h-4 text-slate-700 dark:text-slate-300" />
                        <span>协调推演记录</span>
                    {:else if activeTab === 'topology'}
                        <Network class="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span>小队分工全景</span>
                    {:else if activeTab === 'audit'}
                        <Scale class="w-4 h-4 text-slate-700 dark:text-slate-300" />
                        <span>决策审计与工单</span>
                    {:else}
                        <History class="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        <span>多 Agent 运行历史</span>
                    {/if}
                </div>
                <button
                    type="button"
                    onclick={() => agentStore.closeRightDrawer()}
                    class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                    aria-label="关闭侧边栏"
                    title="关闭 (Esc)"
                >
                    <X class="w-4 h-4" />
                </button>
            </div>

            <!-- Tabs Segment Control (4 Tabs) -->
            <div class="grid grid-cols-4 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg text-xs font-semibold gap-0.5">
                <button
                    type="button"
                    onclick={() => agentStore.openRightDrawer('thought')}
                    class="flex items-center justify-center gap-0.5 py-1.5 rounded-md transition-all cursor-pointer {activeTab === 'thought'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                >
                    <Brain class="w-3.5 h-3.5" />
                    <span>推演</span>
                </button>

                <button
                    type="button"
                    onclick={() => agentStore.openRightDrawer('topology')}
                    class="flex items-center justify-center gap-0.5 py-1.5 rounded-md transition-all cursor-pointer {activeTab === 'topology'
                        ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                >
                    <Network class="w-3.5 h-3.5" />
                    <span>分工</span>
                </button>

                <button
                    type="button"
                    onclick={() => agentStore.openRightDrawer('audit')}
                    class="flex items-center justify-center gap-0.5 py-1.5 rounded-md transition-all cursor-pointer {activeTab === 'audit'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                >
                    <Scale class="w-3.5 h-3.5" />
                    <span>审计</span>
                </button>

                <button
                    type="button"
                    onclick={() => agentStore.openRightDrawer('history')}
                    class="flex items-center justify-center gap-0.5 py-1.5 rounded-md transition-all cursor-pointer {activeTab === 'history'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                >
                    <History class="w-3.5 h-3.5" />
                    <span>历史</span>
                </button>
            </div>
        </div>

        <!-- Body Content -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
            {#if activeTab === 'topology'}
                <!-- Topology Board Tab in Right Drawer -->
                <CollaborationTopologyBoard inDrawer={true} />
            {:else if activeTab === 'thought'}
                <!-- Thought / Coordinator Tab -->
                {#if thoughtMessages.length === 0}
                    <div class="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                        <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-500">
                            <Compass class="w-6 h-6 animate-pulse" />
                        </div>
                        <div class="space-y-1">
                            <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">暂无协调推演记录</p>
                            <p class="text-[11px] text-slate-400 max-w-[240px]">
                                在主窗口输入并发送任务后，协调者的意图识别、场景匹配与策略编排推演日志将实时沉淀在此。
                            </p>
                        </div>
                    </div>
                {:else}
                    <div class="space-y-3">
                        {#each thoughtMessages as tm, idx (tm.id || idx)}
                            <div class="rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-slate-800/60 p-3.5 shadow-2xs space-y-2 group transition-all hover:border-indigo-300 dark:hover:border-indigo-700">
                                <div class="flex items-center justify-between gap-2 border-b border-indigo-100/80 dark:border-indigo-900/40 pb-2">
                                    <div class="flex items-center gap-1.5">
                                        <span class="inline-flex items-center justify-center w-5 h-5 rounded-md bg-indigo-600 text-white text-[10px] font-bold">
                                            #{idx + 1}
                                        </span>
                                        <span class="text-xs font-bold text-slate-800 dark:text-slate-200">
                                            {#if tm.agentId === 'coordinator'}
                                                协调者推演
                                            {:else}
                                                路由与编排节点
                                            {/if}
                                        </span>
                                        {#if tm.isStreaming}
                                            <span class="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 animate-pulse font-medium">
                                                <Loader2 class="w-2.5 h-2.5 animate-spin" />
                                                生成中
                                            </span>
                                        {/if}
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-[10px] text-slate-400 font-mono">
                                            {new Date(tm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                        <!-- // [P02] 补充推演节点复制按钮的无障碍 aria-label -->
                                        <button
                                            type="button"
                                            onclick={() => handleCopy(tm.id || String(idx), tm.content)}
                                            class="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                            aria-label="复制此节点推演内容"
                                            title="复制此节点推演内容"
                                        >
                                            {#if copiedId === (tm.id || String(idx))}
                                                <Check class="w-3.5 h-3.5 text-emerald-500" />
                                            {:else}
                                                <Copy class="w-3.5 h-3.5" />
                                            {/if}
                                        </button>
                                    </div>
                                </div>
                                <div class="prose prose-xs dark:prose-invert max-w-none text-xs leading-relaxed overflow-x-auto">
                                    <RichMessageContent content={tm.content} />
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            {:else if activeTab === 'audit'}
                <!-- Audit & Decision Console Tab -->
                <div class="space-y-3">
                    <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs">
                        <div class="flex items-center gap-2 min-w-0">
                            <Scale class="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
                            <span class="font-bold text-slate-800 dark:text-slate-200 truncate">决策审计概览</span>
                        </div>
                        <button
                            type="button"
                            onclick={() => agentStore.toggleDecisionConsole('overview')}
                            class="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-900 dark:text-slate-100 hover:underline cursor-pointer"
                        >
                            <Maximize2 class="w-3 h-3" />
                            <span>打开审计台</span>
                        </button>
                    </div>

                    <!-- Decision Trace Summary -->
                    <div class="space-y-2">
                        <div class="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                            <span class="flex items-center gap-1.5">
                                <GitCommit class="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                                <span>决策链路 ({decisionTrace.length})</span>
                            </span>
                            {#if decisionTrace.length > 0}
                                <button
                                    type="button"
                                    onclick={() => agentStore.toggleDecisionConsole('observability')}
                                    class="text-[10px] text-slate-500 hover:underline cursor-pointer"
                                >
                                    查看流水
                                </button>
                            {/if}
                        </div>
                        {#if decisionTrace.length === 0}
                            <div class="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-center text-xs text-slate-400">
                                启动推演后将自动生成因果溯源节点
                            </div>
                        {:else}
                            <div class="space-y-2">
                                {#each decisionTrace as stage}
                                    <button
                                        type="button"
                                        onclick={() => agentStore.scrollToMessage(stage.agentId)}
                                        class="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 text-xs space-y-1.5 transition cursor-pointer group"
                                    >
                                        <div class="flex items-center justify-between gap-2 font-bold text-slate-900 dark:text-white">
                                            <span>第 {stage.stageIndex} 阶段：{stage.title}</span>
                                            <span class="text-[10px] font-normal text-slate-400 font-mono group-hover:text-indigo-500 transition">{stage.agentName}</span>
                                        </div>
                                        <p class="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                                            {stage.coreInsight}
                                        </p>
                                    </button>
                                {/each}
                            </div>
                        {/if}
                    </div>

                    <!-- DoD Tasks Summary -->
                    {#if dodTasks.length > 0}
                        <div class="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div class="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                <span class="flex items-center gap-1.5">
                                    <FileCheck class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>落地工单 ({dodTasks.length})</span>
                                </span>
                                <button
                                    type="button"
                                    onclick={() => agentStore.toggleDecisionConsole('dod_plan')}
                                    class="text-[10px] text-slate-500 hover:underline cursor-pointer"
                                >
                                    管理全部
                                </button>
                            </div>
                            <div class="space-y-1.5">
                                {#each dodTasks.slice(0, 5) as task}
                                    <div class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-xs space-y-1">
                                        <div class="flex items-center justify-between gap-2">
                                            <span class="font-bold text-slate-800 dark:text-slate-200 truncate {task.completed ? 'line-through text-slate-400' : ''}">{task.action}</span>
                                            <span class="text-[10px] text-slate-400 font-mono">{task.timeframe}</span>
                                        </div>
                                        <div class="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                            DoD: {task.definitionOfDone}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            {:else}
                <!-- History Tab -->
                <div class="space-y-3">
                    <!-- Actions & Search Bar -->
                    <div class="space-y-2">
                        <div class="flex items-center justify-between gap-2">
                            <button
                                type="button"
                                onclick={handleStartNewSession}
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-semibold shadow-xs transition"
                            >
                                <Plus class="w-3.5 h-3.5" />
                                <span>新建会话</span>
                            </button>
                            {#if agentStore.sessionHistory.length > 0}
                                <button
                                    type="button"
                                    onclick={() => agentStore.clearHistory()}
                                    class="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-500 px-2 py-1 rounded transition"
                                    title="清空全部历史记录"
                                >
                                    <Trash2 class="w-3 h-3" />
                                    <span>清空历史</span>
                                </button>
                            {/if}
                        </div>

                        {#if agentStore.sessionHistory.length > 0}
                            <div class="relative">
                                <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <!-- // [P01] 补充历史搜索输入框的 aria-label 与无障碍标识 -->
                                <input
                                    type="text"
                                    bind:value={searchHistoryQuery}
                                    aria-label="搜索历史任务目标或参与智能体"
                                    placeholder="搜索历史任务目标..."
                                    class="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500"
                                />
                            </div>
                        {/if}
                    </div>

                    <!-- History List -->
                    {#if filteredHistory.length === 0}
                        <div class="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                            <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-500">
                                <History class="w-6 h-6" />
                            </div>
                            <div class="space-y-1">
                                <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {searchHistoryQuery ? "未找到匹配的历史记录" : "暂无已保存的运行历史"}
                                </p>
                                <p class="text-[11px] text-slate-400 max-w-[240px]">
                                    {searchHistoryQuery ? "请尝试其他关键词搜索" : "您在工作台运行的每一次多 Agent 协同任务都会自动持久化保存在此。"}
                                </p>
                            </div>
                        </div>
                    {:else}
                        <div class="space-y-2.5">
                            {#each filteredHistory as item (item.id)}
                                <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3.5 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 transition group">
                                    <div class="flex items-start justify-between gap-2 mb-1.5">
                                        <div class="font-semibold text-xs text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                                            {item.goal}
                                        </div>
                                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 {item.status === 'completed'
                                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                            : item.status === 'in_progress'
                                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}">
                                            {item.status === 'completed' ? '已完成' : item.status === 'in_progress' ? '进行中' : '已归档'}
                                        </span>
                                    </div>

                                    <!-- Meta Badges -->
                                    <div class="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mb-2.5">
                                        <span class="flex items-center gap-1 font-mono">
                                            <Clock class="w-3 h-3" />
                                            {formatTime(item.timestamp)}
                                        </span>
                                        {#if item.messageCount}
                                            <span>·</span>
                                            <span>{item.messageCount} 条消息</span>
                                        {/if}
                                        {#if item.roundCount}
                                            <span>·</span>
                                            <span>第 {item.roundCount} 轮</span>
                                        {/if}
                                    </div>

                                    <!-- Participant Agents -->
                                    {#if item.activeAgentNames && item.activeAgentNames.length > 0}
                                        <div class="flex flex-wrap items-center gap-1 mb-3">
                                            {#each item.activeAgentNames as name}
                                                <span class="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 font-medium">
                                                    {name}
                                                </span>
                                            {/each}
                                        </div>
                                    {/if}

                                    <!-- Action Buttons -->
                                    <div class="flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-2 text-xs">
                                        <button
                                            type="button"
                                            onclick={() => agentStore.loadHistoryItem(item)}
                                            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-semibold transition text-[11px] cursor-pointer"
                                        >
                                            <RotateCcw class="w-3 h-3" />
                                            <span>恢复此会话</span>
                                        </button>
                                        <div class="flex items-center gap-1">
                                            <!-- // [P02] 补充历史卡片复制按钮的 aria-label -->
                                            <button
                                                type="button"
                                                onclick={() => handleCopy(item.id, item.goal + (item.result ? `\n\n${item.result}` : ''))}
                                                class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
                                                aria-label="复制此历史任务摘要"
                                                title="复制摘要"
                                            >
                                                {#if copiedId === item.id}
                                                    <Check class="w-3.5 h-3.5 text-emerald-500" />
                                                {:else}
                                                    <Copy class="w-3.5 h-3.5" />
                                                {/if}
                                            </button>
                                            <!-- // [P02] 补充历史卡片删除按钮的 aria-label -->
                                            <button
                                                type="button"
                                                onclick={() => agentStore.deleteHistoryItem(item.id)}
                                                class="p-1 text-slate-400 hover:text-rose-500 rounded transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                                                aria-label="删除此条历史会话记录"
                                                title="删除记录"
                                            >
                                                <Trash2 class="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    </aside>
{/if}
