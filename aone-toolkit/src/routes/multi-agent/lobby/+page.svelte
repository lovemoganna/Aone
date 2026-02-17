<script lang="ts">
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { goto } from "$app/navigation";
    import {
        Code,
        Map as Sitemap,
        ShieldCheck,
        Briefcase,
        Wallet,
        Heart,
        HelpCircle,
        Users,
        Bot,
        CheckCircle2,
        ArrowRight,
        Plus,
    } from "lucide-svelte";
    import type { ComponentType } from "svelte";
    import { fade, scale } from "svelte/transition";
    import SquadManagerModal from "./SquadManagerModal.svelte";

    const iconMap: Record<string, ComponentType> = {
        code: Code,
        sitemap: Sitemap,
        "shield-check": ShieldCheck,
        briefcase: Briefcase,
        wallet: Wallet,
        heart: Heart,
        "help-circle": HelpCircle,
        users: Users,
        default: Bot,
    };

    function getIcon(name: string) {
        return iconMap[name] || iconMap.default;
    }

    let selectedAgentIds = $state<string[]>([]);
    let goal = $state("");

    function toggleAgent(id: string) {
        if (selectedAgentIds.includes(id)) {
            selectedAgentIds = selectedAgentIds.filter((aid) => aid !== id);
        } else {
            if (selectedAgentIds.length >= 5) {
                alert("每个团队最多 5 位智能体。");
                return;
            }
            selectedAgentIds = [...selectedAgentIds, id];
        }
    }

    function handleStartSession() {
        if (selectedAgentIds.length === 0) return;

        // Initialize Session
        agentStore.clearSession();
        agentStore.currentSession.activeAgentIds = selectedAgentIds;
        agentStore.pipelineState.currentGoal = goal;

        // Add initial system message
        agentStore.addMessage(
            "system",
            `会话已开始，共 ${selectedAgentIds.length} 位智能体。`,
        );

        // Navigate to Chat
        goto("/multi-agent");

        // Optional: Trigger initial AI thought if goal is provided
        if (goal) {
            agentStore.addMessage("user", goal);
            agentStore.runMetaFlow(goal);
        }
    }

    let canStart = $derived(selectedAgentIds.length > 0);
    let isManagerOpen = $state(false);

    function handleSquadSave(e: CustomEvent<string[]>) {
        selectedAgentIds = e.detail;
        isManagerOpen = false;
    }
</script>

<div class="min-h-screen bg-slate-50 dark:bg-black font-sans flex flex-col">
    <!-- Header -->
    <header
        class="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10"
    >
        <div class="flex items-center gap-3">
            <div
                class="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20"
            >
                <Users class="w-5 h-5 text-white" />
            </div>
            <h1 class="text-lg font-bold text-slate-900 dark:text-white">
                组建您的团队
            </h1>
        </div>
        <div class="flex items-center gap-4">
            <button
                onclick={() => (isManagerOpen = true)}
                class="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
                <Users class="w-4 h-4" />
                管理团队
            </button>
            <a
                href="/agent-studio"
                class="px-4 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
                <Plus class="w-4 h-4" />
                新建智能体
            </a>
        </div>
    </header>

    <SquadManagerModal
        isOpen={isManagerOpen}
        selectedIds={selectedAgentIds}
        on:close={() => (isManagerOpen = false)}
        on:save={handleSquadSave}
    />

    <div
        class="flex-1 max-w-5xl mx-auto w-full p-6 lg:p-10 flex flex-col gap-8"
    >
        <!-- Instruction -->
        <div class="text-center space-y-2">
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white">
                今天需要谁的帮助？
            </h2>
            <p class="text-slate-500 dark:text-slate-400">
                选择最多 5 位专家组成您的顾问委员会。
            </p>
        </div>

        <!-- Agent Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each agentStore.agents as agent (agent.id)}
                {@const Icon = getIcon(agent.avatar)}
                {@const isSelected = selectedAgentIds.includes(agent.id)}

                <button
                    class="relative p-4 rounded-2xl border-2 text-left transition-all duration-200 group
                    {isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-md shadow-indigo-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm'}"
                    onclick={() => toggleAgent(agent.id)}
                >
                    <div class="flex items-start justify-between mb-2">
                        <div
                            class="w-10 h-10 rounded-xl {agent.color} flex items-center justify-center shadow-sm"
                        >
                            <Icon class="w-5 h-5 text-white" />
                        </div>
                        {#if isSelected}
                            <div
                                class="text-indigo-600 dark:text-indigo-400"
                                transition:scale
                            >
                                <CheckCircle2 class="w-6 h-6 fill-current" />
                            </div>
                        {/if}
                    </div>

                    <h3 class="font-bold text-slate-900 dark:text-white mb-1">
                        {agent.name}
                    </h3>
                    <p
                        class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2"
                    >
                        {agent.role}
                    </p>

                    <!-- Mini Stats -->
                    {#if agent.personaConfig}
                        <div
                            class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/50 grid grid-cols-3 gap-1"
                        >
                            {#each [["Rat", agent.personaConfig.rationality], ["Cre", agent.personaConfig.creativity], ["Emp", agent.personaConfig.empathy]] as [label, val]}
                                <div class="flex flex-col gap-1">
                                    <div
                                        class="flex justify-between items-end text-[8px] font-mono text-slate-400"
                                    >
                                        <span>{label}</span>
                                        <span>{val}</span>
                                    </div>
                                    <div
                                        class="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
                                    >
                                        <div
                                            class="h-full rounded-full {Number(
                                                val,
                                            ) >= 8
                                                ? 'bg-violet-500'
                                                : Number(val) >= 5
                                                  ? 'bg-indigo-500'
                                                  : 'bg-slate-400'}"
                                            style="width: {Number(val) * 10}%"
                                        ></div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </button>
            {/each}
        </div>

        <!-- Footer / Start Action -->
        <div class="sticky bottom-6 mt-auto">
            <div
                class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl shadow-slate-200/50 dark:shadow-black/50 flex flex-col sm:flex-row items-center gap-4"
            >
                <input
                    type="text"
                    bind:value={goal}
                    placeholder="选填：您在想什么？（例如：“我对职业发展感到困惑”）"
                    class="flex-1 w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                />

                <button
                    onclick={handleStartSession}
                    disabled={!canStart}
                    class="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                    <span>开始会话</span>
                    <ArrowRight
                        class="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    />
                </button>
            </div>
            <div class="text-center mt-2 text-xs text-slate-400">
                已选择 {selectedAgentIds.length} 位智能体
            </div>
        </div>
    </div>
</div>
