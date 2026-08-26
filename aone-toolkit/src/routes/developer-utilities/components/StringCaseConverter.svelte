<script lang="ts">
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import {
        Type,
        Copy,
        Sparkles,
        Trash2,
        Check,
        ArrowRightLeft,
        Layers,
        AlignLeft
    } from "lucide-svelte";
    import { CodeEditor } from "$lib/components/ui";

    let input = $state("get_user_profile_details");
    let copiedKey = $state<string | null>(null);

    const PRESETS = [
        { name: "下划线变量 (snake_case)", val: "fetch_user_account_balance" },
        { name: "驼峰标识 (camelCase)", val: "calculateMonthlyInterestRate" },
        { name: "短横线路径 (kebab-case)", val: "cloud-native-microservice-api" },
        { name: "大写常量 (CONSTANT_CASE)", val: "MAX_CONCURRENT_UPLOAD_WORKERS" },
        { name: "自然英文短句", val: "Aone modern full stack developer kit" },
    ];

    const toWords = (s: string) =>
        s
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/[-_./\\]+/g, " ")
            .split(/\s+/)
            .filter((x) => x.trim().length > 0);

    let cases = $derived.by(() => {
        if (!input.trim()) return [];
        const words = toWords(input.trim());
        if (words.length === 0) return [];

        const lowerWords = words.map((w) => w.toLowerCase());
        const upperWords = words.map((w) => w.toUpperCase());

        return [
            {
                key: "camel",
                label: "camelCase (小驼峰)",
                desc: "变量名、JS/TS 属性",
                val: lowerWords
                    .map((w, i) => (i === 0 ? w : w[0].toUpperCase() + w.slice(1)))
                    .join(""),
            },
            {
                key: "pascal",
                label: "PascalCase (大驼峰)",
                desc: "类名、Svelte/React 组件",
                val: lowerWords
                    .map((w) => w[0].toUpperCase() + w.slice(1))
                    .join(""),
            },
            {
                key: "snake",
                label: "snake_case (蛇形下划线)",
                desc: "Python、数据库字段名",
                val: lowerWords.join("_"),
            },
            {
                key: "kebab",
                label: "kebab-case (短横线/烤肉串)",
                desc: "URL Slug、CSS 类名、文件名",
                val: lowerWords.join("-"),
            },
            {
                key: "constant",
                label: "CONSTANT_CASE (常量全大写)",
                desc: "全局常量、环境变量、C 宏",
                val: upperWords.join("_"),
            },
            {
                key: "title",
                label: "Title Case (首字母大写标题)",
                desc: "文档标题、文章章节名",
                val: lowerWords
                    .map((w) => w[0].toUpperCase() + w.slice(1))
                    .join(" "),
            },
            {
                key: "sentence",
                label: "Sentence case (句子首字母大写)",
                desc: "自然语言首字母排版",
                val: lowerWords
                    .map((w, i) => (i === 0 ? w[0].toUpperCase() + w.slice(1) : w))
                    .join(" "),
            },
            {
                key: "dot",
                label: "dot.notation (点号命名)",
                desc: "配置项、Java/I18n 属性路径",
                val: lowerWords.join("."),
            },
            {
                key: "path",
                label: "path/case (路径斜杠命名)",
                desc: "路由、文件系统相对路径",
                val: lowerWords.join("/"),
            },
            {
                key: "header",
                label: "Header-Case (HTTP 头规范)",
                desc: "HTTP Request/Response Headers",
                val: lowerWords
                    .map((w) => w[0].toUpperCase() + w.slice(1))
                    .join("-"),
            },
            {
                key: "sponge",
                label: "aLtErNaTiNg (交替大小写)",
                desc: "网络嘲讽风格、测试混淆",
                val: input
                    .split("")
                    .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
                    .join(""),
            },
        ];
    });

    function applyPreset(p: typeof PRESETS[0]) {
        input = p.val;
        toastStore.info(`已载入预设：${p.name}`);
    }

    function copyCase(val: string, key: string, label: string) {
        copyToClipboard(val, label);
        copiedKey = key;
        toastStore.success(`已复制 ${label}`);
        setTimeout(() => {
            if (copiedKey === key) copiedKey = null;
        }, 1500);
    }
</script>

<div class="h-full flex flex-col gap-2.5 min-h-0">
    <!-- Top Command Toolbar -->
    <div class="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-2xs">
        <div class="flex items-center gap-2 flex-wrap min-w-0">
            <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
                <Type size={13} class="text-sky-500" />
                命名风格大小写转换器
            </span>
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
                    {p.name}
                </button>
            {/each}
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
            <button
                type="button"
                class="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                onclick={() => (input = "")}
                title="清空输入"
            >
                <Trash2 size={13} />
            </button>
        </div>
    </div>

    <!-- Dual Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        <!-- Left: Input Textarea (5 cols) -->
        <div class="lg:col-span-5 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                <span class="flex items-center gap-1.5">
                    <AlignLeft size={13} class="text-slate-500" />
                    待转换源文本
                </span>
                <span class="text-[10px] text-slate-400 font-mono">{input.length} 字符</span>
            </div>
            <div class="flex-1 relative min-h-0 bg-white dark:bg-[#0A0A0A]">
                <CodeEditor
                    bind:value={input}
                    placeholder="在此输入或粘贴需要转换的文本 (例如 hello_world、getUserInfo 或 my-api-endpoint)..."
                />
            </div>
        </div>

        <!-- Right: Multi-case Output Matrix (7 cols) -->
        <div class="lg:col-span-7 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
                <span class="font-bold text-slate-700 dark:text-slate-300">风格变换矩阵 ({cases.length})</span>
                <span class="text-[10px] text-slate-400 font-mono">点击每行卡片即可快速复制</span>
            </div>

            <!-- Cases Grid -->
            <div class="flex-1 overflow-auto p-3 space-y-2 bg-slate-50/40 dark:bg-slate-950/40 min-h-0 custom-scrollbar">
                {#if cases.length === 0}
                    <div class="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic font-sans py-12 gap-2">
                        <Type size={24} class="text-slate-300 dark:text-slate-700" />
                        <span>请在左侧输入文本以查看实时大小写转换结果</span>
                    </div>
                {:else}
                    {#each cases as c}
                        <div
                            class="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-800/80 transition-all shadow-2xs group flex items-center justify-between gap-2.5"
                        >
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-1.5 mb-0.5">
                                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{c.label}</span>
                                    <span class="text-[10px] text-slate-400 font-normal">· {c.desc}</span>
                                </div>
                                <div class="font-mono text-xs text-slate-900 dark:text-slate-100 font-semibold break-all select-all tracking-wide">
                                    {c.val}
                                </div>
                            </div>

                            <button
                                type="button"
                                onclick={() => copyCase(c.val, c.key, c.label)}
                                class="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs font-sans font-medium"
                                title="复制此风格"
                            >
                                {#if copiedKey === c.key}
                                    <Check size={11} class="text-emerald-500" />
                                    <span class="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">已复制</span>
                                {:else}
                                    <Copy size={11} class="text-slate-400" />
                                    <span class="text-[11px]">复制</span>
                                {/if}
                            </button>
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
</div>

