<script lang="ts">
    import { diagramStore } from "../lib/store.svelte";
    import PropertyRow from "./PropertyRow.svelte";
    import AIExplainer from "./AIExplainer.svelte";
    import { injectBatchColor, injectBatchShape } from "../lib/modifier";
    import {
        X,
        Search,
        Eye,
        Info,
        Network,
        Box,
        Layers,
        Trash2,
        MousePointer2,
        Palette,
        Sliders
    } from "lucide-svelte";
    import { slide } from "svelte/transition";

    let { isPinned = $bindable(false) } = $props<{
        isPinned: boolean;
    }>();

    let activeTab = $state<"props" | "ai" | "palettes">("props");

    let isBatchMode = $derived(diagramStore.multiSelection.length > 1);

    function applyColor(color: string) {
        if (isBatchMode) {
            diagramStore.code = injectBatchColor(
                diagramStore.code,
                diagramStore.multiSelection,
                color,
                diagramStore.mode
            );
            diagramStore.render();
        } else if (diagramStore.selectedElementId) {
            diagramStore.updateElementProperty("color", color);
            diagramStore.render();
        }
    }

    function applyShape(shape: string) {
        if (!shape) return;
        if (isBatchMode) {
            diagramStore.code = injectBatchShape(
                diagramStore.code,
                diagramStore.multiSelection,
                shape,
                diagramStore.mode
            );
            diagramStore.render();
        } else if (diagramStore.selectedElementId) {
            diagramStore.updateElementProperty("shape", shape);
            diagramStore.render();
        }
    }

    function clearOverrides() {
        if (diagramStore.selectedElementId) {
            diagramStore.clearOverride(diagramStore.selectedElementId);
        }
        diagramStore.multiSelection.forEach(id => diagramStore.clearOverride(id));
        diagramStore.multiSelection = [];
        diagramStore.selectedElementId = null;
    }

    function selectSimilar() {
        const selectedId = diagramStore.selectedElementId;
        if (!selectedId) return;

        const allDefs = Array.from(diagramStore.definitions.keys());
        diagramStore.multiSelection = allDefs;
    }
</script>

<aside
    class="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col w-80 shrink-0 z-20 overflow-hidden select-none"
    transition:slide={{ axis: "x", duration: 200 }}
>
    <!-- Header -->
    <div
        class="h-10 px-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30"
    >
        <div class="flex items-center gap-2">
            <h3
                class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
            >
                {isBatchMode
                    ? `Batch Edit (${diagramStore.multiSelection.length})`
                    : "Node Properties"}
            </h3>
        </div>
        <div class="flex items-center gap-1">
            {#if diagramStore.selectedElementId}
                <button
                    type="button"
                    class="px-2 py-0.5 rounded {diagramStore.multiSelection
                        .length > 0
                        ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'} hover:bg-slate-700 hover:text-white text-[10px] font-semibold flex items-center gap-1 transition-colors"
                    onclick={selectSimilar}
                    title="Select all nodes"
                >
                    <Search size={10} strokeWidth={2.5} />
                    <span>{diagramStore.multiSelection.length > 0
                        ? `${diagramStore.multiSelection.length} selected`
                        : "Select All"}</span>
                </button>
            {/if}
            <button
                type="button"
                class="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                onclick={() => (diagramStore.isInspectorOpen = false)}
                title="Close Inspector"
                aria-label="Close Inspector"
            >
                <X size={14} />
            </button>
        </div>
    </div>

    {#if diagramStore.selectedElementId || isBatchMode}
        <div class="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
            <!-- Tabs -->
            <div
                class="flex p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200/80 dark:border-slate-700/60 relative text-xs font-medium"
            >
                <button
                    class="flex-1 py-1 rounded-md flex items-center justify-center gap-1.5 transition-colors {activeTab ===
                    'props'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}"
                    onclick={() => (activeTab = "props")}
                >
                    <Info size={13} /> Style
                </button>
                <button
                    class="flex-1 py-1 rounded-md flex items-center justify-center gap-1.5 transition-colors {activeTab ===
                    'palettes'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}"
                    onclick={() => (activeTab = "palettes")}
                >
                    <Palette size={13} /> Palettes
                </button>
                <button
                    class="flex-1 py-1 rounded-md flex items-center justify-center gap-1.5 transition-colors {activeTab ===
                    'ai'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}"
                    onclick={() => (activeTab = "ai")}
                >
                    <Network size={13} /> Topology
                </button>
            </div>

            {#if activeTab === "props"}
                <div class="space-y-4">
                    <!-- Element Title -->
                    <div
                        class="flex items-center gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-800"
                    >
                        <div
                            class="p-1.5 bg-slate-200 dark:bg-slate-700 rounded-md text-slate-700 dark:text-slate-200"
                        >
                            <Box size={16} />
                        </div>
                        <div class="min-w-0 flex-1">
                            <h3
                                class="font-semibold text-xs text-slate-900 dark:text-white truncate"
                            >
                                {isBatchMode
                                    ? `${diagramStore.multiSelection.length} Nodes Selected`
                                    : diagramStore.selectedElementId}
                            </h3>
                            <p
                                class="text-[10px] font-mono text-slate-400 mt-0.5"
                            >
                                {isBatchMode
                                    ? "Batch Edit Mode"
                                    : diagramStore.mode}
                            </p>
                        </div>
                    </div>

                    <!-- Appearance -->
                    <div class="space-y-2.5">
                        <h4
                            class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1"
                        >
                            Color & Shape
                        </h4>

                        <div
                            class="bg-white dark:bg-slate-800/30 rounded-xl p-3 border border-slate-100 dark:border-slate-800 space-y-3.5"
                        >
                            <!-- Swatches from active palette -->
                            <div>
                                <div
                                    class="text-[10px] text-slate-400 mb-1.5 font-medium flex items-center justify-between"
                                >
                                    <span>Theme Swatches</span>
                                    <span class="font-mono text-[9px]">
                                        {diagramStore.customPalettes[diagramStore.activePaletteIndex]?.name}
                                    </span>
                                </div>
                                <div class="flex flex-wrap gap-1.5">
                                    {#each diagramStore.customPalettes[diagramStore.activePaletteIndex]?.colors || [] as color}
                                        <button
                                            class="w-6 h-6 rounded-md border border-black/10 dark:border-white/10 shadow-sm hover:scale-110 transition-transform"
                                            style="background-color: {color}"
                                            onclick={() => applyColor(color)}
                                            title="Apply {color}"
                                            aria-label="Color swatch {color}"
                                        ></button>
                                    {/each}
                                </div>
                            </div>

                            <div
                                class="w-full h-px bg-slate-100 dark:bg-slate-800"
                            ></div>

                            <PropertyRow label="Shape">
                                <select
                                    class="w-full h-8 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 text-slate-700 dark:text-slate-200 outline-none"
                                    onchange={(e) =>
                                        applyShape(e.currentTarget.value)}
                                >
                                    <option value="">Choose Shape...</option>
                                    <option value="rectangle">Rectangle (box)</option>
                                    <option value="database">Database (cylinder)</option>
                                    <option value="queue">Queue (message queue)</option>
                                    <option value="cloud">Cloud (cluster)</option>
                                    <option value="actor">Actor (user / client)</option>
                                    <option value="component">Component</option>
                                </select>
                            </PropertyRow>
                        </div>
                    </div>

                    <!-- Single node Text Edit (if not batch) -->
                    {#if !isBatchMode}
                        <div class="space-y-2.5">
                            <h4
                                class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1"
                            >
                                Label Text
                            </h4>
                            <div
                                class="bg-white dark:bg-slate-800/30 rounded-xl p-3 border border-slate-100 dark:border-slate-800"
                            >
                                <input
                                    type="text"
                                    class="w-full h-8 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 text-slate-800 dark:text-slate-100 outline-none"
                                    placeholder="Enter node label..."
                                    onchange={(e) => {
                                        diagramStore.updateElementProperty(
                                            "label",
                                            e.currentTarget.value
                                        );
                                        diagramStore.render();
                                    }}
                                />
                            </div>
                        </div>
                    {/if}
                </div>
            {:else if activeTab === "palettes"}
                <!-- Custom Palette Switcher -->
                <div class="space-y-3">
                    <h4
                        class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1"
                    >
                        Preset Palettes
                    </h4>
                    <div class="space-y-2">
                        {#each diagramStore.customPalettes as pal, idx}
                            <button
                                class="w-full text-left p-2.5 rounded border transition-colors {diagramStore.activePaletteIndex ===
                                idx
                                    ? 'border-slate-900 dark:border-slate-100 bg-slate-100 dark:bg-slate-800 shadow-xs'
                                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-400'}"
                                onclick={() =>
                                    (diagramStore.activePaletteIndex = idx)}
                            >
                                <div
                                    class="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5"
                                >
                                    {pal.name}
                                </div>
                                <div class="flex gap-1">
                                    {#each pal.colors as col}
                                        <div
                                            class="w-5 h-4 rounded-xs border border-black/10 dark:border-white/10"
                                            style="background-color: {col}"
                                        ></div>
                                    {/each}
                                </div>
                            </button>
                        {/each}
                    </div>
                </div>
            {:else}
                <!-- AI Insight Tab -->
                <div class="flex-1 overflow-hidden animate-fade-in">
                    <AIExplainer />
                </div>
            {/if}

            <div class="pt-2">
                <button
                    class="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-slate-200 dark:border-slate-800 transition-colors"
                    onclick={clearOverrides}
                >
                    <Trash2 size={13} /> Clear Selection
                </button>
            </div>
        </div>
    {:else}
        <div
            class="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400"
        >
            <div
                class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3"
            >
                <MousePointer2 size={20} class="opacity-50 text-slate-500" />
            </div>
            <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No Node Selected
            </p>
            <p class="text-[11px] mt-1 text-slate-400 leading-relaxed max-w-[200px]">
                Click or Shift+Click elements in the diagram to inspect and batch edit styling.
            </p>
        </div>
    {/if}

    <!-- Pin footer -->
    <div
        class="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex justify-center"
    >
        <label class="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" bind:checked={isPinned} class="sr-only" />
            <div
                class="w-7 h-4 bg-slate-300 dark:bg-slate-700 rounded-full relative transition-colors {isPinned
                    ? '!bg-slate-900 dark:!bg-slate-100'
                    : ''}"
            >
                <div
                    class="absolute top-0.5 left-0.5 w-3 h-3 bg-white dark:bg-slate-900 rounded-full transition-transform {isPinned
                        ? 'translate-x-3'
                        : ''}"
                ></div>
            </div>
            <span
                class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                >Pin Inspector</span
            >
        </label>
    </div>
</aside>
