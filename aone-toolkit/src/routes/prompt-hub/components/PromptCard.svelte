<script lang="ts">
    import type { Prompt } from "../lib/types";
    import {
        Copy,
        Edit,
        Star,
        Trash2,
        Check,
        FileJson,
        Code,
        FileText,
        ChevronDown,
        Files,
        Archive,
        ArchiveRestore,
        Play,
    } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";

    let {
        prompt,
        onDelete,
        onEdit,
        onToggleFavorite,
        onDuplicate,
        onArchive,
        onRun,
        isSelected = false,
        onSelect,
    } = $props<{
        prompt: Prompt;
        onDelete: (id: string) => void;
        onEdit: (id: string) => void;
        onToggleFavorite: (id: string) => void;
        onDuplicate?: (id: string) => void;
        onArchive?: (id: string) => void;
        onRun?: (id: string) => void;
        isSelected?: boolean;
        onSelect?: (id: string) => void;
    }>();

    let copied = $state(false);
    let isMenuOpen = $state(false);

    async function copyContent(format: "text" | "json" | "python") {
        if (!prompt.content) return;

        let textToCopy = "";
        switch (format) {
            case "json":
                textToCopy = JSON.stringify(prompt, null, 2);
                break;
            case "python":
                textToCopy = `prompt = """${prompt.content}"""`;
                break;
            default:
                textToCopy = prompt.content;
        }

        try {
            await navigator.clipboard.writeText(textToCopy);
            copied = true;
            isMenuOpen = false;
            // Removed setTimeout to avoid linter warning if unmounted, though harmless here
            setTimeout(() => (copied = false), 2000);
        } catch (err) {
            console.error("Failed to copy", err);
        }
    }
</script>

<svelte:window onclick={() => (isMenuOpen = false)} />

<div
    class="prompt-card p-5 flex flex-col h-full group relative"
    class:ring-2={isSelected}
    class:ring-indigo-500={isSelected}
    transition:fade
>
    <div class="flex items-start justify-between mb-3">
        <div class="flex items-center gap-2">
            <!-- Selection Checkbox -->
            <input
                type="checkbox"
                checked={isSelected}
                onclick={(e) => {
                    e.stopPropagation();
                    if (onSelect) onSelect(prompt.id);
                }}
                class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                class:!opacity-100={isSelected}
            />
            <h3
                class="font-semibold text-lg text-gray-800 dark:text-gray-100 line-clamp-1"
            >
                {prompt.title}
            </h3>
        </div>
        <button
            onclick={() => onToggleFavorite(prompt.id)}
            class="text-gray-400 hover:text-yellow-500 transition-colors"
            class:text-yellow-500={prompt.favorite}
        >
            <Star size={18} fill={prompt.favorite ? "currentColor" : "none"} />
        </button>
    </div>

    <p
        class="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 min-h-[2.5em]"
    >
        {prompt.description || prompt.content}
    </p>

    <!-- Tags -->
    <div class="flex flex-wrap gap-2 mb-4">
        {#each prompt.tags as tag}
            <span
                class="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs rounded-full"
            >
                #{tag}
            </span>
        {/each}
    </div>

    <div
        class="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700/50"
    >
        <span class="text-xs text-gray-400">Used {prompt.usageCount} times</span
        >

        <div
            class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity relative"
        >
            <!-- Run Button -->
            <button
                onclick={() => onRun?.(prompt.id)}
                class="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-md transition-colors"
                title="Run Prompt"
            >
                <Play size={16} fill="currentColor" />
            </button>
            <div class="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

            <div class="relative">
                <button
                    onclick={() => (isMenuOpen = !isMenuOpen)}
                    class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center gap-1"
                    class:text-green-500={copied}
                    class:text-gray-500={!copied}
                    title="Copy Options"
                >
                    {#if copied}
                        <Check size={16} />
                    {:else}
                        <Copy size={16} />
                    {/if}
                    <ChevronDown size={12} class="opacity-50" />
                </button>

                {#if isMenuOpen}
                    <div
                        class="absolute bottom-full right-0 mb-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-20 flex flex-col"
                        transition:slide={{ duration: 150 }}
                    >
                        <button
                            class="px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                            onclick={() => copyContent("text")}
                        >
                            <FileText size={14} /> Text
                        </button>
                        <button
                            class="px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                            onclick={() => copyContent("json")}
                        >
                            <FileJson size={14} /> JSON
                        </button>
                        <button
                            class="px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                            onclick={() => copyContent("python")}
                        >
                            <Code size={14} /> Python
                        </button>
                    </div>
                {/if}
            </div>

            <button
                onclick={() => onArchive?.(prompt.id)}
                class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500"
                title={prompt.archived ? "Restore" : "Archive"}
            >
                {#if prompt.archived}
                    <ArchiveRestore size={16} />
                {:else}
                    <Archive size={16} />
                {/if}
            </button>
            <button
                onclick={() => onDuplicate?.(prompt.id)}
                class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500"
                title="Duplicate"
            >
                <Files size={16} />
            </button>
            <button
                onclick={() => onEdit(prompt.id)}
                class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500"
                title="Edit"
            >
                <Edit size={16} />
            </button>
            <button
                onclick={() => onDelete(prompt.id)}
                class="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md text-red-500"
                title="Delete"
            >
                <Trash2 size={16} />
            </button>
        </div>
    </div>
</div>

<style>
    .prompt-card {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid rgba(229, 231, 235, 0.8);
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(8px);
        border-radius: 12px;
    }
    :global(.dark) .prompt-card {
        background: rgba(30, 41, 59, 0.7);
        border-color: rgba(51, 65, 85, 0.8);
    }
    .prompt-card:hover {
        border-color: rgba(99, 102, 241, 0.3);
        box-shadow:
            0 8px 25px -5px rgba(99, 102, 241, 0.1),
            0 10px 10px -5px rgba(99, 102, 241, 0.04);
        transform: translateY(-2px);
        background: rgba(255, 255, 255, 0.9);
    }
    :global(.dark) .prompt-card:hover {
        background: rgba(30, 41, 59, 0.9);
    }
</style>
