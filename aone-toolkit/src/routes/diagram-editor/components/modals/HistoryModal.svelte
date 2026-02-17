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
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        transition:fade
        onclick={onClose}
        onkeydown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabindex="0"
    >
        <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700 max-h-[80vh] flex flex-col"
            transition:slide={{ duration: 200 }}
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            tabindex="-1"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 shrink-0"
            >
                <h3
                    class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
                >
                    <History size={20} class="text-indigo-500" />
                    Local History
                </h3>
                <button
                    class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500"
                    onclick={onClose}
                >
                    <X size={20} />
                </button>
            </div>

            <!-- List -->
            <div class="flex-1 overflow-y-auto p-2 space-y-2">
                {#if sortedHistory.length === 0}
                    <div class="text-center py-10 text-gray-500">
                        <Clock class="mx-auto mb-2 opacity-50" />
                        <p>No history yet.</p>
                    </div>
                {/if}

                {#each sortedHistory as item}
                    <div
                        class="p-3 bg-white dark:bg-gray-900/30 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group flex items-center justify-between"
                    >
                        <div class="flex items-center gap-3">
                            <div
                                class="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 font-mono text-xs"
                            >
                                {formatTime(item.timestamp)}
                            </div>
                            <div class="text-xs text-gray-500">
                                {item.code.length} chars
                            </div>
                        </div>

                        <div
                            class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <button
                                class="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded"
                                title="Diff with Current"
                                onclick={() => onDiff(item.code)}
                            >
                                <GitCompare size={14} />
                            </button>
                            <button
                                class="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                title="Restore Version"
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
                class="p-3 text-xs text-center text-gray-400 border-t border-gray-100 dark:border-gray-800 shrink-0"
            >
                Snapshots are taken automatically after changes.
            </div>
        </div>
    </div>
{/if}
