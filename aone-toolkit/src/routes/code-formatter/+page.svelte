<script lang="ts">
    import { Panel, Button } from "$lib/components/ui";
    import { Copy, Trash2, Maximize2, Minimize2, Check } from "lucide-svelte";

    let input = $state("");
    let language = $state("json");
    let indent = $state(2);
    let error = $state<string | null>(null);
    let copied = $state(false);

    const LANGUAGES = [
        { id: "json", label: "JSON" },
        { id: "html", label: "HTML" },
        { id: "css", label: "CSS" },
        { id: "sql", label: "SQL" },
    ];

    function format() {
        error = null;
        if (!input.trim()) return;

        try {
            switch (language) {
                case "json":
                    const obj = JSON.parse(input);
                    input = JSON.stringify(obj, null, indent);
                    break;
                case "html":
                    input = formatHTML(input);
                    break;
                case "css":
                    input = formatCSS(input);
                    break;
                case "sql":
                    input = formatSQL(input);
                    break;
            }
        } catch (e: any) {
            error = "Format error: " + e.message;
        }
    }

    function minify() {
        error = null;
        if (!input.trim()) return;

        try {
            switch (language) {
                case "json":
                    input = JSON.stringify(JSON.parse(input));
                    break;
                case "html":
                case "css":
                case "sql":
                    input = input.replace(/\s+/g, " ").trim();
                    break;
            }
        } catch (e: any) {
            error = "Minify error: " + e.message;
        }
    }

    function formatHTML(html: string) {
        let formatted = "";
        let indent_str = " ".repeat(indent);
        let current_indent = 0;

        // Very basic HTML formatter
        html.split(/>\s*</).forEach((node) => {
            if (node.match(/^\/\w/)) current_indent -= 1;
            formatted +=
                indent_str.repeat(Math.max(0, current_indent)) +
                "<" +
                node +
                ">\n";
            if (
                node.match(/^<?\w[^>]*[^\/]$/) &&
                !node.startsWith("input") &&
                !node.startsWith("img") &&
                !node.startsWith("br") &&
                !node.startsWith("hr")
            )
                current_indent += 1;
        });
        return formatted.substring(1, formatted.length - 2);
    }

    function formatCSS(css: string) {
        let formatted = "";
        let indent_str = " ".repeat(indent);
        let current_indent = 0;

        css.replace(/\s*([\{\};])\s*/g, "$1")
            .replace(/\{/g, " {\n")
            .replace(/\}/g, "\n}\n")
            .replace(/;/g, ";\n")
            .split("\n")
            .forEach((line) => {
                line = line.trim();
                if (line.includes("}")) current_indent -= 1;
                if (line)
                    formatted +=
                        indent_str.repeat(Math.max(0, current_indent)) +
                        line +
                        "\n";
                if (line.includes("{")) current_indent += 1;
            });
        return formatted.trim();
    }

    function formatSQL(sql: string) {
        const keywords = [
            "SELECT",
            "FROM",
            "WHERE",
            "AND",
            "OR",
            "GROUP BY",
            "ORDER BY",
            "LIMIT",
            "INSERT INTO",
            "VALUES",
            "UPDATE",
            "SET",
            "DELETE",
            "LEFT JOIN",
            "RIGHT JOIN",
            "INNER JOIN",
            "ON",
        ];
        let formatted = sql.toUpperCase();
        keywords.forEach((kw) => {
            const regex = new RegExp(`\\s${kw}\\s`, "g");
            formatted = formatted.replace(regex, `\n${kw} `);
        });
        return formatted.trim();
    }

    function handleCopy() {
        navigator.clipboard.writeText(input);
        copied = true;
        setTimeout(() => (copied = false), 2000);
    }
</script>

<svelte:head>
    <title>Code Formatter - Aone Toolkit</title>
</svelte:head>

<div class="h-[calc(100vh-3rem)] p-4 flex flex-col space-y-4">
    <Panel class="flex-1 flex flex-col min-h-0 overflow-hidden">
        {#snippet header()}
            <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-4">
                    <div class="flex items-center gap-2">
                        <div
                            class="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center"
                        >
                            <Maximize2 size={16} />
                        </div>
                        <h2
                            class="font-semibold text-slate-900 dark:text-white"
                        >
                            Code Formatter
                        </h2>
                    </div>

                    <div
                        class="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg"
                    >
                        {#each LANGUAGES as lang}
                            <button
                                class="px-3 py-1 text-xs font-medium rounded-md transition-all {language ===
                                lang.id
                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}"
                                onclick={() => (language = lang.id)}
                            >
                                {lang.label}
                            </button>
                        {/each}
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <select
                        bind:value={indent}
                        class="text-xs p-1 bg-slate-100 dark:bg-slate-800 border-none rounded focus:ring-1 focus:ring-blue-500"
                    >
                        <option value={2}>2 Spaces</option>
                        <option value={4}>4 Spaces</option>
                        <option value={8}>8 Spaces</option>
                    </select>
                    <div
                        class="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"
                    ></div>
                    <Button variant="ghost" size="sm" onclick={handleCopy}>
                        {#if copied}
                            <Check size={14} class="text-emerald-500 mr-1" /> Copied
                        {:else}
                            <Copy size={14} class="mr-1" /> Copy
                        {/if}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onclick={() => (input = "")}
                    >
                        <Trash2 size={14} class="mr-1" /> Clear
                    </Button>
                </div>
            </div>
        {/snippet}

        <div class="flex-1 flex flex-col min-h-0 relative">
            <textarea
                bind:value={input}
                class="flex-1 p-6 font-mono text-sm bg-transparent resize-none focus:outline-none dark:text-slate-300 leading-relaxed"
                placeholder="Paste your {language.toUpperCase()} code here..."
            ></textarea>

            {#if error}
                <div
                    class="absolute bottom-4 left-4 right-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm animate-in fade-in slide-in-from-bottom-2"
                >
                    {error}
                </div>
            {/if}
        </div>

        <div
            class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-black/20 flex gap-2 justify-end"
        >
            <Button variant="secondary" onclick={minify}>
                <Minimize2 size={16} class="mr-2" /> Minify
            </Button>
            <Button onclick={format}>
                <Maximize2 size={16} class="mr-2" /> Format / Beautify
            </Button>
        </div>
    </Panel>
</div>
