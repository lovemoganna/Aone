<script lang="ts">
    import { diagramStore } from "../lib/store.svelte";
    import {
        Move,
        Layers,
        ArrowsUpFromLine,
        Scaling,
        AlignJustify,
        Wand2,
    } from "lucide-svelte";
    import VariantBrowser from "./VariantBrowser.svelte";

    let isVariantOpen = $state(false);

    function updateParam(key: string, value: any) {
        (diagramStore as any).layoutParams[key] = value;
        if (diagramStore.autoRender) {
            diagramStore.render();
        }
    }

    const rankdirs = [
        { id: "TB", label: "Top-Down", icon: Layers },
        { id: "LR", label: "Left-Right", icon: ArrowsUpFromLine },
        { id: "BT", label: "Bottom-Top", icon: Scaling },
    ];

    const presets = [
        { name: "Compact", nodesep: 0.25, ranksep: 0.25 },
        { name: "Standard", nodesep: 0.5, ranksep: 0.5 },
        { name: "Spacious", nodesep: 1.0, ranksep: 1.0 },
    ];

    function applyPreset(preset: any) {
        diagramStore.layoutParams.nodesep = preset.nodesep;
        diagramStore.layoutParams.ranksep = preset.ranksep;
        diagramStore.render();
    }

    function updatePlantUMLDir(dir: string) {
        const code = diagramStore.code;
        // Simple logic to replace or add direction
        const dirLine = dir === "LR" ? "left to right direction\n" : "";

        let newCode = code;
        if (code.includes("left to right direction")) {
            newCode = code.replace(/left to right direction\n?/, dirLine);
        } else if (dirLine) {
            newCode = code.replace("@startuml\n", `@startuml\n${dirLine}`);
        }

        if (newCode !== code) {
            diagramStore.code = newCode;
            diagramStore.render();
        }
    }
</script>

<div class="p-4 space-y-6">
    {#if diagramStore.mode === "graphviz"}
        <!-- Variant Browser Trigger -->
        <button
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white shadow-lg shadow-indigo-500/20 flex flex-col items-center gap-1 transition-all active:scale-95 group mb-2"
            onclick={() => (isVariantOpen = true)}
        >
            <div class="flex items-center gap-2 font-bold text-xs">
                <Wand2
                    size={16}
                    class="group-hover:rotate-12 transition-transform"
                />
                Explore Topology Variants
            </div>
            <p class="text-[9px] opacity-70">
                Generate 15+ variations of your graph
            </p>
        </button>
        <VariantBrowser bind:isOpen={isVariantOpen} />

        <!-- Engine Presets -->
        <div class="space-y-3">
            <h4
                class="text-[10px] uppercase font-bold text-slate-400 block tracking-widest"
            >
                Layout presets
            </h4>
            <div class="grid grid-cols-3 gap-2">
                {#each presets as preset}
                    <button
                        class="py-1.5 text-[10px] font-bold rounded border transition-all
                        {diagramStore.layoutParams.nodesep === preset.nodesep
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}"
                        onclick={() => applyPreset(preset)}
                    >
                        {preset.name}
                    </button>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Direction -->
    <div class="space-y-3">
        <h4
            class="text-[10px] uppercase font-bold text-slate-400 block tracking-widest flex items-center gap-2"
        >
            <AlignJustify size={10} /> Flow Direction
        </h4>
        <div class="grid grid-cols-3 gap-2">
            {#each rankdirs as dir}
                {@const DirIcon = dir.icon}
                <button
                    class="flex flex-col items-center gap-1.5 p-2 rounded border transition-all
                    {diagramStore.layoutParams.rankdir === dir.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400'
                        : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}"
                    onclick={() => {
                        updateParam("rankdir", dir.id);
                        if (diagramStore.mode === "plantuml")
                            updatePlantUMLDir(dir.id);
                    }}
                >
                    <DirIcon
                        size={14}
                        class={diagramStore.layoutParams.rankdir === dir.id
                            ? dir.id === "LR"
                                ? "rotate-90"
                                : ""
                            : ""}
                    />
                    <span class="text-[9px] font-medium">{dir.label}</span>
                </button>
            {/each}
        </div>
    </div>

    {#if diagramStore.mode === "graphviz"}
        <!-- Sliders -->
        <div class="space-y-4 pt-2">
            <!-- Node Sep -->
            <div class="space-y-2">
                <div class="flex justify-between items-center text-[10px]">
                    <span
                        class="text-slate-500 uppercase font-bold flex items-center gap-1"
                    >
                        <Move size={10} /> Node Spacing
                    </span>
                    <span class="text-indigo-500 font-mono font-bold"
                        >{diagramStore.layoutParams.nodesep}</span
                    >
                </div>
                <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={diagramStore.layoutParams.nodesep}
                    class="w-full accent-indigo-500 h-1"
                    onchange={(e) =>
                        updateParam(
                            "nodesep",
                            parseFloat(e.currentTarget.value),
                        )}
                />
            </div>

            <!-- Rank Sep -->
            <div class="space-y-2">
                <div class="flex justify-between items-center text-[10px]">
                    <span
                        class="text-slate-500 uppercase font-bold flex items-center gap-1"
                    >
                        <Layers size={10} /> Layer Spacing
                    </span>
                    <span class="text-indigo-500 font-mono font-bold"
                        >{diagramStore.layoutParams.ranksep}</span
                    >
                </div>
                <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={diagramStore.layoutParams.ranksep}
                    class="w-full accent-indigo-500 h-1"
                    onchange={(e) =>
                        updateParam(
                            "ranksep",
                            parseFloat(e.currentTarget.value),
                        )}
                />
            </div>
        </div>

        <!-- Advanced Settings Toggle (Summary/Details) -->
        <details
            class="group border-t border-slate-100 dark:border-slate-800 pt-4"
        >
            <summary
                class="list-none flex items-center justify-between cursor-pointer text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none"
            >
                <span>Advanced Params</span>
                <span class="group-open:rotate-180 transition-transform">▼</span
                >
            </summary>
            <div class="mt-4 space-y-3">
                <div class="flex items-center justify-between text-[10px]">
                    <span class="text-slate-500">Allow Overlap</span>
                    <select
                        class="bg-slate-50 dark:bg-slate-800 border-none outline-none rounded p-1 text-[10px]"
                        value={diagramStore.layoutParams.overlap}
                        onchange={(e) =>
                            updateParam("overlap", e.currentTarget.value)}
                    >
                        <option value="false">No (Default)</option>
                        <option value="true">Yes</option>
                        <option value="scale">Scale Only</option>
                    </select>
                </div>
                <div class="flex items-center justify-between text-[10px]">
                    <span class="text-slate-500">Edge Smoothing (Splines)</span>
                    <select
                        class="bg-slate-50 dark:bg-slate-800 border-none outline-none rounded p-1 text-[10px]"
                        value={diagramStore.layoutParams.splines}
                        onchange={(e) =>
                            updateParam("splines", e.currentTarget.value)}
                    >
                        <option value="true">Smooth (Splines)</option>
                        <option value="line">Straight Lines</option>
                        <option value="ortho">Orthogonal</option>
                        <option value="curved">Curved</option>
                    </select>
                </div>
            </div>
        </details>
    {/if}

    <!-- Info Box -->
    <div
        class="p-3 bg-slate-50 dark:bg-slate-800/30 rounded border border-slate-100 dark:border-slate-800"
    >
        <p class="text-[9px] text-slate-400 leading-relaxed italic">
            Layout params are dynamically injected. {#if diagramStore.mode === "graphviz"}"Compact"
                is best for dense graphs.{:else}"Flow Direction" applies <code
                    >left to right direction</code
                > in PlantUML.{/if}
        </p>
    </div>
</div>

<style>
    input[type="range"] {
        -webkit-appearance: none;
        background: transparent;
        appearance: none;
    }
    input[type="range"]::-webkit-slider-runnable-track {
        width: 100%;
        height: 2px;
        background: #e2e8f0;
    }
    :global(.dark) input[type="range"]::-webkit-slider-runnable-track {
        background: #1e293b;
    }
    input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        height: 10px;
        width: 10px;
        border-radius: 50%;
        background: #6366f1;
        cursor: pointer;
        margin-top: -4px;
        box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
    }
</style>
