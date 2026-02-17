<script lang="ts">
    import { diagramStore } from "../lib/store.svelte";
    import {
        GitBranch,
        Network,
        Circle,
        Target,
        ArrowRight,
        ArrowDown,
        ArrowLeft,
        ArrowUp,
    } from "lucide-svelte";
    import { slide } from "svelte/transition";

    const engines = [
        {
            id: "dot",
            label: "Hierarchical",
            icon: GitBranch,
            desc: "Flowcharts, trees",
        },
        {
            id: "neato",
            label: "Network",
            icon: Network,
            desc: "Force-directed",
        },
        { id: "fdp", label: "Cluster", icon: Target, desc: "Large graphs" },
        { id: "twopi", label: "Radial", icon: Circle, desc: "Centered layout" },
        { id: "circo", label: "Circular", icon: Circle, desc: "Ring networks" },
    ] as const;

    const directions = [
        { id: "TB", label: "Top-Bottom", icon: ArrowDown },
        { id: "LR", label: "Left-Right", icon: ArrowRight },
        { id: "BT", label: "Bottom-Top", icon: ArrowUp },
        { id: "RL", label: "Right-Left", icon: ArrowLeft },
    ] as const;

    let isExpanded = $state(false);
</script>

{#if diagramStore.mode === "graphviz"}
    <div
        class="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2"
        transition:slide={{ duration: 200 }}
    >
        <!-- Collapsed Toggle -->
        <button
            class="px-3 py-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-full shadow-lg border border-gray-200/50 dark:border-gray-700/50 flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-all"
            onclick={() => (isExpanded = !isExpanded)}
        >
            <GitBranch size={14} class="text-indigo-500" />
            <span class="capitalize">{diagramStore.engine}</span>
            <span class="text-gray-400">|</span>
            <span>{diagramStore.layoutParams.rankdir}</span>
        </button>

        <!-- Expanded Panel -->
        {#if isExpanded}
            <div
                class="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 space-y-4 min-w-[280px]"
                transition:slide={{ duration: 200 }}
            >
                <!-- Layout Engine -->
                <div>
                    <h4
                        class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2"
                    >
                        Layout Engine
                    </h4>
                    <div class="grid grid-cols-5 gap-1.5">
                        {#each engines as eng}
                            <button
                                class="flex flex-col items-center gap-1 p-2 rounded-lg transition-all {diagramStore.engine ===
                                eng.id
                                    ? 'bg-indigo-500 text-white shadow-glow-sm'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}"
                                onclick={() => {
                                    diagramStore.setLayoutEngine(eng.id);
                                    isExpanded = false;
                                }}
                                title={eng.desc}
                            >
                                <eng.icon size={16} />
                                <span class="text-[9px] font-medium"
                                    >{eng.label.slice(0, 4)}</span
                                >
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- Direction -->
                <div>
                    <h4
                        class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2"
                    >
                        Direction
                    </h4>
                    <div class="flex gap-1.5">
                        {#each directions as dir}
                            <button
                                class="flex-1 flex items-center justify-center gap-1 p-2 rounded-lg transition-all {diagramStore
                                    .layoutParams.rankdir === dir.id
                                    ? 'bg-indigo-500 text-white shadow-glow-sm'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}"
                                onclick={() => {
                                    diagramStore.setDirection(dir.id);
                                    isExpanded = false;
                                }}
                                title={dir.label}
                            >
                                <dir.icon size={14} />
                            </button>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}
    </div>
{/if}
