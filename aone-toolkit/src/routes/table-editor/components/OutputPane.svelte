<script lang="ts">
  import { Button } from "$lib/components/ui";
  import { Copy, Download, Check } from "lucide-svelte";
  import type { OutputFormat } from "../lib/types";
  import { FORMAT_CONFIG } from "../lib/types";
  import ExportDropdown from "./ExportDropdown.svelte";

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

  const charCount = $derived(content.length);
  const lineCount = $derived(content ? content.split("\n").length : 0);
  const formatLabel = $derived(format ? FORMAT_CONFIG[format].label : "文本");
  const formatExt = $derived(format ? FORMAT_CONFIG[format].ext : ".txt");
  const outputSummary = $derived(
    `${formatLabel} 输出, ${lineCount} 行, ${charCount} 字符`,
  );

  async function handleCopyClick() {
    if (isCopying) return;

    isCopying = true;
    try {
      await onCopy();
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } finally {
      isCopying = false;
    }
  }

  async function handleDownloadClick() {
    if (isDownloading) return;

    isDownloading = true;
    try {
      await onDownload();
    } finally {
      isDownloading = false;
    }
  }
</script>

<div class="output-container">
  <div class="toolbar">
    <div class="heading-group">
      <h3 class="title">转换与导出结果</h3>
      <p id="output-help" class="description">
        支持直接复制文本内容、下载当前 {formatLabel} ({formatExt}) 或导出其他格式文件。
      </p>
    </div>
    <div class="toolbar-group">
      <span class="stats" aria-label={outputSummary}>
        <strong class="text-indigo-600 dark:text-indigo-400">{formatLabel}</strong>
        <span>{lineCount} 行</span>
        <span>{charCount} 字符</span>
      </span>

      <button
        type="button"
        onclick={handleCopyClick}
        disabled={isCopying || !content}
        class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-xs text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        title="复制转换后内容"
      >
        {#if copied}
          <Check class="h-3.5 w-3.5 text-emerald-600" />
          <span>已复制</span>
        {:else}
          <Copy class="h-3.5 w-3.5" />
          <span>{isCopying ? "复制中..." : "复制内容"}</span>
        {/if}
      </button>

      <button
        type="button"
        onclick={handleDownloadClick}
        disabled={isDownloading || !content}
        class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 font-semibold text-xs text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        title={`下载当前 ${formatLabel} 文件 (${formatExt})`}
      >
        <Download class="h-3.5 w-3.5" />
        <span>{isDownloading ? "下载中..." : `下载 ${formatExt}`}</span>
      </button>

      {#if onDownloadOtherFormat}
        <ExportDropdown
          {tableName}
          disabled={!content}
          onExport={onDownloadOtherFormat}
          label="导出为其他格式"
          size="sm"
        />
      {/if}
    </div>
  </div>

  <div class="output-wrapper">
    <textarea
      class="output-pre"
      readonly
      value={content}
      aria-label="转换后的表格输出内容"
      aria-describedby="output-help"
    ></textarea>
  </div>
</div>

<style>
  .output-container {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .heading-group {
    display: flex;
    min-width: min(100%, 20rem);
    flex-direction: column;
    gap: 0.25rem;
  }

  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0;
  }

  :global(.dark) .title {
    color: #f9fafb;
  }

  .description {
    margin: 0;
    color: #6b7280;
    font-size: 0.8125rem;
    line-height: 1.4;
  }

  .stats {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
    font-size: 0.8125rem;
    color: #4b5563;
    padding-right: 0.25rem;
  }

  .stats span {
    color: #6b7280;
  }

  .output-wrapper {
    position: relative;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .output-pre {
    width: 100%;
    min-height: 260px;
    height: 320px;
    max-height: 560px;
    padding: 0.875rem 1rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.8125rem;
    line-height: 1.5;
    background: #0f172a;
    color: #f8fafc;
    border: 1px solid #1e293b;
    border-radius: 0.5rem;
    resize: vertical;
    outline: none;
    tab-size: 2;
    white-space: pre;
    overflow-x: auto;
    overflow-y: auto;
    flex-shrink: 0;
  }
</style>
