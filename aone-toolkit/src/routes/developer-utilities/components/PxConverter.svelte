<script lang="ts">
    import { ArrowRightLeft, Ruler, Type, Sparkles, Copy, Check } from "lucide-svelte";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";

    let rootSize = $state(16);
    let px = $state(16);
    let rem = $state(1);
    let em = $derived(rem);
    let pt = $derived(parseFloat((px * 0.75).toFixed(2)));
    let percent = $derived(Math.round((px / rootSize) * 100));

    function updateFromPx() {
        rem = parseFloat((px / rootSize).toFixed(4));
    }

    function updateFromRem() {
        px = parseFloat((rem * rootSize).toFixed(2));
    }

    function getTailwindMatch(pixels: number) {
        const spacing = pixels / 4;
        if (Number.isInteger(spacing) && spacing >= 0 && spacing <= 96) {
            return `p-${spacing} / m-${spacing} / w-${spacing} / h-${spacing}`;
        }
        if (pixels === 12) return "text-xs";
        if (pixels === 14) return "text-sm";
        if (pixels === 16) return "text-base";
        if (pixels === 18) return "text-lg";
        if (pixels === 20) return "text-xl";
        if (pixels === 24) return "text-2xl";
        if (pixels === 30) return "text-3xl";
        if (pixels === 36) return "text-4xl";
        return `custom [${pixels}px]`;
    }

    let tailwindClass = $derived(getTailwindMatch(px));

    const PRESETS = [
        { label: "12px (text-xs)", val: 12 },
        { label: "14px (text-sm)", val: 14 },
        { label: "16px (基准)", val: 16 },
        { label: "18px (text-lg)", val: 18 },
        { label: "20px (text-xl)", val: 20 },
        { label: "24px (text-2xl)", val: 24 },
        { label: "32px (8 单元)", val: 32 },
        { label: "48px (12 单元)", val: 48 },
        { label: "64px (16 单元)", val: 64 },
    ];

    function copyVal(v: string, label: string) {
        copyToClipboard(v, label);
        toastStore.success(`已复制 ${label}: ${v}`);
    }
</script>

<div class="h-full flex flex-col gap-2.5 min-h-0">
    <!-- Top Command Toolbar -->
    <div class="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-2xs">
        <div class="flex items-center gap-2 flex-wrap min-w-0">
            <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
                <Ruler size={13} class="text-sky-500" />
                PX / REM / EM 视口尺寸换算
            </span>
            <span class="text-slate-300 dark:text-slate-700">|</span>
            <div class="flex items-center gap-1.5 text-xs">
                <label for="root-font-size-input" class="text-slate-500 dark:text-slate-400 font-medium text-[11px]">根字号 (1rem =):</label>
                <div class="flex items-center bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5 border border-slate-200 dark:border-slate-700">
                    <input
                        id="root-font-size-input"
                        type="number"
                        bind:value={rootSize}
                        oninput={updateFromRem}
                        class="w-10 bg-transparent text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none text-right"
                    />
                    <span class="text-[10px] text-slate-400 font-mono ml-1">px</span>
                </div>
            </div>
            <span class="text-slate-300 dark:text-slate-700">|</span>
            <span class="text-slate-400 text-[11px] font-medium shrink-0 flex items-center gap-1">
                <Sparkles size={11} class="text-amber-500" /> 预设:
            </span>
            {#each PRESETS as p}
                <button
                    type="button"
                    class="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer font-mono"
                    onclick={() => { px = p.val; updateFromPx(); }}
                >
                    {p.val}px
                </button>
            {/each}
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
            <span class="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/60 text-[11px] font-mono font-bold">
                {tailwindClass}
            </span>
        </div>
    </div>

    <!-- Dual Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        <!-- Left: Interactive Conversion Card (5 cols) -->
        <div class="lg:col-span-5 flex flex-col gap-2.5 min-h-0">
            <!-- Two-way Converter -->
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-3 shadow-2xs shrink-0">
                <div class="grid grid-cols-2 gap-3 items-center">
                    <!-- PX -->
                    <div class="space-y-1">
                        <label for="px-input-field" class="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">像素 (PX)</label>
                        <div class="flex items-center bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2">
                            <input
                                id="px-input-field"
                                type="number"
                                bind:value={px}
                                oninput={updateFromPx}
                                class="w-full bg-transparent font-mono text-lg font-bold text-slate-900 dark:text-white outline-none"
                            />
                            <span class="text-xs text-slate-400 font-mono font-semibold ml-1">px</span>
                        </div>
                    </div>

                    <!-- REM -->
                    <div class="space-y-1">
                        <label for="rem-input-field" class="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">根单位 (REM)</label>
                        <div class="flex items-center bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2">
                            <input
                                id="rem-input-field"
                                type="number"
                                bind:value={rem}
                                oninput={updateFromRem}
                                step="0.0625"
                                class="w-full bg-transparent font-mono text-lg font-bold text-slate-900 dark:text-white outline-none"
                            />
                            <span class="text-xs text-slate-400 font-mono font-semibold ml-1">rem</span>
                        </div>
                    </div>
                </div>

                <!-- Unit Equivalents Table -->
                <div class="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
                    <div class="p-2 rounded bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
                        <span class="text-[10px] text-slate-400 block font-sans">相对字号 (EM)</span>
                        <span class="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{em} em</span>
                    </div>
                    <div class="p-2 rounded bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
                        <span class="text-[10px] text-slate-400 block font-sans">印刷磅值 (PT)</span>
                        <span class="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{pt} pt</span>
                    </div>
                    <div class="p-2 rounded bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
                        <span class="text-[10px] text-slate-400 block font-sans">百分比 (%)</span>
                        <span class="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{percent}%</span>
                    </div>
                </div>
            </div>

            <!-- CSS Snippet Copy Card -->
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2 shadow-2xs flex-1 min-h-0 flex flex-col justify-between">
                <span class="text-[11px] font-bold text-slate-700 dark:text-slate-300">CSS 常用导出属性</span>

                <div class="space-y-1.5 font-mono text-xs">
                    {#each [
                        { label: "font-size", val: `font-size: ${rem}rem; /* ${px}px */` },
                        { label: "padding", val: `padding: ${rem}rem;` },
                        { label: "width/height", val: `width: ${px}px; height: ${px}px;` },
                    ] as rule}
                        <div class="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                            <span class="text-slate-800 dark:text-slate-200 text-[11px] select-all">{rule.val}</span>
                            <button
                                type="button"
                                onclick={() => copyVal(rule.val, rule.label)}
                                class="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                                title="复制"
                            >
                                <Copy size={11} />
                            </button>
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <!-- Right: Real-time Visualizer (7 cols) -->
        <div class="lg:col-span-7 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span class="flex items-center gap-1.5">
                    <Type size={13} class="text-sky-500" />
                    尺寸与排版渲染预览
                </span>
                <span class="text-[10px] text-slate-400 font-mono">{px}px ({rem}rem)</span>
            </div>

            <div class="flex-1 overflow-auto p-4 space-y-4 bg-slate-50/40 dark:bg-slate-950/40 min-h-0 custom-scrollbar flex flex-col justify-around">
                <!-- Typography Preview -->
                <div class="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">字体渲染效果 (Typography)</span>
                    <p
                        class="text-slate-900 dark:text-slate-100 font-medium leading-normal transition-all duration-150 break-words"
                        style="font-size: {Math.max(10, Math.min(px, 72))}px;"
                    >
                        Aone 全栈开发者工具箱
                    </p>
                    <p class="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                        The quick brown fox jumps over the lazy dog. 敏捷的棕色狐狸跃过懒狗。
                    </p>
                </div>

                <!-- Box Dimension Preview -->
                <div class="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">盒模型物理尺寸 (Box Dimensions)</span>
                    <div class="flex items-center justify-center py-2">
                        <div
                            class="bg-sky-500/10 border-2 border-dashed border-sky-500 rounded-lg flex items-center justify-center text-sky-600 dark:text-sky-400 font-mono text-xs font-bold transition-all duration-150"
                            style="width: {Math.max(20, Math.min(px * 2, 280))}px; height: {Math.max(20, Math.min(px * 2, 120))}px;"
                        >
                            {px}px
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
