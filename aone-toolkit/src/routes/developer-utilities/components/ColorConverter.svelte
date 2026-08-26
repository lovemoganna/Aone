<script lang="ts">
    import { Button } from "$lib/components/ui";
    import { Copy, RefreshCw, Sparkles, Check, Trash2, Palette, Eye, Sun, Moon } from "lucide-svelte";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";

    let hex = $state("#0284c7");
    let copiedKey = $state<string | null>(null);

    const PRESETS = [
        { name: "Aone Sky", hex: "#0284c7" },
        { name: "Emerald Pro", hex: "#10b981" },
        { name: "Amber Warning", hex: "#f59e0b" },
        { name: "Indigo Accent", hex: "#6366f1" },
        { name: "Rose Danger", hex: "#f43f5e" },
        { name: "Slate Dark", hex: "#0f172a" },
    ];

    // Color conversion utilities
    function hexToRgb(h: string): { r: number; g: number; b: number } {
        const cleaned = h.replace("#", "");
        if (cleaned.length === 3) {
            const r = parseInt(cleaned[0] + cleaned[0], 16);
            const g = parseInt(cleaned[1] + cleaned[1], 16);
            const b = parseInt(cleaned[2] + cleaned[2], 16);
            return { r, g, b };
        }
        if (cleaned.length === 6) {
            const r = parseInt(cleaned.slice(0, 2), 16);
            const g = parseInt(cleaned.slice(2, 4), 16);
            const b = parseInt(cleaned.slice(4, 6), 16);
            return { r, g, b };
        }
        return { r: 2, g: 132, b: 199 };
    }

    function rgbToHsl(r: number, g: number, b: number) {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0;
        let s = 0;
        let l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    function rgbToHsv(r: number, g: number, b: number) {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d = max - min;
        let h = 0;
        const v = max;
        const s = max === 0 ? 0 : d / max;

        if (max !== min) {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
    }

    function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
        const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
        const k = 1 - Math.max(rNorm, gNorm, bNorm);
        if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
        const c = (1 - rNorm - k) / (1 - k);
        const m = (1 - gNorm - k) / (1 - k);
        const y = (1 - bNorm - k) / (1 - k);
        return {
            c: Math.round(c * 100),
            m: Math.round(m * 100),
            y: Math.round(y * 100),
            k: Math.round(k * 100)
        };
    }

    // Relative luminance for WCAG
    function getLuminance(r: number, g: number, b: number): number {
        const a = [r, g, b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    function getContrastRatio(l1: number, l2: number): number {
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    let parsedColor = $derived.by(() => {
        const rgbObj = hexToRgb(hex) || { r: 2, g: 132, b: 199 };
        const hslObj = rgbToHsl(rgbObj.r, rgbObj.g, rgbObj.b);
        const hsvObj = rgbToHsv(rgbObj.r, rgbObj.g, rgbObj.b);
        const cmykObj = rgbToCmyk(rgbObj.r, rgbObj.g, rgbObj.b);

        const lum = getLuminance(rgbObj.r, rgbObj.g, rgbObj.b);
        const contrastWhite = getContrastRatio(lum, 1.0);
        const contrastBlack = getContrastRatio(lum, 0.0);

        return {
            hex: hex.toUpperCase(),
            rgb: `rgb(${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b})`,
            rgba: `rgba(${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b}, 1)`,
            hsl: `hsl(${hslObj.h}, ${hslObj.s}%, ${hslObj.l}%)`,
            hsv: `hsv(${hsvObj.h}, ${hsvObj.s}%, ${hsvObj.v}%)`,
            cmyk: `cmyk(${cmykObj.c}%, ${cmykObj.m}%, ${cmykObj.y}%, ${cmykObj.k}%)`,
            contrastWhite: contrastWhite.toFixed(2),
            contrastBlack: contrastBlack.toFixed(2),
            passWhiteAA: contrastWhite >= 4.5,
            passWhiteAAA: contrastWhite >= 7.0,
            passBlackAA: contrastBlack >= 4.5,
            passBlackAAA: contrastBlack >= 7.0,
            isDark: lum < 0.5
        };
    });

    // Generate shade palette (10 variations)
    let shades = $derived.by(() => {
        const rgbObj = hexToRgb(hex) || { r: 2, g: 132, b: 199 };
        const hslObj = rgbToHsl(rgbObj.r, rgbObj.g, rgbObj.b);
        const steps = [95, 90, 80, 70, 60, 50, 40, 30, 20, 10];

        return steps.map(l => {
            return `hsl(${hslObj.h}, ${hslObj.s}%, ${l}%)`;
        });
    });

    function copyVal(v: string, key: string) {
        copyToClipboard(v, key);
        copiedKey = key;
        toastStore.success(`已复制 ${key}: ${v}`);
        setTimeout(() => {
            if (copiedKey === key) copiedKey = null;
        }, 1500);
    }
</script>

<div class="h-full flex flex-col gap-2.5 min-h-0">
    <!-- Top Command Toolbar -->
    <div class="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-2xs">
        <div class="flex items-center gap-2 flex-wrap min-w-0">
            <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
                <Palette size={13} class="text-sky-500" />
                颜色格式转换与对比度分析
            </span>
            <span class="text-slate-300 dark:text-slate-700">|</span>
            <span class="text-slate-400 text-[11px] font-medium shrink-0 flex items-center gap-1">
                <Sparkles size={11} class="text-amber-500" /> 预设:
            </span>
            {#each PRESETS as p}
                <button
                    type="button"
                    class="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center gap-1"
                    onclick={() => (hex = p.hex)}
                >
                    <span class="w-2 h-2 rounded-full" style="background-color: {p.hex}"></span>
                    {p.name}
                </button>
            {/each}
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
            <div class="flex items-center gap-1.5 font-mono text-[11px] px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <span class="w-2.5 h-2.5 rounded-full border border-black/10" style="background-color: {hex}"></span>
                {parsedColor.hex}
            </div>
        </div>
    </div>

    <!-- Dual Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        <!-- Left: Interactive Visual Picker & Shade Swatches (5 cols) -->
        <div class="lg:col-span-5 flex flex-col gap-2.5 min-h-0">
            <!-- Big Color Display & Picker -->
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center relative group shadow-2xs shrink-0 min-h-[160px]">
                <div
                    class="w-full h-24 rounded-lg shadow-inner flex items-center justify-center text-center font-mono font-bold text-sm tracking-wider transition-transform relative overflow-hidden border border-black/10"
                    style="background-color: {hex}; color: {parsedColor.isDark ? '#ffffff' : '#0f172a'}"
                >
                    <span>{parsedColor.hex}</span>
                    <input
                        type="color"
                        bind:value={hex}
                        class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        title="点击选择颜色"
                    />
                </div>
                <span class="text-[11px] text-slate-400 mt-2">点击色块唤起系统调色盘</span>
            </div>

            <!-- Monochromatic Shade Palette -->
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2 shadow-2xs shrink-0">
                <span class="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">明度衍生色阶 (50 ~ 900)</span>
                <div class="grid grid-cols-5 gap-1.5">
                    {#each shades as shade, idx}
                        <button
                            type="button"
                            class="h-8 rounded border border-black/10 transition hover:scale-105 cursor-pointer shadow-2xs"
                            style="background-color: {shade}"
                            onclick={() => copyVal(shade, `Shade #${idx + 1}`)}
                            title="复制 {shade}"
                        ></button>
                    {/each}
                </div>
            </div>

            <!-- WCAG 2.1 Contrast Rating Card -->
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2 shadow-2xs flex-1 min-h-0">
                <span class="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Eye size={12} class="text-sky-500" />
                    WCAG 2.1 无障碍可读性对比度
                </span>

                <div class="grid grid-cols-2 gap-2 text-xs">
                    <!-- Contrast on White -->
                    <div class="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-1">
                        <div class="flex items-center justify-between text-[11px] text-slate-500">
                            <span class="flex items-center gap-1"><Sun size={11} /> 浅色背景 (White)</span>
                            <span class="font-mono font-bold">{parsedColor.contrastWhite}:1</span>
                        </div>
                        <div class="flex items-center gap-1.5 pt-1">
                            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold {parsedColor.passWhiteAA ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'}">
                                AA {parsedColor.passWhiteAA ? 'PASS' : 'FAIL'}
                            </span>
                            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold {parsedColor.passWhiteAAA ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'}">
                                AAA {parsedColor.passWhiteAAA ? 'PASS' : 'FAIL'}
                            </span>
                        </div>
                    </div>

                    <!-- Contrast on Black -->
                    <div class="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-900 text-white space-y-1">
                        <div class="flex items-center justify-between text-[11px] text-slate-400">
                            <span class="flex items-center gap-1"><Moon size={11} /> 深色背景 (Black)</span>
                            <span class="font-mono font-bold text-white">{parsedColor.contrastBlack}:1</span>
                        </div>
                        <div class="flex items-center gap-1.5 pt-1">
                            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold {parsedColor.passBlackAA ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}">
                                AA {parsedColor.passBlackAA ? 'PASS' : 'FAIL'}
                            </span>
                            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold {parsedColor.passBlackAAA ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}">
                                AAA {parsedColor.passBlackAAA ? 'PASS' : 'FAIL'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right: Multi-Format Representation List (7 cols) -->
        <div class="lg:col-span-7 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>颜色编码格式全表</span>
                <span class="text-[10px] text-slate-400 font-mono">点击每行直接复制</span>
            </div>

            <div class="flex-1 overflow-auto p-3 space-y-2 bg-slate-50/40 dark:bg-slate-950/40 min-h-0 custom-scrollbar divide-y divide-slate-100/60 dark:divide-slate-800/40">
                {#each [
                    { label: "HEX (16 进制)", value: parsedColor.hex, key: "hex" },
                    { label: "RGB (红绿蓝)", value: parsedColor.rgb, key: "rgb" },
                    { label: "RGBA (带透明度)", value: parsedColor.rgba, key: "rgba" },
                    { label: "HSL (色相/饱和度/亮度)", value: parsedColor.hsl, key: "hsl" },
                    { label: "HSV / HSB", value: parsedColor.hsv, key: "hsv" },
                    { label: "CMYK (印刷四色)", value: parsedColor.cmyk, key: "cmyk" },
                ] as item, i}
                    <div class="pt-2 first:pt-0 flex items-center justify-between gap-3 group">
                        <div class="space-y-0.5 min-w-0 flex-1">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{item.label}</span>
                            <div class="font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all font-medium">
                                {item.value}
                            </div>
                        </div>

                        <button
                            type="button"
                            onclick={() => copyVal(item.value, item.label)}
                            class="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs font-sans"
                            title="复制该格式"
                        >
                            {#if copiedKey === item.label}
                                <Check size={11} class="text-emerald-500" />
                                <span class="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">已复制</span>
                            {:else}
                                <Copy size={11} class="text-slate-400" />
                                <span class="text-[11px]">复制</span>
                            {/if}
                        </button>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>
