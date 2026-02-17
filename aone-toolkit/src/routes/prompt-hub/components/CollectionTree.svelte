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

    function handleDelete(e: MouseEvent, id: string) {
        e.stopPropagation();
        if (
            confirm(
                "Delete collection? Prompts inside will remain but be removed from this collection.",
            )
        ) {
            promptStore.deleteCollection(id);
            if (promptStore.activeCollectionId === id) {
                promptStore.activeCollectionId = null;
            }
        }
    }

    function selectCollection(id: string) {
        if (promptStore.activeCollectionId === id) {
            promptStore.activeCollectionId = null;
        } else {
            promptStore.activeCollectionId = id;
            promptStore.activeTagId = null;
            promptStore.activeFilter = "all";
        }
    }
</script>

<div class="mt-6">
    <div class="flex items-center justify-between px-2 mb-2">
        <h3
            class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
        >
            Collections
        </h3>
        <button
            class="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            onclick={() => (isCreating = true)}
            title="New Collection"
        >
            <Plus size={14} />
        </button>
    </div>

    <div class="space-y-0.5">
        {#each promptStore.collections as collection (collection.id)}
            {@const isActive = promptStore.activeCollectionId === collection.id}

            {#if editingId === collection.id}
                <div
                    class="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 border border-indigo-500 rounded-lg"
                >
                    <input
                        type="text"
                        bind:value={editingName}
                        class="w-full text-sm bg-transparent outline-none text-gray-900 dark:text-gray-100 min-w-0"
                        onkeydown={(e) => e.key === "Enter" && handleUpdate()}
                    />
                    <button
                        class="text-green-500"
                        onclick={handleUpdate}
                        aria-label="Confirm update"><Check size={14} /></button
                    >
                    <button
                        class="text-gray-400"
                        onclick={() => (editingId = null)}
                        aria-label="Cancel edit"><X size={14} /></button
                    >
                </div>
            {:else}
                <div
                    class="group flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer transition-colors text-sm {isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}"
                    onclick={() => selectCollection(collection.id)}
                    onkeydown={(e) =>
                        e.key === "Enter" && selectCollection(collection.id)}
                    role="button"
                    tabindex="0"
                >
                    <div class="flex items-center gap-2 min-w-0">
                        {#if isActive}
                            <FolderOpen size={16} class="flex-shrink-0" />
                        {:else}
                            <Folder size={16} class="flex-shrink-0" />
                        {/if}
                        <span class="truncate">{collection.name}</span>
                    </div>

                    <div class="hidden group-hover:flex items-center gap-1">
                        <button
                            class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            onclick={(e) => {
                                e.stopPropagation();
                                startEdit(collection.id, collection.name);
                            }}
                        >
                            <Edit2 size={12} />
                        </button>
                        <button
                            class="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            onclick={(e) => handleDelete(e, collection.id)}
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>
            {/if}
        {/each}

        {#if isCreating}
            <div transition:slide class="px-2 py-1">
                <div
                    class="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 border border-indigo-500 rounded-lg"
                >
                    <Folder size={16} class="text-gray-400 flex-shrink-0" />
                    <input
                        type="text"
                        bind:value={newName}
                        class="w-full text-sm bg-transparent outline-none text-gray-900 dark:text-gray-100 min-w-0"
                        placeholder="Name..."
                        onkeydown={(e) => e.key === "Enter" && handleCreate()}
                    />
                    <button
                        class="text-green-500"
                        onclick={handleCreate}
                        aria-label="Confirm create"><Check size={14} /></button
                    >
                    <button
                        class="text-gray-400"
                        onclick={() => (isCreating = false)}
                        aria-label="Cancel create"><X size={14} /></button
                    >
                </div>
            </div>
        {/if}

        {#if promptStore.collections.length === 0 && !isCreating}
            <div
                class="px-2 py-4 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg"
            >
                No collections yet
            </div>
        {/if}
    </div>
</div>
