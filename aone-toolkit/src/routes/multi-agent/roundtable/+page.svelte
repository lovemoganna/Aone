<script lang="ts">
    import { Panel, Button } from "$lib/components/ui";
    import { settingsStore } from "$lib/stores/settingsStore.svelte";
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { goto } from "$app/navigation";
    import { fade, fly } from "svelte/transition";
    import { 
        MessageCircle, 
        Users, 
        ArrowLeft,
        Send,
        Bot,
        X,
        ChevronRight,
        RefreshCw,
        Play,
        Pause,
        RotateCcw
    } from "lucide-svelte";
    
    // 圆桌布局配置
    const agentPositions = [
        { id: 'calculator', angle: 0, radius: 120 },
        { id: 'stress_tester', angle: 72, radius: 120 },
        { id: 'pathfinder', angle: 144, radius: 120 },
        { id: 'decomposer', angle: 216, radius: 120 },
        { id: 'closer', angle: 288, radius: 120 }
    ];
    
    // 活跃的Agent
    let activeAgents = $state<string[]>(['decomposer', 'calculator', 'pathfinder', 'stress_tester', 'closer']);
    
    // 用户输入
    let userInput = $state('');
    
    // 圆桌是否在进行中
    let isRoundtableActive = $state(false);
    
    // 讨论记录
    let discussions = $state<{agentId: string; content: string; timestamp: number}[]>([]);
    
    // 当前发言的Agent
    let speakingAgent = $state<string | null>(null);
    
    // 获取Agent信息
    function getAgentInfo(id: string) {
        return agentStore.getAgent(id);
    }
    
    // 计算Agent位置
    function getPosition(angle: number, radius: number) {
        const rad = (angle - 90) * (Math.PI / 180);
        return {
            x: Math.cos(rad) * radius,
            y: Math.sin(rad) * radius
        };
    }
    
    // 开始圆桌讨论
    function startRoundtable() {
        if (!userInput.trim()) return;
        
        isRoundtableActive = true;
        
        // 添加用户问题作为起始
        discussions = [{
            agentId: 'user',
            content: userInput,
            timestamp: Date.now()
        }];
        
        // 触发第一轮讨论
        runDiscussionRound();
    }
    
    // 运行讨论轮次
    async function runDiscussionRound() {
        for (const agentId of activeAgents) {
            speakingAgent = agentId;
            
            // 模拟Agent思考和发言
            await new Promise(r => setTimeout(r, 1500));
            
            const agent = getAgentInfo(agentId);
            
            // 生成回应
            const response = await generateAgentResponse(agentId, userInput);
            
            discussions = [...discussions, {
                agentId,
                content: response,
                timestamp: Date.now()
            }];
            
            speakingAgent = null;
        }
        
        // 询问用户是否继续
    }
    
    // 生成Agent回应（模拟）
    async function generateAgentResponse(agentId: string, question: string): Promise<string> {
        const agent = getAgentInfo(agentId);
        
        // 这里应该调用实际的AI服务
        // 暂时返回模拟响应
        const responses: Record<string, string> = {
            decomposer: `【拆局者视角】\n\n我先帮你把这个问题拆解一下：\n\n这个问题至少包含3个层面：\n① 核心问题是什么\n② 涉及的变量有哪些\n③ 你的可控范围\n\n让我逐一分析...`,
            calculator: `【算账的视角】\n\n从量化角度看，这个选择涉及：\n\n• 机会成本\n• 时间投入\n• 潜在收益\n• 风险因素\n\n让我帮你算清楚...`,
            pathfinder: `【找路的视角】\n\n也许你可以考虑第三条路：\n\n不仅仅是非A即B，还有C、D的选择。\n\n比如...`,
            stress_tester: `【兜底的视角】\n\n我们来推演一下最坏的情况：\n\n即使失败了，你还有：\n• 现有技能\n• • 可迁移经验\n• 退路选择\n\n最坏情况下的损失是可以承受的。`,
            closer: `【收网的视角】\n\n综合以上分析，你需要做的是：\n\n1. 今天：完成第一步（具体动作）\n2. 这周：跟进3个关键步骤\n3. 这月：达成核心目标\n\n准备好了就行动！`
        };
        
        return responses[agentId] || '（正在思考...）';
    }
    
    // 继续讨论
    function continueDiscussion() {
        runDiscussionRound();
    }
    
    // 重置圆桌
    function resetRoundtable() {
        discussions = [];
        userInput = '';
        isRoundtableActive = false;
        speakingAgent = null;
    }
    
    // 返回
    function goBack() {
        goto('/multi-agent');
    }
    
    // 获取Agent颜色
    function getAgentColor(agentId: string): string {
        const colors: Record<string, string> = {
            decomposer: '#FF6B35',
            calculator: '#2EC4B6',
            pathfinder: '#E8C547',
            stress_tester: '#7B68EE',
            closer: '#20BF55'
        };
        return colors[agentId] || '#6366F1';
    }
</script>

<svelte:head>
    <title>圆桌会诊 - 认知决策工具</title>
</svelte:head>

<div class="h-[calc(100vh-3rem)] flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div class="flex items-center gap-4">
            <button 
                onclick={goBack}
                class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
                <ArrowLeft class="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <MessageCircle class="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 class="text-lg font-bold text-slate-900 dark:text-white">
                        圆桌会诊
                    </h1>
                    <p class="text-xs text-slate-500">
                        5位思维专家协同讨论
                    </p>
                </div>
            </div>
        </div>
        
        <div class="flex items-center gap-2">
            {#if isRoundtableActive}
                <button 
                    onclick={resetRoundtable}
                    class="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                    <RotateCcw class="w-4 h-4" />
                    重新开始
                </button>
            {/if}
        </div>
    </div>
    
    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
        <!-- Left: Round Table Visualization -->
        <div class="w-1/2 flex items-center justify-center bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 relative overflow-hidden">
            <!-- 圆形桌 -->
            <div class="relative w-80 h-80">
                <!-- 桌面 -->
                <div class="absolute inset-0 rounded-full border-4 border-dashed border-slate-300 dark:border-slate-600 opacity-50"></div>
                <div class="absolute inset-8 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur"></div>
                
                <!-- 中心问题 -->
                <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div class="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                        <Bot class="w-10 h-10 text-white" />
                    </div>
                </div>
                
                <!-- Agent 位置 -->
                {#each agentPositions as pos}
                    {@const agent = getAgentInfo(pos.id)}
                    {@const posXY = getPosition(pos.angle, pos.radius)}
                    {@const isSpeaking = speakingAgent === pos.id}
                    <div 
                        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
                        style="transform: translate(calc(-50% + {posXY.x}px), calc(-50% + {posXY.y}px))"
                    >
                        <div 
                            class="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
                            {isSpeaking ? 'scale-125 shadow-xl' : 'hover:scale-110'}"
                            style="background: linear-gradient(135deg, {getAgentColor(pos.id)}, {getAgentColor(pos.id)}CC)"
                        >
                            <span class="text-2xl font-bold text-white">
                                {agent?.name?.[0] || '?'}
                            </span>
                        </div>
                        
                        <!-- Agent 名称 -->
                        <div class="absolute left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap">
                            <span class="text-xs font-medium" style="color: {getAgentColor(pos.id)}">
                                {agent?.name || pos.id}
                            </span>
                        </div>
                        
                        <!-- 说话指示器 -->
                        {#if isSpeaking}
                            <div class="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-lg animate-ping"></div>
                        {/if}
                    </div>
                {/each}
            </div>
            
            <!-- 图例 -->
            <div class="absolute bottom-6 left-6 flex flex-wrap gap-2">
                {#each agentPositions as pos}
                    {@const agent = getAgentInfo(pos.id)}
                    <div class="flex items-center gap-1.5 px-2 py-1 bg-white/80 dark:bg-slate-800/80 rounded-lg backdrop-blur">
                        <div class="w-2 h-2 rounded-full" style="background: {getAgentColor(pos.id)}"></div>
                        <span class="text-xs text-slate-600 dark:text-slate-400">{agent?.name}</span>
                    </div>
                {/each}
            </div>
        </div>
        
        <!-- Right: Discussion Panel -->
        <div class="w-1/2 flex flex-col border-l border-slate-200 dark:border bg-white dark:bg-slate-800-slate-900">
            <!-- 讨论记录 -->
            <div class="flex-1 overflow-y-auto p-4 space-y-4">
                {#if discussions.length === 0}
                    <!-- 欢迎界面 -->
                    <div class="h-full flex flex-col items-center justify-center text-center p-8">
                        <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center mb-6">
                            <Users class="w-10 h-10 text-violet-500" />
                        </div>
                        <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            圆桌会诊
                        </h2>
                        <p class="text-slate-500 dark:text-slate-400 mb-8 max-w-xs">
                            5位思维专家从不同角度分析你的问题，给你全方位的决策支持
                        </p>
                        
                        <!-- 问题输入 -->
                        <div class="w-full max-w-md">
                            <textarea
                                bind:value={userInput}
                                placeholder="描述你的问题或困惑..."
                                rows="4"
                                class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none resize-none text-slate-900 dark:text-white placeholder:text-slate-400"
                            ></textarea>
                            
                            <button 
                                onclick={startRoundtable}
                                disabled={!userInput.trim()}
                                class="w-full mt-4 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl font-medium transition-all hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
                            >
                                <Play class="w-5 h-5" />
                                开始圆桌讨论
                            </button>
                        </div>
                    </div>
                {:else}
                    <!-- 讨论记录 -->
                    {#each discussions as item}
                        {@const agent = item.agentId === 'user' ? null : getAgentInfo(item.agentId)}
                        <div 
                            class="flex gap-3"
                            transition:fly={{ y: 20, duration: 300 }}
                        >
                            {#if agent}
                                <div 
                                    class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style="background: linear-gradient(135deg, {getAgentColor(item.agentId)}, {getAgentColor(item.agentId)}CC)"
                                >
                                    <span class="text-lg font-bold text-white">
                                        {agent.name[0]}
                                    </span>
                                </div>
                            {:else}
                                <div class="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                    <span class="text-lg">👤</span>
                                </div>
                            {/if}
                            
                            <div class="flex-1">
                                {#if agent}
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="font-medium" style="color: {getAgentColor(item.agentId)}">
                                            {agent.name}
                                        </span>
                                        <span class="text-xs text-slate-400">
                                            {agent.role}
                                        </span>
                                    </div>
                                {/if}
                                
                                <div class="p-3 rounded-xl {agent ? 'bg-slate-50 dark:bg-slate-800' : 'bg-violet-50 dark:bg-violet-900/20'}">
                                    <p class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                        {item.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    {/each}
                    
                    <!-- 正在思考指示 -->
                    {#if speakingAgent}
                        <div class="flex gap-3">
                            <div 
                                class="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse"
                                style="background: linear-gradient(135deg, {getAgentColor(speakingAgent)}, {getAgentColor(speakingAgent)}CC)"
                            >
                                <span class="text-lg font-bold text-white">
                                    {getAgentInfo(speakingAgent)?.name[0]}
                                </span>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="flex gap-1">
                                    <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                                    <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                                    <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                                </div>
                                <span class="text-sm text-slate-500">
                                    {getAgentInfo(speakingAgent)?.name} 正在发言...
                                </span>
                            </div>
                        </div>
                    {/if}
                {/if}
            </div>
            
            <!-- 底部操作 -->
            {#if discussions.length > 0 && !speakingAgent}
                <div class="p-4 border-t border-slate-200 dark:border-slate-800">
                    <div class="flex gap-3">
                        <button 
                            onclick={continueDiscussion}
                            class="flex-1 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all hover:shadow-lg flex items-center justify-center gap-2"
                        >
                            <RefreshCw class="w-5 h-5" />
                            继续讨论
                        </button>
                        
                        <button 
                            onclick={() => {
                                // 跳转到收网的生成行动清单
                                goto('/multi-agent?agent=closer&context=' + encodeURIComponent(JSON.stringify(discussions)));
                            }}
                            class="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <ChevronRight class="w-5 h-5" />
                            收网出清单
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>
