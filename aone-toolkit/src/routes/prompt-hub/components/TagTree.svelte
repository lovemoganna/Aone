<script lang="ts">
    import { promptStore } from "../lib/store.svelte";
    import type { Tag } from "../lib/types";
    import TagTree from "./TagTree.svelte";
    import {
        ChevronRight,
        ChevronDown,
        Folder,
        Hash,
        Pencil,
        Trash2,
    } from "lucide-svelte";
    import { slide } from "svelte/transition";
    import { untrack } from "svelte";

    let {
        tags,
        level = 0,
        onEditTag,
        onDeleteTag,
    } = $props<{
        tags: Tag[];
        level?: number;
        onEditTag: (tag: Tag) => void;
        onDeleteTag: (tag: Tag) => void;
    }>();

    let expanded = $state(new Set<string>());

    function toggle(id: string) {
        if (expanded.has(id)) {
            expanded.delete(id);
        } else {
            expanded.add(id);
        }
        expanded = new Set(expanded);
    }

    $effect(() => {
        if (level === 0 && tags.length > 0) {
            untrack(() => {
                let changed = false;
                tags.forEach((t: Tag) => {
                    if (!expanded.has(t.id)) {
                        expanded.add(t.id);
                        changed = true;
                    }
                });
                if (changed) expanded = new Set(expanded);
            });
        }
    });

    function getChildren(parentId: string) {
        return promptStore.tags.filter((t) => t.parentId === parentId);
    }
</script>

<div class="space-y-0.5">
    {#each tags as tag (tag.id)}
        {@const children = getChildren(tag.id)}
        {@const hasChildren = children.length > 0}
        {@const isActive = promptStore.activeTagId === tag.id}

        <div class="group relative">
            <div
                class="w-full text-left px-2 py-1.5 rounded-md flex items-center gap-1.5 text-xs transition-colors cursor-pointer {isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}"
                style="padding-left: {level * 10 + 6}px"
                onclick={() => {
                    promptStore.activeTagId = promptStore.activeTagId === tag.id ? null : tag.id;
                    if (hasChildren) toggle(tag.id);
                }}
                role="button"
                tabindex="0"
                onkeydown={(e) =>
                    e.key === "Enter" && (promptStore.activeTagId = tag.id)}
            >
                {#if hasChildren}
                    <span
                        class="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-150"
                        class:rotate-90={expanded.has(tag.id)}
                    >
                        <ChevronRight size={13} />
                    </span>
                {:else}
                    <span class="w-[13px]"></span>
                {/if}

                {#if hasChildren}
                    <Folder size={13} class="text-indigo-500 shrink-0" />
                {:else}
                    <Hash size={13} class="text-slate-400 shrink-0" />
                {/if}

                <span class="truncate flex-1">{tag.name}</span>
            </div>

            <!-- Action Buttons -->
            <div
                class="absolute right-1.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-2xs px-0.5"
            >
                <button
                    type="button"
                    onclick={(e) => {
                        e.stopPropagation();
                        onEditTag(tag);
                    }}
                    class="p-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    title="编辑标签"
                    aria-label="编辑标签"
                >
                    <Pencil size={11} />
                </button>
                <button
                    type="button"
                    onclick={(e) => {
                        e.stopPropagation();
                        onDeleteTag(tag);
                    }}
                    class="p-0.5 text-slate-400 hover:text-rose-500 transition-colors"
                    title="删除标签"
                    aria-label="删除标签"
                >
                    <Trash2 size={11} />
                </button>
            </div>

            {#if hasChildren && expanded.has(tag.id)}
                <div transition:slide|local={{ duration: 150 }}>
                    <TagTree
                        tags={children}
                        level={level + 1}
                        {onEditTag}
                        {onDeleteTag}
                    />
                </div>
            {/if}
        </div>
    {/each}
</div>
