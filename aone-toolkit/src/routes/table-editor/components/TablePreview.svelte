<script lang="ts">
  import { untrack } from "svelte";
  import { Button } from "$lib/components/ui";
  import type { TableData, TableStats, OutputFormat } from "../lib/types";
  import { getTableStats } from "../lib/converters";
  import ExportDropdown from "./ExportDropdown.svelte";
  import {
    Maximize2,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Search,
    Edit3,
    Hash,
    ChevronLeft,
    ChevronRight,
  } from "lucide-svelte";

  interface Props {
    data: TableData;
    tableName?: string;
    onFullscreen: () => void;
    onDataChange: (data: TableData) => void;
    onExport?: (format: OutputFormat) => void;
  }

  let { data, tableName = "data_table", onFullscreen, onDataChange, onExport }: Props = $props();

  const stats = $derived<TableStats>(getTableStats(data));

  let searchQuery = $state("");
  let editingCell = $state<{ row: number; col: number } | null>(null);
  let editValue = $state("");
  let sortColumn = $state<number | null>(null);
  let sortDirection = $state<"asc" | "desc">("asc");

  // Pagination
  let pageSize = $state(25);
  let currentPage = $state(1);

  // Filtered body rows
  const filteredBodyRows = $derived.by(() => {
    if (data.length <= 1) return [];
    const query = searchQuery.trim().toLowerCase();
    const rows = data.slice(1);
    if (!query) {
      return rows.map((row, idx) => ({ row, originalIndex: idx + 1 }));
    }
    return rows
      .map((row, idx) => ({ row, originalIndex: idx + 1 }))
      .filter(({ row }) => row.some((cell) => String(cell ?? "").toLowerCase().includes(query)));
  });

  const totalFilteredRows = $derived(filteredBodyRows.length);
  const totalPages = $derived(Math.max(1, Math.ceil(totalFilteredRows / pageSize)));

  $effect(() => {
    const pages = totalPages;
    untrack(() => {
      if (currentPage > pages) {
        currentPage = 1;
      }
    });
  });

  const pagedRows = $derived.by(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBodyRows.slice(start, start + pageSize);
  });

  function columnLabel(colIndex: number) {
    return data[0]?.[colIndex]?.trim() || `列 ${colIndex + 1}`;
  }

  function handleSort(colIndex: number) {
    if (data.length <= 1) return;

    const nextDirection = sortColumn === colIndex && sortDirection === "asc" ? "desc" : "asc";
    sortColumn = colIndex;
    sortDirection = nextDirection;

    const [header, ...rows] = data;
    const sorted = [...rows].sort((a, b) => {
      const valueA = a[colIndex] ?? "";
      const valueB = b[colIndex] ?? "";
      const numberA = Number(valueA);
      const numberB = Number(valueB);

      if (!Number.isNaN(numberA) && !Number.isNaN(numberB) && valueA !== "" && valueB !== "") {
        return nextDirection === "asc" ? numberA - numberB : numberB - numberA;
      }

      const result = valueA.localeCompare(valueB, undefined, { numeric: true });
      return nextDirection === "asc" ? result : -result;
    });

    onDataChange([header, ...sorted]);
  }

  function startEdit(row: number, col: number, value: string) {
    editingCell = { row, col };
    editValue = value;
  }

  function commitEdit() {
    if (!editingCell) return;

    const targetCell = editingCell;
    const nextValue = editValue;
    const nextData = data.map((row, rowIndex) =>
      row.map((cell, colIndex) => (rowIndex === targetCell.row && colIndex === targetCell.col ? nextValue : cell)),
    );
    editingCell = null;
    editValue = "";
    onDataChange(nextData);
  }

  function handleEditKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      commitEdit();
    }

    if (event.key === "Escape") {
      event.stopPropagation();
      editingCell = null;
      editValue = "";
    }
  }

  function handleCellKeyDown(event: KeyboardEvent, row: number, col: number, value: string) {
    if (event.target instanceof HTMLButtonElement || event.target instanceof HTMLInputElement) return;

    if (event.key === "Enter" || event.key === "F2") {
      event.preventDefault();
      startEdit(row, col, value);
    }
  }
</script>

<div class="flex flex-col gap-3">
  <!-- Table Header Toolbar -->
  <div class="flex items-center justify-between gap-3 flex-wrap">
    <div class="flex items-center gap-2 min-w-0">
      <div class="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-400">
          <Hash class="h-3 w-3 text-slate-400" />
          <span>{stats.rows} 行 × {stats.cols} 列 ({stats.cells} 格)</span>
        </span>
      </div>

      <!-- Quick Row Search Filter -->
      <div class="relative">
        <Search class="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="搜索表格内容..."
          class="h-7 w-32 sm:w-44 pl-6 pr-2 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:w-48 sm:focus:w-56 focus:outline-none focus:border-indigo-500 transition-all"
        />
      </div>
    </div>

    <div class="flex items-center gap-1.5 justify-end">
      {#if onExport}
        <ExportDropdown
          {tableName}
          onExport={onExport}
          label="导出数据"
          size="sm"
        />
      {/if}
      <button
        type="button"
        onclick={onFullscreen}
        class="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        title="全屏检视表格"
      >
        <Maximize2 class="h-3 w-3 text-slate-400" />
        <span>全屏</span>
      </button>
    </div>
  </div>

  <!-- Interactive Grid Table -->
  <div class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
    <div class="max-h-[380px] overflow-auto select-text">
      <table class="w-full border-collapse text-left text-xs font-mono">
        <thead class="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th class="w-10 px-2.5 py-2 text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 border-r border-slate-200 dark:border-slate-700 select-none bg-slate-100 dark:bg-slate-800">
              #
            </th>
            {#each data[0] || [] as cell, colIndex}
              <th
                tabindex="0"
                ondblclick={() => startEdit(0, colIndex, cell)}
                onkeydown={(event) => handleCellKeyDown(event, 0, colIndex, cell)}
                class="px-3 py-2 text-slate-800 dark:text-slate-200 font-semibold border-r border-slate-200 dark:border-slate-700 min-w-[120px] max-w-[280px] truncate hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors group cursor-pointer"
              >
                {#if editingCell?.row === 0 && editingCell?.col === colIndex}
                  <!-- svelte-ignore a11y_autofocus -->
                  <input
                    class="w-full px-1.5 py-0.5 rounded border border-indigo-500 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none shadow-xs"
                    bind:value={editValue}
                    onblur={commitEdit}
                    onkeydown={handleEditKeyDown}
                    autofocus
                  />
                {:else}
                  <div class="flex items-center justify-between gap-1.5">
                    <span class="truncate {cell ? '' : 'text-slate-400 italic'}">{cell || "列头未命名"}</span>
                    <button
                      type="button"
                      onclick={(e) => { e.stopPropagation(); handleSort(colIndex); }}
                      class="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-slate-300/60 dark:hover:bg-slate-600 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors"
                      title={`按 ${columnLabel(colIndex)} 排序`}
                    >
                      {#if sortColumn === colIndex && sortDirection === "asc"}
                        <ArrowUp class="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                      {:else if sortColumn === colIndex && sortDirection === "desc"}
                        <ArrowDown class="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                      {:else}
                        <ArrowUpDown class="h-3 w-3 opacity-40 group-hover:opacity-100" />
                      {/if}
                    </button>
                  </div>
                {/if}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          {#if pagedRows.length === 0}
            <tr>
              <td colspan={(data[0]?.length || 1) + 1} class="p-8 text-center text-slate-400 dark:text-slate-500">
                {#if searchQuery}
                  未找到匹配 "{searchQuery}" 的行数据
                {:else}
                  暂无数据行
                {/if}
              </td>
            </tr>
          {:else}
            {#each pagedRows as { row, originalIndex }}
              <tr class="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors group">
                <td class="px-2 py-1.5 text-center text-[10px] font-mono text-slate-400 dark:text-slate-500 border-r border-slate-100 dark:border-slate-800 select-none bg-slate-50/50 dark:bg-slate-900/50">
                  {originalIndex}
                </td>
                {#each row as cell, colIndex}
                  <td
                    tabindex="0"
                    ondblclick={() => startEdit(originalIndex, colIndex, cell)}
                    onkeydown={(event) => handleCellKeyDown(event, originalIndex, colIndex, cell)}
                    class="px-3 py-1.5 text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 min-w-[120px] max-w-[280px] truncate group-hover:text-slate-900 dark:group-hover:text-slate-100 cursor-text"
                    title="双击或回车在位编辑"
                  >
                    {#if editingCell?.row === originalIndex && editingCell?.col === colIndex}
                      <!-- svelte-ignore a11y_autofocus -->
                      <input
                        class="w-full px-1.5 py-0.5 rounded border border-indigo-500 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none shadow-xs"
                        bind:value={editValue}
                        onblur={commitEdit}
                        onkeydown={handleEditKeyDown}
                        autofocus
                      />
                    {:else}
                      <span class={cell ? "" : "text-slate-300 dark:text-slate-600 italic"}>
                        {cell || "(空)"}
                      </span>
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    <!-- Table Footer / Pagination Bar -->
    <div class="flex items-center justify-between px-3 py-2 bg-slate-50/70 dark:bg-slate-900/70 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
      <div class="flex items-center gap-2">
        <span>
          显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalFilteredRows)} 行 / 共 {totalFilteredRows} 行
          {#if searchQuery}
            <span class="text-indigo-600 dark:text-indigo-400">(已过滤)</span>
          {/if}
        </span>
        <span class="text-slate-300 dark:text-slate-700">|</span>
        <div class="flex items-center gap-1">
          <span>每页</span>
          <select
            bind:value={pageSize}
            class="rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-1.5 py-0.5 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>行</span>
        </div>
      </div>

      {#if totalPages > 1}
        <div class="flex items-center gap-1">
          <button
            type="button"
            onclick={() => (currentPage = Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            class="flex h-6 w-6 items-center justify-center rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="上一页"
          >
            <ChevronLeft class="h-3.5 w-3.5" />
          </button>
          <span class="px-1.5 font-mono text-[11px]">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            class="flex h-6 w-6 items-center justify-center rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="下一页"
          >
            <ChevronRight class="h-3.5 w-3.5" />
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>
