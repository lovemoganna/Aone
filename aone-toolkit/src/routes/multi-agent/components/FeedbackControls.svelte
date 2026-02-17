<script lang="ts">
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { Button } from "$lib/components/ui";
    import { slide, fade } from "svelte/transition";
    import {
        CheckCircle2,
        RefreshCcw,
        XCircle,
        MessageSquare,
        ArrowRight,
        Sparkles,
        History,
    } from "lucide-svelte";

    let feedback = $state("");
    let showFeedbackArea = $state(false);

    const HINTS = [
        "More detail",
        "Make it concise",
        "Add code examples",
        "Add real-world cases",
        "Simpler language",
        "More professional",
    ];

    function handleAccept() {
        agentStore.addMessage(
            "system",
            "✅ Result accepted. Iteration state finalized.",
            undefined,
        );
        agentStore.resetIterationState();
        agentStore.metaFlowFinished = false;
        showFeedbackArea = false;
    }

    async function handleReject() {
        showFeedbackArea = false;
        agentStore.metaFlowFinished = false;
        await agentStore.executeRegeneration();
    }

    async function handleSubmitFeedback() {
        if (!feedback.trim()) return;
        const text = feedback;
        feedback = "";
        showFeedbackArea = false;
        agentStore.metaFlowFinished = false;
        await agentStore.executeIteration(text);
    }

    function addHint(hint: string) {
        if (feedback.includes(hint)) return;
        feedback = feedback ? `${feedback}\n• ${hint}` : `• ${hint}`;
    }

    let round = $derived(agentStore.iterationRound);
    let history = $derived(agentStore.iterationHistory);
</script>

<div
    transition:slide
    class="p-6 mt-4 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-2 border-indigo-100 dark:border-indigo-900/30 shadow-xl shadow-indigo-500/5"
>
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
        <div
            class="p-2 rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
        >
            <Sparkles size={18} />
        </div>
        <div>
            <h3
                class="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest"
            >
                Result Governance
            </h3>
            <p class="text-[10px] text-slate-500 font-medium">
                Verify, iterate, or regenerate the synthesized result
            </p>
        </div>
        <div
            class="ml-auto px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-tighter"
        >
            Round {round}
        </div>
    </div>

    <!-- Actions -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <button
            onclick={handleAccept}
            class="group flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all"
        >
            <CheckCircle2
                size={24}
                class="text-slate-400 group-hover:text-emerald-500 transition-colors"
            />
            <div class="text-center">
                <div
                    class="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider"
                >
                    Accept
                </div>
                <div class="text-[10px] text-slate-400">
                    Result is satisfactory
                </div>
            </div>
        </button>

        <button
            onclick={() => (showFeedbackArea = !showFeedbackArea)}
            class="group flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all {showFeedbackArea
                ? 'ring-2 ring-indigo-500 border-transparent'
                : ''}"
        >
            <RefreshCcw
                size={24}
                class="text-slate-400 group-hover:text-indigo-500 transition-colors {showFeedbackArea
                    ? 'text-indigo-500'
                    : ''}"
            />
            <div class="text-center">
                <div
                    class="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider"
                >
                    Iterate
                </div>
                <div class="text-[10px] text-slate-400">
                    Targeted improvements
                </div>
            </div>
        </button>

        <button
            onclick={handleReject}
            class="group flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-rose-500 dark:hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
        >
            <XCircle
                size={24}
                class="text-slate-400 group-hover:text-rose-500 transition-colors"
            />
            <div class="text-center">
                <div
                    class="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider"
                >
                    Regenerate
                </div>
                <div class="text-[10px] text-slate-400">
                    Fresh approach with history
                </div>
            </div>
        </button>
    </div>

    <!-- Feedback Area -->
    {#if showFeedbackArea}
        <div
            transition:slide
            class="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4"
        >
            <div
                class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400"
            >
                <MessageSquare size={14} />
                WHAT SHOULD BE IMPROVED?
            </div>

            <textarea
                bind:value={feedback}
                placeholder={"Examples:\n• Keep part 1 but add more implementation detail\n• Code examples need error handling\n• Tone should be more professional"}
                class="w-full h-24 p-4 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder:text-slate-500 transition-all"
            ></textarea>

            <!-- Hint Chips -->
            <div class="flex flex-wrap gap-2">
                {#each HINTS as hint}
                    <button
                        onclick={() => addHint(hint)}
                        class="px-3 py-1 text-[10px] font-bold rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-500 hover:text-white transition-all capitalize"
                    >
                        {hint}
                    </button>
                {/each}
            </div>

            <div class="flex justify-end pt-2">
                <Button
                    onclick={handleSubmitFeedback}
                    disabled={!feedback.trim()}
                    class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 pr-2"
                >
                    Submit & Iterate
                    <div class="p-1 px-2 rounded-lg bg-indigo-500 text-white">
                        <ArrowRight size={14} />
                    </div>
                </Button>
            </div>
        </div>
    {/if}

    <!-- Iteration History -->
    {#if history.length > 0}
        <div
            transition:slide
            class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800"
        >
            <div
                class="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider"
            >
                <History size={14} />
                Iteration History
            </div>
            <div class="space-y-2 max-h-40 overflow-y-auto">
                {#each history as item}
                    <div class="flex items-start gap-2 text-xs">
                        <span
                            class="shrink-0 px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold"
                        >
                            R{item.round}
                        </span>
                        <span
                            class="text-slate-600 dark:text-slate-400 line-clamp-2"
                        >
                            {item.feedback}
                        </span>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>
