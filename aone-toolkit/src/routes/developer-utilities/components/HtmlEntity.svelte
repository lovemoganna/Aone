<script lang="ts">
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import {
        Code,
        Copy,
        Sparkles,
        Trash2,
        ArrowRightLeft,
        AlignLeft,
        BookOpen,
        Check
    } from "lucide-svelte";
    import { CodeBlock, CodeEditor } from "$lib/components/ui";

    let input = $state(`<div class="container">\n  <h1>Hello & Welcome to "Aone" Toolkit</h1>\n  <p>Price: 100€ &copy; 2026</p>\n</div>`);
    let mode = $state<"encode" | "decode">("encode");
    let entityFormat = $state<"named" | "decimal" | "hex">("named");

    const PRESETS = [
        { name: "HTML 标签片段", val: `<div id="app" data-role="main">\n  <span class='badge'>v1.0 & new</span>\n</div>` },
        { name: "特殊符号与货币", val: `© Copyright 2026 · € EUR · ¥ JPY · £ GBP · ® Trademark · ™` },
        { name: "数学与希腊字母", val: `∀x ∈ ℝ: x² ≥ 0 · α + β = γ · π ≈ 3.14159 · ∑ i=1..n` },
    ];

    const COMMON_ENTITIES = [
        { char: "<", named: "&lt;", dec: "&#60;", desc: "小于号" },
        { char: ">", named: "&gt;", dec: "&#62;", desc: "大于号" },
        { char: "&", named: "&amp;", dec: "&#38;", desc: "与号" },
        { char: '"', named: "&quot;", dec: "&#34;", desc: "双引号" },
        { char: "'", named: "&#39;", dec: "&#39;", desc: "单引号" },
        { char: " ", named: "&nbsp;", dec: "&#160;", desc: "不换行空格" },
        { char: "©", named: "&copy;", dec: "&#169;", desc: "版权所有" },
        { char: "®", named: "&reg;", dec: "&#174;", desc: "注册商标" },
        { char: "™", named: "&trade;", dec: "&#8482;", desc: "商标" },
        { char: "€", named: "&euro;", dec: "&#8364;", desc: "欧元" },
        { char: "¥", named: "&yen;", dec: "&#165;", desc: "日元/人民币" },
        { char: "•", named: "&bull;", dec: "&#8226;", desc: "圆点列表" },
    ];

    const NAMED_MAP: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "©": "&copy;",
        "®": "&reg;",
        "™": "&trade;",
        "€": "&euro;",
        "¥": "&yen;",
        "£": "&pound;",
        "¢": "&cent;",
        "§": "&sect;",
        "°": "&deg;",
        "±": "&plusmn;",
        "×": "&times;",
        "÷": "&divide;",
    };

    let result = $derived.by(() => {
        if (!input) return "";
        if (mode === "encode") {
            if (entityFormat === "named") {
                return input.replace(/[\u00A0-\u9999<>&"']/g, (ch) => {
                    return NAMED_MAP[ch] || `&#${ch.charCodeAt(0)};`;
                });
            } else if (entityFormat === "decimal") {
                return input.replace(/[\u00A0-\u9999<>&"']/g, (ch) => {
                    return `&#${ch.charCodeAt(0)};`;
                });
            } else {
                return input.replace(/[\u00A0-\u9999<>&"']/g, (ch) => {
                    return `&#x${ch.charCodeAt(0).toString(16).toUpperCase()};`;
                });
            }
        } else {
            // Decode HTML entities
            const txt = document.createElement("textarea");
            txt.innerHTML = input;
            return txt.value;
        }
    });

    function swap() {
        if (result) {
            input = result;
            mode = mode === "encode" ? "decode" : "encode";
            toastStore.success("已翻转输入与处理模式");
        }
    }

    function applyPreset(p: typeof PRESETS[0]) {
        input = p.val;
        mode = "encode";
        toastStore.info(`已载入预设：${p.name}`);
    }

    function copyResult() {
        if (!result) return;
        copyToClipboard(result, "HTML 实体结果");
        toastStore.success("已复制到剪贴板");
    }

    function insertEntity(char: string) {
        input += char;
        toastStore.info(`已插入字符: ${char}`);
    }
</script>

<div class="h-full flex flex-col gap-2.5 min-h-0">
    <!-- Top Command Toolbar -->
    <div class="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-2xs">
        <div class="flex items-center gap-2 flex-wrap min-w-0">
            <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
                <Code size={13} class="text-sky-500" />
                HTML 实体转义与反转义
            </span>
            <span class="text-slate-300 dark:text-slate-700">|</span>
            <div class="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px]">
                <button
                    type="button"
                    class="px-2.5 py-0.5 rounded font-medium transition cursor-pointer {mode === 'encode' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                    onclick={() => (mode = "encode")}
                >
                    编码 (Encode)
                </button>
                <button
                    type="button"
                    class="px-2.5 py-0.5 rounded font-medium transition cursor-pointer {mode === 'decode' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                    onclick={() => (mode = "decode")}
                >
                    解码 (Decode)
                </button>
            </div>

            {#if mode === "encode"}
                <div class="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px] ml-1">
                    <button
                        type="button"
                        class="px-2 py-0.5 rounded font-medium transition cursor-pointer {entityFormat === 'named' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500'}"
                        onclick={() => (entityFormat = "named")}
                    >
                        命名实体 (&amp;lt;)
                    </button>
                    <button
                        type="button"
                        class="px-2 py-0.5 rounded font-medium transition cursor-pointer {entityFormat === 'decimal' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500'}"
                        onclick={() => (entityFormat = "decimal")}
                    >
                        十进制 (&#60;)
                    </button>
                    <button
                        type="button"
                        class="px-2 py-0.5 rounded font-medium transition cursor-pointer {entityFormat === 'hex' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500'}"
                        onclick={() => (entityFormat = "hex")}
                    >
                        十六进制 (&#x3C;)
                    </button>
                </div>
            {/if}
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
            <button
                type="button"
                class="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer shadow-2xs font-medium"
                onclick={swap}
                title="反转输入与输出"
            >
                <ArrowRightLeft size={12} />
                <span>翻转</span>
            </button>
            <button
                type="button"
                class="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                onclick={() => (input = "")}
                title="清空"
            >
                <Trash2 size={13} />
            </button>
        </div>
    </div>

    <!-- Dual Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        <!-- Left: Input (6 cols) -->
        <div class="lg:col-span-6 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                <span class="flex items-center gap-1.5">
                    <AlignLeft size={13} class="text-slate-500" />
                    {mode === "encode" ? "源文本 / HTML 原文" : "转义字符串 (含有 &amp; &#...;)"}
                </span>
                <span class="text-[10px] text-slate-400 font-mono">{input.length} 字符</span>
            </div>
            <div class="flex-1 relative min-h-0 bg-white dark:bg-[#0A0A0A]">
                <CodeEditor
                    bind:value={input}
                    language="html"
                    placeholder="在此输入文本或 HTML 代码..."
                />
            </div>
        </div>

        <!-- Right: Output (6 cols) -->
        <div class="lg:col-span-6 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
                <span class="font-bold text-slate-700 dark:text-slate-300">
                    {mode === "encode" ? "转义结果" : "还原后的文本"}
                </span>
                <button
                    type="button"
                    onclick={copyResult}
                    disabled={!result}
                    class="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer font-medium disabled:opacity-40"
                >
                    <Copy size={11} /> 复制输出
                </button>
            </div>
            <div class="flex-1 w-full p-3 font-mono text-xs bg-slate-50/30 dark:bg-slate-950/30 overflow-auto leading-relaxed custom-scrollbar min-h-0">
                {#if result}
                    <CodeBlock
                        code={result}
                        language={mode === "encode" ? "html" : "html"}
                        showHeader={false}
                        wrapLines={true}
                        class="!my-0 border-0"
                    />
                {:else}
                    <div class="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic font-sans py-12 gap-2">
                        <Code size={24} class="text-slate-300 dark:text-slate-700" />
                        <span>处理结果将实时在此显示</span>
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <!-- Bottom: Quick Entity Insert Bar -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-2 shrink-0 text-xs shadow-2xs overflow-x-auto">
        <div class="flex items-center gap-1.5 shrink-0 text-slate-400 font-medium text-[11px]">
            <BookOpen size={12} class="text-sky-500" />
            <span>常用字符快速插入:</span>
        </div>
        <div class="flex items-center gap-1.5 flex-wrap">
            {#each COMMON_ENTITIES as ent}
                <button
                    type="button"
                    onclick={() => insertEntity(ent.char)}
                    class="px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 font-mono text-xs transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="{ent.desc} ({ent.named})"
                >
                    <span class="font-bold text-sky-600 dark:text-sky-400">{ent.char}</span>
                    <span class="text-[10px] text-slate-400 font-sans">{ent.named}</span>
                </button>
            {/each}
        </div>
    </div>
</div>

