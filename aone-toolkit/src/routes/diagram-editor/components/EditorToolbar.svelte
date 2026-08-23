<script lang="ts">
    import {
        ArrowRight,
        ArrowLeft,
        ArrowUp,
        ArrowDown,
        Move,
        AlignLeft
    } from "lucide-svelte";
    import { diagramStore } from "../lib/store.svelte";
    import type { Direction, DiagramMode } from "../lib/arrows";
    import { formatDiagramCode } from "../lib/formatter";
    import ColorPicker from "./ColorPicker.svelte";

    let {
        mode,
        activeDirection = null,
        onDirectionChange,
        hasArrows = false,
    } = $props<{
        mode: DiagramMode;
        activeDirection?: Direction | null;
        onDirectionChange: (dir: Direction) => void;
        hasArrows?: boolean;
    }>();

    const buttons = [
        { id: "left" as const, icon: ArrowLeft, label: "Left" },
        { id: "right" as const, icon: ArrowRight, label: "Right" },
        { id: "up" as const, icon: ArrowUp, label: "Up" },
        { id: "down" as const, icon: ArrowDown, label: "Down" },
        { id: "default" as const, icon: Move, label: "Auto" },
    ];

    function handleFormat() {
        diagramStore.code = formatDiagramCode(diagramStore.code, diagramStore.mode);
        diagramStore.render();
    }
</script>

<div
    class="h-7 px-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between text-xs select-none shrink-0"
>
    <!-- Left: Arrow Direction Controls -->
    <div class="flex items-center gap-2">
        {#if mode === "plantuml"}
            {#if hasArrows}
                <span class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Arrow:
                </span>
                <div class="flex items-center gap-0.5 bg-slate-200/60 dark:bg-slate-800 p-0.5 rounded">
                    {#each buttons as btn}
                        <button
                            type="button"
                            class="p-0.5 rounded transition-colors {activeDirection === btn.id
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                            onclick={() => onDirectionChange(btn.id)}
                            title={`Set Arrow Direction: ${btn.label}`}
                            aria-label={`设置箭头朝向: ${btn.label}`}
                        >
                            {#if btn.id === "left"}
                                <ArrowLeft size={11} strokeWidth={2} />
                            {:else if btn.id === "right"}
                                <ArrowRight size={11} strokeWidth={2} />
                            {:else if btn.id === "up"}
                                <ArrowUp size={11} strokeWidth={2} />
                            {:else if btn.id === "down"}
                                <ArrowDown size={11} strokeWidth={2} />
                            {:else}
                                <Move size={11} strokeWidth={2} />
                            {/if}
                        </button>
                    {/each}
                </div>
            {:else}
                <span class="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    Source &middot; PlantUML
                </span>
            {/if}
        {:else}
            <span class="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                Source &middot; Graphviz Dot
            </span>
        {/if}
    </div>

    <!-- Right: Quick actions (Format, Color Picker) -->
    <div class="flex items-center gap-1">
        <button
            type="button"
            class="px-1.5 py-0.5 text-[10px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded transition-colors flex items-center gap-1 font-medium"
            onclick={handleFormat}
            title="Format Code (Shift+Alt+F)"
            aria-label="格式化图表代码"
        >
            <AlignLeft size={11} />
            <span>Format</span>
        </button>

        {#if diagramStore.selectedElementId}
            <div class="w-px h-3 bg-slate-200 dark:border-slate-800 mx-0.5"></div>
            <ColorPicker
                onSelect={(color) => {
                    if (diagramStore.selectedElementId) {
                        diagramStore.updateElementProperty("color", color);
                    }
                }}
            />
        {/if}
    </div>
</div>
