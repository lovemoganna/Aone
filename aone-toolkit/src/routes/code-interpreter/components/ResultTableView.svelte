<script lang="ts">
    import type { TableResult } from "$lib/services/interpreter";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import HandoffDropdown from "$lib/components/ui/HandoffDropdown.svelte";
    import {
        Table as TableIcon,
        Search,
        Download,
        Copy,
        Check,
        ArrowUpDown,
        ArrowUp,
        ArrowDown,
        Filter,
        Layers,
    } from "lucide-svelte";

    interface Props {
        table: TableResult | null;
        queryTitle?: string;
    }

    let { table = null, queryTitle = "查询结果" }: Props = $props();

    let searchQuery = $state("");
    let currentPage = $state(1);
    let pageSize = $state(20);
    let sortColumn = $state<number | null>(null);
    let sortDirection = $state<"asc" | "desc">("asc");
    let copiedFormat = $state<string | null>(null);

    // Derived filtered rows
    let filteredRows = $derived.by(() => {
        if (!table || !table.rows) return [];
        let rows = [...table.rows];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            rows = rows.filter(row =>
                row.some(cell => String(cell ?? "").toLowerCase().includes(q))
            );
        }

        if (sortColumn !== null && sortColumn >= 0) {
            rows.sort((a, b) => {
                const valA = a[sortColumn!];
                const valB = b[sortColumn!];

                if (valA === valB) return 0;
                if (valA === null || valA === undefined) return 1;
                if (valB === null || valB === undefined) return -1;

                if (typeof valA === "number" && typeof valB === "number") {
                    return sortDirection === "asc" ? valA - valB : valB - valA;
                }

                return sortDirection === "asc"
                    ? String(valA).localeCompare(String(valB))
                    : String(valB).localeCompare(String(valA));
            });
        }

        return rows;
    });

    let totalPages = $derived(Math.max(1, Math.ceil(filteredRows.length / pageSize)));
    let paginatedRows = $derived(
        filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    );

    function toggleSort(colIndex: number) {
        if (sortColumn === colIndex) {
            if (sortDirection === "asc") {
                sortDirection = "desc";
            } else {
                sortColumn = null;
                sortDirection = "asc";
            }
        } else {
            sortColumn = colIndex;
            sortDirection = "asc";
        }
    }

    function generateCSV(): string {
        if (!table) return "";
        const headers = table.columns.map(c => `"${c.name.replace(/"/g, '""')}"`).join(",");
        const rows = table.rows.map(row =>
            row.map(val => (val === null || val === undefined ? "" : `"${String(val).replace(/"/g, '""')}"`)).join(",")
        );
        return [headers, ...rows].join("\n");
    }

    function generateJSON(): string {
        if (!table) return "[]";
        if (table.rawObjects) {
            return JSON.stringify(table.rawObjects, null, 2);
        }
        const objs = table.rows.map(row => {
            const obj: Record<string, any> = {};
            table!.columns.forEach((col, i) => {
                obj[col.name] = row[i];
            });
            return obj;
        });
        return JSON.stringify(objs, null, 2);
    }

    async function handleCopy(type: "csv" | "json") {
        const text = type === "csv" ? generateCSV() : generateJSON();
        const ok = await copyToClipboard(text);
        if (ok) {
            copiedFormat = type;
            toastStore.success(`已成功复制为 ${type.toUpperCase()} 格式`);
            setTimeout(() => (copiedFormat = null), 2000);
        }
    }

    function handleDownload(type: "csv" | "json") {
        const text = type === "csv" ? generateCSV() : generateJSON();
        const blob = new Blob([text], {
            type: type === "csv" ? "text/csv;charset=utf-8;" : "application/json"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `query_result_${Date.now()}.${type}`;
        a.click();
        URL.revokeObjectURL(url);
        toastStore.success(`已导出 ${type.toUpperCase()} 文件`);
    }
</script>

<div class="h-full flex flex-col bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs overflow-hidden">
    {#if !table || table.columns.length === 0}
        <div class="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12">
            <TableIcon size={32} class="stroke-1 mb-2 opacity-50" />
            <p class="text-sm font-medium">暂无表格结果</p>
            <p class="text-xs text-slate-400 mt-1">执行 SQL 查询或在 Python / JS 中返回数组对象即可自动渲染结构化表格</p>
        </div>
    {:else}
        <!-- Action Toolbar -->
        <div class="px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-950/50 shrink-0">
            <div class="flex items-center gap-3">
                <div class="relative w-48 sm:w-60">
                    <Search size={13} class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        bind:value={searchQuery}
                        placeholder="搜索表格内容..."
                        class="w-full pl-8 pr-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-xs focus:outline-none focus:border-slate-400 text-slate-800 dark:text-slate-200 transition-colors"
                    />
                </div>
                <span class="text-slate-500 dark:text-slate-400 font-medium text-xs">
                    共 <strong class="text-slate-800 dark:text-slate-100">{table.rowCount}</strong> 行，
                    <strong class="text-slate-800 dark:text-slate-100">{table.columns.length}</strong> 列
                </span>
            </div>

            <div class="flex items-center gap-1.5">
                <!-- Copy CSV -->
                <button
                    onclick={() => handleCopy("csv")}
                    class="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer text-xs shadow-2xs"
                    title="复制为 CSV"
                >
                    {#if copiedFormat === "csv"}
                        <Check size={12} class="text-emerald-500" />
                    {:else}
                        <Copy size={12} />
                    {/if}
                    <span>CSV</span>
                </button>

                <!-- Copy JSON -->
                <button
                    onclick={() => handleCopy("json")}
                    class="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer text-xs shadow-2xs"
                    title="复制为 JSON"
                >
                    {#if copiedFormat === "json"}
                        <Check size={12} class="text-emerald-500" />
                    {:else}
                        <Copy size={12} />
                    {/if}
                    <span>JSON</span>
                </button>

                <!-- Export CSV -->
                <button
                    onclick={() => handleDownload("csv")}
                    class="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer text-xs shadow-2xs"
                    title="下载 CSV"
                >
                    <Download size={12} />
                    <span>导出</span>
                </button>

                <!-- Handoff to other Aone tools -->
                <HandoffDropdown
                    sourceTool="代码解释器"
                    dataType="csv"
                    getData={() => generateCSV()}
                    title={queryTitle}
                />
            </div>
        </div>

        <!-- Scrollable Table Container -->
        <div class="flex-1 overflow-auto min-h-0">
            <table class="w-full text-left border-collapse font-mono text-[11px]">
                <thead class="sticky top-0 bg-slate-100 dark:bg-slate-800/90 backdrop-blur z-10 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                        <th class="py-2 px-3 text-slate-400 font-semibold w-12 text-center border-r border-slate-200 dark:border-slate-700">
                            #
                        </th>
                        {#each table.columns as col, i}
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                            <th
                                onclick={() => toggleSort(i)}
                                class="py-2 px-3 text-slate-700 dark:text-slate-200 font-semibold border-r border-slate-200 dark:border-slate-700 cursor-pointer select-none hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                            >
                                <div class="flex items-center justify-between gap-1">
                                    <div class="flex items-center gap-1.5 truncate">
                                        <span class="truncate">{col.name}</span>
                                        {#if col.type}
                                            <span class="text-[9px] px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-normal">
                                                {col.type}
                                            </span>
                                        {/if}
                                    </div>
                                    <div class="text-slate-400 shrink-0">
                                        {#if sortColumn === i}
                                            {#if sortDirection === "asc"}
                                                <ArrowUp size={12} class="text-slate-900 dark:text-white" />
                                            {:else}
                                                <ArrowDown size={12} class="text-slate-900 dark:text-white" />
                                            {/if}
                                        {:else}
                                            <ArrowUpDown size={11} class="opacity-30 group-hover:opacity-100" />
                                        {/if}
                                    </div>
                                </div>
                            </th>
                        {/each}
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                    {#if paginatedRows.length === 0}
                        <tr>
                            <td colspan={table.columns.length + 1} class="py-8 text-center text-slate-400">
                                未匹配到包含「{searchQuery}」的数据行
                            </td>
                        </tr>
                    {:else}
                        {#each paginatedRows as row, rIdx}
                            <tr class="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors">
                                <td class="py-1.5 px-3 text-slate-400 text-center border-r border-slate-100 dark:border-slate-800 select-none font-mono">
                                    {(currentPage - 1) * pageSize + rIdx + 1}
                                </td>
                                {#each row as cell}
                                    <td class="py-1.5 px-3 border-r border-slate-100 dark:border-slate-800 truncate max-w-xs">
                                        {#if cell === null || cell === undefined}
                                            <span class="text-slate-400 italic">null</span>
                                        {:else if typeof cell === "boolean"}
                                            <span class="px-1 py-0.2 rounded font-semibold text-[10px] {cell ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400'}">
                                                {String(cell)}
                                            </span>
                                        {:else}
                                            <span title={String(cell)}>{String(cell)}</span>
                                        {/if}
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    {/if}
                </tbody>
            </table>
        </div>

        <!-- Pagination Footer -->
        <div class="px-3 py-1.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between text-slate-500 shrink-0 text-xs">
            <div class="flex items-center gap-2">
                <span>每页显示:</span>
                <select
                    bind:value={pageSize}
                    onchange={() => (currentPage = 1)}
                    class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-slate-400 text-slate-700 dark:text-slate-300"
                >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
            </div>

            <div class="flex items-center gap-2">
                <span class="font-mono text-[11px]">第 {currentPage} / {totalPages} 页</span>
                <div class="flex items-center gap-1">
                    <button
                        onclick={() => (currentPage = Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        class="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs shadow-2xs"
                    >
                        上一页
                    </button>
                    <button
                        onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        class="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs shadow-2xs"
                    >
                        下一页
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>
