<script lang="ts">
    import { onMount } from "svelte";
    import { Button } from "$lib/components/ui";
    import { theme } from "$lib/stores";
    import { dataBridge } from "$lib/stores/dataBridge";
    import { safeJsonParse } from "$lib/utils/parsers/safeParser";
    import HandoffDropdown from "$lib/components/ui/HandoffDropdown.svelte";
    import JsonCodeEditor from "./components/JsonCodeEditor.svelte";
    import JsonTreeView from "./components/JsonTreeView.svelte";
    import JsonPathPanel from "./components/JsonPathPanel.svelte";
    import TypeGenModal from "./components/TypeGenModal.svelte";
    import ToolsModal from "./components/ToolsModal.svelte";
    import * as jsyaml from "js-yaml";

    let jsonContent = $state(
        '{\n  "name": "Example",\n  "version": 1,\n  "items": [\n    {"id": 1, "active": true},\n    {"id": 2, "active": false}\n  ]\n}',
    );
    let parsedData = $state<any>(null);
    let error = $state<string | null>(null);
    let isDark = $derived($theme === "dark");
    let showPathQuery = $state(false);
    let showTypeGen = $state(false);
    let showTools = $state(false);
    let expandedKeys = $state(new Set<string>());
    let loadingTool = $state<"yaml" | null>(null);
    let status = $state<{ text: string; type: "success" | "warning" | "error" }>({
        text: "就绪。编辑 JSON，检查树结构或在需要时打开实用工具。",
        type: "success",
    });

    const isValid = $derived(!error && parsedData !== null && parsedData !== undefined);

    onMount(() => {
        const handoff = dataBridge.consume("/json-editor");
        if (handoff && handoff.payload) {
            jsonContent = handoff.payload;
            updateStatus(`已从 ${handoff.sourceTool} 载入数据。`, "success");
        }
    });

    function updateStatus(text: string, type: "success" | "warning" | "error" = "success") {
        status = { text, type };
    }

    function messageFromError(err: unknown, fallback: string) {
        return err instanceof Error ? err.message : fallback;
    }

    function parse(content: string) {
        if (!content.trim()) {
            parsedData = null;
            error = "JSON 输入为空。";
            return;
        }

        const res = safeJsonParse(content, { maxDepth: 60 });
        if (res.ok) {
            parsedData = res.data;
            error = null;
            if (res.warnings && res.warnings.length > 0) {
                updateStatus(res.warnings[0], "warning");
            }
        } else {
            error = res.error || "无效的 JSON。";
        }
    }

    let parseTimer: ReturnType<typeof setTimeout> | null = null;
    $effect(() => {
        const content = jsonContent;
        if (parseTimer) clearTimeout(parseTimer);
        parseTimer = setTimeout(() => {
            parse(content);
        }, 120);
        return () => {
            if (parseTimer) clearTimeout(parseTimer);
        };
    });

    function openPathQuery() {
        if (!isValid) {
            updateStatus("运行 JSONPath 查询前请先修复 JSON 错误。", "error");
            return;
        }
        showPathQuery = !showPathQuery;
        updateStatus(showPathQuery ? "已打开 JSONPath 查询面板。" : "已关闭 JSONPath 查询面板。", "success");
    }

    function openTypeGen() {
        if (!isValid) {
            updateStatus("生成类型前请先修复 JSON 错误。", "error");
            return;
        }
        showTypeGen = true;
        updateStatus("已打开 TypeScript 类型生成器。", "success");
    }

    function openTools() {
        if (!isValid) {
            updateStatus("使用实用工具前请先修复 JSON 错误。", "error");
            return;
        }
        showTools = true;
        updateStatus("已打开 JSON 实用工具。", "success");
    }

    function handleToolsUpdate(newData: any) {
        if (newData === undefined) {
            updateStatus("工具未返回更新的 JSON。", "warning");
            return;
        }
        jsonContent = JSON.stringify(newData, null, 2);
        updateStatus("JSON 已通过实用工具成功更新。", "success");
    }

    function format() {
        if (!isValid) {
            updateStatus(`无法格式化: ${error ?? "无效的 JSON。"}`, "error");
            return;
        }
        jsonContent = JSON.stringify(parsedData, null, 2);
        updateStatus("已格式化 JSON (缩进 2 空格)。", "success");
    }

    function minify() {
        if (!isValid) {
            updateStatus(`无法压缩: ${error ?? "无效的 JSON。"}`, "error");
            return;
        }
        jsonContent = JSON.stringify(parsedData);
        updateStatus("已压缩 JSON。", "success");
    }

    function save() {
        if (!jsonContent.trim()) {
            updateStatus("没有可保存的 JSON 内容。", "error");
            return;
        }
        const blob = new Blob([jsonContent], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "data.json";
        a.click();
        URL.revokeObjectURL(url);
        updateStatus("已成功将 JSON 保存为 data.json。", "success");
    }

    async function convertToYaml() {
        if (!isValid) {
            updateStatus(`无法转换为 YAML: ${error ?? "无效的 JSON。"}`, "error");
            return;
        }

        loadingTool = "yaml";
        try {
            const yamlStr = jsyaml.dump(parsedData);
            await navigator.clipboard.writeText(yamlStr);
            updateStatus("已成功将 JSON 转换为 YAML 并复制到剪贴板。", "success");
        } catch (err) {
            updateStatus(messageFromError(err, "无法复制 YAML 到剪贴板。"), "error");
        } finally {
            loadingTool = null;
        }
    }

    function expandAll() {
        if (!isValid) {
            updateStatus("展开结构树前请先修复 JSON 错误。", "error");
            return;
        }
        const keys = new Set<string>();

        function traverse(obj: any, path: string[]) {
            if (obj && typeof obj === "object") {
                Object.keys(obj).forEach((key) => {
                    const value = obj[key];
                    if (value && typeof value === "object" && Object.keys(value).length > 0) {
                        const currentPath = [...path, key];
                        keys.add(currentPath.join("\u0000"));
                        traverse(value, currentPath);
                    }
                });
            }
        }

        traverse(parsedData, []);
        expandedKeys = keys;
        updateStatus(`已展开 ${keys.size} 个结构节点。`, "success");
    }

    function collapseAll() {
        expandedKeys = new Set();
        updateStatus("已折叠结构树。", "success");
    }

    function handleTreeAction(event: any) {
        if (event?.type === "copyPath") {
            updateStatus("路径操作在 JSONPath 查询中可用。", "warning");
        }
    }
    import {
        Braces,
        FileCode2,
        Copy,
        Download,
        SlidersHorizontal,
        Check,
        AlertCircle,
        Code2,
        Minimize2,
        Binary,
        Search,
    } from "lucide-svelte";
</script>

<svelte:head>
    <title>JSON 编辑器 - Aone 工作台</title>
</svelte:head>

<div class="h-full w-full flex flex-col p-2.5 sm:p-3.5 overflow-hidden bg-slate-50 dark:bg-slate-950">
    <div
        class="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden min-h-0"
    >
        <!-- Top Toolbar: Clean, unified engineering toolbar -->
        <header
            class="h-12 min-h-12 px-4 py-2 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 shrink-0 bg-slate-50/70 dark:bg-slate-900/80"
        >
            <div class="flex items-center gap-3 min-w-0">
                <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Braces class="h-4 w-4" />
                </div>
                <div class="flex items-center gap-2.5 min-w-0">
                    <h1 class="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                        JSON 编辑器
                    </h1>
                    <div class="flex items-center gap-1.5 text-xs font-mono">
                        {#if error}
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-200/60 dark:border-red-900/50">
                                <AlertCircle class="h-3 w-3" />
                                <span>语法错误</span>
                            </span>
                        {:else}
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50">
                                <Check class="h-3 w-3" />
                                <span>格式正确</span>
                            </span>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Actions Toolbar -->
            <div class="flex items-center gap-1.5 flex-wrap justify-end">
                <!-- Group 1: Core Format Actions -->
                <div class="flex items-center gap-1 p-0.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-lg">
                    <button
                        type="button"
                        onclick={format}
                        class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-transparent hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="美化 JSON (缩进 2 空格)"
                    >
                        <Code2 class="h-3 w-3 text-slate-400" />
                        <span>格式化</span>
                    </button>
                    <button
                        type="button"
                        onclick={minify}
                        class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-transparent hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="去除空格与换行压缩"
                    >
                        <Minimize2 class="h-3 w-3 text-slate-400" />
                        <span>压缩</span>
                    </button>
                </div>

                <div class="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5"></div>

                <!-- Group 2: Inspection & Generators -->
                <button
                    type="button"
                    onclick={openPathQuery}
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors cursor-pointer {showPathQuery ? 'bg-slate-900! text-white! dark:bg-slate-100! dark:text-slate-900!' : ''}"
                >
                    <Search class="h-3 w-3 text-slate-400" />
                    <span>JSONPath</span>
                </button>
                <button
                    type="button"
                    onclick={openTypeGen}
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors cursor-pointer"
                >
                    <Binary class="h-3 w-3 text-slate-400" />
                    <span>TS 类型</span>
                </button>
                <button
                    type="button"
                    onclick={convertToYaml}
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors cursor-pointer"
                    title="复制为 YAML 配置"
                >
                    <FileCode2 class="h-3 w-3 text-slate-400" />
                    <span>复制 YAML</span>
                </button>
                <button
                    type="button"
                    onclick={openTools}
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors cursor-pointer"
                >
                    <SlidersHorizontal class="h-3 w-3 text-slate-400" />
                    <span>实用工具</span>
                </button>

                <div class="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5"></div>

                <!-- Group 3: Save & Handoff -->
                <button
                    type="button"
                    onclick={save}
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer"
                    title="下载为 data.json"
                >
                    <Download class="h-3 w-3 text-slate-400" />
                    <span>保存</span>
                </button>
                <HandoffDropdown
                    sourceTool="JSON 编辑器"
                    dataType="json"
                    getData={() => jsonContent}
                />
            </div>
        </header>

        <!-- Main Editor & Structure Split Pane -->
        <div class="flex-1 flex overflow-hidden">
            <!-- Left: Monaco / CodeMirror Editor -->
            <div class="flex-1 border-r border-slate-200 dark:border-slate-800 relative group min-w-0 bg-white dark:bg-slate-900">
                <JsonCodeEditor bind:value={jsonContent} {isDark} />
                {#if error}
                    <div
                        class="absolute bottom-3 left-3 right-3 bg-red-50/95 dark:bg-red-950/90 border border-red-200 dark:border-red-900/80 p-2.5 rounded-lg text-xs text-red-600 dark:text-red-300 font-mono shadow-xs backdrop-blur-xs flex items-center gap-2"
                    >
                        <AlertCircle class="h-3.5 w-3.5 shrink-0" />
                        <span class="truncate">{error}</span>
                    </div>
                {/if}
            </div>

            <!-- Right: Structure Tree View -->
            <div class="w-80 min-w-[260px] max-w-[400px] bg-slate-50/60 dark:bg-slate-900/60 flex flex-col border-l border-slate-100 dark:border-slate-800/80">
                <div class="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center shrink-0">
                    <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        数据结构 (Structure)
                    </span>
                    <div class="flex items-center gap-1.5 text-xs">
                        <button
                            type="button"
                            class="text-[11px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            onclick={expandAll}
                        >
                            展开
                        </button>
                        <span class="text-slate-300 dark:text-slate-700">·</span>
                        <button
                            type="button"
                            class="text-[11px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            onclick={collapseAll}
                        >
                            折叠
                        </button>
                    </div>
                </div>
                <div class="flex-1 overflow-auto p-2.5">
                    {#if !error && parsedData}
                        <JsonTreeView
                            data={parsedData}
                            bind:expandedKeys
                            onAction={handleTreeAction}
                        />
                    {:else}
                        <div class="h-full flex items-center justify-center text-slate-400 text-xs italic text-center px-4">
                            {error ? "修复语法错误后查看数据结构" : "无数据结构"}
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Bottom Discreet Status Strip -->
        <footer class="px-3 py-1.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0 font-mono">
            <div class="flex items-center gap-2 truncate">
                <span class="flex h-1.5 w-1.5 rounded-full {status.type === 'error' ? 'bg-red-500' : status.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}"></span>
                <span class="truncate">{loadingTool ? `正在转换 ${loadingTool}... ` : ""}{status.text}</span>
            </div>
            <div class="flex items-center gap-3 shrink-0 text-slate-400">
                <span>UTF-8</span>
                <span>JSON</span>
            </div>
        </footer>

        <!-- Modals and Sub-Panels -->
        <JsonPathPanel
            data={parsedData}
            isHidden={!showPathQuery}
            onClose={() => (showPathQuery = false)}
        />

        <TypeGenModal
            isOpen={showTypeGen}
            jsonData={parsedData}
            onClose={() => (showTypeGen = false)}
        />

        <ToolsModal
            isOpen={showTools}
            jsonData={parsedData}
            onUpdate={handleToolsUpdate}
            onClose={() => (showTools = false)}
        />
    </div>
</div>
