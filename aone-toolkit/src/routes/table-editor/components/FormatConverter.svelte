<script lang="ts">
  import {
    Download,
    FileSpreadsheet,
    FileCode,
    FileText,
    Database,
    Code2,
    Check,
  } from "lucide-svelte";
  import type { OutputFormat } from "../lib/types";
  import { FORMAT_CONFIG } from "../lib/types";

  interface Props {
    formats: OutputFormat[];
    disabled: boolean;
    disabledReason?: string;
    activeFormat: OutputFormat | null;
    onConvert: (format: OutputFormat) => void;
    onDownloadFormat?: (format: OutputFormat) => void;
  }

  let {
    formats,
    disabled,
    disabledReason = "",
    activeFormat,
    onConvert,
    onDownloadFormat,
  }: Props = $props();

  const labels: Record<
    OutputFormat,
    { label: string; icon: any; badge: string; color: string; bg: string }
  > = {
    markdown: {
      label: "Markdown",
      icon: FileText,
      badge: ".md",
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/50",
    },
    csv: {
      label: "CSV",
      icon: FileSpreadsheet,
      badge: ".csv",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/50",
    },
    json: {
      label: "JSON",
      icon: FileCode,
      badge: ".json",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/50",
    },
    excel: {
      label: "Excel",
      icon: FileSpreadsheet,
      badge: ".xlsx",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    html: {
      label: "HTML Table",
      icon: Code2,
      badge: ".html",
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/50",
    },
    orgmode: {
      label: "Org Mode",
      icon: FileText,
      badge: ".org",
      color: "text-slate-600 dark:text-slate-400",
      bg: "bg-slate-100 dark:bg-slate-800",
    },
    "sql-mysql": {
      label: "MySQL",
      icon: Database,
      badge: ".sql",
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-950/50",
    },
    "sql-pg": {
      label: "PostgreSQL",
      icon: Database,
      badge: ".sql",
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-50 dark:bg-cyan-950/50",
    },
    "sql-duckdb": {
      label: "DuckDB",
      icon: Database,
      badge: ".sql",
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-950/50",
    },
  };

  function handleDirectDownload(e: MouseEvent, format: OutputFormat) {
    e.stopPropagation();
    if (disabled || !onDownloadFormat) return;
    onDownloadFormat(format);
  }
</script>

<div class="space-y-2.5">
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
    {#each formats as format}
      {@const info = labels[format]}
      {@const Icon = info.icon}
      {@const isActive = activeFormat === format}
      <div
        class="group relative flex items-stretch rounded-lg border transition-all duration-150 {isActive
          ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-2xs'
          : 'border-slate-200 dark:border-slate-800 bg-white hover:border-slate-300 dark:bg-slate-900 dark:hover:border-slate-700'}"
      >
        <button
          type="button"
          {disabled}
          onclick={() => onConvert(format)}
          class="flex min-h-[38px] flex-1 items-center gap-2 px-2.5 py-1.5 text-left disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          title={disabled && disabledReason
            ? disabledReason
            : `转换并在下方预览 ${info.label}`}
        >
          <div
            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md {info.bg} {info.color} transition-colors"
          >
            <Icon class="h-3.5 w-3.5" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-1">
              <span
                class="text-xs font-semibold truncate {isActive
                  ? 'text-indigo-950 dark:text-indigo-100'
                  : 'text-slate-800 dark:text-slate-200'}"
              >
                {info.label}
              </span>
              <span class="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                {info.badge}
              </span>
            </div>
          </div>
        </button>

        {#if onDownloadFormat}
          <button
            type="button"
            {disabled}
            onclick={(e) => handleDirectDownload(e, format)}
            class="flex items-center justify-center px-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:text-indigo-400 dark:hover:bg-slate-800 border-l border-slate-100 dark:border-slate-800 rounded-r-lg transition-colors disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
            title={`直接下载 ${info.label} (${info.badge})`}
            aria-label={`直接下载 ${info.label}`}
          >
            <Download class="h-3 w-3" />
          </button>
        {/if}
      </div>
    {/each}
  </div>
</div>
