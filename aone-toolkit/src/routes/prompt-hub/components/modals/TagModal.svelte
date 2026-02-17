<script lang="ts">
    import { promptStore } from "../../lib/store.svelte";
    import type { Tag } from "../../lib/types";
    import { X } from "lucide-svelte";

    let { onClose, tagToEdit = null } = $props<{
        onClose: () => void;
        tagToEdit?: Tag | null;
    }>();

    let name = $state(tagToEdit?.name || "");
    let parentId = $state<string | null>(tagToEdit?.parentId || null);

    function handleSave() {
        if (!name.trim()) return;

        if (tagToEdit) {
            promptStore.updateTag(tagToEdit.id, { name, parentId });
        } else {
            const result = promptStore.addTag(name, parentId);
            if (!result) {
                alert("Tag already exists");
                return;
            }
        }
        onClose();
    }
</script>

<div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
>
    <div
        class="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl flex flex-col"
    >
        <div
            class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
        >
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {tagToEdit ? "Edit Tag" : "New Tag"}
            </h2>
            <button
                onclick={onClose}
                class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
                <X size={20} />
            </button>
        </div>

        <div class="p-6 space-y-4">
            <div>
                <label
                    class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
                    >Name</label
                >
                <input
                    type="text"
                    bind:value={name}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none"
                    placeholder="e.g. Work"
                />
            </div>
            <div>
                <label
                    class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
                    >Parent Tag</label
                >
                <select
                    bind:value={parentId}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none"
                >
                    <option value={null}>None (Top Level)</option>
                    {#each promptStore.tags as tag}
                        <option value={tag.id}
                            >{"--".repeat(tag.level)} {tag.name}</option
                        >
                    {/each}
                </select>
            </div>
        </div>

        <div
            class="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3"
        >
            <button
                onclick={onClose}
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
            >
                Cancel
            </button>
            <button
                onclick={handleSave}
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-colors"
            >
                Save
            </button>
        </div>
    </div>
</div>
