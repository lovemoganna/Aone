<script lang="ts">
    import { promptStore } from "../../lib/store.svelte";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import type { Tag } from "../../lib/types";
    import { X, Tag as TagIcon } from "lucide-svelte";
    import { fade, scale } from "svelte/transition";

    let { onClose, tagToEdit = null } = $props<{
        onClose: () => void;
        tagToEdit?: Tag | null;
    }>();

    let name = $state("");
    let parentId = $state<string | null>(null);
    let activeTagId = $state<string | null>(null);

    $effect(() => {
        const nextTagId = tagToEdit?.id ?? null;
        if (nextTagId !== activeTagId) {
            activeTagId = nextTagId;
            name = tagToEdit?.name || "";
            parentId = tagToEdit?.parentId || null;
        }
    });

    function handleSave() {
        if (!name.trim()) return;

        if (tagToEdit) {
            promptStore.updateTag(tagToEdit.id, { name: name.trim(), parentId });
            toastStore.success(`已更新标签「${name.trim()}」`);
        } else {
            const result = promptStore.addTag(name.trim(), parentId);
            if (!result) {
                toastStore.warning("该标签已存在");
                return;
            }
            toastStore.success(`已创建标签「${name.trim()}」`);
        }
        onClose();
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") onClose();
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
    class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    transition:fade={{ duration: 120 }}
    onclick={onClose}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        class="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden"
        transition:scale={{ duration: 150, start: 0.97 }}
        onclick={(event) => event.stopPropagation()}
        role="document"
        tabindex="-1"
    >
        <div
            class="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-900/80"
        >
            <div class="flex items-center gap-2">
                <TagIcon size={16} class="text-indigo-500" />
                <h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {tagToEdit ? "编辑标签" : "新建标签"}
                </h2>
            </div>
            <button
                type="button"
                onclick={onClose}
                class="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="关闭"
                aria-label="关闭"
            >
                <X size={16} />
            </button>
        </div>

        <div class="p-5 space-y-3.5">
            <div>
                <label
                    for="tag-modal-name"
                    class="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300"
                >
                    标签名称
                </label>
                <input
                    id="tag-modal-name"
                    type="text"
                    bind:value={name}
                    class="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none text-xs"
                    placeholder="例如：开发、写作、测试"
                    onkeydown={(e) => e.key === "Enter" && handleSave()}
                />
            </div>
            <div>
                <label
                    for="tag-modal-parent"
                    class="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300"
                >
                    父级标签
                </label>
                <select
                    id="tag-modal-parent"
                    bind:value={parentId}
                    class="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none text-xs"
                >
                    <option value={null}>无（顶级标签）</option>
                    {#each promptStore.tags as tag}
                        {#if !tagToEdit || tag.id !== tagToEdit.id}
                            <option value={tag.id}>
                                {"--".repeat(tag.level)} {tag.name}
                            </option>
                        {/if}
                    {/each}
                </select>
            </div>
        </div>

        <div
            class="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/40 dark:bg-slate-900/40"
        >
            <button
                type="button"
                onclick={onClose}
                class="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
            >
                取消
            </button>
            <button
                type="button"
                onclick={handleSave}
                class="px-3.5 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-2xs text-xs font-semibold transition-colors"
            >
                保存
            </button>
        </div>
    </div>
</div>
