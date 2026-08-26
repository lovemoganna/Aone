<script lang="ts">
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import {
        Copy,
        Trash2,
        ArrowDownAZ,
        ArrowUpZA,
        Sparkles,
        Check,
        Filter,
        Download,
        Layers,
        AlignLeft,
        BarChart2
    } from "lucide-svelte";
    import { CodeBlock, CodeEditor } from "$lib/components/ui";

    let input = $state(`admin@example.com\nuser1@test.com\nadmin@example.com\n\nsupport@aone.dev\nuser1@test.com\nfinance@company.org\nSUPPORT@AONE.DEV`);
    let trimWhitespace = $state(true);
    let removeEmpty = $state(true);
    let deduplicate = $state(true);
    let ignoreCase = $state(false);
    let sortMode = $state<"none" | "asc" | "desc" | "length">("none");

    const PRESETS = [
        {
            name: "邮箱去重列表",
            val: "admin@example.com\nuser1@test.com\nadmin@example.com\n\nsupport@aone.dev\nuser1@test.com\nfinance@company.org\nSUPPORT@AONE.DEV"
        },
        {
            name: "日志错误标识",
            val: "ERR_CONNECTION_REFUSED\nERR_TIMEOUT\nERR_CONNECTION_REFUSED\nERR_UNAUTHORIZED\nERR_TIMEOUT\nERR_NOT_FOUND"
        },
        {
            name: "UUID 列表清洗",
            val: "  f47ac10b-58cc-4372-a567-0e02b2c3d479  \n9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d\nf47ac10b-58cc-4372-a567-0e02b2c3d479\n\n"
        }
    ];

    let calculation = $derived.by(() => {
        if (!input) {
            return {
                text: "",
                stats: { original: 0, result: 0, removed: 0, rate: "0%" },
            };
        }

        let lines = input.split("\n");
        const original = lines.length;

        if (trimWhitespace) lines = lines.map((l) => l.trim());
        if (removeEmpty) lines = lines.filter((l) => l.length > 0);

        if (deduplicate) {
            if (ignoreCase) {
                const seen = new Set<string>();
                const filtered: string[] = [];
                for (const line of lines) {
                    const lower = line.toLowerCase();
                    if (!seen.has(lower)) {
                        seen.add(lower);
                        filtered.push(line);
                    }
                }
                lines = filtered;
            } else {
                lines = [...new Set(lines)];
            }
        }

        if (sortMode === "asc") {
            lines.sort((a, b) => a.localeCompare(b));
        } else if (sortMode === "desc") {
            lines.sort((a, b) => b.localeCompare(a));
        } else if (sortMode === "length") {
            lines.sort((a, b) => a.length - b.length);
        }

        const result = lines.length;
        const removed = original - result;
        const rate = original > 0 ? ((removed / original) * 100).toFixed(1) + "%" : "0%";

        return {
            text: lines.join("\n"),
            stats: { original, result, removed, rate },
        };
    });

    let output = $derived(calculation.text);
    let stats = $derived(calculation.stats);

    function applyPreset(p: typeof PRESETS[0]) {
        input = p.val;
        toastStore.info(`已载入预设：${p.name}`);
    }

    function copyResult() {
        if (!output) return;
        copyToClipboard(output, "清洗后文本");
        toastStore.success("已复制到剪贴板");
    }

    function downloadResult() {
        if (!output) return;
        const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dedup-cleaned-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        toastStore.success("已导出清洗后文本文件");
    }
</script>

<div class="h-full flex flex-col gap-2.5 min-h-0">
    <!-- Top Command Toolbar -->
    <div class="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-2xs">
        <div class="flex items-center gap-2 flex-wrap min-w-0">
            <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
                <Filter size={13} class="text-sky-500" />
                文本行去重与清洗器
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
                class="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer shadow-2xs font-medium"
                onclick={downloadResult}
                title="导出为文本文件"
            >
                <Download size={12} />
                <span>导出</span>
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
        <!-- Left: Input & Rules Panel (5 cols) -->
        <div class="lg:col-span-5 flex flex-col gap-2.5 min-h-0">
            <!-- Rules Options Card -->
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-2.5 shadow-2xs shrink-0">
                <div class="text-xs font-bold text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-100 dark:border-slate-800">
                    清洗与过滤规则
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs">
                    <label class="flex items-center gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition select-none">
                        <input type="checkbox" bind:checked={deduplicate} class="rounded text-sky-600 focus:ring-0" />
                        <span class="font-medium text-slate-700 dark:text-slate-300">去除重复行</span>
                    </label>

                    <label class="flex items-center gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition select-none">
                        <input type="checkbox" bind:checked={trimWhitespace} class="rounded text-sky-600 focus:ring-0" />
                        <span class="font-medium text-slate-700 dark:text-slate-300">首尾去除空格</span>
                    </label>

                    <label class="flex items-center gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition select-none">
                        <input type="checkbox" bind:checked={removeEmpty} class="rounded text-sky-600 focus:ring-0" />
                        <span class="font-medium text-slate-700 dark:text-slate-300">过滤纯空行</span>
                    </label>

                    <label class="flex items-center gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition select-none">
                        <input type="checkbox" bind:checked={ignoreCase} class="rounded text-sky-600 focus:ring-0" />
                        <span class="font-medium text-slate-700 dark:text-slate-300">忽略字母大小写</span>
                    </label>
                </div>

                <!-- Sort Mode Row -->
                <div class="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                    <span class="text-slate-400 font-medium text-[11px]">排序策略:</span>
                    <div class="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px]">
                        <button
                            type="button"
                            class="px-2 py-0.5 rounded font-medium transition cursor-pointer {sortMode === 'none' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500'}"
                            onclick={() => (sortMode = "none")}
                        >
                            原始顺序
                        </button>
                        <button
                            type="button"
                            class="px-2 py-0.5 rounded font-medium transition cursor-pointer {sortMode === 'asc' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500'}"
                            onclick={() => (sortMode = "asc")}
                        >
                            A-Z 升序
                        </button>
                        <button
                            type="button"
                            class="px-2 py-0.5 rounded font-medium transition cursor-pointer {sortMode === 'desc' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500'}"
                            onclick={() => (sortMode = "desc")}
                        >
                            Z-A 降序
                        </button>
                        <button
                            type="button"
                            class="px-2 py-0.5 rounded font-medium transition cursor-pointer {sortMode === 'length' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500'}"
                            onclick={() => (sortMode = "length")}
                        >
                            长度升序
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats Metrics Badge Panel -->
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 grid grid-cols-4 gap-2 text-center shadow-2xs shrink-0 font-mono">
                <div class="p-1.5 rounded bg-slate-50 dark:bg-slate-950">
                    <div class="text-[10px] text-slate-400 font-sans">原始行数</div>
                    <div class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{stats.original}</div>
                </div>
                <div class="p-1.5 rounded bg-slate-50 dark:bg-slate-950">
                    <div class="text-[10px] text-slate-400 font-sans">清洗后行数</div>
                    <div class="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.result}</div>
                </div>
                <div class="p-1.5 rounded bg-slate-50 dark:bg-slate-950">
                    <div class="text-[10px] text-slate-400 font-sans">剔除行数</div>
                    <div class="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">{stats.removed}</div>
                </div>
                <div class="p-1.5 rounded bg-slate-50 dark:bg-slate-950">
                    <div class="text-[10px] text-slate-400 font-sans">精简率</div>
                    <div class="text-xs sm:text-sm font-bold text-sky-600 dark:text-sky-400 mt-0.5">{stats.rate}</div>
                </div>
            </div>

            <!-- Input Textarea -->
            <div class="flex-1 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
                <div class="h-8 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                    <span>待清洗源文本 (逐行)</span>
                    <span class="text-[10px] text-slate-400 font-mono">{input.length} 字符</span>
                </div>
                <div class="flex-1 relative min-h-0 bg-white dark:bg-[#0A0A0A]">
                    <CodeEditor
                        bind:value={input}
                        placeholder="在此粘贴包含重复项、空格或空行的列表..."
                    />
                </div>
            </div>
        </div>

        <!-- Right: Cleaned Result Output (7 cols) -->
        <div class="lg:col-span-7 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
                <span class="font-bold text-slate-700 dark:text-slate-300">
                    清洗输出结果 ({stats.result} 行)
                </span>
                <button
                    type="button"
                    onclick={copyResult}
                    disabled={!output}
                    class="px-2.5 py-1 text-xs rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition flex items-center gap-1 cursor-pointer shadow-2xs font-semibold disabled:opacity-40"
                >
                    <Copy size={11} />
                    <span>复制结果</span>
                </button>
            </div>
            <div class="flex-1 overflow-auto p-3 font-mono text-xs bg-slate-50/30 dark:bg-slate-950/40 min-h-0 custom-scrollbar">
                {#if output}
                    <CodeBlock
                        code={output}
                        language="plaintext"
                        showHeader={false}
                        wrapLines={true}
                        class="!my-0 border-0"
                    />
                {:else}
                    <div class="h-full flex items-center justify-center text-slate-400 text-xs italic font-sans">
                        清洗后的唯一行列表将在此实时显示
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

