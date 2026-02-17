<script lang="ts">
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { settingsStore } from "$lib/stores/settingsStore.svelte";
    import { SKILL_DEFINITIONS, type Skill } from "$lib/services/SkillService";
    import { Button, Input } from "$lib/components/ui";
    import MessageBubble from "./MessageBubble.svelte";
    import FeedbackControls from "./FeedbackControls.svelte";
    import PlanReview from "./PlanReview.svelte";
    import GovernanceCard from "./GovernanceCard.svelte";
    import ResumePanel from "./ResumePanel.svelte";
    import { Send, Loader2, Zap, Square, Sparkles, Wrench } from "lucide-svelte";
    import { tick } from "svelte";

    let input = $state("");
    let chatContainer = $state<HTMLElement>();
    let messages = $derived(
        agentStore.currentSession.messages.filter((m) => m.role !== "thought"),
    );
    let allMessages = $derived(agentStore.currentSession.messages);
    let latestThought = $derived(
        allMessages.filter((m) => m.role === "thought").slice(-1)[0],
    );
    let isThinking = $derived(agentStore.isThinking);

    // Auto-scroll
    $effect(() => {
        if (messages.length && chatContainer) {
            scrollToBottom();
        }
    });

    async function scrollToBottom() {
        await tick();
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    // 直接发送消息给当前选中的 Agent
    async function handleSend() {
        if (!input.trim() || isThinking || agentStore.metaFlowIsRunning) return;
        
        const text = input;
        input = "";
        
        // 添加用户消息
        agentStore.addMessage("user", text);
        
        // 启动思维流程
        await agentStore.runMetaFlow(text);
    }

    function handleCancel() {
        agentStore.cancelOperation();
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    let isActive = $derived(isThinking || agentStore.metaFlowIsRunning);
    
    // 获取当前Agent可用的技能
    let currentAgentSkills = $derived.by(() => {
        const activeIds = agentStore.currentSession.activeAgentIds;
        if (activeIds.length === 0) return [];
        
        // 根据当前Agent获取绑定的技能
        const agentId = activeIds[0];
        const skillMap: Record<string, string[]> = {
            decomposer: ['decompose'],
            calculator: ['decision_matrix', 'resource_audit'],
            pathfinder: ['reframe'],
            stress_tester: ['stress_test'],
            closer: ['action_list']
        };
        
        const agentSkills = skillMap[agentId] || [];
        return agentSkills.map(skillId => SKILL_DEFINITIONS[skillId]).filter(Boolean) as Skill[];
    });
    
    // 快速调用技能
    function callSkill(skillId: string) {
        const skill = SKILL_DEFINITIONS[skillId];
        if (!skill) return;
        
        // 将技能调用作为系统提示注入
        const skillPrompt = skill.inputPrompt("请开始执行");
        input += "\n\n" + skillPrompt;
    }
    
    // 技能颜色映射
    const skillColorMap: Record<string, string> = {
        decompose: '#3B82F6',
        decision_matrix: '#2EC4B6',
        stress_test: '#7B68EE',
        resource_audit: '#14B8A6',
        reframe: '#E8C547',
        action_list: '#20BF55'
    };
    
    function getSkillColor(skillId: string): string {
        return skillColorMap[skillId] || '#6B7280';
    }
</script>

<div class="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
    <!-- Messages Area -->
    <div
        bind:this={chatContainer}
        class="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
    >
        {#if messages.length === 0}
            <div
                class="h-full flex flex-col items-center justify-center text-slate-400 space-y-4"
            >
                <div
                    class="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25"
                >
                    <Sparkles class="w-8 h-8 text-white" />
                </div>
                <div class="text-center">
                    <h3 class="font-medium text-slate-900 dark:text-slate-100">
                        开始你的思考之旅
                    </h3>
                    <p class="text-sm mt-1">
                        描述你的问题，AI 将帮助你分析
                        {#if !settingsStore.isConfigured}
                            <br />
                            <span class="text-amber-500 text-xs">
                                ⚙️ 请在设置中配置 AI 提供商以获得真实回复
                            </span>
                        {/if}
                    </p>
                </div>
            </div>
        {:else}
            <!-- Messages Container -->
            <div
                class={agentStore.pipelineState.waitingForReview
                    ? "opacity-30 pointer-events-none grayscale transition-all duration-500 ease-out"
                    : "transition-all duration-500 ease-out"}
            >
                {#each messages as msg (msg.id)}
                    <MessageBubble message={msg} />
                {/each}
            </div>

            {#if isThinking && !messages.some((m) => m.isStreaming)}
                <div class="flex gap-4 p-4 animate-pulse">
                    <div
                        class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800"
                    ></div>
                    <div class="space-y-2 flex-1 max-w-sm">
                        <div
                            class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"
                        ></div>
                        <div
                            class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"
                        ></div>
                    </div>
                </div>
            {/if}

            {#if agentStore.pipelineState.waitingForReview && agentStore.pipelineState.governanceState}
                <div
                    class="px-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
                >
                    <GovernanceCard />
                </div>
            {:else if agentStore.pipelineState.waitingForReview && agentStore.pipelineState.taskPlan}
                <div
                    class="px-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
                >
                    <PlanReview plan={agentStore.pipelineState.taskPlan} />
                </div>
            {/if}

            <ResumePanel />

            {#if agentStore.metaFlowFinished}
                <FeedbackControls />
            {/if}
        {/if}
    </div>

    <!-- Process Indicator -->
    {#if agentStore.metaFlowIsRunning && latestThought}
        <div
            class="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/10 border-t border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center gap-3"
        >
            <div class="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
            <span
                class="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-md"
            >
                {latestThought.content
                    .split("\n")[0]
                    .replace(/\*\*/g, "")}
            </span>
        </div>
    {/if}

    <!-- Input Area -->
    <div
        class="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800"
    >
        <!-- 技能快捷调用按钮 -->
        {#if currentAgentSkills.length > 0 && !isActive}
            <div class="max-w-4xl mx-auto mb-3">
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs text-slate-400 flex items-center gap-1">
                        <Wrench class="w-3 h-3" />
                        快速调用:
                    </span>
                    {#each currentAgentSkills as skill}
                        <button
                            onclick={() => callSkill(skill.id)}
                            class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all hover:scale-105"
                            style="background: {getSkillColor(skill.id)}20; color: {getSkillColor(skill.id)}; border: 1px solid {getSkillColor(skill.id)}30"
                            title={skill.description}
                        >
                            <span>{skill.icon}</span>
                            {skill.name}
                        </button>
                    {/each}
                </div>
            </div>
        {/if}
        
        <div class="relative max-w-4xl mx-auto flex items-end gap-2">
            <div class="flex-1 relative">
                <textarea
                    bind:value={input}
                    onkeydown={handleKeydown}
                    placeholder="说说你的情况..."
                    class="w-full min-h-[50px] max-h-[200px] p-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none scrollbar-hide text-sm"
                    rows="1"
                    disabled={isActive}
                ></textarea>
            </div>

            {#if isActive}
                <!-- Cancel Button -->
                <Button
                    onclick={handleCancel}
                    variant="secondary"
                    size="md"
                    class="h-[50px] w-[50px] shrink-0 rounded-xl p-0 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    title="取消"
                >
                    <Square class="w-4 h-4 text-red-500 fill-red-500" />
                </Button>
            {:else}
                <Button
                    onclick={handleSend}
                    disabled={!input.trim()}
                    size="md"
                    class="h-[50px] w-[50px] shrink-0 rounded-xl p-0 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
                >
                    <Send class="w-5 h-5 text-white" />
                </Button>
            {/if}
        </div>
        
        <div class="text-xs text-center text-slate-400 mt-2">
            <strong>Enter</strong> 发送 · <strong>Shift + Enter</strong> 换行
            {#if settingsStore.isConfigured}
                · <span class="text-emerald-500">●</span>
                {settingsStore.currentProvider?.name}
            {:else}
                · <span class="text-amber-500">●</span> 模拟模式
            {/if}
        </div>
    </div>
</div>
