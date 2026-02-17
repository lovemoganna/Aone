<script lang="ts">
    import { diagramStore } from "../../lib/store.svelte";
    import { fade, fly } from "svelte/transition";
    import { X, Trash2, Upload, Save, FileCode } from "lucide-svelte";

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
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm"
        onclick={onClose}
        transition:fade={{ duration: 300 }}
    >
        <div
            class="glass-pro rounded-2xl w-full max-w-lg flex flex-col max-h-[80vh] overflow-hidden transition-all duration-700"
            onclick={(e) => e.stopPropagation()}
            transition:fly={{ y: 20, duration: 400 }}
        >
            <!-- Header -->
            <div
                class="p-6 border-b border-white/10 flex items-center justify-between"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 glow-premium"
                    >
                        <FileCode size={24} />
                    </div>
                    <button
                        class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        onclick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto p-4 space-y-6">
                <!-- Save Current -->
                <div
                    class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                    <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >Save current diagram as snippet</label
                    >
                    <div class="flex gap-2">
                        <input
                            type="text"
                            bind:value={newSnippetName}
                            placeholder="Snippet Name..."
                            class="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            onkeydown={(e) => e.key === "Enter" && handleSave()}
                        />
                        <button
                            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 font-medium disabled:opacity-50"
                            disabled={!newSnippetName.trim()}
                            onclick={handleSave}
                        >
                            <Save size={18} />
                            Save
                        </button>
                    </div>
                </div>

                <!-- List -->
                <div>
                    <h4
                        class="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider"
                    >
                        Saved Snippets ({diagramStore.snippets.length})
                    </h4>

                    {#if diagramStore.snippets.length === 0}
                        <div
                            class="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                            No snippets saved yet.
                        </div>
                    {:else}
                        <div class="space-y-2">
                            {#each diagramStore.snippets as snippet (snippet.id)}
                                <div
                                    class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-700 group transition-colors cursor-grab active:cursor-grabbing"
                                    draggable="true"
                                    ondragstart={(e) => {
                                        e.dataTransfer?.setData(
                                            "text/plain",
                                            snippet.code,
                                        );
                                        if (e.dataTransfer) {
                                            e.dataTransfer.effectAllowed =
                                                "copy";
                                        }
                                    }}
                                >
                                    <div class="flex flex-col">
                                        <span
                                            class="font-medium text-gray-900 dark:text-white"
                                            >{snippet.name}</span
                                        >
                                        <span class="text-xs text-gray-500">
                                            {snippet.mode === "plantuml"
                                                ? "PlantUML"
                                                : "Graphviz"} • {new Date(
                                                snippet.timestamp,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div
                                        class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <button
                                            class="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg"
                                            title="Load"
                                            onclick={() =>
                                                handleLoad(snippet.id)}
                                        >
                                            <Upload size={18} />
                                        </button>
                                        <button
                                            class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                            title="Delete"
                                            onclick={() =>
                                                handleDelete(snippet.id)}
                                        >
                                            <Trash2 size={18} />
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
