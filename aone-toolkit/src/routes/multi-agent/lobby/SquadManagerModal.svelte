<script lang="ts">
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { X, Check, Search, Brain, Shield, Zap, Users } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";
    import { createEventDispatcher } from "svelte";
    import type { Agent } from "$lib/stores/agentStore.svelte";
    import AgentCardV2 from "./AgentCardV2.svelte";

    // Props
    let {
        isOpen = false,
        selectedIds = [],
        onsave,
        onclose,
    } = $props<{
        isOpen: boolean;
        selectedIds: string[];
        onsave?: (ids: string[]) => void;
        onclose?: () => void;
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
    let filteredAgents = $derived(
        agentStore.agents.filter(
            (a) =>
                a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.role.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );

    // Group agents
    let coreAgents = $derived(
        filteredAgents.filter((a) =>
            [
                "decomposer",
                "calculator",
                "pathfinder",
                "stress_tester",
                "closer",
            ].includes(a.id),
        ),
    );
    let customAgents = $derived(
        filteredAgents.filter(
            (a) =>
                ![
                    "decomposer",
                    "calculator",
                    "pathfinder",
                    "stress_tester",
                    "closer",
                ].includes(a.id),
        ),
    );

    function toggleSelection(id: string) {
        if (localSelectedIds.includes(id)) {
            localSelectedIds = localSelectedIds.filter((aid) => aid !== id);
        } else {
            if (localSelectedIds.length >= 5) {
                alert("每个团队最多 5 位智能体。");
                return;
            }
            localSelectedIds = [...localSelectedIds, id];
        }
    }

    function handleSave() {
        onsave?.(localSelectedIds);
        handleClose();
    }

    function handleClose() {
        onclose?.();
    }

    function getStatColor(val: number) {
        if (val >= 8) return "bg-violet-500";
        if (val >= 5) return "bg-indigo-500";
        return "bg-slate-400";
    }
    
    // 快速场景包
    const scenarioPackages = [
        {
            id: 'career',
            name: '职业转型',
            icon: '💼',
            description: '拆局者 → 算账的 → 找路的 → 收网的',
            agents: ['decomposer', 'calculator', 'pathfinder', 'closer']
        },
        {
            id: 'decision',
            name: '重大决策',
            icon: '⚖️',
            description: '算账的 → 兜底的 → 收网的',
            agents: ['calculator', 'stress_tester', 'closer']
        },
        {
            id: 'stuck',
            name: '破局',
            icon: '🔓',
            description: '拆局者 → 找路的 → 收网的',
            agents: ['decomposer', 'pathfinder', 'closer']
        }
    ];
    
    function applyScenario(scenarioAgents: string[]) {
        localSelectedIds = scenarioAgents.slice(0, 5);
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        transition:fade={{ duration: 200 }}
    >
        <!-- Backdrop -->
        <div
            class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onclick={handleClose}
            role="button"
            tabindex="0"
            onkeydown={(e) => e.key === "Escape" && handleClose()}
        ></div>

        <!-- Modal -->
        <div
            class="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            transition:scale={{ start: 0.95, duration: 200 }}
        >
            <!-- Header -->
            <div
                class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600 dark:text-violet-400"
                    >
                        <Users class="w-5 h-5" />
                    </div>
                    <div>
                        <h2
                            class="text-lg font-bold text-slate-900 dark:text-white"
                        >
                            管理团队 (Manage Squad)
                        </h2>
                        <p class="text-xs text-slate-500">
                            已选择 {localSelectedIds.length}/5 位智能体
                        </p>
                    </div>
                </div>
                <button
                    onclick={handleClose}
                    class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- Search & Toolbar -->
            <div
                class="px-6 py-3 bg-slate-50/50 dark:bg-black/20 border-b border-slate-100 dark:border-slate-800"
            >
                <div class="relative">
                    <Search
                        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                    />
                    <input
                        type="text"
                        bind:value={searchQuery}
                        placeholder="搜索智能体..."
                        class="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                </div>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <!-- 快速场景包 -->
                <section>
                    <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Zap class="w-3 h-3" />
                        快速场景包
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {#each scenarioPackages as scenario}
                            <button
                                onclick={() => applyScenario(scenario.agents)}
                                class="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all text-left group"
                            >
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="text-lg">{scenario.icon}</span>
                                    <span class="font-medium text-slate-900 dark:text-white text-sm">{scenario.name}</span>
                                </div>
                                <p class="text-xs text-slate-500 dark:text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400">
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
                            class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"
                        >
                            <Shield class="w-3 h-3" />
                            核心团队 (Core Team)
                        </h3>
                        <div
                            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
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
                            class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"
                        >
                            <Zap class="w-3 h-3" />
                            自定义 (Custom)
                        </h3>
                        <div
                            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {#each customAgents as agent (agent.id)}
                                <AgentCardV2
                                    {agent}
                                    isSelected={localSelectedIds.includes(
                                        agent.id,
                                    )}
                                    onselect={() => toggleSelection(agent.id)}
                                    ondelete={() => {
                                        if (confirm("Delete custom agent?")) {
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
                        <Search class="w-12 h-12 mb-4 opacity-50" />
                        <p>未找到匹配的智能体</p>
                    </div>
                {/if}
            </div>

            <!-- Footer -->
            <div
                class="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 z-10"
            >
                <button
                    onclick={handleClose}
                    class="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                    取消
                </button>
                <button
                    onclick={handleSave}
                    disabled={localSelectedIds.length === 0}
                    class="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
