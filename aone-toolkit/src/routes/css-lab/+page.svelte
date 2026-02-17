<script lang="ts">
    import { Panel, Button } from "$lib/components/ui";
    import { Palette, Copy, Sparkles, Box, RotateCcw, Wand2 } from "lucide-svelte";

    // State for Box Shadow
    let x = $state(0);
    let y = $state(10);
    let blur = $state(25);
    let spread = $state(-5);
    let shadowColor = $state("rgba(0,0,0,0.1)");
    let shadowOpacity = $state(0.1);

    // State for Glassmorphism
    let blurAmt = $state(10);
    let transparency = $state(0.5);
    let glassColor = $state("#ffffff");

    // State for Gradient
    let gradientType = $state<"linear" | "radial">("linear");
    let gradientAngle = $state(135);
    let gradientColor1 = $state("#667eea");
    let gradientColor2 = $state("#764ba2");
    let gradientColor3 = $state(""); // Optional third color
    let gradientPos1 = $state(0);
    let gradientPos2 = $state(100);
    let gradientPos3 = $state(50);

    // State for Border Radius
    let borderRadius = $state(16);
    let borderRadiusTL = $state(16);
    let borderRadiusTR = $state(16);
    let borderRadiusBR = $state(16);
    let borderRadiusBL = $state(16);
    let borderRadiusLinked = $state(true);

    let activeEffect = $state<"shadow" | "glass" | "gradient" | "radius">("shadow");

    // Presets
    const shadowPresets = [
        { name: "Subtle", x: 0, y: 1, blur: 3, spread: 0, opacity: 0.1 },
        { name: "Medium", x: 0, y: 4, blur: 6, spread: -1, opacity: 0.1 },
        { name: "Large", x: 0, y: 10, blur: 15, spread: -3, opacity: 0.1 },
        { name: "Soft", x: 0, y: 25, blur: 50, spread: -12, opacity: 0.25 },
        { name: "Hard", x: 5, y: 5, blur: 0, spread: 0, opacity: 0.3 },
        { name: "Layered", x: 0, y: 20, blur: 25, spread: -5, opacity: 0.15 },
    ];

    const glassPresets = [
        { name: "Frosted", blur: 10, transparency: 0.25, color: "#ffffff" },
        { name: "Clear", blur: 5, transparency: 0.1, color: "#ffffff" },
        { name: "Thick", blur: 20, transparency: 0.4, color: "#ffffff" },
        { name: "Dark", blur: 15, transparency: 0.3, color: "#1a1a2e" },
        { name: "Tinted", blur: 12, transparency: 0.35, color: "#6366f1" },
        { name: "Mist", blur: 8, transparency: 0.6, color: "#f8fafc" },
    ];

    const gradientPresets = [
        { name: "Sunset", type: "linear" as const, angle: 135, c1: "#f093fb", c2: "#f5576c", c3: "" },
        { name: "Ocean", type: "linear" as const, angle: 180, c1: "#667eea", c2: "#764ba2", c3: "" },
        { name: "Mint", type: "linear" as const, angle: 120, c1: "#84fab0", c2: "#8fd3f4", c3: "" },
        { name: "Fire", type: "linear" as const, angle: 45, c1: "#f12711", c2: "#f5af19", c3: "" },
        { name: "Aurora", type: "linear" as const, angle: 135, c1: "#a8edea", c2: "#fed6e3", c3: "#d299c2" },
        { name: "Radial Glow", type: "radial" as const, angle: 0, c1: "#ffecd2", c2: "#fcb69f", c3: "" },
    ];

    const radiusPresets = [
        { name: "None", tl: 0, tr: 0, br: 0, bl: 0 },
        { name: "Small", tl: 4, tr: 4, br: 4, bl: 4 },
        { name: "Medium", tl: 8, tr: 8, br: 8, bl: 8 },
        { name: "Large", tl: 16, tr: 16, br: 16, bl: 16 },
        { name: "Pill", tl: 9999, tr: 9999, br: 9999, bl: 9999 },
        { name: "Blob", tl: 30, tr: 70, br: 30, bl: 70 },
    ];

    function applyPreset(preset: any) {
        if (activeEffect === "shadow") {
            x = preset.x; y = preset.y; blur = preset.blur; spread = preset.spread; shadowOpacity = preset.opacity;
        } else if (activeEffect === "glass") {
            blurAmt = preset.blur; transparency = preset.transparency; glassColor = preset.color;
        } else if (activeEffect === "gradient") {
            gradientType = preset.type; gradientAngle = preset.angle;
            gradientColor1 = preset.c1; gradientColor2 = preset.c2; gradientColor3 = preset.c3 || "";
        } else if (activeEffect === "radius") {
            borderRadiusTL = preset.tl; borderRadiusTR = preset.tr;
            borderRadiusBR = preset.br; borderRadiusBL = preset.bl;
            borderRadiusLinked = preset.tl === preset.tr && preset.tr === preset.br && preset.br === preset.bl;
            if (borderRadiusLinked) borderRadius = preset.tl;
        }
    }

    function updateLinkedRadius(val: number) {
        borderRadius = val;
        if (borderRadiusLinked) {
            borderRadiusTL = borderRadiusTR = borderRadiusBR = borderRadiusBL = val;
        }
    }

    let shadowStyle = $derived(
        `box-shadow: ${x}px ${y}px ${blur}px ${spread}px ${shadowColor.replace("0.1", shadowOpacity.toString())};`,
    );
    let glassStyle = $derived(
        `background: ${glassColor}${Math.floor(transparency * 255)
            .toString(16)
            .padStart(
                2,
                "0",
            )};\nbackdrop-filter: blur(${blurAmt}px);\n-webkit-backdrop-filter: blur(${blurAmt}px);\nborder: 1px solid rgba(255, 255, 255, 0.3);`,
    );
    let gradientStyle = $derived(() => {
        const stops = gradientColor3
            ? `${gradientColor1} ${gradientPos1}%, ${gradientColor3} ${gradientPos3}%, ${gradientColor2} ${gradientPos2}%`
            : `${gradientColor1} ${gradientPos1}%, ${gradientColor2} ${gradientPos2}%`;
        if (gradientType === "linear") {
            return `background: linear-gradient(${gradientAngle}deg, ${stops});`;
        } else {
            return `background: radial-gradient(circle, ${stops});`;
        }
    });
    let radiusStyle = $derived(
        borderRadiusTL === borderRadiusTR && borderRadiusTR === borderRadiusBR && borderRadiusBR === borderRadiusBL
            ? `border-radius: ${borderRadiusTL}px;`
            : `border-radius: ${borderRadiusTL}px ${borderRadiusTR}px ${borderRadiusBR}px ${borderRadiusBL}px;`,
    );

    let currentStyle = $derived(
        activeEffect === "shadow" ? shadowStyle
        : activeEffect === "glass" ? glassStyle
        : activeEffect === "gradient" ? gradientStyle()
        : radiusStyle
    );

    let previewStyle = $derived(() => {
        if (activeEffect === "shadow") return shadowStyle;
        if (activeEffect === "glass") return glassStyle;
        if (activeEffect === "gradient") return gradientStyle();
        return radiusStyle;
    });

    function copyStyle() {
        navigator.clipboard.writeText(currentStyle);
    }

    let currentPresets = $derived(
        activeEffect === "shadow" ? shadowPresets
        : activeEffect === "glass" ? glassPresets
        : activeEffect === "gradient" ? gradientPresets
        : radiusPresets
    );
</script>

<svelte:head>
    <title>CSS Design Lab - Aone Toolkit</title>
</svelte:head>

<div class="h-[calc(100vh-3rem)] p-4 flex flex-col space-y-4">
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        <!-- Preview Area -->
        <Panel
            class="flex flex-col min-h-0 overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:20px_20px]"
        >
            {#snippet header()}
                <div class="flex items-center justify-between w-full">
                    <div class="flex items-center gap-2">
                        <div
                            class="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center"
                        >
                            <Box size={16} />
                        </div>
                        <h2
                            class="font-semibold text-slate-900 dark:text-white"
                        >
                            Live Preview
                        </h2>
                    </div>
                    <div
                        class="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg"
                    >
                        <button
                            class="px-2 py-1 text-xs font-medium rounded-md transition-all {activeEffect ===
                            'shadow'
                                ? 'bg-white dark:bg-slate-700 shadow text-primary-600'
                                : 'text-slate-500 hover:text-slate-700'}"
                            onclick={() => (activeEffect = "shadow")}
                            >Shadow</button
                        >
                        <button
                            class="px-2 py-1 text-xs font-medium rounded-md transition-all {activeEffect ===
                            'glass'
                                ? 'bg-white dark:bg-slate-700 shadow text-primary-600'
                                : 'text-slate-500 hover:text-slate-700'}"
                            onclick={() => (activeEffect = "glass")}
                            >Glass</button
                        >
                        <button
                            class="px-2 py-1 text-xs font-medium rounded-md transition-all {activeEffect ===
                            'gradient'
                                ? 'bg-white dark:bg-slate-700 shadow text-primary-600'
                                : 'text-slate-500 hover:text-slate-700'}"
                            onclick={() => (activeEffect = "gradient")}
                            >Gradient</button
                        >
                        <button
                            class="px-2 py-1 text-xs font-medium rounded-md transition-all {activeEffect ===
                            'radius'
                                ? 'bg-white dark:bg-slate-700 shadow text-primary-600'
                                : 'text-slate-500 hover:text-slate-700'}"
                            onclick={() => (activeEffect = "radius")}
                            >Radius</button
                        >
                    </div>
                </div>
            {/snippet}

            <div class="flex-1 flex items-center justify-center p-12">
                <div
                    class="w-64 h-64 transition-all duration-300 flex items-center justify-center text-center p-8"
                    style="{previewStyle()}; border-radius: {activeEffect === 'radius' ? `${borderRadiusTL}px ${borderRadiusTR}px ${borderRadiusBR}px ${borderRadiusBL}px` : '24px'};"
                    class:bg-white={activeEffect !== 'gradient'}
                    class:dark:bg-slate-800={activeEffect !== 'gradient'}
                >
                    <div>
                        <Sparkles
                            class="mx-auto mb-4 {activeEffect === 'gradient' ? 'text-white' : 'text-primary-500'}"
                            size={32}
                        />
                        <p class="font-bold {activeEffect === 'gradient' ? 'text-white' : 'text-slate-800 dark:text-white'}">
                            Design Token
                        </p>
                        <p class="text-xs mt-2 {activeEffect === 'gradient' ? 'text-white/70' : 'text-slate-500'}">
                            Preview your visual constraints in real-time.
                        </p>
                    </div>
                </div>
            </div>
        </Panel>

        <!-- Controls -->
        <Panel class="flex flex-col min-h-0">
            {#snippet header()}
                <div class="flex items-center justify-between w-full">
                    <div class="flex items-center gap-2">
                        <div
                            class="w-7 h-7 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center"
                        >
                            <Palette size={16} />
                        </div>
                        <h2
                            class="font-semibold text-slate-900 dark:text-white"
                        >
                            Style Parameters
                        </h2>
                    </div>
                    <Button size="sm" onclick={copyStyle}>
                        <Copy size={14} class="mr-2" /> Copy CSS
                    </Button>
                </div>
            {/snippet}

            <div class="flex-1 overflow-y-auto p-6 space-y-6">
                <!-- Presets Section -->
                <section class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-slate-400 uppercase">Presets</span>
                        <Wand2 size={14} class="text-slate-400" />
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        {#each currentPresets as preset}
                            <button
                                class="px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-700 dark:text-slate-300"
                                onclick={() => applyPreset(preset)}
                            >
                                {preset.name}
                            </button>
                        {/each}
                    </div>
                </section>

                <hr class="border-slate-100 dark:border-slate-800" />

                {#if activeEffect === "shadow"}
                    <div class="space-y-5">
                        <div class="space-y-3">
                            <div class="flex justify-between text-xs font-bold text-slate-400 uppercase">
                                <span>Offset X & Y</span>
                                <span class="font-mono">{x}px / {y}px</span>
                            </div>
                            <input type="range" min="-50" max="50" bind:value={x} class="w-full accent-primary-500" />
                            <input type="range" min="-50" max="50" bind:value={y} class="w-full accent-primary-500" />
                        </div>
                        <div class="space-y-3">
                            <div class="flex justify-between text-xs font-bold text-slate-400 uppercase">
                                <span>Blur & Spread</span>
                                <span class="font-mono">{blur}px / {spread}px</span>
                            </div>
                            <input type="range" min="0" max="100" bind:value={blur} class="w-full accent-primary-500" />
                            <input type="range" min="-50" max="50" bind:value={spread} class="w-full accent-primary-500" />
                        </div>
                        <div class="space-y-3">
                            <div class="flex justify-between text-xs font-bold text-slate-400 uppercase">
                                <span>Opacity</span>
                                <span class="font-mono">{(shadowOpacity * 100).toFixed(0)}%</span>
                            </div>
                            <input type="range" min="0" max="1" step="0.01" bind:value={shadowOpacity} class="w-full accent-primary-500" />
                        </div>
                    </div>
                {:else if activeEffect === "glass"}
                    <div class="space-y-5">
                        <div class="space-y-3">
                            <div class="flex justify-between text-xs font-bold text-slate-400 uppercase">
                                <span>Backdrop Blur</span>
                                <span class="font-mono">{blurAmt}px</span>
                            </div>
                            <input type="range" min="0" max="40" bind:value={blurAmt} class="w-full accent-cyan-500" />
                        </div>
                        <div class="space-y-3">
                            <div class="flex justify-between text-xs font-bold text-slate-400 uppercase">
                                <span>Transparency</span>
                                <span class="font-mono">{(transparency * 100).toFixed(0)}%</span>
                            </div>
                            <input type="range" min="0" max="1" step="0.01" bind:value={transparency} class="w-full accent-cyan-500" />
                        </div>
                        <div class="space-y-2">
                            <label for="glass-color-input" class="text-xs font-bold text-slate-400 uppercase block">Glass Color</label>
                            <input id="glass-color-input" type="color" bind:value={glassColor} class="w-full h-10 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700" />
                        </div>
                    </div>
                {:else if activeEffect === "gradient"}
                    <div class="space-y-5">
                        <div class="space-y-3">
                            <span class="text-xs font-bold text-slate-400 uppercase">Type</span>
                            <div class="flex gap-2">
                                <button
                                    class="flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all {gradientType === 'linear' ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}"
                                    onclick={() => (gradientType = "linear")}
                                >Linear</button>
                                <button
                                    class="flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all {gradientType === 'radial' ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}"
                                    onclick={() => (gradientType = "radial")}
                                >Radial</button>
                            </div>
                        </div>
                        {#if gradientType === "linear"}
                            <div class="space-y-3">
                                <div class="flex justify-between text-xs font-bold text-slate-400 uppercase">
                                    <span>Angle</span>
                                    <span class="font-mono">{gradientAngle}°</span>
                                </div>
                                <input type="range" min="0" max="360" bind:value={gradientAngle} class="w-full accent-violet-500" />
                            </div>
                        {/if}
                        <div class="space-y-3">
                            <span class="text-xs font-bold text-slate-400 uppercase">Colors</span>
                            <div class="grid grid-cols-3 gap-3">
                                <div class="space-y-1">
                                    <input type="color" bind:value={gradientColor1} class="w-full h-10 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700" />
                                    <input type="number" min="0" max="100" bind:value={gradientPos1} class="w-full px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded text-center" />
                                </div>
                                <div class="space-y-1">
                                    <input type="color" bind:value={gradientColor3} class="w-full h-10 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 {!gradientColor3 && 'opacity-30'}" />
                                    <input type="number" min="0" max="100" bind:value={gradientPos3} class="w-full px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded text-center" placeholder="Mid" disabled={!gradientColor3} />
                                </div>
                                <div class="space-y-1">
                                    <input type="color" bind:value={gradientColor2} class="w-full h-10 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700" />
                                    <input type="number" min="0" max="100" bind:value={gradientPos2} class="w-full px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded text-center" />
                                </div>
                            </div>
                            <p class="text-[10px] text-slate-400">Middle color is optional for 3-stop gradients</p>
                        </div>
                    </div>
                {:else if activeEffect === "radius"}
                    <div class="space-y-5">
                        <div class="flex items-center gap-3">
                            <label class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <input type="checkbox" bind:checked={borderRadiusLinked} class="accent-primary-500" />
                                Link corners
                            </label>
                        </div>
                        {#if borderRadiusLinked}
                            <div class="space-y-3">
                                <div class="flex justify-between text-xs font-bold text-slate-400 uppercase">
                                    <span>All Corners</span>
                                    <span class="font-mono">{borderRadius}px</span>
                                </div>
                                <input type="range" min="0" max="100" bind:value={borderRadius} oninput={(e) => updateLinkedRadius(Number(e.currentTarget.value))} class="w-full accent-emerald-500" />
                            </div>
                        {:else}
                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <div class="flex justify-between text-xs text-slate-400"><span>Top Left</span><span class="font-mono">{borderRadiusTL}px</span></div>
                                    <input type="range" min="0" max="100" bind:value={borderRadiusTL} class="w-full accent-emerald-500" />
                                </div>
                                <div class="space-y-2">
                                    <div class="flex justify-between text-xs text-slate-400"><span>Top Right</span><span class="font-mono">{borderRadiusTR}px</span></div>
                                    <input type="range" min="0" max="100" bind:value={borderRadiusTR} class="w-full accent-emerald-500" />
                                </div>
                                <div class="space-y-2">
                                    <div class="flex justify-between text-xs text-slate-400"><span>Bottom Left</span><span class="font-mono">{borderRadiusBL}px</span></div>
                                    <input type="range" min="0" max="100" bind:value={borderRadiusBL} class="w-full accent-emerald-500" />
                                </div>
                                <div class="space-y-2">
                                    <div class="flex justify-between text-xs text-slate-400"><span>Bottom Right</span><span class="font-mono">{borderRadiusBR}px</span></div>
                                    <input type="range" min="0" max="100" bind:value={borderRadiusBR} class="w-full accent-emerald-500" />
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}

                <section class="pt-5 border-t border-slate-100 dark:border-slate-800">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-xs font-bold text-slate-400 uppercase">Generated Code</span>
                        <button onclick={copyStyle} class="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1">
                            <Copy size={12} /> Copy
                        </button>
                    </div>
                    <pre class="p-4 bg-slate-900 text-slate-300 rounded-xl text-[11px] font-mono leading-relaxed overflow-x-auto"><code>{currentStyle}</code></pre>
                </section>
            </div>
        </Panel>
    </div>
</div>
