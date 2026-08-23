<script lang="ts">
  import { onMount } from "svelte";
  import FileDropZone from "./components/FileDropZone.svelte";
  import TextInputPane from "./components/TextInputPane.svelte";
  import FormatConverter from "./components/FormatConverter.svelte";
  import OutputPane from "./components/OutputPane.svelte";
  import TablePreview from "./components/TablePreview.svelte";
  import FullscreenPreview from "./components/FullscreenPreview.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import { dataBridge } from "$lib/stores/dataBridge";
  import { toastStore } from "$lib/stores/toastStore.svelte";
  import HandoffDropdown from "$lib/components/ui/HandoffDropdown.svelte";
  import {
    FORMAT_CONFIG,
    type TableData,
    type InputFormat,
    type OutputFormat,
    type StatusInfo,
  } from "./lib/types";
  import { autoDetectAndParse, parseByFormat } from "./lib/parsers";
  import { toMarkdown, toCSV, toHTML, toOrgMode, toObjectJSON } from "./lib/converters";
  import { toExcelBlob } from "./lib/excel";
  import { generateSQL, type SQLDialect } from "./lib/sql";
  import ExportDropdown from "./components/ExportDropdown.svelte";
  import {
    Table2,
    Download,
    FileSpreadsheet,
    FileCode,
    FileText,
    Database,
    RotateCcw,
    RotateCw,
    Filter,
    Layers,
    SlidersHorizontal,
    Check,
    AlertCircle,
    Info,
    LayoutGrid,
    Eye,
    Code2,
    FileEdit,
    Upload,
  } from "lucide-svelte";

  let inputValue = $state("");
  let inputFormat = $state<InputFormat>("auto");
  let tableData = $state<TableData>([]);
  let currentOutput = $state("");
  let currentFormat = $state<OutputFormat | null>(null);
  let activeRightTab = $state<"all" | "preview" | "converter" | "output">("all");
  let leftInputTab = $state<"text" | "drop">("text");
  let status = $state<StatusInfo>({
    text: "就绪。粘贴表格、拖入文件或载入样例开始。",
    type: "success",
  });
  let isProcessing = $state(false);
  let tableName = $state("data_table");
  let showDBModal = $state(false);
  let showFullscreen = $state(false);
  let selectedSQLDialect = $state<SQLDialect>("mysql");
  let history = $state<TableData[]>([]);
  let historyIndex = $state(-1);

  const outputFormats: OutputFormat[] = [
    "excel",
    "csv",
    "json",
    "markdown",
    "html",
    "sql-mysql",
    "sql-pg",
    "sql-duckdb",
    "orgmode",
  ];

  const hasTable = $derived(tableData.length > 0);
  const hasOutput = $derived(currentOutput.trim().length > 0);
  const canUndo = $derived(historyIndex > 0);
  const canRedo = $derived(historyIndex < history.length - 1);
  const convertDisabledReason = $derived(
    isProcessing
      ? "解析仍在运行中。表格就绪后将解锁转换功能。"
      : "请先解析有效表格数据。",
  );

  onMount(() => {
    const handoff = dataBridge.consume("/table-editor");
    if (handoff && handoff.payload) {
      inputValue = handoff.payload;
      inputFormat = "auto";
      void handleParse();
      updateStatus(`已从 ${handoff.sourceTool} 载入表格数据并自动解析。`, "success");
    }
  });

  function updateStatus(text: string, type: StatusInfo["type"] = "success") {
    status = { text, type };
  }

  function cleanTableName() {
    return (tableName.trim() || "data_table").replace(/[^a-zA-Z0-9_-]/g, "_");
  }

  function sqlDialectForFormat(format: OutputFormat): SQLDialect {
    if (format === "sql-pg") return "postgresql";
    if (format === "sql-duckdb") return "duckdb";
    return "mysql";
  }

  function normalizeParsedTable(data: TableData): TableData {
    const rows = data
      .map((row) => row.map((cell) => String(cell ?? "").trim()))
      .filter((row) => row.some(Boolean));

    if (rows.length === 0) return [];

    const width = Math.max(...rows.map((row) => row.length));
    return rows.map((row) => [...row, ...Array(Math.max(0, width - row.length)).fill("")]);
  }

  function describeTable(data: TableData) {
    const bodyRows = Math.max(0, data.length - 1);
    const columns = data[0]?.length ?? 0;
    return `${bodyRows} 行 × ${columns} 列`;
  }

  function saveHistory() {
    if (tableData.length === 0) return;

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(tableData)));
    history = newHistory.slice(-50);
    historyIndex = history.length - 1;
  }

  function setParsedTable(data: TableData, sourceLabel: string) {
    const normalized = normalizeParsedTable(data);

    if (normalized.length === 0) {
      tableData = [];
      currentOutput = "";
      currentFormat = null;
      updateStatus("未找到有效表格行，请检查输入格式。", "error");
      toastStore.error("未找到有效表格数据");
      return false;
    }

    tableData = normalized;
    currentOutput = "";
    currentFormat = null;
    saveHistory();
    updateStatus(`已从 ${sourceLabel} 解析 ${describeTable(normalized)}。`, "success");
    toastStore.success(`成功解析表格 (${describeTable(normalized)})`);
    return true;
  }

  async function handleFileLoad(content: string, filename: string) {
    inputValue = content;
    leftInputTab = "text";
    updateStatus(`已加载 ${filename}，正在解析...`, "warning");
    await handleParse();
  }

  async function handleParse() {
    if (!inputValue.trim()) {
      tableData = [];
      currentOutput = "";
      currentFormat = null;
      updateStatus("没有要解析的输入。请先粘贴数据或上传文件。", "error");
      return;
    }

    isProcessing = true;
    try {
      const parsed =
        inputFormat === "auto"
          ? autoDetectAndParse(inputValue)
          : { data: parseByFormat(inputValue, inputFormat), detectedFormat: inputFormat };
      const sourceLabel =
        inputFormat === "auto"
          ? `自动识别的 ${parsed.detectedFormat.toUpperCase()} 格式`
          : inputFormat.toUpperCase();
      setParsedTable(parsed.data, sourceLabel);
    } catch (error) {
      tableData = [];
      currentOutput = "";
      currentFormat = null;
      const msg = error instanceof Error ? error.message : "解析失败。请检查输入格式。";
      updateStatus(msg, "error");
      toastStore.error(msg);
    } finally {
      isProcessing = false;
    }
  }

  async function handleConvert(format: OutputFormat) {
    if (!hasTable) {
      updateStatus("请在转换前先解析表格。", "error");
      return;
    }

    isProcessing = true;
    currentFormat = format;

    try {
      switch (format) {
        case "markdown":
          currentOutput = toMarkdown(tableData);
          break;
        case "csv":
          currentOutput = toCSV(tableData);
          break;
        case "html":
          currentOutput = toHTML(tableData);
          break;
        case "orgmode":
          currentOutput = toOrgMode(tableData);
          break;
        case "json":
          currentOutput = toObjectJSON(tableData);
          break;
        case "sql-mysql":
        case "sql-pg":
        case "sql-duckdb":
          currentOutput = generateSQL(tableData, sqlDialectForFormat(format), cleanTableName());
          break;
        case "excel":
          currentOutput = "";
          await handleDownloadExcel();
          return;
      }

      updateStatus(`已成功转换为 ${FORMAT_CONFIG[format].label}。`, "success");
      // Switch view to output tab if in mobile or dedicated mode
      if (activeRightTab === "converter") {
        activeRightTab = "all";
      }
    } catch (error) {
      currentOutput = "";
      updateStatus(
        error instanceof Error ? error.message : `无法转换为 ${FORMAT_CONFIG[format].label}。`,
        "error",
      );
    } finally {
      isProcessing = false;
    }
  }

  async function handleCopy() {
    if (!hasOutput) {
      updateStatus("尚无转换后的输出可供复制。", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(currentOutput);
      updateStatus("已复制转换后的输出到剪贴板。", "success");
    } catch {
      updateStatus("访问剪贴板失败，请手动复制。", "error");
    }
  }

  function handleDownload() {
    if (!hasOutput || !currentFormat) {
      updateStatus("请在下载前先转换表格。", "error");
      return;
    }

    const config = FORMAT_CONFIG[currentFormat];
    const blob = new Blob([currentOutput], { type: config.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cleanTableName()}${config.ext}`;
    a.click();
    URL.revokeObjectURL(url);
    updateStatus(`已成功下载 ${config.label} 文件 (${cleanTableName()}${config.ext})。`, "success");
    toastStore.success(`已下载 ${cleanTableName()}${config.ext}`);
  }

  async function handleDownloadExcel() {
    if (!hasTable) {
      updateStatus("请在下载 Excel 前先解析表格。", "error");
      return;
    }

    try {
      const blob = await toExcelBlob(tableData, cleanTableName());
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cleanTableName()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      currentFormat = "excel";
      updateStatus(`已成功下载 Excel 工作簿 (${cleanTableName()}.xlsx)。`, "success");
      toastStore.success(`已下载 ${cleanTableName()}.xlsx`);
    } catch (error) {
      updateStatus(error instanceof Error ? error.message : "无法创建 Excel 工作簿。", "error");
    }
  }

  async function downloadAsFormat(format: OutputFormat) {
    if (!hasTable) {
      updateStatus("请在下载前先解析表格。", "error");
      return;
    }

    if (format === "excel") {
      await handleDownloadExcel();
      return;
    }

    try {
      let outputText = "";
      switch (format) {
        case "markdown":
          outputText = toMarkdown(tableData);
          break;
        case "csv":
          outputText = toCSV(tableData);
          break;
        case "html":
          outputText = toHTML(tableData);
          break;
        case "orgmode":
          outputText = toOrgMode(tableData);
          break;
        case "json":
          outputText = toObjectJSON(tableData);
          break;
        case "sql-mysql":
        case "sql-pg":
        case "sql-duckdb":
          outputText = generateSQL(tableData, sqlDialectForFormat(format), cleanTableName());
          break;
      }

      const config = FORMAT_CONFIG[format];
      const blob = new Blob([outputText], { type: config.mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cleanTableName()}${config.ext}`;
      a.click();
      URL.revokeObjectURL(url);
      updateStatus(`已成功下载 ${config.label} 文件 (${cleanTableName()}${config.ext})。`, "success");
      toastStore.success(`已下载 ${cleanTableName()}${config.ext}`);
    } catch (error) {
      updateStatus(
        error instanceof Error ? error.message : `下载 ${FORMAT_CONFIG[format].label} 失败。`,
        "error",
      );
    }
  }

  function handleDataChange(newData: TableData) {
    const normalized = normalizeParsedTable(newData);
    if (normalized.length === 0) {
      tableData = [];
      currentOutput = "";
      currentFormat = null;
      updateStatus("表格数据为空。", "warning");
      return;
    }

    saveHistory();
    tableData = normalized;
    if (currentFormat && currentFormat !== "excel") {
      handleConvert(currentFormat);
    } else {
      currentOutput = "";
    }
    updateStatus(`已更新表格 (${describeTable(normalized)})。`, "success");
  }

  function undo() {
    if (!canUndo) return;
    historyIndex--;
    tableData = JSON.parse(JSON.stringify(history[historyIndex]));
    currentOutput = "";
    updateStatus("已撤销编辑。", "success");
    toastStore.info("已撤销上一次表格编辑");
  }

  function handleRedo() {
    if (!canRedo) return;
    historyIndex++;
    tableData = JSON.parse(JSON.stringify(history[historyIndex]));
    currentOutput = "";
    updateStatus("已重做编辑。", "success");
    toastStore.info("已重做表格编辑");
  }

  function handleDBTemplate() {
    const templates: Record<SQLDialect, string> = {
      mysql: `CREATE TABLE users (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  name VARCHAR(100) NOT NULL,\n  email VARCHAR(255) UNIQUE,\n  role VARCHAR(50) DEFAULT 'member',\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);`,
      postgresql: `CREATE TABLE products (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(200) NOT NULL,\n  price DECIMAL(10,2),\n  category VARCHAR(50),\n  in_stock BOOLEAN DEFAULT true\n);`,
      duckdb: `CREATE TABLE orders (\n  id INTEGER PRIMARY KEY,\n  customer_name VARCHAR NOT NULL,\n  product VARCHAR,\n  quantity INTEGER,\n  order_date DATE\n);`,
      sqlite: `CREATE TABLE tasks (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  title TEXT NOT NULL,\n  priority TEXT DEFAULT 'medium',\n  completed INTEGER DEFAULT 0\n);`,
    };

    inputValue = templates[selectedSQLDialect];
    inputFormat = "auto";
    leftInputTab = "text";
    showDBModal = false;
    updateStatus(`已载入 ${selectedSQLDialect.toUpperCase()} 模板。`, "success");
    handleParse();
  }

  function loadSampleData(type: "csv" | "markdown" | "html" | "sql") {
    const samples = {
      csv: `id,name,role,department,salary,status
1,Alice Zhang,Tech Lead,Engineering,28000,Active
2,Bob Li,Frontend Dev,Engineering,22000,Active
3,Charlie Chen,Product Manager,Product,25000,Active
4,David Wang,UI/UX Designer,Design,19000,Active
5,Eva Liu,Data Analyst,Data Science,24000,Active`,
      markdown: `| id | name | role | department | status |
| --- | --- | --- | --- | --- |
| 101 | Sarah Connor | Lead Ops | Infrastructure | Active |
| 102 | John Doe | Senior Engineer | Core Services | Active |
| 103 | Jane Smith | QA Architect | Quality Center | Active |
| 104 | Michael Brown | Security Lead | Cyber Security | Active |`,
      html: `<table>
  <thead>
    <tr><th>id</th><th>project</th><th>priority</th><th>owner</th><th>status</th></tr>
  </thead>
  <tbody>
    <tr><td>1</td><td>Aone Studio</td><td>High</td><td>Alex</td><td>In Progress</td></tr>
    <tr><td>2</td><td>Cloud Engine</td><td>Medium</td><td>Brian</td><td>Completed</td></tr>
    <tr><td>3</td><td>Security Audit</td><td>High</td><td>Cathy</td><td>In Progress</td></tr>
    <tr><td>4</td><td>Data Pipeline</td><td>Low</td><td>David</td><td>Planning</td></tr>
  </tbody>
</table>`,
      sql: `CREATE TABLE employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(50),
  role VARCHAR(50),
  join_date DATE
);`,
    };

    inputValue = samples[type];
    inputFormat = type === "sql" ? "auto" : (type as InputFormat);
    leftInputTab = "text";
    updateStatus(`已载入 ${type.toUpperCase()} 演示数据。`, "success");
    void handleParse();
  }

  function handleBatchLoad(files: { content: string; filename: string }[]) {
    if (files.length === 0) {
      updateStatus("未选择任何文件。", "error");
      return;
    }

    if (files.length === 1) {
      handleFileLoad(files[0].content, files[0].filename);
      return;
    }

    try {
      const parsedTables = files.map((file) => ({
        file,
        parsed: autoDetectAndParse(file.content),
      }));
      const firstTable = normalizeParsedTable(parsedTables[0].parsed.data);

      if (firstTable.length === 0) {
        updateStatus(`文件 ${parsedTables[0].file.filename} 未包含有效表格。`, "error");
        return;
      }

      const headers = firstTable[0];
      const mergedData: TableData = [headers, ...firstTable.slice(1)];
      const skipped: string[] = [];

      for (let i = 1; i < parsedTables.length; i++) {
        const normalized = normalizeParsedTable(parsedTables[i].parsed.data);
        const rowHeaders = normalized[0] ?? [];
        const sameHeader =
          headers.length === rowHeaders.length &&
          headers.every((h, index) => h === rowHeaders[index]);

        if (!sameHeader) {
          skipped.push(parsedTables[i].file.filename);
          continue;
        }

        mergedData.push(...normalized.slice(1));
      }

      inputValue = toCSV(mergedData);
      inputFormat = "csv";
      tableData = mergedData;
      currentOutput = "";
      currentFormat = null;
      saveHistory();

      const skippedSuffix = skipped.length
        ? ` (跳过 ${skipped.length} 个表头不匹配的文件)`
        : "";
      updateStatus(
        `已将 ${files.length - skipped.length} 个文件合并为 ${describeTable(mergedData)}。${skippedSuffix}`,
        skipped.length ? "warning" : "success",
      );
      toastStore.success(`成功合并 ${files.length - skipped.length} 个文件`);
    } catch (error) {
      updateStatus(error instanceof Error ? error.message : "批量导入失败。", "error");
    }
  }

  function handleDeduplicate() {
    if (!hasTable) {
      updateStatus("请在去重前先解析表格。", "error");
      return;
    }

    saveHistory();
    const seen = new Set<string>();
    const header = tableData[0];
    const uniqueRows = tableData.slice(1).filter((row) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const removed = tableData.length - 1 - uniqueRows.length;
    tableData = [header, ...uniqueRows];
    currentOutput = "";
    updateStatus(`已成功移除 ${removed} 行重复数据。`, removed > 0 ? "success" : "warning");
    toastStore.info(removed > 0 ? `已移除 ${removed} 行重复数据` : "未发现重复数据行");
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey) {
      if (event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if (event.key === "y" || (event.key === "z" && event.shiftKey)) {
        event.preventDefault();
        handleRedo();
      } else if (event.key === "s") {
        event.preventDefault();
        if (hasOutput) {
          handleDownload();
        } else if (hasTable) {
          downloadAsFormat("csv");
        }
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<svelte:head>
  <title>表格编辑器 - Aone 工作台</title>
</svelte:head>

<div class="h-full flex flex-col p-3 sm:p-4 gap-3 overflow-hidden bg-slate-50 dark:bg-slate-950">
  <div
    class="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden"
  >
    <!-- Top Engineering Toolbar Header -->
    <header
      class="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4 shrink-0 bg-white dark:bg-slate-900"
    >
      <div class="flex items-center gap-3 min-w-0">
        <div
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          <Table2 class="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div class="flex items-center gap-2.5 min-w-0">
          <h1 class="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            表格编辑器
          </h1>

          <div class="flex items-center gap-1.5 text-xs font-mono">
            {#if hasTable}
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50"
              >
                <Check class="h-3 w-3" />
                <span>{describeTable(tableData)}</span>
              </span>
            {:else}
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              >
                <Info class="h-3 w-3" />
                <span>等待数据输入</span>
              </span>
            {/if}
          </div>
        </div>
      </div>

      <!-- Actions Toolbar -->
      <div class="flex items-center gap-1.5 flex-wrap justify-end">
        <!-- History Controls -->
        <div class="flex items-center gap-1 p-0.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-md">
          <button
            type="button"
            onclick={undo}
            disabled={!canUndo}
            class="p-1 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-700 transition-colors"
            title="撤销 (Ctrl+Z)"
          >
            <RotateCcw class="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onclick={handleRedo}
            disabled={!canRedo}
            class="p-1 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-700 transition-colors"
            title="重做 (Ctrl+Y)"
          >
            <RotateCw class="h-3.5 w-3.5" />
          </button>
        </div>

        <div class="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5"></div>

        <!-- Data Tools -->
        <button
          type="button"
          onclick={handleDeduplicate}
          disabled={!hasTable}
          class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md text-slate-700 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="移除重复数据行"
        >
          <Filter class="h-3 w-3 text-slate-400" />
          <span>数据去重</span>
        </button>

        <button
          type="button"
          onclick={() => (showDBModal = true)}
          class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md text-slate-700 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors cursor-pointer"
          title="加载 SQL 建表模板样例"
        >
          <Database class="h-3 w-3 text-sky-500" />
          <span>SQL 模板</span>
        </button>

        <div class="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5"></div>

        <!-- Export & Handoff -->
        <ExportDropdown
          disabled={!hasTable}
          tableName={cleanTableName()}
          onExport={downloadAsFormat}
          label="导出文件"
          size="sm"
        />

        <HandoffDropdown
          sourceTool="表格编辑器"
          dataType="csv"
          getData={() => (hasTable ? toCSV(tableData) : inputValue)}
        />
      </div>
    </header>

    <!-- Main Workspace Body (Two-Column Responsive Split Grid) -->
    <div class="flex-1 overflow-y-auto p-3 sm:p-4">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start h-full">
        <!-- Left Column: Input Source Section (5 cols) -->
        <section class="lg:col-span-5 flex flex-col gap-3">
          <div
            class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-2xs space-y-3"
          >
            <!-- Left Input Switcher Tabs -->
            <div class="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
              <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md">
                <button
                  type="button"
                  onclick={() => (leftInputTab = "text")}
                  class="flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer {leftInputTab ===
                  'text'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}"
                >
                  <FileEdit class="h-3 w-3" />
                  <span>文本粘贴</span>
                </button>
                <button
                  type="button"
                  onclick={() => (leftInputTab = "drop")}
                  class="flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer {leftInputTab ===
                  'drop'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}"
                >
                  <Upload class="h-3 w-3" />
                  <span>文件导入</span>
                </button>
              </div>

              <!-- Table Name Setting -->
              <div class="flex items-center gap-1.5">
                <label for="table-name" class="text-[11px] text-slate-400 font-mono">表名:</label>
                <input
                  id="table-name"
                  bind:value={tableName}
                  placeholder="data_table"
                  class="w-24 px-1.5 py-0.5 text-xs rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <!-- Left Panel Content -->
            {#if leftInputTab === "text"}
              <TextInputPane
                value={inputValue}
                inputFormat={inputFormat}
                {isProcessing}
                onValueChange={(value) => (inputValue = value)}
                onFormatChange={(format) => (inputFormat = format)}
                onParse={handleParse}
                onSampleLoad={loadSampleData}
              />
            {:else}
              <FileDropZone
                onFileLoad={handleFileLoad}
                onBatchLoad={handleBatchLoad}
                onSampleLoad={loadSampleData}
              />
            {/if}
          </div>
        </section>

        <!-- Right Column: Output & Transformation Section (7 cols) -->
        <section class="lg:col-span-7 flex flex-col gap-3">
          <!-- Fast Direct Download & View Switcher Bar -->
          {#if hasTable}
            <div
              class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs space-y-2.5"
            >
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-1.5">
                  <span class="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    一键直出
                  </span>
                </div>

                <!-- Right View Tabs -->
                <div class="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md text-xs">
                  <button
                    type="button"
                    onclick={() => (activeRightTab = "all")}
                    class="px-2 py-0.5 rounded transition-colors cursor-pointer {activeRightTab ===
                    'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}"
                  >
                    全部
                  </button>
                  <button
                    type="button"
                    onclick={() => (activeRightTab = "preview")}
                    class="px-2 py-0.5 rounded transition-colors cursor-pointer {activeRightTab ===
                    'preview'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}"
                  >
                    网格
                  </button>
                  <button
                    type="button"
                    onclick={() => (activeRightTab = "converter")}
                    class="px-2 py-0.5 rounded transition-colors cursor-pointer {activeRightTab ===
                    'converter'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}"
                  >
                    矩阵
                  </button>
                  <button
                    type="button"
                    onclick={() => (activeRightTab = "output")}
                    class="px-2 py-0.5 rounded transition-colors cursor-pointer {activeRightTab ===
                    'output'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}"
                  >
                    输出 {#if hasOutput}<span class="text-emerald-500 font-bold">•</span>{/if}
                  </button>
                </div>
              </div>

              <!-- Quick direct download buttons -->
              <div class="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onclick={() => downloadAsFormat("excel")}
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-emerald-950/40 dark:text-slate-300 dark:hover:text-emerald-300 border border-slate-200/80 hover:border-emerald-300 dark:border-slate-800 transition-colors cursor-pointer"
                  title="一键下载 Excel (.xlsx)"
                >
                  <FileSpreadsheet class="h-3 w-3 text-emerald-500" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onclick={() => downloadAsFormat("csv")}
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 dark:bg-slate-800 dark:hover:bg-blue-950/40 dark:text-slate-300 dark:hover:text-blue-300 border border-slate-200/80 hover:border-blue-300 dark:border-slate-800 transition-colors cursor-pointer"
                  title="一键下载 CSV (.csv)"
                >
                  <FileSpreadsheet class="h-3 w-3 text-blue-500" />
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  onclick={() => downloadAsFormat("json")}
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-700 dark:bg-slate-800 dark:hover:bg-amber-950/40 dark:text-slate-300 dark:hover:text-amber-300 border border-slate-200/80 hover:border-amber-300 dark:border-slate-800 transition-colors cursor-pointer"
                  title="一键下载 JSON (.json)"
                >
                  <FileCode class="h-3 w-3 text-amber-500" />
                  <span>JSON</span>
                </button>
                <button
                  type="button"
                  onclick={() => downloadAsFormat("markdown")}
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 dark:bg-slate-800 dark:hover:bg-indigo-950/40 dark:text-slate-300 dark:hover:text-indigo-300 border border-slate-200/80 hover:border-indigo-300 dark:border-slate-800 transition-colors cursor-pointer"
                  title="一键下载 Markdown (.md)"
                >
                  <FileText class="h-3 w-3 text-indigo-500" />
                  <span>Markdown</span>
                </button>
                <button
                  type="button"
                  onclick={() => downloadAsFormat("sql-mysql")}
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 dark:bg-slate-800 dark:hover:bg-sky-950/40 dark:text-slate-300 dark:hover:text-sky-300 border border-slate-200/80 hover:border-sky-300 dark:border-slate-800 transition-colors cursor-pointer"
                  title="一键下载 MySQL (.sql)"
                >
                  <Database class="h-3 w-3 text-sky-500" />
                  <span>MySQL</span>
                </button>
              </div>
            </div>
          {/if}

          <!-- Editable Table Preview Card -->
          {#if hasTable && (activeRightTab === "all" || activeRightTab === "preview")}
            <div
              class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-2xs"
            >
              <TablePreview
                data={tableData}
                tableName={cleanTableName()}
                onFullscreen={() => (showFullscreen = true)}
                onDataChange={handleDataChange}
                onExport={downloadAsFormat}
              />
            </div>
          {/if}

          <!-- Format Matrix Card -->
          {#if activeRightTab === "all" || activeRightTab === "converter"}
            <div
              class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-2xs space-y-2.5"
            >
              <div class="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <h2 class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  转换矩阵 (Format Matrix)
                </h2>
                <span class="text-[11px] text-slate-400">点击转换预览，或点击卡片右侧直接下载</span>
              </div>

              <FormatConverter
                formats={outputFormats}
                activeFormat={currentFormat}
                disabled={!hasTable || isProcessing}
                disabledReason={convertDisabledReason}
                onConvert={handleConvert}
                onDownloadFormat={downloadAsFormat}
              />
            </div>
          {/if}

          <!-- Output Preview Card -->
          {#if activeRightTab === "all" || activeRightTab === "output"}
            {#if hasOutput}
              <div
                class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-2xs"
              >
                <OutputPane
                  content={currentOutput}
                  format={currentFormat}
                  tableName={cleanTableName()}
                  onCopy={handleCopy}
                  onDownload={handleDownload}
                  onDownloadOtherFormat={downloadAsFormat}
                />
              </div>
            {:else if !hasTable}
              <div
                class="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 p-8 text-center text-xs text-slate-400"
              >
                在左侧粘贴或上传表格并点击“解析表格”以开始。
              </div>
            {/if}
          {/if}
        </section>
      </div>
    </div>

    <!-- Bottom Engineering Status Bar -->
    <footer
      class="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between gap-3 text-xs font-mono shrink-0"
    >
      <div class="flex items-center gap-2 truncate">
        <span
          class="flex h-1.5 w-1.5 rounded-full {status.type === 'error'
            ? 'bg-red-500'
            : status.type === 'warning'
              ? 'bg-amber-500'
              : 'bg-emerald-500'}"
        ></span>
        <span class="truncate text-slate-600 dark:text-slate-300">{status.text}</span>
      </div>

      <div class="hidden sm:flex items-center gap-3 shrink-0 text-[11px] text-slate-400">
        {#if hasTable}
          <span>{describeTable(tableData)}</span>
          <span>•</span>
        {/if}
        <span>Ctrl+Enter 解析</span>
        <span>•</span>
        <span>Ctrl+Z/Y 撤销重做</span>
      </div>
    </footer>
  </div>

  <!-- SQL Template Modal -->
  {#if showDBModal}
    <div
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100"
      onclick={() => (showDBModal = false)}
      role="presentation"
    >
      <div
        class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 max-w-sm w-full shadow-xl space-y-4"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="db-template-title"
        tabindex="-1"
      >
        <div class="flex items-center justify-between">
          <h3 id="db-template-title" class="text-sm font-semibold text-slate-900 dark:text-slate-100">
            加载 SQL 样例模板
          </h3>
          <button
            type="button"
            onclick={() => (showDBModal = false)}
            class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            关闭
          </button>
        </div>

        <div class="space-y-2">
          {#each ["mysql", "postgresql", "duckdb", "sqlite"] as dialect}
            <label
              class="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors text-xs text-slate-800 dark:text-slate-200"
            >
              <input
                type="radio"
                bind:group={selectedSQLDialect}
                value={dialect}
                class="text-indigo-600 focus:ring-indigo-500"
              />
              <span class="font-medium uppercase">{dialect} 模板</span>
            </label>
          {/each}
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" size="sm" onclick={() => (showDBModal = false)}>取消</Button>
          <Button size="sm" onclick={handleDBTemplate}>载入模板</Button>
        </div>
      </div>
    </div>
  {/if}

  <FullscreenPreview
    open={showFullscreen}
    data={tableData}
    onClose={() => (showFullscreen = false)}
  />
</div>
