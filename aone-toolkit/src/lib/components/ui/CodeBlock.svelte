<script lang="ts">
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
    import yaml from "highlight.js/lib/languages/yaml";
    import diff from "highlight.js/lib/languages/diff";
    import go from "highlight.js/lib/languages/go";
    import rust from "highlight.js/lib/languages/rust";
    import cpp from "highlight.js/lib/languages/cpp";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import { Check, Copy, FileCode2 } from "lucide-svelte";

    // Register languages statically for instant synchronous highlighting without dynamic network overhead
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
    hljs.registerLanguage("yaml", yaml);
    hljs.registerLanguage("yml", yaml);
    hljs.registerLanguage("diff", diff);
    hljs.registerLanguage("go", go);
    hljs.registerLanguage("rust", rust);
    hljs.registerLanguage("rs", rust);
    hljs.registerLanguage("cpp", cpp);
    hljs.registerLanguage("c", cpp);

    interface Props {
        code: string;
        language?: string;
        filename?: string;
        showHeader?: boolean;
        showLineNumbers?: boolean;
        wrapLines?: boolean;
        maxHeight?: string;
        class?: string;
    }

    let {
        code = "",
        language = "plaintext",
        filename = "",
        showHeader = true,
        showLineNumbers = false,
        wrapLines = false,
        maxHeight = "none",
        class: className = ""
    }: Props = $props();

    let copied = $state(false);

    // Normalize language key
    let normalizedLang = $derived.by(() => {
        const lang = (language || "").toLowerCase().trim();
        if (lang === "js") return "javascript";
        if (lang === "ts") return "typescript";
        if (lang === "py") return "python";
        if (lang === "sh" || lang === "shell") return "bash";
        if (lang === "yml") return "yaml";
        if (lang === "rs") return "rust";
        if (lang === "c") return "cpp";
        if (lang === "htm") return "html";
        return lang || "plaintext";
    });

    // Compute highlighted code
    let highlightedCode = $derived.by(() => {
        const raw = code ?? "";
        if (!raw) return "";

        const targetLang = hljs.getLanguage(normalizedLang) ? normalizedLang : null;
        if (targetLang) {
            try {
                return hljs.highlight(raw, { language: targetLang, ignoreIllegals: true }).value;
            } catch {
                return escapeHtml(raw);
            }
        }

        // Auto-detect if language is plaintext or empty
        try {
            const detected = hljs.highlightAuto(raw);
            return detected.value;
        } catch {
            return escapeHtml(raw);
        }
    });

    let lineCount = $derived(code ? code.split("\n").length : 0);

    function escapeHtml(str: string): string {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function handleCopy() {
        if (!code) return;
        copyToClipboard(code, filename || (normalizedLang.toUpperCase() + " 代码"));
        copied = true;
        toastStore.success("已复制到剪贴板");
        setTimeout(() => {
            copied = false;
        }, 1800);
    }
</script>

<div class="code-block-wrapper my-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-2xs text-xs font-mono {className}">
    {#if showHeader}
        <div class="flex items-center justify-between px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 select-none">
            <div class="flex items-center gap-2 min-w-0">
                <FileCode2 size={13} class="text-slate-400 shrink-0" />
                {#if filename}
                    <span class="font-medium text-slate-700 dark:text-slate-200 truncate">{filename}</span>
                {/if}
                <span class="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {normalizedLang}
                </span>
                {#if lineCount > 1}
                    <span class="text-[10px] text-slate-400">({lineCount} 行)</span>
                {/if}
            </div>

            <button
                type="button"
                onclick={handleCopy}
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-sans font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="复制代码"
            >
                {#if copied}
                    <Check size={12} class="text-emerald-500" />
                    <span class="text-emerald-600 dark:text-emerald-400">已复制</span>
                {:else}
                    <Copy size={12} />
                    <span>复制</span>
                {/if}
            </button>
        </div>
    {/if}

    <div
        class="relative overflow-auto custom-scrollbar"
        style={maxHeight !== "none" ? `max-height: ${maxHeight};` : ""}
    >
        {#if showLineNumbers && lineCount > 1}
            <div class="flex leading-relaxed text-[12.5px]">
                <!-- Line Numbers -->
                <div class="select-none py-3 pl-3 pr-2 text-right text-slate-400 dark:text-slate-600 border-r border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 text-[11px]">
                    {#each Array(lineCount) as _, i}
                        <div class="h-[1.6em]">{i + 1}</div>
                    {/each}
                </div>
                <!-- Highlighted Code -->
                <pre class="flex-1 !p-3 !m-0 !bg-transparent overflow-x-auto"><code class="hljs language-{normalizedLang} !p-0 !bg-transparent text-[12.5px] font-mono leading-[1.6em] block {wrapLines ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}">{@html highlightedCode}</code></pre>
            </div>
        {:else}
            <pre class="!p-3.5 !m-0 !bg-transparent overflow-x-auto"><code class="hljs language-{normalizedLang} !p-0 !bg-transparent text-[12.5px] font-mono leading-[1.6em] block {wrapLines ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}">{@html highlightedCode}</code></pre>
        {/if}
    </div>
</div>
