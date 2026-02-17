<script lang="ts">
    import { promptStore } from "../lib/store.svelte";
    import type { Tag } from "../lib/types"; // Import Tag
    import TagTree from "./TagTree.svelte";
    import CollectionTree from "./CollectionTree.svelte";
    import {
        Search,
        Clock,
        Star,
        HelpCircle,
        Plus,
        BrainCircuit,
        Sun,
        Moon,
        Archive,
        Database,
    } from "lucide-svelte";
    import DataModal from "./modals/DataModal.svelte";
    import { Button } from "$lib/components/ui";
    import { onMount } from "svelte";

    let isDark = $state(false);
    let isDataModalOpen = $state(false);

    onMount(() => {
        isDark = document.documentElement.classList.contains("dark");
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (
                    mutation.type === "attributes" &&
                    mutation.attributeName === "class"
                ) {
                    isDark =
                        document.documentElement.classList.contains("dark");
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    });

    function toggleTheme() {
        if (isDark) {
            document.documentElement.classList.remove("dark");
        } else {
            document.documentElement.classList.add("dark");
        }
        isDark = !isDark;
    }

    // Remove local searchTerm declaration

    function getRootTags() {
        return promptStore.tags.filter((t) => t.parentId === null);
    }

    function setFilter(type: "all" | "favorites" | "untagged" | "archived") {
        promptStore.activeFilter = type;
        promptStore.activeTagId = null; // Clear tag when main filter selected
    }
    // Props
    let { onEditTag } = $props<{ onEditTag: (tag: Tag) => void }>();
</script>

<div
    class="w-80 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full glass-sidebar"
>
    <!-- Header -->
    <div
        class="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between cursor-pointer"
        onclick={() => setFilter("all")}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === "Enter" && setFilter("all")}
    >
        <div>
            <h1 class="text-2xl font-bold text-primary flex items-center gap-2">
                <BrainCircuit class="text-indigo-500" />
                PromptHub
            </h1>
            <p class="text-sm text-gray-500 mt-1">Personal Prompt Manager</p>
        </div>
        <button
            onclick={(e) => {
                e.stopPropagation();
                toggleTheme();
            }}
            class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 transition-colors"
            title="Toggle Theme"
        >
            {#if isDark}
                <Sun size={20} />
            {:else}
                <Moon size={20} />
            {/if}
        </button>
    </div>

    <!-- Search -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-800">
        <div class="relative">
            <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"
            />
            <input
                id="search-input"
                type="text"
                bind:value={promptStore.searchTerm}
                placeholder="Search prompts..."
                class="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
        </div>
    </div>

    <!-- Quick Filters -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-800">
        <h3
            class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3"
        >
            Quick Filters
        </h3>
        <div class="space-y-1">
            <button
                onclick={() => setFilter("favorites")}
                class="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors"
                class:bg-indigo-50={promptStore.activeFilter === "favorites"}
                class:text-indigo-600={promptStore.activeFilter === "favorites"}
                class:hover:bg-gray-200={promptStore.activeFilter !==
                    "favorites"}
                class:hover:dark:bg-gray-800={promptStore.activeFilter !==
                    "favorites"}
            >
                <Star size={16} /> Favorites
            </button>
            <button
                onclick={() => setFilter("untagged")}
                class="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors"
                class:bg-indigo-50={promptStore.activeFilter === "untagged"}
                class:text-indigo-600={promptStore.activeFilter === "untagged"}
                class:hover:bg-gray-200={promptStore.activeFilter !==
                    "untagged"}
                class:hover:dark:bg-gray-800={promptStore.activeFilter !==
                    "untagged"}
            >
                <HelpCircle size={16} /> Untagged
            </button>
            <button
                onclick={() => setFilter("archived")}
                class="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors"
                class:bg-indigo-50={promptStore.activeFilter === "archived"}
                class:text-indigo-600={promptStore.activeFilter === "archived"}
                class:hover:bg-gray-200={promptStore.activeFilter !==
                    "archived"}
                class:hover:dark:bg-gray-800={promptStore.activeFilter !==
                    "archived"}
            >
                <Archive size={16} /> Archived
            </button>
        </div>
    </div>

    <!-- Content Scroller -->
    <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <CollectionTree />

        <!-- Tags -->
        <div>
            <div class="flex items-center justify-between mb-3 px-2">
                <h3
                    class="text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                    Tags
                </h3>
                <button
                    class="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                >
                    <Plus size={14} />
                </button>
            </div>
            <TagTree tags={getRootTags()} {onEditTag} />
        </div>
    </div>

    <!-- Footer -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
            onclick={() => (isDataModalOpen = true)}
            class="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
            <Database size={16} /> Data Management
        </button>
    </div>

    <DataModal
        bind:isOpen={isDataModalOpen}
        onClose={() => (isDataModalOpen = false)}
    />
</div>

<style>
    .glass-sidebar {
        backdrop-filter: blur(12px);
    }
</style>
