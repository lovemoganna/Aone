<script lang="ts">
    import type { HistoryRecord, SupportedLanguage } from "$lib/services/interpreter";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import {
        History,
        Star,
        Trash2,
        CheckCircle2,
        XCircle,
        ArrowRight,
        Clock,
        FileCode2,
        Filter,
    } from "lucide-svelte";

    interface Props {
        history: HistoryRecord[];
        onSelectHistory?: (record: HistoryRecord) => void;
        onToggleFavorite?: (recordId: string) => void;
        onClearHistory?: () => void;
    }

    let { history = [], onSelectHistory, onToggleFavorite, onClearHistory }: Props = $props();

    let filterLanguage = $state<string>("all");
    let showFavoritesOnly = $state(false);

    let filteredHistory = $derived.by(() => {
        return history.filter(item => {
            if (showFavoritesOnly && !item.favorite) return false;
            if (filterLanguage !== "all" && item.language !== filterLanguage) return false;
            return true;
        });
    });

    function formatTime(ts: number): string {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
</script>

<div class="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-xs">
    <!-- Header -->
    <div class="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-between">
        <div class="flex items-center gap-2">
            <History size={14} class="text-slate-500" />
            <span class="font-semibold text-slate-800 dark:text-slate-200 text-xs">执行历史与快照</span>
        </div>
        <button
            onclick={() => onClearHistory?.()}
            disabled={history.length === 0}
            class="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30 transition-colors cursor-pointer"
            title="清空历史"
        >
            <Trash2 size={13} />
        </button>
    </div>

    <!-- Filters -->
    <div class="p-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 bg-slate-50/40 dark:bg-slate-950/20">
        <select
            bind:value={filterLanguage}
            class="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-slate-400 text-slate-700 dark:text-slate-300"
        >
            <option value="all">所有语言</option>
            <option value="sql">DuckDB SQL</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
        </select>

        <button
            onclick={() => (showFavoritesOnly = !showFavoritesOnly)}
            class="px-2 py-1 rounded border flex items-center gap-1 transition-colors cursor-pointer {showFavoritesOnly ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}"
            title="只显示收藏"
        >
            <Star size={11} class={showFavoritesOnly ? "fill-amber-400 text-amber-400" : ""} />
            <span>收藏</span>
        </button>
    </div>

    <!-- History List -->
    <div class="flex-1 overflow-y-auto p-3 space-y-2">
        {#if filteredHistory.length === 0}
            <div class="py-8 text-center text-slate-400 dark:text-slate-500">
                <Clock size={20} class="mx-auto mb-1.5 opacity-40" />
                <p class="text-xs">暂无历史执行记录</p>
            </div>
        {:else}
            {#each filteredHistory as item (item.id)}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    onclick={() => onSelectHistory?.(item)}
                    class="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer space-y-1.5 group transition-colors shadow-2xs"
                >
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5">
                            {#if item.status === "success"}
                                <CheckCircle2 size={12} class="text-emerald-500 shrink-0" />
                            {:else}
                                <XCircle size={12} class="text-rose-500 shrink-0" />
                            {/if}
                            <span class="px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300">
                                {item.language}
                            </span>
                            <span class="text-slate-400 text-[10px] font-mono">{formatTime(item.timestamp)}</span>
                        </div>

                        <button
                            onclick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite?.(item.id);
                            }}
                            class="p-1 rounded text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                            title="收藏/取消收藏"
                        >
                            <Star
                                size={12}
                                class={item.favorite ? "fill-amber-400 text-amber-400" : "opacity-30 group-hover:opacity-100"}
                            />
                        </button>
                    </div>

                    <p class="font-mono text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed bg-white/80 dark:bg-slate-950/80 p-1.5 rounded border border-slate-200/60 dark:border-slate-800">
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
