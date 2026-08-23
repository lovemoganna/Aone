<script lang="ts">
    import { X, GitCompare, PlusCircle, MinusCircle, Edit, ArrowRight } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";
    import DiffViewer from "../../../developer-utilities/components/DiffViewer.svelte";
    import { diffDiagramModels } from "../../lib/parser";
    import { diagramStore } from "../../lib/store.svelte";

    let {
        isOpen = $bindable(false),
        onClose,
        originalCode,
        modifiedCode,
    } = $props<{
        isOpen: boolean;
        onClose: () => void;
        originalCode: string;
        modifiedCode: string;
    }>();

    let viewMode = $state<"structural" | "text">("structural");

    let diffSummary = $derived(
        diffDiagramModels(originalCode || "", modifiedCode || "", diagramStore.mode)
    );
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        transition:fade={{ duration: 100 }}
        onclick={onClose}
        onkeydown={(event) => {
            if (event.key === "Escape") {
                onClose();
            }
        }}
        role="button"
        tabindex="0"
        aria-label="Close compare modal"
    >
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
            class="bg-white dark:bg-[#0b0f17] rounded-lg shadow-2xl w-full max-w-5xl h-[82vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
            transition:slide={{ duration: 120 }}
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            tabindex="-1"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shrink-0"
            >
                <div class="flex items-center gap-2">
                    <GitCompare size={15} class="text-slate-700 dark:text-slate-300" />
                    <div>
                        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            Diagram Version Comparison
                        </h3>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <div class="flex p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded border border-slate-200/80 dark:border-slate-700/60 text-xs">
                        <button
                            class="px-2.5 py-1 rounded transition-colors {viewMode === 'structural' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}"
                            onclick={() => (viewMode = "structural")}
                        >
                            Structural Diff
                        </button>
                        <button
                            class="px-2.5 py-1 rounded transition-colors {viewMode === 'text' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}"
                            onclick={() => (viewMode = "text")}
                        >
                            Source Diff
                        </button>
                    </div>
                    <button
                        class="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        onclick={onClose}
                        title="Close"
                    >
                        <X size={15} />
                    </button>
                </div>
            </div>

            <!-- Body -->
            <div class="flex-1 p-4 overflow-y-auto min-h-0 text-xs">
                {#if viewMode === "structural"}
                    <div class="space-y-4">
                        <!-- Stats Grid -->
                        <div class="grid grid-cols-4 gap-2">
                            <div class="p-3 rounded bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40">
                                <div class="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase">
                                    <PlusCircle size={13} /> Added Nodes
                                </div>
                                <div class="text-xl font-bold font-mono text-emerald-800 dark:text-emerald-300 mt-1">
                                    +{diffSummary.addedNodes.length}
                                </div>
                            </div>

                            <div class="p-3 rounded bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40">
                                <div class="text-[11px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5 uppercase">
                                    <MinusCircle size={13} /> Removed Nodes
                                </div>
                                <div class="text-xl font-bold font-mono text-rose-800 dark:text-rose-300 mt-1">
                                    -{diffSummary.removedNodes.length}
                                </div>
                            </div>

                            <div class="p-3 rounded bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
                                <div class="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 uppercase">
                                    <Edit size={13} /> Modified Nodes
                                </div>
                                <div class="text-xl font-bold font-mono text-amber-800 dark:text-amber-300 mt-1">
                                    ~{diffSummary.modifiedNodes.length}
                                </div>
                            </div>

                            <div class="p-3 rounded bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                                <div class="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase">
                                    <ArrowRight size={13} /> Edge Changes
                                </div>
                                <div class="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
                                    +{diffSummary.addedEdges.length} / -{diffSummary.removedEdges.length}
                                </div>
                            </div>
                        </div>

                        <!-- Details lists -->
                        <div class="grid grid-cols-2 gap-3">
                            <div class="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
                                <h4 class="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Node Modifications
                                </h4>
                                {#if diffSummary.addedNodes.length === 0 && diffSummary.removedNodes.length === 0 && diffSummary.modifiedNodes.length === 0}
                                    <p class="text-xs text-slate-400">No node changes detected.</p>
                                {:else}
                                    <div class="space-y-1 text-xs font-mono">
                                        {#each diffSummary.addedNodes as n}
                                            <div class="px-2 py-0.5 bg-emerald-100/60 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded">
                                                + {n} (New)
                                            </div>
                                        {/each}
                                        {#each diffSummary.modifiedNodes as n}
                                            <div class="px-2 py-0.5 bg-amber-100/60 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded">
                                                ~ {n} (Modified)
                                            </div>
                                        {/each}
                                        {#each diffSummary.removedNodes as n}
                                            <div class="px-2 py-0.5 bg-rose-100/60 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 rounded">
                                                - {n} (Deleted)
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>

                            <div class="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
                                <h4 class="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Relationship Changes
                                </h4>
                                {#if diffSummary.addedEdges.length === 0 && diffSummary.removedEdges.length === 0}
                                    <p class="text-xs text-slate-400">No edge changes detected.</p>
                                {:else}
                                    <div class="space-y-1 text-xs font-mono">
                                        {#each diffSummary.addedEdges as e}
                                            <div class="px-2 py-0.5 bg-emerald-100/60 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded">
                                                + {e}
                                            </div>
                                        {/each}
                                        {#each diffSummary.removedEdges as e}
                                            <div class="px-2 py-0.5 bg-rose-100/60 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 rounded">
                                                - {e}
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                {:else}
                    <DiffViewer textA={originalCode} textB={modifiedCode} />
                {/if}
            </div>

            <!-- Footer -->
            <div
                class="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex justify-end shrink-0"
            >
                <button
                    class="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded text-xs font-semibold transition-colors shadow-xs"
                    onclick={onClose}
                >
                    Close Comparison
                </button>
            </div>
        </div>
    </div>
{/if}
