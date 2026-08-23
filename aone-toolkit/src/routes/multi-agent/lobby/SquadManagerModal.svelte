<script lang="ts">
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { X, Check, Search, Brain, Shield, Zap, Users } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";
    import AgentCardV2 from "./AgentCardV2.svelte";

    // Props
    let {
        isOpen = false,
        selectedIds = [],
        save,
        close,
    } = $props<{
        isOpen: boolean;
        selectedIds: string[];
        save?: (ids: string[]) => void;
        close?: () => void;
    }>();

    // Local state for search
    let searchQuery = $state("");
    let localSelectedIds = $state<string[]>([]);

    // Update local state when prop changes
    $effect(() => {
        if (isOpen) {
            localSelectedIds = [...selectedIds];
        }
    });

    // Filter agents
    const coreAgentIds = [
        "decomposer",
        "calculator",
        "pathfinder",
        "stress_tester",
        "closer",
        "challenger",
        "evidence_scout",
        "synthesizer",
    ];

    let filteredAgents = $derived(
        agentStore.agents.filter(
            (a) =>
                a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.role.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );

    // Group agents
    let coreAgents = $derived(
        filteredAgents.filter((a) => coreAgentIds.includes(a.id)),
    );
    let customAgents = $derived(
        filteredAgents.filter((a) => !coreAgentIds.includes(a.id)),
    );

    let warningMessage = $state<string | null>(null);

    function toggleSelection(id: string) {
        warningMessage = null;
        if (localSelectedIds.includes(id)) {
            localSelectedIds = localSelectedIds.filter((aid) => aid !== id);
        } else {
            if (localSelectedIds.length >= 5) {
                warningMessage = "每个团队最多支持选择 5 位智能体。";
                setTimeout(() => { warningMessage = null; }, 3000);
                return;
            }
            localSelectedIds = [...localSelectedIds, id];
        }
    }

    function handleSave() {
        save?.(localSelectedIds);
    }

    function handleClose() {
        close?.();
    }

    // 快速场景包
    const scenarioPackages = [
        {
            id: 'career',
            name: '攻坚突击战队',
            icon: '💼',
            description: '拆局者 → 算账的 → 找路的 → 收网的',
            agents: ['decomposer', 'calculator', 'pathfinder', 'closer']
        },
        {
            id: 'decision',
            name: '重大决策审判战队',
            icon: '⚖️',
            description: '算账的 → 辩驳官 → 裁判官',
            agents: ['calculator', 'challenger', 'synthesizer']
        },
        {
            id: 'stuck',
            name: '敏捷破局战队',
            icon: '🔓',
            description: '拆局者 → 找路的 → 求证者 → 收网的',
            agents: ['decomposer', 'pathfinder', 'evidence_scout', 'closer']
        }
    ];

    function applyScenario(scenarioAgents: string[]) {
        localSelectedIds = scenarioAgents.slice(0, 5);
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        transition:fade={{ duration: 180 }}
    >
        <!-- Backdrop -->
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
        <div
            class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onclick={handleClose}
            role="presentation"
        ></div>

        <!-- Modal Card -->
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="squad-manager-title"
            class="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col z-10"
            transition:scale={{ start: 0.96, duration: 180 }}
        >
            <!-- Header -->
            <div
                class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400"
                    >
                        <Users class="w-5 h-5" />
                    </div>
                    <div>
                        <h2
                            class="text-base font-bold text-slate-900 dark:text-white"
                        >
                            协同小组阵容调配 (Manage Squad)
                        </h2>
                        <p class="text-xs text-slate-500 mt-0.5">
                            已激活 {localSelectedIds.length}/5 位协同专家
                        </p>
                    </div>
                </div>
                <button
                    onclick={handleClose}
                    class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    aria-label="关闭"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- Search & Toolbar -->
            <div
                class="px-6 py-3 bg-slate-50/70 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 shrink-0"
            >
                <div class="relative">
                    <Search
                        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                    />
                    <input
                        type="text"
                        bind:value={searchQuery}
                        placeholder="搜索智能体名称或职责..."
                        class="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 text-slate-900 dark:text-white"
                    />
                </div>
            </div>

            {#if warningMessage}
                <div class="mx-6 mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center justify-between" transition:fade>
                    <span>⚠️ {warningMessage}</span>
                    <button onclick={() => (warningMessage = null)} class="text-amber-500 hover:text-amber-700">
                        <X class="w-3.5 h-3.5" />
                    </button>
                </div>
            {/if}

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <!-- 快速场景包 -->
                <section>
                    <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Zap class="w-3.5 h-3.5 text-amber-500" />
                        快速预设战队阵容
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {#each scenarioPackages as scenario}
                            <button
                                onclick={() => applyScenario(scenario.agents)}
                                class="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all text-left group cursor-pointer shadow-2xs"
                            >
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="text-base">{scenario.icon}</span>
                                    <span class="font-bold text-slate-900 dark:text-white text-xs">{scenario.name}</span>
                                </div>
                                <p class="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                    {scenario.description}
                                </p>
                            </button>
                        {/each}
                    </div>
                </section>
                
                <!-- 分隔线 -->
                <div class="border-t border-slate-100 dark:border-slate-800"></div>
                
                <!-- Core Team -->
                {#if coreAgents.length > 0}
                    <section>
                        <h3
                            class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"
                        >
                            <Shield class="w-3.5 h-3.5 text-indigo-500" />
                            认知专家团队 (Cognitive Experts)
                        </h3>
                        <div
                            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5"
                        >
                            {#each coreAgents as agent (agent.id)}
                                <AgentCardV2
                                    {agent}
                                    isSelected={localSelectedIds.includes(
                                        agent.id,
                                    )}
                                    onselect={() => toggleSelection(agent.id)}
                                />
                            {/each}
                        </div>
                    </section>
                {/if}

                <!-- Custom Agents -->
                {#if customAgents.length > 0}
                    <section>
                        <h3
                            class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"
                        >
                            <Zap class="w-3.5 h-3.5 text-amber-500" />
                            自定义 Agent
                        </h3>
                        <div
                            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5"
                        >
                            {#each customAgents as agent (agent.id)}
                                <AgentCardV2
                                    {agent}
                                    isSelected={localSelectedIds.includes(
                                        agent.id,
                                    )}
                                    onselect={() => toggleSelection(agent.id)}
                                    ondelete={() => {
                                        if (confirm("确定删除此自定义 Agent 吗？")) {
                                            agentStore.removeCustomAgent(
                                                agent.id,
                                            );
                                        }
                                    }}
                                />
                            {/each}
                        </div>
                    </section>
                {/if}

                {#if filteredAgents.length === 0}
                    <div
                        class="flex flex-col items-center justify-center py-12 text-slate-400"
                    >
                        <Search class="w-10 h-10 mb-3 opacity-40" />
                        <p class="text-xs">未找到匹配的智能体</p>
                    </div>
                {/if}
            </div>

            <!-- Footer -->
            <div
                class="px-6 py-3.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center gap-2.5 z-10 shrink-0"
            >
                <button
                    onclick={handleClose}
                    class="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                    取消
                </button>
                <button
                    onclick={handleSave}
                    disabled={localSelectedIds.length === 0}
                    class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                    确认选择 ({localSelectedIds.length})
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(156, 163, 175, 0.3);
        border-radius: 20px;
    }
</style>
