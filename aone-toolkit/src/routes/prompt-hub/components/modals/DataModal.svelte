<script lang="ts">
    import { promptStore } from "../../lib/store.svelte";
    import {
        X,
        Download,
        Upload,
        Database,
        AlertCircle,
        FileJson,
    } from "lucide-svelte";

    let { isOpen = $bindable(false), onClose } = $props<{
        isOpen: boolean;
        onClose: () => void;
    }>();

    let importMode = $state<"merge" | "replace">("merge");
    let fileInput = $state<HTMLInputElement | null>(null);
    let importError = $state<string | null>(null);

    function handleExport() {
        const json = promptStore.exportData();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `prompthub-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function handleFileChange(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            try {
                const result = promptStore.importData(content, importMode);
                if (result.success) {
                    alert("Import successful!");
                    onClose();
                } else {
                    importError = result.error || "Unknown error";
                }
            } catch (err: any) {
                importError = err.message;
            }
        };
        reader.readAsText(file);
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onclick={onClose}
        onkeydown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabindex="-1"
        aria-label="Close modal"
    >
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
        <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
            onclick={(e) => e.stopPropagation()}
            role="document"
            tabindex="-1"
            onkeydown={(e) => e.key === "Escape" && onClose()}
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800"
            >
                <h3
                    class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
                >
                    <Database size={20} class="text-indigo-500" />
                    Data Management
                </h3>
                <button
                    class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    onclick={onClose}
                >
                    <X size={20} />
                </button>
            </div>

            <!-- Body -->
            <div class="p-6 space-y-8">
                <!-- Export Section -->
                <div>
                    <h4
                        class="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2"
                    >
                        <Download size={16} /> Export Data
                    </h4>
                    <p class="text-xs text-gray-500 mb-3">
                        Download a backup of all your prompts, tags, and
                        collections as a JSON file.
                    </p>
                    <button
                        onclick={handleExport}
                        class="w-full py-2.5 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors border border-gray-200 dark:border-gray-600"
                    >
                        <FileJson size={18} />
                        Download Backup
                    </button>
                </div>

                <div class="h-px bg-gray-200 dark:bg-gray-700"></div>

                <!-- Import Section -->
                <div>
                    <h4
                        class="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2"
                    >
                        <Upload size={16} /> Import Data
                    </h4>

                    <div
                        class="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900/50 mb-4"
                    >
                        <div class="flex gap-4 mb-4">
                            <label
                                class="flex items-center gap-2 cursor-pointer"
                            >
                                <input
                                    type="radio"
                                    bind:group={importMode}
                                    value="merge"
                                    class="text-indigo-600"
                                />
                                <span
                                    class="text-sm text-gray-700 dark:text-gray-300"
                                    >Merge (Safe)</span
                                >
                            </label>
                            <label
                                class="flex items-center gap-2 cursor-pointer"
                            >
                                <input
                                    type="radio"
                                    bind:group={importMode}
                                    value="replace"
                                    class="text-red-600"
                                />
                                <span
                                    class="text-sm text-gray-700 dark:text-gray-300"
                                    >Replace (Overwrite)</span
                                >
                            </label>
                        </div>
                        {#if importMode === "replace"}
                            <p
                                class="text-xs text-red-600 dark:text-red-400 flex items-start gap-1"
                            >
                                <AlertCircle size={12} class="mt-0.5" />
                                Warning: This will keep only the imported data and
                                delete everything else.
                            </p>
                        {:else}
                            <p
                                class="text-xs text-indigo-600 dark:text-indigo-400"
                            >
                                Adds missing items. Existing items are kept.
                            </p>
                        {/if}
                    </div>

                    <div class="relative">
                        <input
                            type="file"
                            accept=".json"
                            bind:this={fileInput}
                            onchange={handleFileChange}
                            class="hidden"
                        />
                        <button
                            onclick={() => fileInput?.click()}
                            class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                            <Upload size={18} />
                            Select Backup File
                        </button>
                    </div>

                    {#if importError}
                        <div
                            class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-600 dark:text-red-400"
                        >
                            Error: {importError}
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}
