<script lang="ts">
    import { Button } from "$lib/components/ui";

    interface Props {
        isOpen: boolean;
        jsonData: any;
        onUpdate: (newData: any) => void;
        onClose: () => void;
    }

    let { isOpen, jsonData, onUpdate, onClose }: Props = $props();

    // --- Logic ---

    // 1. Recursive Sort Keys
    function sortKeys(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map(sortKeys);
        } else if (obj !== null && typeof obj === "object") {
            return Object.keys(obj)
                .sort()
                .reduce((acc: any, key) => {
                    acc[key] = sortKeys(obj[key]);
                    return acc;
                }, {});
        }
        return obj;
    }

    // 2. Clean Data (Remove null/undefined)
    function cleanData(obj: any): any {
        if (Array.isArray(obj)) {
            return obj
                .map(cleanData)
                .filter((v) => v !== null && v !== undefined);
        } else if (obj !== null && typeof obj === "object") {
            return Object.keys(obj).reduce((acc: any, key) => {
                const val = cleanData(obj[key]);
                if (val !== null && val !== undefined) {
                    acc[key] = val;
                }
                return acc;
            }, {});
        }
        return obj;
    }

    // 3. CSV Export (Simple Flatten)
    function downloadCsv() {
        if (!jsonData) return;

        let data = Array.isArray(jsonData) ? jsonData : [jsonData];
        if (data.length === 0) return;

        // Flatten first level logic or robust flatten?
        // Let's do simple logic: Get all unique headers from all objects
        const headers = Array.from(
            new Set(
                data.flatMap((row) =>
                    row && typeof row === "object" ? Object.keys(row) : [],
                ),
            ),
        );

        const csvRows = [
            headers.join(","),
            ...data.map((row) => {
                return headers
                    .map((header) => {
                        const val = row[header];
                        if (val === null || val === undefined) return "";
                        const str =
                            typeof val === "object"
                                ? JSON.stringify(val)
                                : String(val);
                        // Escape quotes
                        return `"${str.replace(/"/g, '""')}"`;
                    })
                    .join(",");
            }),
        ];

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "export.csv";
        a.click();
        URL.revokeObjectURL(url);
        onClose();
    }

    // 4. Escape/Unescape (Copy to Clipboard)
    function copyEscaped() {
        const str = JSON.stringify(jsonData);
        // JSON.stringify already escapes quotes, but let's make it code-string ready (escape backslashes again?)
        // Usually, users want the content of a string literal.
        // Simple JSON.stringify is usually enough for "Paste into JSON string".
        // But if pasting into Java/JS string `const x = "..."`, needs extra escaping of "
        const escaped = JSON.stringify(JSON.stringify(jsonData));
        // Remove first and last quote added by the second stringify to get the inner content
        const content = escaped.slice(1, -1);
        navigator.clipboard.writeText(content);
        alert("Escaped JSON copied to clipboard!");
        onClose();
    }

    function handleUpdate(action: "sort" | "clean") {
        let newData = jsonData;
        if (action === "sort") newData = sortKeys(jsonData);
        if (action === "clean") newData = cleanData(jsonData);
        onUpdate(newData);
        onClose();
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
        <div
            class="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md"
        >
            <div
                class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between"
            >
                <h3
                    class="text-lg font-semibold text-slate-900 dark:text-white"
                >
                    JSON Tools
                </h3>
                <button
                    onclick={onClose}
                    class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-x"
                        ><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg
                    >
                </button>
            </div>

            <div class="p-4 grid grid-cols-1 gap-3">
                <h4 class="text-xs font-semibold text-slate-500 uppercase mt-1">
                    Structure
                </h4>
                <Button
                    variant="secondary"
                    onclick={() => handleUpdate("sort")}
                    class="justify-start"
                >
                    <span class="mr-2">🔤</span> Sort Keys (Recursive)
                </Button>
                <Button
                    variant="secondary"
                    onclick={() => handleUpdate("clean")}
                    class="justify-start"
                >
                    <span class="mr-2">🧹</span> Clean Data (Remove Nulls)
                </Button>

                <h4 class="text-xs font-semibold text-slate-500 uppercase mt-2">
                    Export / Util
                </h4>
                <Button
                    variant="secondary"
                    onclick={downloadCsv}
                    class="justify-start"
                >
                    <span class="mr-2">📊</span> Download as CSV
                </Button>
                <Button
                    variant="secondary"
                    onclick={copyEscaped}
                    class="justify-start"
                >
                    <span class="mr-2">📋</span> Copy Escaped String
                </Button>
            </div>
        </div>
    </div>
{/if}
