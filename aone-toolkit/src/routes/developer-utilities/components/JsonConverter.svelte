<script lang="ts">
    import { CodeBlock, CodeEditor } from "$lib/components/ui";
    import { Copy, AlertCircle, FileJson, FileCode, Sparkles, Trash2, AlignLeft } from "lucide-svelte";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import HandoffDropdown from "$lib/components/ui/HandoffDropdown.svelte";

    let input = $state(`{\n  "id": "usr_99812",\n  "name": "Alex Mercer",\n  "email": "alex.mercer@aone.dev",\n  "isAdmin": true,\n  "roles": ["developer", "architect"],\n  "stats": {\n    "loginCount": 42,\n    "lastSeen": "2026-08-26T12:00:00Z"\n  }\n}`);
    let targetLang = $state<"ts" | "go" | "python" | "rust" | "java" | "csharp">("ts");
    let rootName = $state("UserProfile");

    const PRESETS = [
        {
            name: "用户详情 (User)",
            root: "UserProfile",
            val: `{\n  "id": 1001,\n  "username": "antigravity_dev",\n  "email": "dev@aone.io",\n  "isActive": true,\n  "role": "admin",\n  "metadata": {\n    "department": "Engineering",\n    "projects": ["Aone", "Studio"]\n  }\n}`
        },
        {
            name: "REST API 分页响应",
            root: "PaginatedResponse",
            val: `{\n  "code": 200,\n  "message": "success",\n  "data": {\n    "page": 1,\n    "pageSize": 20,\n    "total": 100,\n    "hasMore": true,\n    "items": [\n      {\n        "orderId": "ORD-2026-001",\n        "amount": 199.5,\n        "status": "PAID"\n      }\n    ]\n  }\n}`
        },
        {
            name: "系统配置 (Config)",
            root: "AppConfig",
            val: `{\n  "env": "production",\n  "port": 8080,\n  "rateLimit": 1000,\n  "features": {\n    "enableTelemetry": false,\n    "betaFeatures": ["ai_autocomplete", "wasm_engine"]\n  }\n}`
        }
    ];

    function toCamel(s: string) {
        return s.replace(/([-_][a-z])/gi, ($1) =>
            $1.toUpperCase().replace("-", "").replace("_", ""),
        );
    }
    function toPascal(s: string) {
        const camel = toCamel(s);
        return camel.charAt(0).toUpperCase() + camel.slice(1);
    }

    function jsonToTs(obj: any, root: string): string {
        const interfaces: string[] = [];

        function getType(val: any, name: string): string {
            if (Array.isArray(val)) {
                if (val.length === 0) return "any[]";
                return `${getType(val[0], name)}[]`;
            }
            if (val === null) return "any";
            if (typeof val === "object") {
                return parseObj(val, name);
            }
            return typeof val;
        }

        function parseObj(o: any, name: string): string {
            const className = toPascal(name);
            const lines = Object.keys(o).map((key) => {
                const type = getType(o[key], key);
                const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
                return `  ${safeKey}: ${type};`;
            });
            interfaces.push(`export interface ${className} {\n${lines.join("\n")}\n}`);
            return className;
        }

        parseObj(obj, root);
        return interfaces.reverse().join("\n\n");
    }

    function jsonToGo(obj: any, root: string): string {
        const structs: string[] = [];

        function getType(val: any, name: string): string {
            if (Array.isArray(val)) {
                if (val.length === 0) return "[]any";
                return `[]${getType(val[0], name)}`;
            }
            if (val === null) return "any";
            if (typeof val === "object") return parseObj(val, name);
            if (typeof val === "number") return Number.isInteger(val) ? "int64" : "float64";
            if (typeof val === "boolean") return "bool";
            return "string";
        }

        function parseObj(o: any, name: string): string {
            const structName = toPascal(name);
            const lines = Object.keys(o).map((key) => {
                const fieldName = toPascal(key);
                const type = getType(o[key], key);
                return `\t${fieldName} ${type} \`json:"${key}"\``;
            });
            structs.push(`type ${structName} struct {\n${lines.join("\n")}\n}`);
            return structName;
        }

        parseObj(obj, root);
        return structs.reverse().join("\n\n");
    }

    function jsonToPydantic(obj: any, root: string): string {
        const models: string[] = [];

        function getType(val: any, name: string): string {
            if (Array.isArray(val)) {
                if (val.length === 0) return "List[Any]";
                return `List[${getType(val[0], name)}]`;
            }
            if (val === null) return "Optional[Any]";
            if (typeof val === "object") return parseObj(val, name);
            if (typeof val === "number") return Number.isInteger(val) ? "int" : "float";
            if (typeof val === "boolean") return "bool";
            return "str";
        }

        function parseObj(o: any, name: string): string {
            const modelName = toPascal(name);
            const lines = Object.keys(o).map((key) => {
                const fieldName = key.replace(/[^a-zA-Z0-9_]/g, "_");
                const type = getType(o[key], key);
                return `    ${fieldName}: ${type}`;
            });
            models.push(`class ${modelName}(BaseModel):\n${lines.join("\n") || "    pass"}`);
            return modelName;
        }

        parseObj(obj, root);
        return "from typing import List, Optional, Any\nfrom pydantic import BaseModel\n\n" + models.reverse().join("\n\n");
    }

    function jsonToRust(obj: any, root: string): string {
        const structs: string[] = [];

        function getType(val: any, name: string): string {
            if (Array.isArray(val)) {
                if (val.length === 0) return "Vec<serde_json::Value>";
                return `Vec<${getType(val[0], name)}>`;
            }
            if (val === null) return "Option<serde_json::Value>";
            if (typeof val === "object") return parseObj(val, name);
            if (typeof val === "number") return Number.isInteger(val) ? "i64" : "f64";
            if (typeof val === "boolean") return "bool";
            return "String";
        }

        function parseObj(o: any, name: string): string {
            const structName = toPascal(name);
            const lines = Object.keys(o).map((key) => {
                const fieldName = key.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
                const type = getType(obj[key], key);
                return `    #[serde(rename = "${key}")]\n    pub ${fieldName}: ${type},`;
            });
            structs.push(`#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]\npub struct ${structName} {\n${lines.join("\n")}\n}`);
            return structName;
        }

        parseObj(obj, root);
        return "use serde::{Serialize, Deserialize};\n\n" + structs.reverse().join("\n\n");
    }

    function jsonToJava(obj: any, root: string): string {
        const classes: string[] = [];
        const preamble = "import com.fasterxml.jackson.annotation.JsonProperty;\nimport java.util.List;\n\n";

        function getType(val: any, name: string): string {
            if (Array.isArray(val)) {
                if (val.length === 0) return "List<Object>";
                return `List<${getType(val[0], name)}>`;
            }
            if (val === null) return "Object";
            if (typeof val === "object") return parseObj(val, name);
            if (typeof val === "number") return Number.isInteger(val) ? "Integer" : "Double";
            if (typeof val === "boolean") return "Boolean";
            return "String";
        }

        function parseObj(o: any, name: string): string {
            const className = toPascal(name);
            const fields = Object.keys(o).map((key) => {
                const type = getType(o[key], key);
                const fieldName = toCamel(key);
                return `    @JsonProperty("${key}")\n    private ${type} ${fieldName};`;
            });
            classes.push(`public class ${className} {\n${fields.join("\n\n")}\n}`);
            return className;
        }

        parseObj(obj, root);
        return preamble + classes.reverse().join("\n\n");
    }

    function jsonToCSharp(obj: any, root: string): string {
        const classes: string[] = [];
        const preamble = "using System.Text.Json.Serialization;\nusing System.Collections.Generic;\n\n";

        function getType(val: any, name: string): string {
            if (Array.isArray(val)) {
                if (val.length === 0) return "List<object>";
                return `List<${getType(val[0], name)}>`;
            }
            if (val === null) return "object";
            if (typeof val === "object") return parseObj(val, name);
            if (typeof val === "number") return Number.isInteger(val) ? "int" : "double";
            if (typeof val === "boolean") return "bool";
            return "string";
        }

        function parseObj(o: any, name: string): string {
            const className = toPascal(name);
            const props = Object.keys(o).map((key) => {
                const type = getType(o[key], key);
                const propName = toPascal(key);
                return `    [JsonPropertyName("${key}")]\n    public ${type} ${propName} { get; set; }`;
            });
            classes.push(`public class ${className}\n{\n${props.join("\n\n")}\n}`);
            return className;
        }

        parseObj(obj, root);
        return preamble + classes.reverse().join("\n\n");
    }

    let conversionResult = $derived.by(() => {
        if (!input.trim()) return { output: "", error: null };
        try {
            const parsed = JSON.parse(input);
            const safeRoot = rootName.trim() || "Root";
            let code = "";

            switch (targetLang) {
                case "ts":
                    code = jsonToTs(parsed, safeRoot);
                    break;
                case "go":
                    code = jsonToGo(parsed, safeRoot);
                    break;
                case "python":
                    code = jsonToPydantic(parsed, safeRoot);
                    break;
                case "rust":
                    code = jsonToRust(parsed, safeRoot);
                    break;
                case "java":
                    code = jsonToJava(parsed, safeRoot);
                    break;
                case "csharp":
                    code = jsonToCSharp(parsed, safeRoot);
                    break;
            }
            return { output: code, error: null };
        } catch (e: any) {
            return { output: "", error: "JSON 格式语法错误: " + e.message };
        }
    });

    function applyPreset(p: typeof PRESETS[0]) {
        input = p.val;
        rootName = p.root;
        toastStore.info(`已载入预设：${p.name}`);
    }

    function handleCopy() {
        if (!conversionResult.output) return;
        copyToClipboard(conversionResult.output, `${targetLang.toUpperCase()} 类型定义`);
        toastStore.success(`已复制 ${targetLang.toUpperCase()} 类型定义`);
    }

    function formatJson() {
        try {
            input = JSON.stringify(JSON.parse(input), null, 2);
            toastStore.success("已格式化 JSON");
        } catch {}
    }

    function clearAll() {
        input = "";
        toastStore.info("已清空输入");
    }
</script>

<div class="h-full flex flex-col gap-2.5 min-h-0">
    <!-- Top Command Toolbar -->
    <div class="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-2xs">
        <div class="flex items-center gap-2 flex-wrap min-w-0">
            <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
                <FileJson size={13} class="text-amber-500" />
                JSON 转换为强类型模型
            </span>
            <span class="text-slate-300 dark:text-slate-700">|</span>
            <div class="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[11px]">
                {#each [
                    { id: "ts", label: "TypeScript" },
                    { id: "go", label: "Go Struct" },
                    { id: "python", label: "Python" },
                    { id: "rust", label: "Rust" },
                    { id: "java", label: "Java" },
                    { id: "csharp", label: "C#" }
                ] as lang}
                    <button
                        type="button"
                        class="px-2.5 py-0.5 rounded font-medium transition cursor-pointer {targetLang === lang.id ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                        onclick={() => (targetLang = lang.id as any)}
                    >
                        {lang.label}
                    </button>
                {/each}
            </div>
            <span class="text-slate-300 dark:text-slate-700">|</span>
            <span class="text-slate-400 text-[11px] font-medium shrink-0 flex items-center gap-1">
                <Sparkles size={11} class="text-amber-500" /> 预设:
            </span>
            {#each PRESETS as p}
                <button
                    type="button"
                    class="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    onclick={() => applyPreset(p)}
                >
                    {p.name.split(" ")[0]}
                </button>
            {/each}
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
            <div class="flex items-center gap-1 mr-1 text-slate-400 font-medium text-[11px]">
                <span>根类名:</span>
                <input
                    type="text"
                    bind:value={rootName}
                    class="w-24 px-1.5 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
            </div>
            <HandoffDropdown
                sourceTool="JSON 转类型定义"
                dataType="text"
                getData={() => conversionResult.output}
            />
            <button
                type="button"
                class="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer shadow-2xs font-medium"
                onclick={formatJson}
                title="美化 JSON"
            >
                <AlignLeft size={12} />
                <span>美化</span>
            </button>
            {#if conversionResult.output}
                <button
                    type="button"
                    onclick={handleCopy}
                    class="px-2.5 py-1 text-xs rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition flex items-center gap-1 cursor-pointer shadow-2xs font-semibold"
                >
                    <Copy size={11} /> 复制代码
                </button>
            {/if}
            <button
                type="button"
                class="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                onclick={clearAll}
                title="清空"
            >
                <Trash2 size={13} />
            </button>
        </div>
    </div>

    <!-- Dual Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        <!-- Left: JSON Input (5 cols) -->
        <div class="lg:col-span-5 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
                <span class="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileJson size={13} class="text-amber-500" />
                    输入源 JSON
                </span>
                {#if input}
                    <span class="text-[10px] text-slate-400 font-mono">{input.length} 字符</span>
                {/if}
            </div>

            <div class="flex-1 relative min-h-0 bg-white dark:bg-[#0A0A0A]">
                <CodeEditor
                    bind:value={input}
                    language="json"
                    placeholder="在此输入或粘贴 JSON 字符串..."
                />
            </div>
        </div>

        <!-- Right: Generated Code Output (7 cols) -->
        <div class="lg:col-span-7 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
                <span class="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileCode size={13} class="text-sky-500" />
                    生成 {targetLang.toUpperCase()} 类型模型
                </span>
                {#if conversionResult.output}
                    <span class="text-[10px] text-slate-400 font-mono">{conversionResult.output.split('\n').length} 行</span>
                {/if}
            </div>

            <div class="flex-1 overflow-auto p-3 font-mono text-xs bg-slate-50/40 dark:bg-slate-950/40 min-h-0 custom-scrollbar">
                {#if conversionResult.error}
                    <div class="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-lg text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle size={14} class="text-rose-500 shrink-0" />
                        <span>{conversionResult.error}</span>
                    </div>
                {:else if conversionResult.output}
                    <CodeBlock
                        code={conversionResult.output}
                        language={targetLang === "ts" ? "typescript" : targetLang === "go" ? "go" : targetLang === "rust" ? "rust" : targetLang === "python" ? "python" : "java"}
                        showHeader={false}
                        wrapLines={true}
                        class="!my-0 border-0"
                    />
                {:else}
                    <div class="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic font-sans py-12 gap-2">
                        <FileJson size={24} class="text-slate-300 dark:text-slate-700" />
                        <span>在左侧粘贴 JSON 以即时生成类型定义</span>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
