<script lang="ts">
    import { X, History, Clock, RotateCcw, GitCompare } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";
    import { diagramStore, type HistoryItem } from "../../lib/store.svelte";

    let {
        isOpen = $bindable(false),
        onClose,
        onDiff,
    } = $props<{
        isOpen: boolean;
        onClose: () => void;
        onDiff: (original: string) => void;
    }>();

    let activeHistory = $derived(
        diagramStore.documents.find(
            (d) => d.id === diagramStore.activeDocumentId,
        )?.history || [],
    );

    // Reverse to show newest first
    let sortedHistory = $derived([...activeHistory].reverse());

    function formatTime(ts: number) {
        return new Date(ts).toLocaleTimeString();
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        transition:fade={{ duration: 100 }}
        onclick={onClose}
        onkeydown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabindex="0"
    >
        <div
            class="bg-white dark:bg-[#0b0f17] rounded-lg shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[80vh] flex flex-col"
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
                    <History size={15} class="text-slate-700 dark:text-slate-300" />
                    <h3
                        class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200"
                    >
                        Local History
                    </h3>
                </div>
                <button
                    class="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    onclick={onClose}
                >
                    <X size={15} />
                </button>
            </div>

            <!-- List -->
            <div class="flex-1 overflow-y-auto p-3 space-y-1.5 text-xs">
                {#if sortedHistory.length === 0}
                    <div class="text-center py-8 text-slate-400">
                        <Clock class="mx-auto mb-2 opacity-50" size={20} />
                        <p>No snapshots recorded yet.</p>
                    </div>
                {/if}

                {#each sortedHistory as item}
                    <div
                        class="p-2.5 bg-white dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800 hover:border-slate-400 transition-colors group flex items-center justify-between"
                    >
                        <div class="flex items-center gap-2.5">
                            <div
                                class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold"
                            >
                                {formatTime(item.timestamp)}
                            </div>
                            <div class="text-[11px] text-slate-400 font-mono">
                                {item.code.length} bytes
                            </div>
                        </div>

                        <div
                            class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <button
                                class="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                title="Diff with Current"
                                onclick={() => onDiff(item.code)}
                            >
                                <GitCompare size={14} />
                            </button>
                            <button
                                class="p-1 text-slate-600 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded transition-colors"
                                title="Restore Snapshot"
                                onclick={() => {
                                    diagramStore.restoreHistory(item);
                                    onClose();
                                }}
                            >
                                <RotateCcw size={14} />
                            </button>
                        </div>
                    </div>
                {/each}
            </div>

            <div
                class="p-2.5 text-[11px] text-center text-slate-400 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shrink-0 font-mono"
            >
                Snapshots captured on render
            </div>
        </div>
    </div>
{/if}
