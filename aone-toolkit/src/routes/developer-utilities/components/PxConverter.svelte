<script lang="ts">
    import { ArrowRightLeft, Ruler, Type } from "lucide-svelte";

    let rootSize = $state(16);
    let px = $state(16);
    let rem = $state(1);

    function updateFromPx() {
        rem = parseFloat((px / rootSize).toFixed(4));
    }

    function updateFromRem() {
        px = parseFloat((rem * rootSize).toFixed(4));
    }

    function getTailwindMatch(pixels: number) {
        // Simple heuristic for common Tailwind 4 spacing/font scale
        const spacing = pixels / 4;
        if (Number.isInteger(spacing))
            return `w-${spacing} / h-${spacing} / p-${spacing}`;
        if (pixels === 12) return "text-xs";
        if (pixels === 14) return "text-sm";
        if (pixels === 16) return "text-base";
        if (pixels === 18) return "text-lg";
        if (pixels === 20) return "text-xl";
        if (pixels === 24) return "text-2xl";
        if (pixels === 30) return "text-3xl";

        return null;
    }

    let tailwindClass = $derived(getTailwindMatch(px));
</script>

<div class="max-w-4xl mx-auto space-y-8 py-8">
    <!-- Config -->
    <div class="flex flex-col items-center gap-2">
        <label
            class="text-xs font-bold text-slate-400 uppercase tracking-widest"
            >Root Font Size (HTML)</label
        >
        <div class="relative group">
            <input
                type="number"
                bind:value={rootSize}
                oninput={() => updateFromRem()}
                class="w-32 text-center px-4 py-2 bg-white dark:bg-slate-800 rounded-lg font-mono text-sm border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm group-hover:shadow-md"
            />
            <span
                class="absolute right-3 top-2 text-xs text-slate-400 font-bold"
                >px</span
            >
        </div>
    </div>

    <!-- Main Converter -->
    <div
        class="grid md:grid-cols-[1fr_auto_1fr] items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden"
    >
        <!-- Background Gradient -->
        <div
            class="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none"
        ></div>

        <!-- PX Input -->
        <div class="flex flex-col gap-4 relative z-10">
            <label
                class="text-sm font-bold text-center text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >Pixels</label
            >
            <div class="relative group">
                <input
                    type="number"
                    bind:value={px}
                    oninput={updateFromPx}
                    class="w-full text-center p-6 text-4xl font-mono font-bold bg-slate-50 dark:bg-slate-950 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 border-2 border-transparent focus:border-indigo-500 transition-all text-slate-900 dark:text-white shadow-inner"
                />
                <span
                    class="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold"
                    >px</span
                >
            </div>
            {#if tailwindClass}
                <div class="text-center">
                    <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                    >
                        {tailwindClass}
                    </span>
                </div>
            {/if}
        </div>

        <!-- Arrow -->
        <div
            class="shrink-0 text-slate-300 dark:text-slate-600 flex justify-center"
        >
            <div
                class="p-3 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
                <ArrowRightLeft size={24} />
            </div>
        </div>

        <!-- REM Input -->
        <div class="flex flex-col gap-4 relative z-10">
            <label
                class="text-sm font-bold text-center text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >REM</label
            >
            <div class="relative group">
                <input
                    type="number"
                    bind:value={rem}
                    oninput={updateFromRem}
                    step="0.125"
                    class="w-full text-center p-6 text-4xl font-mono font-bold bg-slate-50 dark:bg-slate-950 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/20 border-2 border-transparent focus:border-purple-500 transition-all text-slate-900 dark:text-white shadow-inner"
                />
                <span
                    class="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold"
                    >rem</span
                >
            </div>
            <div class="text-center opacity-0">
                <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    >Placeholder</span
                >
            </div>
        </div>
    </div>

    <!-- Visual Preview Section -->
    <div class="grid md:grid-cols-2 gap-8">
        <!-- Box Preview -->
        <div
            class="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden"
        >
            <span
                class="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase flex items-center gap-2"
            >
                <Ruler size={14} /> Box Size Preview
            </span>
            <div
                class="bg-indigo-500 shadow-lg shadow-indigo-500/30 rounded-lg flex items-center justify-center text-white text-xs font-bold transition-all duration-300"
                style="width: {Math.min(px, 300)}px; height: {Math.min(
                    px,
                    150,
                )}px;"
            >
                {#if px > 40}
                    {px}px
                {/if}
            </div>
            {#if px > 300}
                <span class="text-xs text-amber-500 mt-2"
                    >Preview capped at 300px</span
                >
            {/if}
        </div>

        <!-- Text Preview -->
        <div
            class="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden"
        >
            <span
                class="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase flex items-center gap-2"
            >
                <Type size={14} /> Typography Preview
            </span>
            <p
                class="text-slate-800 dark:text-slate-100 font-medium transition-all duration-300 text-center leading-tight truncate max-w-full px-4"
                style="font-size: {px}px;"
            >
                Ag
            </p>
            <p class="text-slate-500 text-sm mt-4">
                The quick brown fox jumps over the lazy dog.
            </p>
        </div>
    </div>

    <!-- Presets -->
    <div class="flex flex-wrap justify-center gap-3">
        {#each [12, 14, 16, 18, 20, 24, 32, 48, 64, 96] as p}
            <button
                class="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm group min-w-[80px]"
                onclick={() => {
                    px = p;
                    updateFromPx();
                }}
            >
                <div
                    class="font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                >
                    {p}px
                </div>
                <div class="text-[10px] text-slate-400">
                    {(p / rootSize).toFixed(3)}rem
                </div>
            </button>
        {/each}
    </div>
</div>
