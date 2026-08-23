<script lang="ts">
    import { onMount } from "svelte";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import JsonTreeView from "../../json-editor/components/JsonTreeView.svelte";
    import { JSONPath } from "jsonpath-plus";
    import { 
        Search, Code2, Copy, Trash2, Info, Check, Database, 
        Layers, ListTree, Filter, AlignLeft, Minimize2, Clock, History, FileCode
    } from "lucide-svelte";
    import { dataBridge } from "$lib/stores/dataBridge";
    import HandoffDropdown from "$lib/components/ui/HandoffDropdown.svelte";

    let rawInput = $state("");
    let parsedData = $state<any>(null);
    let jsonPath = $state("$");
    let jsonPathHistory = $state<string[]>([]);
    let queryResult = $state<any>(null);
    let error = $state<string | null>(null);
    let expandedKeys = $state<Set<string>>(new Set());
    let copied = $state(false);
    let inspectorTab = $state<"tree" | "jsonpath" | "schema" | "types">("tree");
    let tsTypeName = $state("ApiResponse");
    let typeFormat = $state<"ts" | "zod">("ts");

    // Simulated/Editable Response Metadata for realistic debugging
    let httpStatusCode = $state(200);
    let httpDurationMs = $state(42);

    const SAMPLE_RESPONSES = [
        {
            name: "用户分页列表 (REST API)",
            status: 200,
            duration: 38,
            data: {
                code: 200,
                message: "success",
                data: {
                    total: 42,
                    page: 1,
                    pageSize: 2,
                    list: [
                        { id: 1001, name: "Alice Zhang", email: "alice@example.com", role: "admin", active: true, createdAt: "2026-01-15T08:00:00Z", metadata: { department: "Engineering", level: "P7" } },
                        { id: 1002, name: "Bob Li", email: "bob@example.com", role: "developer", active: false, createdAt: "2026-02-10T11:30:00Z", metadata: { department: "Design", level: "P6" } }
                    ]
                },
                timestamp: 1771761600000
            }
        },
        {
            name: "鉴权失败 (Error Payload)",
            status: 401,
            duration: 12,
            data: {
                error: {
                    code: "INVALID_CREDENTIALS",
                    message: "用户身份鉴权失败，Token 已过期",
                    details: [
                        { field: "Authorization", reason: "Expired JWT token signature", code: "TOKEN_EXPIRED" }
                    ],
                    requestId: "req_8f92a1c09b",
                    timestamp: 1771761600000
                }
            }
        },
        {
            name: "集群指标 (Metrics)",
            status: 200,
            duration: 85,
            data: {
                status: "healthy",
                cluster: "k8s-prod-shanghai",
                metrics: {
                    cpuUsagePercent: 68.4,
                    memory: { totalBytes: 68719476736, usedBytes: 42949672960, freeRatio: 0.375 },
                    nodes: [
                        { id: "node-01", status: "Ready", pods: ["auth-srv-1", "gateway-2", "db-read-1"] },
                        { id: "node-02", status: "Ready", pods: ["ai-worker-1", "cache-redis-0"] }
                    ]
                }
            }
        }
    ];

    const JSONPATH_PRESETS = [
        { label: "根节点 ($)", expr: "$" },
        { label: "提取全部 ID ($..id)", expr: "$..id" },
        { label: "数据主列表 ($.data.list[*])", expr: "$.data.list[*]" },
        { label: "首项 ($.data.list[0])", expr: "$.data.list[0]" },
        { label: "提取全部 Email ($..email)", expr: "$..email" }
    ];

    onMount(() => {
        const handoff = dataBridge.consume("/api-viewer");
        if (handoff && handoff.payload) {
            rawInput = handoff.payload;
            parseInput();
        } else {
            rawInput = JSON.stringify(SAMPLE_RESPONSES[0].data, null, 2);
            parseInput();
        }
    });

    function parseInput() {
        error = null;
        if (!rawInput.trim()) {
            parsedData = null;
            queryResult = null;
            return;
        }

        try {
            parsedData = JSON.parse(rawInput);
            handleQuery();
        } catch (e: any) {
            error = "JSON 解析失败: " + e.message;
            parsedData = null;
        }
    }

    function formatJson() {
        if (!rawInput.trim()) return;
        try {
            const parsed = JSON.parse(rawInput);
            rawInput = JSON.stringify(parsed, null, 2);
            parsedData = parsed;
            error = null;
            handleQuery();
        } catch (e: any) {
            error = "无法格式化: " + e.message;
        }
    }

    function minifyJson() {
        if (!rawInput.trim()) return;
        try {
            const parsed = JSON.parse(rawInput);
            rawInput = JSON.stringify(parsed);
            parsedData = parsed;
            error = null;
            handleQuery();
        } catch (e: any) {
            error = "无法压缩: " + e.message;
        }
    }

    function loadSample(sample: typeof SAMPLE_RESPONSES[0]) {
        rawInput = JSON.stringify(sample.data, null, 2);
        httpStatusCode = sample.status;
        httpDurationMs = sample.duration;
        parseInput();
        toastStore.info(`已载入示例: ${sample.name}`);
    }

    function handleQuery() {
        if (!parsedData) return;
        try {
            queryResult = JSONPath({ path: jsonPath, json: parsedData });
            error = null;
            if (jsonPath && !jsonPathHistory.includes(jsonPath)) {
                jsonPathHistory = [jsonPath, ...jsonPathHistory.slice(0, 7)];
            }
        } catch (e: any) {
            error = "JSONPath 语法错误: " + e.message;
        }
    }

    async function copyResult() {
        if (queryResult === null || queryResult === undefined) return;
        try {
            await navigator.clipboard.writeText(JSON.stringify(queryResult, null, 2));
            copied = true;
            setTimeout(() => { copied = false; }, 2000);
            toastStore.success("已复制提取结果");
        } catch (e) {
            console.error(e);
        }
    }

    // Comprehensive Multi-sample Schema Inferrer
    interface InferredField {
        key: string;
        path: string;
        type: string;
        nullable: boolean;
        sample: string;
    }

    let schemaAnalysis = $derived.by(() => {
        if (!parsedData || typeof parsedData !== "object") return [];
        const fields: InferredField[] = [];
        const seenPaths = new Set<string>();

        function analyzeValue(v: any): { typeName: string; nullable: boolean; sample: string } {
            if (v === null || v === undefined) {
                return { typeName: "null", nullable: true, sample: "null" };
            }
            if (Array.isArray(v)) {
                const subType = v.length > 0 ? analyzeValue(v[0]).typeName : "any";
                return { typeName: `Array<${subType}>`, nullable: false, sample: `[...${v.length}项]` };
            }
            if (typeof v === "number") {
                return { typeName: Number.isInteger(v) ? "integer" : "float", nullable: false, sample: String(v) };
            }
            if (typeof v === "boolean") {
                return { typeName: "boolean", nullable: false, sample: String(v) };
            }
            if (typeof v === "string") {
                if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) return { typeName: "datetime (ISO8601)", nullable: false, sample: v };
                if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v)) return { typeName: "email", nullable: false, sample: v };
                if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) return { typeName: "uuid", nullable: false, sample: v };
                if (/^https?:\/\//i.test(v)) return { typeName: "url", nullable: false, sample: v };
                return { typeName: "string", nullable: false, sample: v.length > 30 ? v.slice(0, 30) + "..." : v };
            }
            if (typeof v === "object") {
                return { typeName: "object", nullable: false, sample: "{...}" };
            }
            return { typeName: typeof v, nullable: false, sample: String(v) };
        }

        function walk(obj: any, currentPath: string) {
            if (obj === null || obj === undefined) return;
            if (Array.isArray(obj)) {
                for (const item of obj.slice(0, 5)) {
                    walk(item, currentPath ? `${currentPath}[]` : "[]");
                }
                return;
            }
            if (typeof obj === "object") {
                for (const [k, v] of Object.entries(obj)) {
                    const fieldPath = currentPath ? `${currentPath}.${k}` : k;
                    if (!seenPaths.has(fieldPath)) {
                        seenPaths.add(fieldPath);
                        const info = analyzeValue(v);
                        fields.push({
                            key: k,
                            path: fieldPath,
                            type: info.typeName,
                            nullable: info.nullable,
                            sample: info.sample
                        });
                    }
                    if (typeof v === "object" && v !== null) {
                        walk(v, fieldPath);
                    }
                }
            }
        }

        walk(parsedData, "");
        return fields;
    });

    // In-place TypeScript & Zod Code Generator
    let generatedTypes = $derived.by(() => {
        if (!parsedData) return "";
        try {
            if (typeFormat === "ts") {
                return generateTsDefinitions(parsedData, tsTypeName.trim() || "ApiResponse");
            } else {
                return generateZodSchema(parsedData, tsTypeName.trim() || "ApiResponse");
            }
        } catch {
            return "// 生成类型失败，请检查 JSON 结构";
        }
    });

    function capitalize(str: string) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function generateTsDefinitions(obj: any, name: string): string {
        if (typeof obj !== "object" || obj === null) return `export type ${name} = ${typeof obj};`;
        if (Array.isArray(obj)) {
            if (obj.length === 0) return `export type ${name} = any[];`;
            const sub = generateTsDefinitions(obj[0], `${name}Item`);
            return `${sub}\n\nexport type ${name} = ${name}Item[];`;
        }

        const lines: string[] = [`export interface ${name} {`];
        const children: string[] = [];

        for (const [key, val] of Object.entries(obj)) {
            const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
            if (val === null) {
                lines.push(`  ${safeKey}: null | any;`);
            } else if (Array.isArray(val)) {
                if (val.length > 0 && typeof val[0] === "object" && val[0] !== null) {
                    const subTypeName = capitalize(key) + "Item";
                    children.push(generateTsDefinitions(val[0], subTypeName));
                    lines.push(`  ${safeKey}: ${subTypeName}[];`);
                } else if (val.length > 0) {
                    lines.push(`  ${safeKey}: ${typeof val[0]}[];`);
                } else {
                    lines.push(`  ${safeKey}: any[];`);
                }
            } else if (typeof val === "object") {
                const subTypeName = capitalize(key);
                children.push(generateTsDefinitions(val, subTypeName));
                lines.push(`  ${safeKey}: ${subTypeName};`);
            } else {
                lines.push(`  ${safeKey}: ${typeof val};`);
            }
        }
        lines.push("}");
        return [...children, lines.join("\n")].filter(Boolean).join("\n\n");
    }

    function generateZodSchema(obj: any, name: string): string {
        const schemaName = name.charAt(0).toLowerCase() + name.slice(1) + "Schema";
        if (typeof obj !== "object" || obj === null) return `import { z } from "zod";\n\nexport const ${schemaName} = z.${typeof obj}();`;
        
        function buildZod(val: any): string {
            if (val === null) return "z.null()";
            if (Array.isArray(val)) {
                if (val.length === 0) return "z.array(z.any())";
                return `z.array(${buildZod(val[0])})`;
            }
            if (typeof val === "object") {
                const props = Object.entries(val)
                    .map(([k, v]) => `  ${k}: ${buildZod(v)}`)
                    .join(",\n");
                return `z.object({\n${props}\n})`;
            }
            if (typeof val === "number") return Number.isInteger(val) ? "z.number().int()" : "z.number()";
            if (typeof val === "boolean") return "z.boolean()";
            if (typeof val === "string") {
                if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) return "z.string().email()";
                if (/^https?:\/\//.test(val)) return "z.string().url()";
                if (/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(val)) return "z.string().uuid()";
                return "z.string()";
            }
            return "z.any()";
        }

        return `import { z } from "zod";\n\nexport const ${schemaName} = ${buildZod(obj)};\nexport type ${name} = z.infer<typeof ${schemaName}>;`;
    }

    function generateMockRules() {
        if (!parsedData) return;
        let sample = parsedData;
        if (Array.isArray(parsedData) && parsedData.length > 0) sample = parsedData[0];
        else if (parsedData.data && typeof parsedData.data === "object") sample = Array.isArray(parsedData.data) ? parsedData.data[0] : parsedData.data;

        if (!sample || typeof sample !== "object") {
            toastStore.warning("未找到可推导字段的 JSON 对象结构");
            return;
        }

        const fields: any[] = [];
        let idCounter = 1;

        for (const [key, val] of Object.entries(sample)) {
            const k = key.toLowerCase();
            let type = "string_uuid";
            if (k.includes("email")) type = "internet_email";
            else if (k.includes("name") || k.includes("user")) type = "person_fullName";
            else if (k.includes("phone") || k.includes("mobile")) type = "phone_number";
            else if (k.includes("time") || k.includes("date") || k.includes("created")) type = "date_past";
            else if (k.includes("price") || k.includes("amount") || k.includes("cost")) type = "number_currency";
            else if (typeof val === "number") type = Number.isInteger(val) ? "number_int" : "number_float";
            else if (typeof val === "boolean") type = "boolean";
            else type = "internet_userName";

            fields.push({ id: String(idCounter++), name: key, type, isRequired: true });
        }

        dataBridge.send("API 响应查看器", "/mock-generator", {
            dataType: "json",
            payload: JSON.stringify({ name: "从 API 响应推导的规则", fields }, null, 2),
            title: "API 响应推导 Mock"
        }, true);
    }

    function onTextareaKeydown(e: KeyboardEvent) {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            formatJson();
            toastStore.success("已快捷格式化 (Ctrl+Enter)");
        }
    }

    $effect(() => {
        if (jsonPath) handleQuery();
    });
</script>

<svelte:head>
    <title>API 响应查看器 - Aone 工具箱</title>
</svelte:head>

<div class="h-full flex-1 flex flex-col bg-slate-100 dark:bg-slate-950 p-2 gap-2 overflow-hidden">
    <!-- Top Metadata Command Bar -->
    <div class="h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-xs">
        <div class="flex items-center gap-2">
            <span class="font-semibold text-slate-800 dark:text-slate-200">API 响应 Payload</span>
            <div class="flex items-center gap-1 font-mono text-[11px]">
                <span class="px-1.5 py-0.2 rounded font-bold {httpStatusCode >= 200 && httpStatusCode < 300 ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'}">
                    HTTP {httpStatusCode}
                </span>
                <span class="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-0.5">
                    <Clock size={10} /> {httpDurationMs}ms
                </span>
                {#if parsedData}
                    <span class="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {rawInput.length.toLocaleString()} 字符
                    </span>
                {/if}
            </div>
        </div>

        <div class="flex items-center gap-1.5">
            <div class="flex items-center gap-1 mr-2 border-r border-slate-200 dark:border-slate-800 pr-2">
                <span class="text-[10px] text-slate-400">预设:</span>
                {#each SAMPLE_RESPONSES as sample}
                    <button
                        type="button"
                        class="px-1.5 py-0.5 text-[11px] rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition"
                        onclick={() => loadSample(sample)}
                    >
                        {sample.name.split(" ")[0]}
                    </button>
                {/each}
            </div>

            <button
                type="button"
                class="px-2 py-1 text-[11px] font-medium rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1"
                onclick={formatJson}
                title="格式化 JSON (Ctrl+Enter)"
            >
                <AlignLeft size={12} /> 格式化
            </button>
            <button
                type="button"
                class="px-2 py-1 text-[11px] font-medium rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1"
                onclick={minifyJson}
                title="压缩 JSON"
            >
                <Minimize2 size={12} /> 压缩
            </button>
            <HandoffDropdown
                sourceTool="API 响应查看器"
                dataType="json"
                getData={() => rawInput}
            />
            <button
                type="button"
                class="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 transition"
                onclick={() => { rawInput = ""; parseInput(); }}
                title="清空输入"
            >
                <Trash2 size={13} />
            </button>
        </div>
    </div>

    <!-- 2-Column Edge Workbench -->
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 min-h-0">
        <!-- Left: Input Code Editor Area -->
        <div class="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs min-h-0">
            <div class="flex-1 p-0 overflow-hidden relative">
                <textarea
                    bind:value={rawInput}
                    class="w-full h-full p-3 font-mono text-xs bg-transparent resize-none focus:outline-none dark:text-slate-200 leading-relaxed"
                    placeholder="在此粘贴 API 响应 JSON... (Ctrl+Enter 快捷格式化)"
                    oninput={parseInput}
                    onkeydown={onTextareaKeydown}
                ></textarea>

                {#if error && !parsedData}
                    <div class="absolute bottom-3 left-3 right-3 p-2.5 bg-rose-50 dark:bg-rose-950/90 text-rose-600 dark:text-rose-300 text-xs rounded border border-rose-200 dark:border-rose-900 flex items-center gap-2 shadow-xs">
                        <Info size={14} class="shrink-0" />
                        <span class="truncate">{error}</span>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Right: Structured Inspector & Query Workspace -->
        <div class="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs min-h-0">
            <!-- Segmented Inspector Tabs Toolbar -->
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
                <div class="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-md">
                    <button
                        type="button"
                        class="px-2 py-0.5 text-xs font-medium rounded transition {inspectorTab === 'tree' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}"
                        onclick={() => inspectorTab = "tree"}
                    >
                        <ListTree size={12} class="inline mr-1" /> 结构树
                    </button>
                    <button
                        type="button"
                        class="px-2 py-0.5 text-xs font-medium rounded transition {inspectorTab === 'jsonpath' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}"
                        onclick={() => inspectorTab = "jsonpath"}
                    >
                        <Filter size={12} class="inline mr-1" /> JSONPath
                    </button>
                    <button
                        type="button"
                        class="px-2 py-0.5 text-xs font-medium rounded transition {inspectorTab === 'schema' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}"
                        onclick={() => inspectorTab = "schema"}
                    >
                        <Layers size={12} class="inline mr-1" /> 字段推导
                    </button>
                    <button
                        type="button"
                        class="px-2 py-0.5 text-xs font-medium rounded transition {inspectorTab === 'types' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}"
                        onclick={() => inspectorTab = "types"}
                    >
                        <Code2 size={12} class="inline mr-1" /> TS / Zod
                    </button>
                </div>

                <div class="flex items-center gap-1.5">
                    {#if parsedData}
                        <button
                            type="button"
                            class="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 text-xs font-medium transition flex items-center gap-1"
                            onclick={generateMockRules}
                            title="推导为 Mock 规则"
                        >
                            <Database size={12} /> Mock 规则
                        </button>
                    {/if}
                </div>
            </div>

            <!-- Tab Content -->
            <div class="flex-1 flex flex-col min-h-0 p-2 overflow-hidden bg-white dark:bg-slate-900">
                {#if inspectorTab === "tree"}
                    <div class="flex-1 overflow-auto p-1 font-mono text-xs">
                        {#if parsedData}
                            <JsonTreeView data={parsedData} {expandedKeys} />
                        {:else}
                            <div class="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic gap-1">
                                <ListTree size={24} class="text-slate-300 dark:text-slate-700" />
                                <span>在左侧输入 JSON 以渲染交互结构树</span>
                            </div>
                        {/if}
                    </div>

                {:else if inspectorTab === "jsonpath"}
                    <div class="flex flex-col h-full space-y-2 overflow-hidden">
                        <div class="flex flex-col gap-1.5 p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                            <div class="flex items-center gap-2">
                                <input
                                    type="text"
                                    bind:value={jsonPath}
                                    placeholder="输入 JSONPath 表达式 (如 $.data.list[*].email)..."
                                    class="flex-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-400 dark:text-slate-200"
                                />
                                {#if queryResult !== null && queryResult !== undefined}
                                    <button
                                        type="button"
                                        onclick={copyResult}
                                        class="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 rounded text-xs font-medium transition flex items-center gap-1 shrink-0"
                                    >
                                        {#if copied}<Check size={12} /> 已复制{:else}<Copy size={12} /> 复制结果{/if}
                                    </button>
                                {/if}
                            </div>

                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span class="text-[10px] text-slate-400">预设:</span>
                                {#each JSONPATH_PRESETS as preset}
                                    <button
                                        type="button"
                                        class="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-400 hover:text-slate-700 transition"
                                        onclick={() => { jsonPath = preset.expr; handleQuery(); }}
                                    >
                                        {preset.label}
                                    </button>
                                {/each}
                            </div>

                            {#if jsonPathHistory.length > 1}
                                <div class="flex items-center gap-1 flex-wrap pt-1 border-t border-slate-200 dark:border-slate-800">
                                    <History size={10} class="text-slate-400" />
                                    <span class="text-[10px] text-slate-400">历史:</span>
                                    {#each jsonPathHistory.slice(0, 4) as hist}
                                        <button
                                            type="button"
                                            class="px-1 py-0.2 text-[9px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition"
                                            onclick={() => { jsonPath = hist; handleQuery(); }}
                                        >
                                            {hist}
                                        </button>
                                    {/each}
                                </div>
                            {/if}
                        </div>

                        <!-- Result output -->
                        <div class="flex-1 flex flex-col border border-slate-200 dark:border-slate-800 rounded overflow-hidden min-h-0">
                            <div class="bg-slate-50 dark:bg-slate-950 px-2.5 py-1 text-[10px] font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                <span>提取结果</span>
                                {#if queryResult !== null && queryResult !== undefined}
                                    <span class="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                                        {Array.isArray(queryResult) ? `${queryResult.length} 项匹配` : "1 项匹配"}
                                    </span>
                                {/if}
                            </div>
                            <div class="flex-1 overflow-auto p-2.5 bg-slate-50/30 dark:bg-slate-950/40 font-mono text-xs text-slate-800 dark:text-slate-200">
                                {#if queryResult !== null && queryResult !== undefined}
                                    <pre class="leading-relaxed">{JSON.stringify(queryResult, null, 2)}</pre>
                                {:else}
                                    <div class="h-full flex items-center justify-center text-slate-400 text-xs italic">
                                        输入表达式以提取子字段
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>

                {:else if inspectorTab === "schema"}
                    <div class="flex-1 overflow-auto">
                        {#if schemaAnalysis.length > 0}
                            <div class="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
                                <table class="w-full text-left text-xs border-collapse font-mono">
                                    <thead>
                                        <tr class="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                            <th class="p-2 font-semibold">字段路径</th>
                                            <th class="p-2 font-semibold">推导类型</th>
                                            <th class="p-2 font-semibold">示例值</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {#each schemaAnalysis as field}
                                            <tr class="hover:bg-slate-50 dark:hover:bg-slate-950">
                                                <td class="p-1.5 text-slate-700 dark:text-slate-300 font-semibold">{field.path}</td>
                                                <td class="p-1.5">
                                                    <span class="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                        {field.type}{field.nullable ? " | null" : ""}
                                                    </span>
                                                </td>
                                                <td class="p-1.5 text-slate-500 truncate max-w-[200px]" title={field.sample}>{field.sample}</td>
                                            </tr>
                                        {/each}
                                    </tbody>
                                </table>
                            </div>
                        {:else}
                            <div class="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic gap-1">
                                <Layers size={24} class="text-slate-300 dark:text-slate-700" />
                                <span>无可用字段推导数据</span>
                            </div>
                        {/if}
                    </div>

                {:else if inspectorTab === "types"}
                    <div class="flex flex-col h-full space-y-2 overflow-hidden">
                        <div class="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                            <div class="flex items-center gap-2">
                                <span class="text-xs text-slate-500">类型名称:</span>
                                <input
                                    type="text"
                                    bind:value={tsTypeName}
                                    class="w-32 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-400 dark:text-slate-200"
                                />
                                <div class="flex bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded text-[11px]">
                                    <button
                                        type="button"
                                        class="px-2 py-0.2 rounded {typeFormat === 'ts' ? 'bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-white' : 'text-slate-500'}"
                                        onclick={() => typeFormat = 'ts'}
                                    >
                                        TypeScript
                                    </button>
                                    <button
                                        type="button"
                                        class="px-2 py-0.2 rounded {typeFormat === 'zod' ? 'bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-white' : 'text-slate-500'}"
                                        onclick={() => typeFormat = 'zod'}
                                    >
                                        Zod Schema
                                    </button>
                                </div>
                            </div>

                            <button
                                type="button"
                                onclick={() => {
                                    navigator.clipboard.writeText(generatedTypes);
                                    toastStore.success(`已复制 ${typeFormat.toUpperCase()} 类型定义`);
                                }}
                                class="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 rounded text-xs font-medium transition flex items-center gap-1"
                            >
                                <Copy size={12} /> 复制代码
                            </button>
                        </div>

                        <div class="flex-1 border border-slate-200 dark:border-slate-800 rounded overflow-auto p-2.5 bg-slate-50/30 dark:bg-slate-950/40 font-mono text-xs text-slate-800 dark:text-slate-200">
                            {#if generatedTypes}
                                <pre class="leading-relaxed">{generatedTypes}</pre>
                            {:else}
                                <div class="h-full flex items-center justify-center text-slate-400 text-xs italic">
                                    输入有效 JSON 数据以生成代码
                                </div>
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
