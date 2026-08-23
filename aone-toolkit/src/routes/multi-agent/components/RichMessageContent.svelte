<script module lang="ts">
    import { marked } from "marked";
    import hljs from "highlight.js/lib/core";
    import json from "highlight.js/lib/languages/json";
    import javascript from "highlight.js/lib/languages/javascript";
    import typescript from "highlight.js/lib/languages/typescript";
    import markdown from "highlight.js/lib/languages/markdown";
    import bash from "highlight.js/lib/languages/bash";
    import python from "highlight.js/lib/languages/python";
    import sql from "highlight.js/lib/languages/sql";
    import css from "highlight.js/lib/languages/css";
    import xml from "highlight.js/lib/languages/xml";

    // Statically register key languages for zero-latency synchronous highlighting
    hljs.registerLanguage("json", json);
    hljs.registerLanguage("javascript", javascript);
    hljs.registerLanguage("js", javascript);
    hljs.registerLanguage("typescript", typescript);
    hljs.registerLanguage("ts", typescript);
    hljs.registerLanguage("markdown", markdown);
    hljs.registerLanguage("md", markdown);
    hljs.registerLanguage("bash", bash);
    hljs.registerLanguage("sh", bash);
    hljs.registerLanguage("shell", bash);
    hljs.registerLanguage("python", python);
    hljs.registerLanguage("py", python);
    hljs.registerLanguage("sql", sql);
    hljs.registerLanguage("css", css);
    hljs.registerLanguage("html", xml);
    hljs.registerLanguage("xml", xml);

    marked.setOptions({
        gfm: true,
        breaks: true,
    });

    const renderer = new marked.Renderer();

    renderer.link = function ({ href, title, text }: { href: string; title?: string | null; text: string }) {
        return `<a href="${href}" ${title ? `title="${title}"` : ""} target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 font-semibold underline underline-offset-2 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">${text}</a>`;
    };

    renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
        const rawCode = text || "";
        const isJson = (lang === "json") || (!lang && (rawCode.trim().startsWith("{") || rawCode.trim().startsWith("[")));
        const targetLang = isJson ? "json" : (lang && hljs.getLanguage(lang) ? lang : "plaintext");
        
        let highlighted = rawCode;
        if (targetLang !== "plaintext") {
            try {
                highlighted = hljs.highlight(rawCode, { language: targetLang, ignoreIllegals: true }).value;
            } catch {
                highlighted = rawCode;
            }
        }

        const langBadge = (isJson ? "JSON" : (lang || "CODE")).toUpperCase();

        return `<div class="code-container my-2.5 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-sm">
            <div class="flex items-center justify-between px-3.5 py-1.5 bg-slate-900/90 text-slate-400 text-[10px] font-mono border-b border-slate-800 select-none">
                <span class="font-bold text-sky-400 tracking-wider">${langBadge}</span>
                <button type="button" class="text-slate-400 hover:text-white transition-colors text-[11px] copy-trigger cursor-pointer" data-code="${encodeURIComponent(rawCode)}">复制</button>
            </div>
            <pre class="!p-3 !m-0 !bg-transparent overflow-x-auto"><code class="hljs ${targetLang ? `language-${targetLang}` : ''} !p-0 !bg-transparent text-[11.5px] font-mono leading-5 block whitespace-pre-wrap break-words">${highlighted}</code></pre>
        </div>`;
    };

    marked.use({ renderer });
</script>

<script lang="ts">
    let { content }: { content: string } = $props();

    function formatRawJsonBlocks(text: string): string {
        if (!text) return "";
        let formatted = text;

        if (formatted.includes("[ERROR]")) {
            formatted = formatted.replace(/\[ERROR\]\s*(.*)/g, (_, err) => `\n\n> ⚠️ **执行警告**: ${err}\n\n`);
        }

        if (formatted.includes("```")) {
            return formatted;
        }

        // Handle JSON Object block { ... }
        const firstBrace = formatted.indexOf("{");
        const lastBrace = formatted.lastIndexOf("}");

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const jsonCandidate = formatted.substring(firstBrace, lastBrace + 1).trim();
            if (/"[\w-]+"\s*:/.test(jsonCandidate)) {
                const before = formatted.substring(0, firstBrace).trim();
                const after = formatted.substring(lastBrace + 1).trim();
                
                let prettyJson = jsonCandidate;
                try {
                    const parsed = JSON.parse(jsonCandidate);
                    prettyJson = JSON.stringify(parsed, null, 2);
                } catch {
                    // keep jsonCandidate as is
                }

                const parts: string[] = [];
                if (before) parts.push(before);
                parts.push("```json\n" + prettyJson + "\n```");
                if (after) parts.push(after);
                return parts.join("\n\n");
            }
        }

        // Handle JSON Array block [ ... ]
        const firstBracket = formatted.indexOf("[");
        const lastBracket = formatted.lastIndexOf("]");
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
            const jsonCandidate = formatted.substring(firstBracket, lastBracket + 1).trim();
            if (jsonCandidate.startsWith("[") && jsonCandidate.endsWith("]") && (jsonCandidate.includes("{") || jsonCandidate.includes('"'))) {
                const before = formatted.substring(0, firstBracket).trim();
                const after = formatted.substring(lastBracket + 1).trim();
                let prettyJson = jsonCandidate;
                try {
                    const parsed = JSON.parse(jsonCandidate);
                    prettyJson = JSON.stringify(parsed, null, 2);
                } catch { /* keep */ }

                const parts: string[] = [];
                if (before) parts.push(before);
                parts.push("```json\n" + prettyJson + "\n```");
                if (after) parts.push(after);
                return parts.join("\n\n");
            }
        }

        return formatted;
    }

    let processedContent = $derived(formatRawJsonBlocks(content || ""));
    let htmlContent = $derived(marked.parse(processedContent));

    function handleClick(e: MouseEvent) {
        const target = (e.target as HTMLElement)?.closest(".copy-trigger") as HTMLElement;
        if (target) {
            e.stopPropagation();
            const rawCode = decodeURIComponent(target.getAttribute("data-code") || "");
            navigator.clipboard.writeText(rawCode);
            target.innerText = "已复制!";
            setTimeout(() => { target.innerText = "复制"; }, 2000);
        }
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="rich-markdown w-full min-w-0 max-w-full overflow-hidden text-sm leading-relaxed"
    onclick={handleClick}
>
    {@html htmlContent}
</div>

<style>
    :global(.rich-markdown h1) {
        font-size: 1.15rem;
        font-weight: 800;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
        letter-spacing: -0.01em;
    }
    :global(.rich-markdown h2) {
        font-size: 1.05rem;
        font-weight: 700;
        margin-top: 0.875rem;
        margin-bottom: 0.375rem;
        letter-spacing: -0.01em;
    }
    :global(.rich-markdown h3) {
        font-size: 0.95rem;
        font-weight: 700;
        margin-top: 0.75rem;
        margin-bottom: 0.25rem;
    }
    :global(.rich-markdown p) {
        margin-bottom: 0.625rem;
        line-height: 1.65;
    }
    :global(.rich-markdown p:last-child) {
        margin-bottom: 0;
    }
    :global(.rich-markdown ul, .rich-markdown ol) {
        margin-top: 0.375rem;
        margin-bottom: 0.625rem;
        padding-left: 1.25rem;
    }
    :global(.rich-markdown li) {
        margin-bottom: 0.25rem;
        line-height: 1.6;
    }
    :global(.rich-markdown strong) {
        font-weight: 700;
    }
    :global(.rich-markdown blockquote) {
        margin-top: 0.75rem;
        margin-bottom: 0.75rem;
        padding: 0.625rem 1rem;
        border-left: 3px solid #6366F1;
        background-color: rgba(99, 102, 241, 0.08);
        border-radius: 0 0.75rem 0.75rem 0;
    }
    :global(.rich-markdown table) {
        width: 100%;
        margin-top: 0.75rem;
        margin-bottom: 0.75rem;
        border-collapse: collapse;
        font-size: 0.75rem;
        border: 1px solid rgba(148, 163, 184, 0.25);
        border-radius: 0.75rem;
        overflow: hidden;
    }
    :global(.rich-markdown th) {
        background-color: rgba(148, 163, 184, 0.12);
        padding: 0.5rem 0.75rem;
        font-weight: 700;
        text-align: left;
        border-bottom: 1px solid rgba(148, 163, 184, 0.25);
    }
    :global(.rich-markdown td) {
        padding: 0.5rem 0.75rem;
        border-bottom: 1px solid rgba(148, 163, 184, 0.15);
    }
    :global(.rich-markdown tr:last-child td) {
        border-bottom: none;
    }
    :global(.rich-markdown tr:hover td) {
        background-color: rgba(148, 163, 184, 0.06);
    }
    :global(.rich-markdown hr) {
        margin-top: 0.75rem;
        margin-bottom: 0.75rem;
        border-color: rgba(148, 163, 184, 0.25);
    }
    :global(.rich-markdown code:not(.hljs)) {
        background-color: rgba(99, 102, 241, 0.1);
        color: #4f46e5;
        padding: 0.15rem 0.35rem;
        border-radius: 0.25rem;
        font-size: 0.85em;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    :global(.dark .rich-markdown code:not(.hljs)) {
        background-color: rgba(99, 102, 241, 0.2);
        color: #a5b4fc;
    }
</style>
