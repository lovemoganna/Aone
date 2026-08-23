<script lang="ts">
    import { onMount } from "svelte";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import { CodeBlock } from "$lib/components/ui";
    import {
        Plus, Trash2, Copy, Check, Download, FileJson, FileText,
        AlertTriangle, AlertCircle, CheckCircle2,
        Eye, Upload, RotateCcw, Layers, Code2, BookOpen,
        X, Search, Zap, ArrowRight, ListTree, Folder, FolderPlus, FilePlus
    } from "lucide-svelte";

    // ── Types ──────────────────────────────────────────────
    type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    type ParamLocation = "header" | "path" | "query";
    type FieldType = "string" | "number" | "boolean" | "integer" | "array" | "object";
    type AuthType = "none" | "bearer" | "apikey" | "basic";
    type SpecStatus = "draft" | "published" | "deprecated";
    type EditorTab = "basic" | "params" | "reqBody" | "resBody" | "errors" | "examples";

    interface Parameter {
        id: string;
        name: string;
        location: ParamLocation;
        type: FieldType;
        required: boolean;
        description: string;
        example: string;
        defaultValue: string;
    }

    interface SchemaField {
        id: string;
        name: string;
        type: FieldType;
        required: boolean;
        description: string;
        example: string;
        enumValues: string;
    }

    interface ErrorCodeEntry {
        id: string;
        code: string;
        name: string;
        description: string;
    }

    interface ApiSpec {
        id: string;
        title: string;
        description: string;
        path: string;
        method: HttpMethod;
        category: string;
        auth: AuthType;
        status: SpecStatus;
        version: string;
        maintainer: string;
        parameters: Parameter[];
        requestBody: SchemaField[];
        responseBody: SchemaField[];
        errorCodes: ErrorCodeEntry[];
        requestExample: string;
        successResponseExample: string;
        errorResponseExample: string;
    }

    interface ValidationIssue {
        severity: "error" | "warning";
        section: string;
        field: string;
        message: string;
        fix: string;
    }

    // ── State ──────────────────────────────────────────────
    let activeTab = $state<EditorTab>("basic");
    let rightTab = $state<"doc" | "curl" | "yaml" | "json" | "validation">("doc");
    let showImport = $state(false);
    let importInput = $state("");
    let validationRan = $state(false);
    let validationIssues = $state<ValidationIssue[]>([]);
    let specDirty = $state(false);
    let copiedField = $state<string | null>(null);

    // Schema Inferrer in-place states
    let inferJsonText = $state("");
    let showInferPanel = $state<"reqBody" | "resBody" | null>(null);

    const STORAGE_KEY = "aone-api-spec-suite-draft";

    function uid(): string {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    function createDefaultSpec(title = "获取用户信息", path = "/api/v1/users/{id}", method: HttpMethod = "GET"): ApiSpec {
        return {
            id: uid(),
            title,
            description: "根据用户 ID 获取用户详细资料和状态",
            path,
            method,
            category: "用户管理",
            auth: "bearer",
            status: "draft",
            version: "1.0.0",
            maintainer: "Core Team",
            parameters: [
                { id: uid(), name: "id", location: "path", type: "integer", required: true, description: "用户唯一ID", example: "1001", defaultValue: "" },
                { id: uid(), name: "Authorization", location: "header", type: "string", required: true, description: "Bearer 认证令牌", example: "Bearer eyJhbGci...", defaultValue: "" }
            ],
            requestBody: [],
            responseBody: [
                { id: uid(), name: "id", type: "integer", required: true, description: "用户 ID", example: "1001", enumValues: "" },
                { id: uid(), name: "name", type: "string", required: true, description: "用户名", example: "张三", enumValues: "" },
                { id: uid(), name: "email", type: "string", required: true, description: "电子邮箱", example: "zhangsan@example.com", enumValues: "" }
            ],
            errorCodes: [
                { id: uid(), code: "401", name: "Unauthorized", description: "身份认证凭证无效或过期" },
                { id: uid(), code: "404", name: "Not Found", description: "指定资源不存在" }
            ],
            requestExample: "",
            successResponseExample: JSON.stringify({ id: 1001, name: "张三", email: "zhangsan@example.com" }, null, 2),
            errorResponseExample: JSON.stringify({ error: { code: "NOT_FOUND", message: "指定资源不存在" } }, null, 2)
        };
    }

    let endpointList = $state<ApiSpec[]>([createDefaultSpec()]);
    let activeEndpointId = $state<string>(endpointList[0].id);

    let currentSpec = $derived.by(() => {
        return endpointList.find(e => e.id === activeEndpointId) || endpointList[0] || createDefaultSpec();
    });

    // ── Multi-Endpoint Management ──────────────────────────────
    function addNewEndpoint() {
        const newEp = createDefaultSpec("新接口定义", "/api/v1/resource", "GET");
        endpointList = [...endpointList, newEp];
        activeEndpointId = newEp.id;
        activeTab = "basic";
        specDirty = true;
        toastStore.success("已创建新接口");
    }

    function duplicateEndpoint(ep: ApiSpec) {
        const clone: ApiSpec = JSON.parse(JSON.stringify(ep));
        clone.id = uid();
        clone.title = `${ep.title} (副本)`;
        endpointList = [...endpointList, clone];
        activeEndpointId = clone.id;
        specDirty = true;
        toastStore.success("已克隆接口");
    }

    function removeEndpoint(id: string) {
        if (endpointList.length <= 1) {
            toastStore.warning("至少保留一个接口定义");
            return;
        }
        endpointList = endpointList.filter(e => e.id !== id);
        if (activeEndpointId === id) {
            activeEndpointId = endpointList[0].id;
        }
        specDirty = true;
        toastStore.info("已删除接口");
    }

    // ── Validation Engine ──────────────────────────────────
    function validate(s: ApiSpec): ValidationIssue[] {
        const issues: ValidationIssue[] = [];
        if (!s.title.trim()) issues.push({ severity: "error", section: "基础信息", field: "接口名称", message: "接口名称不能为空", fix: "填写接口名称" });
        if (!s.path.trim()) issues.push({ severity: "error", section: "基础信息", field: "接口路径", message: "接口路径不能为空", fix: "填写以 / 开头的路径" });
        else if (!s.path.startsWith("/")) issues.push({ severity: "error", section: "基础信息", field: "接口路径", message: "路径必须以 / 开头", fix: "在路径开头添加 /" });

        const pathParams = (s.path.match(/\{(\w+)\}/g) || []).map((p: string) => p.slice(1, -1));
        for (const pp of pathParams) {
            if (!s.parameters.find(p => p.name === pp && p.location === "path")) {
                issues.push({ severity: "error", section: "请求参数", field: pp, message: `路径参数 {${pp}} 缺少对应的 path 参数定义`, fix: `在参数表中添加名为 "${pp}" 的 path 参数` });
            }
        }

        const seen = new Set<string>();
        for (const p of s.parameters) {
            if (!p.name.trim()) issues.push({ severity: "error", section: "请求参数", field: "(空)", message: "参数名不能为空", fix: "填写参数名" });
            const key = `${p.name}:${p.location}`;
            if (seen.has(key)) issues.push({ severity: "error", section: "请求参数", field: p.name, message: `参数 ${p.name} (${p.location}) 命名冲突重复`, fix: "重命名或移除重复参数" });
            seen.add(key);
        }

        if (["POST", "PUT", "PATCH"].includes(s.method) && s.requestBody.length === 0) {
            issues.push({ severity: "warning", section: "请求体", field: "-", message: `${s.method} 请求建议定义请求体 Schema`, fix: "在请求体标签页添加字段或从 JSON 推断" });
        }
        if (s.responseBody.length === 0) {
            issues.push({ severity: "warning", section: "响应体", field: "-", message: "未定义 200 成功响应体结构", fix: "添加响应体字段" });
        }
        return issues;
    }

    function runValidation() {
        validationIssues = validate(currentSpec);
        validationRan = true;
        if (validationIssues.length === 0) {
            toastStore.success("规范校验通过，格式完整！");
        } else {
            const errs = validationIssues.filter(i => i.severity === "error").length;
            const warns = validationIssues.filter(i => i.severity === "warning").length;
            toastStore.warning(`校验提示：${errs} 处错误，${warns} 处警告`);
        }
    }

    let errorCount = $derived(validationIssues.filter(i => i.severity === "error").length);
    let warningCount = $derived(validationIssues.filter(i => i.severity === "warning").length);

    // ── CRUD Helpers ───────────────────────────────────────
    function addParameter() {
        currentSpec.parameters = [...currentSpec.parameters, { id: uid(), name: "", location: "query", type: "string", required: false, description: "", example: "", defaultValue: "" }];
        specDirty = true;
    }
    function removeParameter(id: string) {
        currentSpec.parameters = currentSpec.parameters.filter(p => p.id !== id);
        specDirty = true;
    }
    function addSchemaField(target: "requestBody" | "responseBody") {
        currentSpec[target] = [...currentSpec[target], { id: uid(), name: "", type: "string", required: false, description: "", example: "", enumValues: "" }];
        specDirty = true;
    }
    function removeSchemaField(target: "requestBody" | "responseBody", id: string) {
        currentSpec[target] = currentSpec[target].filter(f => f.id !== id);
        specDirty = true;
    }
    function addErrorCode() {
        currentSpec.errorCodes = [...currentSpec.errorCodes, { id: uid(), code: "", name: "", description: "" }];
        specDirty = true;
    }
    function removeErrorCode(id: string) {
        currentSpec.errorCodes = currentSpec.errorCodes.filter(ec => ec.id !== id);
        specDirty = true;
    }

    // ── In-place JSON Schema Inference ──────────────────────
    function inferSchemaFromJson(target: "requestBody" | "responseBody") {
        try {
            const obj = JSON.parse(inferJsonText);
            if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
                toastStore.error("JSON 必须为一个顶级对象 {}");
                return;
            }
            const fields: SchemaField[] = Object.entries(obj).map(([key, value]) => ({
                id: uid(),
                name: key,
                type: inferType(value),
                required: true,
                description: "",
                example: typeof value === "object" ? JSON.stringify(value) : String(value),
                enumValues: ""
            }));
            currentSpec[target] = fields;
            specDirty = true;
            showInferPanel = null;
            inferJsonText = "";
            toastStore.success(`已成功推导出 ${fields.length} 个字段`);
        } catch {
            toastStore.error("JSON 格式无效，请检查语法");
        }
    }

    function inferType(value: unknown): FieldType {
        if (value === null) return "string";
        if (typeof value === "boolean") return "boolean";
        if (typeof value === "number") return Number.isInteger(value) ? "integer" : "number";
        if (Array.isArray(value)) return "array";
        if (typeof value === "object") return "object";
        return "string";
    }

    // ── Full OpenAPI Multi-Endpoint Import ──────────────────
    function importOpenApi() {
        try {
            const raw = JSON.parse(importInput);
            const paths = raw.paths || {};
            const pathKeys = Object.keys(paths);
            if (pathKeys.length === 0) {
                toastStore.error("未在 JSON 中找到 paths 路由定义");
                return;
            }

            const importedList: ApiSpec[] = [];

            for (const pathKey of pathKeys) {
                const pathObj = paths[pathKey];
                const methods = ["get", "post", "put", "patch", "delete"] as const;

                for (const method of methods) {
                    if (pathObj[method]) {
                        const ep = pathObj[method];
                        const methodUpper = method.toUpperCase() as HttpMethod;

                        // Parse parameters
                        const params: Parameter[] = (ep.parameters || []).map((p: any) => ({
                            id: uid(),
                            name: p.name || "",
                            location: p.in || "query",
                            type: p.schema?.type || "string",
                            required: !!p.required,
                            description: p.description || "",
                            example: p.example ? String(p.example) : "",
                            defaultValue: p.schema?.default ? String(p.schema.default) : ""
                        }));

                        // Parse requestBody
                        const reqFields: SchemaField[] = [];
                        const reqSchema = ep.requestBody?.content?.["application/json"]?.schema?.properties;
                        if (reqSchema && typeof reqSchema === "object") {
                            for (const [k, v] of Object.entries(reqSchema)) {
                                const prop = v as any;
                                reqFields.push({
                                    id: uid(),
                                    name: k,
                                    type: prop.type || "string",
                                    required: !!(ep.requestBody?.content?.["application/json"]?.schema?.required || []).includes(k),
                                    description: prop.description || "",
                                    example: prop.example ? String(prop.example) : "",
                                    enumValues: prop.enum ? prop.enum.join(",") : ""
                                });
                            }
                        }

                        // Parse responseBody
                        const resFields: SchemaField[] = [];
                        const resSchema = ep.responses?.["200"]?.content?.["application/json"]?.schema?.properties;
                        if (resSchema && typeof resSchema === "object") {
                            for (const [k, v] of Object.entries(resSchema)) {
                                const prop = v as any;
                                resFields.push({
                                    id: uid(),
                                    name: k,
                                    type: prop.type || "string",
                                    required: !!(ep.responses?.["200"]?.content?.["application/json"]?.schema?.required || []).includes(k),
                                    description: prop.description || "",
                                    example: prop.example ? String(prop.example) : "",
                                    enumValues: prop.enum ? prop.enum.join(",") : ""
                                });
                            }
                        }

                        // Parse error codes
                        const errorCodes: ErrorCodeEntry[] = [];
                        for (const [code, resp] of Object.entries(ep.responses || {})) {
                            if (code !== "200" && code !== "201" && code !== "default") {
                                const r = resp as any;
                                errorCodes.push({
                                    id: uid(),
                                    code,
                                    name: r.description?.split(":")[0] || `HTTP ${code}`,
                                    description: r.description?.split(":")[1] || r.description || ""
                                });
                            }
                        }

                        importedList.push({
                            id: uid(),
                            title: ep.summary || ep.operationId || `${methodUpper} ${pathKey}`,
                            description: ep.description || "",
                            path: pathKey,
                            method: methodUpper,
                            category: (ep.tags || [])[0] || "默认分组",
                            auth: "none",
                            status: "draft",
                            version: raw.info?.version || "1.0.0",
                            maintainer: raw.info?.contact?.name || "",
                            parameters: params,
                            requestBody: reqFields,
                            responseBody: resFields,
                            errorCodes,
                            requestExample: "",
                            successResponseExample: "",
                            errorResponseExample: ""
                        });
                    }
                }
            }

            if (importedList.length === 0) {
                toastStore.warning("未能解析出有效的 HTTP 路由端点");
                return;
            }

            endpointList = importedList;
            activeEndpointId = endpointList[0].id;
            showImport = false;
            importInput = "";
            specDirty = true;
            toastStore.success(`成功导入 ${importedList.length} 个 OpenAPI 接口定义`);
        } catch (e: any) {
            toastStore.error(`导入失败：${e.message || "JSON 格式无效"}`);
        }
    }

    // ── Export Generators ───────────────────────────────────
    function generateOpenApiJson(): string {
        const schemaFields = (fields: SchemaField[]) => {
            const properties: Record<string, any> = {};
            const required: string[] = [];
            for (const f of fields) {
                properties[f.name] = { type: f.type, description: f.description, example: f.example };
                if (f.enumValues.trim()) properties[f.name].enum = f.enumValues.split(",").map(v => v.trim());
                if (f.required) required.push(f.name);
            }
            return { type: "object", properties, ...(required.length ? { required } : {}) };
        };

        const pathsObj: Record<string, any> = {};

        for (const ep of endpointList) {
            if (!pathsObj[ep.path]) pathsObj[ep.path] = {};
            pathsObj[ep.path][ep.method.toLowerCase()] = {
                summary: ep.title,
                description: ep.description,
                tags: ep.category ? [ep.category] : [],
                parameters: ep.parameters.filter(p => p.location !== "header" || p.name !== "Content-Type").map(p => ({
                    name: p.name,
                    in: p.location,
                    required: p.required,
                    description: p.description,
                    schema: { type: p.type, ...(p.defaultValue ? { default: p.defaultValue } : {}), ...(p.example ? { example: p.example } : {}) }
                })),
                ...(ep.requestBody.length > 0 ? {
                    requestBody: { required: true, content: { "application/json": { schema: schemaFields(ep.requestBody) } } }
                } : {}),
                responses: {
                    "200": { description: "成功响应", content: { "application/json": { schema: schemaFields(ep.responseBody) } } },
                    ...Object.fromEntries(ep.errorCodes.map(ec => [ec.code, { description: `${ec.name}: ${ec.description}` }]))
                }
            };
        }

        const openapi = {
            openapi: "3.0.0",
            info: {
                title: "Aone API 规范文档",
                description: "由 Aone Toolkit API 规范工作台生成",
                version: currentSpec.version || "1.0.0"
            },
            paths: pathsObj
        };

        return JSON.stringify(openapi, null, 2);
    }

    function generateCurlCommand(): string {
        let url = currentSpec.path || "/api/v1/resource";
        const queryParams = currentSpec.parameters.filter(p => p.location === "query" && p.name);
        if (queryParams.length > 0) {
            const qs = queryParams.map(p => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.example || p.defaultValue || "value")}`).join("&");
            url += (url.includes("?") ? "&" : "?") + qs;
        }
        let cmd = `curl -X ${currentSpec.method} "https://api.example.com${url}"`;
        if (currentSpec.auth === "bearer") cmd += ` \\\n  -H "Authorization: Bearer YOUR_TOKEN"`;
        else if (currentSpec.auth === "basic") cmd += ` \\\n  -u "username:password"`;

        currentSpec.parameters.filter(p => p.location === "header" && p.name).forEach(h => {
            cmd += ` \\\n  -H "${h.name}: ${h.example || h.defaultValue || 'value'}"`;
        });

        if (["POST", "PUT", "PATCH"].includes(currentSpec.method)) {
            cmd += ` \\\n  -H "Content-Type: application/json"`;
            const bodyData = currentSpec.requestExample ? currentSpec.requestExample : (currentSpec.requestBody.length > 0 ? JSON.stringify(Object.fromEntries(currentSpec.requestBody.map(f => [f.name, f.example || f.type])), null, 2) : "{}");
            cmd += ` \\\n  -d '${bodyData.replace(/'/g, "'\\''")}'`;
        }
        return cmd;
    }

    function generateMarkdown(): string {
        let md = `# ${currentSpec.method} ${currentSpec.path}\n\n`;
        md += `**${currentSpec.title}**\n\n`;
        if (currentSpec.description) md += `${currentSpec.description}\n\n`;
        md += `| 属性 | 值 |\n|---|---|\n`;
        md += `| 模块 | ${currentSpec.category || "默认"} |\n`;
        md += `| 认证方式 | ${currentSpec.auth.toUpperCase()} |\n`;
        md += `| 状态 | ${currentSpec.status} |\n`;
        md += `| 版本 | ${currentSpec.version} |\n\n`;

        if (currentSpec.parameters.length > 0) {
            md += `### 请求参数\n\n`;
            md += `| 参数名 | 位置 | 类型 | 必填 | 说明 | 示例 |\n|---|---|---|---|---|---|\n`;
            for (const p of currentSpec.parameters) {
                md += `| \`${p.name}\` | ${p.location} | ${p.type} | ${p.required ? "是" : "否"} | ${p.description} | ${p.example} |\n`;
            }
            md += "\n";
        }

        if (currentSpec.responseBody.length > 0) {
            md += `### 响应体结构 (200 OK)\n\n`;
            md += `| 字段名 | 类型 | 必填 | 说明 | 示例 |\n|---|---|---|---|---|\n`;
            for (const f of currentSpec.responseBody) {
                md += `| \`${f.name}\` | ${f.type} | ${f.required ? "是" : "否"} | ${f.description} | ${f.example} |\n`;
            }
            md += "\n";
        }

        if (currentSpec.errorCodes.length > 0) {
            md += `### 错误状态码\n\n`;
            md += `| 状态码 | 名称 | 说明 |\n|---|---|---|\n`;
            for (const ec of currentSpec.errorCodes) {
                md += `| ${ec.code} | ${ec.name} | ${ec.description} |\n`;
            }
        }
        return md;
    }

    async function copyToClipboard(text: string, label: string) {
        try {
            await navigator.clipboard.writeText(text);
            copiedField = label;
            toastStore.success(`已复制 ${label}`);
            setTimeout(() => { copiedField = null; }, 2000);
        } catch {
            toastStore.error("复制失败");
        }
    }

    function saveToLocal() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(endpointList));
        specDirty = false;
        toastStore.success("已保存所有接口规范至本地");
    }

    onMount(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    endpointList = parsed;
                    activeEndpointId = endpointList[0].id;
                }
            } catch { /* ignore */ }
        }
    });

    const METHOD_COLORS: Record<HttpMethod, string> = {
        GET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        POST: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
        PUT: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        PATCH: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
        DELETE: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    };

    const TABS: { key: EditorTab; label: string }[] = [
        { key: "basic", label: "基础信息" },
        { key: "params", label: "请求参数" },
        { key: "reqBody", label: "请求体" },
        { key: "resBody", label: "响应体" },
        { key: "errors", label: "错误码" },
        { key: "examples", label: "示例数据" },
    ];

    const FIELD_TYPES: FieldType[] = ["string", "number", "integer", "boolean", "array", "object"];
    const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];
    const PARAM_LOCATIONS: ParamLocation[] = ["query", "path", "header"];
</script>

<svelte:head>
    <title>API 规范工作台 - Aone Toolkit</title>
</svelte:head>

<!-- Import OpenAPI Dialog -->
{#if showImport}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div class="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh]">
            <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <span class="font-bold text-xs">导入 OpenAPI 3.0 全量规范 JSON</span>
                <button onclick={() => { showImport = false; importInput = ""; }} class="p-1 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                </button>
            </div>
            <div class="p-4 space-y-3 flex-1 flex flex-col min-h-0">
                <p class="text-xs text-slate-500">粘贴包含多个路径的完整 OpenAPI 3.0 JSON 文档，系统将提取所有路由端点：</p>
                <textarea
                    bind:value={importInput}
                    class="flex-1 w-full p-2.5 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded resize-none focus:outline-none focus:ring-1 focus:ring-slate-400"
                    placeholder={'{"openapi": "3.0.0", "paths": { "/api/v1/users": { "get": {...}, "post": {...} } }}'}
                ></textarea>
            </div>
            <div class="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-200 dark:border-slate-800">
                <button
                    class="px-3 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    onclick={() => { showImport = false; importInput = ""; }}
                >
                    取消
                </button>
                <button
                    class="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 rounded text-xs font-semibold"
                    onclick={importOpenApi}
                >
                    导入全部端点
                </button>
            </div>
        </div>
    </div>
{/if}

<div class="h-full flex-1 flex flex-col bg-slate-100 dark:bg-slate-950 p-2 gap-2 overflow-hidden">
    <!-- Top Command Toolbar -->
    <div class="h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-xs">
        <div class="flex items-center gap-2">
            <span class="font-bold text-slate-800 dark:text-slate-200">API 规范工作台</span>
            <span class="text-slate-400 font-mono text-[11px]">({endpointList.length} 个端点)</span>
            {#if specDirty}
                <span class="text-[10px] text-amber-500 font-medium">● 未保存变更</span>
            {/if}
        </div>

        <div class="flex items-center gap-1.5">
            <button
                type="button"
                class="px-2 py-1 text-xs font-medium rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1"
                onclick={runValidation}
            >
                <CheckCircle2 size={13} class="text-emerald-500" /> 校验完整性
            </button>
            <button
                type="button"
                class="px-2 py-1 text-xs font-medium rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1"
                onclick={() => showImport = true}
            >
                <Upload size={13} /> 导入 OpenAPI
            </button>
            <button
                type="button"
                class="px-2.5 py-1 text-xs font-semibold rounded bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 transition flex items-center gap-1 shadow-2xs"
                onclick={saveToLocal}
            >
                <Check size={13} /> 保存草稿
            </button>
        </div>
    </div>

    <!-- 3-Pane Responsive Workbench -->
    <div class="flex-1 grid grid-cols-1 md:grid-cols-[220px_1fr] lg:grid-cols-[220px_1fr_1fr] gap-2 min-h-0">
        
        <!-- Left: Endpoint Navigation Sidebar -->
        <div class="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs min-h-0">
            <div class="h-8 px-2.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
                <span class="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <ListTree size={12} /> 接口路由树
                </span>
                <button
                    type="button"
                    class="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
                    onclick={addNewEndpoint}
                    title="添加新接口"
                >
                    <Plus size={13} />
                </button>
            </div>

            <div class="flex-1 overflow-y-auto p-1.5 space-y-1">
                {#each endpointList as ep}
                    <div class="group flex items-center justify-between p-1.5 rounded transition text-xs {activeEndpointId === ep.id ? 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700' : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'}">
                        <button
                            type="button"
                            class="flex-1 text-left min-w-0 pr-1"
                            onclick={() => { activeEndpointId = ep.id; activeTab = 'basic'; }}
                        >
                            <div class="flex items-center gap-1.5">
                                <span class="px-1 py-0.2 rounded font-mono font-bold text-[9px] {METHOD_COLORS[ep.method]}">
                                    {ep.method}
                                </span>
                                <span class="font-medium truncate text-slate-800 dark:text-slate-200 text-[11px]">{ep.title || "未命名接口"}</span>
                            </div>
                            <div class="font-mono text-[10px] text-slate-400 truncate mt-0.5">{ep.path}</div>
                        </button>

                        <div class="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0">
                            <button
                                type="button"
                                class="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                                onclick={() => duplicateEndpoint(ep)}
                                title="克隆此接口"
                            >
                                <Copy size={11} />
                            </button>
                            <button
                                type="button"
                                class="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600"
                                onclick={() => removeEndpoint(ep.id)}
                                title="删除接口"
                            >
                                <Trash2 size={11} />
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        </div>

        <!-- Center: Active Endpoint Form Editor -->
        <div class="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs min-h-0">
            <!-- Tabs Header -->
            <div class="h-8 px-2 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 shrink-0 overflow-x-auto text-xs">
                {#each TABS as tab}
                    <button
                        type="button"
                        class="px-2.5 py-1 rounded text-xs font-medium transition whitespace-nowrap {activeTab === tab.key ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
                        onclick={() => activeTab = tab.key}
                    >
                        {tab.label}
                        {#if tab.key === "params" && currentSpec.parameters.length > 0}
                            <span class="text-[10px] opacity-70">({currentSpec.parameters.length})</span>
                        {:else if tab.key === "reqBody" && currentSpec.requestBody.length > 0}
                            <span class="text-[10px] opacity-70">({currentSpec.requestBody.length})</span>
                        {:else if tab.key === "resBody" && currentSpec.responseBody.length > 0}
                            <span class="text-[10px] opacity-70">({currentSpec.responseBody.length})</span>
                        {:else if tab.key === "errors" && currentSpec.errorCodes.length > 0}
                            <span class="text-[10px] opacity-70">({currentSpec.errorCodes.length})</span>
                        {/if}
                    </button>
                {/each}
            </div>

            <!-- Tab Form Body -->
            <div class="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {#if activeTab === "basic"}
                    <div class="space-y-3 text-xs">
                        <div class="flex gap-2">
                            <select bind:value={currentSpec.method} class="w-24 p-1.5 font-bold font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                                {#each METHODS as m}<option value={m}>{m}</option>{/each}
                            </select>
                            <input
                                type="text"
                                bind:value={currentSpec.path}
                                placeholder={"/api/v1/resource/{id}"}
                                class="flex-1 p-1.5 font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-1 focus:ring-slate-400"
                            />
                        </div>

                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="text-[10px] text-slate-400 mb-1 block">接口名称 *</label>
                                <input type="text" bind:value={currentSpec.title} placeholder="例：获取用户信息" class="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                            </div>
                            <div>
                                <label class="text-[10px] text-slate-400 mb-1 block">所属模块</label>
                                <input type="text" bind:value={currentSpec.category} placeholder="例：用户管理" class="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                            </div>
                        </div>

                        <div>
                            <label class="text-[10px] text-slate-400 mb-1 block">接口详细说明</label>
                            <textarea bind:value={currentSpec.description} rows={3} placeholder="简要说明业务背景、权限及调用限制" class="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none"></textarea>
                        </div>

                        <div class="grid grid-cols-3 gap-2">
                            <div>
                                <label class="text-[10px] text-slate-400 mb-1 block">鉴权方式</label>
                                <select bind:value={currentSpec.auth} class="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                                    <option value="none">无鉴权</option>
                                    <option value="bearer">Bearer Token</option>
                                    <option value="apikey">API Key</option>
                                    <option value="basic">Basic Auth</option>
                                </select>
                            </div>
                            <div>
                                <label class="text-[10px] text-slate-400 mb-1 block">状态</label>
                                <select bind:value={currentSpec.status} class="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                                    <option value="draft">草稿</option>
                                    <option value="published">已发布</option>
                                    <option value="deprecated">已废弃</option>
                                </select>
                            </div>
                            <div>
                                <label class="text-[10px] text-slate-400 mb-1 block">版本号</label>
                                <input type="text" bind:value={currentSpec.version} class="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                            </div>
                        </div>
                    </div>

                {:else if activeTab === "params"}
                    <div class="space-y-2 text-xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs text-slate-500 font-semibold">Header / Path / Query 参数</span>
                            <button onclick={addParameter} class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 text-[11px]">
                                <Plus size={11} /> 添加参数
                            </button>
                        </div>

                        {#if currentSpec.parameters.length === 0}
                            <div class="py-8 text-center text-slate-400 text-xs">暂无请求参数</div>
                        {:else}
                            <div class="space-y-2">
                                {#each currentSpec.parameters as p}
                                    <div class="p-2 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1.5">
                                        <div class="flex items-center gap-2">
                                            <input type="text" bind:value={p.name} placeholder="参数名" class="flex-1 p-1 font-mono text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                                            <select bind:value={p.location} class="w-20 p-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                                                {#each PARAM_LOCATIONS as loc}<option value={loc}>{loc}</option>{/each}
                                            </select>
                                            <select bind:value={p.type} class="w-20 p-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                                                {#each FIELD_TYPES as ft}<option value={ft}>{ft}</option>{/each}
                                            </select>
                                            <label class="flex items-center gap-1 text-[11px] cursor-pointer">
                                                <input type="checkbox" bind:checked={p.required} class="rounded" /> 必填
                                            </label>
                                            <button onclick={() => removeParameter(p.id)} class="text-slate-400 hover:text-rose-500 p-1">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <input type="text" bind:value={p.description} placeholder="说明" class="flex-1 p-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                                            <input type="text" bind:value={p.example} placeholder="示例值" class="w-28 p-1 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>

                {:else if activeTab === "reqBody" || activeTab === "resBody"}
                    {@const targetProp = activeTab === "reqBody" ? "requestBody" : "responseBody"}
                    <div class="space-y-2 text-xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs text-slate-500 font-semibold">{targetProp === "requestBody" ? "请求体" : "200 响应体"} JSON Schema</span>
                            <div class="flex items-center gap-1">
                                <button
                                    onclick={() => {
                                        const cur = activeTab as "reqBody" | "resBody";
                                        showInferPanel = showInferPanel === cur ? null : cur;
                                    }}
                                    class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[11px]"
                                >
                                    <Zap size={11} class="text-amber-500" /> 从 JSON 推断
                                </button>
                                <button
                                    onclick={() => addSchemaField(targetProp)}
                                    class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 text-[11px]"
                                >
                                    <Plus size={11} /> 添加字段
                                </button>
                            </div>
                        </div>

                        {#if showInferPanel === activeTab}
                            <div class="p-2.5 rounded border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
                                <div class="text-[11px] font-bold text-amber-800 dark:text-amber-300">粘贴 JSON 自动解析字段结构：</div>
                                <textarea
                                    bind:value={inferJsonText}
                                    rows={4}
                                    placeholder={'{"id": 1001, "name": "Alice", "active": true}'}
                                    class="w-full p-2 font-mono text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                ></textarea>
                                <div class="flex justify-end gap-1.5">
                                    <button onclick={() => showInferPanel = null} class="px-2 py-0.5 rounded text-[11px] text-slate-500">取消</button>
                                    <button onclick={() => inferSchemaFromJson(targetProp)} class="px-2.5 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium text-[11px]">执行推断</button>
                                </div>
                            </div>
                        {/if}

                        {#if currentSpec[targetProp].length === 0}
                            <div class="py-8 text-center text-slate-400 text-xs">暂无字段定义</div>
                        {:else}
                            <div class="space-y-1.5">
                                {#each currentSpec[targetProp] as field}
                                    <div class="flex items-center gap-1.5 p-1.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                                        <input type="text" bind:value={field.name} placeholder="字段名" class="w-32 p-1 font-mono text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                                        <select bind:value={field.type} class="w-20 p-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                                            {#each FIELD_TYPES as ft}<option value={ft}>{ft}</option>{/each}
                                        </select>
                                        <label class="flex items-center gap-1 text-[11px] cursor-pointer shrink-0">
                                            <input type="checkbox" bind:checked={field.required} class="rounded" /> 必填
                                        </label>
                                        <input type="text" bind:value={field.description} placeholder="说明" class="flex-1 p-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                                        <input type="text" bind:value={field.example} placeholder="示例" class="w-24 p-1 font-mono text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                                        <button onclick={() => removeSchemaField(targetProp, field.id)} class="text-slate-400 hover:text-rose-500 p-1">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>

                {:else if activeTab === "errors"}
                    <div class="space-y-2 text-xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs text-slate-500 font-semibold">非 2xx 异常状态码</span>
                            <button onclick={addErrorCode} class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 text-[11px]">
                                <Plus size={11} /> 添加错误码
                            </button>
                        </div>

                        {#if currentSpec.errorCodes.length === 0}
                            <div class="py-8 text-center text-slate-400 text-xs">暂无错误码定义</div>
                        {:else}
                            <div class="space-y-1.5">
                                {#each currentSpec.errorCodes as ec}
                                    <div class="flex items-center gap-1.5 p-1.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                                        <input type="text" bind:value={ec.code} placeholder="400" class="w-16 p-1 font-mono font-bold text-center text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-rose-600" />
                                        <input type="text" bind:value={ec.name} placeholder="Bad Request" class="w-32 p-1 text-xs font-semibold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                                        <input type="text" bind:value={ec.description} placeholder="说明" class="flex-1 p-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                                        <button onclick={() => removeErrorCode(ec.id)} class="text-slate-400 hover:text-rose-500 p-1">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>

                {:else if activeTab === "examples"}
                    <div class="space-y-3 text-xs">
                        <div>
                            <label class="text-[10px] text-slate-400 mb-1 block">成功响应 JSON Payload 示例 (200 OK)</label>
                            <textarea bind:value={currentSpec.successResponseExample} rows={5} placeholder={'{"code": 200, "data": {...}}'} class="w-full p-2 font-mono text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"></textarea>
                        </div>
                        <div>
                            <label class="text-[10px] text-slate-400 mb-1 block">错误响应 JSON Payload 示例 (4xx / 5xx)</label>
                            <textarea bind:value={currentSpec.errorResponseExample} rows={5} placeholder={'{"error": {"code": "INVALID_PARAM", "message": "..."}}'} class="w-full p-2 font-mono text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"></textarea>
                        </div>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Right: Real-time Live Preview & Export Inspector -->
        <div class="hidden lg:flex lg:flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs min-h-0">
            <!-- Right Tab Switcher -->
            <div class="h-8 px-2 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
                <div class="flex items-center gap-1">
                    <button
                        type="button"
                        class="px-2 py-0.5 rounded text-[11px] font-medium {rightTab === 'doc' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500'}"
                        onclick={() => rightTab = 'doc'}
                    >
                        Markdown 文档
                    </button>
                    <button
                        type="button"
                        class="px-2 py-0.5 rounded text-[11px] font-medium {rightTab === 'curl' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500'}"
                        onclick={() => rightTab = 'curl'}
                    >
                        cURL
                    </button>
                    <button
                        type="button"
                        class="px-2 py-0.5 rounded text-[11px] font-medium {rightTab === 'json' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500'}"
                        onclick={() => rightTab = 'json'}
                    >
                        OpenAPI JSON
                    </button>
                    <button
                        type="button"
                        class="px-2 py-0.5 rounded text-[11px] font-medium {rightTab === 'validation' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500'}"
                        onclick={() => rightTab = 'validation'}
                    >
                        校验诊断
                    </button>
                </div>

                <button
                    type="button"
                    class="p-1 text-slate-500 hover:text-slate-700 flex items-center gap-1 text-[11px]"
                    onclick={() => {
                        if (rightTab === "doc") copyToClipboard(generateMarkdown(), "Markdown 文档");
                        else if (rightTab === "curl") copyToClipboard(generateCurlCommand(), "cURL 命令");
                        else copyToClipboard(generateOpenApiJson(), "OpenAPI JSON");
                    }}
                >
                    <Copy size={11} /> 复制
                </button>
            </div>

            <!-- Right Content Inspector -->
            <div class="flex-1 overflow-auto p-3 bg-slate-50/30 dark:bg-slate-950/40">
                {#if rightTab === "doc"}
                    <CodeBlock
                        code={generateMarkdown()}
                        language="markdown"
                        showHeader={false}
                        wrapLines={true}
                        class="!my-0"
                    />
                {:else if rightTab === "curl"}
                    <CodeBlock
                        code={generateCurlCommand()}
                        language="bash"
                        showHeader={false}
                        wrapLines={true}
                        class="!my-0"
                    />
                {:else if rightTab === "json"}
                    <CodeBlock
                        code={generateOpenApiJson()}
                        language="json"
                        showHeader={false}
                        wrapLines={true}
                        class="!my-0"
                    />
                {:else if rightTab === "validation"}
                    <div class="space-y-2 font-sans">
                        {#if validationIssues.length === 0}
                            <div class="py-8 text-center text-emerald-600 dark:text-emerald-400 text-xs">
                                <CheckCircle2 size={24} class="mx-auto mb-1" />
                                规范格式完整，没有发现异常
                            </div>
                        {:else}
                            {#each validationIssues as issue}
                                <div class="p-2 rounded border text-xs {issue.severity === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300' : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300'}">
                                    <div class="font-bold flex items-center gap-1">
                                        <AlertTriangle size={12} /> {issue.section} - {issue.field}: {issue.message}
                                    </div>
                                    <div class="text-[11px] opacity-80 mt-0.5">建议修复：{issue.fix}</div>
                                </div>
                            {/each}
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
