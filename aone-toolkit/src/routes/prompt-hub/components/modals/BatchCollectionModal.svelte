<script lang="ts">
    import { promptStore } from "../../lib/store.svelte";
    import { X, Check, Folder, FolderOpen } from "lucide-svelte";
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

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") onClose();
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
    class="fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4"
    transition:fade={{ duration: 120 }}
    onclick={onClose}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
>
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
    <div
        class="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl shadow-2xl flex flex-col max-h-[80vh] border border-slate-200 dark:border-slate-800 overflow-hidden"
        onclick={(e) => e.stopPropagation()}
        role="document"
        tabindex="-1"
        transition:scale={{ duration: 150, start: 0.97 }}
    >
        <div
            class="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-900/80"
        >
            <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">
                批量移动到集合
            </h3>
            <button
                type="button"
                onclick={onClose}
                class="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="关闭"
            >
                <X size={16} />
            </button>
        </div>

        <div class="p-4 overflow-y-auto flex-1 space-y-1.5">
            <button
                type="button"
                onclick={() => (selectedId = undefined)}
                class="w-full flex items-center gap-2.5 p-2.5 rounded-lg border transition-all text-left {selectedId === undefined
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'}"
            >
                <FolderOpen size={15} class="text-slate-400 shrink-0" />
                <div class="min-w-0 flex-1">
                    <div class="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        未分类（移出集合）
                    </div>
                    <div class="text-[10px] text-slate-400">
                        从当前所属集合中移除
                    </div>
                </div>
                {#if selectedId === undefined}
                    <Check size={14} class="text-indigo-600 dark:text-indigo-400 shrink-0" />
                {/if}
            </button>

            {#each promptStore.collections as collection}
                <button
                    type="button"
                    onclick={() => (selectedId = collection.id)}
                    class="w-full flex items-center gap-2.5 p-2.5 rounded-lg border transition-all text-left {selectedId === collection.id
                        ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'}"
                >
                    <Folder size={15} class="text-indigo-500 shrink-0" />
                    <div class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate flex-1">
                        {collection.name}
                    </div>
                    {#if selectedId === collection.id}
                        <Check size={14} class="text-indigo-600 dark:text-indigo-400 shrink-0" />
                    {/if}
                </button>
            {/each}
        </div>

        <div class="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/40 dark:bg-slate-900/40">
            <button
                type="button"
                onclick={onClose}
                class="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
                取消
            </button>
            <button
                type="button"
                onclick={handleSave}
                class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-colors"
            >
                确认移动
            </button>
        </div>
    </div>
</div>
