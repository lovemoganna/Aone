<script lang="ts">
    import { diagramStore } from "../lib/store.svelte";
    import PropertyRow from "./PropertyRow.svelte";
    import AIExplainer from "./AIExplainer.svelte";
    import {
        X,
        Search,
        Eye,
        EyeOff,
        Info,
        Sparkles,
        Box,
        Palette,
        Type,
        Trash2,
        MousePointer2,
    } from "lucide-svelte";
    import { slide } from "svelte/transition";

    let { isPinned = $bindable(false) } = $props<{
        isPinned: boolean;
    }>();

    let activeTab = $state<"props" | "ai">("props");

    let currentOverride = $derived(
        diagramStore.selectedElementId
            ? diagramStore.overrides[diagramStore.selectedElementId] || {}
            : {},
    );

    function updateOverride(key: string, value: any) {
        if (!diagramStore.selectedElementId) return;
        diagramStore.setOverride(diagramStore.selectedElementId, {
            [key]: value,
        });
    }

    function clearOverrides() {
        if (!diagramStore.selectedElementId) return;
        diagramStore.clearOverride(diagramStore.selectedElementId);
        diagramStore.multiSelection = [];
    }

    function selectSimilar() {
        const selectedId = diagramStore.selectedElementId;
        if (!selectedId) return;

        // Scan the rendered SVG for elements that look similar
        const svgContainer = document.querySelector(
            ".diagram-preview-container",
        );
        if (!svgContainer) return;

        const currentEl = svgContainer.querySelector(
            `[data-id="${selectedId}"]`,
        );
        if (!currentEl) return;

        const isNode = currentEl.classList.contains("node");
        const type = isNode ? ".node" : ".edge";

        const others = svgContainer.querySelectorAll(type);
        const similarIds: string[] = [];

        others.forEach((el) => {
            const id = el.getAttribute("data-id");
            if (id) similarIds.push(id);
        });

        diagramStore.multiSelection = similarIds;
        console.log("Selected", similarIds.length, "similar elements");
    }
</script>

<aside
    class="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-white/10 flex flex-col w-80 shadow-2xl z-20 m-4 ml-0 rounded-2xl"
    transition:slide={{ axis: "x", duration: 300 }}
>
    <!-- Header -->
    <div
        class="p-4 border-b border-white/10 dark:border-white/5 flex items-center justify-between bg-gradient-to-b from-white/50 to-transparent dark:from-white/5 dark:to-transparent"
    >
        <div class="flex items-center gap-2">
            <div
                class="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] animate-pulse"
            ></div>
            <h3
                class="text-[10px] font-extrabold uppercase tracking-widest text-indigo-900/50 dark:text-indigo-100/50"
            >
                Control Deck
            </h3>
        </div>
        <div class="flex items-center gap-1">
            {#if diagramStore.selectedElementId}
                <button
                    class="p-1 px-2 rounded-lg {diagramStore.multiSelection
                        .length > 0
                        ? 'bg-indigo-600 text-white shadow-glow-sm'
                        : 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400'} hover:bg-indigo-500/20 text-[9px] font-bold flex items-center gap-1 transition-all"
                    onclick={selectSimilar}
                    title="Select all nodes with similar properties"
                >
                    <Search size={10} strokeWidth={3} />
                    {diagramStore.multiSelection.length > 0
                        ? `${diagramStore.multiSelection.length} selected`
                        : "Similar"}
                </button>
            {/if}
            <button
                class="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                onclick={() => (diagramStore.isInspectorOpen = false)}
            >
                <X size={16} />
            </button>
        </div>
    </div>

    {#if diagramStore.selectedElementId}
        <div class="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
            <!-- Focus Mode Toggle -->
            <div class="flex gap-2">
                <button
                    class="flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all active:scale-95
                    {diagramStore.focusMode
                        ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-500'
                        : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-200/50 dark:border-gray-700/50 text-gray-400'}"
                    onclick={() =>
                        (diagramStore.focusMode = !diagramStore.focusMode)}
                    title="Toggle Zen Mode"
                >
                    <Eye size={14} />
                    <span
                        class="text-[10px] font-bold uppercase tracking-widest"
                        >Zen Mode</span
                    >
                </button>

                {#if diagramStore.mode === "plantuml"}
                    <button
                        class="flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all active:scale-95
                        {diagramStore.overrides[diagramStore.selectedElementId!]
                            ?.focused
                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-600'
                            : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-200/50 dark:border-gray-700/50 text-gray-400'}"
                        onclick={() =>
                            diagramStore.focusOnNode(
                                diagramStore.selectedElementId!,
                            )}
                        title="Isolate this node in the diagram"
                    >
                        <Search size={14} />
                        <span
                            class="text-[10px] font-bold uppercase tracking-widest"
                            >Focus Node</span
                        >
                    </button>
                {/if}
            </div>

            <!-- ID info -->
            <div>
                <h4
                    class="text-[10px] uppercase font-extrabold tracking-widest text-gray-400/80 mb-2 pl-1"
                >
                    Context
                </h4>
            </div>

            <!-- Tabs -->
            <div
                class="flex p-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 relative"
            >
                <div
                    class="absolute inset-y-1 w-[calc(50%-4px)] bg-white dark:bg-gray-700 rounded-lg shadow-sm transition-all duration-300 ease-out"
                    style="left: {activeTab === 'props'
                        ? '4px'
                        : 'calc(50% + 0px)'}"
                ></div>
                <button
                    class="flex-1 px-4 py-1.5 text-xs font-bold flex items-center justify-center gap-2 transition-colors relative z-10 {activeTab ===
                    'props'
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}"
                    onclick={() => (activeTab = "props")}
                >
                    <Info size={14} /> Properties
                </button>
                <button
                    class="flex-1 px-4 py-1.5 text-xs font-bold flex items-center justify-center gap-2 transition-colors relative z-10 {activeTab ===
                    'ai'
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}"
                    onclick={() => (activeTab = "ai")}
                >
                    <Sparkles size={14} /> AI Insight
                </button>
            </div>

            {#if activeTab === "props"}
                <div class="space-y-6 flex-1 animate-fade-in">
                    <!-- Selection Header -->
                    <div
                        class="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-700/50"
                    >
                        <div
                            class="p-2.5 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/50 dark:to-indigo-800/50 rounded-lg text-indigo-600 dark:text-indigo-400 shadow-inner"
                        >
                            <Box size={20} />
                        </div>
                        <div class="min-w-0">
                            <h3
                                class="font-bold text-sm text-gray-900 dark:text-white truncate"
                            >
                                {diagramStore.selectedElementId}
                            </h3>
                            <p
                                class="text-[10px] font-mono text-gray-500 dark:text-gray-400 mt-0.5"
                            >
                                {diagramStore.selectedElementType ||
                                    "Unknown Element"}
                            </p>
                        </div>
                    </div>

                    <!-- Appearance -->
                    <div class="space-y-3">
                        <h4
                            class="text-[10px] font-extrabold text-gray-400/80 uppercase tracking-widest pl-1"
                        >
                            Appearance
                        </h4>

                        <div
                            class="bg-white/30 dark:bg-gray-800/20 rounded-xl p-3 border border-gray-100/50 dark:border-gray-700/50 space-y-4"
                        >
                            <PropertyRow label="Color">
                                <div class="flex gap-2">
                                    {#each ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"] as color}
                                        <button
                                            class="w-6 h-6 rounded-full border-2 border-white dark:border-gray-700 shadow-sm hover:scale-110 hover:shadow-glow-sm transition-all"
                                            style="background-color: {color}"
                                            onclick={() =>
                                                diagramStore.updateElementProperty(
                                                    "color",
                                                    color,
                                                )}
                                            aria-label="Set color {color}"
                                        ></button>
                                    {/each}
                                </div>
                            </PropertyRow>

                            <div
                                class="w-full h-px bg-gray-200/50 dark:bg-gray-700/50"
                            ></div>

                            <PropertyRow label="Shape">
                                <select
                                    class="w-full h-8 text-xs bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg px-2 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    onchange={(e) =>
                                        diagramStore.updateElementProperty(
                                            "shape",
                                            e.currentTarget.value,
                                        )}
                                >
                                    <option value="">Default</option>
                                    <option value="rectangle">Rectangle</option>
                                    <option value="cloud">Cloud</option>
                                    <option value="database">Database</option>
                                    <option value="node">Node</option>
                                </select>
                            </PropertyRow>
                        </div>
                    </div>

                    <!-- Text -->
                    <div class="space-y-3">
                        <h4
                            class="text-[10px] font-extrabold text-gray-400/80 uppercase tracking-widest pl-1"
                        >
                            Typography
                        </h4>
                        <div
                            class="bg-white/30 dark:bg-gray-800/20 rounded-xl p-3 border border-gray-100/50 dark:border-gray-700/50 space-y-4"
                        >
                            <PropertyRow label="Label">
                                <input
                                    type="text"
                                    class="w-full h-8 text-xs bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg px-2 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    placeholder="Element label..."
                                    onchange={(e) =>
                                        diagramStore.updateElementProperty(
                                            "label",
                                            e.currentTarget.value,
                                        )}
                                />
                            </PropertyRow>
                        </div>
                    </div>
                </div>
            {:else}
                <!-- AI Tab -->
                <div class="flex-1 overflow-hidden animate-fade-in">
                    <AIExplainer />
                </div>
            {/if}
            <div class="pt-4">
                <button
                    class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all border border-dashed border-gray-200 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-900/30 group"
                    onclick={clearOverrides}
                >
                    <Trash2
                        size={14}
                        class="group-hover:scale-110 transition-transform"
                    /> Reset Selection
                </button>
            </div>
        </div>
    {:else}
        <div
            class="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-300 dark:text-gray-700"
        >
            <div
                class="w-20 h-20 rounded-full bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 flex items-center justify-center mb-6 shadow-inner"
            >
                <MousePointer2 size={32} class="opacity-30 text-indigo-500" />
            </div>
            <p class="text-sm font-bold text-gray-500 dark:text-gray-400">
                No Selection
            </p>
            <p
                class="text-[11px] mt-2 leading-relaxed text-gray-400 max-w-[180px]"
            >
                Select any node or edge in the diagram to access advanced
                controls.
            </p>
        </div>
    {/if}

    <!-- Footer / Pinner -->
    <div
        class="p-4 border-t border-white/10 dark:border-white/5 bg-gray-50/30 dark:bg-gray-900/30 flex justify-center backdrop-blur-sm rounded-b-2xl"
    >
        <label class="flex items-center gap-2 cursor-pointer group select-none">
            <input type="checkbox" bind:checked={isPinned} class="sr-only" />
            <div
                class="w-9 h-5 bg-gray-200 dark:bg-gray-700 rounded-full relative transition-all duration-300 {isPinned
                    ? 'bg-indigo-500 shadow-glow-sm'
                    : ''}"
            >
                <div
                    class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 {isPinned
                        ? 'translate-x-4'
                        : ''}"
                ></div>
            </div>
            <span
                class="text-[10px] font-bold text-gray-400 group-hover:text-indigo-500 transition-colors uppercase tracking-widest"
                >Pin Deck</span
            >
        </label>
    </div>
</aside>
