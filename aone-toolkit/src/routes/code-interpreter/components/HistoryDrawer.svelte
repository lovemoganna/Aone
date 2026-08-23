<script lang="ts">
    import type { HistoryRecord } from "$lib/services/interpreter";
    import {
        History,
        Star,
        Trash2,
        CheckCircle2,
        XCircle,
        Clock,
        Search,
        Download,
        Upload,
        X,
    } from "lucide-svelte";
    import { toastStore } from "$lib/stores/toastStore.svelte";

    interface Props {
        history: HistoryRecord[];
        onSelectHistory?: (record: HistoryRecord) => void;
        onToggleFavorite?: (recordId: string) => void;
        onClearHistory?: () => void;
    }

    let { history = [], onSelectHistory, onToggleFavorite, onClearHistory }: Props = $props();

    let filterLanguage = $state<string>("all");
    let showFavoritesOnly = $state(false);
    let searchCodeQuery = $state("");

    let filteredHistory = $derived.by(() => {
        return history.filter(item => {
            if (showFavoritesOnly && !item.favorite) return false;
            if (filterLanguage !== "all" && item.language !== filterLanguage) return false;
            if (searchCodeQuery.trim()) {
                const q = searchCodeQuery.toLowerCase();
                return item.code.toLowerCase().includes(q) || (item.title && item.title.toLowerCase().includes(q));
            }
            return true;
        });
    });

    function handleExportHistory() {
        if (history.length === 0) return;
        const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `interpreter_history_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toastStore.success("已导出历史快照备份");
    }

    function formatTime(ts: number): string {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
</script>

<div class="h-full flex flex-col bg-white dark:bg-slate-900 text-xs">
    <!-- Header -->
    <div class="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
        <div class="flex items-center gap-2">
            <History size={13} class="text-slate-400" />
            <span class="font-semibold text-slate-800 dark:text-slate-200 text-xs">执行历史快照</span>
            <span class="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-mono">
                {history.length}
            </span>
        </div>
        <div class="flex items-center gap-1">
            <button
                type="button"
                onclick={handleExportHistory}
                disabled={history.length === 0}
                class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
                title="导出历史记录 JSON 备份"
            >
                <Download size={13} />
            </button>
            <button
                type="button"
                onclick={() => onClearHistory?.()}
                disabled={history.length === 0}
                class="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30 transition-colors cursor-pointer"
                title="清空历史记录"
            >
                <Trash2 size={13} />
            </button>
        </div>
    </div>

    <!-- Filters & Search -->
    <div class="p-2.5 border-b border-slate-100 dark:border-slate-800/80 space-y-2 bg-slate-50/30 dark:bg-slate-950/20">
        <!-- Search -->
        <div class="relative">
            <Search size={12} class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
                type="text"
                bind:value={searchCodeQuery}
                placeholder="搜索历史代码片段..."
                class="w-full pl-8 pr-7 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-slate-400 text-slate-800 dark:text-slate-200 shadow-2xs"
            />
            {#if searchCodeQuery}
                <button
                    type="button"
                    onclick={() => (searchCodeQuery = "")}
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                    <X size={12} />
                </button>
            {/if}
        </div>

        <div class="flex items-center gap-2">
            <select
                bind:value={filterLanguage}
                class="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-slate-400 text-slate-700 dark:text-slate-300 shadow-2xs cursor-pointer"
            >
                <option value="all">全部语言</option>
                <option value="sql">DuckDB SQL</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
            </select>

            <button
                type="button"
                onclick={() => (showFavoritesOnly = !showFavoritesOnly)}
                class="px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer {showFavoritesOnly ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}"
                title="只显示收藏项"
            >
                <Star size={11} class={showFavoritesOnly ? "fill-amber-400 text-amber-400" : "text-slate-400"} />
                <span>收藏</span>
            </button>
        </div>
    </div>

    <!-- History List -->
    <div class="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {#if filteredHistory.length === 0}
            <div class="py-8 text-center text-slate-400 dark:text-slate-500">
                <Clock size={20} class="mx-auto mb-1.5 opacity-30" />
                <p class="text-xs">暂无历史执行快照</p>
            </div>
        {:else}
            {#each filteredHistory as item (item.id)}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    onclick={() => onSelectHistory?.(item)}
                    class="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer space-y-2 group transition-all shadow-2xs"
                >
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5">
                            {#if item.status === "success"}
                                <CheckCircle2 size={12} class="text-emerald-500 shrink-0" />
                            {:else}
                                <XCircle size={12} class="text-rose-500 shrink-0" />
                            {/if}
                            <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {item.language}
                            </span>
                            <span class="text-slate-400 text-[10px] font-mono">{formatTime(item.timestamp)}</span>
                        </div>

                        <button
                            type="button"
                            onclick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite?.(item.id);
                            }}
                            class="p-1 rounded text-slate-300 hover:text-amber-400 dark:text-slate-600 dark:hover:text-amber-400 transition-colors cursor-pointer {item.favorite ? 'text-amber-400! dark:text-amber-400!' : ''}"
                            title="收藏/取消收藏"
                        >
                            <Star
                                size={12}
                                class={item.favorite ? "fill-current" : ""}
                            />
                        </button>
                    </div>

                    <p class="font-mono text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800/80">
                        {item.code}
                    </p>

                    <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>耗时: {item.durationMs} ms</span>
                        {#if item.rowCount !== undefined}
                            <span>{item.rowCount} 行</span>
                        {/if}
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>
