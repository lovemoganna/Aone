<script lang="ts">
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { fly, scale } from "svelte/transition";
    import {
        CheckCircle2,
        MessageSquarePlus,
        RefreshCw,
        ShieldCheck,
        ChevronRight,
        Bot,
        ListTodo,
    } from "lucide-svelte";
    import { marked } from "marked";

    let feedbackMode = $state(false);
    let feedbackText = $state("");
    let isSubmitting = $state(false);

    // Derived state from store
    let governanceState = $derived(agentStore.pipelineState.governanceState);
    let strategy = $derived(governanceState?.strategy);
    let status = $derived(governanceState?.status);

    async function handleAccept() {
        if (isSubmitting) return;
        isSubmitting = true;
        await agentStore.handleGovernanceAction("accept");
        isSubmitting = false;
    }

    async function handleRegenerate() {
        if (isSubmitting) return;
        isSubmitting = true;
        await agentStore.handleGovernanceAction("regenerate");
        isSubmitting = false;
        feedbackMode = false;
        feedbackText = "";
    }

    async function handleIterate() {
        if (!feedbackText.trim() || isSubmitting) return;
        isSubmitting = true;
        await agentStore.handleGovernanceAction("iterate", feedbackText);
        isSubmitting = false;
        feedbackMode = false;
        feedbackText = "";
    }
</script>

{#if governanceState && status !== "accepted"}
    <div
        class="w-full max-w-3xl mx-auto my-6"
        in:fly={{ y: 20, duration: 400 }}
    >
        <!-- Card Container -->
        <div
            class="bg-white dark:bg-gray-900 border-2 border-indigo-100 dark:border-indigo-900/50 rounded-xl shadow-xl overflow-hidden relative"
        >
            <!-- Header -->
            <div
                class="bg-indigo-50/50 dark:bg-indigo-900/20 p-4 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-500/20"
                    >
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h3
                            class="font-bold text-gray-900 dark:text-gray-100 text-base"
                        >
                            总体策略建议 (Round 0)
                        </h3>
                        <p class="text-xs text-indigo-600 dark:text-indigo-400">
                            由 协调者 (Coordinator) 生成 • 等待您的决策
                        </p>
                    </div>
                </div>
                {#if status === "iterating"}
                    <div
                        class="flex items-center gap-2 text-amber-600 text-xs font-medium animate-pulse"
                    >
                        <RefreshCw size={14} class="animate-spin" />
                        正在优化策略...
                    </div>
                {/if}
            </div>

            <!-- Body -->
            <div class="p-5 space-y-4">
                <!-- Analysis Section -->
                {#if strategy?.analysis}
                    <div
                        class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300"
                    >
                        <div
                            class="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2"
                        >
                            <Bot size={16} /> 深度分析
                        </div>
                        <p class="leading-relaxed">{strategy.analysis}</p>
                    </div>
                {/if}

                <!-- Strategy Steps -->
                {#if strategy?.strategy}
                    <div class="space-y-3">
                        <div
                            class="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2"
                        >
                            <ListTodo size={16} /> 执行步骤
                        </div>
                        {#each strategy.strategy as step, i}
                            <div
                                class="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
                            >
                                <div
                                    class="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold font-mono"
                                >
                                    {i + 1}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 mb-1">
                                        <span
                                            class="text-xs font-bold text-gray-900 dark:text-white px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded"
                                        >
                                            {step.agent}
                                        </span>
                                    </div>
                                    <p
                                        class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed"
                                    >
                                        {step.instruction}
                                    </p>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}

                <!-- Reasoning Footer -->
                {#if strategy?.reasoning}
                    <p
                        class="text-xs text-gray-500 dark:text-gray-500 italic px-1"
                    >
                        策略理由: {strategy.reasoning}
                    </p>
                {/if}
            </div>

            <!-- Actions Footer -->
            <div
                class="bg-gray-50 dark:bg-gray-900/50 p-4 border-t border-gray-100 dark:border-gray-800"
            >
                {#if !feedbackMode}
                    <div class="flex gap-3 justify-end">
                        <button
                            class="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                            onclick={handleRegenerate}
                            disabled={isSubmitting}
                        >
                            <RefreshCw size={16} />
                            重新生成 (Regenerate)
                        </button>
                        <button
                            class="px-4 py-2 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center gap-2 border border-indigo-200 dark:border-indigo-800"
                            onclick={() => (feedbackMode = true)}
                            disabled={isSubmitting}
                        >
                            <MessageSquarePlus size={16} />
                            调整建议 (Iterate)
                        </button>
                        <button
                            class="px-6 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center gap-2 active:scale-95"
                            onclick={handleAccept}
                            disabled={isSubmitting}
                        >
                            <CheckCircle2 size={18} />
                            认可策略 (Accept)
                        </button>
                    </div>
                {:else}
                    <!-- Feedback Input Mode -->
                    <div
                        class="space-y-3"
                        in:scale={{ duration: 200, start: 0.98 }}
                    >
                        <div class="flex justify-between items-center text-sm">
                            <label
                                class="font-medium text-gray-700 dark:text-gray-300"
                            >
                                请输入您的调整建议：
                            </label>
                            <button
                                class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                onclick={() => (feedbackMode = false)}
                            >
                                取消
                            </button>
                        </div>
                        <div class="relative">
                            <textarea
                                bind:value={feedbackText}
                                rows="3"
                                class="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent p-3 pr-12 resize-none shadow-inner"
                                placeholder="例如：请让分析师更激进一些，或者先讨论风险..."
                                onkeydown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleIterate();
                                    }
                                }}
                            ></textarea>
                            <button
                                class="absolute right-2 bottom-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                onclick={handleIterate}
                                disabled={!feedbackText.trim() || isSubmitting}
                            >
                                {#if isSubmitting}
                                    <RefreshCw size={16} class="animate-spin" />
                                {:else}
                                    <ChevronRight size={16} />
                                {/if}
                            </button>
                        </div>
                        <p class="text-xs text-gray-500">
                            按 Enter 发送建议，协调者将重新生成策略。
                        </p>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}
