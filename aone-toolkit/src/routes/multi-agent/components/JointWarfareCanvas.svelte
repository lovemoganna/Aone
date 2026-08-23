<script lang="ts">
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import AgentAvatar from "$lib/components/ui/AgentAvatar.svelte";
    import RichMessageContent from "./RichMessageContent.svelte";
    import ConvergenceMonitor from "./ConvergenceMonitor.svelte";
    import { 
        Swords, 
        ShieldAlert, 
        Compass, 
        Scale, 
        Search, 
        CheckCircle2, 
        AlertTriangle, 
        ArrowRight, 
        Play, 
        RefreshCw,
        Layers,
        GitCompare,
        FileCheck,
        Shield,
        Zap,
        Target,
        Copy,
        Check
    } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";
    import { warfareEngine } from "$lib/stores/warfareEngine.svelte";

    let selectedSquadAId = $state("squad_adversarial_blue");
    let selectedSquadBId = $state("squad_adversarial_red");
    let inputGoal = $state("");
    let interventionText = $state("");
    let interventionType = $state<'question' | 'correction' | 'constraint'>('constraint');
    let overtimeContext = $state("");
    let showOvertimeModal = $state(false);
    let copySuccess = $state(false);

    let squadA = $derived(
        agentStore.presetSquads.find(s => s.id === selectedSquadAId) || agentStore.presetSquads[3]
    );
    let squadB = $derived(
        agentStore.presetSquads.find(s => s.id === selectedSquadBId) || agentStore.presetSquads[4]
    );

    let warfareState = $derived(warfareEngine.state);
    let isRunning = $derived(
        warfareState.stage !== 'idle' && warfareState.stage !== 'completed'
    );

    const stages = [
        { key: 'parallel_analysis', label: '1. 并行建模', icon: Layers, desc: '双线独立建模' },
        { key: 'cross_review', label: '2. 交叉质检', icon: Swords, desc: '方案交叉校验' },
        { key: 'conflict_detection', label: '3. 权衡分析', icon: GitCompare, desc: '识别分歧与权衡点' },
        { key: 'evidence_grounding', label: '4. 事实基准', icon: Search, desc: '基准数据锚定' },
        { key: 'unified_arbitration', label: '5. 综合决议', icon: Scale, desc: '输出决策与实施清单' }
    ];

    function handleStart() {
        if (!inputGoal.trim() || selectedSquadAId === selectedSquadBId) return;
        agentStore.runJointWarfare(inputGoal.trim(), selectedSquadAId, selectedSquadBId);
    }

    function handleQuickExample(text: string) {
        inputGoal = text;
        agentStore.runJointWarfare(text, selectedSquadAId, selectedSquadBId);
    }

    function handleContinue() {
        warfareEngine.continueToNextStage();
    }

    function handleInjectIntervention() {
        if (!interventionText.trim()) return;
        warfareEngine.injectUserIntervention(interventionText.trim(), interventionType);
        interventionText = "";
    }

    function handleRequestOvertime() {
        warfareEngine.requestOvertime(overtimeContext.trim() || undefined);
        overtimeContext = "";
        showOvertimeModal = false;
    }

    function copyArbitrationMarkdown() {
        if (!warfareState.arbitrationResult) return;
        const res = warfareState.arbitrationResult;
        const md = `# 综合决议与落地实施方案\n\n**课题**：${warfareState.goal}\n**决策置信度**：${res.confidenceScore}%\n\n## 决策结论摘要\n${res.summary}\n\n## 落地实施清单\n${res.actionSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
        navigator.clipboard.writeText(md);
        copySuccess = true;
        setTimeout(() => (copySuccess = false), 2000);
    }
</script>

<div class="w-full flex flex-col gap-4 py-3 px-2 sm:px-4 max-w-6xl mx-auto">
    <!-- Top Clean Engineering Header -->
    <div class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-200 dark:border-slate-800">
            <div class="space-y-1">
                <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        双小队对抗
                    </span>
                    <h2 class="text-base font-bold text-slate-900 dark:text-white">
                        双小队对抗推演与决策仲裁
                    </h2>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                    针对重大架构分歧或高风险选型议题，调派方案推进组与风控审查组并行建模、交叉质检，最终收敛出落地决策。
                </p>
            </div>

            <div class="flex items-center gap-2 self-start md:self-auto shrink-0">
                {#if warfareState.stage === 'completed'}
                    <button
                        type="button"
                        onclick={() => agentStore.resetJointWarfare()}
                        class="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center gap-1.5"
                    >
                        <RefreshCw class="w-3.5 h-3.5" />
                        <span>重置推演</span>
                    </button>
                {/if}
            </div>
        </div>

        <!-- Stages Track -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3.5 text-xs font-mono">
            {#each stages as stg, idx}
                {@const isCurrent = warfareState.stage === stg.key}
                {@const isPassed = warfareState.progress >= (idx + 1) * 20}
                <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all {isCurrent 
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 font-bold shadow-xs' 
                    : isPassed 
                        ? 'bg-slate-100/80 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700' 
                        : 'text-slate-400 dark:text-slate-500 border-transparent'}">
                    <stg.icon class="w-3.5 h-3.5 shrink-0" />
                    <span class="truncate font-sans">{stg.label}</span>
                </div>
            {/each}
        </div>
    </div>

    <!-- Squad Formation & Goal Launcher (Idle State) -->
    {#if warfareState.stage === 'idle'}
        <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4" in:fade>
            <div class="text-xs font-bold text-slate-700 dark:text-slate-300">
                配置推演小组
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <!-- Squad A (Blue) -->
                <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            方案推进组 (Squad A)
                        </span>
                        <select
                            bind:value={selectedSquadAId}
                            class="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 outline-none"
                        >
                            {#each agentStore.presetSquads as sq}
                                <option value={sq.id}>{sq.name}</option>
                            {/each}
                        </select>
                    </div>
                    <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{squadA.description}</p>
                    <div class="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-750 text-xs text-slate-400">
                        <span>成员:</span>
                        <div class="flex items-center -space-x-1.5">
                            {#each squadA.memberIds as memId}
                                <div class="w-6 h-6 rounded-full border border-white dark:border-slate-800" title={memId}>
                                    <AgentAvatar agent={memId} size="xs" shape="circle" />
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>

                <!-- Squad B (Red) -->
                <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-rose-600 dark:text-rose-400">
                            风控审查组 (Squad B)
                        </span>
                        <select
                            bind:value={selectedSquadBId}
                            class="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 outline-none"
                        >
                            {#each agentStore.presetSquads as sq}
                                <option value={sq.id}>{sq.name}</option>
                            {/each}
                        </select>
                    </div>
                    <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{squadB.description}</p>
                    <div class="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-750 text-xs text-slate-400">
                        <span>成员:</span>
                        <div class="flex items-center -space-x-1.5">
                            {#each squadB.memberIds as memId}
                                <div class="w-6 h-6 rounded-full border border-white dark:border-slate-800" title={memId}>
                                    <AgentAvatar agent={memId} size="xs" shape="circle" />
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>

            {#if selectedSquadAId === selectedSquadBId}
                <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-700 dark:text-amber-300">
                    <AlertTriangle class="w-3.5 h-3.5 shrink-0" />
                    <span>双方不能选择同一小队，请为对立面指派不同小队。</span>
                </div>
            {/if}

            <!-- Task Input -->
            <div class="space-y-2 pt-1">
                <label for="joint-warfare-input" class="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    输入核心议题或技术分歧：
                </label>
                <div class="flex gap-2">
                    <input
                        id="joint-warfare-input"
                        type="text"
                        bind:value={inputGoal}
                        onkeydown={(e) => e.key === 'Enter' && handleStart()}
                        placeholder="输入需要两队深度对抗辩驳的议题..."
                        class="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-400"
                    />
                    <button
                        type="button"
                        onclick={handleStart}
                        disabled={!inputGoal.trim() || isRunning || selectedSquadAId === selectedSquadBId}
                        class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-xs font-bold rounded-xl disabled:opacity-40 transition cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                        <Play class="w-3.5 h-3.5 fill-current" />
                        <span>启动推演</span>
                    </button>
                </div>

                <!-- Examples -->
                <div class="flex items-center gap-1.5 pt-1 flex-wrap text-xs text-slate-500">
                    <span class="text-slate-400">预设课题:</span>
                    <button
                        type="button"
                        onclick={() => handleQuickExample("面对激烈竞争，我们应该激进打价格战抢占市场，还是坚守高客单价提高壁垒？")}
                        class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    >
                        价格战 vs 高客单壁垒
                    </button>
                    <button
                        type="button"
                        onclick={() => handleQuickExample("初创团队是将有限资源押注在一个明星爆款，还是广撒网并行小实验？")}
                        class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    >
                        单点聚焦 vs 多线试错
                    </button>
                    <button
                        type="button"
                        onclick={() => handleQuickExample("核心技术架构是直接采用全托管云原生方案，还是坚持自研私有化部署？")}
                        class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    >
                        全托管云 vs 自研私有化
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Live Confrontation Panel -->
    {#if warfareState.stage !== 'idle'}
        <div class="flex flex-col gap-4" in:fade>
            <ConvergenceMonitor />

            {#if warfareState.error}
                <div class="rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-2 min-w-0">
                        <AlertTriangle class="h-4 w-4 text-rose-500 shrink-0" />
                        <span class="truncate">推演异常：{warfareState.error}</span>
                    </div>
                    <button
                        type="button"
                        onclick={() => warfareEngine.retryCurrentStage()}
                        class="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-medium transition cursor-pointer shrink-0"
                    >
                        重试当前阶段
                    </button>
                </div>
            {/if}

            <!-- Current Goal Banner -->
            <div class="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div class="flex items-center gap-2 min-w-0">
                    <span class="font-bold text-slate-500 dark:text-slate-400 shrink-0">课题:</span>
                    <span class="font-semibold text-slate-900 dark:text-white truncate">{warfareState.goal}</span>
                </div>
                {#if isRunning}
                    <div class="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium shrink-0">
                        <RefreshCw class="w-3.5 h-3.5 animate-spin" />
                        <span>推演中 ({warfareState.progress}%)</span>
                    </div>
                {:else}
                    <div class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                        <CheckCircle2 class="w-3.5 h-3.5" />
                        <span>推演完成</span>
                    </div>
                {/if}
            </div>

            <!-- Interventions Bar -->
            {#if warfareState.awaitingUserInput}
                <div class="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 p-3.5 space-y-2.5 animate-in fade-in" in:slide>
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span>阶段暂停中 · 支持插入修正指令</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button
                                type="button"
                                onclick={handleContinue}
                                class="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition cursor-pointer"
                            >
                                推进至下一阶段 ➔
                            </button>
                            <button
                                type="button"
                                onclick={() => (showOvertimeModal = !showOvertimeModal)}
                                class="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                            >
                                申请加时
                            </button>
                        </div>
                    </div>

                    <div class="flex gap-2">
                        <select
                            bind:value={interventionType}
                            class="px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200"
                        >
                            <option value="constraint">强制约束 (Constraint)</option>
                            <option value="correction">事实纠偏 (Correction)</option>
                            <option value="question">定向质询 (Question)</option>
                        </select>
                        <input
                            type="text"
                            bind:value={interventionText}
                            onkeydown={(e) => e.key === 'Enter' && handleInjectIntervention()}
                            placeholder="输入补充约束、边界条件或修正意见..."
                            class="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400"
                        />
                        <button
                            type="button"
                            onclick={handleInjectIntervention}
                            disabled={!interventionText.trim()}
                            class="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 disabled:opacity-40 transition cursor-pointer"
                        >
                            插入
                        </button>
                    </div>

                    {#if showOvertimeModal}
                        <div class="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2" transition:slide>
                            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">加时赛压力条件：</span>
                            <div class="flex gap-2">
                                <input
                                    type="text"
                                    bind:value={overtimeContext}
                                    placeholder="例如：预算减半且交付期缩短至3天，两队如何调整？"
                                    class="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400"
                                />
                                <button
                                    type="button"
                                    onclick={handleRequestOvertime}
                                    class="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 transition cursor-pointer"
                                >
                                    开启加时
                                </button>
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}

            <!-- Dual Columns: Squad A vs Squad B -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <!-- Squad A (Blue) -->
                <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
                    <div class="border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                            <h3 class="font-bold text-xs text-slate-900 dark:text-white">{warfareState.squadA.name}</h3>
                        </div>
                        <div class="flex items-center -space-x-1.5">
                            {#each warfareState.squadA.memberIds as memId}
                                <div class="w-5 h-5 rounded-full border border-white dark:border-slate-800">
                                    <AgentAvatar agent={memId} size="xs" shape="circle" />
                                </div>
                            {/each}
                        </div>
                    </div>

                    <div class="p-4 flex-1 flex flex-col gap-3 text-xs">
                        <div class="font-semibold text-slate-500 dark:text-slate-400">
                            方案主张与突破路线：
                        </div>
                        {#if warfareState.squadA.output}
                            <div class="rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 overflow-hidden">
                                <div class="p-3.5 max-h-[400px] overflow-y-auto text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                                    <RichMessageContent content={warfareState.squadA.output} />
                                </div>
                            </div>
                        {:else}
                            <div class="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
                                <RefreshCw class="w-4 h-4 animate-spin" />
                                正在生成突破方案...
                            </div>
                        {/if}

                        {#if warfareState.crossReview.critiqueAonB}
                            <div class="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-1">
                                <span class="font-bold text-amber-700 dark:text-amber-300 block">
                                    对风控组的反驳：
                                </span>
                                <p class="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {warfareState.crossReview.critiqueAonB}
                                </p>
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Squad B (Red) -->
                <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
                    <div class="border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                            <h3 class="font-bold text-xs text-slate-900 dark:text-white">{warfareState.squadB.name}</h3>
                        </div>
                        <div class="flex items-center -space-x-1.5">
                            {#each warfareState.squadB.memberIds as memId}
                                <div class="w-5 h-5 rounded-full border border-white dark:border-slate-800">
                                    <AgentAvatar agent={memId} size="xs" shape="circle" />
                                </div>
                            {/each}
                        </div>
                    </div>

                    <div class="p-4 flex-1 flex flex-col gap-3 text-xs">
                        <div class="font-semibold text-slate-500 dark:text-slate-400">
                            风控审查与边界质检：
                        </div>
                        {#if warfareState.squadB.output}
                            <div class="rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 overflow-hidden">
                                <div class="p-3.5 max-h-[400px] overflow-y-auto text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                                    <RichMessageContent content={warfareState.squadB.output} />
                                </div>
                            </div>
                        {:else}
                            <div class="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
                                <RefreshCw class="w-4 h-4 animate-spin" />
                                正在进行风控审查...
                            </div>
                        {/if}

                        {#if warfareState.crossReview.critiqueBonA}
                            <div class="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-1">
                                <span class="font-bold text-rose-700 dark:text-rose-300 block">
                                    对方案路线的质询：
                                </span>
                                <p class="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {warfareState.crossReview.critiqueBonA}
                                </p>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Conflicts & Evidence -->
            {#if warfareState.conflicts.length > 0 || warfareState.evidence.length > 0}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4" in:fade>
                    <!-- Conflicts -->
                    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                        <div class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <GitCompare class="w-3.5 h-3.5 text-amber-500" />
                            <span>核心分歧与权衡点</span>
                        </div>
                        <div class="space-y-2.5">
                            {#each warfareState.conflicts as conf}
                                <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-xs space-y-1.5">
                                    <div class="font-bold text-slate-900 dark:text-white">{conf.topic}</div>
                                    <div class="grid grid-cols-2 gap-2 text-[11px]">
                                        <div class="p-2 rounded bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200">
                                            <span class="font-bold block text-indigo-600 dark:text-indigo-400">方案方:</span>
                                            {conf.sideAView}
                                        </div>
                                        <div class="p-2 rounded bg-rose-50/60 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200">
                                            <span class="font-bold block text-rose-600 dark:text-rose-400">风控方:</span>
                                            {conf.sideBView}
                                        </div>
                                    </div>
                                    <div class="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                                        权衡本质：{conf.tradeOff}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>

                    <!-- Evidence -->
                    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                        <div class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Search class="w-3.5 h-3.5 text-indigo-500" />
                            <span>客观证据与基准锚点</span>
                        </div>
                        <div class="space-y-2.5">
                            {#each warfareState.evidence as evi}
                                <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-xs space-y-1">
                                    <div class="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                                        <span>{evi.source}</span>
                                        <span class="text-[10px] text-slate-400">基准</span>
                                    </div>
                                    <p class="text-slate-700 dark:text-slate-300">{evi.fact}</p>
                                    <div class="text-[11px] text-indigo-600 dark:text-indigo-400">
                                        决策影响：{evi.impact}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Final Verdict -->
            {#if warfareState.arbitrationResult}
                <div class="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4" in:fade>
                    <div class="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center">
                                <Scale class="w-4 h-4" />
                            </div>
                            <div>
                                <h3 class="text-sm font-bold text-slate-900 dark:text-white">
                                    综合决议与落地实施方案
                                </h3>
                                <span class="text-xs text-slate-400">综合两队论据与客观实证后的最终决策结论</span>
                            </div>
                        </div>

                        <div class="flex items-center gap-3">
                            <div class="text-right text-xs">
                                <span class="text-slate-400">决策置信度</span>
                                <span class="font-bold text-slate-900 dark:text-white ml-1">{warfareState.arbitrationResult.confidenceScore}%</span>
                            </div>
                            <button
                                type="button"
                                onclick={copyArbitrationMarkdown}
                                class="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
                            >
                                {#if copySuccess}
                                    <Check class="w-3.5 h-3.5 text-emerald-500" />
                                    <span class="text-emerald-500">已复制</span>
                                {:else}
                                    <Copy class="w-3.5 h-3.5 text-slate-400" />
                                    <span>复制 Markdown</span>
                                {/if}
                            </button>
                        </div>
                    </div>

                    <!-- Summary -->
                    <div class="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed p-4 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750">
                        {warfareState.arbitrationResult.summary}
                    </div>

                    <!-- Action Steps -->
                    {#if warfareState.arbitrationResult.actionSteps?.length}
                        <div class="space-y-2 pt-2">
                            <div class="text-xs font-bold text-slate-800 dark:text-slate-200">
                                落地实施动作清单：
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {#each warfareState.arbitrationResult.actionSteps as step, i}
                                    <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-xs flex items-start gap-2">
                                        <span class="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                                            {i + 1}
                                        </span>
                                        <span class="text-slate-700 dark:text-slate-300 leading-snug">{step}</span>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <div class="pt-2 flex justify-end">
                        <button
                            type="button"
                            onclick={() => agentStore.toggleDecisionConsole('dod_plan')}
                            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-xs font-semibold transition cursor-pointer"
                        >
                            <span>前往决策审计台查看工单</span>
                            <ArrowRight class="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>
