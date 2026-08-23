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
    Check,
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
      title: "电子表格与结构数据",
      items: [
        {
          format: "excel" as OutputFormat,
          label: "Excel 工作簿",
          ext: ".xlsx",
          icon: FileSpreadsheet,
          color: "text-emerald-600 dark:text-emerald-400",
          desc: "带表头样式的标准 Excel 文件",
        },
        {
          format: "csv" as OutputFormat,
          label: "CSV 逗号分隔符",
          ext: ".csv",
          icon: FileSpreadsheet,
          color: "text-blue-600 dark:text-blue-400",
          desc: "逗号分隔通用纯文本格式",
        },
        {
          format: "json" as OutputFormat,
          label: "JSON 对象数组",
          ext: ".json",
          icon: FileCode,
          color: "text-amber-600 dark:text-amber-400",
          desc: "标准键值对结构化 JSON",
        },
      ],
    },
    {
      title: "文档与网页标记",
      items: [
        {
          format: "markdown" as OutputFormat,
          label: "Markdown 表格",
          ext: ".md",
          icon: FileText,
          color: "text-indigo-600 dark:text-indigo-400",
          desc: "GFM 规范 Markdown 表格语法",
        },
        {
          format: "html" as OutputFormat,
          label: "HTML Table 标签",
          ext: ".html",
          icon: Code2,
          color: "text-rose-600 dark:text-rose-400",
          desc: "标准 HTML <table> 结构",
        },
        {
          format: "orgmode" as OutputFormat,
          label: "Org Mode 表格",
          ext: ".org",
          icon: FileText,
          color: "text-slate-600 dark:text-slate-400",
          desc: "Emacs Org Mode 文本表格",
        },
      ],
    },
    {
      title: "数据库 SQL 脚本",
      items: [
        {
          format: "sql-mysql" as OutputFormat,
          label: "MySQL 脚本",
          ext: ".sql",
          icon: Database,
          color: "text-sky-600 dark:text-sky-400",
          desc: "CREATE TABLE + INSERT 语句",
        },
        {
          format: "sql-pg" as OutputFormat,
          label: "PostgreSQL 脚本",
          ext: ".sql",
          icon: Database,
          color: "text-cyan-600 dark:text-cyan-400",
          desc: "PostgreSQL 语法建表与灌库",
        },
        {
          format: "sql-duckdb" as OutputFormat,
          label: "DuckDB 脚本",
          ext: ".sql",
          icon: Database,
          color: "text-yellow-600 dark:text-yellow-400",
          desc: "DuckDB 兼容内存查询与表生成",
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
      `inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 shadow-xs transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 ${
        size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm"
      }`}
    title={disabled ? "请先解析表格" : "下载为指定格式文件"}
  >
    <Download class="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
    <span>{label}</span>
    <ChevronDown class="h-3 w-3 opacity-60 transition-transform {isOpen ? 'rotate-180' : ''}" />
  </button>

  {#if isOpen}
    <div
      class="absolute right-0 z-50 mt-1.5 w-72 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-800 animate-in fade-in zoom-in-95 duration-100"
      role="menu"
    >
      <div class="px-2 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
        <span>选择下载格式</span>
        <span class="font-mono lowercase text-slate-400 font-normal">[{tableName}.*]</span>
      </div>

      <div class="max-h-[380px] overflow-y-auto py-1 space-y-2.5">
        {#each exportGroups as group}
          <div>
            <div class="px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {group.title}
            </div>
            <div class="mt-1 space-y-0.5">
              {#each group.items as item}
                {@const ItemIcon = item.icon}
                <button
                  type="button"
                  onclick={() => handleSelect(item.format)}
                  class="w-full flex items-start gap-2.5 px-2 py-1.5 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors group cursor-pointer"
                  role="menuitem"
                >
                  <div class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-700 {item.color}">
                    <ItemIcon class="h-3.5 w-3.5" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-medium text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {item.label}
                      </span>
                      <span class="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                        {item.ext}
                      </span>
                    </div>
                    <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {item.desc}
                    </p>
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
