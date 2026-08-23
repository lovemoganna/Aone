<script lang="ts">
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { fly, scale } from "svelte/transition";
    import {
        Bot,
        CheckCircle2,
        ChevronRight,
        ListTodo,
        MessageSquarePlus,
        RotateCcw,
        RefreshCw,
        ShieldCheck,
        ArrowUp,
        ArrowDown,
        Trash2,
        Plus,
        Sparkles
    } from "lucide-svelte";
    import { getAgentDisplayName, getAgentAlias, COGNITIVE_AGENTS } from "$lib/constants/cognitiveAgents";

    let feedbackMode = $state(false);
    let feedbackText = $state("");
    let isSubmitting = $state(false);
    let insertStepIndex = $state<number | null>(null);
    let insertAgentId = $state("closer");
    let insertSkillId = $state<string | undefined>(undefined);
    let insertInstruction = $state("");

    let governanceState = $derived(agentStore.pipelineState.governanceState);
    let strategy = $derived(governanceState?.strategy);
    let status = $derived(governanceState?.status);

    function moveStep(index: number, direction: 'up' | 'down') {
        if (!strategy?.strategy) return;
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= strategy.strategy.length) return;

        const steps = [...strategy.strategy];
        const [removed] = steps.splice(index, 1);
        steps.splice(targetIndex, 0, removed);
        
        steps.forEach((s, idx) => { s.step = idx + 1; });
        strategy.strategy = steps;
    }

    function deleteStep(index: number) {
        if (!strategy?.strategy || strategy.strategy.length <= 1) return;
        const steps = [...strategy.strategy];
        steps.splice(index, 1);
        steps.forEach((s, idx) => { s.step = idx + 1; });
        strategy.strategy = steps;
    }

    function handleInsertStep(index: number) {
        if (!strategy?.strategy) return;
        const steps = [...strategy.strategy];
        steps.splice(index, 0, {
            step: index + 1,
            agent: insertAgentId,
            skill: insertSkillId,
            instruction: insertInstruction.trim() || "请就当前问题给出专业补充分析"
        });
        steps.forEach((s, idx) => { s.step = idx + 1; });
        strategy.strategy = steps;
        insertStepIndex = null;
        insertInstruction = "";
    }

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

{#if status === "pending" && strategy}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
        transition:fly={{ y: 15, duration: 200 }}
    >
        <div
            class="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            in:scale={{ duration: 180, start: 0.96 }}
        >
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-850">
                <div class="flex items-center gap-3">
                    <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs">
                        <ShieldCheck size={18} />
                    </div>
                    <div>
                        <h2 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            工序编排复核
                        </h2>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            已生成协同执行步骤，请复核、重排或调整工序
                        </p>
                    </div>
                </div>
            </div>

            <div class="space-y-4 p-5 max-h-[60vh] overflow-y-auto">
                {#if strategy?.analysis}
                    <div class="rounded-2xl bg-slate-50 p-4 text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                        <div class="mb-1.5 flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                            <Bot size={15} class="text-indigo-500" />
                            <span>核心命题情境分析</span>
                        </div>
                        <p class="leading-relaxed text-[11px]">{strategy.analysis}</p>
                    </div>
                {/if}

                {#if strategy?.strategy}
                    <div class="space-y-2.5">
                        <div class="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                            <span class="flex items-center gap-1.5">
                                <ListTodo size={15} class="text-indigo-500" />
                                编排工序步骤 ({strategy.strategy.length})
                            </span>
                            <span class="text-[10px] font-normal text-slate-400">悬停可拖动排序或删除</span>
                        </div>
                        {#each strategy.strategy as step, i}
                            <div class="group relative flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs transition-all hover:border-indigo-400 dark:border-slate-800 dark:bg-slate-850 dark:hover:border-indigo-800">
                                <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-mono text-xs font-bold text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400 mt-0.5">
                                    {i + 1}
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="mb-1 flex items-center gap-2">
                                        <span class="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                            {getAgentAlias(step.agent, step.agent)}
                                        </span>
                                        {#if step.skill}
                                            <span class="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                                {step.skill}
                                            </span>
                                        {/if}
                                    </div>
                                    <p class="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                        {step.instruction}
                                    </p>
                                </div>

                                <!-- Step Actions -->
                                <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button
                                        type="button"
                                        disabled={i === 0}
                                        onclick={() => moveStep(i, 'up')}
                                        class="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                        title="上移此步骤"
                                    >
                                        <ArrowUp size={13} />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={i === strategy.strategy.length - 1}
                                        onclick={() => moveStep(i, 'down')}
                                        class="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                        title="下移此步骤"
                                    >
                                        <ArrowDown size={13} />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={strategy.strategy.length <= 1}
                                        onclick={() => deleteStep(i)}
                                        class="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                        title="删除此步骤"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>

                            <!-- Insertion Divider -->
                            <div class="flex items-center justify-center my-0.5">
                                {#if insertStepIndex === i + 1}
                                    <div class="w-full rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/50 p-3 space-y-2 dark:border-indigo-800 dark:bg-indigo-950/30">
                                        <div class="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                            <span>插入新工序 (第 {i + 2} 步)</span>
                                            <button onclick={() => insertStepIndex = null} class="text-slate-400 hover:text-slate-600 text-[11px] cursor-pointer">取消</button>
                                        </div>
                                        <div class="grid grid-cols-2 gap-2">
                                            <select bind:value={insertAgentId} class="text-xs p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                                                {#each agentStore.agents as agent}
                                                    <option value={agent.id}>{getAgentDisplayName(agent.id, agent.name)}</option>
                                                {/each}
                                            </select>
                                            <select bind:value={insertSkillId} class="text-xs p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                                                <option value={undefined}>常规专业对话</option>
                                                <option value="decompose">结构化拆解</option>
                                                <option value="decision_matrix">决策矩阵</option>
                                                <option value="stress_test">风险测试</option>
                                                <option value="resource_audit">资源盘点</option>
                                                <option value="reframe">思维重构</option>
                                                <option value="action_list">行动清单</option>
                                            </select>
                                        </div>
                                        <input
                                            type="text"
                                            bind:value={insertInstruction}
                                            placeholder="输入分配给该专家的具体指令..."
                                            class="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-slate-400 dark:focus:border-slate-500"
                                        />
                                        <div class="flex justify-end">
                                            <button
                                                type="button"
                                                onclick={() => handleInsertStep(i + 1)}
                                                class="px-3.5 py-1 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-xl text-xs font-bold transition cursor-pointer"
                                            >
                                                确认插入步骤
                                            </button>
                                        </div>
                                    </div>
                                {:else}
                                    <button
                                        type="button"
                                        onclick={() => insertStepIndex = i + 1}
                                        class="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer"
                                        title="在此处插入新步骤"
                                    >
                                        <Plus size={12} />
                                        <span>插入工序</span>
                                    </button>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}

                {#if strategy?.reasoning}
                    <p class="px-1 text-[11px] text-slate-400 italic">
                        编排依据: {strategy.reasoning}
                    </p>
                {/if}
            </div>

            <div class="border-t border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                {#if !feedbackMode}
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            {#if governanceState?.originalStrategy}
                                <button
                                    type="button"
                                    class="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                    onclick={() => agentStore.resetStrategyToOriginal()}
                                    title="恢复协调者最初生成的步骤规划"
                                >
                                    <RotateCcw size={13} />
                                    <span>重置为初始步骤</span>
                                </button>
                            {/if}
                        </div>
                        <div class="flex items-center gap-2.5">
                            <button
                                class="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                                onclick={handleRegenerate}
                                disabled={isSubmitting}
                            >
                                <RefreshCw size={14} />
                                重新编排
                            </button>
                            <button
                                class="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/60 transition cursor-pointer"
                                onclick={() => (feedbackMode = true)}
                                disabled={isSubmitting}
                            >
                                <MessageSquarePlus size={14} />
                                补充诉求
                            </button>
                            <button
                                class="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white active:scale-95 transition cursor-pointer"
                                onclick={handleAccept}
                                disabled={isSubmitting}
                            >
                                <CheckCircle2 size={14} />
                                确认并执行
                            </button>
                        </div>
                    </div>
                {:else}
                    <div class="space-y-3" in:scale={{ duration: 180, start: 0.98 }}>
                        <div class="flex items-center justify-between text-xs">
                            <label
                                for="governance-feedback"
                                class="font-bold text-slate-900 dark:text-white"
                            >
                                期望对编排策略进行哪些调整？
                            </label>
                            <button
                                class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                onclick={() => (feedbackMode = false)}
                            >
                                取消
                            </button>
                        </div>
                        <div class="relative">
                            <textarea
                                id="governance-feedback"
                                bind:value={feedbackText}
                                rows="3"
                                class="w-full resize-none rounded-xl border border-slate-200/80 bg-white p-3 pr-12 text-xs focus:outline-none focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                placeholder="例如：在算账前先让找路的给出两套创新突破假设，然后再由兜底的进行风控核验..."
                                onkeydown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleIterate();
                                    }
                                }}
                            ></textarea>
                            <button
                                class="absolute bottom-2.5 right-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white p-2 transition disabled:opacity-40 cursor-pointer"
                                onclick={handleIterate}
                                disabled={!feedbackText.trim() || isSubmitting}
                                aria-label="提交调整"
                            >
                                {#if isSubmitting}
                                    <RefreshCw size={14} class="animate-spin" />
                                {:else}
                                    <ChevronRight size={14} />
                                {/if}
                            </button>
                        </div>
                        <p class="text-[11px] text-slate-400">
                            按 Enter 键快速提交，协调中枢将根据您的反馈即时重构工序。
                        </p>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}
