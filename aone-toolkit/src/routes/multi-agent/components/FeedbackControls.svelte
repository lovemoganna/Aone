<script lang="ts">
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { Button } from "$lib/components/ui";
    import { fade, slide } from "svelte/transition";
    import {
        ArrowRight,
        CheckCircle2,
        History,
        MessageSquare,
        RefreshCcw,
        RotateCcw,
        Sparkles
    } from "lucide-svelte";

    let feedback = $state("");
    let showFeedbackArea = $state(false);

    const HINTS = [
        "补充更多具体实施细节",
        "使结论与方案更加精简凝练",
        "补充实际代码或架构示例",
        "增加极端边界条件与风控考量",
        "强化量化投入产出比数据",
        "转换为 72h 敏捷执行工单",
    ];

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
        feedback = feedback ? `${feedback}\n- ${hint}` : `- ${hint}`;
    }

    let round = $derived(agentStore.iterationRound);
    let history = $derived(agentStore.iterationHistory);
</script>

<div
    transition:slide
    class="mx-4 mt-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
>
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="min-w-0">
            <div class="flex items-center gap-2">
                <CheckCircle2 class="h-4 w-4 text-emerald-500" />
                <h3 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                    协同推演结果已就绪
                </h3>
                <span class="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                    第 {round} 轮迭代
                </span>
            </div>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                可针对当前推演结论提出补充诉求触发定向迭代，或重新组织小队进行推演。
            </p>
        </div>

        <!-- [03] 补全操作按钮的 type="button" 与 focus-visible 焦点轮廓 -->
        <div class="flex items-center gap-2 shrink-0">
            <button
                type="button"
                onclick={() => (showFeedbackArea = !showFeedbackArea)}
                class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 {showFeedbackArea ? 'border-slate-500 text-slate-900 dark:text-slate-100 bg-slate-100/60 dark:bg-slate-750' : ''}"
            >
                <RefreshCcw class="h-3.5 w-3.5" />
                补充要求与迭代
            </button>
            <button
                type="button"
                onclick={handleReject}
                class="inline-flex items-center gap-1.5 rounded-xl border border-rose-200/80 bg-rose-50/60 px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100/60 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/60 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
                <RotateCcw class="h-3.5 w-3.5" />
                重置并重新推演
            </button>
        </div>
    </div>

    {#if showFeedbackArea}
        <div
            transition:slide={{ duration: 200 }}
            class="mt-4 border-t border-slate-200/60 pt-4 dark:border-slate-800/60"
        >
            <div class="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <MessageSquare class="h-3.5 w-3.5 text-slate-500" />
                提出补充方向或调整诉求
            </div>

            <!-- [03] 为补充诉求输入框增加无障碍标签 aria-label -->
            <textarea
                bind:value={feedback}
                aria-label="补充方向或调整诉求"
                placeholder={"示例：\n- 保留当前拆解结构，但需要补充更具体的实施步骤\n- 强化极限压力测试，分析团队人员变动时的兜底方案\n- 将结论转化为可直接交付给研发团队的 72h 工单清单"}
                class="h-24 w-full resize-none rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs outline-none transition focus:border-slate-400 dark:focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            ></textarea>

            <div class="mt-2.5 flex flex-wrap gap-1.5">
                {#each HINTS as hint}
                    <button
                        type="button"
                        onclick={() => addHint(hint)}
                        class="rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-[11px] text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
                    >
                        + {hint}
                    </button>
                {/each}
            </div>

            <div class="mt-3.5 flex justify-end">
                <button
                    type="button"
                    onclick={handleSubmitFeedback}
                    disabled={!feedback.trim()}
                    class="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white px-4 py-2 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                    提交并启动本轮定向迭代
                    <ArrowRight class="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    {/if}

    {#if history.length > 0}
        <div
            transition:fade
            class="mt-4 border-t border-slate-200/60 pt-4 dark:border-slate-800/60"
        >
            <div class="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <History class="h-3.5 w-3.5" />
                历史迭代诉求记录
            </div>
            <div class="max-h-32 space-y-2 overflow-y-auto">
                {#each history as item}
                    <div class="flex gap-2 text-xs">
                        <span class="shrink-0 rounded bg-indigo-50 px-1.5 py-0.5 font-bold font-mono text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                            R{item.round}
                        </span>
                        <span class="line-clamp-2 text-slate-600 dark:text-slate-300 text-[11px]">
                            {item.feedback}
                        </span>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>
