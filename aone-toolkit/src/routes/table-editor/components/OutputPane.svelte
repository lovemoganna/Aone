<script lang="ts">
  import { Button } from "$lib/components/ui";
  import { Copy, Download, Check, WrapText, FileCode } from "lucide-svelte";
  import type { OutputFormat } from "../lib/types";
  import { FORMAT_CONFIG } from "../lib/types";
  import ExportDropdown from "./ExportDropdown.svelte";
  import { toastStore } from "$lib/stores/toastStore.svelte";

  interface Props {
    content: string;
    format: OutputFormat | null;
    tableName?: string;
    onCopy: () => void | Promise<void>;
    onDownload: () => void | Promise<void>;
    onDownloadOtherFormat?: (format: OutputFormat) => void;
  }

  let {
    content,
    format,
    tableName = "data_table",
    onCopy,
    onDownload,
    onDownloadOtherFormat,
  }: Props = $props();

  let isCopying = $state(false);
  let isDownloading = $state(false);
  let copied = $state(false);
  let isWrap = $state(false);

  const charCount = $derived(content.length);
  const lineCount = $derived(content ? content.split("\n").length : 0);
  const formatLabel = $derived(format ? FORMAT_CONFIG[format].label : "文本");
  const formatExt = $derived(format ? FORMAT_CONFIG[format].ext : ".txt");

  async function handleCopyClick() {
    if (isCopying || !content) return;

    isCopying = true;
    try {
      await onCopy();
      copied = true;
      toastStore.success(`已复制 ${formatLabel} 到剪贴板`);
      setTimeout(() => (copied = false), 2000);
    } catch {
      toastStore.error("复制失败，请手动选择复制");
    } finally {
      isCopying = false;
    }
  }

  async function handleDownloadClick() {
    if (isDownloading || !content) return;

    isDownloading = true;
    try {
      await onDownload();
    } finally {
      isDownloading = false;
    }
  }
</script>

<div class="flex flex-col gap-2.5">
  <!-- Toolbar -->
  <div class="flex items-center justify-between gap-2 flex-wrap">
    <div class="flex items-center gap-2">
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
        <FileCode class="h-3 w-3 text-indigo-500" />
        <span>{formatLabel}</span>
        <span class="text-slate-400">({formatExt})</span>
      </span>
      <span class="text-xs font-mono text-slate-400">
        {lineCount} 行 • {charCount} 字符
      </span>
    </div>

    <div class="flex items-center gap-1.5 justify-end">
      <!-- Wrap Text Toggle -->
      <button
        type="button"
        onclick={() => (isWrap = !isWrap)}
        class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer {isWrap ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium' : ''}"
        title="切换自动换行"
      >
        <WrapText class="h-3 w-3 text-slate-400" />
        <span>换行</span>
      </button>

      <button
        type="button"
        onclick={handleCopyClick}
        disabled={isCopying || !content}
        class="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
        title="复制输出内容到剪贴板"
      >
        {#if copied}
          <Check class="h-3 w-3 text-emerald-500" />
          <span class="text-emerald-600 dark:text-emerald-400">已复制</span>
        {:else}
          <Copy class="h-3 w-3 text-slate-400" />
          <span>复制</span>
        {/if}
      </button>

      <button
        type="button"
        onclick={handleDownloadClick}
        disabled={isDownloading || !content}
        class="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-500 font-medium text-white shadow-2xs disabled:opacity-40 transition-colors cursor-pointer"
        title={`下载当前 ${formatLabel} 文件 (${formatExt})`}
      >
        <Download class="h-3 w-3" />
        <span>下载 {formatExt}</span>
      </button>

      {#if onDownloadOtherFormat}
        <ExportDropdown
          {tableName}
          disabled={!content}
          onExport={onDownloadOtherFormat}
          label="更多格式 ▾"
          size="sm"
        />
      {/if}
    </div>
  </div>

  <!-- Code Output View -->
  <div class="relative rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden shadow-2xs">
    <textarea
      readonly
      value={content}
      rows="10"
      aria-label="转换后的表格输出内容"
      class="w-full p-3 font-mono text-xs text-slate-100 bg-slate-950 placeholder:text-slate-600 outline-none resize-y min-h-[200px] select-text {isWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre overflow-x-auto'}"
    ></textarea>
  </div>
</div>
