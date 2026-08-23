<script lang="ts">
    import { diagramStore } from "../lib/store.svelte";
    import { optimizeLayout, type LayoutPreset } from "../lib/optimizer";
    import {
        Sliders,
        Palette,
        Grid,
        ArrowDown,
        ArrowRight,
        ArrowUp,
        ArrowLeft,
        GitBranch,
        Network,
        Target,
        Circle,
        X,
        Check
    } from "lucide-svelte";
    import { slide } from "svelte/transition";

    const engines = [
        { id: "dot", label: "Hierarchical", icon: GitBranch, desc: "Flowcharts, trees" },
        { id: "neato", label: "Network", icon: Network, desc: "Force-directed" },
        { id: "fdp", label: "Cluster", icon: Target, desc: "Large graphs" },
        { id: "twopi", label: "Radial", icon: Circle, desc: "Centered radial layout" },
        { id: "circo", label: "Circular", icon: Circle, desc: "Ring networks" },
    ] as const;

    const directions = [
        { id: "TB" as const, label: "Top-Bottom", icon: ArrowDown },
        { id: "LR" as const, label: "Left-Right", icon: ArrowRight },
        { id: "BT" as const, label: "Bottom-Top", icon: ArrowUp },
        { id: "RL" as const, label: "Right-Left", icon: ArrowLeft },
    ];

    const layoutPresets: { id: LayoutPreset; label: string; desc: string }[] = [
        { id: "orthogonal", label: "Orthogonal", desc: "Right-angle neat routing" },
        { id: "compact", label: "Compact", desc: "Minimal whitespace spacing" },
        { id: "concentrate", label: "Concentrate", desc: "Merged line intersections" },
        { id: "organic", label: "Organic", desc: "Curved smooth routing" },
    ];

    const PLANTUML_THEMES = [
        { id: "", name: "Default", colors: ["#FEFECE", "#A80036", "#FFF4E7"] },
        { id: "spacelab", name: "Spacelab", colors: ["#4D82C5", "#E5E5E5", "#333333"] },
        { id: "united", name: "United", colors: ["#DD4814", "#F8F8F8", "#333333"] },
        { id: "plain", name: "Plain", colors: ["#FFFFFF", "#888888", "#000000"] },
        { id: "mars", name: "Mars", colors: ["#E74C3C", "#2C3E50", "#ECF0F1"] },
        { id: "cerulean", name: "Cerulean", colors: ["#2FA4E7", "#EEEEEE", "#333333"] },
        { id: "superhero", name: "Superhero", colors: ["#DF691A", "#2B3E50", "#EBEBEB"] },
        { id: "cyborg", name: "Cyborg", colors: ["#2A9FD6", "#060606", "#ADAFAE"] },
        { id: "minty", name: "Minty", colors: ["#78C2AD", "#F3969A", "#6CC3D5"] },
        { id: "sketchy", name: "Sketchy", colors: ["#EEEEEE", "#333333", "#333333"] },
    ];

    let openPanel = $state<"layout" | "theme" | null>(null);

    function togglePanel(panel: "layout" | "theme") {
        openPanel = openPanel === panel ? null : panel;
    }

    function applyPreset(preset: LayoutPreset) {
        diagramStore.code = optimizeLayout(diagramStore.code, diagramStore.mode, preset);
        diagramStore.render();
        openPanel = null;
    }
</script>

<svelte:window
    onkeydown={(e) => {
        if (e.key === "Escape") openPanel = null;
    }}
/>

<div class="absolute top-2.5 left-2.5 z-30 flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm select-none text-xs">
    <!-- Layout Engine & Presets Button -->
    <button
        type="button"
        class="px-2 py-0.5 rounded-md font-medium transition-colors flex items-center gap-1.5 {openPanel === 'layout'
            ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs font-semibold'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}"
        onclick={() => togglePanel("layout")}
        title="Layout Engine & Presets"
        aria-label="布局引擎与预设"
    >
        <Sliders size={12} class={openPanel === 'layout' ? 'text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400'} />
        <span>{diagramStore.mode === 'graphviz' ? diagramStore.engine : 'Layout'}</span>
    </button>

    <!-- Flow Direction Quick Toggle (TB / LR) -->
    <div class="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60 font-mono text-[11px]">
        <button
            type="button"
            class="px-1.5 py-0.5 rounded transition-colors {diagramStore.layoutParams.rankdir === 'TB'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}"
            onclick={() => diagramStore.setDirection('TB')}
            title="Flow: Top to Bottom"
            aria-label="从上到下排列"
        >
            TB
        </button>
        <button
            type="button"
            class="px-1.5 py-0.5 rounded transition-colors {diagramStore.layoutParams.rankdir === 'LR'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}"
            onclick={() => diagramStore.setDirection('LR')}
            title="Flow: Left to Right"
            aria-label="从左到右排列"
        >
            LR
        </button>
    </div>

    <!-- Theme Button (PlantUML) -->
    {#if diagramStore.mode === "plantuml"}
        <button
            type="button"
            class="px-2 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 {openPanel === 'theme'
                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs font-semibold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}"
            onclick={() => togglePanel("theme")}
            title="PlantUML Visual Themes"
            aria-label="PlantUML 主题样式"
        >
            <Palette size={13} class={openPanel === 'theme' ? 'text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400'} />
            <span>{diagramStore.pumlTheme || 'Theme'}</span>
        </button>
    {/if}

    <!-- Canvas Grid Toggle -->
    <button
        type="button"
        class="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors {diagramStore.previewTheme === 'dark' ? 'text-amber-500 dark:text-amber-400' : ''}"
        onclick={() => (diagramStore.previewTheme = diagramStore.previewTheme === 'light' ? 'dark' : 'light')}
        title="Toggle Dark Canvas"
        aria-label="切换画布背景"
    >
        <Grid size={13} />
    </button>
</div>

<!-- Layout Popover -->
{#if openPanel === "layout"}
    <!-- Backdrop to close -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 z-30"
        onclick={() => (openPanel = null)}
    ></div>

    <div
        class="absolute top-12 left-3 z-40 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 space-y-3 min-w-[280px] text-xs"
        transition:slide={{ duration: 120 }}
    >
        <div class="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <span class="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Layout Presets
            </span>
            <button
                type="button"
                class="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                onclick={() => (openPanel = null)}
            >
                <X size={13} />
            </button>
        </div>

        <div class="grid grid-cols-2 gap-1.5">
            {#each layoutPresets as p}
                <button
                    type="button"
                    class="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-all"
                    onclick={() => applyPreset(p.id)}
                >
                    <div class="text-xs font-semibold text-slate-800 dark:text-slate-200">{p.label}</div>
                    <div class="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
                </button>
            {/each}
        </div>

        {#if diagramStore.mode === "graphviz"}
            <div>
                <h4 class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Graphviz Engine
                </h4>
                <div class="grid grid-cols-5 gap-1">
                    {#each engines as eng}
                        <button
                            type="button"
                            class="flex flex-col items-center gap-1 p-1.5 rounded-md transition-colors {diagramStore.engine === eng.id
                                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs font-semibold'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}"
                            onclick={() => {
                                diagramStore.setLayoutEngine(eng.id);
                                openPanel = null;
                            }}
                            title={eng.desc}
                        >
                            <eng.icon size={13} />
                            <span class="text-[9px] font-medium">{eng.label.slice(0, 4)}</span>
                        </button>
                    {/each}
                </div>
            </div>
        {/if}

        <div>
            <h4 class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Flow Direction
            </h4>
            <div class="grid grid-cols-4 gap-1">
                {#each directions as dir}
                    <button
                        type="button"
                        class="flex flex-col items-center gap-1 p-1.5 rounded-md transition-colors {diagramStore.layoutParams.rankdir === dir.id
                            ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-xs font-semibold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}"
                        onclick={() => {
                            diagramStore.setDirection(dir.id);
                            openPanel = null;
                        }}
                        title={dir.label}
                    >
                        <dir.icon size={13} />
                        <span class="text-[9px] font-medium">{dir.id}</span>
                    </button>
                {/each}
            </div>
        </div>
    </div>
{/if}

<!-- Theme Popover (PlantUML) -->
{#if openPanel === "theme"}
    <!-- Backdrop to close -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 z-30"
        onclick={() => (openPanel = null)}
    ></div>

    <div
        class="absolute top-12 left-3 z-40 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2.5 text-xs"
        transition:slide={{ duration: 120 }}
    >
        <div class="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                PlantUML Themes
            </span>
            <button
                type="button"
                class="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                onclick={() => (openPanel = null)}
            >
                <X size={13} />
            </button>
        </div>

        <div class="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-0.5">
            {#each PLANTUML_THEMES as theme}
                <button
                    type="button"
                    class="p-2 rounded-lg border transition-all flex flex-col items-center gap-1.5 {diagramStore.pumlTheme === theme.id
                        ? 'border-slate-900 dark:border-slate-100 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 hover:border-slate-400 text-slate-700 dark:text-slate-300'}"
                    onclick={() => {
                        diagramStore.setTheme(theme.id);
                        openPanel = null;
                    }}
                >
                    <div class="flex gap-1">
                        {#each theme.colors as color}
                            <div
                                class="w-3 h-3 rounded-full border border-black/10 dark:border-white/10"
                                style="background-color: {color}"
                            ></div>
                        {/each}
                    </div>
                    <span class="text-[10px]">
                        {theme.name}
                    </span>
                </button>
            {/each}
        </div>
    </div>
{/if}
