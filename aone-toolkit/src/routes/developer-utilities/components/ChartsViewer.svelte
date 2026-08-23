<script lang="ts">
    import { untrack } from "svelte";
    import { Button } from "$lib/components/ui";
    import ToolWorkspace from "$lib/components/layout/ToolWorkspace.svelte";
    import {
        BarChart,
        LineChart,
        PieChart,
        Radar,
        Trash2,
        Download,
        FileText,
        Copy,
        Plus,
        Table,
        Undo,
        Redo,
        Tag,
        Activity,
        TrendingUp,
        ArrowUpDown,
        ArrowUp,
        ArrowDown,
        Filter,
        Palette,
        FileSpreadsheet,
        Sparkles,
        CircleDot,
        Layers,
        Layers3,
        Share2,
        X,
        Check,
        Clipboard,
        ArrowLeftRight,
        SlidersHorizontal,
        Calculator,
        Eye,
        EyeOff,
        Sun,
        Moon,
        Grid as GridIcon,
        Code2,
        Zap,
        AlertCircle
    } from "lucide-svelte";
    import { parseCSVData } from "../../table-editor/lib/parsers";

    interface ParsedDataset {
        rows: Record<string, unknown>[];
        columns: string[];
    }

    interface ChartRowItem {
        label: string;
        values: number[];
        total: number;
        originalIndex: number;
    }

    // Tabs & Grid State
    let activeTab = $state<"grid" | "code">("grid");
    let gridRows = $state<Record<string, any>[]>([]);
    let hiddenIndexes = $state<Set<number>>(new Set());
    let hiddenSeries = $state<Set<string>>(new Set());

    // Mouse coordinates for tooltip
    let mouseX = $state(0);
    let mouseY = $state(0);
    let isHoveringChart = $state(false);

    // Initial data input (Multi-series by default)
    let dataInput = $state(
        '[\n  {"月份": "一月", "营业收入": 420, "净利润": 160},\n  {"月份": "二月", "营业收入": 510, "净利润": 195},\n  {"月份": "三月", "营业收入": 480, "净利润": 180},\n  {"月份": "四月", "营业收入": 640, "净利润": 260},\n  {"月份": "五月", "营业收入": 580, "净利润": 220},\n  {"月份": "六月", "营业收入": 720, "净利润": 310}\n]'
    );
    let chartType = $state<"bar" | "stacked-bar" | "line" | "area" | "combo" | "pie" | "donut" | "radar">("bar");
    let chartTitle = $state("月度运营与盈利综合分析");
    let hoveredIndex = $state<number | null>(null);
    let inputMode = $state<"json" | "csv">("json");
    let svgRef = $state<SVGSVGElement | null>(null);
    let parseError = $state<string | null>(null);
    let parseNotice = $state<string | null>(null);
    let exportNotice = $state<string | null>(null);
    let columns = $state<string[]>([]);
    let numericColumns = $state<string[]>([]);
    let labelColumn = $state("");
    let valueColumn = $state("");
    let activeSeriesIndex = $state<number | "all">("all");
    let donutCenterMode = $state<"sum" | "avg" | "max">("sum");

    // External Data Labels & Analytical Overlays State
    let showDataLabels = $state(true);
    let dataLabelMode = $state<"both" | "value" | "percent">("both");
    let showAvgLine = $state(true);
    let highlightExtremes = $state(false);
    let zeroBasedYAxis = $state(true);
    let gridStyle = $state<"horizontal" | "both" | "none">("horizontal");
    let lineSmoothing = $state(true);

    // Data Operations (Sort & Filter)
    let sortOrder = $state<"none" | "asc" | "desc">("none");
    let filterMode = $state<"all" | "top5" | "top10" | "noZero">("all");

    // Executive Report Card Modal State
    let showReportCardModal = $state(false);
    let reportCardCanvasRef = $state<HTMLDivElement | null>(null);
    let reportSubtitle = $state("全维度关键指标运营洞察速报");
    let reportOrganization = $state("Aone 商业数据智能团队");
    let reportCardTheme = $state<"dark" | "light">("dark");
    let isExportingCard = $state(false);

    // Theme Palettes (Strictly curated modern SaaS gradients & color sets)
    let activeTheme = $state<"emerald" | "sky" | "amber" | "vibrant" | "custom">("emerald");
    let customColors = $state<Record<string, string>>({});

    const colorPalettes = {
        emerald: [
            "#10b981", "#059669", "#34d399", "#047857", "#6ee7b7", 
            "#14b8a6", "#0d9488", "#2dd4bf", "#065f46", "#0f766e"
        ],
        sky: [
            "#0ea5e9", "#0284c7", "#38bdf8", "#0369a1", "#7dd3fc", 
            "#3b82f6", "#2563eb", "#60a5fa", "#1d4ed8", "#075985"
        ],
        amber: [
            "#f59e0b", "#d97706", "#fbbf24", "#b45309", "#fcd34d", 
            "#f97316", "#ea580c", "#fb923c", "#c2410c", "#92400e"
        ],
        vibrant: [
            "#10b981", "#0ea5e9", "#f59e0b", "#ef4444", "#06b6d4", 
            "#14b8a6", "#f97316", "#84cc16", "#3b82f6", "#64748b"
        ]
    };
    
    let themeColors = $derived.by(() => {
        const base = colorPalettes[activeTheme === "custom" ? "emerald" : activeTheme] || colorPalettes.emerald;
        return base.map((c, i) => {
            const sCol = allSeriesColumns[i];
            return (sCol && customColors[sCol]) ? customColors[sCol] : c;
        });
    });

    // Active series columns list (excluding hidden series)
    let allSeriesColumns = $derived.by(() => {
        if (numericColumns.length > 0) return numericColumns;
        if (valueColumn) return [valueColumn];
        return ["value"];
    });

    let seriesColumns = $derived.by(() => {
        return allSeriesColumns.filter(col => !hiddenSeries.has(col));
    });

    function toggleSeriesVisibility(col: string) {
        if (hiddenSeries.has(col)) {
            hiddenSeries.delete(col);
        } else {
            if (hiddenSeries.size < allSeriesColumns.length - 1) {
                hiddenSeries.add(col);
            } else {
                exportNotice = "请至少保留一个可见指标系列。";
                setTimeout(() => { if (exportNotice) exportNotice = null; }, 3000);
            }
        }
    }

    function formatDataLabel(val: number, total: number): string {
        const percent = total > 0 ? ((val / total) * 100).toFixed(1) + "%" : "0%";
        const formattedVal = val.toLocaleString();
        if (dataLabelMode === "value") return formattedVal;
        if (dataLabelMode === "percent") return percent;
        return `${formattedVal} (${percent})`;
    }

    const MAX_RENDERED_POINTS = 500;

    // Client-side pagination state for grid view
    let gridPage = $state(1);
    const gridPageSize = 10;
    let totalGridPages = $derived(Math.ceil(gridRows.length / gridPageSize) || 1);
    let pagedGridRows = $derived(gridRows.slice((gridPage - 1) * gridPageSize, gridPage * gridPageSize));

    // Undo & Redo History State
    let history = $state<string[]>([]);
    let historyIndex = $state(-1);
    let isTrackingHistory = true;

    function saveHistory(value: string) {
        if (!isTrackingHistory) return;
        if (historyIndex < history.length - 1) {
            history = history.slice(0, historyIndex + 1);
        }
        if (history.length > 0 && history[history.length - 1] === value) return;
        history = [...history, value];
        if (history.length > 50) {
            history = history.slice(1);
        }
        historyIndex = history.length - 1;
    }

    function undo() {
        if (historyIndex > 0) {
            isTrackingHistory = false;
            historyIndex--;
            dataInput = history[historyIndex];
            setTimeout(() => {
                isTrackingHistory = true;
            }, 50);
        }
    }

    function redo() {
        if (historyIndex < history.length - 1) {
            isTrackingHistory = false;
            historyIndex++;
            dataInput = history[historyIndex];
            setTimeout(() => {
                isTrackingHistory = true;
            }, 50);
        }
    }

    $effect(() => {
        const val = dataInput;
        untrack(() => {
            if (val !== undefined && val.trim() !== "") {
                saveHistory(val);
            }
        });
    });

    let rawParsedRows = $state<ChartRowItem[]>([]);

    function preferredColumn(options: string[], preferred: string[]) {
        return (
            options.find((column) => preferred.includes(column.toLowerCase())) ??
            options[0] ??
            ""
        );
    }

    function parseData() {
        try {
            exportNotice = null;
            if (!dataInput.trim()) {
                rawParsedRows = [];
                parseError = null;
                parseNotice = "请在左侧贴入 JSON 数组、CSV 或制表符数据以生成图表。";
                columns = [];
                numericColumns = [];
                labelColumn = "";
                valueColumn = "";
                return;
            }

            // Smart delimiter sniffing (Handles TSV / Excel / CSV / JSON)
            const dataset =
                inputMode === "json"
                    ? normalizeObjects(JSON.parse(dataInput))
                    : parseCSV(dataInput);

            columns = dataset.columns;
            if (dataset.rows.length === 0) {
                rawParsedRows = [];
                parseError = "请添加至少一行有效数据。";
                parseNotice = null;
                return;
            }

            if (columns.length < 2) {
                rawParsedRows = [];
                parseError = "数据必须包含至少一列文本标签和一列数值。";
                parseNotice = null;
                return;
            }

            numericColumns = columns.filter((column) =>
                dataset.rows.some((row) => Number.isFinite(Number(row[column]))),
            );

            if (!labelColumn || !columns.includes(labelColumn)) {
                labelColumn = preferredColumn(columns, ["label", "name", "category", "标签", "名称", "类别", "月份", "部门", "季度", "项目", "业务", "迭代", "阶段"]);
            }
            if (!valueColumn || !numericColumns.includes(valueColumn)) {
                valueColumn = preferredColumn(numericColumns, ["value", "amount", "count", "数值", "金额", "数量", "营业收入", "收入", "实际", "Q1预算", "需求完成数"]);
            }

            if (numericColumns.length === 0) {
                rawParsedRows = [];
                parseError = "未找到数值列。请选择或添加包含数字的列。";
                parseNotice = null;
                return;
            }

            const negativeRows: number[] = [];
            const activeCols = allSeriesColumns;

            const nextData = dataset.rows
                .map((row, index) => {
                    const vals: number[] = [];
                    for (const col of activeCols) {
                        const rawV = row[col];
                        if (rawV === null || rawV === "" || rawV === undefined) {
                            vals.push(0);
                        } else {
                            const v = Number(rawV);
                            if (!Number.isFinite(v)) {
                                vals.push(0);
                            } else if (v < 0) {
                                negativeRows.push(index + 1);
                                vals.push(0);
                            } else {
                                vals.push(v);
                            }
                        }
                    }

                    const rowTotal = vals.reduce((a, b) => a + b, 0);
                    return {
                        label: String(row[labelColumn] ?? `项目 ${index + 1}`),
                        values: vals,
                        total: rowTotal,
                        originalIndex: index,
                    };
                })
                .filter((row): row is ChartRowItem => Boolean(row));

            const renderedData = nextData.slice(0, MAX_RENDERED_POINTS);

            if (negativeRows.length > 0) {
                parseNotice = `检测到第 ${negativeRows.slice(0, 3).join(", ")} 行存在负数值，已自动处理为0。`;
            }

            rawParsedRows = renderedData;
            
            // Sync to gridRows if in code view or if grid is empty
            if (activeTab === "code" || gridRows.length === 0) {
                gridRows = dataset.rows.map(row => ({ ...row }));
            }

            parseError = rawParsedRows.length ? null : "所选的数据列中未找到可绘制的数据行。";
            const notices: string[] = [];
            if (nextData.length > renderedData.length) {
                notices.push(`当前数据量较多，图表已限制仅绘制前 ${MAX_RENDERED_POINTS} 行以确保展示清晰。`);
            }
            if (numericColumns.length > 1) {
                notices.push(`已自动识别 ${numericColumns.length} 个指标系列 [${numericColumns.join(", ")}]。`);
            }
            parseNotice = notices.length > 0 ? notices.join(" ") : null;
        } catch (e) {
            rawParsedRows = [];
            parseError = e instanceof Error ? `数据解析失败: ${e.message}` : "数据解析失败，请检查格式。";
            parseNotice = null;
        }
    }

    function normalizeObjects(input: unknown): ParsedDataset {
        if (!Array.isArray(input)) {
            throw new Error("JSON数据必须是对象数组。");
        }

        const rows = input
            .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object" && !Array.isArray(row))
            .map((row) => ({ ...row }));
        if (rows.length === 0) {
            throw new Error("JSON数组必须包含至少一行对象数据。");
        }
        const nextColumns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
        return { rows, columns: nextColumns };
    }

    function parseCSV(rawText: string): ParsedDataset {
        const isTSV = rawText.includes("\t") && !rawText.includes(",");
        const normalized = isTSV ? rawText.replace(/\t/g, ",") : rawText;
        const table = parseCSVData(normalized);
        if (table.length === 0) return { rows: [], columns: [] };
        const nextColumns = table[0].map((header, index) => header.trim() || `列 ${index + 1}`);
        const rows = table.slice(1).map((row) =>
            Object.fromEntries(nextColumns.map((column, index) => [column, row[index] ?? ""])),
        );
        return { rows, columns: nextColumns };
    }

    $effect(() => {
        dataInput;
        inputMode;
        chartType;
        labelColumn;
        valueColumn;
        untrack(() => parseData());
    });

    // Sync from grid table to dataInput string
    function syncGridToInput() {
        hiddenIndexes.clear();
        if (inputMode === "json") {
            dataInput = JSON.stringify(gridRows, null, 2);
        } else {
            const headers = columns.length > 0 ? columns : ["label", "value"];
            const csvLines = [headers.join(",")];
            for (const row of gridRows) {
                csvLines.push(headers.map(h => {
                    const val = String(row[h] ?? "");
                    return val.includes(",") || val.includes("\n") || val.includes('"')
                        ? `"${val.replace(/"/g, '""')}"`
                        : val;
                }).join(","));
            }
            dataInput = csvLines.join("\n");
        }
    }

    // Grid Column Operations: Add Series Column
    function addSeriesColumn() {
        const newColName = `指标 ${numericColumns.length + 1}`;
        columns = [...columns, newColName];
        numericColumns = [...numericColumns, newColName];
        gridRows = gridRows.map(row => ({
            ...row,
            [newColName]: 100
        }));
        syncGridToInput();
    }

    // Grid Column Operations: Delete Series Column
    function deleteSeriesColumn(colName: string) {
        if (numericColumns.length <= 1) {
            exportNotice = "请至少保留一个数值指标列。";
            setTimeout(() => { if (exportNotice) exportNotice = null; }, 3000);
            return;
        }
        columns = columns.filter(c => c !== colName);
        numericColumns = numericColumns.filter(c => c !== colName);
        hiddenSeries.delete(colName);
        delete customColors[colName];
        gridRows = gridRows.map(row => {
            const copy = { ...row };
            delete copy[colName];
            return copy;
        });
        if (valueColumn === colName) {
            valueColumn = numericColumns[0] || "";
        }
        syncGridToInput();
    }

    // Rename Series Column
    function renameSeriesColumn(oldName: string, newName: string) {
        if (!newName.trim() || oldName === newName) return;
        const cleanName = newName.trim();
        columns = columns.map(c => c === oldName ? cleanName : c);
        numericColumns = numericColumns.map(c => c === oldName ? cleanName : c);
        if (labelColumn === oldName) labelColumn = cleanName;
        if (valueColumn === oldName) valueColumn = cleanName;
        if (customColors[oldName]) {
            customColors[cleanName] = customColors[oldName];
            delete customColors[oldName];
        }
        gridRows = gridRows.map(row => {
            const copy: Record<string, any> = {};
            for (const key of Object.keys(row)) {
                copy[key === oldName ? cleanName : key] = row[key];
            }
            return copy;
        });
        syncGridToInput();
    }

    // Add Grid Row
    function addGridRow() {
        const newRow: Record<string, any> = {};
        const cols = columns.length > 0 ? columns : ["label", "value"];
        cols.forEach(col => {
            if (col === labelColumn || col.toLowerCase().includes("label") || col.toLowerCase().includes("name") || col.includes("标签") || col.includes("名称") || col.includes("月份") || col.includes("部门")) {
                newRow[col] = `新项目 ${gridRows.length + 1}`;
            } else if (numericColumns.includes(col)) {
                newRow[col] = 100;
            } else {
                newRow[col] = "";
            }
        });
        gridRows = [...gridRows, newRow];
        gridPage = Math.ceil(gridRows.length / gridPageSize);
        syncGridToInput();
    }

    // Delete Grid Row
    function deleteGridRow(pageIndex: number) {
        const actualIndex = (gridPage - 1) * gridPageSize + pageIndex;
        gridRows = gridRows.filter((_, i) => i !== actualIndex);
        if (gridPage > Math.ceil(gridRows.length / gridPageSize) && gridPage > 1) {
            gridPage = Math.ceil(gridRows.length / gridPageSize);
        }
        syncGridToInput();
    }

    // Clear All Data
    function clearGridData() {
        gridRows = [];
        dataInput = "";
        rawParsedRows = [];
        columns = [];
        numericColumns = [];
        labelColumn = "";
        valueColumn = "";
        hiddenIndexes.clear();
        hiddenSeries.clear();
        gridPage = 1;
    }

    // Paste From Clipboard (Excel / Feishu / TSV / CSV)
    async function pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            if (!text.trim()) {
                exportNotice = "剪贴板内容为空。";
                return;
            }
            if (text.startsWith("[") || text.startsWith("{")) {
                inputMode = "json";
                dataInput = text;
            } else {
                inputMode = "csv";
                dataInput = text;
            }
            parseData();
            exportNotice = "已从剪贴板成功识别并导入数据。";
            setTimeout(() => { if (exportNotice?.startsWith("已从剪贴板")) exportNotice = null; }, 3000);
        } catch {
            exportNotice = "无法读取剪贴板，请检查浏览器权限。";
        }
    }

    // Pivot / Transpose Rows & Columns
    function transposeData() {
        if (gridRows.length === 0 || columns.length < 2) return;
        try {
            const oldLabelCol = labelColumn || columns[0];
            const oldMetricCols = numericColumns.length > 0 ? numericColumns : columns.filter(c => c !== oldLabelCol);
            
            const seenColNames = new Set<string>(["项目"]);
            const colNameMap: string[] = [];

            gridRows.forEach((r, idx) => {
                let baseName = String(r[oldLabelCol] ?? `行${idx + 1}`).trim() || `行${idx + 1}`;
                let uniqueName = baseName;
                let counter = 1;
                while (seenColNames.has(uniqueName)) {
                    uniqueName = `${baseName}_${counter++}`;
                }
                seenColNames.add(uniqueName);
                colNameMap.push(uniqueName);
            });

            const newColumns = ["项目", ...colNameMap];
            const newRows: Record<string, any>[] = [];

            for (const mCol of oldMetricCols) {
                const rowObj: Record<string, any> = { "项目": mCol };
                gridRows.forEach((r, idx) => {
                    const mappedCol = colNameMap[idx];
                    rowObj[mappedCol] = Number(r[mCol]) || 0;
                });
                newRows.push(rowObj);
            }

            labelColumn = "项目";
            columns = newColumns;
            numericColumns = newColumns.slice(1);
            valueColumn = numericColumns[0] || "";
            gridRows = newRows;
            syncGridToInput();
            exportNotice = "已完成行列转置 (Pivot/Transpose)。";
            setTimeout(() => { if (exportNotice?.startsWith("已完成")) exportNotice = null; }, 3000);
        } catch {
            exportNotice = "行列转置失败。";
        }
    }

    // Batch Compute Numeric Operations
    function batchCompute(operation: "mul10" | "div1000" | "round") {
        if (gridRows.length === 0) return;
        gridRows = gridRows.map(row => {
            const updated = { ...row };
            for (const col of numericColumns) {
                const cur = Number(updated[col]) || 0;
                if (operation === "mul10") updated[col] = cur * 10;
                if (operation === "div1000") updated[col] = Math.round((cur / 1000) * 100) / 100;
                if (operation === "round") updated[col] = Math.round(cur);
            }
            return updated;
        });
        syncGridToInput();
        exportNotice = `已执行批量计算: ${operation === 'mul10' ? '× 10' : operation === 'div1000' ? '÷ 1000' : '四舍五入'}`;
        setTimeout(() => { if (exportNotice?.startsWith("已执行")) exportNotice = null; }, 3000);
    }

    // Preset loader with rich multi-series examples
    function loadPreset(presetName: string) {
        if (!presetName) return;
        exportNotice = null;
        hiddenIndexes.clear();
        hiddenSeries.clear();
        let presetData: any[] = [];
        if (presetName === "monthly") {
            chartTitle = "月度运营与盈利综合分析";
            presetData = [
                { "月份": "一月", "营业收入": 420, "净利润": 160 },
                { "月份": "二月", "营业收入": 510, "净利润": 195 },
                { "月份": "三月", "营业收入": 480, "净利润": 180 },
                { "月份": "四月", "营业收入": 640, "净利润": 260 },
                { "月份": "五月", "营业收入": 580, "净利润": 220 },
                { "月份": "六月", "营业收入": 720, "净利润": 310 }
            ];
            labelColumn = "月份";
            valueColumn = "营业收入";
            columns = ["月份", "营业收入", "净利润"];
            numericColumns = ["营业收入", "净利润"];
        } else if (presetName === "resources") {
            chartTitle = "业务线双季度预算分配";
            presetData = [
                { "部门": "研发工程", "Q1预算": 55, "Q2预算": 68 },
                { "部门": "市场推广", "Q1预算": 28, "Q2预算": 35 },
                { "部门": "产品设计", "Q1预算": 18, "Q2预算": 22 },
                { "部门": "运营增长", "Q1预算": 24, "Q2预算": 30 },
                { "部门": "行政开销", "Q1预算": 12, "Q2预算": 14 }
            ];
            labelColumn = "部门";
            valueColumn = "Q1预算";
            columns = ["部门", "Q1预算", "Q2预算"];
            numericColumns = ["Q1预算", "Q2预算"];
        } else if (presetName === "dev_perf") {
            chartTitle = "研发团队效能产出综合看板";
            presetData = [
                { "迭代": "Sprint 1", "需求完成数": 38, "代码提交量": 145, "缺陷修复数": 22 },
                { "迭代": "Sprint 2", "需求完成数": 44, "代码提交量": 168, "缺陷修复数": 18 },
                { "迭代": "Sprint 3", "需求完成数": 52, "代码提交量": 190, "缺陷修复数": 25 },
                { "迭代": "Sprint 4", "需求完成数": 60, "代码提交量": 220, "缺陷修复数": 14 }
            ];
            labelColumn = "迭代";
            valueColumn = "需求完成数";
            columns = ["迭代", "需求完成数", "代码提交量", "缺陷修复数"];
            numericColumns = ["需求完成数", "代码提交量", "缺陷修复数"];
        } else if (presetName === "saas") {
            chartTitle = "SaaS 核心营运与获客分析";
            presetData = [
                { "季度": "24Q1", "ARR收入": 120, "获客成本": 35, "客户流失率": 4 },
                { "季度": "24Q2", "ARR收入": 165, "获客成本": 42, "客户流失率": 3 },
                { "季度": "24Q3", "ARR收入": 210, "获客成本": 48, "客户流失率": 3 },
                { "季度": "24Q4", "ARR收入": 290, "获客成本": 55, "客户流失率": 2 }
            ];
            labelColumn = "季度";
            valueColumn = "ARR收入";
            columns = ["季度", "ARR收入", "获客成本", "客户流失率"];
            numericColumns = ["ARR收入", "获客成本", "客户流失率"];
        } else if (presetName === "browsers") {
            chartTitle = "全球浏览器市场份额";
            presetData = [
                { "浏览器": "Chrome", "市场份额": 65 },
                { "浏览器": "Safari", "市场份额": 18 },
                { "浏览器": "Edge", "市场份额": 5 },
                { "浏览器": "Firefox", "市场份额": 3 },
                { "浏览器": "其他", "市场份额": 9 }
            ];
            labelColumn = "浏览器";
            valueColumn = "市场份额";
            columns = ["浏览器", "市场份额"];
            numericColumns = ["市场份额"];
        }

        if (inputMode === "json") {
            dataInput = JSON.stringify(presetData, null, 2);
        } else {
            const hdrs = columns;
            dataInput = hdrs.join(",") + "\n" + presetData.map(d => hdrs.map(h => d[h]).join(",")).join("\n");
        }
        gridRows = presetData;
        gridPage = 1;
    }

    function switchInputMode(mode: "json" | "csv") {
        if (inputMode === mode) return;
        inputMode = mode;
        parseError = null;
        parseNotice = null;
        exportNotice = null;
        hiddenIndexes.clear();
        gridPage = 1;
        if (mode === "csv" && dataInput.startsWith("[")) {
            try {
                const data = normalizeObjects(JSON.parse(dataInput)).rows;
                const hdrs = columns.length > 0 ? columns : Object.keys(data[0] || {});
                dataInput = hdrs.join(",") + "\n" + data.map(r => hdrs.map(h => String(r[h] ?? "").replace(/,/g, " ")).join(",")).join("\n");
            } catch {
                dataInput = "项目,数值1,数值2\n项目A,45,20\n项目B,52,28\n项目C,38,18";
                parseNotice = "无法直接转换当前 JSON，已加载 CSV 格式示例。";
            }
        } else if (mode === "json" && !dataInput.startsWith("[")) {
            try {
                const dataset = parseCSV(dataInput);
                dataInput = JSON.stringify(dataset.rows, null, 2);
            } catch {
                dataInput = JSON.stringify(
                    [
                        { "项目": "项目A", "数值1": 45, "数值2": 20 },
                        { "项目": "项目B", "数值1": 52, "数值2": 28 },
                        { "项目": "项目C", "数值1": 38, "数值2": 18 },
                    ],
                    null,
                    2,
                );
                parseNotice = "无法直接转换当前 CSV，已加载 JSON 格式示例。";
            }
        }
    }

    // Toggle legend item visibility
    function toggleLegendItem(originalIndex: number) {
        if (hiddenIndexes.has(originalIndex)) {
            hiddenIndexes.delete(originalIndex);
        } else {
            if (hiddenIndexes.size < rawParsedRows.length - 1) {
                hiddenIndexes.add(originalIndex);
            } else {
                exportNotice = "请至少保留一个可见的数据项。";
                setTimeout(() => {
                    if (exportNotice === "请至少保留一个可见的数据项。") exportNotice = null;
                }, 3000);
            }
        }
    }

    function truncateLabel(label: string, limit = 12) {
        return label.length > limit ? label.substring(0, limit) + "..." : label;
    }

    // Filter & Sort Pipeline
    let activeChartData = $derived.by(() => {
        let items = rawParsedRows.filter(({ originalIndex }) => !hiddenIndexes.has(originalIndex));

        // Filter Mode
        if (filterMode === "noZero") {
            items = items.filter((d) => d.total > 0);
        } else if (filterMode === "top5") {
            items = [...items].sort((a, b) => b.total - a.total).slice(0, 5);
        } else if (filterMode === "top10") {
            items = [...items].sort((a, b) => b.total - a.total).slice(0, 10);
        }

        // Sort Order
        if (sortOrder === "asc") {
            items.sort((a, b) => a.total - b.total);
        } else if (sortOrder === "desc") {
            items.sort((a, b) => b.total - a.total);
        }

        return items;
    });

    // Calculations for dynamic scales
    let maxSingleVal = $derived.by(() => {
        if (activeChartData.length === 0) return 1;
        let m = 1;
        for (const row of activeChartData) {
            for (let i = 0; i < allSeriesColumns.length; i++) {
                if (!hiddenSeries.has(allSeriesColumns[i])) {
                    const v = row.values[i] ?? 0;
                    if (v > m) m = v;
                }
            }
        }
        return m;
    });

    let minSingleVal = $derived.by(() => {
        if (activeChartData.length === 0) return 0;
        let m = Infinity;
        for (const row of activeChartData) {
            for (let i = 0; i < allSeriesColumns.length; i++) {
                if (!hiddenSeries.has(allSeriesColumns[i])) {
                    const v = row.values[i] ?? 0;
                    if (v < m) m = v;
                }
            }
        }
        return m === Infinity ? 0 : m;
    });

    let maxStackedVal = $derived.by(() => {
        if (activeChartData.length === 0) return 1;
        return Math.max(...activeChartData.map(d => {
            return d.values.reduce((sum, v, idx) => {
                return sum + (!hiddenSeries.has(allSeriesColumns[idx]) ? v : 0);
            }, 0);
        }), 1);
    });

    let yAxisMin = $derived(zeroBasedYAxis ? 0 : Math.max(0, Math.floor(minSingleVal * 0.9)));
    let maxVal = $derived(chartType === "stacked-bar" ? maxStackedVal : maxSingleVal);
    let valRange = $derived(Math.max(1, maxVal - yAxisMin));

    let totalVal = $derived(activeChartData.reduce((sum, d) => sum + d.total, 0));
    let avgVal = $derived(activeChartData.length > 0 ? totalVal / (activeChartData.length * (seriesColumns.length || 1)) : 0);
    let avgY = $derived(170 - ((avgVal - yAxisMin) / valRange) * 140);

    // Outlier Detection (Flag rows where max value is > 3.5 * average)
    let outlierNotice = $derived.by(() => {
        if (activeChartData.length < 3 || avgVal <= 0) return null;
        const outlier = activeChartData.find(d => Math.max(...d.values) > avgVal * 3.5);
        if (outlier) {
            return `提示：检测到「${outlier.label}」数值明显偏高，可能属于极值离群项。`;
        }
        return null;
    });

    let yAxisLabels = $derived.by(() => {
        const labels = [];
        const step = valRange / 4;
        for (let i = 0; i <= 4; i++) {
            labels.push(Math.round(yAxisMin + step * i));
        }
        return labels;
    });

    // Dynamic X label rotation & SVG viewport width
    let shouldRotateLabels = $derived.by(() => {
        if (chartType === "pie" || chartType === "donut" || chartType === "radar") return false;
        const avgLen = activeChartData.reduce((sum, d) => sum + d.label.length, 0) / (activeChartData.length || 1);
        return activeChartData.length > 6 || avgLen > 4;
    });

    let svgViewWidth = $derived.by(() => {
        if (chartType === "pie" || chartType === "donut" || chartType === "radar") {
            return 460;
        }
        const baseWidth = Math.max(420, 70 + activeChartData.length * (seriesColumns.length > 1 ? 52 : 40));
        return baseWidth;
    });

    function getPieSlicePath(startAngle: number, endAngle: number, cx: number, cy: number, r: number): string {
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
        return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    }

    function getDonutSlicePath(startAngle: number, endAngle: number, cx: number, cy: number, innerR: number, outerR: number): string {
        const x1 = cx + outerR * Math.cos(startAngle);
        const y1 = cy + outerR * Math.sin(startAngle);
        const x2 = cx + outerR * Math.cos(endAngle);
        const y2 = cy + outerR * Math.sin(endAngle);
        const x3 = cx + innerR * Math.cos(endAngle);
        const y3 = cy + innerR * Math.sin(endAngle);
        const x4 = cx + innerR * Math.cos(startAngle);
        const y4 = cy + innerR * Math.sin(startAngle);
        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
        return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
    }

    function createSmoothCurvePath(points: { x: number; y: number }[]): string {
        if (points.length === 0) return "";
        if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
        if (points.length === 2 || !lineSmoothing) {
            return points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        }
        
        let path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i === 0 ? 0 : i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2 >= points.length ? points.length - 1 : i + 2];
            
            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;
            
            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
        }
        return path;
    }

    let summaryStats = $derived.by(() => {
        if (activeChartData.length === 0) return null;
        const allVals = activeChartData.flatMap(d => d.values);
        const sum = allVals.reduce((a, b) => a + b, 0);
        const avg = sum / (allVals.length || 1);
        const max = Math.max(...allVals);
        const min = Math.min(...allVals);
        const topRow = [...activeChartData].sort((a, b) => b.total - a.total)[0];

        return {
            count: activeChartData.length,
            seriesCount: seriesColumns.length,
            sum,
            avg: avg % 1 === 0 ? avg.toString() : avg.toFixed(1),
            max,
            min,
            topItem: topRow ? `${topRow.label} (${topRow.total.toLocaleString()})` : "无",
        };
    });

    // Donut Center Readout Value & Title
    let donutCenterValue = $derived.by(() => {
        if (!summaryStats) return "";
        if (donutCenterMode === "avg") return summaryStats.avg;
        if (donutCenterMode === "max") return summaryStats.max.toLocaleString();
        return summaryStats.sum.toLocaleString();
    });

    let donutCenterTitle = $derived.by(() => {
        if (donutCenterMode === "avg") return "均值 AVG";
        if (donutCenterMode === "max") return "峰值 MAX";
        return "总计 SUM";
    });

    function cycleDonutCenterMode() {
        if (donutCenterMode === "sum") donutCenterMode = "avg";
        else if (donutCenterMode === "avg") donutCenterMode = "max";
        else donutCenterMode = "sum";
    }

    // Pie & Donut slices calculation (Single series or Total aggregated)
    let pieSlices = $derived.by(() => {
        if (activeChartData.length === 0) return [];
        const cx = svgViewWidth / 2;
        const cy = 100;
        const r = 58;

        const effectiveValues = activeChartData.map(d => {
            if (activeSeriesIndex === "all") return d.total;
            return d.values[activeSeriesIndex] ?? d.total;
        });
        const currentSum = effectiveValues.reduce((a, b) => a + b, 0) || 1;

        let currentAngle = -Math.PI / 2;
        return activeChartData.map((d, idx) => {
            const val = effectiveValues[idx];
            const sliceAngle = (val / currentSum) * 2 * Math.PI;
            const startAngle = currentAngle;
            const endAngle = currentAngle + sliceAngle;
            const midAngle = (startAngle + endAngle) / 2;
            currentAngle = endAngle;

            const rInner = r + 2;
            const rOuter = r + 14;
            const x1 = cx + rInner * Math.cos(midAngle);
            const y1 = cy + rInner * Math.sin(midAngle);
            const x2 = cx + rOuter * Math.cos(midAngle);
            const y2 = cy + rOuter * Math.sin(midAngle);
            const isRight = Math.cos(midAngle) >= 0;
            const x3 = x2 + (isRight ? 10 : -10);
            const y3 = y2;
            const labelX = x3 + (isRight ? 3 : -3);
            const labelY = y3;
            const textAnchor = isRight ? "start" : "end";

            return {
                path: getPieSlicePath(startAngle, endAngle, cx, cy, r),
                donutPath: getDonutSlicePath(startAngle, endAngle, cx, cy, 32, r),
                color: themeColors[idx % themeColors.length],
                label: d.label,
                value: val,
                originalIndex: d.originalIndex,
                percentage: ((val / currentSum) * 100).toFixed(1),
                x1, y1, x2, y2, x3, y3,
                labelX, labelY, textAnchor
            };
        });
    });

    // Radar Chart Derived logic
    let radarGridPaths = $derived.by(() => {
        const levels = [0.2, 0.4, 0.6, 0.8, 1];
        const count = activeChartData.length || 1;
        const angleStep = (Math.PI * 2) / count;
        const cx = svgViewWidth / 2;
        const cy = 100;
        return levels.map((level) => {
            return (
                activeChartData
                    .map((_, idx) => {
                        const r = 68 * level;
                        const angle = idx * angleStep - Math.PI / 2;
                        const x = cx + r * Math.cos(angle);
                        const y = cy + r * Math.sin(angle);
                        return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                    })
                    .join(" ") + " Z"
            );
        });
    });

    let radarAxes = $derived.by(() => {
        const count = activeChartData.length || 1;
        const angleStep = (Math.PI * 2) / count;
        const cx = svgViewWidth / 2;
        const cy = 100;
        return activeChartData.map((_, idx) => {
            const angle = idx * angleStep - Math.PI / 2;
            return {
                x1: cx, y1: cy,
                x2: cx + 68 * Math.cos(angle),
                y2: cy + 68 * Math.sin(angle),
            };
        });
    });

    let radarSeriesData = $derived.by(() => {
        if (activeChartData.length === 0) return [];
        const count = activeChartData.length;
        const angleStep = (Math.PI * 2) / count;
        const cx = svgViewWidth / 2;
        const cy = 100;

        return seriesColumns.map((colName, sIdx) => {
            const originalColIdx = allSeriesColumns.indexOf(colName);
            const points = activeChartData.map((d, idx) => {
                const val = d.values[originalColIdx] ?? 0;
                const r = (val / maxVal) * 68;
                const angle = idx * angleStep - Math.PI / 2;
                const ptX = cx + r * Math.cos(angle);
                const ptY = cy + r * Math.sin(angle);
                const labelX = cx + (Math.max(r, 18) + 10) * Math.cos(angle);
                const labelY = cy + (Math.max(r, 18) + 10) * Math.sin(angle);
                let textAnchor = "middle";
                if (labelX < cx - 8) textAnchor = "end";
                if (labelX > cx + 8) textAnchor = "start";

                return {
                    cx: ptX, cy: ptY,
                    labelX, labelY, textAnchor,
                    value: val,
                    label: d.label,
                    originalIndex: d.originalIndex,
                };
            });

            const path = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.cx} ${p.cy}`).join(" ") + " Z";
            return {
                name: colName,
                color: themeColors[sIdx % themeColors.length],
                path,
                points,
            };
        });
    });

    let radarLabels = $derived.by(() => {
        const count = activeChartData.length || 1;
        const angleStep = (Math.PI * 2) / count;
        const cx = svgViewWidth / 2;
        const cy = 100;
        return activeChartData.map((d, idx) => {
            const angle = idx * angleStep - Math.PI / 2;
            const x = cx + 84 * Math.cos(angle);
            const y = cy + 84 * Math.sin(angle);
            let textAnchor = "middle";
            if (x < cx - 8) textAnchor = "end";
            if (x > cx + 8) textAnchor = "start";
            return { x, y, label: d.label, textAnchor };
        });
    });

    function handleMouseMove(e: MouseEvent) {
        const target = e.currentTarget as HTMLElement;
        if (!target) return;
        const rect = target.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    }

    function copyMarkdownTable() {
        if (activeChartData.length === 0) {
            exportNotice = "暂无有效数据可供复制。";
            return;
        }
        let md = `| ${labelColumn || '项目'} | ${seriesColumns.join(' | ')} | **合计** |\n`;
        md += `| :--- | ${seriesColumns.map(() => ':---').join(' | ')} | :--- |\n`;
        activeChartData.forEach((d) => {
            md += `| ${d.label} | ${seriesColumns.map(col => {
                const sIdx = allSeriesColumns.indexOf(col);
                return (d.values[sIdx] ?? 0).toLocaleString();
            }).join(' | ')} | **${d.total.toLocaleString()}** |\n`;
        });
        if (summaryStats) {
            md += `| **总计** | ${seriesColumns.map(col => {
                const sIdx = allSeriesColumns.indexOf(col);
                const sSum = activeChartData.reduce((acc, row) => acc + (row.values[sIdx] || 0), 0);
                return `**${sSum.toLocaleString()}**`;
            }).join(' | ')} | **${summaryStats.sum.toLocaleString()}** |\n`;
        }
        try {
            navigator.clipboard.writeText(md).then(() => {
                exportNotice = "Markdown 格式多维报告表格已复制到剪贴板。";
                setTimeout(() => {
                    if (exportNotice?.startsWith("Markdown")) exportNotice = null;
                }, 3000);
            });
        } catch {
            exportNotice = "复制 Markdown 表格失败，请检查剪贴板权限。";
        }
    }

    function downloadJSON() {
        if (gridRows.length === 0) {
            exportNotice = "暂无可导出的数据。请先在左侧网格添加数据。";
            return;
        }
        try {
            const dataStr = JSON.stringify(gridRows, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${(chartTitle || "数据图表").replace(/\s+/g, "_")}.json`;
            a.click();
            URL.revokeObjectURL(url);
            exportNotice = "已成功导出 JSON 数据。";
        } catch {
            exportNotice = "导出 JSON 失败。";
        }
    }

    function downloadCSV() {
        if (gridRows.length === 0) {
            exportNotice = "暂无可导出的数据。请先在左侧网格添加数据。";
            return;
        }
        try {
            const headers = columns.length > 0 ? columns : ["label", "value"];
            const csvLines = [headers.join(",")];
            for (const row of gridRows) {
                csvLines.push(headers.map(h => {
                    const val = String(row[h] ?? "");
                    return val.includes(",") || val.includes("\n") || val.includes('"')
                        ? `"${val.replace(/"/g, '""')}"`
                        : val;
                }).join(","));
            }
            const csvStr = csvLines.join("\n");
            const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${(chartTitle || "数据图表").replace(/\s+/g, "_")}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            exportNotice = "已成功导出 CSV 数据。";
        } catch {
            exportNotice = "导出 CSV 失败。";
        }
    }

    function downloadSVG() {
        if (!svgRef || activeChartData.length === 0) {
            exportNotice = "暂无可导出的图表。请先输入有效数据。";
            return;
        }
        const svgData = new XMLSerializer().serializeToString(svgRef);
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(chartTitle || "未命名图表").replace(/\s+/g, "_")}.svg`;
        a.click();
        URL.revokeObjectURL(url);
        exportNotice = "已成功导出 SVG 文件。";
    }

    function downloadPNG() {
        if (!svgRef || activeChartData.length === 0) {
            exportNotice = "暂无可导出的图表。请先输入有效数据。";
            return;
        }
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const svgData = new XMLSerializer().serializeToString(svgRef);
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
            const scale = 2;
            const targetWidth = Math.max(800, svgViewWidth * scale);
            const targetHeight = 220 * scale;
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            ctx!.fillStyle = "#ffffff";
            ctx!.fillRect(0, 0, canvas.width, canvas.height);
            ctx!.drawImage(img, 0, 0, targetWidth, targetHeight);
            const pngUrl = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = pngUrl;
            a.download = `${(chartTitle || "未命名图表").replace(/\s+/g, "_")}.png`;
            a.click();
            URL.revokeObjectURL(url);
            exportNotice = "已成功导出 PNG 图片。";
        };
        img.src = url;
    }

    function copySVG() {
        if (!svgRef || activeChartData.length === 0) {
            exportNotice = "暂无可导出的图表。请先输入有效数据。";
            return;
        }
        try {
            const svgData = new XMLSerializer().serializeToString(svgRef);
            navigator.clipboard.writeText(svgData).then(() => {
                exportNotice = "SVG 代码已复制到剪贴板。";
                setTimeout(() => {
                    if (exportNotice === "SVG 代码已复制到剪贴板。") {
                        exportNotice = null;
                    }
                }, 3000);
            });
        } catch {
            exportNotice = "复制 SVG 代码失败。";
        }
    }

    // Download Standalone Interactive HTML Document
    function downloadInteractiveHTML() {
        if (!svgRef || activeChartData.length === 0) return;
        try {
            const svgHTML = new XMLSerializer().serializeToString(svgRef);
            const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${chartTitle || "数据图表"} - Aone Data Insights</title>
  <style>
    body { margin: 0; padding: 40px; background: #0f172a; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; max-width: 900px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    h1 { margin: 0 0 4px 0; font-size: 20px; font-weight: 700; color: #fff; }
    .sub { font-size: 12px; color: #94a3b8; margin-bottom: 20px; }
    svg { width: 100%; height: auto; }
    .footer { margin-top: 20px; font-size: 11px; color: #64748b; border-top: 1px solid #334155; padding-top: 12px; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${chartTitle || "数据图表"}</h1>
    <div class="sub">${reportSubtitle} • ${reportOrganization} • ${new Date().toLocaleDateString()}</div>
    ${svgHTML}
    <div class="footer">
      <span>Aone Toolkit Data Insights Interactive Export</span>
      <span>Total: ${totalVal.toLocaleString()}</span>
    </div>
  </div>
</body>
</html>`;
            const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${(chartTitle || "交互式图表").replace(/\s+/g, "_")}.html`;
            a.click();
            URL.revokeObjectURL(url);
            exportNotice = "已成功导出离线交互式 HTML 文件。";
            setTimeout(() => { if (exportNotice?.startsWith("已成功")) exportNotice = null; }, 3000);
        } catch {
            exportNotice = "导出 HTML 失败。";
        }
    }

    // Export Executive Report Card to PNG (Canvas 2x)
    function exportReportCardPNG() {
        if (!reportCardCanvasRef) return;
        isExportingCard = true;
        try {
            const svgEl = reportCardCanvasRef.querySelector("svg");
            if (!svgEl) return;
            const svgData = new XMLSerializer().serializeToString(svgEl);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const scale = 2;
            canvas.width = 960 * scale;
            canvas.height = 540 * scale;

            if (ctx) {
                const isLight = reportCardTheme === "light";
                const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                if (isLight) {
                    grad.addColorStop(0, "#f8fafc");
                    grad.addColorStop(1, "#e2e8f0");
                } else {
                    grad.addColorStop(0, "#0f172a");
                    grad.addColorStop(1, "#1e293b");
                }
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = isLight ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.05)";
                ctx.roundRect(40 * scale, 30 * scale, 880 * scale, 480 * scale, 16 * scale);
                ctx.fill();
                ctx.strokeStyle = isLight ? "rgba(203, 213, 225, 0.8)" : "rgba(255, 255, 255, 0.15)";
                ctx.lineWidth = 1.5 * scale;
                ctx.stroke();

                ctx.fillStyle = isLight ? "#0f172a" : "#ffffff";
                ctx.font = `bold ${18 * scale}px sans-serif`;
                ctx.fillText(chartTitle || "数据图表洞察简报", 60 * scale, 70 * scale);

                ctx.fillStyle = isLight ? "#64748b" : "#94a3b8";
                ctx.font = `${10 * scale}px sans-serif`;
                ctx.fillText(`${reportSubtitle} • ${reportOrganization} • 生成时间: ${new Date().toLocaleDateString()}`, 60 * scale, 92 * scale);

                const img = new Image();
                const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
                const url = URL.createObjectURL(svgBlob);
                img.onload = () => {
                    ctx.drawImage(img, 60 * scale, 110 * scale, 840 * scale, 300 * scale);
                    URL.revokeObjectURL(url);

                    if (summaryStats) {
                        ctx.fillStyle = isLight ? "#0284c7" : "#38bdf8";
                        ctx.font = `bold ${11 * scale}px monospace`;
                        ctx.fillText(`总计: ${summaryStats.sum.toLocaleString()}   均值: ${summaryStats.avg}   领跑项: ${summaryStats.topItem}`, 60 * scale, 465 * scale);
                    }

                    ctx.fillStyle = isLight ? "#94a3b8" : "#64748b";
                    ctx.font = `${9 * scale}px sans-serif`;
                    ctx.fillText(`Generated by ${reportOrganization} • Aone Data Insights`, 650 * scale, 490 * scale);

                    const pngUrl = canvas.toDataURL("image/png");
                    const a = document.createElement("a");
                    a.href = pngUrl;
                    a.download = `${(chartTitle || "汇报卡片").replace(/\s+/g, "_")}_分享卡.png`;
                    a.click();
                    isExportingCard = false;
                    exportNotice = "已成功生成并下载汇报分享卡。";
                };
                img.src = url;
            }
        } catch {
            isExportingCard = false;
            exportNotice = "生成汇报分享卡失败。";
        }
    }

    // Copy Executive Report Card Image to System Clipboard
    async function copyReportCardImage() {
        if (!reportCardCanvasRef) return;
        isExportingCard = true;
        try {
            const svgEl = reportCardCanvasRef.querySelector("svg");
            if (!svgEl) return;
            const svgData = new XMLSerializer().serializeToString(svgEl);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const scale = 2;
            canvas.width = 960 * scale;
            canvas.height = 540 * scale;

            if (ctx) {
                const isLight = reportCardTheme === "light";
                const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                if (isLight) {
                    grad.addColorStop(0, "#f8fafc");
                    grad.addColorStop(1, "#e2e8f0");
                } else {
                    grad.addColorStop(0, "#0f172a");
                    grad.addColorStop(1, "#1e293b");
                }
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = isLight ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.05)";
                ctx.roundRect(40 * scale, 30 * scale, 880 * scale, 480 * scale, 16 * scale);
                ctx.fill();
                ctx.strokeStyle = isLight ? "rgba(203, 213, 225, 0.8)" : "rgba(255, 255, 255, 0.15)";
                ctx.lineWidth = 1.5 * scale;
                ctx.stroke();

                ctx.fillStyle = isLight ? "#0f172a" : "#ffffff";
                ctx.font = `bold ${18 * scale}px sans-serif`;
                ctx.fillText(chartTitle || "数据图表洞察简报", 60 * scale, 70 * scale);

                ctx.fillStyle = isLight ? "#64748b" : "#94a3b8";
                ctx.font = `${10 * scale}px sans-serif`;
                ctx.fillText(`${reportSubtitle} • ${reportOrganization} • 生成时间: ${new Date().toLocaleDateString()}`, 60 * scale, 92 * scale);

                const img = new Image();
                const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
                const url = URL.createObjectURL(svgBlob);
                img.onload = () => {
                    ctx.drawImage(img, 60 * scale, 110 * scale, 840 * scale, 300 * scale);
                    URL.revokeObjectURL(url);

                    if (summaryStats) {
                        ctx.fillStyle = isLight ? "#0284c7" : "#38bdf8";
                        ctx.font = `bold ${11 * scale}px monospace`;
                        ctx.fillText(`总计: ${summaryStats.sum.toLocaleString()}   均值: ${summaryStats.avg}   领跑项: ${summaryStats.topItem}`, 60 * scale, 465 * scale);
                    }

                    ctx.fillStyle = isLight ? "#94a3b8" : "#64748b";
                    ctx.font = `${9 * scale}px sans-serif`;
                    ctx.fillText(`Generated by ${reportOrganization} • Aone Data Insights`, 650 * scale, 490 * scale);

                    canvas.toBlob(async (blob) => {
                        if (blob && navigator.clipboard && (window as any).ClipboardItem) {
                            await navigator.clipboard.write([
                                new (window as any).ClipboardItem({ "image/png": blob })
                            ]);
                            exportNotice = "汇报卡片图片已复制到剪贴板，可直接在微信/飞书/PPT 中粘贴。";
                        } else {
                            exportNotice = "您的浏览器暂不支持直接复制图片，请使用「下载高清卡片」。";
                        }
                        isExportingCard = false;
                        setTimeout(() => { if (exportNotice?.startsWith("汇报卡片图片")) exportNotice = null; }, 3000);
                    }, "image/png");
                };
                img.src = url;
            }
        } catch {
            isExportingCard = false;
            exportNotice = "复制汇报卡片图片失败。";
        }
    }
</script>

<svelte:head>
    <title>数据图表工作区 - Aone Toolkit</title>
</svelte:head>

<div class="h-full flex-1 flex flex-col bg-slate-100 dark:bg-slate-950 p-2 gap-2 overflow-hidden">
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 h-full w-full min-h-0">
        <!-- Input Section (Left Panel) -->
        <div class="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full shadow-xs min-h-0">
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center gap-2 shrink-0 text-xs">
                <div class="flex items-center gap-2">
                    <div class="flex p-0.5 bg-slate-200/70 dark:bg-slate-800 rounded-md">
                        <button
                            class="px-2 py-0.5 text-xs font-semibold rounded-sm transition-all flex items-center gap-1 {activeTab === 'grid' ? 'bg-white dark:bg-slate-900 shadow-2xs text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                            onclick={() => (activeTab = 'grid')}
                        >
                            <Table size={12} /> 网格
                        </button>
                        <button
                            class="px-2 py-0.5 text-xs font-semibold rounded-sm transition-all flex items-center gap-1 {activeTab === 'code' ? 'bg-white dark:bg-slate-900 shadow-2xs text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                            onclick={() => (activeTab = 'code')}
                        >
                            <FileText size={12} /> 代码
                        </button>
                    </div>

                    <!-- Undo / Redo Actions group -->
                    <div class="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-sm border border-slate-200/50 dark:border-slate-700/50">
                        <button
                            class="p-1 rounded-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            onclick={undo}
                            disabled={historyIndex <= 0}
                            title="撤销操作 (Undo)"
                        >
                            <Undo size={13} />
                        </button>
                        <button
                            class="p-1 rounded-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            onclick={redo}
                            disabled={historyIndex >= history.length - 1}
                            title="重做操作 (Redo)"
                        >
                            <Redo size={13} />
                        </button>
                    </div>

                    <!-- Clipboard Import & Transpose Tool Buttons -->
                    <button
                        onclick={pasteFromClipboard}
                        class="p-1.5 rounded-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition text-xs font-semibold flex items-center gap-1 border border-slate-200/60 dark:border-slate-700/60"
                        title="从系统剪贴板直接粘贴表格 (支持 Excel / 飞书 / TSV / CSV)"
                    >
                        <Clipboard size={12} /> 粘贴表格
                    </button>
                    <button
                        onclick={transposeData}
                        class="p-1.5 rounded-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition text-xs font-semibold flex items-center gap-1 border border-slate-200/60 dark:border-slate-700/60"
                        title="行列转置 (Pivot / Transpose)"
                    >
                        <ArrowLeftRight size={12} /> 转置
                    </button>
                </div>

                <div class="flex items-center gap-2">
                    <!-- Presets select dropdown -->
                    <select
                        onchange={(e) => loadPreset(e.currentTarget.value)}
                        class="rounded-sm border border-slate-200/60 bg-white/60 px-2 py-1 text-xs shadow-sm dark:border-slate-700/60 dark:bg-slate-800/60 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none"
                    >
                        <option value="">加载示例模板...</option>
                        <option value="monthly">月度运营与盈利 (多系列)</option>
                        <option value="dev_perf">研发团队效能产出 (多系列)</option>
                        <option value="resources">双季度预算分配 (多系列)</option>
                        <option value="saas">SaaS 营运与获客 (多指标)</option>
                        <option value="browsers">全球浏览器份额 (单系列)</option>
                    </select>

                    {#if activeTab === 'code'}
                        <div class="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-sm border border-slate-200/50 dark:border-slate-700/50">
                            <button
                                class="px-2 py-0.5 text-[10px] font-bold rounded-sm transition-all {inputMode === 'json' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700'}"
                                onclick={() => switchInputMode('json')}
                            >JSON</button>
                            <button
                                class="px-2 py-0.5 text-[10px] font-bold rounded-sm transition-all {inputMode === 'csv' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700'}"
                                onclick={() => switchInputMode('csv')}
                            >CSV</button>
                        </div>
                    {/if}

                    <Button variant="ghost" size="sm" onclick={clearGridData} title="清空全部数据" class="text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 h-auto rounded-sm">
                        <Trash2 size={13} />
                    </Button>
                </div>
            </div>

            <!-- Quick Data Operations Toolbar (Sort, Filter, Batch Operations) -->
            <div class="px-3 py-1.5 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/50 dark:border-slate-800/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div class="flex items-center gap-1.5">
                    <span class="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5">
                        <ArrowUpDown size={11} /> 排序:
                    </span>
                    <div class="flex p-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200/60 dark:border-slate-700/60">
                        <button
                            class="px-1.5 py-0.5 text-[10px] font-semibold rounded transition {sortOrder === 'none' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                            onclick={() => (sortOrder = 'none')}
                            title="原始数据顺序"
                        >
                            默认
                        </button>
                        <button
                            class="px-1.5 py-0.5 text-[10px] font-semibold rounded transition flex items-center gap-0.5 {sortOrder === 'asc' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                            onclick={() => (sortOrder = 'asc')}
                            title="按数值升序排列"
                        >
                            <ArrowUp size={10} /> 升序
                        </button>
                        <button
                            class="px-1.5 py-0.5 text-[10px] font-semibold rounded transition flex items-center gap-0.5 {sortOrder === 'desc' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                            onclick={() => (sortOrder = 'desc')}
                            title="按数值降序排列"
                        >
                            <ArrowDown size={10} /> 降序
                        </button>
                    </div>
                </div>

                <div class="flex items-center gap-1.5">
                    <span class="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5">
                        <Filter size={11} /> 聚焦:
                    </span>
                    <div class="flex p-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200/60 dark:border-slate-700/60">
                        <button
                            class="px-1.5 py-0.5 text-[10px] font-semibold rounded transition {filterMode === 'all' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                            onclick={() => (filterMode = 'all')}
                        >
                            全部
                        </button>
                        <button
                            class="px-1.5 py-0.5 text-[10px] font-semibold rounded transition {filterMode === 'top5' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                            onclick={() => (filterMode = 'top5')}
                        >
                            Top 5
                        </button>
                        <button
                            class="px-1.5 py-0.5 text-[10px] font-semibold rounded transition {filterMode === 'top10' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                            onclick={() => (filterMode = 'top10')}
                        >
                            Top 10
                        </button>
                        <button
                            class="px-1.5 py-0.5 text-[10px] font-semibold rounded transition {filterMode === 'noZero' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                            onclick={() => (filterMode = 'noZero')}
                            title="过滤为0的项目"
                        >
                            去零
                        </button>
                    </div>
                </div>

                <!-- Batch Numeric Operations Dropdown -->
                <div class="flex items-center gap-1.5">
                    <span class="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5">
                        <Calculator size={11} /> 批量:
                    </span>
                    <select
                        onchange={(e) => {
                            const op = e.currentTarget.value as any;
                            if (op) batchCompute(op);
                            e.currentTarget.value = "";
                        }}
                        class="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-[10px] font-semibold text-slate-700 dark:text-slate-300 rounded px-1.5 py-0.5 focus:outline-none"
                    >
                        <option value="">数值换算...</option>
                        <option value="mul10">所有指标 × 10</option>
                        <option value="div1000">所有指标 ÷ 1000 (千分位)</option>
                        <option value="round">四舍五入取整</option>
                    </select>
                </div>
            </div>
            
            {#if activeTab === 'grid'}
                <!-- Spreadsheet Grid Table View with Multi-Series Columns Support -->
                <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[300px]">
                    {#if gridRows.length === 0}
                        <div class="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-sm bg-slate-50/20 dark:bg-slate-900/10">
                            <Table size={40} class="text-slate-300 dark:text-slate-700 mb-2" />
                            <p class="text-sm font-semibold text-slate-400">数据网格当前为空</p>
                            <button onclick={addGridRow} class="mt-4 px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-sm shadow-sm transition flex items-center gap-1.5">
                                <Plus size={14} /> 添加第一行数据
                            </button>
                        </div>
                    {:else}
                        <div class="border border-slate-200 dark:border-slate-800 rounded-sm overflow-x-auto bg-white/50 dark:bg-slate-900/30">
                            <table class="w-full text-left border-collapse min-w-[360px]">
                                <thead>
                                    <tr class="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        <th class="p-2 w-10 text-center">#</th>
                                        <th class="p-2 min-w-[120px]">
                                            <input
                                                type="text"
                                                value={labelColumn || "label"}
                                                onchange={(e) => renameSeriesColumn(labelColumn, e.currentTarget.value)}
                                                class="bg-transparent border-none font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800 rounded px-1 w-full"
                                                title="类别标签列名称 (可编辑)"
                                            />
                                        </th>
                                        {#each allSeriesColumns as sCol, sIdx}
                                            <th class="p-2 min-w-[100px] relative group">
                                                <div class="flex items-center justify-between gap-1">
                                                    <div class="flex items-center gap-1">
                                                        <input
                                                            type="color"
                                                            value={themeColors[sIdx % themeColors.length]}
                                                            onchange={(e) => {
                                                                customColors[sCol] = e.currentTarget.value;
                                                                activeTheme = "custom";
                                                            }}
                                                            class="w-3.5 h-3.5 rounded border-none cursor-pointer bg-transparent p-0"
                                                            title="自定义此系列颜色"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={sCol}
                                                            onchange={(e) => renameSeriesColumn(sCol, e.currentTarget.value)}
                                                            class="bg-transparent border-none font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800 rounded px-1 max-w-[80px]"
                                                            title="指标系列列名称 (可编辑)"
                                                        />
                                                    </div>
                                                    {#if allSeriesColumns.length > 1}
                                                        <button
                                                            onclick={() => deleteSeriesColumn(sCol)}
                                                            class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition p-0.5 rounded"
                                                            title="删除此指标列"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    {/if}
                                                </div>
                                            </th>
                                        {/each}
                                        <th class="p-2 w-10 text-center">
                                            <button
                                                onclick={addSeriesColumn}
                                                class="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 p-1 rounded transition text-[10px] font-bold flex items-center gap-0.5"
                                                title="添加新的指标数值列"
                                            >
                                                <Plus size={12} /> 列
                                            </button>
                                        </th>
                                        <th class="p-2 w-8 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each pagedGridRows as row, idx}
                                        <tr class="border-b border-slate-200/55 dark:border-slate-800/55 hover:bg-slate-50/30 dark:hover:bg-slate-900/20">
                                            <td class="p-2 text-center font-mono text-[11px] text-slate-400">
                                                {(gridPage - 1) * gridPageSize + idx + 1}
                                            </td>
                                            <td class="p-1">
                                                <input
                                                    type="text"
                                                    bind:value={row[labelColumn || 'label']}
                                                    oninput={syncGridToInput}
                                                    placeholder="请输入标签"
                                                    class="w-full bg-transparent border-none focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800 rounded-sm px-2 py-1 text-sm dark:text-slate-300 focus:ring-1 focus:ring-emerald-500/30"
                                                />
                                            </td>
                                            {#each allSeriesColumns as sCol}
                                                <td class="p-1">
                                                    <input
                                                        type="number"
                                                        bind:value={row[sCol]}
                                                        oninput={syncGridToInput}
                                                        placeholder="0"
                                                        class="w-full bg-transparent border-none focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800 rounded-sm px-2 py-1 text-sm dark:text-slate-300 font-mono focus:ring-1 focus:ring-emerald-500/30"
                                                    />
                                                </td>
                                            {/each}
                                            <td></td>
                                            <td class="p-1 text-center">
                                                <button
                                                    onclick={() => deleteGridRow(idx)}
                                                    class="text-slate-400 hover:text-red-500 p-1 rounded-sm transition"
                                                    title="删除此行"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>

                        <!-- Pagination & Operations Panel -->
                        <div class="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 mt-1 text-xs">
                            <div class="flex items-center gap-2">
                                <button onclick={addGridRow} class="px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-sm shadow-sm transition flex items-center gap-1.5">
                                    <Plus size={13} /> 添加数据行
                                </button>
                                <button onclick={addSeriesColumn} class="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-sm transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                                    <Plus size={13} /> 添加指标列
                                </button>
                            </div>
                            
                            {#if totalGridPages > 1}
                                <div class="flex items-center gap-1">
                                    <button 
                                        disabled={gridPage === 1}
                                        onclick={() => gridPage = Math.max(1, gridPage - 1)}
                                        class="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-semibold"
                                    >
                                        上一页
                                    </button>
                                    <span class="px-2 font-mono text-slate-600 dark:text-slate-300">
                                        {gridPage} / {totalGridPages}
                                    </span>
                                    <button 
                                        disabled={gridPage === totalGridPages}
                                        onclick={() => gridPage = Math.min(totalGridPages, gridPage + 1)}
                                        class="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-semibold"
                                    >
                                        下一页
                                    </button>
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            {:else}
                <!-- Code Editor View -->
                <div class="flex-1 p-3 flex flex-col min-h-[300px]">
                    <textarea
                        bind:value={dataInput}
                        class="w-full flex-1 p-3 textarea-editor font-mono text-xs leading-relaxed outline-none resize-none bg-slate-50/50 dark:bg-slate-900/50 rounded-sm border border-slate-200/50 dark:border-slate-800/50 text-slate-800 dark:text-slate-100"
                        placeholder="在此贴入 JSON 数组、CSV 或从 Excel 复制的内容..."
                    ></textarea>
                </div>
            {/if}

            <div class="p-3 border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm relative z-10 flex justify-between items-center h-10">
                {#if parseError}
                    <div class="text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        {parseError}
                    </div>
                {:else if parseNotice}
                    <div class="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        {parseNotice}
                    </div>
                {:else}
                    <div class="flex items-center gap-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <span class="flex items-center gap-1"><div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>{activeChartData.length} 个分类 • {seriesColumns.length} 个可见指标</span>
                        <span>总计: {totalVal.toLocaleString()}</span>
                        <span>峰值: {maxVal.toLocaleString()}</span>
                        {#if outlierNotice}
                            <span class="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                <AlertCircle size={11} /> {outlierNotice}
                            </span>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>

        <!-- Preview Section (Right Panel) -->
        <div 
            class="clean-panel bg-slate-50/50 dark:bg-slate-900/50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:20px_20px] rounded-sm border border-slate-200/60 dark:border-slate-800/60 flex flex-col h-full relative"
            onmousemove={handleMouseMove}
            onmouseenter={() => isHoveringChart = true}
            onmouseleave={() => { isHoveringChart = false; hoveredIndex = null; }}
            role="presentation"
        >
            <div class="clean-header bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm border-b border-slate-200/60 dark:border-slate-800/60 p-3 flex flex-wrap justify-between items-center gap-3">
                <div class="flex items-center gap-1.5 flex-1 min-w-[160px] max-w-[220px] group relative">
                    <input
                        type="text"
                        bind:value={chartTitle}
                        class="font-semibold text-slate-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50 rounded-sm px-2 py-1 -ml-2 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 text-sm w-full"
                        placeholder="图表标题"
                    />
                </div>
                
                <div class="flex flex-wrap items-center gap-2">
                    <!-- Data Labels Toggle Controls -->
                    <div class="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-sm border border-slate-200/50 dark:border-slate-700/50">
                        <button
                            class="px-2 py-1 text-xs font-semibold rounded-sm transition-all duration-200 flex items-center gap-1 {showDataLabels ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                            onclick={() => (showDataLabels = !showDataLabels)}
                            title="切换图表外在数据标签显示"
                        >
                            <Tag size={12} />
                            <span>标签</span>
                        </button>
                        {#if showDataLabels}
                            <div class="h-3 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>
                            <button
                                class="px-1.5 py-0.5 text-[10px] font-semibold rounded-sm transition-all {dataLabelMode === 'both' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                                onclick={() => (dataLabelMode = 'both')}
                                title="显示完整数值与百分比"
                            >
                                全部
                            </button>
                            <button
                                class="px-1.5 py-0.5 text-[10px] font-semibold rounded-sm transition-all {dataLabelMode === 'value' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                                onclick={() => (dataLabelMode = 'value')}
                                title="仅显示数值"
                            >
                                数值
                            </button>
                            <button
                                class="px-1.5 py-0.5 text-[10px] font-semibold rounded-sm transition-all {dataLabelMode === 'percent' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                                onclick={() => (dataLabelMode = 'percent')}
                                title="仅显示占比"
                            >
                                占比
                            </button>
                        {/if}
                    </div>

                    <!-- Analytical Overlays (Avg Line, Extremes, Zero-Base Y Axis, Smoothness, Grid Style) -->
                    <div class="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-sm border border-slate-200/50 dark:border-slate-700/50">
                        <button
                            class="px-2 py-1 text-xs font-semibold rounded-sm transition-all duration-200 flex items-center gap-1 {showAvgLine ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                            onclick={() => (showAvgLine = !showAvgLine)}
                            title="切换均值参考基准线"
                        >
                            <TrendingUp size={12} />
                            <span>均值</span>
                        </button>
                        <button
                            class="px-2 py-1 text-xs font-semibold rounded-sm transition-all duration-200 flex items-center gap-1 {highlightExtremes ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                            onclick={() => (highlightExtremes = !highlightExtremes)}
                            title="自动高亮峰值 (MAX) 与谷值 (MIN)"
                        >
                            <Activity size={12} />
                            <span>极值</span>
                        </button>
                        <button
                            class="px-2 py-1 text-xs font-semibold rounded-sm transition-all duration-200 flex items-center gap-1 {zeroBasedYAxis ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                            onclick={() => (zeroBasedYAxis = !zeroBasedYAxis)}
                            title="Y轴起点：0基准点 vs 自适应数据波动极值"
                        >
                            <span>{zeroBasedYAxis ? "0起点" : "自适应"}</span>
                        </button>
                        <button
                            class="px-2 py-1 text-xs font-semibold rounded-sm transition-all duration-200 flex items-center gap-1 {lineSmoothing ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}"
                            onclick={() => (lineSmoothing = !lineSmoothing)}
                            title="平滑曲线 (Smooth Bézier) vs 直线折线 (Polyline)"
                        >
                            <Zap size={11} />
                            <span>{lineSmoothing ? "平滑" : "折线"}</span>
                        </button>
                        <button
                            class="px-1.5 py-1 text-xs font-semibold rounded-sm transition-all text-slate-500 hover:text-slate-700 dark:text-slate-400"
                            onclick={() => {
                                if (gridStyle === 'horizontal') gridStyle = 'both';
                                else if (gridStyle === 'both') gridStyle = 'none';
                                else gridStyle = 'horizontal';
                            }}
                            title="切换网格线：横向 / 全网格 / 无网格"
                        >
                            <GridIcon size={11} />
                        </button>
                    </div>

                    <!-- Theme Palette Picker -->
                    <div class="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-sm border border-slate-200/50 dark:border-slate-700/50">
                        <Palette size={12} class="text-slate-400 ml-1.5 mr-0.5" />
                        <select
                            bind:value={activeTheme}
                            class="bg-transparent border-none text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer py-0.5 px-1 rounded-sm"
                            title="切换图表视觉调色盘"
                        >
                            <option value="emerald">🌿 翡翠绿</option>
                            <option value="sky">🔷 科技蓝</option>
                            <option value="amber">🍊 商务暖阳</option>
                            <option value="vibrant">🌈 缤纷光谱</option>
                            <option value="custom">🎨 自定义配色</option>
                        </select>
                    </div>

                    <!-- 8 Chart Types Switcher (MECE Multi-series Matrix + Combo) -->
                    <div class="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-sm border border-slate-200/50 dark:border-slate-700/50">
                        <button
                            class="px-2 py-1 text-xs font-semibold rounded-sm transition-all duration-200 flex items-center gap-1 {chartType === 'bar' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                            onclick={() => (chartType = "bar")}
                            title={seriesColumns.length > 1 ? "分组柱状图 (Grouped Bar)" : "柱状图 (Bar Chart)"}
                        >
                            <BarChart size={12} /> {seriesColumns.length > 1 ? "分组柱" : "柱状"}
                        </button>
                        {#if allSeriesColumns.length > 1}
                            <button
                                class="px-2 py-1 text-xs font-semibold rounded-sm transition-all duration-200 flex items-center gap-1 {chartType === 'stacked-bar' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                                onclick={() => (chartType = "stacked-bar")}
                                title="堆叠柱状图 (Stacked Bar)"
                            >
                                <Layers3 size={12} /> 堆叠柱
                            </button>
                            <button
                                class="px-2 py-1 text-xs font-semibold rounded-sm transition-all duration-200 flex items-center gap-1 {chartType === 'combo' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                                onclick={() => (chartType = "combo")}
                                title="柱线双轴复合图 (Bar + Line Combo)"
                            >
                                <SlidersHorizontal size={12} /> 柱线复合
                            </button>
                        {/if}
                        <button
                            class="px-2 py-1 text-xs font-semibold rounded-sm transition-all duration-200 flex items-center gap-1 {chartType === 'line' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                            onclick={() => (chartType = "line")}
                            title="趋势折线图 (Multi-Line Trend)"
                        >
                            <LineChart size={12} /> 折线
                        </button>
                        <button
                            class="px-2 py-1 text-xs font-semibold rounded-sm transition-all duration-200 flex items-center gap-1 {chartType === 'area' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                            onclick={() => (chartType = "area")}
                            title="平滑面积图 (Smooth Area)"
                        >
                            <Layers size={12} /> 面积
                        </button>
                        <button
                            class="px-2 py-1 text-xs font-semibold rounded-sm transition-all duration-200 flex items-center gap-1 {chartType === 'pie' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                            onclick={() => (chartType = "pie")}
                            title="经典饼图 (Pie)"
                        >
                            <PieChart size={12} /> 饼图
                        </button>
                        <button
                            class="px-2 py-1 text-xs font-semibold rounded-sm transition-all duration-200 flex items-center gap-1 {chartType === 'donut' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                            onclick={() => (chartType = "donut")}
                            title="现代环形图 (Donut Ring)"
                        >
                            <CircleDot size={12} /> 环形
                        </button>
                        <button
                            class="px-2 py-1 text-xs font-semibold rounded-sm transition-all duration-200 flex items-center gap-1 {chartType === 'radar' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                            onclick={() => (chartType = "radar")}
                            title="多维雷达图 (Radar)"
                        >
                            <Radar size={12} /> 雷达
                        </button>
                    </div>
                </div>
            </div>

            <div class="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {#if parseError}
                    <!-- Dynamic Onboarding: Error Card with One-click recovery path -->
                    <div class="p-8 max-w-sm text-center flex flex-col items-center justify-center h-full bg-white/30 dark:bg-slate-900/20 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-sm">
                        <div class="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center mb-4 text-red-500 dark:text-red-400">
                            <Trash2 size={22} />
                        </div>
                        <h3 class="text-sm font-bold text-red-600 dark:text-red-400 mb-1.5">数据存在解析异常</h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mb-6 font-mono px-3 py-2 bg-red-50/50 dark:bg-red-950/10 border border-red-100/50 dark:border-red-950/20 rounded w-full break-words">
                            {parseError}
                        </p>
                        <div class="flex gap-2 w-full">
                            <button 
                                onclick={() => loadPreset('monthly')}
                                class="flex-1 px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded transition shadow-sm"
                            >
                                恢复示例数据
                            </button>
                            <button 
                                onclick={clearGridData}
                                class="flex-1 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition border border-slate-200 dark:border-slate-700"
                            >
                                清空数据
                            </button>
                        </div>
                    </div>
                {:else if activeChartData.length > 0}
                    <!-- Interactive Multi-Series Cursor-Follow Tooltip with Variance/Delta Calculations -->
                    {#if hoveredIndex !== null && activeChartData.find(item => item.originalIndex === hoveredIndex) && isHoveringChart}
                        {@const rowItem = activeChartData.find(item => item.originalIndex === hoveredIndex)!}
                        <div
                            class="absolute bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg rounded-sm px-3 py-2 border border-slate-200/60 dark:border-slate-800/60 z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-75 text-left min-w-[140px]"
                            style="left: {mouseX}px; top: {mouseY - 12}px;"
                        >
                            <div class="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 border-b border-slate-100 dark:border-slate-800 pb-1 flex justify-between items-center">
                                <span>{rowItem.label}</span>
                                {#if seriesColumns.length === 2}
                                    {@const val1 = rowItem.values[allSeriesColumns.indexOf(seriesColumns[0])] ?? 0}
                                    {@const val2 = rowItem.values[allSeriesColumns.indexOf(seriesColumns[1])] ?? 0}
                                    {@const diff = val2 - val1}
                                    {@const pct = val1 > 0 ? ((diff / val1) * 100).toFixed(1) : "0"}
                                    <span class="text-[9px] font-mono font-semibold {diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}">
                                        {diff >= 0 ? `+${diff}` : diff} ({diff >= 0 ? `+${pct}%` : `${pct}%`})
                                    </span>
                                {/if}
                            </div>
                            <div class="flex flex-col gap-1">
                                {#each seriesColumns as sCol, sIdx}
                                    {@const originalIdx = allSeriesColumns.indexOf(sCol)}
                                    {@const val = rowItem.values[originalIdx] ?? 0}
                                    {@const sColor = themeColors[sIdx % themeColors.length]}
                                    <div class="flex items-center justify-between gap-3 text-xs">
                                        <span class="flex items-center gap-1 text-slate-600 dark:text-slate-300 text-[10px]">
                                            <span class="w-1.5 h-1.5 rounded-none" style="background-color: {sColor}"></span>
                                            {sCol}:
                                        </span>
                                        <span class="font-mono font-bold text-slate-900 dark:text-white">{val.toLocaleString()}</span>
                                    </div>
                                {/each}
                                {#if seriesColumns.length > 1}
                                    <div class="flex items-center justify-between gap-3 text-xs border-t border-slate-100 dark:border-slate-800 pt-1 font-semibold text-emerald-600 dark:text-emerald-400 text-[10px]">
                                        <span>合计:</span>
                                        <span class="font-mono font-bold">{rowItem.total.toLocaleString()}</span>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/if}

                    <div class="w-full h-full max-w-full flex flex-col items-center justify-center relative z-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm rounded-sm border border-slate-200/60 dark:border-slate-700/60 p-4">
                        <!-- SVG Graphic Wrapper with dynamic horizontal scrollbar for large datasets -->
                        <div class="w-full flex-1 overflow-x-auto overflow-y-hidden py-2 flex items-center justify-start min-h-[300px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
                            <svg 
                                bind:this={svgRef} 
                                viewBox="0 0 {svgViewWidth} {shouldRotateLabels ? 220 : 200}" 
                                class="w-full h-auto min-h-[280px] overflow-visible drop-shadow-sm flex-shrink-0"
                                style="width: {(chartType === 'bar' || chartType === 'stacked-bar' || chartType === 'combo' || chartType === 'line' || chartType === 'area') && activeChartData.length > 8 ? `${svgViewWidth * 1.4}px` : '100%'}; max-width: {(chartType === 'bar' || chartType === 'stacked-bar' || chartType === 'combo' || chartType === 'line' || chartType === 'area') && activeChartData.length > 8 ? 'none' : '100%'};"
                            >
                                <!-- Title inside SVG -->
                                <text x={svgViewWidth / 2} y="14" text-anchor="middle" class="text-[11px] fill-slate-800 dark:fill-slate-200 font-bold tracking-wide">{chartTitle || "未命名图表"}</text>

                                {#if chartType === 'bar' || chartType === 'stacked-bar' || chartType === 'combo' || chartType === 'line' || chartType === 'area'}
                                    <!-- Y-axis Main -->
                                    <line x1="50" y1="25" x2="50" y2="170" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" class="text-slate-200 dark:text-slate-700" />
                                    <!-- X-axis -->
                                    <line x1="50" y1="170" x2={svgViewWidth - 25} y2="170" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" class="text-slate-200 dark:text-slate-700" />
                                    
                                    <!-- Background Grid Lines (Horizontal / Both / None) -->
                                    {#if gridStyle !== 'none'}
                                        {#each yAxisLabels as label, i}
                                            {@const y = 170 - (i / 4) * 140}
                                            <line x1="50" y1={y} x2={svgViewWidth - 25} y2={y} stroke="currentColor" stroke-width="0.75" stroke-dasharray="3,3" class="text-slate-100 dark:text-slate-800/80" />
                                        {/each}
                                        {#if gridStyle === 'both'}
                                            {@const count = activeChartData.length}
                                            {@const slotWidth = (svgViewWidth - 85) / count}
                                            {#each activeChartData as _, idx}
                                                {@const x = 55 + idx * slotWidth + slotWidth * 0.5}
                                                <line x1={x} y1="25" x2={x} y2="170" stroke="currentColor" stroke-width="0.5" stroke-dasharray="2,2" class="text-slate-100 dark:text-slate-800/50" />
                                            {/each}
                                        {/if}
                                    {/if}

                                    <!-- Y-axis Text Labels -->
                                    {#each yAxisLabels as label, i}
                                        {@const y = 170 - (i / 4) * 140}
                                        <text x="42" {y} text-anchor="end" dominant-baseline="middle" class="text-[7.5px] fill-slate-500 dark:fill-slate-400 font-mono font-medium">{label}</text>
                                    {/each}

                                    <!-- Average Reference Benchmark Line -->
                                    {#if showAvgLine && activeChartData.length > 0}
                                        <line
                                            x1="50"
                                            y1={avgY}
                                            x2={svgViewWidth - 25}
                                            y2={avgY}
                                            stroke="#f59e0b"
                                            stroke-width="1.2"
                                            stroke-dasharray="4,4"
                                            class="opacity-80"
                                        />
                                        <g transform="translate({svgViewWidth - 22}, {avgY})">
                                            <rect x="-44" y="-7" width="42" height="14" rx="3" fill="#f59e0b" class="opacity-90 shadow-sm" />
                                            <text x="-23" y="3.5" text-anchor="middle" class="text-[6.5px] font-mono font-bold fill-white">均值 {summaryStats?.avg}</text>
                                        </g>
                                    {/if}
                                {/if}

                                {#if chartType === "bar" || chartType === "combo"}
                                    <!-- Grouped Bar Chart (or Primary Series in Combo) -->
                                    {@const count = activeChartData.length}
                                    {@const slotWidth = (svgViewWidth - 85) / count}
                                    {@const renderSeries = chartType === "combo" ? seriesColumns.slice(0, Math.max(1, seriesColumns.length - 1)) : seriesColumns}
                                    {@const numSeries = renderSeries.length}
                                    {@const subBarWidth = (slotWidth * 0.72) / numSeries}

                                    {#each activeChartData as d, idx}
                                        {@const slotX = 55 + idx * slotWidth + slotWidth * 0.14}
                                        {@const slotCenter = 55 + idx * slotWidth + slotWidth * 0.5}
                                        {#each renderSeries as sCol, sIdx}
                                            {@const originalColIdx = allSeriesColumns.indexOf(sCol)}
                                            {@const val = d.values[originalColIdx] ?? 0}
                                            {@const h = Math.max(0, ((val - yAxisMin) / valRange) * 140)}
                                            {@const barX = slotX + sIdx * subBarWidth}
                                            {@const barY = 170 - h}
                                            {@const sColor = themeColors[sIdx % themeColors.length]}
                                            {@const isMax = highlightExtremes && val === maxVal}
                                            {@const isMin = highlightExtremes && val === minSingleVal}

                                            <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
                                            <rect
                                                x={barX}
                                                y={barY}
                                                width={subBarWidth * 0.88}
                                                height={h}
                                                fill={sColor}
                                                rx="1.5"
                                                class="transition-all duration-200 cursor-pointer hover:opacity-90 {isMax ? 'stroke-amber-400 stroke-1' : isMin ? 'stroke-sky-400 stroke-1' : ''}"
                                                onmouseenter={() => hoveredIndex = d.originalIndex}
                                                onmouseleave={() => hoveredIndex = null}
                                                role="img"
                                                aria-label={`${d.label} (${sCol}): ${val}`}
                                            />

                                            <!-- Extremes Badge -->
                                            {#if isMax}
                                                <rect x={barX + subBarWidth * 0.44 - 9} y={barY - 14} width="18" height="8" rx="2" fill="#f59e0b" />
                                                <text x={barX + subBarWidth * 0.44} y={barY - 8} text-anchor="middle" class="text-[5.5px] font-mono font-bold fill-white">MAX</text>
                                            {:else if isMin}
                                                <rect x={barX + subBarWidth * 0.44 - 9} y={barY - 14} width="18" height="8" rx="2" fill="#0ea5e9" />
                                                <text x={barX + subBarWidth * 0.44} y={barY - 8} text-anchor="middle" class="text-[5.5px] font-mono font-bold fill-white">MIN</text>
                                            {/if}

                                            <!-- Data value above sub-bar -->
                                            {#if showDataLabels}
                                                <text
                                                    x={barX + subBarWidth * 0.44}
                                                    y={isMax || isMin ? barY - 16 : barY - 3}
                                                    text-anchor="middle"
                                                    class="text-[6.5px] font-mono font-bold fill-slate-700 dark:fill-slate-300 select-none pointer-events-none"
                                                >
                                                    {formatDataLabel(val, totalVal)}
                                                </text>
                                            {/if}
                                        {/each}

                                        <!-- X Category Label with Smart Rotation -->
                                        {#if shouldRotateLabels}
                                            <text
                                                x={slotCenter}
                                                y="182"
                                                text-anchor="end"
                                                transform="rotate(-35, {slotCenter}, 182)"
                                                class="text-[7px] fill-slate-600 dark:fill-slate-400 font-mono font-semibold"
                                            >{truncateLabel(d.label)}</text>
                                        {:else}
                                            <text
                                                x={slotCenter}
                                                y="185"
                                                text-anchor="middle"
                                                class="text-[7.5px] fill-slate-600 dark:fill-slate-400 font-mono font-semibold"
                                            >{truncateLabel(d.label)}</text>
                                        {/if}
                                    {/each}

                                    <!-- If Combo mode: Render Line for the Last Series -->
                                    {#if chartType === "combo" && seriesColumns.length > 1}
                                        {@const comboCol = seriesColumns[seriesColumns.length - 1]}
                                        {@const comboOrigIdx = allSeriesColumns.indexOf(comboCol)}
                                        {@const comboColor = themeColors[(seriesColumns.length - 1) % themeColors.length]}
                                        {@const comboPts = activeChartData.map((d, idx) => ({
                                            x: 55 + idx * slotWidth + slotWidth * 0.5,
                                            y: 170 - (((d.values[comboOrigIdx] ?? 0) - yAxisMin) / valRange) * 140
                                        }))}
                                        
                                        <path
                                            d={createSmoothCurvePath(comboPts)}
                                            fill="none"
                                            stroke={comboColor}
                                            stroke-width="2.5"
                                            stroke-linecap="round"
                                            class="drop-shadow-sm"
                                        />
                                        {#each comboPts as cp, idx}
                                            <circle
                                                cx={cp.x}
                                                cy={cp.y}
                                                r="4"
                                                fill={comboColor}
                                                stroke="#ffffff"
                                                class="stroke-2 cursor-pointer"
                                                onmouseenter={() => hoveredIndex = activeChartData[idx].originalIndex}
                                                onmouseleave={() => hoveredIndex = null}
                                                role="img"
                                                aria-label={`${activeChartData[idx].label} (${comboCol}): ${activeChartData[idx].values[comboOrigIdx]}`}
                                            />
                                        {/each}
                                    {/if}
                                {:else if chartType === "stacked-bar"}
                                    <!-- Stacked Bar Chart -->
                                    {@const count = activeChartData.length}
                                    {@const slotWidth = (svgViewWidth - 85) / count}
                                    {@const barW = slotWidth * 0.6}

                                    {#each activeChartData as d, idx}
                                        {@const barX = 55 + idx * slotWidth + slotWidth * 0.2}
                                        {@const barCenter = barX + barW * 0.5}
                                        {@const stackTotal = d.values.reduce((acc, v, sI) => acc + (!hiddenSeries.has(allSeriesColumns[sI]) ? v : 0), 0)}
                                        {@const totalH = (stackTotal / maxStackedVal) * 140}
                                        {@const topY = 170 - totalH}

                                        <!-- Loop segments from bottom to top -->
                                        {#each seriesColumns as sCol, sIdx}
                                            {@const originalColIdx = allSeriesColumns.indexOf(sCol)}
                                            {@const val = d.values[originalColIdx] ?? 0}
                                            {@const prevSum = seriesColumns.slice(0, sIdx).reduce((acc, c) => acc + (d.values[allSeriesColumns.indexOf(c)] ?? 0), 0)}
                                            {@const segYBottom = 170 - (prevSum / maxStackedVal) * 140}
                                            {@const segH = (val / maxStackedVal) * 140}
                                            {@const segY = segYBottom - segH}
                                            {@const sColor = themeColors[sIdx % themeColors.length]}

                                            <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
                                            <rect
                                                x={barX}
                                                y={segY}
                                                width={barW}
                                                height={segH}
                                                fill={sColor}
                                                class="transition-all duration-200 cursor-pointer hover:opacity-90 stroke-white/40 dark:stroke-slate-900/40 stroke-[0.5]"
                                                onmouseenter={() => hoveredIndex = d.originalIndex}
                                                onmouseleave={() => hoveredIndex = null}
                                                role="img"
                                                aria-label={`${d.label} (${sCol}): ${val}`}
                                            />
                                        {/each}

                                        <!-- Stack Total external label on top -->
                                        {#if showDataLabels}
                                            <text
                                                x={barCenter}
                                                y={topY - 4}
                                                text-anchor="middle"
                                                class="text-[7px] font-mono font-bold fill-slate-800 dark:fill-slate-200 select-none pointer-events-none"
                                            >
                                                {formatDataLabel(stackTotal, totalVal)}
                                            </text>
                                        {/if}

                                        <!-- X Category Label -->
                                        {#if shouldRotateLabels}
                                            <text
                                                x={barCenter}
                                                y="182"
                                                text-anchor="end"
                                                transform="rotate(-35, {barCenter}, 182)"
                                                class="text-[7px] fill-slate-600 dark:fill-slate-400 font-mono font-semibold"
                                            >{truncateLabel(d.label)}</text>
                                        {:else}
                                            <text
                                                x={barCenter}
                                                y="185"
                                                text-anchor="middle"
                                                class="text-[7.5px] fill-slate-600 dark:fill-slate-400 font-mono font-semibold"
                                            >{truncateLabel(d.label)}</text>
                                        {/if}
                                    {/each}
                                {:else if chartType === "line" || chartType === "area"}
                                    <!-- Multi-Line & Smooth Area Chart -->
                                    {@const stepWidth = activeChartData.length > 1 ? (svgViewWidth - 85) / (activeChartData.length - 1) : (svgViewWidth - 85)}

                                    <!-- Crosshair vertical guide line -->
                                    {#if hoveredIndex !== null}
                                        {@const activeIdx = activeChartData.findIndex(item => item.originalIndex === hoveredIndex)}
                                        {#if activeIdx !== -1}
                                            {@const x = 55 + activeIdx * stepWidth}
                                            <line x1={x} y1="25" x2={x} y2="170" stroke="currentColor" stroke-width="1" stroke-dasharray="3,3" class="text-emerald-500 dark:text-emerald-400 pointer-events-none" />
                                        {/if}
                                    {/if}

                                    <!-- Render Each Series Path -->
                                    {#each seriesColumns as sCol, sIdx}
                                        {@const originalColIdx = allSeriesColumns.indexOf(sCol)}
                                        {@const sColor = themeColors[sIdx % themeColors.length]}
                                        {@const pts = activeChartData.map((d, idx) => ({
                                            x: 55 + idx * stepWidth,
                                            y: 170 - (((d.values[originalColIdx] ?? 0) - yAxisMin) / valRange) * 140
                                        }))}

                                        {#if chartType === "area"}
                                            <!-- Smooth Area Curve Fill -->
                                            <path
                                                d={createSmoothCurvePath(pts) + ` L ${55 + (activeChartData.length - 1) * stepWidth} 170 L 55 170 Z`}
                                                fill={sColor}
                                                fill-opacity="0.18"
                                                class="transition-all duration-500"
                                            />
                                            <path
                                                d={createSmoothCurvePath(pts)}
                                                fill="none"
                                                stroke={sColor}
                                                stroke-width="2.2"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                class="drop-shadow-sm"
                                            />
                                        {:else}
                                            <!-- Multi Line Stroke -->
                                            <path
                                                d={createSmoothCurvePath(pts)}
                                                fill="none"
                                                stroke={sColor}
                                                stroke-width="2.2"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                class="drop-shadow-sm"
                                            />
                                        {/if}

                                        <!-- Point Dots -->
                                        {#each pts as p, idx}
                                            {@const d = activeChartData[idx]}
                                            {@const val = d.values[originalColIdx] ?? 0}
                                            {@const isMax = highlightExtremes && val === maxVal}
                                            {@const isMin = highlightExtremes && val === minSingleVal}

                                            <circle
                                                cx={p.x}
                                                cy={p.y}
                                                r={hoveredIndex === d.originalIndex ? 5 : 3.5}
                                                fill={sColor}
                                                stroke="#ffffff"
                                                class="stroke-2 cursor-pointer transition-all duration-150"
                                                onmouseenter={() => hoveredIndex = d.originalIndex}
                                                onmouseleave={() => hoveredIndex = null}
                                                role="img"
                                                aria-label={`${d.label} (${sCol}): ${val}`}
                                            />

                                            <!-- Data Value above Point Dot -->
                                            {#if showDataLabels && (seriesColumns.length === 1 || activeSeriesIndex === sIdx || activeSeriesIndex === "all")}
                                                <text
                                                    x={p.x}
                                                    y={p.y - 6 - (sIdx * 4)}
                                                    text-anchor="middle"
                                                    class="text-[6.5px] font-mono font-bold select-none pointer-events-none fill-slate-700 dark:fill-slate-300"
                                                >
                                                    {formatDataLabel(val, totalVal)}
                                                </text>
                                            {/if}
                                        {/each}
                                    {/each}

                                    <!-- Category X Labels -->
                                    {#each activeChartData as d, idx}
                                        {@const ptX = 55 + idx * stepWidth}
                                        {#if shouldRotateLabels}
                                            <text
                                                x={ptX}
                                                y="182"
                                                text-anchor="end"
                                                transform="rotate(-35, {ptX}, 182)"
                                                class="text-[7px] fill-slate-600 dark:fill-slate-400 font-mono font-semibold"
                                            >{truncateLabel(d.label)}</text>
                                        {:else}
                                            <text
                                                x={ptX}
                                                y="185"
                                                text-anchor="middle"
                                                class="text-[7.5px] fill-slate-600 dark:fill-slate-400 font-mono font-semibold"
                                            >{truncateLabel(d.label)}</text>
                                        {/if}
                                    {/each}
                                {:else if chartType === "pie" || chartType === "donut"}
                                    <!-- Pie & Donut Chart Slices -->
                                    <g>
                                        {#each pieSlices as slice}
                                            <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
                                            <path
                                                d={chartType === 'donut' ? slice.donutPath : slice.path}
                                                fill={slice.color}
                                                class="cursor-pointer transition-all duration-200 hover:opacity-95"
                                                style="transform: scale({hoveredIndex === slice.originalIndex ? 1.04 : 1}); transform-origin: {svgViewWidth / 2}px 100px;"
                                                onmouseenter={() => hoveredIndex = slice.originalIndex}
                                                onmouseleave={() => hoveredIndex = null}
                                                role="img"
                                                aria-label={`${slice.label}: ${slice.value}`}
                                            />
                                        {/each}
                                    </g>

                                    <!-- Donut Center KPI Readout (Clickable Mode Cycle) -->
                                    {#if chartType === "donut"}
                                        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
                                        <g class="cursor-pointer" onclick={cycleDonutCenterMode}>
                                            <title>点击切换总计/均值/最大值</title>
                                            <text x={svgViewWidth / 2} y="96" text-anchor="middle" dominant-baseline="middle" class="text-[12px] font-bold font-mono fill-slate-800 dark:fill-slate-100">{donutCenterValue}</text>
                                            <text x={svgViewWidth / 2} y="108" text-anchor="middle" dominant-baseline="middle" class="text-[6.5px] font-semibold uppercase tracking-wider fill-slate-400">{donutCenterTitle}</text>
                                        </g>
                                    {/if}

                                    <!-- Outer Leader Line Labels -->
                                    {#if showDataLabels}
                                        <g class="pointer-events-none select-none">
                                            {#each pieSlices as slice}
                                                <polyline
                                                    points="{slice.x1},{slice.y1} {slice.x2},{slice.y2} {slice.x3},{slice.y3}"
                                                    fill="none"
                                                    stroke={slice.color}
                                                    stroke-width="1"
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    class="opacity-75"
                                                />
                                                <circle cx={slice.x1} cy={slice.y1} r="1.5" fill={slice.color} />
                                                <text
                                                    x={slice.labelX}
                                                    y={slice.labelY}
                                                    text-anchor={slice.textAnchor}
                                                    dominant-baseline="middle"
                                                    class="text-[7px] font-semibold font-mono fill-slate-700 dark:fill-slate-200"
                                                >
                                                    {truncateLabel(slice.label, 8)}: {formatDataLabel(slice.value, totalVal)}
                                                </text>
                                            {/each}
                                        </g>
                                    {/if}
                                {:else if chartType === "radar"}
                                    <!-- Radar Chart Grid -->
                                    {#each radarGridPaths as path}
                                        <path d={path} fill="none" stroke="currentColor" stroke-width="0.75" class="text-slate-200 dark:text-slate-800" />
                                    {/each}

                                    <!-- Radar Axis Spokes -->
                                    {#each radarAxes as axis}
                                        <line x1={axis.x1} y1={axis.y1} x2={axis.x2} y2={axis.y2} stroke="currentColor" stroke-width="0.75" class="text-slate-200 dark:text-slate-800" />
                                    {/each}

                                    <!-- Radar Series Polygons -->
                                    {#each radarSeriesData as sData}
                                        <path 
                                            d={sData.path} 
                                            fill={sData.color} 
                                            fill-opacity="0.22" 
                                            stroke={sData.color} 
                                            stroke-width="2" 
                                            class="transition-all duration-300 ease-out" 
                                        />

                                        <!-- Vertices -->
                                        {#each sData.points as pt}
                                            <circle 
                                                cx={pt.cx} cy={pt.cy} r={hoveredIndex === pt.originalIndex ? 5 : 3.5} 
                                                fill={sData.color} 
                                                stroke="#ffffff" 
                                                class="stroke-2 cursor-pointer transition-all duration-150"
                                                onmouseenter={() => hoveredIndex = pt.originalIndex}
                                                onmouseleave={() => hoveredIndex = null}
                                                role="img"
                                                aria-label={`${pt.label} (${sData.name}): ${pt.value}`}
                                            />
                                            {#if showDataLabels && (seriesColumns.length === 1 || activeSeriesIndex === "all")}
                                                <text
                                                    x={pt.labelX}
                                                    y={pt.labelY}
                                                    text-anchor={pt.textAnchor}
                                                    dominant-baseline="middle"
                                                    class="text-[6.5px] font-mono font-bold select-none pointer-events-none fill-slate-700 dark:fill-slate-300"
                                                >
                                                    {formatDataLabel(pt.value, totalVal)}
                                                </text>
                                            {/if}
                                        {/each}
                                    {/each}

                                    <!-- Radar Axis Labels -->
                                    {#each radarLabels as rl}
                                        <text x={rl.x} y={rl.y} text-anchor={rl.textAnchor} dominant-baseline="middle" class="text-[7.5px] font-semibold fill-slate-500 dark:fill-slate-400">
                                            {rl.label}
                                        </text>
                                    {/each}
                                {/if}
                            </svg>
                        </div>

                        <!-- Multi-Series Series Switcher for Pie / Donut -->
                        {#if (chartType === "pie" || chartType === "donut") && seriesColumns.length > 1}
                            <div class="w-full pt-2 flex items-center justify-center gap-1.5 text-xs">
                                <span class="text-[10px] text-slate-400 font-semibold">展示指标:</span>
                                <button
                                    class="px-2 py-0.5 text-[10px] font-semibold rounded {activeSeriesIndex === 'all' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}"
                                    onclick={() => (activeSeriesIndex = "all")}
                                >全部汇总</button>
                                {#each seriesColumns as sCol, sIdx}
                                    <button
                                        class="px-2 py-0.5 text-[10px] font-semibold rounded {activeSeriesIndex === sIdx ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}"
                                        onclick={() => (activeSeriesIndex = sIdx)}
                                    >{sCol}</button>
                                {/each}
                            </div>
                        {/if}

                        <!-- Core Summary Stats Strip -->
                        {#if summaryStats}
                            <div class="w-full border-t border-slate-200/50 dark:border-slate-800/50 pt-2.5 mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[10px]">
                                <div class="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold">
                                    <Activity size={12} class="text-emerald-500" />
                                    <span>核心指标看板:</span>
                                </div>
                                <div class="flex flex-wrap items-center gap-3">
                                    <div class="flex items-center gap-1">
                                        <span class="text-slate-400">总计:</span>
                                        <span class="font-mono font-bold text-slate-800 dark:text-slate-200">{summaryStats.sum.toLocaleString()}</span>
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <span class="text-slate-400">系列均值:</span>
                                        <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">{summaryStats.avg}</span>
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <span class="text-slate-400">领跑项目:</span>
                                        <span class="font-mono font-bold text-sky-600 dark:text-sky-400">{summaryStats.topItem}</span>
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <span class="text-slate-400">峰值:</span>
                                        <span class="font-mono font-bold text-amber-600 dark:text-amber-400">{summaryStats.max.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        {/if}

                        <!-- Interactive Legend with Multi-Series and Category Support + Series Toggle -->
                        <div class="w-full border-t border-slate-200/50 dark:border-slate-800/50 pt-2.5 mt-2 flex flex-wrap gap-2 justify-center">
                            {#if chartType === "pie" || chartType === "donut"}
                                {#each activeChartData as d, i}
                                    {@const isHidden = hiddenIndexes.has(d.originalIndex)}
                                    {@const percentage = totalVal > 0 && !isHidden ? ((d.total / totalVal) * 100).toFixed(1) : '0'}
                                    <button
                                        onclick={() => toggleLegendItem(d.originalIndex)}
                                        onmouseenter={() => { if (!isHidden) hoveredIndex = d.originalIndex; }}
                                        onmouseleave={() => hoveredIndex = null}
                                        class="flex items-center gap-1.5 px-2 py-1 border rounded-sm text-[10px] font-semibold transition-all duration-150 {isHidden ? 'opacity-40 line-through' : 'bg-white/60 dark:bg-slate-900/60'}"
                                        title="点击切换可见性"
                                    >
                                        <span class="w-2 h-2 rounded-none" style="background-color: {themeColors[i % themeColors.length]}"></span>
                                        <span>{d.label}</span>
                                        <span class="font-mono text-slate-400 text-[9px]">({d.total.toLocaleString()})</span>
                                        <span class="text-emerald-500 font-bold">{percentage}%</span>
                                    </button>
                                {/each}
                            {:else}
                                <!-- Interactive Series Indicators with Visibility Toggle -->
                                {#each allSeriesColumns as sCol, sIdx}
                                    {@const isHidden = hiddenSeries.has(sCol)}
                                    <button
                                        onclick={() => toggleSeriesVisibility(sCol)}
                                        class="flex items-center gap-1.5 px-2 py-1 border border-slate-200/60 dark:border-slate-800/60 rounded text-[10px] font-semibold transition-all {isHidden ? 'opacity-40 bg-slate-100 dark:bg-slate-800 line-through' : 'bg-white/60 dark:bg-slate-900/60 shadow-xs'}"
                                        title="点击隐藏/显示此指标系列"
                                    >
                                        <span class="w-2 h-2 rounded-none" style="background-color: {themeColors[sIdx % themeColors.length]}"></span>
                                        <span>{sCol}</span>
                                        {#if isHidden}
                                            <EyeOff size={10} class="text-slate-400" />
                                        {:else}
                                            <Eye size={10} class="text-emerald-500" />
                                        {/if}
                                    </button>
                                {/each}
                            {/if}
                        </div>
                    </div>
                {:else}
                    <!-- Onboarding Empty State Card -->
                    <div class="text-center p-8 max-w-sm flex flex-col items-center justify-center h-full bg-white/20 dark:bg-slate-900/10 backdrop-blur-sm border border-dashed border-slate-200 dark:border-slate-800 rounded-sm">
                        <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-4 text-emerald-500 dark:text-emerald-400 shadow-inner">
                            <BarChart size={30} />
                        </div>
                        <h3 class="text-base font-bold text-slate-800 dark:text-slate-200 mb-1.5">准备生成图表</h3>
                        <p class="text-xs text-slate-400 dark:text-slate-500 mb-6 leading-relaxed">
                            请在左侧数据网格中输入数值，或直接点击下方内置示例一键导入体验：
                        </p>
                        <div class="flex flex-col gap-2 w-full">
                            <button 
                                onclick={() => loadPreset('monthly')}
                                class="w-full px-4 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/15 dark:hover:bg-emerald-950/30 rounded border border-emerald-200/50 dark:border-emerald-800/40 transition-all flex items-center justify-center gap-1.5"
                            >
                                📊 导入：月度运营与盈利 (多系列)
                            </button>
                            <button 
                                onclick={() => loadPreset('dev_perf')}
                                class="w-full px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/40 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-1.5"
                            >
                                ⚡ 导入：研发团队效能产出 (多系列)
                            </button>
                            <button 
                                onclick={() => loadPreset('resources')}
                                class="w-full px-4 py-2.5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/15 dark:hover:bg-amber-950/30 rounded border border-amber-200/50 dark:border-amber-800/40 transition-all flex items-center justify-center gap-1.5"
                            >
                                💰 导入：双季度预算分配 (多系列)
                            </button>
                            <button 
                                onclick={() => loadPreset('saas')}
                                class="w-full px-4 py-2.5 text-xs font-semibold text-sky-700 dark:text-sky-400 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/15 dark:hover:bg-sky-950/30 rounded border border-sky-200/50 dark:border-sky-800/40 transition-all flex items-center justify-center gap-1.5"
                            >
                                🚀 导入：SaaS 营运与获客 (多指标)
                            </button>
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Export Controls Panel -->
            <div class="p-3 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-wrap justify-between items-center z-10 gap-3 min-h-12 h-auto py-2">
                <div class="flex flex-wrap gap-2">
                    <Button variant="primary" size="sm" onclick={() => (showReportCardModal = true)} class="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm font-semibold text-xs py-1 px-3 rounded-sm flex items-center">
                        <Share2 size={12} class="mr-1.5" /> 生成汇报卡
                    </Button>
                    <Button variant="secondary" size="sm" onclick={downloadSVG} class="shadow-sm font-semibold text-xs py-1 px-2.5 rounded-sm">
                        <Download size={12} class="mr-1" /> 导出 SVG
                    </Button>
                    <Button variant="secondary" size="sm" onclick={downloadPNG} class="shadow-sm font-semibold text-xs py-1 px-2.5 rounded-sm">
                        <Download size={12} class="mr-1" /> 导出 PNG
                    </Button>
                    <Button variant="secondary" size="sm" onclick={copySVG} class="shadow-sm font-semibold text-xs py-1 px-2.5 rounded-sm flex items-center">
                        <Copy size={12} class="mr-1" /> 复制 SVG
                    </Button>
                    <Button variant="secondary" size="sm" onclick={copyMarkdownTable} class="shadow-sm font-semibold text-xs py-1 px-2.5 rounded-sm flex items-center text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/40">
                        <FileSpreadsheet size={12} class="mr-1" /> 复制 Markdown
                    </Button>
                    <Button variant="secondary" size="sm" onclick={downloadInteractiveHTML} class="shadow-sm font-semibold text-xs py-1 px-2.5 rounded-sm flex items-center text-slate-700 dark:text-slate-300 bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/60" title="导出包含交互效果的独立单文件 HTML">
                        <Code2 size={12} class="mr-1" /> 导出 HTML
                    </Button>
                    <Button variant="secondary" size="sm" onclick={downloadJSON} class="shadow-sm font-semibold text-xs py-1 px-2.5 rounded-sm flex items-center">
                        <Download size={12} class="mr-1" /> 导出 JSON
                    </Button>
                    <Button variant="secondary" size="sm" onclick={downloadCSV} class="shadow-sm font-semibold text-xs py-1 px-2.5 rounded-sm flex items-center">
                        <Download size={12} class="mr-1" /> 导出 CSV
                    </Button>
                </div>
                <span class="text-xs font-semibold {exportNotice ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} select-none">
                    {exportNotice ?? (activeChartData.length ? "提示：支持自定义颜色 • 环形图中心可点击切换统计维度" : "请先添加数据以启用导出")}
                </span>
            </div>
        </div>
    </div>
</div>

<!-- Executive Report Card Modal -->
{#if showReportCardModal}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        onclick={() => (showReportCardModal = false)}
        role="dialog"
    >
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
        <div
            class="bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-800 max-w-3xl w-full p-6 flex flex-col gap-4 overflow-hidden relative max-h-[92vh] overflow-y-auto"
            onclick={(e) => e.stopPropagation()}
        >
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Share2 size={16} />
                    </div>
                    <div>
                        <h2 class="text-sm font-bold">高品质汇报卡片 (Executive Report Card)</h2>
                        <p class="text-[11px] text-slate-400">定制标题、副标题、机构水印，一键复制或下载 2x 视网膜高清图</p>
                    </div>
                </div>
                <button
                    onclick={() => (showReportCardModal = false)}
                    class="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                >
                    <X size={16} />
                </button>
            </div>

            <!-- Report Card Metadata Inputs -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-800/40 p-3 rounded border border-slate-800 text-xs">
                <div>
                    <label class="block text-[10px] text-slate-400 mb-1" for="report-subtitle-input">副标题文案</label>
                    <input
                        id="report-subtitle-input"
                        type="text"
                        bind:value={reportSubtitle}
                        class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label class="block text-[10px] text-slate-400 mb-1" for="report-org-input">所属机构 / 团队水印</label>
                    <input
                        id="report-org-input"
                        type="text"
                        bind:value={reportOrganization}
                        class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label class="block text-[10px] text-slate-400 mb-1">卡片视觉风格</label>
                    <div class="flex gap-1">
                        <button
                            class="flex-1 py-1 rounded text-xs font-semibold flex items-center justify-center gap-1 {reportCardTheme === 'dark' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}"
                            onclick={() => (reportCardTheme = 'dark')}
                        >
                            <Moon size={11} /> 极夜黑
                        </button>
                        <button
                            class="flex-1 py-1 rounded text-xs font-semibold flex items-center justify-center gap-1 {reportCardTheme === 'light' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}"
                            onclick={() => (reportCardTheme = 'light')}
                        >
                            <Sun size={11} /> 亮白极简
                        </button>
                    </div>
                </div>
            </div>

            <!-- Report Card Canvas Preview -->
            <div
                bind:this={reportCardCanvasRef}
                class="w-full {reportCardTheme === 'light' ? 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 border-slate-300 text-slate-900' : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-slate-700/60 text-white'} border rounded-xl p-6 shadow-xl flex flex-col gap-4 relative overflow-hidden transition-colors"
            >
                <div class="flex items-start justify-between">
                    <div>
                        <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full {reportCardTheme === 'light' ? 'bg-slate-200 border border-slate-300 text-slate-800' : 'bg-slate-800 border border-slate-700 text-slate-300'} text-[10px] font-semibold mb-1.5">
                            <Activity size={10} /> 关键指标运营分析速报
                        </div>
                        <h3 class="text-lg font-bold tracking-tight {reportCardTheme === 'light' ? 'text-slate-900' : 'text-white'}">{chartTitle || "数据图表洞察速报"}</h3>
                        <p class="text-xs {reportCardTheme === 'light' ? 'text-slate-500' : 'text-slate-400'} mt-0.5">{reportSubtitle}</p>
                    </div>
                    <span class="text-[10px] font-mono {reportCardTheme === 'light' ? 'text-slate-500 border-slate-300 bg-white/80' : 'text-slate-500 border-slate-800 bg-slate-900/80'} border px-2 py-1 rounded">
                        {new Date().toLocaleDateString()}
                    </span>
                </div>

                <!-- Card Chart View -->
                <div class="w-full {reportCardTheme === 'light' ? 'bg-white/90 border-slate-200' : 'bg-slate-900/60 border-slate-800'} border rounded-lg p-3 flex items-center justify-center">
                    <svg viewBox="0 0 {svgViewWidth} {shouldRotateLabels ? 220 : 200}" class="w-full h-auto max-h-[220px]">
                        {#if svgRef}
                            {@html svgRef.innerHTML}
                        {/if}
                    </svg>
                </div>

                <!-- Footer Summary KPI Capsules -->
                {#if summaryStats}
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        <div class="{reportCardTheme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-slate-800/60 border-slate-700/40'} border rounded p-2 text-left">
                            <div class="text-[10px] {reportCardTheme === 'light' ? 'text-slate-500' : 'text-slate-400'}">总计汇总</div>
                            <div class="text-sm font-bold font-mono {reportCardTheme === 'light' ? 'text-slate-900' : 'text-white'}">{summaryStats.sum.toLocaleString()}</div>
                        </div>
                        <div class="{reportCardTheme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-slate-800/60 border-slate-700/40'} border rounded p-2 text-left">
                            <div class="text-[10px] {reportCardTheme === 'light' ? 'text-slate-500' : 'text-slate-400'}">系列均值</div>
                            <div class="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">{summaryStats.avg}</div>
                        </div>
                        <div class="{reportCardTheme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-slate-800/60 border-slate-700/40'} border rounded p-2 text-left">
                            <div class="text-[10px] {reportCardTheme === 'light' ? 'text-slate-500' : 'text-slate-400'}">领跑项目</div>
                            <div class="text-sm font-bold font-mono text-sky-600 dark:text-sky-400 truncate">{summaryStats.topItem}</div>
                        </div>
                        <div class="{reportCardTheme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-slate-800/60 border-slate-700/40'} border rounded p-2 text-left">
                            <div class="text-[10px] {reportCardTheme === 'light' ? 'text-slate-500' : 'text-slate-400'}">最高峰值</div>
                            <div class="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">{summaryStats.max.toLocaleString()}</div>
                        </div>
                    </div>
                {/if}

                <!-- Watermark -->
                <div class="flex items-center justify-between text-[10px] {reportCardTheme === 'light' ? 'text-slate-500 border-slate-300' : 'text-slate-500 border-slate-800/60'} border-t pt-2 mt-1">
                    <span>{reportOrganization} • Data Insights Executive Brief</span>
                    <span class="font-mono">High Fidelity SaaS Analytics</span>
                </div>
            </div>

            <div class="flex flex-wrap items-center justify-between pt-2 gap-2">
                <div class="text-xs text-slate-400">
                    提示：复制或下载卡片将以 2x 视网膜高清分辨率生成。
                </div>
                <div class="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onclick={() => (showReportCardModal = false)} class="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200">
                        关闭
                    </Button>
                    <Button variant="secondary" size="sm" onclick={copyReportCardImage} disabled={isExportingCard} class="border-emerald-700 bg-emerald-950/40 hover:bg-emerald-950/60 text-emerald-300 font-semibold flex items-center">
                        <Copy size={13} class="mr-1.5" />
                        {isExportingCard ? "处理中..." : "复制卡片图片"}
                    </Button>
                    <Button variant="primary" size="sm" onclick={exportReportCardPNG} disabled={isExportingCard} class="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center">
                        <Download size={13} class="mr-1.5" />
                        {isExportingCard ? "正在生成..." : "下载高清卡片 (PNG)"}
                    </Button>
                </div>
            </div>
        </div>
    </div>
{/if}
