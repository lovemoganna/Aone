<script lang="ts">
    import { promptStore } from "../../lib/store.svelte";
    import type { Prompt } from "../../lib/types";
    import { onMount } from "svelte";
    import { marked } from "marked";
    import { X, Plus, Clock, RotateCcw } from "lucide-svelte";

    let {
        promptId = null,
        onClose,
        onCreateTag,
    } = $props<{
        promptId: string | null;
        onClose: () => void;
        onCreateTag: () => void;
    }>();

    let title = $state("");
    let content = $state("");
    let description = $state("");
    let collectionId = $state<string | undefined>(undefined);
    let tags = $state<string[]>([]);
    let favorite = $state(false);
    let activeTab = $state<"edit" | "preview" | "test" | "history">("edit");
    let previewHtml = $state("");
    let testVariables = $state<string[]>([]);
    let testValues = $state<Record<string, string>>({});

    let compiledPrompt = $derived.by(() => {
        let text = content;
        for (const [key, val] of Object.entries(testValues)) {
            const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
            text = text.replace(regex, val || "");
        }
        return text;
    });

    $effect(() => {
        const regex = /\{\{\s*(\w+)\s*\}\}/g;
        const matches = [...content.matchAll(regex)];
        const vars = [...new Set(matches.map((m) => m[1]))];

        if (JSON.stringify(vars) !== JSON.stringify(testVariables)) {
            testVariables = vars;
        }
    });

    onMount(() => {
        if (promptId) {
            const p = promptStore.prompts.find(
                (p: Prompt) => p.id === promptId,
            );
            if (p) {
                title = p.title;
                content = p.content;
                description = p.description;
                collectionId = p.collectionId;
                tags = [...p.tags];
                favorite = p.favorite;
            }
        }
    });

    $effect(() => {
        if (activeTab === "preview") {
            try {
                previewHtml = marked.parse(content) as string;
            } catch (e) {
                previewHtml =
                    '<p class="text-red-500">Error rendering markdown</p>';
            }
        }
    });

    function handleSave() {
        if (!title.trim() || !content.trim()) {
            alert("Title and Content are required");
            return;
        }

        const promptData: Prompt = {
            id: promptId || crypto.randomUUID(),
            title,
            content,
            description,
            collectionId,
            tags,
            favorite,
            createdAt: promptId
                ? promptStore.prompts.find((p: Prompt) => p.id === promptId)
                      ?.createdAt || Date.now()
                : Date.now(),
            updatedAt: Date.now(),
            usageCount: promptId
                ? promptStore.prompts.find((p: Prompt) => p.id === promptId)
                      ?.usageCount || 0
                : 0,
        };

        if (promptId) {
            promptStore.updatePrompt(promptId, promptData, true);
        } else {
            promptStore.addPrompt(promptData);
        }
        onClose();
    }

    function handleRestore(version: any) {
        if (
            confirm(
                "Restore this version? Current content will be overwritten.",
            )
        ) {
            content = version.content;
            title = version.title;
            // switch to edit tab
            activeTab = "edit";
        }
    }

    function toggleTag(tagId: string) {
        if (tags.includes(tagId)) {
            tags = tags.filter((t) => t !== tagId);
        } else {
            tags = [...tags, tagId];
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            onClose();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            handleSave();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
>
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
    <div
        class="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
        onclick={(e) => e.stopPropagation()}
        role="dialog"
        tabindex="-1"
        onkeydown={(e) => e.key === "Escape" && onClose()}
    >
        <!-- Header -->
        <div
            class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
        >
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {promptId ? "Edit Prompt" : "New Prompt"}
            </h2>
            <button
                onclick={onClose}
                class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
                <X size={20} />
            </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4">
            <!-- Title -->
            <div>
                <label
                    for="prompt-title"
                    class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
                    >Title *</label
                >
                <input
                    id="prompt-title"
                    type="text"
                    bind:value={title}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none"
                    placeholder="Enter prompt title"
                />
            </div>

            <!-- Content -->
            <div>
                <label
                    for="prompt-content"
                    class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
                    >Content *</label
                >
                <div
                    class="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
                >
                    <div
                        class="flex border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50"
                    >
                        <button
                            onclick={() => (activeTab = "edit")}
                            class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
                            class:border-indigo-500={activeTab === "edit"}
                            class:text-indigo-600={activeTab === "edit"}
                            class:border-transparent={activeTab !== "edit"}
                            class:text-gray-600={activeTab !== "edit"}
                            >Edit</button
                        >
                        <button
                            onclick={() => (activeTab = "preview")}
                            class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
                            class:border-indigo-500={activeTab === "preview"}
                            class:text-indigo-600={activeTab === "preview"}
                            class:border-transparent={activeTab !== "preview"}
                            class:text-gray-600={activeTab !== "preview"}
                            >Preview</button
                        >
                        <button
                            onclick={() => (activeTab = "test")}
                            class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
                            class:border-indigo-500={activeTab === "test"}
                            class:text-indigo-600={activeTab === "test"}
                            class:border-transparent={activeTab !== "test"}
                            class:text-gray-600={activeTab !== "test"}
                            >Test & Run</button
                        >
                        {#if promptId}
                            <button
                                onclick={() => (activeTab = "history")}
                                class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
                                class:border-indigo-500={activeTab ===
                                    "history"}
                                class:text-indigo-600={activeTab === "history"}
                                class:border-transparent={activeTab !==
                                    "history"}
                                class:text-gray-600={activeTab !== "history"}
                                >History</button
                            >
                        {/if}
                    </div>

                    {#if activeTab === "edit"}
                        <textarea
                            id="prompt-content"
                            bind:value={content}
                            rows="8"
                            class="w-full px-3 py-2 border-0 focus:ring-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none outline-none font-mono text-sm"
                            placeholder={"Enter prompt content... Supports Markdown and {{variables}}"}
                        ></textarea>
                    {:else if activeTab === "preview"}
                        <div
                            class="p-4 bg-gray-50 dark:bg-gray-900/50 min-h-[200px] prose dark:prose-invert max-w-none text-sm"
                        >
                            {@html previewHtml}
                        </div>
                    {:else if activeTab === "history" && promptId}
                        <div
                            class="flex flex-col h-[300px] overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50"
                        >
                            {#each promptStore.getVersions(promptId) as version}
                                <div
                                    class="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg group"
                                >
                                    <div
                                        class="flex items-center justify-between mb-1"
                                    >
                                        <div class="flex items-center gap-2">
                                            <Clock
                                                size={12}
                                                class="text-gray-400"
                                            />
                                            <span class="text-xs text-gray-500"
                                                >{new Date(
                                                    version.timestamp,
                                                ).toLocaleString()}</span
                                            >
                                        </div>
                                        <button
                                            class="text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                                            onclick={() =>
                                                handleRestore(version)}
                                        >
                                            <RotateCcw size={12} />
                                            Restore
                                        </button>
                                    </div>
                                    <div
                                        class="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 font-mono bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded"
                                    >
                                        {version.content}
                                    </div>
                                </div>
                            {/each}
                            {#if promptStore.getVersions(promptId).length === 0}
                                <div
                                    class="text-center text-gray-400 text-sm py-8"
                                >
                                    No history available
                                </div>
                            {/if}
                        </div>
                    {:else if activeTab === "test"}
                        <div class="flex flex-col h-[300px]">
                            <!-- Variable Inputs -->
                            <div
                                class="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 max-h-[120px] overflow-y-auto"
                            >
                                <h4
                                    class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
                                >
                                    Variables
                                </h4>
                                {#if testVariables.length > 0}
                                    <div class="grid grid-cols-2 gap-3">
                                        {#each testVariables as variable}
                                            <div>
                                                <label
                                                    for={`var-${variable}`}
                                                    class="block text-xs text-gray-500 mb-1"
                                                    >{variable}</label
                                                >
                                                <input
                                                    id={`var-${variable}`}
                                                    type="text"
                                                    bind:value={
                                                        testValues[variable]
                                                    }
                                                    placeholder={`Value for ${variable}`}
                                                    class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </div>
                                        {/each}
                                    </div>
                                {:else}
                                    <p class="text-xs text-gray-400 italic">
                                        No variables detected
                                    </p>
                                {/if}
                            </div>
                            <!-- Result -->
                            <div
                                class="flex-1 p-4 bg-white dark:bg-gray-900 overflow-y-auto font-mono text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200"
                            >
                                {compiledPrompt}
                            </div>
                            <!-- Action -->
                            <div
                                class="p-2 border-t border-gray-200 dark:border-gray-700 flex justify-end"
                            >
                                <button
                                    class="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
                                    onclick={() =>
                                        navigator.clipboard.writeText(
                                            compiledPrompt,
                                        )}
                                >
                                    Copy Result
                                </button>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Collection -->
            <div>
                <label
                    for="prompt-collection"
                    class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                    >Collection</label
                >
                <select
                    id="prompt-collection"
                    bind:value={collectionId}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none text-sm"
                >
                    <option value={undefined}>No Collection</option>
                    {#each promptStore.collections as col}
                        <option value={col.id}>{col.name}</option>
                    {/each}
                </select>
            </div>

            <!-- Tags -->
            <div>
                <span
                    class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                    >Tags</span
                >
                <div class="flex flex-wrap gap-2">
                    {#each promptStore.tags as tag}
                        <button
                            onclick={() => toggleTag(tag.id)}
                            class="px-2 py-1 rounded-full text-xs border transition-colors"
                            class:bg-indigo-100={tags.includes(tag.id)}
                            class:border-indigo-300={tags.includes(tag.id)}
                            class:text-indigo-700={tags.includes(tag.id)}
                            class:bg-gray-100={!tags.includes(tag.id)}
                            class:border-gray-200={!tags.includes(tag.id)}
                            class:text-gray-600={!tags.includes(tag.id)}
                        >
                            {tag.name}
                        </button>
                    {/each}
                    <button
                        class="px-2 py-1 rounded-full text-xs border border-dashed border-gray-300 text-gray-400 hover:text-indigo-500 hover:border-indigo-300 flex items-center gap-1"
                        onclick={onCreateTag}
                    >
                        <Plus size={12} /> Add Tag
                    </button>
                </div>
            </div>

            <!-- Description -->
            <div>
                <label
                    for="prompt-description"
                    class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
                    >Description</label
                >
                <input
                    id="prompt-description"
                    type="text"
                    bind:value={description}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none"
                    placeholder="Short description (optional)"
                />
            </div>

            <!-- Favorite -->
            <div class="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="fav"
                    bind:checked={favorite}
                    class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                    for="fav"
                    class="text-sm text-gray-700 dark:text-gray-300"
                    >Add to Favorites</label
                >
            </div>
        </div>

        <!-- Footer -->
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
