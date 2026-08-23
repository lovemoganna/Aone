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
  import HandoffDropdown from "$lib/components/ui/HandoffDropdown.svelte";
  import { FORMAT_CONFIG, type TableData, type InputFormat, type OutputFormat, type StatusInfo } from "./lib/types";
  import { autoDetectAndParse, parseByFormat } from "./lib/parsers";
  import { toMarkdown, toCSV, toHTML, toOrgMode, toObjectJSON } from "./lib/converters";
  import { toExcelBlob } from "./lib/excel";
  import { generateSQL, type SQLDialect } from "./lib/sql";
  import ExportDropdown from "./components/ExportDropdown.svelte";
  import { Download, FileSpreadsheet, FileCode, FileText, Database } from "lucide-svelte";

  let inputValue = $state("");
  let inputFormat = $state<InputFormat>("auto");
  let tableData = $state<TableData>([]);
  let currentOutput = $state("");
  let currentFormat = $state<OutputFormat | null>(null);
  let activeRightTab = $state<"all" | "preview" | "converter" | "output">("all");
  let status = $state<StatusInfo>({
    text: "就绪。粘贴表格、上传文件或加载 SQL 模板开始。",
    type: "success",
  });
  let isProcessing = $state(false);
  let tableName = $state("data_table");
  let showDBModal = $state(false);
  let showFullscreen = $state(false);
  let selectedSQLDialect = $state<SQLDialect>("mysql");
  let history = $state<TableData[]>([]);
  let historyIndex = $state(-1);

  const outputFormats: OutputFormat[] = ["markdown", "csv", "json", "excel", "html", "orgmode", "sql-mysql", "sql-pg", "sql-duckdb"];

  const hasTable = $derived(tableData.length > 0);
  const hasOutput = $derived(currentOutput.trim().length > 0);
  const canUndo = $derived(historyIndex > 0);
  const canRedo = $derived(historyIndex < history.length - 1);
  const convertDisabledReason = $derived(
    isProcessing
      ? "解析仍在运行中。表格就绪后将解锁转换功能。"
      : "请在选择输出格式前先解析表格。",
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
    return `${bodyRows} 行数据和 ${columns} 列`;
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
      updateStatus("未找到表格行。请添加标题行和至少一行数据，然后重新解析。", "error");
      return false;
    }

    tableData = normalized;
    currentOutput = "";
    currentFormat = null;
    saveHistory();
    updateStatus(`已从 ${sourceLabel} 解析 ${describeTable(normalized)}。`, "success");
    return true;
  }

  async function handleFileLoad(content: string, filename: string) {
    inputValue = content;
    updateStatus(`已加载 ${filename}。正在解析表格...`, "warning");
    await handleParse();
  }

  async function handleParse() {
    if (!inputValue.trim()) {
      tableData = [];
      currentOutput = "";
      currentFormat = null;
      updateStatus("没有要解析的输入。请先粘贴表格数据或上传文件。", "error");
      return;
    }

    isProcessing = true;
    try {
      const parsed = inputFormat === "auto" ? autoDetectAndParse(inputValue) : { data: parseByFormat(inputValue, inputFormat), detectedFormat: inputFormat };
      const sourceLabel = inputFormat === "auto" ? `自动识别的 ${parsed.detectedFormat.toUpperCase()} 格式` : inputFormat.toUpperCase();
      setParsedTable(parsed.data, sourceLabel);
    } catch (error) {
      tableData = [];
      currentOutput = "";
      currentFormat = null;
      updateStatus(error instanceof Error ? error.message : "解析失败。请检查输入格式并重试。", "error");
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
    } catch (error) {
      currentOutput = "";
      updateStatus(error instanceof Error ? error.message : `无法转换为 ${FORMAT_CONFIG[format].label}。`, "error");
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
      updateStatus("已将转换后的输出复制到剪贴板。", "success");
    } catch {
      updateStatus("访问剪贴板失败。请选择输出文本并手动复制。", "error");
    }
  }

  function handleDownload() {
    if (!hasOutput || !currentFormat) {
      updateStatus("请在下载文本输出前先转换表格。", "error");
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
    updateStatus(`已成功下载 ${config.label} 输出文件 (${cleanTableName()}${config.ext})。`, "success");
  }

  async function handleDownloadExcel() {
    if (!hasTable) {
      updateStatus("请在下载 Excel 文件前先解析表格。", "error");
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
    } catch (error) {
      updateStatus(error instanceof Error ? error.message : `下载 ${FORMAT_CONFIG[format].label} 失败。`, "error");
    }
  }

  function handleDataChange(newData: TableData) {
    const normalized = normalizeParsedTable(newData);
    if (normalized.length === 0) {
      tableData = [];
      currentOutput = "";
      currentFormat = null;
      updateStatus("可编辑表格目前为空。", "warning");
      return;
    }

    saveHistory();
    tableData = normalized;
    if (currentFormat && currentFormat !== "excel") {
      handleConvert(currentFormat);
    } else {
      currentOutput = "";
    }
    updateStatus(`已将表格更新为 ${describeTable(normalized)}。`, "success");
  }

  function undo() {
    if (!canUndo) return;
    historyIndex--;
    tableData = JSON.parse(JSON.stringify(history[historyIndex]));
    currentOutput = "";
    updateStatus("已撤销上一次表格编辑。", "success");
  }

  function handleRedo() {
    if (!canRedo) return;
    historyIndex++;
    tableData = JSON.parse(JSON.stringify(history[historyIndex]));
    currentOutput = "";
    updateStatus("已重做表格编辑。", "success");
  }

  function handleDBTemplate() {
    const templates: Record<SQLDialect, string> = {
      mysql: `CREATE TABLE users (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  name VARCHAR(100) NOT NULL,\n  email VARCHAR(255) UNIQUE,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);`,
      postgresql: `CREATE TABLE products (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(200) NOT NULL,\n  price DECIMAL(10,2),\n  category VARCHAR(50),\n  in_stock BOOLEAN DEFAULT true\n);`,
      duckdb: `CREATE TABLE orders (\n  id INTEGER PRIMARY KEY,\n  customer_name VARCHAR NOT NULL,\n  product VARCHAR,\n  quantity INTEGER,\n  order_date DATE\n);`,
      sqlite: `CREATE TABLE orders (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  customer_name TEXT NOT NULL,\n  product TEXT,\n  quantity INTEGER,\n  order_date TEXT\n);`,
    };

    inputValue = templates[selectedSQLDialect];
    inputFormat = "auto";
    showDBModal = false;
    updateStatus(`已加载 ${selectedSQLDialect.toUpperCase()} SQL 模板。`, "success");
    handleParse();
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
      const parsedTables = files.map((file) => ({ file, parsed: autoDetectAndParse(file.content) }));
      const firstTable = normalizeParsedTable(parsedTables[0].parsed.data);

      if (firstTable.length === 0) {
        updateStatus(`第一个文件 ${parsedTables[0].file.filename} 未包含有效表格。`, "error");
        return;
      }

      const headers = firstTable[0];
      const mergedData: TableData = [headers, ...firstTable.slice(1)];
      const skipped: string[] = [];

      for (let i = 1; i < parsedTables.length; i++) {
        const normalized = normalizeParsedTable(parsedTables[i].parsed.data);
        const rowHeaders = normalized[0] ?? [];
        const sameHeader = headers.length === rowHeaders.length && headers.every((h, index) => h === rowHeaders[index]);

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

      const skippedSuffix = skipped.length ? ` 已跳过 ${skipped.length} 个表头不同的文件: ${skipped.join(", ")}。` : "";
      updateStatus(`已将 ${files.length - skipped.length} 个文件合并为 ${describeTable(mergedData)}。${skippedSuffix}`, skipped.length ? "warning" : "success");
    } catch (error) {
      updateStatus(error instanceof Error ? error.message : "批量导入失败。", "error");
    }
  }

  function handleDeduplicate() {
    if (!hasTable) {
      updateStatus("请在移除重复行前先解析表格。", "error");
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
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case "z":
          event.preventDefault();
          undo();
          break;
        case "y":
          event.preventDefault();
          handleRedo();
          break;
        case "s":
          event.preventDefault();
          handleDownload();
          break;
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<svelte:head>
  <title>表格编辑器 - Aone 工作台</title>
</svelte:head>

<div class="h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
  <div class="mx-auto max-w-7xl space-y-6">
    <!-- Header & Top Actions -->
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          表格编辑器
        </h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          多维数据表格解析、批量清洗与 CSV / Excel / SQL / JSON 双向互转
        </p>
      </div>

      <div class="flex items-center gap-1.5 flex-wrap justify-start sm:justify-end">
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
        <div class="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
        <Button variant="secondary" size="sm" onclick={undo} disabled={!canUndo} title="撤销表格编辑">撤销</Button>
        <Button variant="secondary" size="sm" onclick={handleRedo} disabled={!canRedo} title="重做表格编辑">重做</Button>
        <Button variant="secondary" size="sm" onclick={handleDeduplicate} disabled={!hasTable} title="移除重复数据行">数据去重</Button>
        <Button variant="secondary" size="sm" onclick={() => (showDBModal = true)} title="加载 SQL 样例数据">SQL 模板</Button>
      </div>
    </header>

    <!-- Discreet Status Banner -->
    <div
      class="rounded-lg border px-3.5 py-2 text-xs flex items-center justify-between gap-2 font-mono {status.type === 'error'
        ? 'border-red-200/80 bg-red-50/80 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300'
        : status.type === 'warning'
          ? 'border-amber-200/80 bg-amber-50/80 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300'
          : 'border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900 text-slate-600 dark:text-slate-300'}"
      role={status.type === "error" ? "alert" : "status"}
    >
      <div class="flex items-center gap-2 truncate">
        <span class="flex h-1.5 w-1.5 rounded-full {status.type === 'error' ? 'bg-red-500' : status.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}"></span>
        <span class="truncate">{status.text}</span>
      </div>
      <div class="hidden sm:flex items-center gap-2 shrink-0 text-[11px] text-slate-400">
        {#if hasTable}
          <span>{describeTable(tableData)}</span>
        {/if}
      </div>
    </div>

    <!-- Main Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <!-- Left Column: Input Source Section -->
      <section class="space-y-4">
        <!-- File Import Card -->
        <div class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              文件导入 (File Drop)
            </h2>
          </div>
          <FileDropZone onFileLoad={handleFileLoad} onBatchLoad={handleBatchLoad} />
        </div>

        <!-- Text Input Card -->
        <div class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              文本输入 (Raw Text)
            </h2>
          </div>
          <TextInputPane
            value={inputValue}
            inputFormat={inputFormat}
            {isProcessing}
            onValueChange={(value) => (inputValue = value)}
            onFormatChange={(format) => (inputFormat = format)}
            onParse={handleParse}
          />
        </div>
      </section>

      <!-- Right Column: Output & Transformation Section -->
      <section class="space-y-4">
        <!-- Sticky Export & Quick Action Bar -->
        {#if hasTable}
          <div class="sticky top-2 z-20 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 shadow-xs">
            <div class="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <div class="flex items-center gap-2">
                <span class="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                <span class="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  已解析表格 ({Math.max(0, tableData.length - 1)} 行 × {tableData[0]?.length || 0} 列)
                </span>
              </div>
              
              <!-- Quick View Switcher Tabs -->
              <div class="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md text-xs">
                <button
                  type="button"
                  onclick={() => (activeRightTab = "all")}
                  class="px-2 py-1 rounded transition-colors cursor-pointer {activeRightTab === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-2xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}"
                >
                  全部
                </button>
                <button
                  type="button"
                  onclick={() => (activeRightTab = "preview")}
                  class="px-2 py-1 rounded transition-colors cursor-pointer {activeRightTab === 'preview' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-2xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}"
                >
                  网格
                </button>
                <button
                  type="button"
                  onclick={() => (activeRightTab = "converter")}
                  class="px-2 py-1 rounded transition-colors cursor-pointer {activeRightTab === 'converter' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-2xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}"
                >
                  矩阵
                </button>
                <button
                  type="button"
                  onclick={() => (activeRightTab = "output")}
                  class="px-2 py-1 rounded transition-colors cursor-pointer {activeRightTab === 'output' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-2xs' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}"
                >
                  输出 {#if hasOutput}<span class="text-emerald-500 font-bold">•</span>{/if}
                </button>
              </div>
            </div>

            <!-- Direct 1-Click Fast Download Buttons (Restrained Engineering Palette) -->
            <div class="mt-2.5 flex items-center gap-1.5 flex-wrap">
              <span class="text-[11px] font-medium text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
                <Download class="h-3 w-3 text-slate-400" />
                直出:
              </span>
              <button
                type="button"
                onclick={() => downloadAsFormat("excel")}
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer"
                title="一键直接下载 Excel (.xlsx)"
              >
                <FileSpreadsheet class="h-3 w-3 text-emerald-500" />
                <span>Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onclick={() => downloadAsFormat("csv")}
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer"
                title="一键直接下载 CSV (.csv)"
              >
                <FileSpreadsheet class="h-3 w-3 text-slate-400" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onclick={() => downloadAsFormat("json")}
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer"
                title="一键直接下载 JSON (.json)"
              >
                <FileCode class="h-3 w-3 text-amber-500" />
                <span>JSON</span>
              </button>
              <button
                type="button"
                onclick={() => downloadAsFormat("markdown")}
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer"
                title="一键直接下载 Markdown (.md)"
              >
                <FileText class="h-3 w-3 text-slate-400" />
                <span>Markdown</span>
              </button>
              <button
                type="button"
                onclick={() => downloadAsFormat("sql-mysql")}
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer"
                title="一键直接下载 MySQL (.sql)"
              >
                <Database class="h-3 w-3 text-sky-500" />
                <span>MySQL</span>
              </button>
              <ExportDropdown
                disabled={!hasTable}
                tableName={cleanTableName()}
                onExport={downloadAsFormat}
                label="更多 ▾"
                size="sm"
              />
            </div>
          </div>
        {/if}

        {#if hasTable && (activeRightTab === "all" || activeRightTab === "preview")}
          <div class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
            <TablePreview
              data={tableData}
              tableName={cleanTableName()}
              onFullscreen={() => (showFullscreen = true)}
              onDataChange={handleDataChange}
              onExport={downloadAsFormat}
            />
          </div>
        {/if}

        {#if activeRightTab === "all" || activeRightTab === "converter"}
          <div class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3">
            <div class="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                转换设置 (Format Matrix)
              </h2>
              <div class="flex items-center gap-2">
                <label for="table-name" class="text-xs text-slate-500 dark:text-slate-400">表名:</label>
                <input
                  id="table-name"
                  bind:value={tableName}
                  placeholder="data_table"
                  class="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400"
                />
              </div>
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

        {#if activeRightTab === "all" || activeRightTab === "output"}
          {#if hasOutput}
            <div class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
              <OutputPane
                content={currentOutput}
                format={currentFormat}
                tableName={cleanTableName()}
                onCopy={handleCopy}
                onDownload={handleDownload}
                onDownloadOtherFormat={downloadAsFormat}
              />
            </div>
          {:else}
            <div class="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-8 text-center text-xs text-slate-400">
              {#if hasTable}
                在上方选择目标格式以预览或下载转换结果。
              {:else}
                解析输入后即可解锁多格式转换与预览。
              {/if}
            </div>
          {/if}
        {/if}
      </section>
    </div>

    <!-- SQL Template Modal -->
    {#if showDBModal}
      <div
        class="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
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
              <label class="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors text-xs text-slate-800 dark:text-slate-200">
                <input type="radio" bind:group={selectedSQLDialect} value={dialect} class="text-slate-900" />
                <span class="font-medium uppercase">{dialect}</span>
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

    <FullscreenPreview open={showFullscreen} data={tableData} onClose={() => (showFullscreen = false)} />
  </div>
</div>
