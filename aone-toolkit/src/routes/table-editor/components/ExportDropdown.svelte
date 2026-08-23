<script lang="ts">
  import { onMount } from "svelte";
  import {
    Download,
    ChevronDown,
    FileSpreadsheet,
    FileText,
    FileCode,
    Database,
    Code2,
  } from "lucide-svelte";
  import type { OutputFormat } from "../lib/types";

  interface Props {
    disabled?: boolean;
    tableName?: string;
    onExport: (format: OutputFormat) => void;
    size?: "sm" | "md";
    label?: string;
    buttonClass?: string;
  }

  let {
    disabled = false,
    tableName = "data_table",
    onExport,
    size = "sm",
    label = "导出 / 下载",
    buttonClass = "",
  }: Props = $props();

  let isOpen = $state(false);
  let dropdownRef = $state<HTMLDivElement | null>(null);

  const exportGroups = [
    {
      title: "表格与数据",
      items: [
        {
          format: "excel" as OutputFormat,
          label: "Excel 工作簿",
          ext: ".xlsx",
          icon: FileSpreadsheet,
          color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50",
          desc: "带样式的标准 Excel 文件",
        },
        {
          format: "csv" as OutputFormat,
          label: "CSV 逗号分隔",
          ext: ".csv",
          icon: FileSpreadsheet,
          color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50",
          desc: "逗号分隔通用纯文本格式",
        },
        {
          format: "json" as OutputFormat,
          label: "JSON 对象数组",
          ext: ".json",
          icon: FileCode,
          color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50",
          desc: "结构化 JSON 键值对数组",
        },
      ],
    },
    {
      title: "文档与网页",
      items: [
        {
          format: "markdown" as OutputFormat,
          label: "Markdown 表格",
          ext: ".md",
          icon: FileText,
          color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50",
          desc: "GFM 规范 Markdown 表格语法",
        },
        {
          format: "html" as OutputFormat,
          label: "HTML Table",
          ext: ".html",
          icon: Code2,
          color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50",
          desc: "标准 HTML <table> 结构",
        },
        {
          format: "orgmode" as OutputFormat,
          label: "Org Mode 表格",
          ext: ".org",
          icon: FileText,
          color: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800",
          desc: "Emacs Org Mode 文本表格",
        },
      ],
    },
    {
      title: "SQL 脚本",
      items: [
        {
          format: "sql-mysql" as OutputFormat,
          label: "MySQL",
          ext: ".sql",
          icon: Database,
          color: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50",
          desc: "CREATE TABLE + INSERT 语句",
        },
        {
          format: "sql-pg" as OutputFormat,
          label: "PostgreSQL",
          ext: ".sql",
          icon: Database,
          color: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50",
          desc: "PostgreSQL 建表与数据填充",
        },
        {
          format: "sql-duckdb" as OutputFormat,
          label: "DuckDB",
          ext: ".sql",
          icon: Database,
          color: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/50",
          desc: "DuckDB 嵌入式分析型 SQL",
        },
      ],
    },
  ];

  function handleSelect(format: OutputFormat) {
    onExport(format);
    isOpen = false;
  }

  function handleClickOutside(event: MouseEvent) {
    if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
      isOpen = false;
    }
  }

  onMount(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  });
</script>

<div class="relative inline-block text-left" bind:this={dropdownRef}>
  <button
    type="button"
    {disabled}
    onclick={() => (isOpen = !isOpen)}
    class={buttonClass ||
      `inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 transition-colors cursor-pointer ${
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs"
      }`}
    title={disabled ? "请先解析表格" : "下载为指定格式文件"}
  >
    <Download class="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
    <span>{label}</span>
    <ChevronDown class="h-3 w-3 opacity-60 transition-transform {isOpen ? 'rotate-180' : ''}" />
  </button>

  {#if isOpen}
    <div
      class="absolute right-0 z-50 mt-1.5 w-64 origin-top-right rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100"
      role="menu"
    >
      <div class="px-2 py-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span>下载格式</span>
        <span class="font-mono lowercase text-slate-400 font-normal">[{tableName}.*]</span>
      </div>

      <div class="max-h-[340px] overflow-y-auto py-1 space-y-2">
        {#each exportGroups as group}
          <div>
            <div class="px-2 py-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {group.title}
            </div>
            <div class="mt-0.5 space-y-0.5 ml-2 pl-1.5 border-l border-slate-200/60 dark:border-slate-800/60">
              {#each group.items as item}
                {@const ItemIcon = item.icon}
                <button
                  type="button"
                  onclick={() => handleSelect(item.format)}
                  class="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer"
                  role="menuitem"
                >
                  <div class="flex h-5 w-5 shrink-0 items-center justify-center rounded {item.color}">
                    <ItemIcon class="h-3 w-3" />
                  </div>
                  <div class="min-w-0 flex-1 flex items-center justify-between">
                    <span class="text-xs text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {item.label}
                    </span>
                    <span class="font-mono text-[10px] text-slate-400">
                      {item.ext}
                    </span>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
