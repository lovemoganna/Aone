<script lang="ts">
    import { onMount } from "svelte";
    import ToolWorkspace from "$lib/components/layout/ToolWorkspace.svelte";
    import { Panel, Button, CodeEditor } from "$lib/components/ui";
    import HandoffDropdown from "$lib/components/ui/HandoffDropdown.svelte";
    import { dataBridge } from "$lib/stores/dataBridge";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { format as formatSQL } from "sql-formatter";
    import {
        type SupportedLanguage,
        type ExecutionResult,
        type MountedFile,
        type HistoryRecord,
        type SnippetTemplate,
        interpreterTemplates,
        executeDuckDBSQL,
        executePython,
        executeJavaScript
    } from "$lib/services/interpreter";
    import ConsoleOutput from "./components/ConsoleOutput.svelte";
    import ResultTableView from "./components/ResultTableView.svelte";
    import FileDatasetManager from "./components/FileDatasetManager.svelte";
    import HistoryDrawer from "./components/HistoryDrawer.svelte";
    import {
        Play,
        Loader2,
        Terminal,
        Database,
        Sparkles,
        Table as TableIcon,
        HardDrive,
        History as HistoryIcon,
        BookOpen,
        Code2,
        Copy,
        Check,
        Trash2,
        CheckCircle2,
        AlertTriangle,
        Clock,
        FileCode2,
        Layers,
        Cpu,
        Zap,
    } from "lucide-svelte";

    // State
    let activeLanguage = $state<SupportedLanguage>("sql");
    let activeSidebarTab = $state<"templates" | "datasets" | "history">("templates");
    let sidebarOpen = $state(true);

    let activeOutputTab = $state<"table" | "console">("table");
    let isExecuting = $state(false);

    // Code state for each language
    let sqlCode = $state(interpreterTemplates[0].code);
    let pythonCode = $state(interpreterTemplates[3].code);
    let jsCode = $state(interpreterTemplates[5].code);

    let currentCode = $derived.by(() => {
        if (activeLanguage === "sql") return sqlCode;
        if (activeLanguage === "python") return pythonCode;
        return jsCode;
    });

    function setCode(val: string) {
        if (activeLanguage === "sql") sqlCode = val;
        else if (activeLanguage === "python") pythonCode = val;
        else jsCode = val;
    }

    // Execution Result State
    let lastResult = $state<ExecutionResult | null>(null);
    let mountedFiles = $state<MountedFile[]>([]);
    let history = $state<HistoryRecord[]>([]);

    // Storage keys
    const HISTORY_STORAGE_KEY = "aone_interpreter_history";

    onMount(() => {
        // Load saved history
        try {
            const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
            if (saved) {
                history = JSON.parse(saved);
            }
        } catch (e) {}

        // Check incoming DataBridge handoff
        const handoff = dataBridge.consume("/code-interpreter");
        if (handoff) {
            if (handoff.dataType === "sql") {
                activeLanguage = "sql";
                sqlCode = handoff.payload;
                toastStore.success(`已载入来自「${handoff.sourceTool}」的 SQL 脚本`);
            } else if (handoff.dataType === "json" || handoff.dataType === "csv") {
                // If table or json received, switch to DuckDB or JS
                activeLanguage = "sql";
                sqlCode = `-- 接收来自 [${handoff.sourceTool}] 的 ${handoff.dataType.toUpperCase()} 数据\nSELECT * FROM (VALUES \n${handoff.payload}\n);`;
                toastStore.success(`已载入来自「${handoff.sourceTool}」的数据集`);
            }
        }

        // Global Keybinding: Cmd/Ctrl + Enter to run
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                runCode();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    });

    function saveHistory(record: HistoryRecord) {
        history = [record, ...history.slice(0, 49)];
        try {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        } catch (e) {}
    }

    async function runCode() {
        if (isExecuting) return;
        isExecuting = true;
        const codeToRun = currentCode;

        try {
            let res: ExecutionResult;
            if (activeLanguage === "sql") {
                res = await executeDuckDBSQL(codeToRun);
            } else if (activeLanguage === "python") {
                res = await executePython(codeToRun);
            } else {
                res = await executeJavaScript(codeToRun);
            }

            lastResult = res;

            // Auto-switch to table view if table results exist, else console view
            if (res.table && res.table.rows.length > 0) {
                activeOutputTab = "table";
            } else {
                activeOutputTab = "console";
            }

            // Save to history
            saveHistory({
                id: res.id,
                title: `${activeLanguage.toUpperCase()} 执行`,
                language: activeLanguage,
                code: codeToRun,
                status: res.status,
                durationMs: res.metrics.durationMs,
                rowCount: res.table?.rowCount,
                timestamp: Date.now()
            });

            if (res.status === "success") {
                toastStore.success(`${activeLanguage.toUpperCase()} 执行完成 (${res.metrics.durationMs}ms)`);
            } else {
                toastStore.error(`${activeLanguage.toUpperCase()} 执行异常: ${res.error || '未知错误'}`);
            }
        } catch (err: any) {
            toastStore.error(`运行时未捕获异常: ${err?.message || String(err)}`);
        } finally {
            isExecuting = false;
        }
    }

    function formatCode() {
        if (activeLanguage === "sql") {
            try {
                sqlCode = formatSQL(sqlCode, {
                    language: "sql",
                    keywordCase: "upper",
                    tabWidth: 4
                });
                toastStore.success("SQL 格式化完成");
            } catch (e) {
                toastStore.error("SQL 格式化失败，请检查语法");
            }
        } else {
            toastStore.info("当前语言格式化建议使用标准缩进");
        }
    }

    function applyTemplate(tpl: SnippetTemplate) {
        activeLanguage = tpl.language;
        if (tpl.language === "sql") sqlCode = tpl.code;
        else if (tpl.language === "python") pythonCode = tpl.code;
        else jsCode = tpl.code;
        toastStore.success(`已载入模版: ${tpl.title}`);
    }

    function toggleFavorite(recordId: string) {
        history = history.map(h => (h.id === recordId ? { ...h, favorite: !h.favorite } : h));
        try {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        } catch (e) {}
    }

    function clearHistory() {
        history = [];
        try {
            localStorage.removeItem(HISTORY_STORAGE_KEY);
        } catch (e) {}
        toastStore.success("已清空历史执行快照");
    }
</script>

<svelte:head>
    <title>代码解释器 (Code Interpreter) - Aone Toolkit</title>
</svelte:head>

<ToolWorkspace
    sidebarPosition="left"
    bind:sidebarOpen
    class="max-w-full"
>
    <!-- Header -->
    {#snippet header()}
        <div class="flex flex-wrap items-center justify-between gap-3 w-full">
            <!-- Left Info & Language Tabs -->
            <div class="flex items-center gap-3">
                <div class="flex items-center gap-2.5">
                    <div class="p-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs">
                        <Terminal size={16} />
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h1 class="font-semibold text-slate-900 dark:text-slate-100 text-xs">代码解释器</h1>
                            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                WASM Engine
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Language Switcher Tabs -->
                <div class="flex items-center p-0.5 bg-slate-100 dark:bg-slate-950 rounded-md border border-slate-200 dark:border-slate-800">
                    <button
                        onclick={() => (activeLanguage = "sql")}
                        class="px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer {activeLanguage === 'sql' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                    >
                        <Database size={12} />
                        <span>DuckDB SQL</span>
                    </button>

                    <button
                        onclick={() => (activeLanguage = "python")}
                        class="px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer {activeLanguage === 'python' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                    >
                        <FileCode2 size={12} />
                        <span>Python (Pyodide)</span>
                    </button>

                    <button
                        onclick={() => (activeLanguage = "javascript")}
                        class="px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer {activeLanguage === 'javascript' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                    >
                        <Code2 size={12} />
                        <span>JavaScript / TS</span>
                    </button>
                </div>
            </div>

            <!-- Right Actions Toolbar -->
            <div class="flex items-center gap-1.5">
                {#if activeLanguage === "sql"}
                    <button
                        onclick={formatCode}
                        class="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="美化 SQL 代码"
                    >
                        <Sparkles size={12} />
                        <span>格式化</span>
                    </button>
                {/if}

                <button
                    onclick={() => setCode("")}
                    class="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="清空编辑区"
                >
                    <Trash2 size={12} />
                    <span>清空</span>
                </button>

                <!-- Run Button -->
                <Button
                    variant="primary"
                    size="sm"
                    onclick={runCode}
                    disabled={isExecuting}
                    class="flex items-center gap-1.5 px-3 py-1 font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 shadow-2xs cursor-pointer"
                >
                    {#if isExecuting}
                        <Loader2 size={13} class="animate-spin" />
                        <span>运行中...</span>
                    {:else}
                        <Play size={12} class="fill-current" />
                        <span>运行</span>
                        <kbd class="hidden sm:inline-block px-1.5 py-0.2 ml-1 text-[10px] bg-slate-800 dark:bg-slate-200 text-slate-200 dark:text-slate-800 rounded font-mono">
                            ⌘↵
                        </kbd>
                    {/if}
                </Button>
            </div>
        </div>
    {/snippet}

    <!-- Left Sidebar: Templates / Datasets / History -->
    {#snippet sidebar()}
        <div class="h-full flex flex-col bg-white dark:bg-slate-900">
            <!-- Sidebar Tab Navigation -->
            <div class="grid grid-cols-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-1 gap-1">
                <button
                    onclick={() => (activeSidebarTab = "templates")}
                    class="py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer {activeSidebarTab === 'templates' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                >
                    <BookOpen size={12} />
                    <span>模版库</span>
                </button>

                <button
                    onclick={() => (activeSidebarTab = "datasets")}
                    class="py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer {activeSidebarTab === 'datasets' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                >
                    <HardDrive size={12} />
                    <span>数据集</span>
                </button>

                <button
                    onclick={() => (activeSidebarTab = "history")}
                    class="py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer {activeSidebarTab === 'history' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                >
                    <HistoryIcon size={12} />
                    <span>历史</span>
                </button>
            </div>

            <!-- Tab Content -->
            <div class="flex-1 overflow-hidden">
                {#if activeSidebarTab === "templates"}
                    <div class="h-full flex flex-col p-3 overflow-y-auto space-y-2">
                        <div class="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">精选算法与查询</span>
                            <span class="text-[10px] text-slate-400 font-mono">{interpreterTemplates.length} 个模版</span>
                        </div>

                        {#each interpreterTemplates as tpl (tpl.id)}
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div
                                onclick={() => applyTemplate(tpl)}
                                class="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 cursor-pointer space-y-1.5 transition-colors group shadow-2xs"
                            >
                                <div class="flex items-center justify-between">
                                    <span class="font-semibold text-xs text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                        {tpl.title}
                                    </span>
                                    <span class="px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300">
                                        {tpl.language}
                                    </span>
                                </div>
                                <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                    {tpl.description}
                                </p>
                                <div class="flex flex-wrap gap-1 pt-0.5">
                                    {#each tpl.tags as tag}
                                        <span class="px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px]">
                                            #{tag}
                                        </span>
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else if activeSidebarTab === "datasets"}
                    <FileDatasetManager
                        files={mountedFiles}
                        onFileMounted={(f) => (mountedFiles = [...mountedFiles, f])}
                        onFileRemoved={(id) => (mountedFiles = mountedFiles.filter(f => f.id !== id))}
                        onInsertQuery={(sql) => {
                            activeLanguage = "sql";
                            sqlCode = sql;
                            toastStore.success("已将查询语句填入编辑器");
                        }}
                    />
                {:else if activeSidebarTab === "history"}
                    <HistoryDrawer
                        {history}
                        onSelectHistory={(item) => {
                            activeLanguage = item.language;
                            setCode(item.code);
                            toastStore.success(`已恢复历史快照 (${item.language.toUpperCase()})`);
                        }}
                        onToggleFavorite={toggleFavorite}
                        onClearHistory={clearHistory}
                    />
                {/if}
            </div>
        </div>
    {/snippet}

    <!-- Central & Right Workspace -->
    <div class="h-full flex flex-col lg:flex-row min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
        <!-- Editor Left/Top Column (50%) -->
        <div class="flex-1 flex flex-col min-h-0 h-1/2 lg:h-full bg-white dark:bg-slate-900 overflow-hidden">
            <!-- Code Editor Banner -->
            <div class="px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-between text-xs text-slate-500 shrink-0">
                <div class="flex items-center gap-2">
                    <Code2 size={14} class="text-slate-500" />
                    <span class="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide text-xs">
                        {activeLanguage === 'sql' ? 'DuckDB SQL 脚本' : activeLanguage === 'python' ? 'Python 3 (CPython WASM)' : 'JavaScript / TypeScript Sandbox'}
                    </span>
                </div>
                <div class="flex items-center gap-2 text-[11px]">
                    <span>快捷键: <kbd class="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">⌘/Ctrl + Enter</kbd> 运行</span>
                </div>
            </div>

            <!-- CodeMirror 6 Code Editor -->
            <div class="flex-1 min-h-0 relative">
                {#if activeLanguage === "sql"}
                    <CodeEditor
                        bind:value={sqlCode}
                        language="sql"
                        placeholder="输入 DuckDB SQL 查询语句，例如: SELECT * FROM read_csv_auto('data.csv');"
                    />
                {:else if activeLanguage === "python"}
                    <CodeEditor
                        bind:value={pythonCode}
                        language="python"
                        placeholder="输入 Python 脚本，支持标准库与数据计算，返回 dict/list 将自动表格化渲染..."
                    />
                {:else}
                    <CodeEditor
                        bind:value={jsCode}
                        language="javascript"
                        placeholder="输入 JavaScript / TS 脚本，支持 async/await 与 console.table..."
                    />
                {/if}
            </div>

            <!-- Execution Status & Metrics Footer -->
            <div class="px-3 py-1.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between text-xs text-slate-500 shrink-0">
                <div class="flex items-center gap-3">
                    {#if lastResult}
                        <div class="flex items-center gap-1.5">
                            {#if lastResult.status === "success"}
                                <CheckCircle2 size={13} class="text-emerald-500" />
                                <span class="font-medium text-emerald-600 dark:text-emerald-400">执行成功</span>
                            {:else}
                                <AlertTriangle size={13} class="text-rose-500" />
                                <span class="font-medium text-rose-600 dark:text-rose-400">执行报错</span>
                            {/if}
                        </div>
                        <span class="flex items-center gap-1 text-slate-400">
                            <Clock size={12} />
                            <span>{lastResult.metrics.durationMs} ms</span>
                        </span>
                        {#if lastResult.table}
                            <span class="text-slate-400">
                                产出 {lastResult.table.rowCount} 行 × {lastResult.table.columns.length} 列
                            </span>
                        {/if}
                    {:else}
                        <span class="text-slate-400">就绪，等待执行</span>
                    {/if}
                </div>

                <div class="flex items-center gap-1 text-[11px] text-slate-400">
                    <Zap size={12} class="text-amber-500" />
                    <span>客户端纯本地计算 (Zero Server)</span>
                </div>
            </div>
        </div>

        <!-- Output Right/Bottom Column (50%) -->
        <div class="flex-1 flex flex-col min-h-0 h-1/2 lg:h-full bg-white dark:bg-slate-900 overflow-hidden">
            <!-- Output Tabs Header -->
            <div class="px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-between shrink-0">
                <div class="flex items-center gap-1">
                    <button
                        onclick={() => (activeOutputTab = "table")}
                        class="px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer {activeOutputTab === 'table' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs border border-slate-200/80 dark:border-slate-700/80' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                    >
                        <TableIcon size={12} />
                        <span>数据表格视图</span>
                        {#if lastResult?.table}
                            <span class="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px]">
                                {lastResult.table.rowCount}
                            </span>
                        {/if}
                    </button>

                    <button
                        onclick={() => (activeOutputTab = "console")}
                        class="px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer {activeOutputTab === 'console' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs border border-slate-200/80 dark:border-slate-700/80' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}"
                    >
                        <Terminal size={12} />
                        <span>控制台输出</span>
                        {#if lastResult?.logs && lastResult.logs.length > 0}
                            <span class="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px]">
                                {lastResult.logs.length}
                            </span>
                        {/if}
                    </button>
                </div>
            </div>

            <!-- Output Body -->
            <div class="flex-1 min-h-0 overflow-hidden relative">
                {#if activeOutputTab === "table"}
                    <ResultTableView
                        table={lastResult?.table || null}
                        queryTitle={`${activeLanguage.toUpperCase()} 解释器结果`}
                    />
                {:else}
                    <ConsoleOutput
                        logs={lastResult?.logs || []}
                        onClear={() => {
                            if (lastResult) {
                                lastResult = { ...lastResult, logs: [] };
                            }
                        }}
                    />
                {/if}
            </div>
        </div>
    </div>
</ToolWorkspace>
