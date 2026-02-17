<script lang="ts">
    import { diagramStore } from "../lib/store.svelte";
    import {
        X,
        Maximize,
        Minimize,
        Trash2,
        Palette,
        Type,
        Box,
    } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";
    import { Button } from "$lib/components/ui";

    const SHAPES = [
        { name: "Rect", value: "rectangle" },
        { name: "Class", value: "class" },
        { name: "DB", value: "database" },
        { name: "Cloud", value: "cloud" },
        { name: "Node", value: "node" },
        { name: "Actor", value: "actor" },
        { name: "Comp", value: "component" },
        { name: "Use", value: "usecase" },
    ];

    const COLORS = [
        { name: "None", value: "" },
        { name: "White", value: "#ffffff" },
        { name: "Black", value: "#000000" },
        { name: "Slate", value: "#64748b" },
        { name: "Red", value: "#ef4444" },
        { name: "Orange", value: "#f97316" },
        { name: "Amber", value: "#f59e0b" },
        { name: "Green", value: "#22c55e" },
        { name: "Emerald", value: "#10b981" },
        { name: "Teal", value: "#14b8a6" },
        { name: "Cyan", value: "#06b6d4" },
        { name: "Sky", value: "#0ea5e9" },
        { name: "Blue", value: "#3b82f6" },
        { name: "Indigo", value: "#6366f1" },
        { name: "Violet", value: "#8b5cf6" },
        { name: "Purple", value: "#a855f7" },
        { name: "Fuchsia", value: "#d946ef" },
        { name: "Pink", value: "#ec4899" },
        { name: "Rose", value: "#f43f5e" },
    ];

    let { isOpen = $bindable(false) } = $props<{ isOpen: boolean }>();

    import { Code } from "lucide-svelte";

    // ... imports

    let currentProperties = $derived(
        diagramStore.selectedElementProperties || { scale: 1, color: "" },
    );

    function updateScale(delta: number) {
        if (!diagramStore.selectedElementId) return;
        const newScale = Math.max(
            0.5,
            Math.min(3, (currentProperties.scale || 1) + delta),
        );
        diagramStore.updateElementProperty("scale", newScale);
    }

    function setColor(color: string) {
        if (!diagramStore.selectedElementId) return;
        diagramStore.updateElementProperty("color", color);
    }

    function clear() {
        if (diagramStore.selectedElementId) {
            diagramStore.clearOverride(diagramStore.selectedElementId);
            // Also reset properties? No, modifier handles it.
        }
    }
</script>

{#if isOpen}
    <div
        class="fixed top-20 right-4 w-64 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xl border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden z-50"
        transition:fade={{ duration: 200 }}
    >
        <div class="p-4" transition:slide={{ axis: "y", duration: 300 }}>
            <!-- Header -->
            <div class="flex items-center justify-between mb-4">
                <h3
                    class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                >
                    Element Inspector
                </h3>
                <Button
                    variant="ghost"
                    size="icon"
                    class="h-6 w-6"
                    onclick={() => (isOpen = false)}
                >
                    <X size={14} />
                </Button>
            </div>

            <!-- Scale Control (Not bound to code yet) -->
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <label
                        class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2"
                    >
                        <Maximize size={12} /> Scale Adjustment
                    </label>
                    <span
                        class="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold"
                    >
                        {Math.round((currentProperties.scale || 1) * 100)}%
                    </span>
                </div>
                <!-- ... buttons unchanged but use new updateScale ... -->
                <div class="flex items-center gap-2">
                    <button
                        class="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
                        onclick={() => updateScale(-0.1)}
                    >
                        <Minimize size={14} class="mx-auto" />
                    </button>
                    <button
                        class="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 transition-colors"
                        onclick={() => updateScale(0.1)}
                    >
                        <Maximize size={14} class="mx-auto" />
                    </button>
                </div>
            </div>

            <!-- Label Control -->
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <label
                        class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2"
                    >
                        <Type size={12} /> Label Text
                    </label>
                    <div
                        class="flex items-center gap-1.5 text-[10px] text-indigo-600 font-mono bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded"
                    >
                        <Code size={10} />
                        <span>bound</span>
                    </div>
                </div>
                <!-- Input with debounce? Store updates directly for now, user can blur or enter. -->
                <input
                    type="text"
                    value={currentProperties.label || ""}
                    class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg text-sm transition-all"
                    placeholder="Element Label"
                    onchange={(e) =>
                        diagramStore.updateElementProperty(
                            "label",
                            e.currentTarget.value,
                        )}
                />
            </div>

            <!-- Shape Control (PlantUML only usually) -->
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <label
                        class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2"
                    >
                        <Box size={12} /> Shape Type
                    </label>
                    <div
                        class="flex items-center gap-1.5 text-[10px] text-indigo-600 font-mono bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded"
                    >
                        <Code size={10} />
                        <span>bound</span>
                    </div>
                </div>
                <div class="grid grid-cols-4 gap-2">
                    {#each SHAPES as shape}
                        <button
                            class="flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 {currentProperties.type ===
                            shape.value
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-slate-100 dark:border-slate-800'}"
                            title={shape.name}
                            onclick={() =>
                                diagramStore.updateElementProperty(
                                    "shape",
                                    shape.value,
                                )}
                        >
                            <!-- Simple text icon or lucide icon if available -->
                            <span class="text-[10px] font-mono mt-1"
                                >{shape.name}</span
                            >
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Color Palette (Bound to Code) -->
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <label
                        class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2"
                    >
                        <Palette size={12} /> Visual Theme
                    </label>
                    <!-- Binding Indicator -->
                    <div
                        class="flex items-center gap-1.5 text-[10px] text-indigo-600 font-mono bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded"
                        title="Changes are written to code"
                    >
                        <Code size={10} />
                        <span>bound</span>
                    </div>
                </div>

                <div class="grid grid-cols-7 gap-1">
                    {#each COLORS as color}
                        <button
                            class="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 {currentProperties.color ===
                            color.value
                                ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                                : 'border-transparent'}"
                            style="background-color: {color.value || '#e2e8f0'}"
                            title={color.name}
                            onclick={() => setColor(color.value)}
                        >
                            {#if color.value === ""}
                                <X size={12} class="mx-auto text-slate-400" />
                            {/if}
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Meta info -->
            <div
                class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"
            >
                <div class="text-[10px] text-slate-400 flex items-center gap-1">
                    <Type size={10} /> Atomic UID Mode
                </div>
                <button
                    class="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-colors"
                    title="Reset to DSL Default"
                    onclick={clear}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    </div>
{/if}
