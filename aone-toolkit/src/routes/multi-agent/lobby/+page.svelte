<script lang="ts">
    import { goto } from "$app/navigation";
    import { tick } from "svelte";
    import { fade } from "svelte/transition";
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { settingsStore } from "$lib/stores/settingsStore.svelte";
    import {
        ArrowRight,
        Bot,
        CheckCircle2,
        Info,
        Plus,
        Settings2,
        Users,
        Sparkles,
        AlertTriangle
    } from "lucide-svelte";
    import SquadManagerModal from "./SquadManagerModal.svelte";
    import { getAgentDisplayName, getAgentMeta, getAgentAlias } from "$lib/constants/cognitiveAgents";

    let selectedAgentIds = $state<string[]>(["decomposer", "calculator", "pathfinder", "stress_tester", "closer"]);
    let goal = $state("");
    let isManagerOpen = $state(false);
    let errorMessage = $state<string | null>(null);
    let warningMessage = $state<string | null>(null);
    let canStart = $derived(selectedAgentIds.length > 0);

    function toggleAgent(id: string) {
        if (selectedAgentIds.includes(id)) {
            selectedAgentIds = selectedAgentIds.filter((agentId) => agentId !== id);
            warningMessage = null;
        } else {
            if (selectedAgentIds.length >= 5) {
                warningMessage = "协同小队最多同时支持激活 5 位认知专家。请先取消勾选其他角色。";
                setTimeout(() => { warningMessage = null; }, 3000);
                return;
            }
            selectedAgentIds = [...selectedAgentIds, id];
            warningMessage = null;
        }
    }

    function startWorkbench() {
        if (!canStart) return;
        agentStore.clearSession();
        agentStore.currentSession.activeAgentIds = [...selectedAgentIds];
        agentStore.pipelineState.currentGoal = goal.trim();
        goto("/multi-agent");
    }

    async function startWorkbenchAndRun() {
        if (!canStart) return;
        if (!settingsStore.isConfigured) {
            errorMessage = "请先配置大模型 API Key（可在工作台右上角或设置中配置）后再启动推演。";
            return;
        }
        errorMessage = null;

        const task = goal.trim();
        agentStore.clearSession();
        agentStore.currentSession.activeAgentIds = [...selectedAgentIds];
        agentStore.pipelineState.currentGoal = task;
        if (task) {
            agentStore.addMessage("user", task);
        }
        await goto("/multi-agent");
        await tick();
        if (task) {
            await agentStore.runSquadCollaboration(task);
        }
    }

    function handleSquadSave(ids: string[]) {
        selectedAgentIds = ids;
        isManagerOpen = false;
    }
</script>

<svelte:head>
    <title>小队快速组装大厅 - Aone Toolkit</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 px-4 py-6 dark:bg-slate-950" in:fade={{ duration: 180 }}>
    <div class="mx-auto flex max-w-6xl flex-col gap-6">
        <!-- Top Guided Banner -->
        <header class="rounded-3xl border border-indigo-200/80 bg-white/95 p-6 shadow-xs dark:border-indigo-900/50 dark:bg-slate-900/90 backdrop-blur-md">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div class="flex items-start gap-3.5">
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
                        <Sparkles class="h-5 w-5" />
                    </div>
                    <div>
                        <div class="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">快速组队入口 (Quick Selection)</div>
                        <h1 class="mt-1 text-xl font-bold text-slate-900 dark:text-white">协同小队快速启动大厅</h1>
                        <p class="mt-1.5 max-w-3xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                            选择您攻坚任务所需的 1~5 位专家角色，点击即可直接载入多 Agent 协同工作台开启推演。如需深度定制角色或图形化连线，请前往 Agent 工作坊。
                        </p>
                    </div>
                </div>
                <div class="flex flex-wrap items-center gap-2.5 shrink-0">
                    <a href="/agent-studio/orchestration" class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                        <Users class="h-3.5 w-3.5 text-indigo-500" />
                        编排中心
                    </a>
                    <a href="/multi-agent" class="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 shadow-xs cursor-pointer active:scale-95">
                        进入工作台
                        <ArrowRight class="h-3.5 w-3.5" />
                    </a>
                </div>
            </div>
        </header>

        <!-- Agent Selection Grid -->
        <section class="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div class="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div>
                    <h2 class="text-base font-bold text-slate-900 dark:text-white">选择协同专家阵容</h2>
                    <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">最多可勾选 5 位专家共同推演（当前已选 {selectedAgentIds.length}/5 位）</p>
                </div>
                <button
                    onclick={() => (isManagerOpen = true)}
                    class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                    <Settings2 class="h-3.5 w-3.5 text-indigo-500" />
                    阵容管理器
                </button>
            </div>

            {#if warningMessage}
                <div class="mb-4 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-2.5 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 shadow-xs">
                    <AlertTriangle class="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>{warningMessage}</span>
                </div>
            {/if}

            {#if errorMessage}
                <div class="mb-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-2.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200 shadow-xs">
                    <AlertTriangle class="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>{errorMessage}</span>
                </div>
            {/if}

            <div class="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
                {#each agentStore.agents as agent (agent.id)}
                    {@const selected = selectedAgentIds.includes(agent.id)}
                    {@const meta = getAgentMeta(agent.id)}
                    <button
                        onclick={() => toggleAgent(agent.id)}
                        class="rounded-2xl border p-4 text-left transition-all cursor-pointer {selected ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500/20' : 'border-slate-200/80 bg-slate-50/50 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-indigo-800'}"
                    >
                        <div class="flex items-start justify-between gap-3">
                            <div class="flex items-start gap-3 min-w-0">
                                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-2xs">
                                    <Bot class="h-4.5 w-4.5" />
                                </div>
                                <div class="min-w-0">
                                    <h3 class="font-bold text-xs text-slate-900 dark:text-white truncate">{getAgentDisplayName(agent.id, agent.name)}</h3>
                                    <p class="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{meta?.description || agent.role}</p>
                                </div>
                            </div>
                            {#if selected}
                                <CheckCircle2 class="h-4.5 w-4.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                            {/if}
                        </div>
                    </button>
                {/each}
            </div>
        </section>

        <!-- Sticky Launch Action Bar -->
        <section class="sticky bottom-4 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div class="flex min-w-[160px] items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Users class="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    已激活 {selectedAgentIds.length}/5 位专家
                </div>
                <input
                    bind:value={goal}
                    class="min-h-[40px] flex-1 rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2 text-xs outline-none transition focus:border-slate-400 dark:focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="输入本轮需要攻坚的目标或命题（可选，直接带入工作台）..."
                />
                <div class="flex items-center gap-2">
                    <button
                        onclick={startWorkbench}
                        disabled={!canStart}
                        class="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                        载入工作台
                    </button>
                    <button
                        onclick={startWorkbenchAndRun}
                        disabled={!canStart}
                        class="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 shadow-xs transition cursor-pointer active:scale-95"
                    >
                        立即开始推演
                        <ArrowRight class="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </section>
    </div>
</div>

<SquadManagerModal
    isOpen={isManagerOpen}
    selectedIds={selectedAgentIds}
    close={() => (isManagerOpen = false)}
    save={(ids: string[]) => handleSquadSave(ids)}
/>
