<script lang="ts">
  import { readExcel } from "../lib/excel";
  import { toCSV } from "../lib/converters";
  import { toastStore } from "$lib/stores/toastStore.svelte";
  import { UploadCloud, FileSpreadsheet, FileText, Code2, Sparkles } from "lucide-svelte";

  interface LoadedFile {
    content: string;
    filename: string;
  }

  interface Props {
    onFileLoad: (content: string, filename: string) => void;
    onBatchLoad: (files: LoadedFile[]) => void;
    onSampleLoad?: (type: "csv" | "markdown" | "html" | "sql") => void;
  }

  let { onFileLoad, onBatchLoad, onSampleLoad }: Props = $props();

  let isDragOver = $state(false);
  let fileInput = $state<HTMLInputElement | null>(null);

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

<div class="space-y-2.5">
  <div
    class="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 sm:p-5 text-center cursor-pointer transition-all duration-200 {isDragOver
      ? 'border-indigo-500 bg-indigo-50/60 dark:border-indigo-400 dark:bg-indigo-950/30 scale-[0.99]'
      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-900/40 dark:hover:bg-slate-900/80 dark:hover:border-slate-700'}"
    role="button"
    tabindex="0"
    aria-label="点击选择或拖拽表格文件上传"
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    onclick={handleClick}
    onkeydown={handleKeyDown}
  >
    <div
      class="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 mb-2 transition-transform group-hover:scale-105"
    >
      <UploadCloud class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
    </div>

    <div class="space-y-1">
      <p class="text-xs font-medium text-slate-800 dark:text-slate-200">
        <span class="text-indigo-600 dark:text-indigo-400 font-semibold underline decoration-indigo-300 underline-offset-2">点击浏览</span> 或将文件拖放到此处
      </p>
      <p class="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
        支持 Excel (.xlsx/.xls)、CSV、Markdown、HTML 及 TXT 表格文件，多文件自动按表头合并
      </p>
    </div>

    <!-- Supported Format Chips -->
    <div class="mt-3 flex items-center justify-center gap-1.5 flex-wrap">
      <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/50">
        <FileSpreadsheet class="h-2.5 w-2.5" />
        .xlsx / .xls
      </span>
      <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/50">
        .csv
      </span>
      <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <FileText class="h-2.5 w-2.5" />
        .md
      </span>
      <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/50">
        <Code2 class="h-2.5 w-2.5" />
        .html
      </span>
    </div>
  </div>

  <input
    type="file"
    bind:this={fileInput}
    id="table-file-input"
    accept=".html,.htm,.txt,.csv,.md,.markdown,.xlsx,.xls"
    multiple
    aria-label="选择表格文件"
    onchange={handleFileSelect}
    class="hidden"
  />

  {#if onSampleLoad}
    <!-- Quick Sample Loader Bar -->
    <div class="flex items-center justify-between gap-2 px-1 text-[11px] text-slate-400">
      <span class="flex items-center gap-1">
        <Sparkles class="h-3 w-3 text-amber-500" />
        <span>快捷样例载入:</span>
      </span>
      <div class="flex items-center gap-1">
        <button
          type="button"
          onclick={() => onSampleLoad?.("csv")}
          class="px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors font-medium cursor-pointer"
        >
          CSV
        </button>
        <button
          type="button"
          onclick={() => onSampleLoad?.("markdown")}
          class="px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors font-medium cursor-pointer"
        >
          Markdown
        </button>
        <button
          type="button"
          onclick={() => onSampleLoad?.("html")}
          class="px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors font-medium cursor-pointer"
        >
          HTML
        </button>
        <button
          type="button"
          onclick={() => onSampleLoad?.("sql")}
          class="px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors font-medium cursor-pointer"
        >
          SQL
        </button>
      </div>
    </div>
  {/if}
</div>
