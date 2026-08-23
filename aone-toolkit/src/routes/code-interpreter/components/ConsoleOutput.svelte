<script lang="ts">
    import type { ConsoleLogEntry } from "$lib/services/interpreter";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import {
        Terminal,
        Trash2,
        Copy,
        Check,
        AlertTriangle,
        Info,
        CheckCircle2,
        Flame,
    } from "lucide-svelte";

    interface Props {
        logs: ConsoleLogEntry[];
        onClear?: () => void;
    }

    let { logs = [], onClear }: Props = $props();

    let copied = $state(false);
    let autoScroll = $state(true);
    let logContainer: HTMLElement | null = $state(null);

    $effect(() => {
        if (autoScroll && logContainer && logs.length > 0) {
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    });

    async function handleCopy() {
        const text = logs.map(l => `[${l.formattedTime}] [${l.level.toUpperCase()}] ${l.content}`).join("\n");
        const success = await copyToClipboard(text);
        if (success) {
            copied = true;
            toastStore.success("控制台日志已复制到剪贴板");
            setTimeout(() => (copied = false), 2000);
        }
    }
</script>

<div class="h-full flex flex-col bg-slate-950 text-slate-100 font-mono text-xs overflow-hidden select-text">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-slate-400">
        <div class="flex items-center gap-2">
            <Terminal size={13} class="text-slate-400" />
            <span class="font-semibold text-slate-200 text-xs">控制台终端</span>
            <span class="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">
                {logs.length} 条记录
            </span>
        </div>

        <div class="flex items-center gap-1">
            <button
                onclick={handleCopy}
                disabled={logs.length === 0}
                class="px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition-colors cursor-pointer"
                title="复制所有日志"
            >
                {#if copied}
                    <Check size={12} class="text-emerald-400" />
                    <span>已复制</span>
                {:else}
                    <Copy size={12} />
                    <span>复制</span>
                {/if}
            </button>
            <button
                onclick={() => onClear?.()}
                disabled={logs.length === 0}
                class="px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition-colors cursor-pointer"
                title="清空控制台"
            >
                <Trash2 size={12} />
                <span>清空</span>
            </button>
        </div>
    </div>

    <!-- Logs Body -->
    <div
        bind:this={logContainer}
        class="flex-1 p-3 overflow-y-auto space-y-1.5 selection:bg-slate-700 selection:text-white"
    >
        {#if logs.length === 0}
            <div class="h-full flex flex-col items-center justify-center text-slate-500 py-8">
                <Terminal size={24} class="stroke-1 mb-2 opacity-50" />
                <p class="text-xs">暂无输出日志，点击「运行」或按下 <kbd class="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Ctrl + Enter</kbd> 开始执行</p>
            </div>
        {:else}
            {#each logs as log (log.id)}
                <div class="flex items-start gap-2 leading-relaxed group hover:bg-slate-900/60 px-1.5 py-0.5 rounded">
                    <!-- Timestamp -->
                    <span class="text-slate-500 shrink-0 select-none text-[11px]">{log.formattedTime}</span>

                    <!-- Level Badge -->
                    {#if log.level === "error"}
                        <span class="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] uppercase shrink-0 font-sans font-medium">
                            ERR
                        </span>
                        <div class="text-rose-300 whitespace-pre-wrap break-all flex-1 font-semibold">
                            {log.content}
                        </div>
                    {:else if log.level === "warn"}
                        <span class="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] uppercase shrink-0 font-sans font-medium">
                            WARN
                        </span>
                        <div class="text-amber-200 whitespace-pre-wrap break-all flex-1">
                            {log.content}
                        </div>
                    {:else if log.level === "info"}
                        <span class="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] uppercase shrink-0 font-sans font-medium">
                            INFO
                        </span>
                        <div class="text-sky-200 whitespace-pre-wrap break-all flex-1">
                            {log.content}
                        </div>
                    {:else if log.level === "system"}
                        <span class="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase shrink-0 font-sans font-medium">
                            SYS
                        </span>
                        <div class="text-emerald-300 whitespace-pre-wrap break-all flex-1">
                            {log.content}
                        </div>
                    {:else}
                        <span class="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] uppercase shrink-0 font-sans font-medium">
                            LOG
                        </span>
                        <div class="text-slate-200 whitespace-pre-wrap break-all flex-1">
                            {log.content}
                        </div>
                    {/if}
                </div>
            {/each}
        {/if}
    </div>
</div>
