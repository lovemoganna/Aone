<script lang="ts">
    import type { ConsoleLogEntry } from "$lib/services/interpreter";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import {
        Terminal,
        Trash2,
        Copy,
        Check,
        Download,
        Search,
        X,
        ArrowDownToLine,
    } from "lucide-svelte";

    interface Props {
        logs: ConsoleLogEntry[];
        onClear?: () => void;
    }

    let { logs = [], onClear }: Props = $props();

    let copied = $state(false);
    let autoScroll = $state(true);
    let searchQuery = $state("");
    let filterLevel = $state<"all" | "error" | "warn" | "info">("all");
    let logContainer: HTMLElement | null = $state(null);

    let filteredLogs = $derived.by(() => {
        return logs.filter(log => {
            if (filterLevel !== "all" && log.level !== filterLevel) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return log.content.toLowerCase().includes(q) || log.formattedTime.toLowerCase().includes(q);
            }
            return true;
        });
    });

    let errorCount = $derived(logs.filter(l => l.level === "error").length);
    let warnCount = $derived(logs.filter(l => l.level === "warn").length);

    $effect(() => {
        if (autoScroll && logContainer && logs.length > 0) {
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    });

    async function handleCopy() {
        const text = filteredLogs.map(l => `[${l.formattedTime}] [${l.level.toUpperCase()}] ${l.content}`).join("\n");
        const success = await copyToClipboard(text);
        if (success) {
            copied = true;
            toastStore.success("控制台日志已复制到剪贴板");
            setTimeout(() => (copied = false), 2000);
        }
    }

    function handleDownloadLog() {
        const text = logs.map(l => `[${l.formattedTime}] [${l.level.toUpperCase()}] ${l.content}`).join("\n");
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `console_output_${Date.now()}.log`;
        a.click();
        URL.revokeObjectURL(url);
        toastStore.success("已导出 .log 日志文件");
    }
</script>

<div class="h-full flex flex-col bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono text-[12.5px] overflow-hidden select-text" style="font-family: 'JetBrains Mono', monospace;">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-3.5 py-1.5 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 shrink-0 gap-2 flex-wrap">
        <div class="flex items-center gap-2 min-w-0">
            <Terminal size={13} class="text-slate-500 dark:text-slate-400 shrink-0" />
            <span class="font-semibold text-slate-800 dark:text-slate-200 text-xs shrink-0 font-sans">控制台</span>

            <!-- Level filter pills -->
            <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200/70 dark:border-slate-800 text-[10px] font-sans">
                <button
                    type="button"
                    onclick={() => (filterLevel = "all")}
                    class="px-2 py-0.5 rounded transition-all cursor-pointer {filterLevel === 'all' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}"
                >
                    全部 ({logs.length})
                </button>
                {#if errorCount > 0}
                    <button
                        type="button"
                        onclick={() => (filterLevel = "error")}
                        class="px-2 py-0.5 rounded transition-all cursor-pointer {filterLevel === 'error' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-semibold shadow-2xs' : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'}"
                    >
                        错误 ({errorCount})
                    </button>
                {/if}
                {#if warnCount > 0}
                    <button
                        type="button"
                        onclick={() => (filterLevel = "warn")}
                        class="px-2 py-0.5 rounded transition-all cursor-pointer {filterLevel === 'warn' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold shadow-2xs' : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'}"
                    >
                        警告 ({warnCount})
                    </button>
                {/if}
            </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0 font-sans">
            <!-- Search bar -->
            <div class="relative w-28 sm:w-36">
                <Search size={11} class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                    type="text"
                    bind:value={searchQuery}
                    placeholder="过滤日志..."
                    class="w-full pl-6 pr-5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-[11px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors"
                />
                {#if searchQuery}
                    <button
                        type="button"
                        onclick={() => (searchQuery = "")}
                        class="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                        <X size={10} />
                    </button>
                {/if}
            </div>

            <!-- Auto scroll toggle -->
            <button
                type="button"
                onclick={() => (autoScroll = !autoScroll)}
                class="p-1 rounded text-xs flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer {autoScroll ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'}"
                title={autoScroll ? "自动滚动到底部 (已开启)" : "自动滚动到底部 (已暂停)"}
            >
                <ArrowDownToLine size={12} />
            </button>

            <!-- Export .log file -->
            <button
                type="button"
                onclick={handleDownloadLog}
                disabled={logs.length === 0}
                class="p-1 rounded text-xs flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 transition-colors cursor-pointer"
                title="导出为 .log 文件"
            >
                <Download size={12} />
            </button>

            <!-- Copy logs -->
            <button
                type="button"
                onclick={handleCopy}
                disabled={filteredLogs.length === 0}
                class="px-2 py-0.5 rounded text-[11px] flex items-center gap-1 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-30 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                title="复制筛选后的日志"
            >
                {#if copied}
                    <Check size={11} class="text-emerald-600 dark:text-emerald-400" />
                    <span class="text-emerald-600 dark:text-emerald-400 font-medium">已复制</span>
                {:else}
                    <Copy size={11} class="text-slate-400" />
                    <span>复制</span>
                {/if}
            </button>

            <!-- Clear -->
            <button
                type="button"
                onclick={() => onClear?.()}
                disabled={logs.length === 0}
                class="p-1 rounded text-xs flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-30 transition-colors cursor-pointer"
                title="清空控制台"
            >
                <Trash2 size={12} />
            </button>
        </div>
    </div>

    <!-- Logs Body -->
    <div
        bind:this={logContainer}
        class="flex-1 min-h-0 overflow-y-scroll overflow-x-auto p-3.5 space-y-1 selection:bg-indigo-500/20 dark:selection:bg-slate-700 scrollbar-thin bg-white dark:bg-slate-900"
    >
        {#if logs.length === 0}
            <div class="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12 font-sans">
                <Terminal size={24} class="stroke-1 mb-2 opacity-50 text-slate-400 dark:text-slate-500" />
                <p class="text-xs font-medium text-slate-600 dark:text-slate-400">暂无输出日志</p>
                <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    点击「运行」或按下 <kbd class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px]">⌘/Ctrl + Enter</kbd> 执行脚本
                </p>
            </div>
        {:else if filteredLogs.length === 0}
            <div class="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12 font-sans">
                <Search size={20} class="stroke-1 mb-1.5 opacity-50" />
                <p class="text-xs">未搜索到匹配「{searchQuery}」的日志</p>
            </div>
        {:else}
            {#each filteredLogs as log (log.id)}
                <div class="flex items-start gap-2.5 leading-relaxed group hover:bg-slate-50/90 dark:hover:bg-slate-800/50 px-2.5 py-1 rounded-md transition-colors text-[11px] relative border border-transparent hover:border-slate-100 dark:hover:border-slate-800/60">
                    <!-- Timestamp -->
                    <span class="text-slate-400 dark:text-slate-500 shrink-0 select-none text-[10px] pt-0.5 font-mono">{log.formattedTime}</span>

                    <!-- Level Badge -->
                    {#if log.level === "error"}
                        <span class="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/40 text-[9px] uppercase shrink-0 font-sans font-semibold">
                            ERR
                        </span>
                        <div class="text-rose-600 dark:text-rose-400 whitespace-pre-wrap break-all flex-1 font-mono font-medium">
                            {log.content}
                        </div>
                    {:else if log.level === "warn"}
                        <span class="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/40 text-[9px] uppercase shrink-0 font-sans font-semibold">
                            WARN
                        </span>
                        <div class="text-amber-700 dark:text-amber-300 whitespace-pre-wrap break-all flex-1 font-mono">
                            {log.content}
                        </div>
                    {:else if log.level === "info"}
                        <span class="px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 border border-sky-200/80 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/40 text-[9px] uppercase shrink-0 font-sans font-semibold">
                            INFO
                        </span>
                        <div class="text-sky-700 dark:text-sky-300 whitespace-pre-wrap break-all flex-1 font-mono">
                            {log.content}
                        </div>
                    {:else if log.level === "system"}
                        <span class="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/40 text-[9px] uppercase shrink-0 font-sans font-semibold">
                            SYS
                        </span>
                        <div class="text-emerald-700 dark:text-emerald-300 whitespace-pre-wrap break-all flex-1 font-mono">
                            {log.content}
                        </div>
                    {:else}
                        <span class="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 text-[9px] uppercase shrink-0 font-sans font-medium">
                            LOG
                        </span>
                        <div class="text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-all flex-1 font-mono">
                            {log.content}
                        </div>
                    {/if}

                    <!-- Quick line copy button -->
                    <button
                        type="button"
                        onclick={() => {
                            copyToClipboard(log.content);
                            toastStore.success("已复制该行日志");
                        }}
                        class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all shrink-0 cursor-pointer"
                        title="复制此行"
                    >
                        <Copy size={11} />
                    </button>
                </div>
            {/each}
        {/if}
    </div>
</div>
