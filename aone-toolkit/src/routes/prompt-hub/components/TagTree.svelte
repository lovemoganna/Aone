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
    } = $props<{
        tags: Tag[];
        level?: number;
        onEditTag: (tag: Tag) => void;
    }>();

    // State for expanded folders (local to component instance for recursion simpicity,
    // or we can use the store if we want global persistence of expansion state)
    // For now, let's just make them all expanded or toggleable.
    let expanded = $state(new Set<string>());

    function toggle(id: string) {
        if (expanded.has(id)) {
            expanded.delete(id);
        } else {
            expanded.add(id);
        }
        // Force update Set reactivity
        expanded = new Set(expanded);
    }

    // Auto-expand if level 0?
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

        <div class="group relative">
            <div
                class="w-full text-left px-2 py-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-2 text-sm transition-colors cursor-pointer"
                style="padding-left: {level * 12 + 8}px"
                onclick={() => {
                    promptStore.activeTagId = tag.id;
                    if (hasChildren) toggle(tag.id);
                }}
                role="button"
                tabindex="0"
                onkeydown={(e) =>
                    e.key === "Enter" && (promptStore.activeTagId = tag.id)}
            >
                {#if hasChildren}
                    <span
                        class="text-gray-400 group-hover:text-gray-600 transition-transform duration-200"
                        class:rotate-90={expanded.has(tag.id)}
                    >
                        <ChevronRight size={14} />
                    </span>
                {:else}
                    <span class="w-[14px]"></span>
                {/if}

                {#if hasChildren}
                    <Folder size={14} class="text-blue-500" />
                {:else}
                    <Hash size={14} class="text-gray-400" />
                {/if}

                <span class="truncate flex-1">{tag.name}</span>
            </div>

            <!-- Action Buttons -->
            <div
                class="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded shadow-sm px-1"
            >
                <button
                    onclick={(e) => {
                        e.stopPropagation();
                        onEditTag(tag);
                    }}
                    class="p-1 text-gray-500 hover:text-indigo-500 transition-colors"
                >
                    <Pencil size={12} />
                </button>
                <button
                    onclick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete tag "' + tag.name + '"?'))
                            promptStore.deleteTag(tag.id);
                    }}
                    class="p-1 text-gray-500 hover:text-red-500 transition-colors"
                >
                    <Trash2 size={12} />
                </button>
            </div>

            {#if hasChildren && expanded.has(tag.id)}
                <div transition:slide|local={{ duration: 200 }}>
                    <TagTree tags={children} level={level + 1} {onEditTag} />
                </div>
            {/if}
        </div>
    {/each}
</div>
