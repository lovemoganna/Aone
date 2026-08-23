<script lang="ts">
    import { onMount } from "svelte";
    import ToolWorkspace from "$lib/components/layout/ToolWorkspace.svelte";
    import { CodeEditor } from "$lib/components/ui";
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
        type QueryTab,
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
        Trash2,
        CheckCircle2,
        AlertTriangle,
        Clock,
        FileCode2,
        WrapText,
        Maximize2,
        Minimize2,
        Copy,
        Check,
        Plus,
        X,
        GripVertical
    } from "lucide-svelte";

    // Storage Keys
    const TABS_STORAGE_KEY = "aone_interpreter_tabs";
    const HISTORY_STORAGE_KEY = "aone_interpreter_history";
    const SPLIT_STORAGE_KEY = "aone_interpreter_split";

    // Templates default code
    const defaultSqlTemplate = interpreterTemplates.find(t => t.language === "sql")?.code || "SELECT 'Hello DuckDB WASM' AS message, 42 AS answer;";
    const defaultPythonTemplate = interpreterTemplates.find(t => t.language === "python")?.code || "import math\n\ndata = [{'x': i, 'sin': round(math.sin(i * 0.2), 4), 'cos': round(math.cos(i * 0.2), 4)} for i in range(20)]\ndata";
    const defaultJsTemplate = interpreterTemplates.find(t => t.language === "javascript")?.code || "const items = Array.from({ length: 15 }, (_, i) => ({\n    id: i + 1,\n    title: `Task #${i + 1}`,\n    status: i % 2 === 0 ? 'completed' : 'pending',\n    timestamp: new Date(Date.now() - i * 3600000).toISOString()\n}));\nitems;";

    // Multi-tabs State
    let tabs = $state<QueryTab[]>([
        { id: "tab_sicp_01", title: "01. 表达式与求值", language: "python", code: interpreterTemplates[0]?.code || "" },
        { id: "tab_sicp_02", title: "02. 过程抽象", language: "python", code: interpreterTemplates[1]?.code || "" },
        { id: "tab_sicp_09", title: "09. 闭包与词法作用域", language: "javascript", code: interpreterTemplates[8]?.code || "" }
    ]);
    let activeTabId = $state<string>("tab_sicp_01");
    let editingTabId = $state<string | null>(null);
    let editingTabTitle = $state("");

    let activeTab = $derived(tabs.find(t => t.id === activeTabId) || tabs[0]);
    let activeLanguage = $derived(activeTab?.language || "sql");

    // Sidebar & Split Pane State
    let activeSidebarTab = $state<"templates" | "datasets" | "history">("templates");
    let templateFilter = $state<"all" | "sql" | "python" | "javascript">("all");
    let sidebarOpen = $state(false);

    let splitPercent = $state(50);
    let isDraggingSplit = $state(false);
    let containerRef = $state<HTMLElement | null>(null);

    let activeOutputTab = $state<"table" | "console">("table");
    let isExecuting = $state(false);
    let lineWrapping = $state(true);
    let isZenMode = $state(false);
    let isCopiedCode = $state(false);
    let isMac = $state(false);

    // Filtered templates for sidebar
    let filteredTemplates = $derived.by(() => {
        if (templateFilter === "all") return interpreterTemplates;
        return interpreterTemplates.filter(t => t.language === templateFilter);
    });

    // Execution Result State
    let lastResult = $state<ExecutionResult | null>(null);
    let mountedFiles = $state<MountedFile[]>([]);
    let history = $state<HistoryRecord[]>([]);

    let editorPlaceholder = $derived.by(() => {
        if (activeLanguage === "sql") {
            return "输入 DuckDB SQL 查询语句，例如: SELECT * FROM read_csv_auto('data.csv');";
        }
        if (activeLanguage === "python") {
            return "输入 Python 脚本，支持标准库与数据计算，返回 dict/list 将自动解析为表格...";
        }
        return "输入 JavaScript / TS 脚本，支持 async/await 与 console.table，返回数组将自动解析...";
    });

    onMount(() => {
        isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

        // Load saved split
        try {
            const savedSplit = localStorage.getItem(SPLIT_STORAGE_KEY);
            if (savedSplit) {
                const parsed = parseFloat(savedSplit);
                if (!isNaN(parsed) && parsed >= 20 && parsed <= 80) splitPercent = parsed;
            }
        } catch (e) {}

        // Load saved tabs
        try {
            const savedTabs = localStorage.getItem(TABS_STORAGE_KEY);
            if (savedTabs) {
                const parsedTabs = JSON.parse(savedTabs);
                if (Array.isArray(parsedTabs) && parsedTabs.length > 0) {
                    tabs = parsedTabs;
                    activeTabId = parsedTabs[0].id;
                }
            }
        } catch (e) {}

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
                const newTab: QueryTab = {
                    id: `tab_${Date.now()}`,
                    title: `Handoff (${handoff.sourceTool})`,
                    language: "sql",
                    code: handoff.payload
                };
                tabs = [...tabs, newTab];
                activeTabId = newTab.id;
                toastStore.success(`已载入来自「${handoff.sourceTool}」的 SQL 脚本`);
            } else if (handoff.dataType === "json" || handoff.dataType === "csv") {
                const generated = `-- 接收来自 [${handoff.sourceTool}] 的 ${handoff.dataType.toUpperCase()} 数据\nSELECT * FROM (VALUES \n${handoff.payload}\n);`;
                const newTab: QueryTab = {
                    id: `tab_${Date.now()}`,
                    title: `Dataset (${handoff.sourceTool})`,
                    language: "sql",
                    code: generated
                };
                tabs = [...tabs, newTab];
                activeTabId = newTab.id;
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

    function saveTabs() {
        try {
            localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabs));
        } catch (e) {}
    }

    function createNewTab(lang: SupportedLanguage = "sql") {
        const count = tabs.filter(t => t.language === lang).length + 1;
        const langLabel = lang === "sql" ? "Query" : lang === "python" ? "Py" : "JS";
        const defaultCode = lang === "sql" ? defaultSqlTemplate : lang === "python" ? defaultPythonTemplate : defaultJsTemplate;
        const newTab: QueryTab = {
            id: `tab_${Date.now()}`,
            title: `${langLabel} ${count}`,
            language: lang,
            code: defaultCode
        };
        tabs = [...tabs, newTab];
        activeTabId = newTab.id;
        saveTabs();
    }

    function closeTab(tabId: string, event: MouseEvent) {
        event.stopPropagation();
        if (tabs.length <= 1) return;
        const idx = tabs.findIndex(t => t.id === tabId);
        tabs = tabs.filter(t => t.id !== tabId);
        if (activeTabId === tabId) {
            const nextIdx = Math.max(0, idx - 1);
            activeTabId = tabs[nextIdx].id;
        }
        saveTabs();
    }

    function startRenameTab(tab: QueryTab, event: MouseEvent) {
        event.stopPropagation();
        editingTabId = tab.id;
        editingTabTitle = tab.title;
    }

    function finishRenameTab() {
        if (editingTabId && editingTabTitle.trim()) {
            tabs = tabs.map(t => t.id === editingTabId ? { ...t, title: editingTabTitle.trim() } : t);
            saveTabs();
        }
        editingTabId = null;
    }

    function changeActiveTabLanguage(lang: SupportedLanguage) {
        tabs = tabs.map(t => t.id === activeTabId ? { ...t, language: lang } : t);
        saveTabs();
    }

    function updateActiveCode(newCode: string) {
        tabs = tabs.map(t => t.id === activeTabId ? { ...t, code: newCode } : t);
        saveTabs();
    }

    function saveHistory(record: HistoryRecord) {
        history = [record, ...history.slice(0, 49)];
        try {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        } catch (e) {}
    }

    async function runCode() {
        if (isExecuting || !activeTab) return;
        isExecuting = true;
        const codeToRun = activeTab.code;
        const lang = activeTab.language;

        try {
            let res: ExecutionResult;
            if (lang === "sql") {
                res = await executeDuckDBSQL(codeToRun);
            } else if (lang === "python") {
                res = await executePython(codeToRun);
            } else {
                res = await executeJavaScript(codeToRun);
            }

            lastResult = res;

            if (res.table && res.table.rows.length > 0) {
                activeOutputTab = "table";
            } else {
                activeOutputTab = "console";
            }

            saveHistory({
                id: res.id,
                title: `${lang.toUpperCase()} - ${activeTab.title}`,
                language: lang,
                code: codeToRun,
                status: res.status,
                durationMs: res.metrics.durationMs,
                rowCount: res.table?.rowCount,
                timestamp: Date.now()
            });

            if (res.status === "success") {
                toastStore.success(`${lang.toUpperCase()} 执行完成 (${res.metrics.durationMs}ms)`);
            } else {
                toastStore.error(`${lang.toUpperCase()} 执行异常: ${res.error || '未知错误'}`);
            }
        } catch (err: any) {
            toastStore.error(`运行时未捕获异常: ${err?.message || String(err)}`);
        } finally {
            isExecuting = false;
        }
    }

    function formatCode() {
        if (!activeTab) return;
        if (activeTab.language === "sql") {
            try {
                const formatted = formatSQL(activeTab.code, {
                    language: "sql",
                    keywordCase: "upper",
                    tabWidth: 4
                });
                updateActiveCode(formatted);
                toastStore.success("SQL 格式化完成");
            } catch (e) {
                toastStore.error("SQL 格式化失败，请检查语法");
            }
        } else if (activeTab.language === "javascript") {
            try {
                const lines = activeTab.code.split("\n");
                let indent = 0;
                const formatted = lines.map(line => {
                    const trimmed = line.trim();
                    if (trimmed.endsWith("}") || trimmed.endsWith("]") || trimmed.endsWith(");")) {
                        indent = Math.max(0, indent - 1);
                    }
                    const result = "    ".repeat(indent) + trimmed;
                    if (trimmed.endsWith("{") || trimmed.endsWith("[") || trimmed.endsWith("(")) {
                        indent++;
                    }
                    return result;
                }).join("\n");
                updateActiveCode(formatted);
                toastStore.success("JavaScript 代码整理完成");
            } catch (e) {
                toastStore.error("整理失败");
            }
        } else {
            const lines = activeTab.code.split("\n");
            const formatted = lines.map(l => l.replace(/\t/g, "    ").trimEnd()).join("\n");
            updateActiveCode(formatted);
            toastStore.success("Python 缩进规范化完成");
        }
    }

    function applyTemplate(tpl: SnippetTemplate) {
        const shortTitle = tpl.title.replace(/\s*\([^)]*\)$/, "").trim();
        const newTab: QueryTab = {
            id: `tab_${Date.now()}`,
            title: shortTitle,
            language: tpl.language,
            code: tpl.code
        };
        tabs = [...tabs, newTab];
        activeTabId = newTab.id;
        saveTabs();
        toastStore.success(`已载入「${shortTitle}」并在新标签页打开`);
    }

    function toggleFavorite(recordId: string) {
        history = history.map(h => (h.id === recordId ? { ...h, favorite: !h.favorite } : h));
        try {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        } catch (e) {}
    }

    async function copyCurrentCode() {
        if (!activeTab?.code) return;
        const ok = await copyToClipboard(activeTab.code);
        if (ok) {
            isCopiedCode = true;
            toastStore.success("代码已复制到剪贴板");
            setTimeout(() => (isCopiedCode = false), 2000);
        }
    }

    function clearHistory() {
        history = [];
        try {
            localStorage.removeItem(HISTORY_STORAGE_KEY);
        } catch (e) {}
        toastStore.success("已清空历史执行快照");
    }

    // Split pane drag handlers
    function handleSplitterMouseDown(e: MouseEvent) {
        e.preventDefault();
        isDraggingSplit = true;
        const onMouseMove = (moveEvent: MouseEvent) => {
            if (!containerRef) return;
            const rect = containerRef.getBoundingClientRect();
            const rawPercent = ((moveEvent.clientX - rect.left) / rect.width) * 100;
            splitPercent = Math.min(80, Math.max(20, Math.round(rawPercent)));
        };
        const onMouseUp = () => {
            isDraggingSplit = false;
            try {
                localStorage.setItem(SPLIT_STORAGE_KEY, String(splitPercent));
            } catch (e) {}
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    }
</script>

<svelte:head>
    <title>代码解释器 (Code Interpreter) - Aone 工作台</title>
</svelte:head>

<ToolWorkspace
    sidebarPosition="left"
    bind:sidebarOpen
    class="max-w-none w-full h-full !min-h-0 !p-1.5 !space-y-0"
>
    <!-- Header (Clean, Zero Clutter) -->
    {#snippet header()}
        <div class="flex items-center justify-between gap-2 sm:gap-3 flex-1 min-w-0">
            <!-- Left Info & Language Switcher -->
            <div class="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
                <div class="flex items-center gap-1.5 shrink-0">
                    <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
                        <Terminal size={14} class="stroke-[2.2]" />
                    </div>
                    <h1 class="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight hidden md:block">
                        代码解释器
                    </h1>
                </div>

                <!-- Language Segmented Toggle for Active Tab -->
                <div class="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800/90 rounded-lg border border-slate-200/70 dark:border-slate-700/60 shadow-2xs">
                    <button
                        type="button"
                        onclick={() => changeActiveTabLanguage("sql")}
                        class="py-1 px-2 sm:px-2.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer {activeLanguage === 'sql' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}"
                    >
                        <Database size={12} class="text-slate-400" />
                        <span>DuckDB SQL</span>
                    </button>

                    <button
                        type="button"
                        onclick={() => changeActiveTabLanguage("python")}
                        class="py-1 px-2 sm:px-2.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer {activeLanguage === 'python' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}"
                    >
                        <FileCode2 size={12} class="text-slate-400" />
                        <span>Python</span>
                    </button>

                    <button
                        type="button"
                        onclick={() => changeActiveTabLanguage("javascript")}
                        class="py-1 px-2 sm:px-2.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer {activeLanguage === 'javascript' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}"
                    >
                        <Code2 size={12} class="text-slate-400" />
                        <span>JS / TS</span>
                    </button>
                </div>
            </div>

            <!-- Right Actions: Run & Tools -->
            <div class="flex items-center gap-1.5 shrink-0 font-sans">
                <!-- Run Primary Button (Placed First) -->
                <button
                    type="button"
                    onclick={runCode}
                    disabled={isExecuting}
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white active:scale-[0.98] transition-all cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    title="运行代码 ({isMac ? '⌘ + Enter' : 'Ctrl + Enter'})"
                >
                    {#if isExecuting}
                        <Loader2 size={12} class="animate-spin text-slate-400" />
                        <span>计算中...</span>
                    {:else}
                        <Play size={11} class="fill-emerald-400 text-emerald-400 dark:fill-emerald-600 dark:text-emerald-600 shrink-0" />
                        <span>运行</span>
                    {/if}
                </button>

                <!-- Format Button -->
                <button
                    type="button"
                    onclick={formatCode}
                    class="px-2.5 py-1 rounded-md border border-slate-200/80 dark:border-slate-700/70 bg-white dark:bg-slate-800/90 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                    title="格式化与整理当前代码"
                >
                    <Sparkles size={12} class="text-slate-400" />
                    <span>格式化</span>
                </button>

                <!-- Clear Button -->
                <button
                    type="button"
                    onclick={() => updateActiveCode("")}
                    class="px-2.5 py-1 rounded-md border border-slate-200/80 dark:border-slate-700/70 bg-white dark:bg-slate-800/90 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                    title="清空当前代码"
                >
                    <Trash2 size={12} class="text-slate-400" />
                    <span>清空</span>
                </button>
            </div>
        </div>
    {/snippet}

    <!-- Left Sidebar: Templates / Datasets / History -->
    {#snippet sidebar()}
        <div class="h-full flex flex-col bg-white dark:bg-slate-900 w-full overflow-hidden">
            <!-- Sidebar Tab Segmented Control -->
            <div class="p-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
                <div class="grid grid-cols-3 p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg w-full">
                    <button
                        type="button"
                        onclick={() => (activeSidebarTab = "templates")}
                        class="py-1 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate {activeSidebarTab === 'templates' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}"
                    >
                        <BookOpen size={12} class="shrink-0" />
                        <span class="truncate">模版库</span>
                    </button>

                    <button
                        type="button"
                        onclick={() => (activeSidebarTab = "datasets")}
                        class="py-1 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate {activeSidebarTab === 'datasets' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}"
                    >
                        <HardDrive size={12} class="shrink-0" />
                        <span class="truncate">数据集</span>
                    </button>

                    <button
                        type="button"
                        onclick={() => (activeSidebarTab = "history")}
                        class="py-1 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate {activeSidebarTab === 'history' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}"
                    >
                        <HistoryIcon size={12} class="shrink-0" />
                        <span class="truncate">历史</span>
                    </button>
                </div>
            </div>

            <!-- Tab Content -->
            <div class="flex-1 min-h-0 overflow-hidden">
                {#if activeSidebarTab === "templates"}
                    <div class="h-full flex flex-col p-3 overflow-y-auto space-y-2.5 scrollbar-thin">
                        <div class="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
                            <div class="flex items-center gap-1">
                                <button
                                    type="button"
                                    onclick={() => (templateFilter = "all")}
                                    class="px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer {templateFilter === 'all' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}"
                                >
                                    全部
                                </button>
                                <button
                                    type="button"
                                    onclick={() => (templateFilter = "sql")}
                                    class="px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer {templateFilter === 'sql' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}"
                                >
                                    SQL
                                </button>
                                <button
                                    type="button"
                                    onclick={() => (templateFilter = "python")}
                                    class="px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer {templateFilter === 'python' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}"
                                >
                                    Python
                                </button>
                                <button
                                    type="button"
                                    onclick={() => (templateFilter = "javascript")}
                                    class="px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer {templateFilter === 'javascript' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}"
                                >
                                    JS/TS
                                </button>
                            </div>
                            <span class="text-[10px] text-slate-400 font-mono">{filteredTemplates.length} 个</span>
                        </div>

                        {#each filteredTemplates as tpl (tpl.id)}
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div
                                onclick={() => applyTemplate(tpl)}
                                class="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer space-y-1.5 transition-all group shadow-2xs"
                            >
                                <div class="flex items-center justify-between gap-2">
                                    <span class="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-slate-950 dark:group-hover:text-white transition-colors truncate">
                                        {tpl.title}
                                    </span>
                                    <span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium uppercase shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                        {tpl.language}
                                    </span>
                                </div>
                                <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                    {tpl.description}
                                </p>
                                {#if tpl.tags && tpl.tags.length > 0}
                                    <div class="flex flex-wrap gap-1 pt-0.5">
                                        {#each tpl.tags as tag}
                                            <span class="px-1.5 py-0.2 rounded text-[9px] font-mono text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                                #{tag}
                                            </span>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {:else if activeSidebarTab === "datasets"}
                    <FileDatasetManager
                        files={mountedFiles}
                        onFileMounted={(f) => (mountedFiles = [...mountedFiles, f])}
                        onFileRemoved={(id) => (mountedFiles = mountedFiles.filter(f => f.id !== id))}
                        onInsertQuery={(sql) => {
                            if (activeTab) {
                                updateActiveCode(activeTab.code ? `${activeTab.code}\n${sql}` : sql);
                            }
                        }}
                    />
                {:else if activeSidebarTab === "history"}
                    <HistoryDrawer
                        {history}
                        onSelectHistory={(item) => {
                            const newTab: QueryTab = {
                                id: `tab_${Date.now()}`,
                                title: item.title || `History (${item.language.toUpperCase()})`,
                                language: item.language,
                                code: item.code
                            };
                            tabs = [...tabs, newTab];
                            activeTabId = newTab.id;
                            saveTabs();
                            toastStore.success(`已恢复历史快照并在新标签页打开`);
                        }}
                        onToggleFavorite={toggleFavorite}
                        onClearHistory={clearHistory}
                    />
                {/if}
            </div>
        </div>
    {/snippet}

    <!-- Central & Right Workspace with Draggable Splitter -->
    <div
        bind:this={containerRef}
        class="h-full flex flex-col md:flex-row min-h-0 w-full relative overflow-hidden select-none"
    >
        <!-- Editor Left Column -->
        <div
            style={isZenMode ? 'width: 100%;' : `width: ${splitPercent}%;`}
            class="min-w-[260px] flex flex-col h-full bg-white dark:bg-slate-900 shrink-0 overflow-hidden"
        >
            <!-- Query Multi-Tabs Bar -->
            <div class="px-2 pt-1.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/60 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none shrink-0">
                <div class="flex items-center gap-1 overflow-x-auto scrollbar-none min-w-0">
                    {#each tabs as tab (tab.id)}
                        <div
                            class="group flex items-center gap-1.5 px-2.5 py-1 rounded-t-md text-xs font-medium transition-colors cursor-pointer border-t border-x {tab.id === activeTabId ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white font-semibold' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}"
                            onclick={() => (activeTabId = tab.id)}
                            ondblclick={(e) => startRenameTab(tab, e)}
                        >
                            {#if tab.language === "sql"}
                                <Database size={11} class="text-slate-400 shrink-0" />
                            {:else if tab.language === "python"}
                                <FileCode2 size={11} class="text-slate-400 shrink-0" />
                            {:else}
                                <Code2 size={11} class="text-slate-400 shrink-0" />
                            {/if}

                            {#if editingTabId === tab.id}
                                <input
                                    type="text"
                                    bind:value={editingTabTitle}
                                    onblur={finishRenameTab}
                                    onkeydown={(e) => e.key === "Enter" && finishRenameTab()}
                                    class="w-20 px-1 py-0.2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white focus:outline-none"
                                    autofocus
                                />
                            {:else}
                                <span class="truncate max-w-[100px]">{tab.title}</span>
                            {/if}

                            {#if tabs.length > 1}
                                <button
                                    type="button"
                                    onclick={(e) => closeTab(tab.id, e)}
                                    class="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-opacity cursor-pointer"
                                    title="关闭标签"
                                >
                                    <X size={10} />
                                </button>
                            {/if}
                        </div>
                    {/each}

                    <button
                        type="button"
                        onclick={() => createNewTab(activeLanguage)}
                        class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="新建查询标签"
                    >
                        <Plus size={13} />
                    </button>
                </div>

                <!-- Editor Toolbar Quick Tools -->
                <div class="flex items-center gap-1 text-[11px] text-slate-400 shrink-0 pb-1">
                    <button
                        type="button"
                        onclick={() => (lineWrapping = !lineWrapping)}
                        class="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer {lineWrapping ? 'text-slate-800 dark:text-slate-100 font-medium' : 'text-slate-400'}"
                        title={lineWrapping ? "关闭自动换行" : "开启自动换行"}
                    >
                        <WrapText size={12} />
                    </button>

                    <button
                        type="button"
                        onclick={copyCurrentCode}
                        class="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                        title="复制代码"
                    >
                        {#if isCopiedCode}
                            <Check size={12} class="text-emerald-500" />
                        {:else}
                            <Copy size={12} />
                        {/if}
                    </button>

                    <button
                        type="button"
                        onclick={() => (isZenMode = !isZenMode)}
                        class="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer {isZenMode ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}"
                        title={isZenMode ? "恢复双栏" : "全屏专注模式"}
                    >
                        {#if isZenMode}
                            <Minimize2 size={12} />
                        {:else}
                            <Maximize2 size={12} />
                        {/if}
                    </button>
                </div>
            </div>

            <!-- CodeMirror Editor -->
            <div class="flex-1 min-h-0 w-full relative overflow-hidden select-text">
                {#if activeTab}
                    <CodeEditor
                        bind:value={activeTab.code}
                        language={activeTab.language}
                        {lineWrapping}
                        placeholder={editorPlaceholder}
                    />
                {/if}
            </div>

            <!-- Status Footer -->
            <div class="px-3.5 py-1.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-xs text-slate-500 shrink-0">
                <div class="flex items-center gap-3 min-w-0">
                    {#if lastResult}
                        <div class="flex items-center gap-1.5 shrink-0">
                            {#if lastResult.status === "success"}
                                <CheckCircle2 size={12} class="text-emerald-500" />
                                <span class="font-medium text-emerald-600 dark:text-emerald-400 text-[11px]">执行成功</span>
                            {:else}
                                <AlertTriangle size={12} class="text-rose-500" />
                                <span class="font-medium text-rose-600 dark:text-rose-400 text-[11px]">执行报错</span>
                            {/if}
                        </div>
                        <span class="flex items-center gap-1 text-slate-400 font-mono text-[10px] shrink-0">
                            <Clock size={10} />
                            <span>{lastResult.metrics.durationMs} ms</span>
                        </span>
                        {#if lastResult.table}
                            <span class="text-slate-400 text-[10px] font-mono truncate">
                                {lastResult.table.rowCount} 行 × {lastResult.table.columns.length} 列
                            </span>
                        {/if}
                    {:else}
                        <span class="text-slate-400 text-[11px] flex items-center gap-1.5 font-mono">
                            就绪 · {activeLanguage.toUpperCase()}
                        </span>
                    {/if}
                </div>

                <div class="text-[10px] text-slate-400 font-mono">
                    <kbd class="px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">{isMac ? '⌘↵' : 'Ctrl+↵'}</kbd> 运行
                </div>
            </div>
        </div>

        <!-- Draggable Resizer Bar (Hidden in Zen Mode) -->
        {#if !isZenMode}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                onmousedown={handleSplitterMouseDown}
                ondblclick={() => (splitPercent = 50)}
                class="hidden md:flex w-2 hover:w-2 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-800 cursor-col-resize items-center justify-center transition-colors group z-20 shrink-0 select-none {isDraggingSplit ? 'bg-slate-300 dark:bg-slate-700 w-2' : ''}"
                title="拖拽调整分栏宽度，双击恢复 50/50"
            >
                <div class="h-8 w-0.5 rounded bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-500"></div>
            </div>
        {/if}

        <!-- Output Right Column -->
        <div
            style={isZenMode ? 'display: none;' : `width: ${100 - splitPercent}%;`}
            class="min-w-[260px] flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden shrink-0 border-t md:border-t-0 md:border-l border-slate-200/80 dark:border-slate-800"
        >
            <!-- Output Tabs Header -->
            <div class="px-3 py-1.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 flex items-center justify-between shrink-0">
                <div class="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800/90 rounded-lg border border-slate-200/70 dark:border-slate-700/60 shadow-2xs">
                    <button
                        type="button"
                        onclick={() => (activeOutputTab = "table")}
                        class="py-0.5 px-2.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer {activeOutputTab === 'table' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}"
                    >
                        <TableIcon size={12} class={activeOutputTab === 'table' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                        <span>数据表格</span>
                        {#if lastResult?.table}
                            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-medium {activeOutputTab === 'table' ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500'}">
                                {lastResult.table.rowCount}
                            </span>
                        {/if}
                    </button>

                    <button
                        type="button"
                        onclick={() => (activeOutputTab = "console")}
                        class="py-0.5 px-2.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer {activeOutputTab === 'console' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}"
                    >
                        <Terminal size={12} class={activeOutputTab === 'console' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                        <span>控制台</span>
                        {#if lastResult?.logs && lastResult.logs.length > 0}
                            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-medium {activeOutputTab === 'console' ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300' : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500'}">
                                {lastResult.logs.length}
                            </span>
                        {/if}
                    </button>
                </div>

                <!-- Last Execution Quick Stats -->
                {#if lastResult}
                    <div class="flex items-center gap-2 text-xs font-sans">
                        <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 text-[11px] font-mono text-slate-500 dark:text-slate-400 shadow-2xs">
                            <Clock size={11} class="text-slate-400" />
                            <span>{lastResult.metrics?.durationMs || 1}ms</span>
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Output Body -->
            <div class="flex-1 min-h-0 overflow-hidden relative w-full select-text">
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
