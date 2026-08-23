<script lang="ts">
    import { diagramStore } from "../../lib/store.svelte";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import {
        X,
        Download,
        Image as ImageIcon,
        FileImage,
        FileType,
        FileText,
        Code2,
        FolderArchive,
        Upload,
        Check
    } from "lucide-svelte";

    import {
        exportToBlob,
        triggerDownload,
        exportStandaloneHtml,
        generateMarkdownSnippet,
    } from "../../lib/export";

    let { isOpen = $bindable(false), onClose } = $props<{
        isOpen: boolean;
        onClose: () => void;
    }>();

    let format = $state<"svg" | "png" | "jpg" | "pdf" | "html" | "markdown" | "bundle">("png");
    let scale = $state(2);
    let includeWatermark = $state(false);
    let watermarkType = $state<"corner" | "tiled">("tiled");
    let watermarkText = $state("INTERNAL USE ONLY - CONFIDENTIAL");
    let copiedMarkdown = $state(false);
    let fileInputRef = $state<HTMLInputElement>();

    const SCALES = [1, 2, 3, 4];

    async function handleExport() {
        if (!diagramStore.svg && format !== "bundle" && format !== "markdown") {
            toastStore.warning("当前没有可导出的图表，请先渲染。");
            return;
        }

        try {
            if (format === "svg") {
                const blob = new Blob([diagramStore.svg], { type: "image/svg+xml" });
                triggerDownload(blob, "diagram.svg");
            } else if (format === "html") {
                const docName = diagramStore.documents.find(d => d.id === diagramStore.activeDocumentId)?.name || "Architecture Diagram";
                const blob = exportStandaloneHtml(diagramStore.svg, docName);
                triggerDownload(blob, "architecture-diagram.html");
            } else if (format === "markdown") {
                const snippet = generateMarkdownSnippet(diagramStore.code, diagramStore.mode, diagramStore.plantumlServerUrl);
                navigator.clipboard.writeText(snippet);
                copiedMarkdown = true;
                setTimeout(() => (copiedMarkdown = false), 2000);
                toastStore.success("已复制 Markdown 图表片段到剪贴板");
                return;
            } else if (format === "bundle") {
                const bundleStr = diagramStore.exportProjectBundle();
                const blob = new Blob([bundleStr], { type: "application/json" });
                triggerDownload(blob, `aone-diagram-project-${new Date().toISOString().slice(0, 10)}.json`);
            } else if (format === "pdf") {
                downloadPDF();
            } else {
                const blob = await exportToBlob(
                    diagramStore.svg,
                    format as "png" | "jpg",
                    scale,
                    includeWatermark ? watermarkText : undefined,
                    watermarkType
                );
                triggerDownload(blob, `diagram.${format}`);
            }
            onClose();
        } catch (e: any) {
            console.error("Export error:", e);
            toastStore.error("导出失败: " + e.message);
        }
    }

    function handleImportBundle(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                const res = diagramStore.importProjectBundle(content);
                if (res.success) {
                    toastStore.success(res.message);
                    onClose();
                } else {
                    toastStore.error(res.message);
                }
            }
        };
        reader.readAsText(file);
    }

    function downloadPDF() {
        const win = window.open("", "_blank");
        if (!win) {
            toastStore.warning("弹窗已被浏览器拦截，请允许弹出窗口以导出 PDF。");
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
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        onclick={onClose}
        onkeydown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabindex="0"
    >
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
            class="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
            role="document"
            tabindex="-1"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40"
            >
                <h3
                    class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2"
                >
                    <Download size={15} class="text-slate-700 dark:text-slate-300" />
                    Export & Project Package
                </h3>
                <button
                    class="p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    onclick={onClose}
                >
                    <X size={15} />
                </button>
            </div>

            <!-- Body -->
            <div class="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
                <!-- Format Selection -->
                <div>
                    <span class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Target Export Format
                    </span>
                    <div class="grid grid-cols-4 gap-1.5">
                        <button
                            class="flex flex-col items-center gap-1 p-2.5 rounded border transition-colors {format === 'png' ? 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-xs' : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-400'}"
                            onclick={() => (format = "png")}
                        >
                            <ImageIcon size={18} />
                            <span class="text-xs">PNG</span>
                        </button>
                        <button
                            class="flex flex-col items-center gap-1 p-2.5 rounded border transition-colors {format === 'svg' ? 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-xs' : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-400'}"
                            onclick={() => (format = "svg")}
                        >
                            <FileType size={18} />
                            <span class="text-xs">SVG</span>
                        </button>
                        <button
                            class="flex flex-col items-center gap-1 p-2.5 rounded border transition-colors {format === 'html' ? 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-xs' : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-400'}"
                            onclick={() => (format = "html")}
                        >
                            <Code2 size={18} />
                            <span class="text-xs">HTML View</span>
                        </button>
                        <button
                            class="flex flex-col items-center gap-1 p-2.5 rounded border transition-colors {format === 'bundle' ? 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-xs' : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-400'}"
                            onclick={() => (format = "bundle")}
                        >
                            <FolderArchive size={18} />
                            <span class="text-xs">Project JSON</span>
                        </button>
                    </div>
                    <div class="grid grid-cols-3 gap-1.5 mt-1.5">
                        <button
                            class="flex items-center justify-center gap-1.5 p-2 rounded border transition-colors {format === 'jpg' ? 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-xs' : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-400'}"
                            onclick={() => (format = "jpg")}
                        >
                            <FileImage size={15} />
                            <span class="text-xs">JPG</span>
                        </button>
                        <button
                            class="flex items-center justify-center gap-1.5 p-2 rounded border transition-colors {format === 'pdf' ? 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-xs' : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-400'}"
                            onclick={() => (format = "pdf")}
                        >
                            <FileText size={15} />
                            <span class="text-xs">PDF</span>
                        </button>
                        <button
                            class="flex items-center justify-center gap-1.5 p-2 rounded border transition-colors {format === 'markdown' ? 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-xs' : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-400'}"
                            onclick={() => (format = "markdown")}
                        >
                            <Code2 size={15} />
                            <span class="text-xs">Markdown</span>
                        </button>
                    </div>
                </div>

                <!-- Scale Selection (only for raster) -->
                {#if format === "png" || format === "jpg"}
                    <div>
                        <span class="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                            Resolution Scale
                        </span>
                        <div class="flex gap-1.5">
                            {#each SCALES as s}
                                <button
                                    class="flex-1 py-1 rounded border text-xs font-semibold transition-colors {scale === s ? 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs' : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-400'}"
                                    onclick={() => (scale = s)}
                                >
                                    {s}x ({s * 100}%)
                                </button>
                            {/each}
                        </div>
                    </div>

                    <!-- Watermark -->
                    <div class="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                        <label class="flex items-center justify-between cursor-pointer">
                            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Add Watermark
                            </span>
                            <input
                                type="checkbox"
                                bind:checked={includeWatermark}
                                class="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-0"
                            />
                        </label>

                        {#if includeWatermark}
                            <div class="space-y-2">
                                <input
                                    type="text"
                                    bind:value={watermarkText}
                                    placeholder="Watermark text..."
                                    class="w-full px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs text-slate-900 dark:text-slate-100 outline-none"
                                />
                                <div class="flex gap-1.5 text-xs">
                                    <button
                                        class="flex-1 py-1 rounded border text-xs transition-colors {watermarkType === 'tiled' ? 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold' : 'border-slate-200 dark:border-slate-800 text-slate-500'}"
                                        onclick={() => (watermarkType = "tiled")}
                                    >
                                        Tiled Diagonal
                                    </button>
                                    <button
                                        class="flex-1 py-1 rounded border text-xs transition-colors {watermarkType === 'corner' ? 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold' : 'border-slate-200 dark:border-slate-800 text-slate-500'}"
                                        onclick={() => (watermarkType = "corner")}
                                    >
                                        Corner Single
                                    </button>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}

                <!-- Import Bundle helper -->
                <div class="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <input
                        type="file"
                        accept=".json"
                        bind:this={fileInputRef}
                        class="hidden"
                        onchange={handleImportBundle}
                    />
                    <button
                        class="w-full py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                        onclick={() => fileInputRef?.click()}
                    >
                        <Upload size={13} />
                        Import Existing Project Bundle (.json)
                    </button>
                </div>
            </div>

            <!-- Footer -->
            <div
                class="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40"
            >
                <button
                    class="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                    onclick={handleExport}
                >
                    {#if format === "markdown" && copiedMarkdown}
                        <Check size={14} class="text-emerald-400 dark:text-emerald-600" />
                        Copied to Clipboard!
                    {:else}
                        <Download size={14} />
                        {format === "markdown" ? "Copy Markdown Snippet" : `Export as ${format.toUpperCase()}`}
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}
