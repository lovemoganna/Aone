<script lang="ts">
    import { promptStore } from "../../lib/store.svelte";
    import { X, Download, Upload } from "lucide-svelte";

    let { onClose } = $props<{ onClose: () => void }>();

    function handleExport() {
        const data = JSON.stringify(
            {
                prompts: promptStore.prompts,
                tags: promptStore.tags,
                version: "1.0",
            },
            null,
            2,
        );

        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `prompthub-data-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    let fileInput: HTMLInputElement;
    function triggerImport() {
        fileInput.click();
    }

    function handleImport(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = JSON.parse(content);

                if (parsed.prompts && Array.isArray(parsed.prompts)) {
                    // Logic to merge or replace.
                    // For now, let's append unique IDs or replace if ID exists.

                    if (
                        confirm(
                            "Replace existing data? Cancel to Merge (Keep both), OK to Overwrite existing.",
                        )
                    ) {
                        promptStore.prompts = parsed.prompts;
                        if (parsed.tags) promptStore.tags = parsed.tags;
                    } else {
                        // Merge
                        const newPrompts = parsed.prompts.filter(
                            (p: any) =>
                                !promptStore.prompts.some(
                                    (ex) => ex.id === p.id,
                                ),
                        );
                        promptStore.prompts = [
                            ...promptStore.prompts,
                            ...newPrompts,
                        ];

                        if (parsed.tags) {
                            const newTags = parsed.tags.filter(
                                (t: any) =>
                                    !promptStore.tags.some(
                                        (ex) => ex.id === t.id,
                                    ),
                            );
                            promptStore.tags = [
                                ...promptStore.tags,
                                ...newTags,
                            ];
                        }
                    }

                    promptStore.save();
                    alert("Import Successful");
                    onClose();
                } else {
                    alert("Invalid file format");
                }
            } catch (err) {
                alert("Failed to parse JSON");
                console.error(err);
            }
        };
        reader.readAsText(file);
    }
</script>

<div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
>
    <div
        class="bg-white dark:bg-gray-800 w-full max-w-lg rounded-xl shadow-2xl flex flex-col"
    >
        <div
            class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
        >
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Data Management
            </h2>
            <button
                onclick={onClose}
                class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
                <X size={20} />
            </button>
        </div>

        <div class="p-8 grid grid-cols-2 gap-6">
            <button
                onclick={handleExport}
                class="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group"
            >
                <div
                    class="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                >
                    <Download class="text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Export Data
                </h3>
                <p class="text-xs text-center text-gray-500">
                    Download your prompts and tags as JSON
                </p>
            </button>

            <button
                onclick={triggerImport}
                class="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all group"
            >
                <input
                    bind:this={fileInput}
                    type="file"
                    accept=".json"
                    class="hidden"
                    onchange={handleImport}
                />
                <div
                    class="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                >
                    <Upload class="text-green-600 dark:text-green-400" />
                </div>
                <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Import Data
                </h3>
                <p class="text-xs text-center text-gray-500">
                    Restore or merge data from JSON file
                </p>
            </button>
        </div>

        <div
            class="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 text-center"
        >
            <p class="text-xs text-gray-500">
                Importing will offer to merge or overwrite existing data.
            </p>
        </div>
    </div>
</div>
