<script lang="ts">
    import FileDropZone from "./components/FileDropZone.svelte";
    import TextInputPane from "./components/TextInputPane.svelte";
    import TablePreview from "./components/TablePreview.svelte";
    import FormatConverter from "./components/FormatConverter.svelte";
    import OutputPane from "./components/OutputPane.svelte";
    import FullscreenPreview from "./components/FullscreenPreview.svelte";
    import { Button } from "$lib/components/ui";

    import type {
        TableData,
        InputFormat,
        OutputFormat,
        StatusInfo,
    } from "./lib/types";
    import { FORMAT_CONFIG } from "./lib/types";
    import { autoDetectAndParse, parseByFormat } from "./lib/parsers";
    import { toMarkdown, toCSV, toHTML, toOrgMode } from "./lib/converters";
    import { toExcelBlob } from "./lib/excel";
    import { generateSQL, type SQLDialect } from "./lib/sql";

    // State
    let inputValue = $state("");
    let inputFormat = $state<InputFormat>("auto");
    let tableData = $state<TableData>([]);
    let currentOutput = $state("");
    let currentFormat = $state<OutputFormat | null>(null);
    let isProcessing = $state(false);
    let fullscreenOpen = $state(false);
    let shortcutsOpen = $state(false);

    // DB Designer State
    let tableName = $state("abnormal_spot_events");

    // History for undo
    let history = $state<{ input: string; data: TableData }[]>([]);
    let historyIndex = $state(-1);

    // Status
    let status = $state<StatusInfo>({ text: "就绪", type: "success" });

    // Derived
    let hasTable = $derived(tableData.length > 0);
    let hasOutput = $derived(currentOutput.length > 0);
    let canUndo = $derived(historyIndex > 0);
    let canRedo = $derived(historyIndex < history.length - 1);

    // Actions
    function handleFileLoad(content: string, filename: string) {
        inputValue = content;
        handleParse();
    }

    function handleParse() {
        if (!inputValue.trim()) {
            updateStatus("请输入表格数据或上传文件", "error");
            return;
        }

        isProcessing = true;
        updateStatus("解析中...", "warning");

        try {
            // Save to history
            saveHistory();

            // Parse based on format
            let result: TableData;
            if (inputFormat === "auto") {
                const parseResult = autoDetectAndParse(inputValue);
                result = parseResult.data;
            } else {
                result = parseByFormat(inputValue, inputFormat);
            }

            if (result.length === 0) {
                throw new Error("未能解析出有效的表格数据");
            }

            tableData = result;
            currentOutput = "";
            currentFormat = null;
            updateStatus("解析成功", "success");
        } catch (e) {
            updateStatus(
                `解析失败: ${e instanceof Error ? e.message : "未知错误"}`,
                "error",
            );
        } finally {
            isProcessing = false;
        }
    }

    function handleConvert(format: OutputFormat) {
        if (tableData.length === 0) return;

        try {
            let output = "";
            switch (format) {
                case "markdown":
                    output = toMarkdown(tableData);
                    break;
                case "csv":
                    output = toCSV(tableData);
                    break;
                case "html":
                    output = toHTML(tableData);
                    break;
                case "orgmode":
                    output = toOrgMode(tableData);
                    break;
                case "excel":
                    // Excel is handled differently (direct download)
                    handleDownloadExcel();
                    return;
                case "sql-mysql":
                    output = generateSQL(tableData, "mysql", tableName);
                    break;
                case "sql-pg":
                    output = generateSQL(tableData, "postgresql", tableName);
                    break;
                case "sql-duckdb":
                    output = generateSQL(tableData, "duckdb", tableName);
                    break;
            }

            currentOutput = output;
            currentFormat = format;
            updateStatus(`已转换为 ${FORMAT_CONFIG[format].label}`, "success");
        } catch (e) {
            updateStatus(
                `转换失败: ${e instanceof Error ? e.message : "未知错误"}`,
                "error",
            );
        }
    }

    function handleCopy() {
        if (!currentOutput) return;
        navigator.clipboard
            .writeText(currentOutput)
            .then(() => {
                updateStatus("已复制到剪贴板", "success");
            })
            .catch(() => {
                updateStatus("复制失败", "error");
            });
    }

    function handleDownload() {
        if (!currentOutput || !currentFormat) return;

        const config = FORMAT_CONFIG[currentFormat];
        const blob = new Blob([currentOutput], { type: config.mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `table${config.ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        updateStatus(`已下载 table${config.ext}`, "success");
    }

    function handleDownloadExcel() {
        try {
            const blob = toExcelBlob(tableData);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "table.xlsx";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            currentFormat = "excel";
            updateStatus("已下载 table.xlsx", "success");
        } catch (e) {
            updateStatus(
                `Excel导出失败: ${e instanceof Error ? e.message : "未知错误"}`,
                "error",
            );
        }
    }

    function saveHistory() {
        history = [
            ...history.slice(0, historyIndex + 1),
            { input: inputValue, data: [...tableData] },
        ];
        historyIndex = history.length - 1;
    }

    function handleUndo() {
        if (historyIndex > 0) {
            historyIndex--;
            const prev = history[historyIndex];
            inputValue = prev.input;
            tableData = prev.data;
            currentOutput = "";
            currentFormat = null;
            updateStatus("已撤销", "success");
        }
    }

    function handleDataChange(newData: TableData) {
        saveHistory();
        tableData = newData;
        currentOutput = "";
        currentFormat = null;
        updateStatus("表格已更新", "success");
    }

    function handleRedo() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            const next = history[historyIndex];
            inputValue = next.input;
            tableData = next.data;
            currentOutput = "";
            currentFormat = null;
            updateStatus("已重做", "success");
        }
    }

    function handleDBTemplate() {
        saveHistory();
        // Standard Schema Template
        tableData = [
            ["Field", "Type", "Length", "PK", "NotNull", "Comment"],
            ["event_id", "BIGINT", "", "Y", "Y", "Primary Event ID"],
            ["symbol", "VARCHAR", "32", "", "Y", "Trading Symbol"],
            ["created_at", "DATETIME", "", "", "Y", "Creation Time"],
        ];

        // Update input to reflect new table (using CSV format)
        inputValue = toCSV(tableData);
        inputFormat = "csv";
        tableName = "abnormal_spot_events";

        updateStatus("已应用数据库设计模板 (v2)", "success");
    }

    function handleBatchLoad(files: { content: string; filename: string }[]) {
        if (files.length === 0) return;

        if (files.length === 1) {
            handleFileLoad(files[0].content, files[0].filename);
            return;
        }

        updateStatus("正在合并文件...", "warning");

        try {
            let mergedData: TableData = [];
            let headers: string[] = [];
            let successCount = 0;
            let skipCount = 0;

            for (let i = 0; i < files.length; i++) {
                const parseResult = autoDetectAndParse(files[i].content);
                const data = parseResult.data;

                if (data.length === 0) {
                    skipCount++;
                    continue;
                }

                if (i === 0) {
                    headers = data[0];
                    mergedData = [...data]; // Header + Rows
                    successCount++;
                } else {
                    // Check headers
                    if (JSON.stringify(data[0]) === JSON.stringify(headers)) {
                        mergedData.push(...data.slice(1));
                        successCount++;
                    } else {
                        skipCount++;
                        console.warn(
                            `File ${files[i].filename} headers mismatch`,
                        );
                    }
                }
            }

            if (successCount > 0) {
                // Convert merged data to CSV for consistency and editability
                const csvContent = toCSV(mergedData);
                inputValue = csvContent;
                inputFormat = "csv";

                // Trigger parse to update tableData from inputValue (ensures consistency)
                handleParse();

                updateStatus(
                    `成功合并 ${successCount} 个文件 (跳过 ${skipCount} 个)`,
                    "success",
                );
            } else {
                updateStatus("未找到可合并的有效文件", "error");
            }
        } catch (e) {
            updateStatus("合并失败: " + (e as Error).message, "error");
        }
    }

    function handleDeduplicate() {
        if (tableData.length <= 1) return;

        saveHistory();
        const header = tableData[0];
        const body = tableData.slice(1);

        const seen = new Set();
        const uniqueBody = [];

        for (const row of body) {
            const rowStr = JSON.stringify(row);
            if (!seen.has(rowStr)) {
                seen.add(rowStr);
                uniqueBody.push(row);
            }
        }

        const removed = body.length - uniqueBody.length;
        if (removed > 0) {
            tableData = [header, ...uniqueBody];
            currentOutput = "";
            // Update input value to reflect deduped data, keeping CSV format for consistency
            inputValue = toCSV(tableData);
            inputFormat = "csv";
            updateStatus(`已移除 ${removed} 行重复数据`, "success");
        } else {
            updateStatus("未发现重复数据", "success");
        }
    }

    function updateStatus(text: string, type: "success" | "warning" | "error") {
        status = { text, type };
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                handleUndo();
            }
            if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
                e.preventDefault();
                handleRedo();
            }
        }
        if (e.key === "F11" && hasTable) {
            e.preventDefault();
            fullscreenOpen = !fullscreenOpen;
        }
        if (e.key === "?" && e.target !== document.querySelector("textarea")) {
            e.preventDefault();
            shortcutsOpen = !shortcutsOpen;
        }
    }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="container">
    <!-- Header -->
    <header class="header">
        <h1>全能表格转换器</h1>
        <p class="subtitle">
            专业级表格格式转换工具 - 支持 HTML、Markdown、CSV、Excel
        </p>
    </header>

    <!-- Status & Toolbar -->
    <div class="toolbar">
        <div class="status-indicator status-{status.type}">
            {status.text}
        </div>
        <div class="toolbar-group">
            <Button
                variant="ghost"
                size="sm"
                onclick={() => (shortcutsOpen = true)}
                title="快捷键帮助 (?)"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" x2="12.01" y1="17" y2="17" />
                </svg>
                帮助
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onclick={handleUndo}
                disabled={!canUndo}
                title="撤销 (Ctrl+Z)"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path d="M3 7v6h6" />
                    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                </svg>
                撤销
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onclick={handleRedo}
                disabled={!canRedo}
                title="重做 (Ctrl+Y)"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path d="M21 7v6h-6" />
                    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
                </svg>
                重做
            </Button>
            <div class="separator"></div>
            <Button
                variant="ghost"
                size="sm"
                onclick={handleDeduplicate}
                disabled={!hasTable}
                title="移除重复行"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6" />
                    <path d="M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                去重
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onclick={handleDBTemplate}
                title="新建数据库设计模板"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path d="M4 6h16" />
                    <path d="M4 12h16" />
                    <path d="M4 18h16" />
                    <circle cx="2" cy="6" r="1" fill="currentColor" />
                    <circle cx="2" cy="12" r="1" fill="currentColor" />
                    <circle cx="2" cy="18" r="1" fill="currentColor" />
                </svg>
                DB设计
            </Button>
            <div class="separator"></div>
        </div>
    </div>

    <!-- Input Area -->
    <div class="grid-2">
        <div class="card">
            <h2>📁 文件输入</h2>
            <FileDropZone onBatchLoad={handleBatchLoad} />
        </div>
        <div class="card">
            <h2>📝 文本输入</h2>
            <TextInputPane
                value={inputValue}
                {inputFormat}
                {isProcessing}
                onParse={handleParse}
                onValueChange={(v) => (inputValue = v)}
                onFormatChange={(f) => (inputFormat = f)}
            />
        </div>
    </div>

    <!-- Table Preview -->
    {#if hasTable}
        <div class="card">
            <TablePreview
                data={tableData}
                onFullscreen={() => (fullscreenOpen = true)}
                onDataChange={handleDataChange}
            />
        </div>

        <!-- Format Converter -->
        <div class="card">
            <div
                style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;"
            >
                <label for="tableName" style="font-weight: 500;"
                    >表名 (Table Name):</label
                >
                <input
                    id="tableName"
                    type="text"
                    bind:value={tableName}
                    style="padding: 0.25rem 0.5rem; border: 1px solid var(--border-color, #d1d5db); border-radius: 0.25rem;"
                    placeholder="Enter table name"
                />
            </div>
            <FormatConverter
                disabled={!hasTable}
                activeFormat={currentFormat}
                onConvert={handleConvert}
            />
        </div>
    {/if}

    <!-- Output -->
    {#if hasOutput}
        <div class="card">
            <OutputPane
                content={currentOutput}
                format={currentFormat}
                onCopy={handleCopy}
                onDownload={handleDownload}
            />
        </div>
    {/if}

    <!-- Fullscreen Preview -->
    <FullscreenPreview
        open={fullscreenOpen}
        data={tableData}
        onClose={() => (fullscreenOpen = false)}
    />

    <!-- Shortcuts Modal -->
    {#if shortcutsOpen}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="modal-overlay" onclick={() => (shortcutsOpen = false)}>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="shortcuts-panel" onclick={(e) => e.stopPropagation()}>
                <div class="shortcuts-header">
                    <h3>⌨️ 快捷键</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onclick={() => (shortcutsOpen = false)}
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <line x1="18" x2="6" y1="6" y2="18" />
                            <line x1="6" x2="18" y1="6" y2="18" />
                        </svg>
                    </Button>
                </div>
                <div class="shortcuts-grid">
                    <div class="shortcut">
                        <span>粘贴数据</span><kbd>Ctrl+V</kbd>
                    </div>
                    <div class="shortcut">
                        <span>全屏预览</span><kbd>F11</kbd>
                    </div>
                    <div class="shortcut">
                        <span>退出全屏</span><kbd>Esc</kbd>
                    </div>
                    <div class="shortcut">
                        <span>撤销操作</span><kbd>Ctrl+Z</kbd>
                    </div>
                    <div class="shortcut">
                        <span>重做操作</span><kbd>Ctrl+Y</kbd>
                    </div>
                    <div class="shortcut">
                        <span>显示帮助</span><kbd>?</kbd>
                    </div>
                    <div class="shortcut">
                        <span>编辑单元格</span><kbd>双击</kbd>
                    </div>
                    <div class="shortcut">
                        <span>行列操作</span><kbd>右键</kbd>
                    </div>
                    <div class="shortcut">
                        <span>点击表头</span><kbd>排序</kbd>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .header {
        text-align: center;
        margin-bottom: 0.5rem;
    }

    .header h1 {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        background: linear-gradient(135deg, #5d5cde, #8b5cf6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .subtitle {
        color: #6b7280;
        font-size: 1.125rem;
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
        gap: 0.5rem;
    }

    .separator {
        width: 1px;
        height: 1.5rem;
        background-color: var(--border-color, #d1d5db);
        margin: 0 0.25rem;
    }

    :global(.dark) .separator {
        background-color: #4b5563;
    }

    .status-indicator {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
    }

    .status-success {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
    }

    .status-warning {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
    }

    .status-error {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
    }

    .grid-2 {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
    }

    @media (max-width: 768px) {
        .grid-2 {
            grid-template-columns: 1fr;
        }
    }

    .card {
        background: var(--bg-primary, #ffffff);
        border-radius: 0.75rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        padding: 1.5rem;
        border: 1px solid transparent;
        transition: all 0.3s ease;
    }

    :global(.dark) .card {
        background: #1f2937;
        border-color: #4b5563;
    }

    .card:hover {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        transform: translateY(-1px);
    }

    .card h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--text-primary, #111827);
    }

    :global(.dark) .card h2 {
        color: #f9fafb;
    }

    /* Shortcuts Modal */
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1001;
    }

    .shortcuts-panel {
        background: var(--bg-primary, #ffffff);
        border: 1px solid var(--border-color, #d1d5db);
        border-radius: 0.75rem;
        padding: 1.5rem;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        min-width: 300px;
    }

    :global(.dark) .shortcuts-panel {
        background: #1f2937;
        border-color: #4b5563;
    }

    .shortcuts-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .shortcuts-header h3 {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0;
    }

    .shortcuts-grid {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .shortcut {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.25rem 0;
    }

    kbd {
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        padding: 0.125rem 0.5rem;
        font-family: monospace;
        font-size: 0.75rem;
    }

    :global(.dark) kbd {
        background: #374151;
        border-color: #4b5563;
    }
</style>
