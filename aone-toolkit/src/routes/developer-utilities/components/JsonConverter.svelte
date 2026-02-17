<script lang="ts">
    import { Button } from "$lib/components/ui";
    import { Copy, AlertCircle, FileJson, FileCode } from "lucide-svelte";

    let input = $state("");
    let targetLang = $state<"ts" | "go" | "python" | "rust">("ts");
    let output = $state("");
    let error = $state<string | null>(null);

    // --- Helpers ---
    function toCamel(s: string) {
        return s.replace(/([-_][a-z])/gi, ($1) =>
            $1.toUpperCase().replace("-", "").replace("_", ""),
        );
    }
    function toTitle(s: string) {
        return s.slice(0, 1).toUpperCase() + s.slice(1);
    }
    function toPascal(s: string) {
        return toTitle(toCamel(s));
    }

    // --- Core Converter ---
    function convert() {
        error = null;
        if (!input.trim()) {
            output = "";
            return;
        }

        try {
            const obj = JSON.parse(input);
            switch (targetLang) {
                case "ts":
                    output = jsonToTs(obj, "Root");
                    break;
                case "go":
                    output = jsonToGo(obj, "Root");
                    break;
                case "python":
                    output = jsonToPydantic(obj, "Root");
                    break;
                case "rust":
                    output = jsonToRust(obj, "Root");
                    break;
            }
        } catch (e: any) {
            error = "Invalid JSON: " + e.message;
            output = "";
        }
    }

    // --- TypeScript ---
    function jsonToTs(obj: any, rootName: string): string {
        const interfaces: string[] = [];

        function getType(val: any, name: string): string {
            if (Array.isArray(val)) {
                if (val.length === 0) return "any[]";
                return `${getType(val[0], name)}[]`; // Simple heuristic: look at first item
            }
            if (val === null) return "any";
            if (typeof val === "object") {
                return parseObj(val, name);
            }
            return typeof val;
        }

        function parseObj(obj: any, name: string): string {
            const keys = Object.keys(obj);
            const className = toPascal(name);

            const lines = keys.map((key) => {
                const type = getType(obj[key], key);
                // Quote key if needed
                const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
                    ? key
                    : `'${key}'`;
                return `  ${safeKey}: ${type};`;
            });

            // Avoid duplication if exactly same interface exists? (Skipping for simplicity)
            interfaces.push(
                `export interface ${className} {\n${lines.join("\n")}\n}`,
            );
            return className;
        }

        getType(obj, rootName);
        return interfaces.reverse().join("\n\n");
    }

    // --- Go ---
    function jsonToGo(obj: any, rootName: string): string {
        const structs: string[] = [];

        function getType(val: any, name: string): string {
            if (Array.isArray(val)) {
                if (val.length === 0) return "[]interface{}";
                return `[]${getType(val[0], name)}`;
            }
            if (val === null) return "interface{}";
            if (typeof val === "object") {
                return parseObj(val, name);
            }
            if (typeof val === "number")
                return Number.isInteger(val) ? "int" : "float64";
            if (typeof val === "boolean") return "bool";
            return "string";
        }

        function parseObj(obj: any, name: string): string {
            const className = toPascal(name);
            const lines = Object.keys(obj).map((key) => {
                const type = getType(obj[key], key);
                const fieldName = toPascal(key);
                return `\t${fieldName} ${type} \`json:"${key}"\``;
            });
            structs.push(`type ${className} struct {\n${lines.join("\n")}\n}`);
            return className;
        }

        getType(obj, rootName);
        return structs.reverse().join("\n\n");
    }

    // --- Python (Pydantic) ---
    function jsonToPydantic(obj: any, rootName: string): string {
        const classes: string[] = [];
        const preamble =
            "from typing import List, Optional, Any\nfrom pydantic import BaseModel\n\n";

        function getType(val: any, name: string): string {
            if (Array.isArray(val)) {
                if (val.length === 0) return "List[Any]";
                return `List[${getType(val[0], name)}]`;
            }
            if (val === null) return "Optional[Any]";
            if (typeof val === "object") return parseObj(val, name);
            if (typeof val === "boolean") return "bool";
            if (typeof val === "number")
                return Number.isInteger(val) ? "int" : "float";
            return "str";
        }

        function parseObj(obj: any, name: string): string {
            const className = toPascal(name);
            const lines = Object.keys(obj).map((key) => {
                const type = getType(obj[key], key);
                return `    ${key}: ${type}`;
            });
            classes.push(
                `class ${className}(BaseModel):\n${lines.join("\n") || "    pass"}`,
            );
            return className;
        }

        getType(obj, rootName);
        return preamble + classes.reverse().join("\n\n");
    }

    // --- Rust (Serde) ---
    function jsonToRust(obj: any, rootName: string): string {
        const structs: string[] = [];
        const preamble = "use serde::{Deserialize, Serialize};\n\n";

        function getType(val: any, name: string): string {
            if (Array.isArray(val)) {
                if (val.length === 0) return "Vec<serde_json::Value>";
                return `Vec<${getType(val[0], name)}>`;
            }
            if (val === null) return "Option<serde_json::Value>";
            if (typeof val === "object") return parseObj(val, name);
            if (typeof val === "number")
                return Number.isInteger(val) ? "i64" : "f64";
            if (typeof val === "boolean") return "bool";
            return "String";
        }

        function parseObj(obj: any, name: string): string {
            const className = toPascal(name);
            const lines = Object.keys(obj).map((key) => {
                const type = getType(obj[key], key);
                const rKey = key.includes("_")
                    ? ""
                    : `    #[serde(rename = "${key}")]\n`;
                // Simple snake_case conversion for field name could be better, but keeping orig for now
                // Technically rust fields should be snake_case.
                // Let's just use key for simplicity in this PoC
                return `${rKey}    pub ${key}: ${type},`;
            });
            structs.push(
                `#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]\n#[serde(rename_all = "camelCase")]\npub struct ${className} {\n${lines.join("\n")}\n}`,
            );
            return className;
        }

        getType(obj, rootName);
        return preamble + structs.reverse().join("\n\n");
    }

    $effect(() => {
        if (input && input.length < 5000) convert();
    });

    function triggerConvert() {
        convert();
    }
</script>

<div class="h-full flex flex-col gap-6 max-w-6xl mx-auto">
    <!-- Toolbar -->
    <div
        class="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
    >
        <div
            class="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden"
        >
            {#each [{ id: "ts", label: "TypeScript" }, { id: "go", label: "Go" }, { id: "python", label: "Python" }, { id: "rust", label: "Rust" }] as lang}
                <button
                    class="px-4 py-2 text-sm font-medium rounded-md transition-all {targetLang ===
                    lang.id
                        ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-500 hover:text-indigo-500'}"
                    onclick={() => {
                        targetLang = lang.id as any;
                        triggerConvert();
                    }}
                >
                    {lang.label}
                </button>
            {/each}
        </div>

        {#if error}
            <span
                class="text-xs font-semibold text-rose-500 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-full animate-pulse"
            >
                <AlertCircle size={14} />
                {error}
            </span>
        {/if}
    </div>

    <div class="flex-1 flex flex-col lg:flex-row gap-6 min-h-[500px]">
        <!-- Input -->
        <div class="flex-1 flex flex-col gap-2">
            <div
                class="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest pl-2"
            >
                <FileJson size={16} /> JSON Input
            </div>
            <textarea
                bind:value={input}
                class="flex-1 p-6 font-mono text-sm leading-relaxed bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none resize-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition-all text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
                placeholder={`{\n  "id": 1,\n  "name": "Project Aone",\n  "features": ["DevTools", "AI"]\n}`}
            ></textarea>
        </div>

        <!-- Output -->
        <div class="flex-1 flex flex-col gap-2">
            <div class="flex items-center justify-between pl-2">
                <div
                    class="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest"
                >
                    <FileCode size={16} />
                    {targetLang} Output
                </div>
                {#if output}
                    <button
                        class="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 rounded-full transition-colors"
                        onclick={() => navigator.clipboard.writeText(output)}
                    >
                        <Copy size={12} /> Copy
                    </button>
                {/if}
            </div>

            <div class="relative flex-1">
                <textarea
                    value={output}
                    readonly
                    class="w-full h-full p-6 font-mono text-sm leading-relaxed bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none resize-none text-slate-600 dark:text-slate-400"
                    placeholder="Generated types will appear here..."
                ></textarea>

                {#if !output && !input}
                    <div
                        class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40"
                    >
                        <div class="text-center">
                            <FileCode
                                size={48}
                                class="mx-auto text-slate-300 mb-2"
                            />
                            <p class="text-sm text-slate-400">
                                Waiting for JSON data...
                            </p>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
