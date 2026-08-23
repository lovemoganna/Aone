<script lang="ts">
  import { Download } from "lucide-svelte";
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
    { label: string; icon: string; badge: string; color: string }
  > = {
    markdown: { label: "Markdown", icon: "M", badge: ".md", color: "text-indigo-500" },
    csv: { label: "CSV", icon: ",", badge: ".csv", color: "text-blue-500" },
    json: { label: "JSON", icon: "{}", badge: ".json", color: "text-amber-500" },
    excel: { label: "Excel", icon: "X", badge: ".xlsx", color: "text-emerald-500" },
    html: { label: "HTML", icon: "<>", badge: ".html", color: "text-rose-500" },
    orgmode: { label: "Org Mode", icon: "Org", badge: ".org", color: "text-slate-500" },
    "sql-mysql": { label: "MySQL", icon: "SQL", badge: ".sql", color: "text-sky-500" },
    "sql-pg": { label: "PostgreSQL", icon: "PG", badge: ".sql", color: "text-cyan-500" },
    "sql-duckdb": { label: "DuckDB", icon: "DB", badge: ".sql", color: "text-yellow-500" },
  };

  function handleDirectDownload(e: MouseEvent, format: OutputFormat) {
    e.stopPropagation();
    if (disabled || !onDownloadFormat) return;
    onDownloadFormat(format);
  }
</script>

<div class="converter-container">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="title">目标格式转换与直出下载</h3>
      {#if disabled && disabledReason}
        <p class="disabled-reason">{disabledReason}</p>
      {:else}
        <p class="text-xs text-slate-500 dark:text-slate-400">
          点击格式可在下方实时预览，点击右侧下载按钮可直接导出保存对应文件。
        </p>
      {/if}
    </div>
  </div>

  <div class="button-grid">
    {#each formats as format}
      {@const info = labels[format]}
      {@const isActive = activeFormat === format}
      <div
        class="group relative flex items-stretch rounded-xl border transition-all duration-150 {isActive
          ? 'border-indigo-600 bg-indigo-50/70 shadow-xs dark:border-indigo-500 dark:bg-indigo-950/40'
          : 'border-slate-200/80 bg-white hover:border-indigo-300 hover:bg-slate-50/80 dark:border-slate-700/80 dark:bg-slate-900/80 dark:hover:border-indigo-800 dark:hover:bg-slate-800/80'}"
      >
        <button
          type="button"
          {disabled}
          onclick={() => onConvert(format)}
          class="flex min-h-[44px] flex-1 items-center gap-2 px-3 py-2 text-left disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          title={disabled && disabledReason
            ? disabledReason
            : `转换为 ${info.label} 并在下方预览`}
        >
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-bold transition-colors dark:bg-slate-800 {info.color}"
          >
            {info.icon}
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span
                class="text-xs font-semibold {isActive
                  ? 'text-indigo-900 dark:text-indigo-100'
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
            class="flex items-center justify-center px-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100/50 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/40 border-l border-slate-200/60 dark:border-slate-700/60 rounded-r-xl transition-colors disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            title={`一键直接下载 ${info.label} (${info.badge})`}
            aria-label={`一键直接下载 ${info.label}`}
          >
            <Download class="h-3.5 w-3.5" />
          </button>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .converter-container {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }

  .title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0 0 0.25rem;
  }

  :global(.dark) .title {
    color: #f9fafb;
  }

  .disabled-reason {
    margin: 0;
    color: #6b7280;
    font-size: 0.8125rem;
    line-height: 1.4;
  }

  :global(.dark) .disabled-reason {
    color: #9ca3af;
  }

  .button-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.625rem;
  }

  @media (max-width: 768px) {
    .button-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 480px) {
    .button-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
