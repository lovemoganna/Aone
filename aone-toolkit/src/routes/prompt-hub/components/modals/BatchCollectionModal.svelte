<script lang="ts">
    import { promptStore } from "../../lib/store.svelte";
    import { X, Check, Folder, FolderOpen, HeartOff } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";

    let { onClose, onConfirm } = $props<{
        onClose: () => void;
        onConfirm: (collectionId: string | undefined) => void;
    }>();

    let selectedId = $state<string | undefined>(undefined);

    function handleSave() {
        onConfirm(selectedId);
        onClose();
    }
</script>

<div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
    transition:fade={{ duration: 150 }}
>
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
    <div
        class="bg-white dark:bg-gray-800 w-full max-w-sm rounded-xl shadow-2xl flex flex-col max-h-[80vh]"
        onclick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        transition:scale={{ duration: 200, start: 0.95 }}
    >
        <div
            class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
        >
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">
                Move to Collection
            </h3>
            <button
                onclick={onClose}
                class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                aria-label="Close"
            >
                <X size={18} />
            </button>
        </div>

        <div class="p-4 overflow-y-auto flex-1 space-y-2">
            <button
                onclick={() => (selectedId = undefined)}
                class="w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left group {selectedId ===
                undefined
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700'}"
            >
                <div
                    class="p-2 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:scale-110 transition-transform"
                >
                    <FolderOpen size={18} class="text-gray-500" />
                </div>
                <div>
                    <div class="font-medium text-gray-900 dark:text-gray-100">
                        No Collection
                    </div>
                    <div class="text-xs text-gray-500">
                        Remove from current collection
                    </div>
                </div>
                {#if selectedId === undefined}
                    <div class="ml-auto text-indigo-600">
                        <Check size={18} />
                    </div>
                {/if}
            </button>

            {#each promptStore.collections as collection}
                <button
                    onclick={() => (selectedId = collection.id)}
                    class="w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left group {selectedId ===
                    collection.id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700'}"
                >
                    <div
                        class="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/50 group-hover:scale-110 transition-transform"
                    >
                        <Folder
                            size={18}
                            class="text-indigo-600 dark:text-indigo-400"
                        />
                    </div>
                    <div
                        class="font-medium text-gray-900 dark:text-gray-100 truncate"
                    >
                        {collection.name}
                    </div>
                    {#if selectedId === collection.id}
                        <div class="ml-auto text-indigo-600">
                            <Check size={18} />
                        </div>
                    {/if}
                </button>
            {/each}
        </div>

        <div class="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
                onclick={handleSave}
                class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
                Move Prompts
            </button>
        </div>
    </div>
</div>
