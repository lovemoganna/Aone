<script lang="ts">
    import { agentStore, type CollaborationStep } from "$lib/stores/agentStore.svelte";
    import {
        Bot,
        CheckCircle2,
        Loader2,
        Pause,
        Play
    } from "lucide-svelte";
    import { slide } from "svelte/transition";
    import { AGENT_DISPLAY_MAP, getAgentDisplayName } from "$lib/constants/agentConstants";

    let steps = $derived(agentStore.pipelineState.collaborationSteps || []);
    let isRunning = $derived(agentStore.pipelineState.isRunning || agentStore.metaFlowIsRunning);
    let isPaused = $derived(agentStore.pipelineState.isPaused);

    function handleStepClick(step: CollaborationStep) {
        if (!step.messageId) return;
        const el = document.getElementById(`msg-${step.messageId}`);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }

    function togglePause() {
        if (isPaused) {
            agentStore.resumeExecution();
        } else {
            agentStore.pauseExecution();
        }
    }
</script>

{#if steps.length > 0}
    <div
        transition:slide={{ duration: 150 }}
        class="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 px-4 py-1.5 shrink-0 text-xs"
    >
        <div class="flex items-center justify-between gap-3 max-w-3xl mx-auto">
            <!-- Steps Line -->
            <div class="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none min-w-0">
                {#each steps as step, i (step.step)}
                    <button
                        type="button"
                        onclick={() => handleStepClick(step)}
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer shrink-0 {step.status === 'running' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold' : step.status === 'completed' ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800' : 'text-slate-400 opacity-60'}"
                    >
                        {#if step.status === 'completed'}
                            <CheckCircle2 class="w-3 h-3 text-emerald-500" />
                        {:else if step.status === 'running'}
                            <Loader2 class="w-3 h-3 animate-spin text-slate-400 dark:text-slate-600" />
                        {:else}
                            <span class="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-700 inline-block"></span>
                        {/if}
                        <span>{getAgentDisplayName(step.agentId)}</span>
                    </button>
                    {#if i < steps.length - 1}
                        <span class="text-slate-300 dark:text-slate-700 text-[10px]">/</span>
                    {/if}
                {/each}
            </div>

            <!-- Pause / Resume Control -->
            {#if isRunning}
                <button
                    type="button"
                    onclick={togglePause}
                    class="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer shrink-0"
                    title={isPaused ? "继续推演" : "暂停推演"}
                >
                    {#if isPaused}
                        <Play class="w-3.5 h-3.5 text-indigo-500" />
                    {:else}
                        <Pause class="w-3.5 h-3.5" />
                    {/if}
                </button>
            {/if}
        </div>
    </div>
{/if}
