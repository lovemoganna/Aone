<script lang="ts">
  import { readExcel } from "../lib/excel";
  import { toCSV } from "../lib/converters";
  import { toastStore } from "$lib/stores/toastStore.svelte";

  interface LoadedFile {
    content: string;
    filename: string;
  }

  interface Props {
    onFileLoad: (content: string, filename: string) => void;
    onBatchLoad: (files: LoadedFile[]) => void;
  }

  let { onFileLoad, onBatchLoad }: Props = $props();

  let isDragOver = $state(false);
  let fileInput: HTMLInputElement;

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragOver = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
  }

  async function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      await processFiles(Array.from(files));
    }
  }

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      await processFiles(Array.from(input.files));
      input.value = "";
    }
  }

  async function processFiles(files: File[]) {
    const textExtensions = [".html", ".htm", ".txt", ".csv", ".md", ".markdown"];
    const excelExtensions = [".xlsx", ".xls"];
    const results: LoadedFile[] = [];
    const skipped: string[] = [];

    for (const file of files) {
      const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;

      if (textExtensions.includes(extension)) {
        results.push({ content: await file.text(), filename: file.name });
        continue;
      }

      if (excelExtensions.includes(extension)) {
        try {
          const data = readExcel(await file.arrayBuffer());
          results.push({ content: toCSV(data), filename: file.name });
        } catch {
          skipped.push(file.name);
        }
        continue;
      }

      skipped.push(file.name);
    }

    if (results.length === 0) {
      toastStore.error("不支持的文件类型。请使用 Excel、HTML、CSV、Markdown 或纯文本文件。");
      return;
    }

    if (results.length === 1 && files.length === 1) {
      onFileLoad(results[0].content, results[0].filename);
      return;
    }

    if (skipped.length > 0) {
      console.warn(`Skipped files: ${skipped.join(", ")}`);
    }
    onBatchLoad(results);
  }

  function handleClick() {
    fileInput?.click();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  }
</script>

<div
  class="file-drop-zone {isDragOver ? 'dragover' : ''}"
  role="button"
  tabindex="0"
  aria-label="Select or drop table files"
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  onclick={handleClick}
  onkeydown={handleKeyDown}
>
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="icon">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
  <p class="primary"><strong>Select files</strong> or drop them here</p>
  <p class="secondary">Supports Excel, HTML, CSV, Markdown, and TXT. Multiple files merge when headers match.</p>
</div>

<input
  type="file"
  bind:this={fileInput}
  id="table-file-input"
  accept=".html,.htm,.txt,.csv,.md,.markdown,.xlsx,.xls"
  multiple
  aria-label="Select table files"
  onchange={handleFileSelect}
  style="display: none;"
/>

<style>
  .file-drop-zone {
    border: 2px dashed var(--border-color, #d1d5db);
    border-radius: 0.5rem;
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

  /* [01] 遵循 Purple Ban 规范：统一为 Indigo 色系并补齐 focus-visible 焦点轮廓 */
  .file-drop-zone:focus-visible {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
  }

  :global(.dark) .file-drop-zone:focus-visible {
    border-color: #818cf8;
    box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.25);
  }

  .file-drop-zone:hover,
  .file-drop-zone.dragover {
    border-color: #4f46e5;
    background: rgba(79, 70, 229, 0.05);
    transform: scale(1.01);
  }

  :global(.dark) .file-drop-zone:hover,
  :global(.dark) .file-drop-zone.dragover {
    border-color: #818cf8;
    background: rgba(129, 140, 248, 0.08);
  }

  .icon {
    margin: 0 auto 1rem;
    color: #9ca3af;
  }

  .primary {
    font-size: 1rem;
    color: var(--text-primary, #111827);
    margin: 0 0 0.25rem;
  }

  :global(.dark) .primary {
    color: #f9fafb;
  }

  .secondary {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }
</style>
