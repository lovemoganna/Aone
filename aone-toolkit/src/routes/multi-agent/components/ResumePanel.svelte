<script lang="ts">
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { slide, fade } from "svelte/transition";
    import {
        Play,
        Shrink,
        Trash2,
        AlertTriangle,
        RotateCcw,
    } from "lucide-svelte";

    let checkpoint = $derived(agentStore.checkpoint);
    let isRunning = $derived(agentStore.metaFlowIsRunning);

    const STAGE_NAMES: Record<string, string> = {
        intent: "Intent Analysis",
        scene: "Scene Mapping",
        decompose: "Task Decomposition",
        prompt: "Strategy Design",
        execute: "Agent Execution",
        aggregate: "Result Synthesis",
    };

    function completedCount(): number {
        return checkpoint ? Object.keys(checkpoint.results).length : 0;
    }

    function stageName(): string {
        if (!checkpoint) return "";
        return STAGE_NAMES[checkpoint.stage] || checkpoint.stage;
    }

    function handleResume() {
        agentStore.resumeFromCheckpoint();
    }

    function handleAbandon() {
        agentStore.abandonCheckpoint();
    }
</script>

{#if checkpoint && checkpoint.error && !isRunning}
    <div
        transition:slide
        class="p-5 mt-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-200 dark:border-amber-800/50 shadow-lg"
    >
        <!-- Header -->
        <div class="flex items-center gap-3 mb-4">
            <div
                class="p-2 rounded-lg bg-amber-500 text-white shadow-lg shadow-amber-500/20"
            >
                <AlertTriangle size={18} />
            </div>
            <div>
                <h3
                    class="text-sm font-bold text-slate-900 dark:text-slate-100"
                >
                    Pipeline Interrupted — Checkpoint Saved
                </h3>
                <p class="text-[10px] text-slate-500">
                    You can resume, or discard and start fresh.
                </p>
            </div>
        </div>

        <!-- Info Grid -->
        <div
            class="grid grid-cols-3 gap-3 mb-4 p-3 rounded-xl bg-white/50 dark:bg-slate-900/50"
        >
            <div class="text-center">
                <div
                    class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                >
                    Failed Stage
                </div>
                <div
                    class="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5"
                >
                    {stageName()}
                </div>
            </div>
            <div class="text-center">
                <div
                    class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                >
                    Completed
                </div>
                <div
                    class="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5"
                >
                    {completedCount()} / 6
                </div>
            </div>
            <div class="text-center">
                <div
                    class="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                >
                    Retries
                </div>
                <div
                    class="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5"
                >
                    {checkpoint.retryCount}
                </div>
            </div>
        </div>

        <!-- Error Message -->
        <div
            class="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50"
        >
            <div
                class="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1"
            >
                <AlertTriangle size={12} />
                Error Details
            </div>
            <div class="text-xs text-rose-700 dark:text-rose-300 break-all">
                {checkpoint.error}
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
            <button
                onclick={handleResume}
                class="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/20"
            >
                <Play size={14} />
                Resume
            </button>
            <button
                onclick={handleAbandon}
                class="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/30 text-slate-600 dark:text-slate-400 hover:text-rose-600 text-xs font-bold uppercase tracking-wider transition-all"
            >
                <Trash2 size={14} />
                Discard
            </button>
        </div>
    </div>
{/if}
