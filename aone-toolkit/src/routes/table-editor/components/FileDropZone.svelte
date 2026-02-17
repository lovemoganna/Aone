<script lang="ts">
    import { readExcel } from "../lib/excel";
    import { toCSV } from "../lib/converters";

    interface Props {
        onBatchLoad: (files: { content: string; filename: string }[]) => void;
    }

    let { onBatchLoad }: Props = $props();

    let isDragOver = $state(false);
    let fileInput: HTMLInputElement;

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        isDragOver = true;
    }

    function handleDragLeave(e: DragEvent) {
        e.preventDefault();
        isDragOver = false;
    }

    async function handleDrop(e: DragEvent) {
        e.preventDefault();
        isDragOver = false;

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            await processFiles(Array.from(files));
        }
    }

    async function handleFileSelect(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            await processFiles(Array.from(input.files));
            input.value = "";
        }
    }

    async function processFiles(files: File[]) {
        const textExtensions = [
            ".html",
            ".htm",
            ".txt",
            ".csv",
            ".md",
            ".markdown",
        ];
        const excelExtensions = [".xlsx", ".xls"];

        const results: { content: string; filename: string }[] = [];
        let errors = 0;

        for (const file of files) {
            const ext = "." + file.name.split(".").pop()?.toLowerCase();

            if (textExtensions.includes(ext)) {
                const content = await file.text();
                results.push({ content, filename: file.name });
            } else if (excelExtensions.includes(ext)) {
                try {
                    const buffer = await file.arrayBuffer();
                    const data = readExcel(buffer);
                    // Convert to CSV for consistent processing in main page
                    const csvContent = toCSV(data);
                    results.push({ content: csvContent, filename: file.name });
                } catch (e) {
                    console.error(
                        `Failed to parse Excel file ${file.name}:`,
                        e,
                    );
                    errors++;
                }
            } else {
                errors++;
            }
        }

        if (results.length > 0) {
            onBatchLoad(results);
            if (errors > 0) {
                // Optional: Notify about skipped files
                console.warn(`${errors} files skipped or failed`);
            }
        } else {
            alert(
                "不支持的文件格式。支持: Excel (.xlsx, .xls), HTML, CSV, Text, Markdown",
            );
        }
    }

    function handleClick() {
        fileInput?.click();
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Enter" || e.key === " ") {
            handleClick();
        }
    }
</script>

<div
    class="file-drop-zone {isDragOver ? 'dragover' : ''}"
    role="button"
    tabindex="0"
    aria-label="点击或拖拽文件到此处上传"
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    onclick={handleClick}
    onkeydown={handleKeyDown}
>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="icon"
    >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
    <p class="primary"><strong>点击选择文件</strong> (支持批量) 或拖拽到此处</p>
    <p class="secondary">支持 Excel、HTML、CSV、Markdown、TXT</p>
</div>

<input
    type="file"
    bind:this={fileInput}
    id="table-file-input"
    accept=".html,.htm,.txt,.csv,.md,.markdown,.xlsx,.xls"
    multiple
    aria-label="选择要上传的文件"
    onchange={handleFileSelect}
    style="display: none;"
/>

<style>
    .file-drop-zone {
        border: 2px dashed var(--border-color, #d1d5db);
        border-radius: 0.75rem;
        padding: 2rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        background: var(--bg-secondary, #f9fafb);
    }

    :global(.dark) .file-drop-zone {
        border-color: #4b5563;
        background: #1f2937;
    }

    .file-drop-zone:hover,
    .file-drop-zone.dragover {
        border-color: #5d5cde;
        background: rgba(93, 92, 222, 0.05);
        transform: scale(1.02);
    }

    .icon {
        margin: 0 auto 1rem;
        color: #9ca3af;
    }

    .primary {
        font-size: 1rem;
        color: var(--text-primary, #111827);
        margin-bottom: 0.25rem;
    }

    :global(.dark) .primary {
        color: #f9fafb;
    }

    .secondary {
        font-size: 0.875rem;
        color: #6b7280;
    }
</style>
