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
        Calculator,
        X,
        ChevronLeft,
        ChevronRight,
        AlignJustify,
        Code2
    } from "lucide-svelte";

    interface Props {
        table: TableResult | null;
        queryTitle?: string;
    }

    let { table = null, queryTitle = "查询结果" }: Props = $props();

    let searchQuery = $state("");
    let currentPage = $state(1);
    let pageSize = $state(50);
    let jumpPageInput = $state("1");
    let sortColumn = $state<number | null>(null);
    let sortDirection = $state<"asc" | "desc">("asc");
    let copiedFormat = $state<string | null>(null);
    let showStats = $state(false);
    let density = $state<"compact" | "standard">("compact");
    let statsFilter = $state<"all" | "numeric" | "categorical">("all");
    let inspectedCell = $state<{ title: string; value: string; isJson?: boolean } | null>(null);

    // Derived filtered rows
    let filteredRows = $derived.by(() => {
        if (!table || !table.rows) return [];
        let rows = [...table.rows];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            rows = rows.filter(row =>
                row.some(cell => {
                    if (cell === null || cell === undefined) return false;
                    const str = typeof cell === "object" ? JSON.stringify(cell) : String(cell);
                    return str.toLowerCase().includes(q);
                })
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

                if (typeof valA === "boolean" && typeof valB === "boolean") {
                    return sortDirection === "asc" ? (valA === valB ? 0 : valA ? -1 : 1) : (valA === valB ? 0 : valA ? 1 : -1);
                }

                return sortDirection === "asc"
                    ? String(valA).localeCompare(String(valB))
                    : String(valB).localeCompare(String(valA));
            });
        }

        return rows;
    });

    // Column stats for all columns (numeric + categorical)
    let columnStats = $derived.by(() => {
        if (!table || !table.rows || table.rows.length === 0) return [];
        return table.columns.map((col, idx) => {
            const rawValues = table!.rows.map(r => r[idx]);
            const nonNullValues = rawValues.filter(v => v !== null && v !== undefined);
            const nullCount = rawValues.length - nonNullValues.length;
            const nullPercentage = ((nullCount / rawValues.length) * 100).toFixed(0);

            const numericValues = nonNullValues.filter(
                v => typeof v === "number" && !isNaN(v)
            ) as number[];

            const isNumeric = numericValues.length === nonNullValues.length && nonNullValues.length > 0;

            if (isNumeric) {
                const min = Math.min(...numericValues);
                const max = Math.max(...numericValues);
                const sum = numericValues.reduce((a, b) => a + b, 0);
                const avg = Number((sum / numericValues.length).toFixed(2));
                const sorted = [...numericValues].sort((a, b) => a - b);
                const mid = Math.floor(sorted.length / 2);
                const median = sorted.length % 2 !== 0 ? sorted[mid] : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
                return {
                    name: col.name,
                    isNumeric: true,
                    count: numericValues.length,
                    nullCount,
                    nullPercentage,
                    min,
                    max,
                    avg,
                    sum: Number(sum.toFixed(2)),
                    median
                };
            } else {
                const distinctSet = new Set(nonNullValues.map(v => (typeof v === "object" ? JSON.stringify(v) : String(v))));
                return {
                    name: col.name,
                    isNumeric: false,
                    count: rawValues.length,
                    distinctCount: distinctSet.size,
                    nullCount,
                    nullPercentage
                };
            }
        });
    });

    let filteredStats = $derived.by(() => {
        if (statsFilter === "all") return columnStats;
        if (statsFilter === "numeric") return columnStats.filter(s => s?.isNumeric);
        return columnStats.filter(s => s && !s.isNumeric);
    });

    let hasNumericColumns = $derived(columnStats.some(s => s?.isNumeric));

    let totalPages = $derived(
        pageSize === -1 ? 1 : Math.max(1, Math.ceil(filteredRows.length / pageSize))
    );
    let paginatedRows = $derived(
        pageSize === -1
            ? filteredRows
            : filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
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

    function generateMarkdownTable(): string {
        if (!table || table.columns.length === 0) return "";
        const headers = `| ${table.columns.map(c => c.name).join(" | ")} |`;
        const dividers = `| ${table.columns.map(() => "---").join(" | ")} |`;
        const rows = table.rows.map(row =>
            `| ${row.map(v => (v === null || v === undefined ? "null" : String(v).replace(/\|/g, "\\|"))).join(" | ")} |`
        );
        return [headers, dividers, ...rows].join("\n");
    }

    function generateTSInterface(): string {
        if (!table || table.columns.length === 0) return "";
        const fields = table.columns.map((col, idx) => {
            const sample = table!.rows.find(r => r[idx] !== null && r[idx] !== undefined)?.[idx];
            let tsType = "any";
            if (typeof sample === "number") tsType = "number";
            else if (typeof sample === "boolean") tsType = "boolean";
            else if (typeof sample === "string") tsType = "string";
            else if (Array.isArray(sample)) tsType = "any[]";
            else if (typeof sample === "object" && sample !== null) tsType = "Record<string, any>";

            const hasNull = table!.rows.some(r => r[idx] === null || r[idx] === undefined);
            const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(col.name) ? col.name : JSON.stringify(col.name);
            return `    ${safeKey}${hasNull ? "?" : ""}: ${tsType}${hasNull ? " | null" : ""};`;
        });
        return `export interface QueryResultItem {\n${fields.join("\n")}\n}`;
    }

    async function handleCopy(type: "csv" | "json" | "markdown" | "ts") {
        let text = "";
        if (type === "csv") text = generateCSV();
        else if (type === "json") text = generateJSON();
        else if (type === "markdown") text = generateMarkdownTable();
        else if (type === "ts") text = generateTSInterface();

        const ok = await copyToClipboard(text);
        if (ok) {
            copiedFormat = type;
            const labels: Record<string, string> = {
                csv: "CSV",
                json: "JSON",
                markdown: "Markdown 表格",
                ts: "TS 接口定义"
            };
            toastStore.success(`已复制 ${labels[type]}`);
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
        a.download = `result_${Date.now()}.${type}`;
        a.click();
        URL.revokeObjectURL(url);
        toastStore.success(`已导出 ${type.toUpperCase()}`);
    }

    function handleJumpPage() {
        const p = parseInt(jumpPageInput, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
            currentPage = p;
        } else {
            jumpPageInput = String(currentPage);
        }
    }

    function isNumericValue(val: any): boolean {
        return typeof val === "number" && !isNaN(val);
    }

    function escapeHtml(str: string): string {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function renderCellContent(cell: any, query: string): { html: string; isPlain: boolean } {
        if (cell === null || cell === undefined) {
            return { html: '<span class="text-slate-400 dark:text-slate-500 italic font-mono text-[11px]">null</span>', isPlain: false };
        }
        if (typeof cell === "boolean") {
            const badgeClass = cell
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
            return {
                html: `<span class="px-1.5 py-0.2 rounded border text-[10px] font-mono font-semibold inline-block ${badgeClass}">${String(cell)}</span>`,
                isPlain: false
            };
        }
        if (Array.isArray(cell)) {
            return {
                html: `<span class="px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800 text-[10px] font-mono font-medium inline-flex items-center gap-1 cursor-pointer">[Array(${cell.length})]</span>`,
                isPlain: false
            };
        }
        if (typeof cell === "object") {
            const keysCount = Object.keys(cell).length;
            return {
                html: `<span class="px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800 text-[10px] font-mono font-medium inline-flex items-center gap-1 cursor-pointer">{Object(${keysCount})}</span>`,
                isPlain: false
            };
        }

        const str = String(cell);
        if (!query.trim()) {
            return { html: escapeHtml(str), isPlain: true };
        }

        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(${escapedQuery})`, "gi");
        const highlighted = escapeHtml(str).replace(
            regex,
            match => `<mark class="bg-amber-200 dark:bg-amber-900/80 text-slate-900 dark:text-amber-100 rounded-xs px-0.5 font-medium">${match}</mark>`
        );
        return { html: highlighted, isPlain: true };
    }
</script>

<div class="h-full flex flex-col bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs overflow-hidden" style="font-family: 'JetBrains Mono', monospace;">
    {#if !table || table.columns.length === 0}
        <div class="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-16 font-sans">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-2.5 shadow-2xs border border-slate-200/60 dark:border-slate-700/50">
                <TableIcon size={20} class="stroke-[1.6]" />
            </div>
            <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">暂无结构化表格数据</p>
            <p class="text-[11px] text-slate-400 mt-1 max-w-sm text-center">
                运行 SQL 查询或在 Python / JS 中返回对象数组，即可在此解析多维表格
            </p>
        </div>
    {:else}
        <!-- Action Toolbar -->
        <div class="px-3 py-1.5 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/60 dark:bg-slate-950/50 shrink-0 font-sans">
            <div class="flex items-center gap-2.5">
                <!-- Search Filter Input -->
                <div class="relative w-36 sm:w-52">
                    <Search size={12} class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        bind:value={searchQuery}
                        placeholder="检索单元格数据..."
                        class="w-full pl-7 pr-6 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-[11px] focus:outline-none focus:border-slate-400 text-slate-800 dark:text-slate-200 shadow-2xs font-mono transition-colors"
                    />
                    {#if searchQuery}
                        <button
                            type="button"
                            onclick={() => (searchQuery = "")}
                            class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            aria-label="清空搜索"
                        >
                            <X size={11} />
                        </button>
                    {/if}
                </div>

                <span class="text-slate-400 text-[11px] font-mono shrink-0 hidden sm:inline">
                    {#if searchQuery}
                        <strong class="text-indigo-600 dark:text-indigo-400 font-semibold">{filteredRows.length}</strong> / {table.rows.length} 行 ·
                    {:else}
                        <strong class="text-slate-700 dark:text-slate-300 font-semibold">{filteredRows.length}</strong> 行 ·
                    {/if}
                    <strong class="text-slate-700 dark:text-slate-300 font-semibold">{table.columns.length}</strong> 列
                </span>
            </div>

            <!-- Right Controls -->
            <div class="flex items-center gap-1.5 flex-wrap justify-end font-sans">
                <!-- Density Switch -->
                <div class="flex items-center rounded-lg border border-slate-200/70 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800/90 p-0.5 shadow-2xs">
                    <button
                        type="button"
                        onclick={() => (density = "compact")}
                        class="px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer {density === 'compact' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
                        title="紧凑行高 (26px)"
                    >
                        紧凑
                    </button>
                    <button
                        type="button"
                        onclick={() => (density = "standard")}
                        class="px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer {density === 'standard' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
                        title="标准行高 (34px)"
                    >
                        标准
                    </button>
                </div>

                <!-- Column Stats Toggle -->
                <button
                    type="button"
                    onclick={() => (showStats = !showStats)}
                    class="px-2 py-1 rounded-md border text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-2xs {showStats ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent font-medium' : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}"
                    title={showStats ? "收起聚合统计" : "展开列聚合统计与数据洞察"}
                >
                    <Calculator size={11} class={showStats ? "text-amber-400 dark:text-amber-600" : "text-slate-400"} />
                    <span>统计</span>
                </button>

                <!-- Copy Formats Button Group -->
                <div class="inline-flex rounded-md border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800/90 p-0.5 shadow-2xs text-[11px]">
                    <button
                        type="button"
                        onclick={() => handleCopy("markdown")}
                        class="px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                        title="复制为 Markdown 格式表格"
                    >
                        {#if copiedFormat === "markdown"}
                            <Check size={11} class="text-emerald-500" />
                        {:else}
                            <AlignJustify size={11} class="text-slate-400" />
                        {/if}
                        <span>MD</span>
                    </button>
                    <button
                        type="button"
                        onclick={() => handleCopy("ts")}
                        class="px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                        title="复制为 TypeScript 类型接口"
                    >
                        {#if copiedFormat === "ts"}
                            <Check size={11} class="text-emerald-500" />
                        {:else}
                            <Code2 size={11} class="text-slate-400" />
                        {/if}
                        <span>TS</span>
                    </button>
                    <button
                        type="button"
                        onclick={() => handleCopy("csv")}
                        class="px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                        title="复制为 CSV"
                    >
                        {#if copiedFormat === "csv"}
                            <Check size={11} class="text-emerald-500" />
                        {:else}
                            <Copy size={11} class="text-slate-400" />
                        {/if}
                        <span>CSV</span>
                    </button>
                    <button
                        type="button"
                        onclick={() => handleCopy("json")}
                        class="px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                        title="复制为 JSON"
                    >
                        {#if copiedFormat === "json"}
                            <Check size={11} class="text-emerald-500" />
                        {:else}
                            <Copy size={11} class="text-slate-400" />
                        {/if}
                        <span>JSON</span>
                    </button>
                </div>

                <!-- Export CSV -->
                <button
                    type="button"
                    onclick={() => handleDownload("csv")}
                    class="px-2 py-1 rounded-md bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer text-[11px] shadow-2xs"
                    title="导出 CSV 文件"
                >
                    <Download size={11} class="text-slate-400" />
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

        {#if showStats}
            <!-- Multi-Dimensional Summary Bar -->
            <div class="px-3.5 py-1.5 bg-slate-50/90 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5 overflow-x-auto text-[11px] font-mono scrollbar-none shrink-0">
                <div class="flex items-center gap-1.5 shrink-0 pr-2.5 border-r border-slate-200 dark:border-slate-800">
                    <Calculator size={12} class="text-indigo-600 dark:text-indigo-400" />
                    <span class="font-sans font-semibold text-slate-800 dark:text-slate-200">聚合统计</span>
                    <div class="flex items-center gap-1 ml-1.5 font-sans">
                        <button
                            type="button"
                            onclick={() => (statsFilter = "all")}
                            class="px-1.5 py-0.2 rounded text-[10px] cursor-pointer {statsFilter === 'all' ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}"
                        >
                            全部
                        </button>
                        {#if hasNumericColumns}
                            <button
                                type="button"
                                onclick={() => (statsFilter = "numeric")}
                                class="px-1.5 py-0.2 rounded text-[10px] cursor-pointer {statsFilter === 'numeric' ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}"
                            >
                                数值列
                            </button>
                        {/if}
                        <button
                            type="button"
                            onclick={() => (statsFilter = "categorical")}
                            class="px-1.5 py-0.2 rounded text-[10px] cursor-pointer {statsFilter === 'categorical' ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}"
                        >
                            分类/文本列
                        </button>
                    </div>
                </div>

                {#each filteredStats as st}
                    {#if st}
                        <div class="flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shrink-0 shadow-2xs">
                            <span class="font-semibold text-slate-800 dark:text-slate-100">{st.name}:</span>
                            {#if st.isNumeric}
                                <span class="text-slate-500">均值 <strong class="text-slate-700 dark:text-slate-300">{st.avg}</strong></span>
                                <span class="text-slate-300 dark:text-slate-700">|</span>
                                <span class="text-slate-500">范围 [{st.min}, {st.max}]</span>
                                <span class="text-slate-300 dark:text-slate-700">|</span>
                                <span class="text-slate-500">中位数 <strong class="text-slate-700 dark:text-slate-300">{st.median}</strong></span>
                                <span class="text-slate-300 dark:text-slate-700">|</span>
                                <span class="text-slate-500">总和 {st.sum}</span>
                            {:else}
                                <span class="text-slate-500">唯一值 <strong class="text-indigo-600 dark:text-indigo-400">{st.distinctCount}</strong> 种</span>
                                {#if st.nullCount > 0}
                                    <span class="text-slate-300 dark:text-slate-700">|</span>
                                    <span class="text-rose-500">空值 {st.nullCount} ({st.nullPercentage}%)</span>
                                {/if}
                            {/if}
                        </div>
                    {/if}
                {/each}
            </div>
        {/if}

        <!-- Scrollable Table Container -->
        <div class="flex-1 min-h-0 overflow-auto bg-white dark:bg-slate-900 relative">
            <table class="w-full text-left border-collapse whitespace-nowrap min-w-max">
                <thead class="sticky top-0 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xs shadow-2xs z-20 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                        <th class="py-1.5 px-2.5 text-slate-400 font-medium w-10 text-center border-r border-slate-200 dark:border-slate-800 select-none sticky left-0 bg-slate-50 dark:bg-slate-950 z-30 font-mono text-[11px]">
                            #
                        </th>
                        {#each table.columns as col, i}
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                            <th
                                onclick={() => toggleSort(i)}
                                class="py-1.5 px-3 text-slate-700 dark:text-slate-200 font-semibold border-r border-slate-200/80 dark:border-slate-800 cursor-pointer select-none hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors"
                            >
                                <div class="flex items-center justify-between gap-2">
                                    <div class="flex items-center gap-1.5 truncate">
                                        <span class="truncate font-mono text-xs">{col.name}</span>
                                        {#if col.type}
                                            <span class="text-[9px] px-1 py-0.2 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-normal">
                                                {col.type}
                                            </span>
                                        {/if}
                                    </div>
                                    <div class="text-slate-400 shrink-0">
                                        {#if sortColumn === i}
                                            {#if sortDirection === "asc"}
                                                <ArrowUp size={11} class="text-indigo-600 dark:text-indigo-400" />
                                            {:else}
                                                <ArrowDown size={11} class="text-indigo-600 dark:text-indigo-400" />
                                            {/if}
                                        {:else}
                                            <ArrowUpDown size={10} class="opacity-25" />
                                        {/if}
                                    </div>
                                </div>
                            </th>
                        {/each}
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {#if paginatedRows.length === 0}
                        <tr>
                            <td colspan={table.columns.length + 1} class="py-12 text-center text-slate-400 font-mono text-xs">
                                未匹配到包含「{searchQuery}」的数据行
                            </td>
                        </tr>
                    {:else}
                        {#each paginatedRows as row, rIdx}
                            <tr class="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors group">
                                <td class="px-2.5 text-slate-400 text-center border-r border-slate-200/60 dark:border-slate-800/60 select-none font-mono text-[10px] sticky left-0 bg-white dark:bg-slate-900 z-10 {density === 'compact' ? 'py-1' : 'py-2'}">
                                    {(currentPage - 1) * pageSize + rIdx + 1}
                                </td>
                                {#each row as cell, cIdx}
                                    {@const content = renderCellContent(cell, searchQuery)}
                                    <td
                                        class="px-3 border-r border-slate-100 dark:border-slate-800/60 truncate max-w-xs text-slate-700 dark:text-slate-300 font-mono text-xs {density === 'compact' ? 'py-1' : 'py-2'} {isNumericValue(cell) ? 'text-right tabular-nums' : 'text-left'}"
                                        ondblclick={() => {
                                            if (cell !== null && cell !== undefined) {
                                                const isObj = typeof cell === "object";
                                                inspectedCell = {
                                                    title: `${table?.columns[cIdx]?.name || `列 ${cIdx + 1}`} (行 ${(currentPage - 1) * pageSize + rIdx + 1})`,
                                                    value: isObj ? JSON.stringify(cell, null, 2) : String(cell),
                                                    isJson: isObj
                                                };
                                            }
                                        }}
                                        title="双击查看完整内容与格式化详情"
                                    >
                                        {@html content.html}
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    {/if}
                </tbody>
            </table>
        </div>

        <!-- Pagination Footer -->
        <div class="px-3 py-1.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 flex items-center justify-between text-slate-500 shrink-0 text-xs flex-wrap gap-2">
            <div class="flex items-center gap-2">
                <span class="text-[11px] text-slate-400">每页:</span>
                <select
                    bind:value={pageSize}
                    onchange={() => {
                        currentPage = 1;
                        jumpPageInput = "1";
                    }}
                    class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-[11px] focus:outline-none text-slate-700 dark:text-slate-300 cursor-pointer shadow-2xs font-mono"
                >
                    <option value={20}>20 行</option>
                    <option value={50}>50 行</option>
                    <option value={100}>100 行</option>
                    <option value={500}>500 行</option>
                    <option value={-1}>全部</option>
                </select>
            </div>

            <div class="flex items-center gap-2.5">
                {#if pageSize !== -1}
                    <div class="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                        <span>第</span>
                        <input
                            type="number"
                            min="1"
                            max={totalPages}
                            bind:value={jumpPageInput}
                            onkeydown={(e) => e.key === "Enter" && handleJumpPage()}
                            onblur={handleJumpPage}
                            class="w-10 px-1 py-0.2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-center text-xs text-slate-800 dark:text-slate-200 focus:outline-none font-mono"
                        />
                        <span>/ {totalPages} 页</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <button
                            type="button"
                            onclick={() => {
                                currentPage = Math.max(1, currentPage - 1);
                                jumpPageInput = String(currentPage);
                            }}
                            disabled={currentPage === 1}
                            class="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs shadow-2xs"
                            title="上一页"
                            aria-label="上一页"
                        >
                            <ChevronLeft size={13} />
                        </button>
                        <button
                            type="button"
                            onclick={() => {
                                currentPage = Math.min(totalPages, currentPage + 1);
                                jumpPageInput = String(currentPage);
                            }}
                            disabled={currentPage === totalPages}
                            class="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs shadow-2xs"
                            title="下一页"
                            aria-label="下一页"
                        >
                            <ChevronRight size={13} />
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    {/if}

    <!-- Cell Detail Modal on Double Click -->
    {#if inspectedCell}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
            onclick={() => (inspectedCell = null)}
        >
            <div
                class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden"
                onclick={(e) => e.stopPropagation()}
            >
                <div class="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
                    <span class="font-semibold text-xs text-slate-800 dark:text-slate-200 font-mono">
                        {inspectedCell.title}
                    </span>
                    <div class="flex items-center gap-1">
                        <button
                            type="button"
                            onclick={async () => {
                                if (inspectedCell) {
                                    await copyToClipboard(inspectedCell.value);
                                    toastStore.success("已复制内容到剪贴板");
                                }
                            }}
                            class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                            title="复制内容"
                            aria-label="复制单元格内容"
                        >
                            <Copy size={13} />
                        </button>
                        <button
                            type="button"
                            onclick={() => (inspectedCell = null)}
                            class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                            aria-label="关闭详情窗口"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
                <div class="p-4 overflow-auto flex-1 font-mono text-xs bg-slate-50/30 dark:bg-slate-950/30 select-text whitespace-pre-wrap break-all">
                    {inspectedCell.value}
                </div>
            </div>
        </div>
    {/if}
</div>
