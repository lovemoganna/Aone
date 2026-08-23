<script lang="ts">
    import { AlignLeft, Check } from "lucide-svelte";
    import { diagramStore } from "../lib/store.svelte";
    import { formatDiagramCode } from "../lib/formatter";
    import ColorPicker from "./ColorPicker.svelte";

    let {
        mode = "plantuml",
        onFormat,
    } = $props<{
        mode: string;
        onFormat?: () => void;
    }>();

    let formatted = $state(false);

    function handleFormat() {
        if (onFormat) {
            onFormat();
        } else {
            diagramStore.code = formatDiagramCode(diagramStore.code, diagramStore.mode);
            diagramStore.render();
        }
        formatted = true;
        setTimeout(() => (formatted = false), 1500);
    }
</script>

<div
    class="h-7 px-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between text-xs select-none shrink-0"
>
    <!-- Left: Syntax mode indicator -->
    <div class="flex items-center gap-2">
        <span class="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium">
            {mode === "plantuml" ? "PlantUML Source" : "Graphviz Dot Source"}
        </span>
    </div>

    <!-- Right: Quick Actions -->
    <div class="flex items-center gap-1.5">
        <button
            type="button"
            class="px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded transition-colors flex items-center gap-1 font-medium"
            onclick={handleFormat}
            title="Format Code (Shift+Alt+F)"
            aria-label="格式化图表代码"
        >
            {#if formatted}
                <Check size={11} class="text-emerald-500" />
                <span class="text-emerald-600 dark:text-emerald-400 font-semibold">Formatted</span>
            {:else}
                <AlignLeft size={11} />
                <span>Format</span>
            {/if}
        </button>

        {#if diagramStore.selectedElementId}
            <div class="w-px h-3 bg-slate-200 dark:bg-slate-800 mx-0.5"></div>
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
