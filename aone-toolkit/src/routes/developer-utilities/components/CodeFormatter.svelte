<script lang="ts">
    import { onMount } from "svelte";
    import { Panel, Button, CodeEditor } from "$lib/components/ui";
    import ToolWorkspace from "$lib/components/layout/ToolWorkspace.svelte";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import {
        Copy,
        Trash2,
        Maximize2,
        Minimize2,
        AlertCircle,
        Split,
        FileCode,
        CheckCircle2,
        Loader2,
        HelpCircle,
        Upload,
        Download,
        RefreshCw,
        Sparkles,
        Wand2,
        ClipboardPaste,
        Settings,
        Check,
        XCircle
    } from "lucide-svelte";
    import type { ProviderResult } from "$lib/services/formatter/CodeFormatterProvider";
    import * as Diff from "diff";

    let input = $state("");
    let formattedResult = $state("");
    let lastFormattedInput = $state(""); // Track last formatted input to detect out-of-sync edits
    let language = $state("auto"); // Default to smart auto-detect
    let indent = $state(2);
    let error = $state<string | null>(null);
    let errorLine = $state<number | null>(null);

    let showDiff = $state(false);
    let isFormatting = $state(false);
    let formatterStatus = $state("");
    let autoFormat = $state(false); // Changed default to false to prevent typing disruptions
    let copySuccess = $state(false); // Success state for clipboard copy

    let isOutdated = $derived(
        input.trim() !== "" &&
        formattedResult !== "" &&
        input !== lastFormattedInput
    );

    // SQL options
    let sqlDialect = $state("sql");
    let sqlKeywordCase = $state("upper");
    let useAliasInference = $state(true);

    // Phase 2 states & helpers
    let isDragging = $state(false);
    let copyMarkdownSuccess = $state(false);
    let copyMarkdownSuccessTimer: any = null;

    interface HistoryItem {
        id: string;
        timestamp: number;
        language: string;
        input: string;
        formatted: string;
        length: number;
    }

    let historyList = $state<HistoryItem[]>([]);

    function loadHistoryList() {
        try {
            const stored = localStorage.getItem("aone-formatter-history");
            if (stored) {
                historyList = JSON.parse(stored);
            }
        } catch (_) {}
    }

    function saveHistoryList() {
        try {
            localStorage.setItem("aone-formatter-history", JSON.stringify(historyList));
        } catch (_) {}
    }

    function addHistoryItem(lang: string, originalText: string, formattedText: string) {
        if (!originalText.trim()) return;
        const newItem: HistoryItem = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: Date.now(),
            language: lang,
            input: originalText,
            formatted: formattedText,
            length: originalText.length
        };
        
        // Prevent duplicate consecutive histories for same content
        if (historyList.length > 0 && historyList[0].input === originalText) {
            return;
        }

        historyList = [newItem, ...historyList.slice(0, 4)]; // Keep last 5
        saveHistoryList();
    }

    function restoreHistory(item: HistoryItem) {
        input = item.input;
        formattedResult = item.formatted;
        lastFormattedInput = item.input;
        language = item.language;
        error = null;
        errorLine = null;
    }

    function clearHistory() {
        historyList = [];
        saveHistoryList();
    }

    onMount(() => {
        loadHistoryList();
    });

    // Drag & Drop handlers
    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        isDragging = true;
    }

    function handleDragLeave() {
        isDragging = false;
    }

    async function handleDrop(e: DragEvent) {
        e.preventDefault();
        isDragging = false;
        
        const file = e.dataTransfer?.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            input = text;
            formattedResult = "";
            lastFormattedInput = "";
            error = null;
            errorLine = null;

            // Try to auto-detect language based on file extension
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (ext === 'json') {
                language = 'json';
            } else if (ext === 'html' || ext === 'htm') {
                language = 'html';
            } else if (ext === 'css') {
                language = 'css';
            } else if (ext === 'sql') {
                language = 'sql';
            }
        } catch (err: any) {
            error = "文件读取失败: " + err.message;
        }
    }

    // Markdown copy helper
    function copyAsMarkdown() {
        if (!formattedResult) return;
        let lang = activeLanguage;
        if (lang === 'auto') lang = 'json';
        const mdText = `\`\`\`${lang}\n${formattedResult}\n\`\`\`\n`;
        copyToClipboard(mdText, "Markdown 代码块");
        copyMarkdownSuccess = true;
        if (copyMarkdownSuccessTimer) clearTimeout(copyMarkdownSuccessTimer);
        copyMarkdownSuccessTimer = setTimeout(() => {
            copyMarkdownSuccess = false;
        }, 2000);
    }

    let copyInputSuccess = $state(false);
    let copyInputSuccessTimer: any = null;

    function copyInput() {
        if (input) {
            copyToClipboard(input, "原始代码");
            copyInputSuccess = true;
            if (copyInputSuccessTimer) clearTimeout(copyInputSuccessTimer);
            copyInputSuccessTimer = setTimeout(() => {
                copyInputSuccess = false;
            }, 2000);
        }
    }

    // JSON safe repair utility
    function tryFixInvalidJson(str: string): string {
        let cleaned = str.trim();
        // Remove line comments and multiline comments safely
        cleaned = cleaned.replace(/\/\/[^\r\n]*/g, "");
        cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");
        // Remove trailing commas before close braces/brackets
        cleaned = cleaned.replace(/,\s*([\}\]])/g, "$1");
        // Fix unquoted property keys: { name: "val" } -> { "name": "val" }
        cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
        // Replace single quoted values with double quotes safely
        cleaned = cleaned.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');
        return cleaned;
    }

    async function handleAutoFixJson() {
        try {
            const fixed = tryFixInvalidJson(input);
            input = fixed;
            error = null;
            errorLine = null;
            await format();
        } catch (e: any) {
            error = "尝试自动修复失败，原错误：" + e.message;
        }
    }

    const LANGUAGES = [
        { id: "auto", label: "自动检测" },
        { id: "json", label: "JSON" },
        { id: "html", label: "HTML" },
        { id: "css", label: "CSS" },
        { id: "sql", label: "SQL" },
        { id: "duckdb", label: "DuckDB" },
    ];

    const EXAMPLES: Record<string, string> = {
        json: `{"name":"aone-toolkit","version":"1.0.0","description":"Modern Developer Tools Suite","private":true,"dependencies":{"svelte":"^5.0.0","codemirror":"^6.0.0"},"scripts":{"dev":"vite","build":"vite build","preview":"vite preview"}}`,
        html: `<div class="card shadow-lg p-6 bg-slate-900 border border-slate-800"><h1 class="text-xl font-bold text-white">Hello Aone</h1><p class="text-xs text-slate-400 mt-2">Simplify your developer workflows in seconds.</p><button class="btn btn-primary mt-4" onclick="handleClick()">获取开始</button></div>`,
        css: `.card { margin: 16px; padding: 24px; border-radius: 6px; background-color: #0f172a; border: 1px solid #1e293b; transition: transform 0.2s ease; } .card:hover { transform: translateY(-2px); }`,
        sql: `select u.id, u.username, count(o.id) as total_orders, sum(o.amount) as total_spent from users u left join orders o on u.id = o.user_id where u.status = 'active' and o.created_at >= '2026-01-01' group by u.id, u.username having total_orders > 5 order by total_spent desc limit 10;`,
        duckdb: `select word, count(*) as count from (select regexp_split_to_table(lower(sentence), '\\s+') as word from (values ('Hello World from DuckDB'), ('DuckDB is fast and simple')) as t(sentence)) group by word order by count desc;`
    };

    let patchCount = $state(0);
    let autoDetectedLanguage = $state("");
    let debounceTimer: any = null;
    let copySuccessTimer: any = null;

    // Auto-detection logic
    function detectLanguage(text: string): string {
        const trimmed = text.trim();
        if (!trimmed) return "";

        // JSON check: starts with { or [ and ends with } or ]
        if (/^[\{\[][\s\S]*[\}\]]$/.test(trimmed)) {
            try {
                JSON.parse(trimmed);
                return "json";
            } catch (_) {}
        }

        // HTML check: starts with < or contains tags
        if (/^\s*<(!DOCTYPE\s+)?html/i.test(trimmed) || /^\s*<[a-z0-9-]+[^>]*>[\s\S]*<\/[a-z0-9-]+>/i.test(trimmed)) {
            return "html";
        }

        // CSS check: selector { property: value; }
        if (/^\s*[\.#a-z_-][\s\S]*?\{[\s\S]*?\}/i.test(trimmed)) {
            return "css";
        }

        // SQL check: matches common keywords
        if (/^\s*(select|with|create|insert|update|delete|drop|alter|truncate|use)\b/i.test(trimmed)) {
            return "sql";
        }

        return "";
    }

    $effect(() => {
        if (language === "auto" && input.trim()) {
            autoDetectedLanguage = detectLanguage(input);
        } else {
            autoDetectedLanguage = "";
        }
    });

    let activeLanguage = $derived(language === "auto" ? (autoDetectedLanguage || "json") : language);

    async function loadFormatterProvider() {
        const { CodeFormatterProvider } = await import(
            "$lib/services/formatter/CodeFormatterProvider"
        );
        return CodeFormatterProvider;
    }

    async function loadSqlFormatterTools() {
        const [{ ZeroConfigSniffer }, { Watchdog }] = await Promise.all([
            import("$lib/services/formatter/engineering/ZeroConfigSniffer"),
            import("$lib/services/formatter/engineering/Watchdog"),
        ]);

        return { ZeroConfigSniffer, Watchdog };
    }

    function parseErrorLine(message: string): number | null {
        // e.g. "JSON 语法解析失败 (在第 3 行附近)"
        const lineMatchChinese = message.match(/第\s*(\d+)\s*行/);
        if (lineMatchChinese) return parseInt(lineMatchChinese[1], 10);
        
        const lineMatchEnglish = message.match(/line\s*(\d+)/i);
        if (lineMatchEnglish) return parseInt(lineMatchEnglish[1], 10);

        const colonMatch = message.match(/:(\d+):/);
        if (colonMatch) return parseInt(colonMatch[1], 10);

        return null;
    }

    function getRecoverySuggestions(message: string, lang: string): string[] {
        const suggestions: string[] = [];
        if (lang === 'json') {
            if (message.includes("double quotes") || message.includes("双引号") || message.includes("语法解析")) {
                suggestions.push("JSON 规范强制键名和字符串值必须使用双引号 `\"`，不能使用单引号 `'`。");
            }
            if (message.includes("comma") || message.includes("逗号") || message.includes("position")) {
                suggestions.push("请检查对象或数组中各属性之间是否遗漏了逗号 `,`，或者最后一个元素后面是否有多余的逗号。");
            }
            if (message.includes("bracket") || message.includes("brace") || message.includes("括号") || message.includes("括")) {
                suggestions.push("请确保所有的花括号 `{}` 和方括号 `[]` 均已成对闭合且嵌套正确。");
            }
            if (suggestions.length === 0) {
                suggestions.push("请检查是否混入了非法的控制字符或非标准 JSON 语法（如注释）。");
            }
        } else if (lang === 'sql') {
            suggestions.push("请检查 SQL 关键字拼写是否正确。");
            suggestions.push("确保所有的括号和单引号均已成对闭合。");
            suggestions.push("对于特定方言的操作符，请检查是否选择了对应的 SQL 方言（如 MySQL/PostgreSQL）。");
        } else {
            suggestions.push("请检查代码是否有未闭合的标签、括号或引号。");
            suggestions.push("确保代码格式符合当前所选语言的语法标准。");
        }
        return suggestions;
    }

    async function format() {
        error = null;
        errorLine = null;
        if (!input.trim()) {
            return;
        }
        isFormatting = true;
        formatterStatus =
            activeLanguage === "sql" || activeLanguage === "duckdb"
                ? "正在载入 SQL 格式化工具..."
                : "正在格式化代码...";

        try {
            const CodeFormatterProvider = await loadFormatterProvider();

            // Pre-validation for JSON
            if (activeLanguage === "json") {
                try {
                    JSON.parse(input);
                } catch (e: any) {
                    const posMatch = e.message.match(/position (\d+)/);
                    const pos = posMatch ? parseInt(posMatch[1], 10) : -1;
                    let lineNum = 1;
                    if (pos >= 0) {
                        lineNum = input.slice(0, pos).split('\n').length;
                    }
                    throw { message: `JSON 语法解析失败 (在第 ${lineNum} 行附近)。请检查是否遗漏了双引号、逗号或括号。`, line: lineNum };
                }
            }

            const sqlTools =
                activeLanguage === "sql" || activeLanguage === "duckdb"
                    ? await loadSqlFormatterTools()
                    : null;
            const sniffed =
                sqlTools
                    ? sqlTools.ZeroConfigSniffer.sniff(input)
                    : {};

            if (sniffed.tabWidth) indent = sniffed.tabWidth;

            let result: ProviderResult;

            if (sqlTools) {
                let targetDialect =
                    activeLanguage === "duckdb"
                        ? "postgresql"
                        : sqlDialect || sniffed.dialect || "sql";
                formatterStatus = "正在美化 SQL 代码...";
                const watchdogResult = await sqlTools.Watchdog.run(input, {
                    tabWidth: indent,
                    dialect: targetDialect as any,
                    keywordCase: sqlKeywordCase as any,
                });

                if (
                    watchdogResult.status === "SUCCESS" &&
                    watchdogResult.result
                ) {
                    result = await CodeFormatterProvider.format(
                        input,
                        activeLanguage,
                        {
                            tabWidth: indent,
                            dialect: targetDialect as any,
                            keywordCase: sqlKeywordCase as any,
                            useAliasInference,
                        },
                    );
                } else if (watchdogResult.status === "TIMEOUT") {
                    throw new Error("SQL 格式化超时。请检查您的 SQL 语句是否过于庞大，或尝试手动分段进行格式化。");
                } else {
                    result = await CodeFormatterProvider.format(
                        input,
                        activeLanguage,
                        {
                            tabWidth: indent,
                            dialect: targetDialect as any,
                            keywordCase: sqlKeywordCase as any,
                            useAliasInference,
                        },
                    );
                }
            } else {
                result = await CodeFormatterProvider.format(input, activeLanguage, {
                    tabWidth: indent,
                });
            }

            if (result.error) {
                throw new Error(result.error);
            }

            formattedResult = result.result;
            lastFormattedInput = input;
            patchCount = result.patchCount || 0;
            addHistoryItem(activeLanguage, input, result.result);

            if (result.wasSalvaged) {
                error = "警告：代码存在结构性错误，已使用模糊解析器 (FuzzyParser) 尽力恢复。";
            }
        } catch (e: any) {
            const msg = e.message || "未知格式化错误";
            const errLine = e.line || parseErrorLine(msg);
            
            if (msg.includes("Unexpected token")) {
                error = `语法错误：发现了非法的字符或标记。请检查代码结构。原错误：${msg}`;
            } else {
                error = msg;
            }
            errorLine = errLine;
        } finally {
            isFormatting = false;
            formatterStatus = "";
        }
    }

    async function minify() {
        error = null;
        errorLine = null;
        if (!input.trim()) {
            error = "请输入或粘贴代码进行压缩。";
            return;
        }
        isFormatting = true;
        formatterStatus = "正在无损压缩代码...";

        try {
            const CodeFormatterProvider = await loadFormatterProvider();

            if (activeLanguage === "json") {
                try {
                    JSON.parse(input);
                } catch (e: any) {
                    throw new Error(`JSON 语法错误，无法压缩。原错误：${e.message}`);
                }
            }

            const minified = await CodeFormatterProvider.minify(input, activeLanguage);
            formattedResult = minified;
            lastFormattedInput = input;
            addHistoryItem(activeLanguage, input, minified);
        } catch (e: any) {
            error = `压缩失败：${e.message}`;
        } finally {
            isFormatting = false;
            formatterStatus = "";
        }
    }

    async function handleApply() {
        input = formattedResult;
        lastFormattedInput = formattedResult;
        showDiff = false;
    }

    // File Input binding & handlers
    let fileInputElement: HTMLInputElement | null = $state(null);

    function triggerFileInput() {
        fileInputElement?.click();
    }

    async function handleFileImport(e: Event) {
        const target = e.target as HTMLInputElement;
        const file = target?.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            input = text;
            formattedResult = "";
            lastFormattedInput = "";
            error = null;
            errorLine = null;
            
            // Try to auto-detect language based on file extension
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (ext === 'json') {
                language = 'json';
            } else if (ext === 'html' || ext === 'htm') {
                language = 'html';
            } else if (ext === 'css') {
                language = 'css';
            } else if (ext === 'sql') {
                language = 'sql';
            }
        } catch (err: any) {
            error = "文件读取失败: " + err.message;
        }
    }

    function downloadOutput() {
        if (!formattedResult) return;
        let ext = activeLanguage;
        if (ext === 'javascript') ext = 'js';
        else if (ext === 'typescript') ext = 'ts';
        
        const blob = new Blob([formattedResult], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `formatted_code.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function copyOutput() {
        if (formattedResult) {
            copyToClipboard(formattedResult, "格式化结果");
            copySuccess = true;
            if (copySuccessTimer) clearTimeout(copySuccessTimer);
            copySuccessTimer = setTimeout(() => {
                copySuccess = false;
            }, 2000);
        }
    }

    async function pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                input = text;
                error = null;
                errorLine = null;
                if (!autoFormat) {
                    setTimeout(format, 100);
                }
            }
        } catch (err) {
            // Fallback instruction
            error = "由于浏览器剪贴板权限限制，请使用 Ctrl+V / Cmd+V 手动粘贴代码。";
            setTimeout(() => {
                if (error && error.includes("浏览器剪贴板权限")) {
                    error = null;
                }
            }, 4000);
        }
    }

    function loadExample() {
        let lang = activeLanguage;
        if (lang === 'auto') lang = 'json';
        if (EXAMPLES[lang]) {
            input = EXAMPLES[lang];
            error = null;
            errorLine = null;
            // Delay format slightly to let CodeEditor bind
            setTimeout(format, 100);
        }
    }

    function clearAll() {
        input = "";
        formattedResult = "";
        lastFormattedInput = "";
        showDiff = false;
        error = null;
        errorLine = null;
        if (fileInputElement) {
            fileInputElement.value = "";
        }
    }

    // Auto-clear output if input is empty
    $effect(() => {
        if (!input.trim()) {
            formattedResult = "";
            lastFormattedInput = "";
            error = null;
            errorLine = null;
        }
    });

    // Debounced automatic formatting when input or config changes
    $effect(() => {
        const text = input;
        const currentLang = language;
        const currentIndent = indent;
        const currentSqlDialect = sqlDialect;
        const currentSqlKeywordCase = sqlKeywordCase;
        const currentUseAliasInference = useAliasInference;

        if (autoFormat && text.trim()) {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                format();
            }, 800);
        }

        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
        };
    });

    // Split diff layout generation
    interface DiffLine {
        text: string;
        type: 'added' | 'removed' | 'normal' | 'empty';
        num?: number;
    }

    let leftLines = $state<DiffLine[]>([]);
    let rightLines = $state<DiffLine[]>([]);

    function generateDiffs() {
        const diffs = Diff.diffLines(input, formattedResult);
        let left: DiffLine[] = [];
        let right: DiffLine[] = [];
        let leftNum = 1;
        let rightNum = 1;

        for (const part of diffs) {
            const lines = part.value.split('\n');
            if (lines.length > 1 && lines[lines.length - 1] === '') {
                lines.pop();
            }

            if (part.added) {
                for (const line of lines) {
                    right.push({ text: line, type: 'added', num: rightNum++ });
                    left.push({ text: '', type: 'empty' });
                }
            } else if (part.removed) {
                for (const line of lines) {
                    left.push({ text: line, type: 'removed', num: leftNum++ });
                    right.push({ text: '', type: 'empty' });
                }
            } else {
                for (const line of lines) {
                    left.push({ text: line, type: 'normal', num: leftNum++ });
                    right.push({ text: line, type: 'normal', num: rightNum++ });
                }
            }
        }

        leftLines = left;
        rightLines = right;
    }

    $effect(() => {
        if (showDiff && formattedResult) {
            generateDiffs();
        }
    });
</script>

<svelte:window onkeydown={(e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        format();
    }
}} />

<svelte:head>
    <title>代码格式化 - Aone 工具箱</title>
</svelte:head>

<div class="h-full flex-1 flex flex-col bg-slate-100 dark:bg-slate-950 p-2 gap-2 overflow-hidden">
    <!-- Top Command Toolbar -->
    <div class="h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-xs">
        <div class="flex items-center gap-2">
            <!-- Language selection -->
            <div class="flex p-0.5 bg-slate-200/70 dark:bg-slate-800 rounded-md">
                {#each LANGUAGES as lang}
                    <button
                        class="px-2 py-0.5 text-xs font-semibold rounded-sm transition-all whitespace-nowrap {language === lang.id
                            ? 'bg-white dark:bg-slate-900 shadow-2xs text-blue-600 dark:text-blue-400 font-bold'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}"
                        onclick={() => {
                            language = lang.id;
                            error = null;
                            errorLine = null;
                        }}
                    >
                        {lang.label}
                    </button>
                {/each}
            </div>

            <!-- Auto-detect badge indicator -->
            {#if language === 'auto'}
                {#if autoDetectedLanguage}
                    <span class="badge badge-blue text-[10px] select-none font-semibold">
                        已检测: {autoDetectedLanguage.toUpperCase()}
                    </span>
                {/if}
            {/if}

            {#if isFormatting}
                <span class="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold animate-pulse pl-1">
                    <Loader2 size={12} class="animate-spin" />
                    <span>格式化中...</span>
                </span>
            {/if}
        </div>

        <div class="flex items-center gap-2">
            <!-- Indent option -->
            <div class="flex items-center gap-1 text-xs">
                <span class="text-slate-400 text-[11px]">缩进:</span>
                <select
                    id="indent-select"
                    bind:value={indent}
                    class="py-0.5 px-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"
                >
                    <option value={2}>2 空格</option>
                    <option value={4}>4 空格</option>
                    <option value={8}>8 空格</option>
                </select>
            </div>

            <!-- Split Diff Button -->
            <button
                type="button"
                class="px-2 py-1 rounded text-xs font-medium transition flex items-center gap-1 {showDiff ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}"
                disabled={!formattedResult || input.length > 50000}
                onclick={() => {
                    showDiff = !showDiff;
                    if (showDiff && !formattedResult) format();
                }}
            >
                <Split size={12} /> 对比差异
                {#if patchCount > 0}
                    <span class="text-[10px] text-blue-500 font-bold">({patchCount})</span>
                {/if}
            </button>

            <!-- Format Button -->
            <button
                type="button"
                class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-2xs transition flex items-center gap-1"
                onclick={format}
                title="格式化代码 (Ctrl+Enter)"
            >
                <Wand2 size={12} /> 格式化
                <kbd class="text-[9px] opacity-75 font-mono">⌘↵</kbd>
            </button>

            <button
                type="button"
                class="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 transition"
                onclick={clearAll}
                title="清空输入与输出"
            >
                <Trash2 size={13} />
            </button>
        </div>
    </div>

    <div class="flex-1 flex flex-col min-h-0 min-w-0 relative h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
        <!-- SQL Collapsible Configurations -->
        {#if activeLanguage === 'sql' || activeLanguage === 'duckdb'}
            <div class="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
                <details class="group">
                    <summary class="flex items-center justify-between cursor-pointer text-xs font-bold text-slate-500 dark:text-slate-400 select-none py-1">
                        <span class="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                            SQL 高级选项设置
                        </span>
                        <span class="text-[10px] text-slate-400 group-open:rotate-180 transition-transform duration-200">▼</span>
                    </summary>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2.5 pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80 animate-in fade-in duration-200">
                        <div class="flex flex-col gap-1">
                            <label for="sql-dialect" class="text-[11px] text-slate-500 dark:text-slate-400 font-bold">SQL 语法方言</label>
                            <select
                                id="sql-dialect"
                                bind:value={sqlDialect}
                                class="input py-1 px-2 text-xs border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-[#0A0A0A] cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                            >
                                <option value="sql">标准 SQL (ANSI)</option>
                                <option value="mysql">MySQL</option>
                                <option value="postgresql">PostgreSQL</option>
                                <option value="sqlite">SQLite</option>
                                <option value="tsql">SQL Server (T-SQL)</option>
                            </select>
                            <span class="text-[9px] text-slate-400 dark:text-slate-500">不同数据库对应的解析器规则</span>
                        </div>
                        
                        <div class="flex flex-col gap-1">
                            <label for="sql-case" class="text-[11px] text-slate-500 dark:text-slate-400 font-bold">关键字大小写</label>
                            <select
                                id="sql-case"
                                bind:value={sqlKeywordCase}
                                class="input py-1 px-2 text-xs border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-[#0A0A0A] cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                            >
                                <option value="upper">全部大写 (UPPER)</option>
                                <option value="lower">全部小写 (lower)</option>
                                <option value="preserve">保持原样 (Preserve)</option>
                            </select>
                            <span class="text-[9px] text-slate-400 dark:text-slate-500">统一关键字的大小写排版风格</span>
                        </div>

                        <div class="flex flex-col justify-between">
                            <div class="flex items-center gap-1.5 mt-2">
                                <input
                                    type="checkbox"
                                    id="alias-inference-check"
                                    bind:checked={useAliasInference}
                                    class="rounded border-slate-300 dark:border-slate-700 text-blue-500 focus:ring-blue-500/20 w-3.5 h-3.5"
                                />
                                <label for="alias-inference-check" class="text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer select-none font-bold">智能别名推断</label>
                            </div>
                            <span class="text-[9px] text-slate-400 dark:text-slate-500">自动对其 `AS` 语句并排列列别名</span>
                        </div>
                    </div>
                </details>
            </div>
        {/if}

        <div class="flex-1 flex min-h-0 min-w-0 relative">
            {#if showDiff}
                <!-- Beautiful Aligned Split Diff Viewer -->
                <div class="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900/20">
                    <div class="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 select-none bg-white dark:bg-[#0A0A0A]">
                        <div class="flex-1 px-4 py-2 border-r border-slate-200 dark:border-slate-800 bg-red-500/5 text-red-600 dark:text-red-400 flex items-center justify-between">
                            <span>原始代码</span>
                            <span class="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/50 text-red-500">- 减去</span>
                        </div>
                        <div class="flex-1 px-4 py-2 bg-green-500/5 text-green-600 dark:text-green-400 flex items-center justify-between">
                            <span>格式化后</span>
                            <span class="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-950/50 text-green-500">+ 增加</span>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto divide-y-0 font-mono text-xs select-text">
                        {#each leftLines as leftLine, i}
                            {@const rightLine = rightLines[i]}
                            <div class="flex divide-x divide-slate-200 dark:divide-slate-800/80 hover:bg-slate-100/30 dark:hover:bg-slate-900/10">
                                <!-- Left side (Original) -->
                                <div class="flex-1 flex min-w-0 {leftLine.type === 'removed' ? 'bg-red-500/10 dark:bg-red-950/20 text-red-700 dark:text-red-300' : leftLine.type === 'empty' ? 'bg-slate-100/30 dark:bg-slate-800/10 select-none pattern-stripes' : 'text-slate-700 dark:text-slate-300'}">
                                    <div class="w-12 text-right select-none opacity-40 pr-3 border-r border-slate-200 dark:border-slate-800 text-[10px] py-1 font-sans font-medium">
                                        {leftLine.num ?? ''}
                                    </div>
                                    <div class="px-3 py-1 font-mono whitespace-pre overflow-x-auto min-w-0 flex-1">
                                        {leftLine.text}
                                    </div>
                                </div>
                                <!-- Right side (Formatted) -->
                                <div class="flex-1 flex min-w-0 {rightLine.type === 'added' ? 'bg-green-500/10 dark:bg-green-950/20 text-green-700 dark:text-green-300' : rightLine.type === 'empty' ? 'bg-slate-100/30 dark:bg-slate-800/10 select-none pattern-stripes' : 'text-slate-700 dark:text-slate-300'}">
                                    <div class="w-12 text-right select-none opacity-40 pr-3 border-r border-slate-200 dark:border-slate-800 text-[10px] py-1 font-sans font-medium">
                                        {rightLine.num ?? ''}
                                    </div>
                                    <div class="px-3 py-1 font-mono whitespace-pre overflow-x-auto min-w-0 flex-1">
                                        {rightLine.text}
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {:else}
                <!-- Double-panel layout (Input & Output side-by-side) -->
                <div class="flex-1 grid grid-cols-1 md:grid-cols-2 min-h-0 gap-4 p-4 bg-slate-50/50 dark:bg-slate-950/10">
                    <!-- Left Panel: Input -->
                    <div 
                        class="flex flex-col h-full min-h-[300px] border rounded overflow-hidden bg-white dark:bg-[#0A0A0A] shadow-sm relative transition-all duration-200 {isDragging ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200 dark:border-slate-800'}"
                        ondragover={handleDragOver}
                        ondragleave={handleDragLeave}
                        ondrop={handleDrop}
                    >
                        {#if isDragging}
                            <div class="absolute inset-0 bg-blue-550/5 dark:bg-blue-950/20 border-2 border-dashed border-blue-500 z-50 flex items-center justify-center pointer-events-none animate-in fade-in duration-150">
                                <div class="bg-white dark:bg-[#0E0E0E] px-4 py-3 rounded-lg shadow-lg border border-blue-200 dark:border-blue-950 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                    <Upload size={14} class="animate-bounce" />
                                    <span>拖放文件到此处导入</span>
                                </div>
                            </div>
                        {/if}
                        <div class="px-4 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
                            <span class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                原始代码 (可编辑)
                            </span>
                            <div class="flex items-center gap-1.5">
                                <button
                                    class="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800 text-[11px] flex items-center gap-1 transition-colors font-bold relative"
                                    onclick={copyInput}
                                    disabled={!input}
                                    title="复制原始输入代码"
                                >
                                    {#if copyInputSuccess}
                                        <Check size={12} class="text-emerald-500" />
                                        <span class="text-emerald-500">已复制!</span>
                                    {:else}
                                        <Copy size={12} />
                                        <span>复制</span>
                                    {/if}
                                </button>
                                <button
                                    class="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800 text-[11px] flex items-center gap-1 transition-colors font-bold"
                                    onclick={triggerFileInput}
                                    title="导入本地代码文件进行格式化"
                                >
                                    <Upload size={12} /> 导入文件
                                </button>
                                <input
                                    type="file"
                                    bind:this={fileInputElement}
                                    class="hidden"
                                    accept=".json,.html,.css,.sql,.txt"
                                    onchange={handleFileImport}
                                />
                                <button
                                    class="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800 text-[11px] flex items-center gap-1 transition-colors font-bold"
                                    onclick={pasteFromClipboard}
                                    title="从剪贴板读取并粘贴到此处"
                                >
                                    <ClipboardPaste size={12} /> 一键粘贴
                                </button>
                                <button
                                    class="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800 text-[11px] flex items-center gap-1 transition-colors font-bold"
                                    onclick={loadExample}
                                    title="加载当前语言的典型示例代码进行测试"
                                >
                                    <Sparkles size={12} /> 加载示例
                                </button>
                                <button
                                    class="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800 text-[11px] flex items-center gap-1 transition-colors font-bold"
                                    onclick={clearAll}
                                    title="清空当前输入"
                                >
                                    <Trash2 size={12} /> 清空
                                </button>
                            </div>
                        </div>
                        <div class="flex-1 min-h-0 min-w-0 relative">
                            <CodeEditor
                                bind:value={input}
                                language={activeLanguage}
                                errorLine={errorLine}
                                placeholder="在此输入或粘贴您的 {activeLanguage.toUpperCase()} 代码..."
                            />
                        </div>
                    </div>

                    <!-- Right Panel: Output -->
                    <div class="flex flex-col h-full min-h-[300px] border border-slate-200 dark:border-slate-800 rounded overflow-hidden bg-white dark:bg-[#0A0A0A] shadow-sm relative">
                        <div class="px-4 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
                            <span class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <span class="w-1.5 h-1.5 rounded-full {formattedResult && !error ? (isOutdated ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500') : 'bg-slate-400'}"></span>
                                格式化结果 (只读)
                                {#if formattedResult && !error}
                                    {#if isOutdated}
                                        <span class="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded font-bold border border-amber-200/50 dark:border-amber-900/30 animate-pulse">
                                            输入已修改，结果未更新
                                        </span>
                                    {:else}
                                        <span class="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded font-bold">
                                            已格式化
                                        </span>
                                    {/if}
                                {/if}
                            </span>
                            <div class="flex items-center gap-1.5">
                                <button
                                    class="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800 text-[11px] flex items-center gap-1 transition-colors disabled:opacity-40 disabled:hover:bg-transparent font-bold relative"
                                    onclick={copyOutput}
                                    disabled={!formattedResult}
                                    title="复制格式化后的代码"
                                >
                                    {#if copySuccess}
                                        <Check size={12} class="text-emerald-500" />
                                        <span class="text-emerald-500">已复制!</span>
                                    {:else}
                                        <Copy size={12} />
                                        <span>复制结果</span>
                                    {/if}
                                </button>
                                <button
                                    class="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800 text-[11px] flex items-center gap-1 transition-colors disabled:opacity-40 disabled:hover:bg-transparent font-bold relative"
                                    onclick={copyAsMarkdown}
                                    disabled={!formattedResult}
                                    title="复制为带 Markdown 语法标记的代码块"
                                >
                                    {#if copyMarkdownSuccess}
                                        <Check size={12} class="text-emerald-500" />
                                        <span class="text-emerald-500">已复制 MD!</span>
                                    {:else}
                                        <FileCode size={12} />
                                        <span>复制 MD 代码块</span>
                                    {/if}
                                </button>
                                <button
                                    class="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800 text-[11px] flex items-center gap-1 transition-colors disabled:opacity-40 disabled:hover:bg-transparent font-bold"
                                    onclick={downloadOutput}
                                    disabled={!formattedResult}
                                    title="将格式化后的代码下载到本地文件"
                                >
                                    <Download size={12} /> 下载文件
                                </button>
                            </div>
                        </div>
                        <div class="flex-1 min-h-0 min-w-0 relative flex flex-col">
                            {#if error}
                                <!-- Beautiful interactive detailed Error recovery card -->
                                <div class="flex-1 flex flex-col items-center justify-center p-6 bg-red-50/5 dark:bg-red-950/5 border border-red-200/30 dark:border-red-900/20 overflow-y-auto animate-in fade-in duration-200">
                                    <div class="max-w-[420px] w-full bg-white dark:bg-[#0E0E0E] border border-red-200 dark:border-red-950 shadow-lg rounded-lg p-5 flex flex-col text-left">
                                        <div class="flex items-start gap-3">
                                            <div class="p-2 bg-red-50 dark:bg-red-950/80 rounded-full text-red-500 shrink-0">
                                                <XCircle size={22} />
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">代码语法解析失败</h4>
                                                {#if errorLine}
                                                    <span class="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                                                        检测到错误位于左侧第 {errorLine} 行
                                                    </span>
                                                {/if}
                                                <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono break-words leading-relaxed border-l-2 border-slate-200 dark:border-slate-800 pl-2">
                                                    {error}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <!-- Practical Suggestions Checklist -->
                                        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-900 flex flex-col gap-2">
                                            <h5 class="text-[11px] font-bold text-slate-400 dark:border-slate-500 uppercase tracking-wider">排查与修复建议</h5>
                                            <ul class="flex flex-col gap-1.5">
                                                {#each getRecoverySuggestions(error, activeLanguage) as sugg}
                                                    <li class="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5 leading-normal">
                                                        <span class="text-blue-500 font-bold shrink-0 mt-0.5">•</span>
                                                        <span>{@html sugg}</span>
                                                    </li>
                                                {/each}
                                            </ul>
                                        </div>

                                        <div class="mt-5 flex gap-2 justify-end">
                                            {#if activeLanguage === 'json'}
                                                <button
                                                    class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                                    onclick={handleAutoFixJson}
                                                    title="自动修复单引号、缺失引号、末尾逗号及 JS 注释"
                                                >
                                                    <Wand2 size={12} /> 语法修复 JSON
                                                </button>
                                            {/if}
                                            <button
                                                class="px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 rounded text-xs font-bold transition-colors"
                                                onclick={() => { error = null; errorLine = null; }}
                                            >
                                                清除提示
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            {:else if !formattedResult}
                                <!-- Professional Developer-centric Empty State -->
                                <div class="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50/20 dark:bg-slate-900/5 p-6 text-center select-none animate-in fade-in duration-200">
                                    <FileCode size={36} class="mb-3 text-blue-500 opacity-60" />
                                    <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300">暂无格式化结果</h4>
                                    <p class="text-xs mt-1.5 max-w-[320px] leading-relaxed text-slate-500 dark:text-slate-400">
                                        {#if input.trim()}
                                            检测到您已输入代码，请点击右下角的 <span class="text-blue-500 font-bold">“格式化代码”</span> 按钮，或开启上方的“实时自动格式化”。
                                        {:else}
                                            支持格式化 JSON、HTML、CSS、SQL、DuckDB。请在左侧粘贴代码，或使用下方快速操作：
                                        {/if}
                                    </p>
                                    {#if !input.trim()}
                                        <div class="mt-5 flex gap-3 flex-wrap justify-center">
                                            <button
                                                class="px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 rounded-md text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                                                onclick={pasteFromClipboard}
                                            >
                                                <ClipboardPaste size={14} /> 一键粘贴代码
                                            </button>
                                            <button
                                                class="px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                                                onclick={loadExample}
                                            >
                                                <Sparkles size={14} /> 加载测试示例
                                            </button>
                                        </div>
                                    {/if}
                                </div>
                            {:else}
                                <CodeEditor
                                    value={formattedResult}
                                    language={activeLanguage}
                                    readOnly={true}
                                />
                            {/if}
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Absolute positioned floating error for overall fallback issues when showing diff -->
            {#if error && showDiff && !formatterStatus}
                <div
                    class="absolute bottom-4 left-4 right-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 rounded-lg shadow-lg text-red-700 dark:text-red-300 text-xs animate-in fade-in slide-in-from-bottom-4 z-20 flex items-center justify-between gap-3 backdrop-blur-md"
                >
                    <div class="flex items-center gap-2">
                        <div class="p-1 bg-red-100 dark:bg-red-900/50 rounded-full shrink-0">
                           <AlertCircle size={14} />
                        </div>
                        <span class="font-medium">{error}</span>
                    </div>
                    <button
                        class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold px-1 rounded hover:bg-red-100/50 dark:hover:bg-red-950/50"
                        onclick={() => { error = null; errorLine = null; }}
                    >
                        ✕
                    </button>
                </div>
            {/if}
        </div>

        <div class="clean-footer shrink-0">
            <div class="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 font-mono">
                <span>{input.length} 字符</span>
                <span class="text-slate-300 dark:text-slate-600">•</span>
                <span>{input.split('\n').length} 行</span>
                {#if language === 'auto'}
                    <span class="text-slate-300 dark:text-slate-600">•</span>
                    <span class="text-blue-500 dark:text-blue-400 flex items-center gap-1 font-semibold">
                        <HelpCircle size={12} /> 自动检测模式已启用
                    </span>
                {/if}
                {#if input.length > 150000}
                    <span class="text-slate-300 dark:text-slate-600">•</span>
                    <span class="text-amber-550 dark:text-amber-400 flex items-center gap-1 font-semibold animate-pulse" title="文件超过 150KB，格式化可能会有短暂卡顿，建议分段处理">
                        <AlertCircle size={12} /> 大文件性能提示
                    </span>
                {/if}
            </div>
            <div class="flex gap-3 items-center">
                {#if showDiff}
                    <Button variant="secondary" onclick={() => (showDiff = false)} class="font-bold">
                        返回编辑
                    </Button>
                    <Button
                        onclick={handleApply}
                        class="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 font-bold transition-all"
                    >
                        <CheckCircle2 size={16} class="mr-2" /> 应用修改
                    </Button>
                {:else}
                    <div class="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mr-1 hidden sm:inline-block">
                        支持快捷键 <kbd class="px-1.5 py-0.5 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-[#0A0A0A] font-mono">Ctrl + Enter</kbd>
                    </div>
                    <Button
                        variant="secondary"
                        onclick={minify}
                        loading={isFormatting}
                        disabled={!input.trim()}
                        class="font-bold hover:-translate-y-0.5 active:translate-y-0 hover:shadow-sm transition-all"
                        title="将代码无损压缩为一行，去除所有空格、换行 and 注释"
                    >
                        <Minimize2 size={16} class="mr-2" /> 无损压缩
                    </Button>
                    <Button
                        onclick={format}
                        loading={isFormatting}
                        disabled={!input.trim()}
                        class="shadow-md font-bold hover:-translate-y-0.5 active:translate-y-0 transition-all text-white {isOutdated && !isFormatting ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 animate-pulse' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/10'}"
                        title="对代码进行排版、缩进和语法美化"
                    >
                        <Maximize2 size={16} class="mr-2" /> 格式化代码
                    </Button>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    /* diagonal stripe pattern for empty lines in diff view */
    .pattern-stripes {
        background-image: repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 4px,
            rgba(148, 163, 184, 0.05) 4px,
            rgba(148, 163, 184, 0.05) 8px
        );
    }
    :global(.dark) .pattern-stripes {
        background-image: repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 4px,
            rgba(51, 65, 85, 0.15) 4px,
            rgba(51, 65, 85, 0.15) 8px
        );
    }
</style>
