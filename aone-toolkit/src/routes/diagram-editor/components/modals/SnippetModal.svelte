<script lang="ts">
    import { diagramStore } from "../../lib/store.svelte";
    import { X, Save, Trash2, Upload, FileCode } from "lucide-svelte";
    import { fade, fly } from "svelte/transition";

    let { isOpen = $bindable(false), onClose } = $props<{
        isOpen: boolean;
        onClose: () => void;
    }>();

    let newSnippetName = $state("");

    function handleSave() {
        if (!newSnippetName.trim()) return;
        diagramStore.saveSnippet(newSnippetName);
        newSnippetName = "";
    }

    function handleLoad(id: string) {
        diagramStore.loadSnippet(id);
        onClose();
    }

    function handleDelete(id: string) {
        if (confirm("Are you sure you want to delete this snippet?")) {
            diagramStore.deleteSnippet(id);
        }
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none"
        onclick={onClose}
        onkeydown={(event) => {
            if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClose();
            }
        }}
        role="button"
        tabindex="0"
        aria-label="Close snippets modal"
        transition:fade={{ duration: 100 }}
    >
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-lg flex flex-col max-h-[80vh] overflow-hidden shadow-2xl"
            onclick={(e) => e.stopPropagation()}
            transition:fly={{ y: 10, duration: 120 }}
        >
            <!-- Header -->
            <div
                class="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40"
            >
                <div class="flex items-center gap-2">
                    <FileCode size={15} class="text-slate-700 dark:text-slate-300" />
                    <div>
                        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            Saved Snippets
                        </h3>
                    </div>
                </div>
                <button
                    type="button"
                    class="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded transition-colors"
                    onclick={onClose}
                    title="Close snippets modal"
                    aria-label="Close snippets modal"
                >
                    <X size={15} />
                </button>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                <!-- Save Current -->
                <div
                    class="bg-slate-50 dark:bg-slate-900/50 p-3 rounded border border-slate-200 dark:border-slate-800"
                >
                    <label
                        for="diagram-snippet-name"
                        class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
                    >
                        Save current diagram as snippet
                    </label>
                    <div class="flex gap-2">
                        <input
                            id="diagram-snippet-name"
                            type="text"
                            bind:value={newSnippetName}
                            placeholder="Snippet title..."
                            class="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-900 dark:text-slate-100 outline-none text-xs"
                            onkeydown={(e) => e.key === "Enter" && handleSave()}
                        />
                        <button
                            type="button"
                            class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded flex items-center gap-1.5 font-semibold text-xs disabled:opacity-50 transition-colors shadow-xs"
                            disabled={!newSnippetName.trim()}
                            onclick={handleSave}
                        >
                            <Save size={13} />
                            Save
                        </button>
                    </div>
                </div>

                <!-- List -->
                <div>
                    <h4
                        class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2"
                    >
                        Snippets Library ({diagramStore.snippets.length})
                    </h4>

                    {#if diagramStore.snippets.length === 0}
                        <div
                            class="text-center py-6 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded text-xs"
                        >
                            No snippets saved yet.
                        </div>
                    {:else}
                        <div class="space-y-1.5">
                            {#each diagramStore.snippets as snippet (snippet.id)}
                                <div
                                    class="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded hover:border-slate-400 group transition-colors cursor-grab active:cursor-grabbing"
                                    draggable="true"
                                    role="button"
                                    tabindex="0"
                                    ondragstart={(e) => {
                                        e.dataTransfer?.setData(
                                            "text/plain",
                                            snippet.code,
                                        );
                                        if (e.dataTransfer) {
                                            e.dataTransfer.effectAllowed = "copy";
                                        }
                                    }}
                                >
                                    <div class="flex flex-col">
                                        <span class="font-semibold text-slate-900 dark:text-slate-100">
                                            {snippet.name}
                                        </span>
                                        <span class="text-[10px] text-slate-400 font-mono">
                                            {snippet.mode.toUpperCase()} &bull; {new Date(snippet.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div
                                        class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <button
                                            type="button"
                                            class="p-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                                            title="Load snippet"
                                            aria-label={`Load ${snippet.name}`}
                                            onclick={() => handleLoad(snippet.id)}
                                        >
                                            <Upload size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            class="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded"
                                            title="Delete snippet"
                                            aria-label={`Delete ${snippet.name}`}
                                            onclick={() => handleDelete(snippet.id)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}