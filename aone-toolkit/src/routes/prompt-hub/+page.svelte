<script lang="ts">
    import { promptStore } from "./lib/store.svelte";
    import { onMount } from "svelte";
    import Sidebar from "./components/Sidebar.svelte";
    import PromptList from "./components/PromptList.svelte";
    import PromptEditorModal from "./components/modals/PromptEditorModal.svelte";
    import ExportImportModal from "./components/modals/ExportImportModal.svelte";
    import TagModal from "./components/modals/TagModal.svelte";
    import ConfirmModal from "./components/modals/ConfirmModal.svelte";
    import TemplateLibrary from "./components/modals/TemplateLibrary.svelte";
    import RunPromptModal from "./components/modals/RunPromptModal.svelte";
    import ThemeToggle from "./components/ThemeToggle.svelte";
    import type { Prompt, Tag as TagModel } from "./lib/types";
    import {
        Plus,
        Download,
        Upload,
        LayoutGrid,
        LayoutList,
        Trash2,
        X,
        Tag,
        Sparkles,
        Archive,
        FolderInput,
        Star,
    } from "lucide-svelte";
    import BatchCollectionModal from "./components/modals/BatchCollectionModal.svelte";

    let isBatchCollectionOpen = $state(false);

    function batchArchive() {
        if (selectedIds.size === 0) return;
        if (confirm(`Archive ${selectedIds.size} prompt(s)?`)) {
            promptStore.archivePrompts(selectedIds, true);
            clearSelection();
        }
    }

    function batchFavorite() {
        if (selectedIds.size === 0) return;
        // Check if all are favorites
        const allFav = Array.from(selectedIds).every(
            (id) => promptStore.prompts.find((p) => p.id === id)?.favorite,
        );
        promptStore.setFavoritePrompts(selectedIds, !allFav);
    }

    function openBatchCollection() {
        if (selectedIds.size === 0) return;
        isBatchCollectionOpen = true;
    }

    function handleBatchCollection(collectionId: string | undefined) {
        promptStore.movePromptsToCollection(selectedIds, collectionId);
        isBatchCollectionOpen = false;
        clearSelection();
    }

    let { prompts, filteredPrompts } = $derived(promptStore);

    let isEditorOpen = $state(false);
    let isExportOpen = $state(false);
    let isTagModalOpen = $state(false);
    let isTemplateLibraryOpen = $state(false);
    let editingPromptId = $state<string | null>(null);
    let editingTag = $state<TagModel | null>(null);

    // Batch Selection
    let selectedIds = $state(new Set<string>());

    // View Mode
    let viewMode = $state<"grid" | "list">("grid");

    function openEditor(id: string | null = null) {
        editingPromptId = id;
        isEditorOpen = true;
    }

    function closeEditor() {
        isEditorOpen = false;
        editingPromptId = null;
    }

    function toggleSelect(id: string) {
        selectedIds = new Set(selectedIds);
        if (selectedIds.has(id)) {
            selectedIds.delete(id);
        } else {
            selectedIds.add(id);
        }
    }

    function clearSelection() {
        selectedIds = new Set();
    }

    // Confirm Modal State
    let isConfirmOpen = $state(false);
    let confirmConfig = $state({ title: "", message: "", onConfirm: () => {} });

    function openConfirm(
        title: string,
        message: string,
        onConfirm: () => void,
    ) {
        confirmConfig = { title, message, onConfirm };
        isConfirmOpen = true;
    }

    function deleteSelected() {
        openConfirm(
            `Delete ${selectedIds.size} Prompt(s)`,
            `Are you sure you want to delete ${selectedIds.size} prompt(s)? This action cannot be undone.`,
            () => {
                for (const id of selectedIds) {
                    promptStore.deletePrompt(id);
                }
                clearSelection();
                isConfirmOpen = false;
            },
        );
    }

    // Batch Tagging
    let isBatchTagOpen = $state(false);
    let batchSelectedTags = $state<string[]>([]);

    function toggleBatchTag(tagId: string) {
        if (batchSelectedTags.includes(tagId)) {
            batchSelectedTags = batchSelectedTags.filter((t) => t !== tagId);
        } else {
            batchSelectedTags = [...batchSelectedTags, tagId];
        }
    }

    function applyBatchTags() {
        if (batchSelectedTags.length === 0) return;
        promptStore.addTagsToPrompts(selectedIds, batchSelectedTags);
        isBatchTagOpen = false;
        batchSelectedTags = [];
        clearSelection();
    }

    // Run Mode
    let isRunOpen = $state(false);
    let runPrompt = $state<Prompt | null>(null);

    function handleRun(id: string) {
        const p = promptStore.prompts.find((p) => p.id === id);
        if (p) {
            runPrompt = p;
            isRunOpen = true;
        }
    }
    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            if (isEditorOpen) {
                closeEditor();
                return;
            }
            if (isRunOpen) {
                isRunOpen = false;
                return;
            }
            if (isConfirmOpen) {
                isConfirmOpen = false;
                return;
            }
            if (isBatchCollectionOpen) {
                isBatchCollectionOpen = false;
                return;
            }
            if (isTagModalOpen) {
                isTagModalOpen = false;
                return;
            }
            if (isExportOpen) {
                isExportOpen = false;
                return;
            }
            if (isTemplateLibraryOpen) {
                isTemplateLibraryOpen = false;
                return;
            }
            if (selectedIds.size > 0) {
                clearSelection();
                return;
            }
        }

        if ((e.ctrlKey || e.metaKey) && e.key === "n") {
            e.preventDefault();
            openEditor(null);
            return;
        }

        if (
            e.key === "/" &&
            !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
        ) {
            e.preventDefault();
            document.getElementById("search-input")?.focus();
            return;
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
    class="flex h-screen w-full bg-white dark:bg-gray-900 overflow-hidden text-gray-900 dark:text-gray-100 font-sans"
>
    <Sidebar
        onEditTag={(tag) => {
            editingTag = tag;
            isTagModalOpen = true;
        }}
    />

    <main class="flex-1 flex flex-col min-w-0 bg-gray-50/50 dark:bg-black/20">
        <!-- Toolbar (Header) -->
        <div
            class="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10"
        >
            <div class="flex items-center gap-4">
                <button
                    class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all font-medium"
                    onclick={() => openEditor(null)}
                >
                    <Plus size={18} />
                    New Prompt
                </button>

                <button
                    class="px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 flex items-center gap-2 text-sm transition-all font-medium"
                    onclick={() => (isTemplateLibraryOpen = true)}
                >
                    <Sparkles size={16} />
                    Templates
                </button>

                <div
                    class="flex gap-2 border-l pl-4 border-gray-200 dark:border-gray-700"
                >
                    <button
                        onclick={() => (isExportOpen = true)}
                        class="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-sm transition-colors"
                    >
                        <Download size={16} /> Export
                    </button>
                    <button
                        onclick={() => (isExportOpen = true)}
                        class="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-sm transition-colors"
                    >
                        <Upload size={16} /> Import
                    </button>
                </div>
            </div>

            <div class="flex items-center gap-4">
                <ThemeToggle />

                <!-- Sort Dropdown -->
                <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-500">Sort:</span>
                    <select
                        bind:value={promptStore.sortOrder}
                        class="text-sm bg-transparent border-none outline-none text-gray-700 dark:text-gray-300 cursor-pointer focus:ring-0"
                    >
                        <option value="created_desc">Newest</option>
                        <option value="created_asc">Oldest</option>
                        <option value="updated_desc">Recently Updated</option>
                        <option value="title_asc">A-Z</option>
                        <option value="usage_desc">Most Used</option>
                    </select>
                </div>

                <div class="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>

                <span class="text-sm text-gray-500"
                    >{filteredPrompts.length} prompts</span
                >
                <button
                    onclick={() =>
                        (viewMode = viewMode === "grid" ? "list" : "grid")}
                    class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title={viewMode === "grid"
                        ? "Switch to List View"
                        : "Switch to Grid View"}
                >
                    {#if viewMode === "grid"}
                        <LayoutList size={18} />
                    {:else}
                        <LayoutGrid size={18} />
                    {/if}
                </button>
            </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">
            <PromptList
                prompts={filteredPrompts}
                onEdit={(id) => openEditor(id)}
                {selectedIds}
                onSelectToggle={toggleSelect}
                {viewMode}
                onDeleteRequest={(id, title) =>
                    openConfirm(
                        `Delete "${title}"`,
                        `Are you sure you want to delete this prompt? This action cannot be undone.`,
                        () => {
                            promptStore.deletePrompt(id);
                            isConfirmOpen = false;
                        },
                    )}
                onArchive={(id) => promptStore.toggleArchive(id)}
                onRun={handleRun}
            />
        </div>

        <!-- Batch Action Bar -->
        {#if selectedIds.size > 0}
            <div
                class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-full shadow-2xl border border-gray-200 dark:border-gray-700 flex items-center gap-2 z-50"
            >
                <span
                    class="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2"
                    >{selectedIds.size} selected</span
                >
                <div class="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>

                <button
                    onclick={batchFavorite}
                    class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-amber-500 transition-colors"
                    title="Toggle Favorite"
                >
                    <Star
                        size={18}
                        fill={Array.from(selectedIds).every(
                            (id) =>
                                promptStore.prompts.find((p) => p.id === id)
                                    ?.favorite,
                        )
                            ? "currentColor"
                            : "none"}
                    />
                </button>

                <button
                    onclick={batchArchive}
                    class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 transition-colors"
                    title="Archive"
                >
                    <Archive size={18} />
                </button>

                <div class="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>

                <button
                    onclick={openBatchCollection}
                    class="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors text-gray-700 dark:text-gray-200"
                >
                    <FolderInput size={16} /> Move
                </button>

                <!-- Tag Button with Popup -->
                <div class="relative">
                    <button
                        onclick={() => (isBatchTagOpen = !isBatchTagOpen)}
                        class="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors text-gray-700 dark:text-gray-200"
                    >
                        <Tag size={16} /> Tag
                    </button>

                    {#if isBatchTagOpen}
                        <div
                            class="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-50"
                        >
                            <div
                                class="text-xs text-gray-500 dark:text-gray-400 mb-2"
                            >
                                Select tags to add:
                            </div>
                            <div
                                class="flex flex-wrap gap-2 max-h-32 overflow-y-auto"
                            >
                                {#each promptStore.tags as tag}
                                    <button
                                        onclick={() => toggleBatchTag(tag.id)}
                                        class="px-2 py-1 rounded-full text-xs border transition-colors"
                                        class:bg-indigo-100={batchSelectedTags.includes(
                                            tag.id,
                                        )}
                                        class:border-indigo-300={batchSelectedTags.includes(
                                            tag.id,
                                        )}
                                        class:text-indigo-700={batchSelectedTags.includes(
                                            tag.id,
                                        )}
                                        class:bg-gray-100={!batchSelectedTags.includes(
                                            tag.id,
                                        )}
                                        class:dark:bg-gray-700={!batchSelectedTags.includes(
                                            tag.id,
                                        )}
                                        class:border-gray-200={!batchSelectedTags.includes(
                                            tag.id,
                                        )}
                                        class:dark:border-gray-600={!batchSelectedTags.includes(
                                            tag.id,
                                        )}
                                        class:text-gray-600={!batchSelectedTags.includes(
                                            tag.id,
                                        )}
                                        class:dark:text-gray-300={!batchSelectedTags.includes(
                                            tag.id,
                                        )}
                                    >
                                        {tag.name}
                                    </button>
                                {/each}
                            </div>
                            <button
                                onclick={applyBatchTags}
                                class="mt-3 w-full px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
                            >
                                Apply Tags
                            </button>
                        </div>
                    {/if}
                </div>

                <div class="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>

                <button
                    onclick={deleteSelected}
                    class="flex items-center gap-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm transition-colors"
                >
                    <Trash2 size={16} /> Delete
                </button>

                <button
                    onclick={clearSelection}
                    class="ml-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        {/if}
    </main>

    {#if isBatchCollectionOpen}
        <BatchCollectionModal
            onClose={() => (isBatchCollectionOpen = false)}
            onConfirm={handleBatchCollection}
        />
    {/if}

    {#if isEditorOpen}
        <PromptEditorModal
            promptId={editingPromptId}
            onClose={closeEditor}
            onCreateTag={() => {
                editingTag = null;
                isTagModalOpen = true;
            }}
        />
    {/if}

    {#if isExportOpen}
        <ExportImportModal onClose={() => (isExportOpen = false)} />
    {/if}

    {#if isTagModalOpen}
        <TagModal
            tagToEdit={editingTag}
            onClose={() => {
                isTagModalOpen = false;
                editingTag = null;
            }}
        />
    {/if}

    <ConfirmModal
        isOpen={isConfirmOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => (isConfirmOpen = false)}
    />

    <TemplateLibrary
        isOpen={isTemplateLibraryOpen}
        onClose={() => (isTemplateLibraryOpen = false)}
    />

    <RunPromptModal
        isOpen={isRunOpen}
        prompt={runPrompt}
        onClose={() => (isRunOpen = false)}
    />
</div>
