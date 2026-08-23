<script lang="ts">
    import { promptStore } from "../lib/store.svelte";
    import {
        Folder,
        FolderOpen,
        Plus,
        Trash2,
        Edit2,
        Check,
        X,
    } from "lucide-svelte";
    import { slide } from "svelte/transition";
    import type { Collection } from "../lib/types";

    let {
        onDeleteCollection,
    } = $props<{
        onDeleteCollection: (collection: Collection) => void;
    }>();

    let isCreating = $state(false);
    let newName = $state("");
    let editingId = $state<string | null>(null);
    let editingName = $state("");

    function handleCreate() {
        if (newName.trim()) {
            promptStore.addCollection(newName.trim());
            newName = "";
            isCreating = false;
        }
    }

    function startEdit(id: string, name: string) {
        editingId = id;
        editingName = name;
    }

    function handleUpdate() {
        if (editingId && editingName.trim()) {
            promptStore.updateCollection(editingId, {
                name: editingName.trim(),
            });
            editingId = null;
        }
    }

    function handleDelete(e: MouseEvent, collection: Collection) {
        e.stopPropagation();
        onDeleteCollection(collection);
    }

    function selectCollection(id: string) {
        if (promptStore.activeCollectionId === id) {
            promptStore.activeCollectionId = null;
        } else {
            promptStore.activeCollectionId = id;
        }
    }
</script>

<div>
    <div class="flex items-center justify-between px-1 mb-1.5">
        <h3
            class="text-[11px] font-bold text-slate-400 uppercase tracking-wider"
        >
            集合分类
        </h3>
        <button
            type="button"
            class="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onclick={() => (isCreating = true)}
            title="新建集合"
            aria-label="新建集合"
        >
            <Plus size={13} />
        </button>
    </div>

    <div class="space-y-0.5">
        {#each promptStore.collections as collection (collection.id)}
            {@const isActive = promptStore.activeCollectionId === collection.id}

            {#if editingId === collection.id}
                <div
                    class="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-500 rounded-md"
                >
                    <input
                        type="text"
                        bind:value={editingName}
                        class="w-full text-xs bg-transparent outline-none text-slate-900 dark:text-slate-100 min-w-0"
                        onkeydown={(e) => e.key === "Enter" && handleUpdate()}
                    />
                    <button
                        type="button"
                        class="text-emerald-500 hover:text-emerald-600 p-0.5"
                        onclick={handleUpdate}
                        aria-label="确认修改"
                    >
                        <Check size={13} />
                    </button>
                    <button
                        type="button"
                        class="text-slate-400 hover:text-slate-600 p-0.5"
                        onclick={() => (editingId = null)}
                        aria-label="取消修改"
                    >
                        <X size={13} />
                    </button>
                </div>
            {:else}
                <div
                    class="group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors text-xs {isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}"
                    onclick={() => selectCollection(collection.id)}
                    onkeydown={(e) =>
                        e.key === "Enter" && selectCollection(collection.id)}
                    role="button"
                    tabindex="0"
                >
                    <div class="flex items-center gap-2 min-w-0">
                        {#if isActive}
                            <FolderOpen size={14} class="shrink-0 text-indigo-600 dark:text-indigo-400" />
                        {:else}
                            <Folder size={14} class="shrink-0 text-slate-400" />
                        {/if}
                        <span class="truncate">{collection.name}</span>
                    </div>

                    <div class="hidden group-hover:flex items-center gap-0.5">
                        <button
                            type="button"
                            class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded"
                            onclick={(e) => {
                                e.stopPropagation();
                                startEdit(collection.id, collection.name);
                            }}
                            title="重命名集合"
                            aria-label="重命名集合"
                        >
                            <Edit2 size={11} />
                        </button>
                        <button
                            type="button"
                            class="p-1 text-slate-400 hover:text-rose-500 transition-colors rounded"
                            onclick={(e) => handleDelete(e, collection)}
                            title="删除集合"
                            aria-label="删除集合"
                        >
                            <Trash2 size={11} />
                        </button>
                    </div>
                </div>
            {/if}
        {/each}

        {#if isCreating}
            <div transition:slide class="px-1 py-1">
                <div
                    class="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-500 rounded-md"
                >
                    <Folder size={14} class="text-slate-400 shrink-0" />
                    <input
                        type="text"
                        bind:value={newName}
                        class="w-full text-xs bg-transparent outline-none text-slate-900 dark:text-slate-100 min-w-0"
                        placeholder="输入集合名称..."
                        onkeydown={(e) => e.key === "Enter" && handleCreate()}
                    />
                    <button
                        type="button"
                        class="text-emerald-500 hover:text-emerald-600 p-0.5"
                        onclick={handleCreate}
                        aria-label="确认创建"
                    >
                        <Check size={13} />
                    </button>
                    <button
                        type="button"
                        class="text-slate-400 hover:text-slate-600 p-0.5"
                        onclick={() => (isCreating = false)}
                        aria-label="取消创建"
                    >
                        <X size={13} />
                    </button>
                </div>
            </div>
        {/if}

        {#if promptStore.collections.length === 0 && !isCreating}
            <div
                class="px-2 py-3 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-md"
            >
                暂无集合
            </div>
        {/if}
    </div>
</div>
