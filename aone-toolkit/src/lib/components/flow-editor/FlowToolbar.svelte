<script lang="ts">
    import {
        AlignLeft,
        AlignCenter,
        AlignRight,
        AlignVerticalJustifyCenter,
        AlignVerticalJustifyStart,
        AlignVerticalJustifyEnd,
        LayoutTemplate,
        LayoutList,
        Maximize,
        Plus,
        Minus,
        FileJson,
        Globe,
        History,
        Download,
        Upload,
    } from "lucide-svelte";

    let {
        onAutoLayout = (bg: "TB" | "LR") => {},
        onAlign = (
            align: "left" | "center" | "right" | "top" | "middle" | "bottom",
        ) => {},
        onDistribute = (axis: "horizontal" | "vertical") => {},
        onZoomIn = () => {},
        onZoomOut = () => {},
        onFitView = () => {},
        onOpenAssetHub = () => {},
        onOpenGlobals = () => {},
        onOpenHistory = () => {},
        onExport = () => {},
        onImport = () => {},
    } = $props<{
        onAutoLayout?: (dir: "TB" | "LR") => void;
        onAlign?: (
            align: "left" | "center" | "right" | "top" | "middle" | "bottom",
        ) => void;
        onDistribute?: (axis: "horizontal" | "vertical") => void;
        onZoomIn?: () => void;
        onZoomOut?: () => void;
        onFitView?: () => void;
        onSearch?: () => void;
        onOpenAssetHub?: () => void;
        onOpenGlobals?: () => void;
        onOpenHistory?: () => void;
        onExport?: () => void;
        onImport?: () => void;
    }>();
</script>

<div
    class="bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2"
>
    <!-- Layout -->
    <div
        class="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-700 pb-1"
    >
        <button
            class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-blue-500"
            onclick={() => onAutoLayout("LR")}
            title="Auto Layout Horizontal"
        >
            <LayoutList size={16} class="rotate-90" />
        </button>
        <button
            class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-blue-500"
            onclick={() => onAutoLayout("TB")}
            title="Auto Layout Vertical"
        >
            <LayoutList size={16} />
        </button>
    </div>

    <!-- Alignment -->
    <div
        class="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-700 pb-1"
    >
        <button
            class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-blue-500"
            onclick={() => onAlign("left")}
            title="Align Left"
        >
            <AlignVerticalJustifyStart size={16} class="-rotate-90" />
        </button>
        <button
            class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-blue-500"
            onclick={() => onAlign("center")}
            title="Align Center (Horizontal)"
        >
            <AlignVerticalJustifyCenter size={16} class="-rotate-90" />
        </button>
        <button
            class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-blue-500"
            onclick={() => onAlign("top")}
            title="Align Top"
        >
            <AlignVerticalJustifyStart size={16} />
        </button>
    </div>

    <!-- Zoom -->
    <div class="flex flex-col gap-1">
        <button
            class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-blue-500"
            onclick={onZoomIn}
            title="Zoom In"
        >
            <Plus size={16} />
        </button>
        <button
            class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-blue-500"
            onclick={onZoomOut}
            title="Zoom Out"
        >
            <Minus size={16} />
        </button>
        <button
            class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-blue-500"
            onclick={onFitView}
            title="Fit View"
        >
            <Maximize size={16} />
        </button>
    </div>

    <!-- Assets & Globals -->
    <div
        class="flex flex-col gap-1 border-t border-slate-100 dark:border-slate-700 pt-1"
    >
        <button
            class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-indigo-500"
            onclick={onOpenAssetHub}
            title="Asset Hub"
        >
            <FileJson size={16} />
        </button>
        <button
            class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-amber-500"
            onclick={onOpenGlobals}
            title="Global Variables"
        >
            <Globe size={16} />
        </button>
        <button
            class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-indigo-500"
            onclick={onOpenHistory}
            title="Version History"
        >
            <History size={16} />
        </button>
    </div>

    <!-- Import/Export -->
    <div
        class="flex flex-col gap-1 border-t border-slate-100 dark:border-slate-700 pt-1"
    >
        <button
            class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-green-500"
            onclick={onExport}
            title="导出工作流 (JSON)"
        >
            <Download size={16} />
        </button>
        <button
            class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-green-500"
            onclick={onImport}
            title="导入工作流 (JSON)"
        >
            <Upload size={16} />
        </button>
    </div>
</div>
