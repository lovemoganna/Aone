<script lang="ts">
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { slide } from "svelte/transition";
    import {
        Play,
        Trash2,
        RotateCcw,
    } from "lucide-svelte";

    let hasResumable = $derived(agentStore.hasResumableCheckpoint);
    let cp = $derived(agentStore.savedCheckpoint || agentStore.checkpoint);
    let currentStep = $derived((cp?.currentStrategyStep || 0) + 1);
    let totalSteps = $derived(cp?.governanceState?.strategy?.strategy?.length || cp?.collaborationSteps?.length || 4);

    function handleResume() {
        agentStore.resumeFromCheckpoint();
    }

    function handleAbandon() {
        agentStore.abandonCheckpoint();
    }
</script>

{#if hasResumable && cp}
    <div
        transition:slide
        class="mx-auto my-3 w-full max-w-3xl p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs shadow-2xs"
    >
        <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0">
                <div class="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shrink-0">
                    <RotateCcw size={15} />
                </div>
                <div class="min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-slate-900 dark:text-slate-100 truncate">
                            未完成任务断点
                        </span>
                        <span class="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                            Step {currentStep}/{totalSteps}
                        </span>
                    </div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {cp.goal || '多 Agent 协同任务'}
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
                <button
                    type="button"
                    onclick={handleResume}
                    class="flex items-center gap-1 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 text-white text-xs font-semibold transition cursor-pointer"
                >
                    <Play size={12} class="fill-current" />
                    <span>恢复执行</span>
                </button>
                <button
                    type="button"
                    onclick={handleAbandon}
                    class="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="丢弃断点"
                    aria-label="丢弃断点"
                >
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    </div>
{/if}
