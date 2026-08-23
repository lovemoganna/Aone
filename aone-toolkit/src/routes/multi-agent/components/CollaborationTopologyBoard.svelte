<script lang="ts">
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import AgentAvatar from "$lib/components/ui/AgentAvatar.svelte";
    import {
        Activity,
        ArrowRight,
        Bot,
        CheckCircle2,
        ChevronDown,
        ChevronUp,
        Clock,
        FileCheck,
        GitBranch,
        GitCommit,
        Layers,
        Loader2,
        Network,
        Route,
        ShieldAlert,
        Sparkles,
        Swords,
        Zap,
        Eye
    } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";
    import { getAgentMeta } from "$lib/constants/cognitiveAgents";

    let { inDrawer = false }: { inDrawer?: boolean } = $props();

    let isExpanded = $state(true);

    function getMeta(id: string) {
        const meta = getAgentMeta(id);
        return {
            name: meta.alias,
            roleTitle: meta.roleTitle,
            color: meta.colorClasses.text,
            borderLight: meta.colorClasses.borderLight,
            borderDark: meta.colorClasses.borderDark,
            bgLight: meta.colorClasses.bgLight,
            bgDark: meta.colorClasses.bgDark,
            inputSource: meta.topology.inputSource,
            mission: meta.topology.mission,
            deliverable: meta.topology.deliverable,
            activeAction: meta.topology.activeAction,
        };
    }

    let activeAgentIds = $derived(agentStore.currentSession.activeAgentIds);
    let pipelineState = $derived(agentStore.pipelineState);
    let currentRunningAgentId = $derived(pipelineState.currentAgentId);
    let isRunning = $derived(pipelineState.isRunning || agentStore.metaFlowIsRunning);
    let isThinking = $derived(agentStore.isThinking);

    // Get ordered steps if available, or default to active agents sequence
    let nodes = $derived.by(() => {
        const list: { id: string; status: 'standby' | 'running' | 'completed' | 'contested'; durationMs?: number }[] = [];
        
        if (pipelineState.collaborationSteps && pipelineState.collaborationSteps.length > 0) {
            for (const step of pipelineState.collaborationSteps) {
                list.push({
                    id: step.agentId,
                    status: step.status === 'running' ? 'running' : step.status === 'completed' ? 'completed' : 'standby',
                    durationMs: step.durationMs,
                });
            }
        } else {
            for (const id of activeAgentIds) {
                const isCurrent = isRunning && currentRunningAgentId === id;
                list.push({
                    id,
                    status: isCurrent ? 'running' : 'standby',
                });
            }
        }
        return list;
    });

    let currentActionText = $derived.by(() => {
        if (!isRunning && !isThinking) return "当前小队处于就绪待命状态，输入任务即可启动全链路协同攻坚。";
        if (currentRunningAgentId) {
            const meta = getMeta(currentRunningAgentId);
            return `${meta.name} (${meta.roleTitle})：${meta.activeAction}`;
        }
        return "多 Agent 正在协同解析任务意图与编排最优执行路线...";
    });

    function scrollToAgentMessage(agentId: string) {
        const msgElement = document.querySelector(`[data-agent-id="${agentId}"]`);
        if (msgElement) {
            msgElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }
</script>

<div class="{inDrawer ? 'space-y-3' : 'mx-4 mt-3 rounded-3xl border border-indigo-200/80 bg-gradient-to-b from-white/95 via-indigo-50/30 to-white/95 shadow-lg backdrop-blur-xl dark:border-indigo-900/60 dark:from-slate-900/95 dark:via-indigo-950/20 dark:to-slate-900/95'} overflow-hidden transition-all">
    <!-- Header Bar with Toggle (Only when not in drawer or needed) -->
    <div class="flex items-center justify-between {inDrawer ? 'p-1' : 'px-4 py-3 border-b border-indigo-100/80 dark:border-indigo-950/60 bg-white/40 dark:bg-slate-900/40'}">
        <div class="flex items-center gap-2.5">
            <div class="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <Network class="h-4 w-4" />
            </div>
            <div>
                <div class="flex items-center gap-2">
                    <span class="text-xs font-extrabold text-slate-900 dark:text-white tracking-wide">
                        小队分工与协作机制全景看板
                    </span>
                    <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                        <ShieldAlert class="h-2.5 w-2.5" />
                        MECE 透明机制
                    </span>
                </div>
                {#if !inDrawer}
                    <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span>清晰展示各 Agent 职责定位、上下游交接与即时执行动态</span>
                    </div>
                {/if}
            </div>
        </div>

        <div class="flex items-center gap-2">
            {#if isRunning}
                <div class="flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 animate-pulse">
                    <Loader2 class="h-3 w-3 animate-spin" />
                    <span>推演中</span>
                </div>
            {/if}

            {#if !inDrawer}
                <button
                    onclick={() => (isExpanded = !isExpanded)}
                    class="flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
                    aria-label={isExpanded ? "收起拓扑图" : "展开拓扑图"}
                >
                    <span>{isExpanded ? "收起" : "展开"}</span>
                    {#if isExpanded}
                        <ChevronUp class="h-3.5 w-3.5" />
                    {:else}
                        <ChevronDown class="h-3.5 w-3.5" />
                    {/if}
                </button>
            {/if}
        </div>
    </div>

    <!-- Real-time Action Cockpit Bar -->
    <div class="flex items-center gap-2.5 px-3.5 py-2 bg-indigo-50/60 dark:bg-indigo-950/30 text-xs rounded-2xl border border-indigo-100/60 dark:border-indigo-950/40">
        <Activity class="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 {isRunning ? 'animate-bounce' : ''}" />
        <span class="font-bold text-indigo-950 dark:text-indigo-200 shrink-0">实时态势：</span>
        <span class="text-slate-700 dark:text-slate-300 truncate font-medium">{currentActionText}</span>
    </div>

    <!-- Expanded Topology & Flow Visualizer -->
    {#if isExpanded || inDrawer}
        <div class="{inDrawer ? 'space-y-3 pt-1' : 'p-4 space-y-4'}" transition:slide={{ duration: 200 }}>
            <!-- Step-by-Step Data Flow Handover Line -->
            <div class="flex flex-col gap-2.5">
                <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Route class="h-3.5 w-3.5" />
                    协同交接链路 ({nodes.length} 位专家)
                </div>

                <div class="grid {inDrawer ? 'grid-cols-1 gap-2.5' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'}">
                    {#each nodes as node, index}
                        {@const meta = getMeta(node.id)}
                        {@const isCurrent = isRunning && currentRunningAgentId === node.id}
                        {@const isCompleted = node.status === 'completed'}
                        
                        <div
                            class="relative flex flex-col justify-between rounded-2xl border p-3 transition-all {isCurrent ? 'ring-2 ring-indigo-500 shadow-md bg-white dark:bg-slate-900 border-indigo-400 dark:border-indigo-600' : `${meta.borderLight} ${meta.borderDark} ${meta.bgLight} ${meta.bgDark}`}"
                        >
                            <!-- Top: Step Index & Status Badge -->
                            <div class="flex items-center justify-between gap-2 mb-2">
                                <div class="flex items-center gap-2">
                                    <span class="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-[10px] font-black text-white dark:text-slate-900 shrink-0">
                                        {index + 1}
                                    </span>
                                    <span class="text-xs font-extrabold {meta.color} truncate">
                                        {meta.name}
                                    </span>
                                </div>

                                <div class="flex items-center gap-1">
                                    {#if isCurrent}
                                        <span class="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-bold text-white animate-pulse">
                                            <Loader2 class="h-2.5 w-2.5 animate-spin" />
                                            推演中
                                        </span>
                                    {:else if isCompleted}
                                        <span class="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                                            <CheckCircle2 class="h-2.5 w-2.5" />
                                            已交付
                                        </span>
                                    {:else}
                                        <span class="inline-flex items-center gap-1 rounded-full bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 text-[9px] font-semibold text-slate-600 dark:text-slate-400">
                                            <Clock class="h-2.5 w-2.5" />
                                            待命中
                                        </span>
                                    {/if}
                                </div>
                            </div>

                            <!-- Middle: Avatar & Mission Details -->
                            <div class="flex items-start gap-2.5 my-1">
                                <div class="w-9 h-9 shrink-0">
                                    <AgentAvatar agent={node.id} size="sm" shape="rounded" glow={isCurrent} />
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                                        {meta.roleTitle}
                                    </div>
                                    <div class="text-[10px] leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
                                        {meta.mission}
                                    </div>
                                </div>
                            </div>

                            <!-- Bottom: Handover Provenance -->
                            <div class="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1 text-[10px]">
                                <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 gap-2">
                                    <span class="font-bold shrink-0">📥 来源：</span>
                                    <span class="truncate font-medium text-slate-700 dark:text-slate-300">{meta.inputSource}</span>
                                </div>
                                <div class="flex items-center justify-between text-slate-500 dark:text-slate-400 gap-2">
                                    <span class="font-bold shrink-0">📤 交付：</span>
                                    <span class="truncate font-semibold {meta.color}">{meta.deliverable}</span>
                                </div>
                            </div>

                            <!-- Click to Locate Message Button -->
                            {#if isCompleted}
                                <button
                                    onclick={() => scrollToAgentMessage(node.id)}
                                    class="mt-2 w-full flex items-center justify-center gap-1 py-1 rounded-lg bg-white/80 dark:bg-slate-800/80 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 shadow-xs transition"
                                >
                                    <Eye class="h-3 w-3" />
                                    定位输出消息
                                </button>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Bottom Protocol Explanation Footer -->
            <div class="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-indigo-100 dark:border-indigo-950/60 text-[11px] text-slate-600 dark:text-slate-400">
                <div class="flex items-start gap-2">
                    <Sparkles class="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <span class="leading-relaxed"><strong>协作契约：</strong>各 Agent 严格遵循输入输出标准化契约，上游输出经过攻防审查与质检后才被下游采纳。</span>
                </div>
            </div>
        </div>
    {/if}
</div>
