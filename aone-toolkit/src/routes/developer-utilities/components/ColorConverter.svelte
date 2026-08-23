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
    // Let's rely on standard <input class="input text-sm" type="color"> for easy picking.

    function handleColorInput(e: Event) {
        const target = e.target as HTMLInputElement;
        hex = target.value;
        updateFromHex();
    }
</script>

<div class="w-full flex justify-center items-start h-full">
    <div class="clean-panel p-8 w-full flex flex-col md:flex-row gap-12">
        <!-- Visual Picker -->
        <div class="flex-1 flex flex-col items-center justify-center">
            <div class="relative group cursor-pointer">
                <input
                    type="color"
                    value={hex}
                    oninput={handleColorInput}
                    class="input text-sm w-full absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div
                    class="w-48 h-48 md:w-64 md:h-64 rounded-full shadow-2xl border-8 border-slate-100 dark:border-slate-800 transition-transform group-hover:scale-105"
                    style="background-color: {hex}"
                ></div>
                <div
                    class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <span
                        class="bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md"
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
                    for="color-val-{format.label.toLowerCase()}"
                    class="text-sm font-semibold text-slate-500 uppercase tracking-wider"
                    >{format.label}</label
                >
                <div class="flex gap-2">
                    <input
                        id="color-val-{format.label.toLowerCase()}"
                        type="text"
                        value={format.value}
                        readonly
                        class="input text-sm flex-1"
                    />
                    <Button
                        variant="ghost"
                        class="btn btn-ghost text-sm"
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
</div>
