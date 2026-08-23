<script lang="ts">
    import { goto } from "$app/navigation";
    import { tick } from "svelte";
    import { fade } from "svelte/transition";
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { settingsStore } from "$lib/stores/settingsStore.svelte";
    import { AgentAvatar } from "$lib/components/ui";
    import {
        ArrowRight,
        Bot,
        CheckCircle2,
        MessageCircle,
        RefreshCw,
        Route,
        Users,
        Sparkles,
        AlertTriangle
    } from "lucide-svelte";
    import { getAgentDisplayName, getAgentAlias, SQUAD_PRESETS } from "$lib/constants/cognitiveAgents";

    const roundtablePreset = SQUAD_PRESETS.find(p => p.id === 'preset_five_dimensional_roundtable') || SQUAD_PRESETS[3];
    const roundtableAgentIds = roundtablePreset.agentIds;

    let task = $state("");
    let errorMessage = $state<string | null>(null);

    let roundtableAgents = $derived(
        roundtableAgentIds
            .map((id) => agentStore.getAgent(id))
            .filter((agent): agent is NonNullable<ReturnType<typeof agentStore.getAgent>> => Boolean(agent)),
    );

    function openWorkbench() {
        agentStore.clearSession();
        agentStore.currentSession.activeAgentIds = [...roundtableAgentIds];
        agentStore.pipelineState.currentGoal = task.trim();
        goto("/multi-agent");
    }

    async function runInWorkbench() {
        if (!settingsStore.isConfigured) {
            errorMessage = "请先配置大模型 API Key（右上角齿轮设置）后再启动推演。";
            return;
        }
        errorMessage = null;

        const goal = task.trim();
        agentStore.clearSession();
        agentStore.currentSession.activeAgentIds = [...roundtableAgentIds];
        agentStore.pipelineState.currentGoal = goal;
        if (goal) {
            agentStore.addMessage("user", goal);
        }
        await goto("/multi-agent");
        await tick();
        if (goal) {
            await agentStore.runSquadCollaboration(goal);
        }
    }
</script>

<svelte:head>
    <title>经典圆桌协同入口 - Aone Toolkit</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 px-4 py-6 dark:bg-slate-950" in:fade={{ duration: 180 }}>
    <div class="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main class="space-y-6">
            <!-- Top Banner -->
            <section class="rounded-3xl border border-indigo-200/80 bg-white/95 p-6 shadow-xs dark:border-indigo-900/50 dark:bg-slate-900/90 backdrop-blur-md">
                <div class="mb-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                    <Sparkles class="h-3 w-3" />
                    五维经典认知圆桌
                </div>
                <h1 class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">经典 5 专家圆桌推演</h1>
                <p class="mt-2 max-w-2xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    圆桌模式聚合了结构拆解、量化精算、破局创新、极限风控与敏捷执行五维核心能力。点击即可直接将该预设专家团队载入协同工作台。
                </p>
                <div class="mt-4 flex flex-wrap gap-2.5">
                    <a href="/multi-agent" class="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 shadow-xs cursor-pointer active:scale-95">
                        打开工作台
                        <ArrowRight class="h-3.5 w-3.5" />
                    </a>
                    <a href="/agent-studio/orchestration" class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                        管理协同阵容
                    </a>
                </div>
            </section>

            <!-- Active Roster Card -->
            <section class="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div class="flex items-start gap-3.5 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-2xs">
                        <MessageCircle class="h-5 w-5" />
                    </div>
                    <div>
                        <h2 class="text-sm font-bold text-slate-900 dark:text-white">经典专家阵容架构</h2>
                        <p class="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                            五位一体的认知协作矩阵，覆盖从问题拆解到最终交付全生命周期：
                        </p>
                    </div>
                </div>

                <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {#each roundtableAgents as agent}
                        <article class="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                            <div class="flex items-start gap-2.5">
                                <AgentAvatar agent={agent.id} size="sm" shape="rounded" glow={false} />
                                <div class="min-w-0 flex-1">
                                    <h3 class="font-bold text-xs text-slate-900 dark:text-white truncate">{getAgentDisplayName(agent.id, agent.name)}</h3>
                                    <p class="mt-0.5 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{agent.role}</p>
                                </div>
                            </div>
                        </article>
                    {/each}
                </div>
            </section>
        </main>

        <!-- Right Side Launch Panel -->
        <aside class="space-y-6">
            <div class="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <h2 class="text-sm font-bold text-slate-900 dark:text-white">快速启动推演</h2>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">输入您的攻坚任务并带入工作台执行</p>

                <div class="mt-4 space-y-3">
                    <textarea
                        bind:value={task}
                        rows="4"
                        class="w-full rounded-2xl border border-slate-200/80 bg-slate-50 p-3 text-xs outline-none transition focus:border-slate-400 dark:focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white resize-none"
                        placeholder="例如：评估是否应该重构当前核心微服务架构为单体应用..."
                    ></textarea>

                    {#if errorMessage}
                        <div class="flex items-start gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                            <AlertTriangle class="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                            <span>{errorMessage}</span>
                        </div>
                    {/if}

                    <div class="flex flex-col gap-2">
                        <button
                            onclick={runInWorkbench}
                            class="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-500 shadow-xs cursor-pointer active:scale-95"
                        >
                            启动圆桌推演
                            <ArrowRight class="h-3.5 w-3.5" />
                        </button>
                        <button
                            onclick={openWorkbench}
                            class="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                        >
                            直接载入工作台
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    </div>
</div>
