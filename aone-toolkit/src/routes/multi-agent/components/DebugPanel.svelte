<script lang="ts">
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import type { DebugLog } from "$lib/stores/agentStore.svelte";
    import { slide, fade } from "svelte/transition";
    import {
        Bug,
        ChevronDown,
        ChevronUp,
        Copy,
        Trash2,
        Clock,
        CheckCircle2,
        XCircle,
        Zap,
    } from "lucide-svelte";

    let expandedId = $state<number | null>(null);
    let logs = $derived(agentStore.debugLogs);
    let isOpen = $derived(agentStore.debugPanelOpen);
    let hasAttentionLog = $derived(logs.some(l => l.status === "error" || Boolean(l.error)));

    function totalDuration(): string {
        const total = logs.reduce((sum, l) => sum + l.duration, 0);
        return formatDuration(total);
    }

    function formatDuration(ms: number): string {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    }

    function formatTime(ts: number): string {
        return new Date(ts).toLocaleTimeString();
    }

    function toggle(id: number) {
        expandedId = expandedId === id ? null : id;
    }

    function togglePanel() {
        agentStore.debugPanelOpen = !agentStore.debugPanelOpen;
    }

    function copyText(text: string) {
        navigator.clipboard.writeText(text);
    }

    function clear() {
        agentStore.clearDebugLogs();
    }

    function handleWindowKeyDown(e: KeyboardEvent) {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "D" || e.key === "d")) {
            e.preventDefault();
            togglePanel();
        }
    }

    function typeBadgeColor(type: DebugLog["type"]): string {
        switch (type) {
            case "stage":
                return "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400";
            case "subtask":
                return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400";
            case "error":
                return "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400";
            case "fallback":
                return "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400";
        }
        return "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400";
    }

    function statusIcon(status: DebugLog["status"]) {
        return status === "success" ? CheckCircle2 : XCircle;
    }
</script>

<svelte:window onkeydown={handleWindowKeyDown} />

{#if logs.length > 0 && (isOpen || hasAttentionLog)}
    <div
        class="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
    >
        <!-- Toggle Bar -->
        <button
            onclick={togglePanel}
            class="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
        >
            <div class="flex items-center gap-2">
                <Bug size={14} class="text-indigo-500" />
                <span
                    class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                >
                    运行诊断分析 (Diagnostics)
                </span>
                <span
                    class="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-xs font-semibold"
                >
                    {hasAttentionLog ? "需注意" : `${logs.length} 条日志`}
                </span>
            </div>
            <div class="flex items-center gap-3">
                <span
                    class="text-xs text-slate-400 flex items-center gap-1"
                >
                    <Clock size={12} />
                    {totalDuration()}
                </span>
                {#if isOpen}
                    <ChevronDown size={14} class="text-slate-400" />
                {:else}
                    <ChevronUp size={14} class="text-slate-400" />
                {/if}
            </div>
        </button>

        <!-- Panel Content -->
        {#if isOpen}
            <div transition:slide class="max-h-80 overflow-y-auto">
                <!-- Clear Button -->
                <div
                    class="flex justify-end px-4 py-1 border-b border-slate-100 dark:border-slate-800"
                >
                    <button
                        onclick={clear}
                        class="flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-500 transition-colors"
                    >
                        <Trash2 size={10} />
                        清空
                    </button>
                </div>

                <!-- Log Entries -->
                {#each logs as log (log.id)}
                    {@const StatusIcon = statusIcon(log.status)}
                    <div
                        class="border-b border-slate-100 dark:border-slate-800 last:border-none"
                    >
                        <!-- Row Header -->
                        <button
                            onclick={() => toggle(log.id)}
                            class="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors text-left"
                        >
                            <span
                                class="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase {typeBadgeColor(
                                    log.type,
                                )}"
                            >
                                {log.type}
                            </span>
                            <span
                                class="flex-1 text-xs font-medium text-slate-700 dark:text-slate-300 truncate"
                            >
                                {log.name}
                            </span>
                            <span class="shrink-0 text-xs text-slate-400 font-mono">
                                {formatDuration(log.duration)}
                            </span>
                            <StatusIcon
                                size={14}
                                class={log.status === "success"
                                    ? "text-emerald-500"
                                    : "text-rose-500"}
                            />
                        </button>

                        <!-- Expanded Detail -->
                        {#if expandedId === log.id}
                            <div transition:slide class="px-4 pb-3 space-y-2">
                                <!-- Input -->
                                <div>
                                    <div
                                        class="flex items-center justify-between mb-1"
                                    >
                                        <span
                                            class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                                        >
                                            输入提示词 (Input)
                                        </span>
                                        <button
                                            onclick={() => copyText(log.input)}
                                            class="text-slate-400 hover:text-indigo-500 transition-colors"
                                            title="复制输入提示词"
                                        >
                                            <Copy size={12} />
                                        </button>
                                    </div>
                                    <pre
                                        class="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap break-words">{log.input.substring(
                                            0,
                                            1500,
                                        )}{log.input.length > 1500
                                            ? "..."
                                            : ""}</pre>
                                </div>

                                <!-- Output -->
                                <div>
                                    <div
                                        class="flex items-center justify-between mb-1"
                                    >
                                        <span
                                            class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                                        >
                                            输出结果 (Output)
                                        </span>
                                        <button
                                            onclick={() => copyText(log.output)}
                                            class="text-slate-400 hover:text-indigo-500 transition-colors"
                                            title="复制输出结果"
                                        >
                                            <Copy size={12} />
                                        </button>
                                    </div>
                                    <pre
                                        class="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap break-words">{log.output.substring(
                                            0,
                                            1500,
                                        )}{log.output.length > 1500
                                            ? "..."
                                            : ""}</pre>
                                </div>

                                <!-- Timing -->
                                <div
                                    class="flex gap-4 text-xs text-slate-400"
                                >
                                    <span>
                                        启动时间: {formatTime(log.startTime)}
                                    </span>
                                    <span>
                                        结束时间: {formatTime(log.endTime)}
                                    </span>
                                    <span class="font-semibold text-indigo-600 dark:text-indigo-400">
                                        耗时: {formatDuration(log.duration)}
                                    </span>
                                </div>

                                {#if log.error}
                                    <div
                                        class="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-600 dark:text-rose-400"
                                    >
                                        错误信息 (Error): {log.error}
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    </div>
{/if}
