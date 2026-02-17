<script lang="ts">
    import { diagramStore } from "../../lib/store.svelte";
    import {
        X,
        Download,
        Image as ImageIcon,
        FileImage,
        FileType,
        FileText,
    } from "lucide-svelte";

    import { exportToBlob, triggerDownload } from "../../lib/export";

    let { isOpen = $bindable(false), onClose } = $props<{
        isOpen: boolean;
        onClose: () => void;
    }>();

    let format = $state<"svg" | "png" | "jpg" | "pdf">("png");
    let scale = $state(2);
    let includeWatermark = $state(false);
    let watermarkText = $state("Created with Aone Diagram");

    const SCALES = [1, 2, 3, 4];

    async function handleExport() {
        if (!diagramStore.svg) {
            alert("No diagram to export. Please render first.");
            return;
        }

        try {
            if (format === "svg") {
                downloadSVG();
            } else if (format === "pdf") {
                downloadPDF();
            } else {
                const blob = await exportToBlob(
                    diagramStore.svg,
                    format as "png" | "jpg",
                    scale,
                    includeWatermark ? watermarkText : undefined,
                );
                triggerDownload(blob, `diagram.${format}`);
            }
            onClose();
        } catch (e: any) {
            console.error("Export error:", e);
            alert("Export failed: " + e.message);
        }
    }

    function downloadSVG() {
        const blob = new Blob([diagramStore.svg], { type: "image/svg+xml" });
        triggerDownload(blob, "diagram.svg");
    }

    function downloadPDF() {
        // Simple PDF export via printing a new window
        const win = window.open("", "_blank");
        if (!win) {
            alert("Popup blocked! Please allow popups for PDF export.");
            return;
        }

        win.document.write(`
            <html>
            <head>
                <title>Diagram Export</title>
                <style>
                    body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
                    svg { max-width: 90%; max-height: 90%; }
                </style>
            </head>
            <body>
                ${diagramStore.svg}
                <script>
                    window.onload = () => {
                        window.print();
                        setTimeout(() => window.close(), 100);
                    };
                <\/script>
            </body>
            </html>
        `);
        win.document.close();
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onclick={onClose}
        onkeydown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabindex="0"
    >
        <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
            role="document"
            tabindex="-1"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700"
            >
                <h3
                    class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
                >
                    <Download size={20} class="text-indigo-500" />
                    Export Diagram
                </h3>
                <button
                    class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    onclick={onClose}
                >
                    <X size={20} />
                </button>
            </div>

            <!-- Body -->
            <div class="p-6 space-y-6">
                <!-- Format Selection -->
                <div role="group" aria-labelledby="format-label">
                    <span
                        id="format-label"
                        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
                        >Format</span
                    >
                    <div class="grid grid-cols-2 gap-3">
                        <button
                            class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all {format ===
                            'svg'
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                                : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300'}"
                            onclick={() => (format = "svg")}
                        >
                            <FileType size={24} />
                            <span class="text-sm font-medium">SVG</span>
                        </button>
                        <button
                            class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all {format ===
                            'png'
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                                : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300'}"
                            onclick={() => (format = "png")}
                        >
                            <ImageIcon size={24} />
                            <span class="text-sm font-medium">PNG</span>
                        </button>
                        <button
                            class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all {format ===
                            'jpg'
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                                : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300'}"
                            onclick={() => (format = "jpg")}
                        >
                            <FileImage size={24} />
                            <span class="text-sm font-medium">JPG</span>
                        </button>
                        <button
                            class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all {format ===
                            'pdf'
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                                : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300'}"
                            onclick={() => (format = "pdf")}
                        >
                            <FileText size={24} />
                            <span class="text-sm font-medium">PDF</span>
                        </button>
                    </div>
                </div>

                <!-- Scale Selection (only for raster) -->
                {#if format !== "svg" && format !== "pdf"}
                    <div role="group" aria-labelledby="scale-label">
                        <span
                            id="scale-label"
                            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3"
                            >Scale (for high-res export)</span
                        >
                        <div class="flex gap-3">
                            {#each SCALES as s}
                                <button
                                    class="flex-1 py-2 rounded-lg border-2 font-medium transition-all {scale ===
                                    s
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}"
                                    onclick={() => (scale = s)}
                                >
                                    {s}x
                                </button>
                            {/each}
                        </div>
                        <p class="mt-2 text-xs text-gray-500">
                            Higher scale = larger file, better quality for
                            print.
                        </p>
                    </div>
                {/if}

                <!-- Watermark -->
                {#if format !== "svg" && format !== "pdf"}
                    <div
                        class="pt-4 border-t border-gray-100 dark:border-gray-700"
                    >
                        <label
                            class="flex items-center gap-2 cursor-pointer mb-3"
                        >
                            <input
                                type="checkbox"
                                bind:checked={includeWatermark}
                                class="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            />
                            <span
                                class="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Include Watermark
                            </span>
                        </label>

                        {#if includeWatermark}
                            <input
                                type="text"
                                bind:value={watermarkText}
                                placeholder="Watermark (e.g. Copyright 2025)"
                                class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        {/if}
                    </div>
                {/if}
            </div>

            <!-- Footer -->
            <div
                class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
            >
                <button
                    class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    onclick={handleExport}
                >
                    <Download size={18} />
                    Export as {format.toUpperCase()}
                    {format !== "svg" && format !== "pdf" ? ` (${scale}x)` : ""}
                </button>
            </div>
        </div>
    </div>
{/if}
