<script lang="ts">
    import { Button } from "$lib/components/ui";
    import type { TableData, TableStats } from "../lib/types";
    import { getTableStats } from "../lib/converters";

    interface Props {
        data: TableData;
        onFullscreen: () => void;
        onDataChange: (data: TableData) => void;
    }

    let { data, onFullscreen, onDataChange }: Props = $props();

    let stats = $derived<TableStats>(getTableStats(data));

    // Editing state
    let editingCell: { row: number; col: number } | null = $state(null);
    let editValue = $state("");

    // Context menu state
    let contextMenu: { x: number; y: number; row: number; col: number } | null =
        $state(null);

    // Sorting state
    let sortColumn: number | null = $state(null);
    let sortDirection: "asc" | "desc" = $state("asc");

    function handleSort(colIndex: number) {
        if (data.length <= 1) return; // Need header + at least 1 data row

        if (sortColumn === colIndex) {
            // Toggle direction if same column
            sortDirection = sortDirection === "asc" ? "desc" : "asc";
        } else {
            sortColumn = colIndex;
            sortDirection = "asc";
        }

        const header = data[0];
        const body = data.slice(1);

        body.sort((a, b) => {
            const valA = a[colIndex].toString();
            const valB = b[colIndex].toString();
            const numA = parseFloat(valA);
            const numB = parseFloat(valB);

            // Numeric comparison if both are numbers
            if (!isNaN(numA) && !isNaN(numB)) {
                return sortDirection === "asc" ? numA - numB : numB - numA;
            }

            // String comparison
            const cmp = valA.localeCompare(valB, undefined, { numeric: true });
            return sortDirection === "asc" ? cmp : -cmp;
        });

        onDataChange([header, ...body]);
    }

    function handleDoubleClick(
        rowIndex: number,
        colIndex: number,
        currentValue: string,
    ) {
        editingCell = { row: rowIndex, col: colIndex };
        editValue = currentValue;
    }

    function handleEditBlur() {
        if (editingCell) {
            commitEdit();
        }
    }

    function handleEditKeyDown(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            commitEdit();
        } else if (e.key === "Escape") {
            editingCell = null;
            editValue = "";
        } else if (e.key === "Tab") {
            e.preventDefault();
            commitEdit();
            // Move to next cell
            if (editingCell) {
                const nextCol = editingCell.col + 1;
                if (nextCol < data[editingCell.row].length) {
                    handleDoubleClick(
                        editingCell.row,
                        nextCol,
                        data[editingCell.row][nextCol],
                    );
                } else if (editingCell.row + 1 < data.length) {
                    handleDoubleClick(
                        editingCell.row + 1,
                        0,
                        data[editingCell.row + 1][0],
                    );
                }
            }
        }
    }

    function commitEdit() {
        if (editingCell) {
            const newData = data.map((row, ri) =>
                row.map((cell, ci) =>
                    ri === editingCell!.row && ci === editingCell!.col
                        ? editValue
                        : cell,
                ),
            );
            onDataChange(newData);
            editingCell = null;
            editValue = "";
        }
    }

    function handleContextMenu(
        e: MouseEvent,
        rowIndex: number,
        colIndex: number,
    ) {
        e.preventDefault();
        contextMenu = {
            x: e.clientX,
            y: e.clientY,
            row: rowIndex,
            col: colIndex,
        };
    }

    function closeContextMenu() {
        contextMenu = null;
    }

    function addRowAbove() {
        if (contextMenu) {
            const colCount = data[0]?.length || 1;
            const newRow = Array(colCount).fill("");
            const newData = [
                ...data.slice(0, contextMenu.row),
                newRow,
                ...data.slice(contextMenu.row),
            ];
            onDataChange(newData);
            closeContextMenu();
        }
    }

    function addRowBelow() {
        if (contextMenu) {
            const colCount = data[0]?.length || 1;
            const newRow = Array(colCount).fill("");
            const newData = [
                ...data.slice(0, contextMenu.row + 1),
                newRow,
                ...data.slice(contextMenu.row + 1),
            ];
            onDataChange(newData);
            closeContextMenu();
        }
    }

    function deleteRow() {
        if (contextMenu && data.length > 1) {
            const newData = data.filter((_, i) => i !== contextMenu!.row);
            onDataChange(newData);
            closeContextMenu();
        }
    }

    function addColumnLeft() {
        if (contextMenu) {
            const newData = data.map((row, ri) => [
                ...row.slice(0, contextMenu!.col),
                ri === 0 ? "新列" : "",
                ...row.slice(contextMenu!.col),
            ]);
            onDataChange(newData);
            closeContextMenu();
        }
    }

    function addColumnRight() {
        if (contextMenu) {
            const newData = data.map((row, ri) => [
                ...row.slice(0, contextMenu!.col + 1),
                ri === 0 ? "新列" : "",
                ...row.slice(contextMenu!.col + 1),
            ]);
            onDataChange(newData);
            closeContextMenu();
        }
    }

    function deleteColumn() {
        if (contextMenu && data[0].length > 1) {
            const newData = data.map((row) =>
                row.filter((_, i) => i !== contextMenu!.col),
            );
            onDataChange(newData);
            closeContextMenu();
        }
    }

    // Close context menu on click outside
    function handleWindowClick() {
        if (contextMenu) {
            closeContextMenu();
        }
    }
</script>

<svelte:window onclick={handleWindowClick} />

<div class="preview-container">
    <div class="toolbar">
        <h3 class="title">✏️ 表格编辑</h3>
        <div class="toolbar-group">
            <span class="stats">
                {stats.rows} 行 × {stats.cols} 列 ({stats.cells} 单元格)
            </span>
            <span class="hint">双击编辑 · 右键菜单</span>
            <Button
                variant="ghost"
                size="sm"
                onclick={onFullscreen}
                title="全屏预览 (F11)"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                </svg>
                全屏
            </Button>
        </div>
    </div>

    <div class="table-container" role="table" aria-label="可编辑表格">
        <table>
            <thead>
                <tr>
                    {#each data[0] || [] as cell, colIndex}
                        <th
                            ondblclick={() =>
                                handleDoubleClick(0, colIndex, cell)}
                            oncontextmenu={(e) =>
                                handleContextMenu(e, 0, colIndex)}
                        >
                            {#if editingCell?.row === 0 && editingCell?.col === colIndex}
                                <!-- svelte-ignore a11y_autofocus -->
                                <input
                                    type="text"
                                    class="cell-input"
                                    bind:value={editValue}
                                    onblur={handleEditBlur}
                                    onkeydown={handleEditKeyDown}
                                    autofocus
                                />
                            {:else}
                                <div class="th-content">
                                    <span>{cell}</span>
                                    <button
                                        class="sort-btn"
                                        onclick={(e) => {
                                            e.stopPropagation();
                                            handleSort(colIndex);
                                        }}
                                        title="点击排序"
                                    >
                                        {#if sortColumn === colIndex}
                                            {#if sortDirection === "asc"}
                                                <svg
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="2"
                                                    ><path
                                                        d="m18 15-6-6-6 6"
                                                    /></svg
                                                >
                                            {:else}
                                                <svg
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="2"
                                                    ><path
                                                        d="m6 9 6 6 6-6"
                                                    /></svg
                                                >
                                            {/if}
                                        {:else}
                                            <svg
                                                width="12"
                                                height="12"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="2"
                                                opacity="0.4"
                                                ><path d="m6 9 6 6 6-6" /></svg
                                            >
                                        {/if}
                                    </button>
                                </div>
                            {/if}
                        </th>
                    {/each}
                </tr>
            </thead>
            <tbody>
                {#each data.slice(1) as row, rowOffset}
                    {@const rowIndex = rowOffset + 1}
                    <tr>
                        {#each row as cell, colIndex}
                            <td
                                ondblclick={() =>
                                    handleDoubleClick(rowIndex, colIndex, cell)}
                                oncontextmenu={(e) =>
                                    handleContextMenu(e, rowIndex, colIndex)}
                            >
                                {#if editingCell?.row === rowIndex && editingCell?.col === colIndex}
                                    <!-- svelte-ignore a11y_autofocus -->
                                    <input
                                        type="text"
                                        class="cell-input"
                                        bind:value={editValue}
                                        onblur={handleEditBlur}
                                        onkeydown={handleEditKeyDown}
                                        autofocus
                                    />
                                {:else}
                                    {cell}
                                {/if}
                            </td>
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>

<!-- Context Menu -->
{#if contextMenu}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        class="context-menu"
        style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
        role="menu"
        tabindex="-1"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.key === "Escape" && closeContextMenu()}
    >
        <div class="menu-section">
            <span class="menu-label">行操作</span>
            <button class="menu-item" onclick={addRowAbove}>
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"><path d="M12 5v14M5 12h14" /></svg
                >
                上方插入行
            </button>
            <button class="menu-item" onclick={addRowBelow}>
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"><path d="M12 5v14M5 12h14" /></svg
                >
                下方插入行
            </button>
            <button
                class="menu-item danger"
                onclick={deleteRow}
                disabled={data.length <= 1}
            >
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    ><path
                        d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
                    /></svg
                >
                删除行
            </button>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-section">
            <span class="menu-label">列操作</span>
            <button class="menu-item" onclick={addColumnLeft}>
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"><path d="M12 5v14M5 12h14" /></svg
                >
                左侧插入列
            </button>
            <button class="menu-item" onclick={addColumnRight}>
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"><path d="M12 5v14M5 12h14" /></svg
                >
                右侧插入列
            </button>
            <button
                class="menu-item danger"
                onclick={deleteColumn}
                disabled={data[0]?.length <= 1}
            >
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    ><path
                        d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
                    /></svg
                >
                删除列
            </button>
        </div>
    </div>
{/if}

<style>
    .preview-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .toolbar-group {
        display: flex;
        align-items: center;
        gap: 0.75rem;
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
        font-size: 0.875rem;
        color: #6b7280;
    }

    .hint {
        font-size: 0.75rem;
        color: #9ca3af;
        padding: 0.25rem 0.5rem;
        background: #f3f4f6;
        border-radius: 0.25rem;
    }

    :global(.dark) .hint {
        background: #374151;
        color: #9ca3af;
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
        cursor: pointer;
        min-width: 80px;
        position: relative;
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

    :global(.dark) th {
        background: #374151;
    }

    .th-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
    }

    .sort-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border: none;
        background: transparent;
        cursor: pointer;
        border-radius: 0.25rem;
        color: #6b7280;
        flex-shrink: 0;
    }

    .sort-btn:hover {
        background: rgba(93, 92, 222, 0.1);
        color: #5d5cde;
    }

    :global(.dark) .sort-btn {
        color: #9ca3af;
    }

    :global(.dark) .sort-btn:hover {
        background: rgba(129, 140, 248, 0.2);
        color: #818cf8;
    }

    tr:nth-child(even) td {
        background: #f9fafb;
    }

    :global(.dark) tr:nth-child(even) td {
        background: #1f2937;
    }

    th:hover,
    td:hover {
        background: rgba(93, 92, 222, 0.1);
    }

    /* Cell input */
    .cell-input {
        width: 100%;
        border: 2px solid #5d5cde;
        border-radius: 0.25rem;
        padding: 0.25rem 0.5rem;
        font-size: inherit;
        font-family: inherit;
        background: white;
        outline: none;
    }

    :global(.dark) .cell-input {
        background: #1f2937;
        color: #f9fafb;
        border-color: #818cf8;
    }

    /* Context Menu */
    .context-menu {
        position: fixed;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        min-width: 160px;
        padding: 0.25rem 0;
    }

    :global(.dark) .context-menu {
        background: #1f2937;
        border-color: #4b5563;
    }

    .menu-section {
        padding: 0.25rem 0;
    }

    .menu-label {
        display: block;
        padding: 0.25rem 0.75rem;
        font-size: 0.7rem;
        color: #9ca3af;
        text-transform: uppercase;
        font-weight: 600;
    }

    .menu-divider {
        height: 1px;
        background: #e5e7eb;
        margin: 0.25rem 0;
    }

    :global(.dark) .menu-divider {
        background: #4b5563;
    }

    .menu-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.5rem 0.75rem;
        border: none;
        background: transparent;
        font-size: 0.875rem;
        color: #374151;
        cursor: pointer;
        text-align: left;
    }

    :global(.dark) .menu-item {
        color: #e5e7eb;
    }

    .menu-item:hover:not(:disabled) {
        background: #f3f4f6;
    }

    :global(.dark) .menu-item:hover:not(:disabled) {
        background: #374151;
    }

    .menu-item:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .menu-item.danger {
        color: #ef4444;
    }

    .menu-item.danger:hover:not(:disabled) {
        background: #fef2f2;
    }

    :global(.dark) .menu-item.danger:hover:not(:disabled) {
        background: #450a0a;
    }
</style>
