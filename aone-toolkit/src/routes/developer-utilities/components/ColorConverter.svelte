<script lang="ts">
    import { Button } from "$lib/components/ui";
    import { Copy, RefreshCw } from "lucide-svelte";

    let hex = $state("#3b82f6");
    let rgb = $state("rgb(59, 130, 246)");
    let hsl = $state("hsl(217, 91%, 60%)");

    // Simple conversion logic
    function hexToRgb(h: string) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
        return result
            ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16),
              }
            : null;
    }

    function rgbToHsl(r: number, g: number, b: number) {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b),
            min = Math.min(r, g, b);
        let h = 0,
            s,
            l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
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
        return { h: h * 360, s: s * 100, l: l * 100 };
    }

    function updateFromHex() {
        if (!hex.match(/^#[0-9A-Fa-f]{6}$/)) return;
        const c = hexToRgb(hex);
        if (c) {
            rgb = `rgb(${c.r}, ${c.g}, ${c.b})`;
            const h = rgbToHsl(c.r, c.g, c.b);
            hsl = `hsl(${Math.round(h.h)}, ${Math.round(h.s)}%, ${Math.round(h.l)}%)`;
        }
    }

    // Two-way binding or dedicated inputs would be better, but for now simple Hex driver
    // In a real app, I'd implement full 2-way sync.
    // Let's rely on standard <input type="color"> for easy picking.

    function handleColorInput(e: Event) {
        const target = e.target as HTMLInputElement;
        hex = target.value;
        updateFromHex();
    }
</script>

<div class="h-full flex flex-col md:flex-row gap-8">
    <!-- Visual Picker -->
    <div
        class="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"
    >
        <div class="relative group cursor-pointer">
            <input
                type="color"
                value={hex}
                oninput={handleColorInput}
                class="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
            />
            <div
                class="w-32 h-32 md:w-48 md:h-48 rounded-full shadow-2xl border-4 border-white dark:border-slate-700 transition-transform group-hover:scale-105"
                style="background-color: {hex}"
            ></div>
            <div
                class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <span
                    class="bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm"
                    >Click to Pick</span
                >
            </div>
        </div>
    </div>

    <!-- Values -->
    <div class="flex-1 flex flex-col justify-center gap-6">
        {#each [{ label: "HEX", value: hex }, { label: "RGB", value: rgb }, { label: "HSL", value: hsl }] as format}
            <div class="space-y-2">
                <label
                    class="text-sm font-semibold text-slate-500 uppercase tracking-wider"
                    >{format.label}</label
                >
                <div class="flex gap-2">
                    <input
                        type="text"
                        value={format.value}
                        readonly
                        class="flex-1 px-4 py-3 font-mono text-lg bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-slate-700 dark:text-slate-200"
                    />
                    <Button
                        variant="ghost"
                        class="shrink-0"
                        onclick={() =>
                            navigator.clipboard.writeText(format.value)}
                    >
                        <Copy size={18} />
                    </Button>
                </div>
            </div>
        {/each}
    </div>
</div>
