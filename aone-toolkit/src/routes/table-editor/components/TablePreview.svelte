<script lang="ts">
  import { untrack } from "svelte";
  import { Button } from "$lib/components/ui";
  import type { TableData, TableStats, OutputFormat } from "../lib/types";
  import { getTableStats } from "../lib/converters";
  import ExportDropdown from "./ExportDropdown.svelte";

  interface Props {
    data: TableData;
    tableName?: string;
    onFullscreen: () => void;
    onDataChange: (data: TableData) => void;
    onExport?: (format: OutputFormat) => void;
  }

  let { data, tableName = "data_table", onFullscreen, onDataChange, onExport }: Props = $props();

  const stats = $derived<TableStats>(getTableStats(data));

  let editingCell = $state<{ row: number; col: number } | null>(null);
  let editValue = $state("");
  let sortColumn = $state<number | null>(null);
  let sortDirection = $state<"asc" | "desc">("asc");

  // Pagination for large dataset performance
  let pageSize = $state(50);
  let currentPage = $state(1);

  const totalBodyRows = $derived(Math.max(0, data.length - 1));
  const totalPages = $derived(Math.max(1, Math.ceil(totalBodyRows / pageSize)));

  $effect(() => {
    const pages = totalPages;
    untrack(() => {
      if (currentPage > pages) {
        currentPage = 1;
      }
    });
  });

  const pagedRows = $derived.by(() => {
    if (data.length <= 1) return [];
    const bodyRows = data.slice(1);
    const start = (currentPage - 1) * pageSize;
    return bodyRows.slice(start, start + pageSize).map((row, idx) => ({
      row,
      rowIndex: start + idx + 1
    }));
  });

  function columnLabel(colIndex: number) {
    return data[0]?.[colIndex]?.trim() || `Column ${colIndex + 1}`;
  }

  function sortState(colIndex: number) {
    if (sortColumn !== colIndex) return "none";
    return sortDirection === "asc" ? "ascending" : "descending";
  }

  function sortButtonLabel(colIndex: number) {
    const nextDirection = sortColumn === colIndex && sortDirection === "asc" ? "descending" : "ascending";
    return `Sort ${columnLabel(colIndex)} ${nextDirection}`;
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

<div class="preview-container">
  <div class="toolbar">
    <div class="heading-group">
      <h3 class="title">Parsed table</h3>
      <p id="table-preview-help" class="guidance">Use Enter on a focused cell to edit. Scroll horizontally for wide tables.</p>
    </div>
    <div class="toolbar-group">
      <span class="stats" aria-label={`${stats.rows} rows, ${stats.cols} columns, ${stats.cells} cells`}>
        <strong>{stats.rows}</strong> 行
        <strong>{stats.cols}</strong> 列
        <strong>{stats.cells}</strong> 单元格
      </span>
      <span class="hint">双击单元格或回车编辑</span>
      {#if onExport}
        <ExportDropdown
          {tableName}
          onExport={onExport}
          label="导出文件"
          size="sm"
        />
      {/if}
      <Button variant="ghost" size="sm" onclick={onFullscreen} title="全屏查看表格">全屏预览</Button>
    </div>
  </div>

  <div class="table-container" role="region" aria-label="Editable table preview" aria-describedby="table-preview-help">
    <table>
      <thead>
        <tr>
          {#each data[0] || [] as cell, colIndex}
            <th
              tabindex="0"
              aria-sort={sortState(colIndex)}
              ondblclick={() => startEdit(0, colIndex, cell)}
              onkeydown={(event) => handleCellKeyDown(event, 0, colIndex, cell)}
            >
              {#if editingCell?.row === 0 && editingCell?.col === colIndex}
                <!-- svelte-ignore a11y_autofocus -->
                <input class="cell-input" bind:value={editValue} onblur={commitEdit} onkeydown={handleEditKeyDown} autofocus />
              {:else}
                <div class="th-content">
                  <span class:empty-cell={!cell}>{cell || "Empty header"}</span>
                  <button
                    type="button"
                    class="sort-btn"
                    onclick={() => handleSort(colIndex)}
                    title={sortButtonLabel(colIndex)}
                    aria-label={sortButtonLabel(colIndex)}
                  >
                    {#if sortColumn === colIndex && sortDirection === "asc"}
                      Up
                    {:else if sortColumn === colIndex && sortDirection === "desc"}
                      Down
                    {:else}
                      Sort
                    {/if}
                  </button>
                </div>
              {/if}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each pagedRows as { row, rowIndex }}
          <tr>
            {#each row as cell, colIndex}
              <td
                tabindex="0"
                aria-label={`Row ${rowIndex}, ${columnLabel(colIndex)}: ${cell || "empty"}. Press Enter to edit.`}
                ondblclick={() => startEdit(rowIndex, colIndex, cell)}
                onkeydown={(event) => handleCellKeyDown(event, rowIndex, colIndex, cell)}
              >
                {#if editingCell?.row === rowIndex && editingCell?.col === colIndex}
                  <!-- svelte-ignore a11y_autofocus -->
                  <input class="cell-input" bind:value={editValue} onblur={commitEdit} onkeydown={handleEditKeyDown} autofocus />
                {:else}
                  <span class:empty-cell={!cell}>{cell || "Empty"}</span>
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if totalPages > 1}
    <div class="flex items-center justify-between px-2 py-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
      <div class="flex items-center gap-2">
        <span>显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalBodyRows)} 行（共 {totalBodyRows} 行）</span>
      </div>
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          class="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          onclick={() => { currentPage = Math.max(1, currentPage - 1); }}
          disabled={currentPage <= 1}
          aria-label="上一页"
        >
          上一页
        </button>
        <span class="px-2 py-1 font-mono">{currentPage} / {totalPages}</span>
        <button
          type="button"
          class="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          onclick={() => { currentPage = Math.min(totalPages, currentPage + 1); }}
          disabled={currentPage >= totalPages}
          aria-label="下一页"
        >
          下一页
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .preview-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
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
    min-width: min(100%, 22rem);
    flex-direction: column;
    gap: 0.35rem;
  }

  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin: 0;
  }

  :global(.dark) .title {
    color: #f9fafb;
  }

  .stats {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    font-size: 0.875rem;
    color: #4b5563;
  }

  .stats strong {
    color: var(--text-primary, #111827);
    font-weight: 650;
  }

  .guidance {
    margin: 0;
    color: #6b7280;
    font-size: 0.8125rem;
    line-height: 1.45;
  }

  .hint {
    font-size: 0.75rem;
    color: #6b7280;
    padding: 0.25rem 0.5rem;
    background: #f3f4f6;
    border-radius: 0.25rem;
  }

  :global(.dark) .stats,
  :global(.dark) .guidance,
  :global(.dark) .hint {
    color: #9ca3af;
  }

  :global(.dark) .stats strong {
    color: #f9fafb;
  }

  .table-container {
    max-height: 400px;
    overflow: auto;
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: 0.5rem;
    background: var(--bg-primary, #ffffff);
  }

  :global(.dark) .table-container {
    border-color: #4b5563;
    background: #1f2937;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    border: 1px solid var(--border-color, #d1d5db);
    padding: 0.75rem;
    text-align: left;
    vertical-align: top;
    min-width: 8rem;
    outline: none;
  }

  :global(.dark) th,
  :global(.dark) td {
    border-color: #4b5563;
  }

  th {
    background: #f3f4f6;
    font-weight: 600;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  th:focus-visible,
  td:focus-visible,
  .sort-btn:focus-visible {
    box-shadow: inset 0 0 0 2px #4f46e5;
  }

  :global(.dark) th:focus-visible,
  :global(.dark) td:focus-visible,
  :global(.dark) .sort-btn:focus-visible {
    box-shadow: inset 0 0 0 2px #818cf8;
  }

  :global(.dark) th {
    background: #374151;
  }

  tr:nth-child(even) td {
    background: #f9fafb;
  }

  :global(.dark) tr:nth-child(even) td {
    background: #1f2937;
  }

  .th-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .sort-btn {
    border: none;
    border-radius: 0.25rem;
    background: transparent;
    color: #6b7280;
    cursor: pointer;
    font-size: 0.7rem;
    padding: 0.2rem 0.3rem;
  }

  .sort-btn:hover {
    background: rgba(79, 70, 229, 0.1);
    color: #4f46e5;
  }

  .empty-cell {
    color: #9ca3af;
    font-style: italic;
  }

  .cell-input {
    width: 100%;
    border: 2px solid #4f46e5;
    border-radius: 0.25rem;
    padding: 0.25rem 0.5rem;
    font: inherit;
    background: white;
    outline: none;
  }

  :global(.dark) .cell-input {
    background: #1f2937;
    color: #f9fafb;
    border-color: #818cf8;
  }

  @media (max-width: 640px) {
    .toolbar,
    .toolbar-group {
      align-items: stretch;
      flex-direction: column;
    }

    .table-container {
      max-height: 360px;
    }
  }
</style>
