<script lang="ts">
    import hljs from "highlight.js/lib/core";
    import yaml from "highlight.js/lib/languages/yaml";
    import json from "highlight.js/lib/languages/json";
    import "highlight.js/styles/atom-one-dark.css";

    hljs.registerLanguage("yaml", yaml);
    hljs.registerLanguage("json", json);

    interface Props {
        value: string;
        data?: any;
    }

    let { value, data }: Props = $props();

    let mode = $state<"yaml" | "json">("yaml");
    let highlightedCode = $state("");

    $effect(() => {
        try {
            if (mode === "yaml") {
                if (value) {
                    highlightedCode = hljs.highlight(value, {
                        language: "yaml",
                    }).value;
                } else {
                    highlightedCode = "";
                }
            } else {
                // JSON Mode
                // If data is provided, use it. Else try to parse value?
                // Visual Editor passes data.
                let jsonStr = "";
                if (data !== undefined) {
                    jsonStr = JSON.stringify(data, null, 2);
                } else {
                    // Fallback check if value is parsable? (Likely redundant if data passed)
                    // But value might be only source in some contexts.
                    // For now assume data is main source for JSON if available.
                    // Or just parse YAML value?
                    // Let's rely on data if present, otherwise no JSON or try parse.
                }

                if (jsonStr) {
                    highlightedCode = hljs.highlight(jsonStr, {
                        language: "json",
                    }).value;
                } else {
                    highlightedCode = ""; // or "Invalid JSON source"
                }
            }
        } catch (e) {
            console.error("Highlight error", e);
            highlightedCode = value;
        }
    });

    function copyContent() {
        const text =
            mode === "yaml" ? value : JSON.stringify(data, null, 2) || "";
        navigator.clipboard.writeText(text);
        // Toast?
    }
</script>

<div
    class="h-full bg-slate-50 dark:bg-slate-950 overflow-hidden flex flex-col relative group"
>
    <div
        class="absolute right-4 top-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
    >
        <div
            class="bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm flex text-xs"
        >
            <button
                class="px-2 py-1 rounded-md {mode === 'yaml'
                    ? 'bg-slate-100 dark:bg-slate-700 font-medium text-slate-800 dark:text-slate-200'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}"
                onclick={() => (mode = "yaml")}>YAML</button
            >
            <button
                class="px-2 py-1 rounded-md {mode === 'json'
                    ? 'bg-slate-100 dark:bg-slate-700 font-medium text-slate-800 dark:text-slate-200'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}"
                onclick={() => (mode = "json")}>JSON</button
            >
        </div>
    </div>

    <div class="flex-1 overflow-auto p-4 custom-scrollbar">
        <pre class="font-mono text-sm leading-relaxed"><code
                class="language-{mode}">{@html highlightedCode}</code
            ></pre>
    </div>
</div>
