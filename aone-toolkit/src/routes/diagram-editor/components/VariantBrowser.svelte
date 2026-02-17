<script lang="ts">
    import { diagramStore } from "../lib/store.svelte";
    import { renderGraphviz } from "../lib/graphviz";
    import { X, Check } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";

    let { isOpen = $bindable(false) } = $props<{ isOpen: boolean }>();

    // Variant matrices
    const engines = ["dot", "neato", "fdp", "twopi", "circo"];
    const directions = ["TB", "LR", "BT"];

    let variants = $state<
        Array<{
            id: string;
            engine: string;
            rankdir: string;
            nodesep: number;
            svg: string;
            loading: boolean;
        }>
    >([]);

    async function generateVariants() {
        if (!isOpen || diagramStore.mode !== "graphviz") return;

        variants = [];
        const baseCode = diagramStore.code;

        // Create 15 variants (5 engines x 3 dirs)
        const newVariants = [];
        for (const engine of engines) {
            for (const dir of directions) {
                newVariants.push({
                    id: `${engine}-${dir}`,
                    engine,
                    rankdir: dir,
                    nodesep: 0.5,
                    svg: "",
                    loading: true,
                });
            }
        }
        variants = newVariants;

        // Render them sequentially or in batches
        for (let i = 0; i < variants.length; i++) {
            const v = variants[i];
            try {
                // Inject the specific direction for this variant
                let vCode = baseCode;
                const injection = `\n  rankdir=${v.rankdir};\n  nodesep=${v.nodesep};\n`;
                const braceIndex = vCode.indexOf("{");
                if (braceIndex !== -1) {
                    vCode =
                        vCode.slice(0, braceIndex + 1) +
                        injection +
                        vCode.slice(braceIndex + 1);
                }

                const svg = await renderGraphviz(vCode, v.engine as any);
                variants[i].svg = svg;
                variants[i].loading = false;
            } catch (e) {
                variants[i].loading = false;
            }
        }
    }

    function applyVariant(v: (typeof variants)[0]) {
        diagramStore.engine = v.engine as any;
        diagramStore.layoutParams.rankdir = v.rankdir;
        diagramStore.layoutParams.nodesep = v.nodesep;
        diagramStore.render();
        isOpen = false;
    }

    import { untrack } from "svelte";

    $effect(() => {
        if (isOpen) {
            untrack(() => generateVariants());
        }
    });
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-8"
        transition:fade={{ duration: 200 }}
    >
        <div
            class="w-full h-full max-w-6xl bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl"
            transition:scale={{ start: 0.95, duration: 200 }}
        >
            <!-- Header -->
            <div
                class="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50"
            >
                <div>
                    <h2
                        class="text-xl font-bold text-white flex items-center gap-3"
                    >
                        Variant Browser Pro <span
                            class="text-[10px] bg-indigo-500 px-2 py-0.5 rounded-full uppercase tracking-tighter"
                            >AI Layout</span
                        >
                    </h2>
                    <p class="text-xs text-slate-400 mt-1">
                        Exploring {variants.length} layout topologies for your current
                        graphviz source.
                    </p>
                </div>
                <button
                    class="p-2 hover:bg-white/10 rounded-full transition-colors"
                    onclick={() => (isOpen = false)}
                >
                    <X class="text-slate-400" />
                </button>
            </div>

            <!-- Grid -->
            <div class="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <div
                    class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                >
                    {#each variants as v}
                        <button
                            class="group relative flex flex-col bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-indigo-500/50 hover:bg-slate-800 transition-all text-left h-48"
                            onclick={() => applyVariant(v)}
                        >
                            <div
                                class="flex-1 bg-white/5 p-4 flex items-center justify-center overflow-hidden"
                            >
                                {#if v.loading}
                                    <div
                                        class="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"
                                    ></div>
                                {:else if v.svg}
                                    <div
                                        class="w-full h-full flex items-center justify-center scale-x-125 origin-center transform-gpu"
                                    >
                                        {@html v.svg}
                                    </div>
                                {:else}
                                    <span class="text-[10px] text-slate-600"
                                        >Render Failed</span
                                    >
                                {/if}
                            </div>

                            <div
                                class="p-3 border-t border-slate-700/50 bg-slate-900/50 flex items-center justify-between"
                            >
                                <div class="flex flex-col">
                                    <span
                                        class="text-[10px] uppercase font-bold text-slate-400 group-hover:text-indigo-400 transition-colors"
                                        >{v.engine}</span
                                    >
                                    <span class="text-[9px] text-slate-500"
                                        >{v.rankdir} Direction</span
                                    >
                                </div>
                                {#if diagramStore.engine === v.engine && diagramStore.layoutParams.rankdir === v.rankdir}
                                    <Check size={14} class="text-emerald-500" />
                                {/if}
                            </div>

                            <!-- Hover Overlay -->
                            <div
                                class="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                            ></div>
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Footer -->
            <div
                class="p-4 border-t border-slate-800 bg-slate-950/20 flex justify-center"
            >
                <p class="text-[10px] text-slate-500">
                    Pick a topology to apply the engine and layout parameters
                    immediately.
                </p>
            </div>
        </div>
    </div>
{/if}

<style>
    :global(.group svg) {
        max-width: 100%;
        max-height: 100%;
        width: auto !important;
        height: auto !important;
        filter: invert(0.8) contrast(1.2);
    }
</style>
