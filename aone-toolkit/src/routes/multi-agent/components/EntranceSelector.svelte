<script lang="ts">
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { scenarioPresets, type Scenario } from "$lib/scenarios/presets";
    import { goto } from "$app/navigation";
    import { fade, fly, scale } from "svelte/transition";
    import {
        Bot,
        Search,
        GitCompare,
        Compass,
        ShieldAlert,
        CheckSquare,
        ArrowRight,
        MessageCircle,
        Briefcase,
        Scale,
        Lightbulb,
        Rocket,
        Users,
        GripHorizontal
    } from "lucide-svelte";
    import type { ComponentType } from "svelte";

    // 场景包数据
    let scenarios = $state(scenarioPresets);
    let selectedScenario = $state<Scenario | null>(null);
    let showScenarios = $state(false);

    // 5 种思维需求入口（对应 5 个 Agent）
    const mindNeeds = [
        {
            id: "chaos",
            label: "理不清",
            sublabel: "脑子里一团乱",
            description: "问题太多说不清，想来分析分析",
            agentId: "decomposer",
            icon: Search,
            color: "from-orange-500 to-red-500",
            bgColor: "bg-orange-50 dark:bg-orange-900/20",
            borderColor: "border-orange-200 dark:border-orange-800",
            hoverColor: "hover:border-orange-400 dark:hover:border-orange-600",
            shadowColor: "shadow-orange-500/10",
        },
        {
            id: "hesitate",
            label: "选不了",
            sublabel: "几个选项来回犹豫",
            description: "A好B好C也好，到底该选哪个",
            agentId: "calculator",
            icon: GitCompare,
            color: "from-teal-500 to-cyan-500",
            bgColor: "bg-teal-50 dark:bg-teal-900/20",
            borderColor: "border-teal-200 dark:border-teal-800",
            hoverColor: "hover:border-teal-400 dark:hover:border-teal-600",
            shadowColor: "shadow-teal-500/10",
        },
        {
            id: "stuck",
            label: "找不到路",
            sublabel: "觉得没有出路了",
            description: "感觉被困住了，想找找新可能",
            agentId: "pathfinder",
            icon: Compass,
            color: "from-amber-500 to-yellow-500",
            bgColor: "bg-amber-50 dark:bg-amber-900/20",
            borderColor: "border-amber-200 dark:border-amber-800",
            hoverColor: "hover:border-amber-400 dark:hover:border-amber-600",
            shadowColor: "shadow-amber-500/10",
        },
        {
            id: "fear",
            label: "不敢动",
            sublabel: "怕做错不敢决定",
            description: "担心这担心那，迟迟不敢行动",
            agentId: "stress_tester",
            icon: ShieldAlert,
            color: "from-violet-500 to-purple-500",
            bgColor: "bg-violet-50 dark:bg-violet-900/20",
            borderColor: "border-violet-200 dark:border-violet-800",
            hoverColor: "hover:border-violet-400 dark:hover:border-violet-600",
            shadowColor: "shadow-violet-500/10",
        },
        {
            id: "action",
            label: "想好了但没动",
            sublabel: "需要推一把",
            description: "知道该怎么做，但就是没行动",
            agentId: "closer",
            icon: CheckSquare,
            color: "from-green-500 to-emerald-500",
            bgColor: "bg-green-50 dark:bg-green-900/20",
            borderColor: "border-green-200 dark:border-green-800",
            hoverColor: "hover:border-green-400 dark:hover:border-green-600",
            shadowColor: "shadow-green-500/10",
        },
    ];

    let freeInput = $state("");
    let isAnimating = $state(false);

    // 选择思维需求
    function selectNeed(need: typeof mindNeeds[0]) {
        if (isAnimating) return;
        isAnimating = true;

        // 设置当前 Agent
        agentStore.currentSession.activeAgentIds = [need.agentId];
        
        // 获取 Agent 信息
        const agent = agentStore.getAgent(need.agentId);
        
        // 添加系统消息
        agentStore.addMessage("system", `【${agent?.name}】已就位。\n\n${agent?.description}\n\n${agent?.traits ? `能力标签: ${agent.traits.join(" · ")}` : ""}`);

        // 隐藏入口选择器（通过添加一条消息触发界面切换）
        // 不再使用跳转，让用户在当前页面开始对话
        
        isAnimating = false;
    }

    // 自由输入模式 - 系统自动匹配
    function handleFreeInput() {
        if (!freeInput.trim() || isAnimating) return;
        isAnimating = true;

        // 直接进入全流程模式，让系统自动判断
        agentStore.addMessage("system", "收到你的问题。系统将自动匹配最合适的思维模式来帮助你。");
        
        // 添加用户消息并启动流程
        agentStore.addMessage("user", freeInput);
        
        // 触发 MetaFlow
        agentStore.runMetaFlow(freeInput);
        
        freeInput = "";
        isAnimating = false;
    }

    // 回车提交
    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleFreeInput();
        }
    }

    // 圆桌会诊模式
    function startRoundTable() {
        if (isAnimating) return;
        isAnimating = true;

        // 激活所有 5 个 Agent
        agentStore.currentSession.activeAgentIds = [
            "decomposer",
            "calculator",
            "pathfinder",
            "stress_tester",
            "closer"
        ];

        agentStore.addMessage(
            "system",
            "【圆桌会诊模式】已启动。\n\n5 位思维专家将协同工作，从不同角度分析你的问题。"
        );

        isAnimating = false;
    }

    // 选择场景包
    function selectScenario(scenario: Scenario) {
        if (isAnimating) return;
        isAnimating = true;

        // 设置推荐的 Agent
        agentStore.currentSession.activeAgentIds = scenario.recommendedAgents;
        
        // 添加系统消息
        agentStore.addMessage("system", 
            `【${scenario.name}】场景已启动。\n\n${scenario.description}\n\n${scenario.entryPrompt}`
        );

        isAnimating = false;
    }

    // 获取场景包图标
    function getScenarioIcon(iconName: string): ComponentType {
        switch (iconName) {
            case '💼': return Briefcase;
            case '⚖️': return Scale;
            case '💡': return Lightbulb;
            case '🚀': return Rocket;
            case '🤝': return Users;
            default: return GripHorizontal;
        }
    }
</script>

<div
    class="absolute inset-0 z-10 flex flex-col items-center bg-white dark:bg-slate-950 overflow-y-auto"
    transition:fade={{ duration: 300 }}
>
    <div class="max-w-4xl w-full px-4 py-8 md:py-12" in:fly={{ y: 20, duration: 400, delay: 100 }}>
        <!-- Header -->
        <div class="text-center mb-10">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25 mb-4">
                <Bot class="w-8 h-8 text-white" />
            </div>
            <h1 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
                想清楚，然后去做
            </h1>
            <p class="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
                正面 · 积极 · 有效 <span class="mx-2">·</span> 
                每次对话，带走一个动作
            </p>
        </div>

        <!-- 5 种思维需求入口 -->
        <div class="mb-8">
            <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 text-center">
                你现在需要哪种思考方式？
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {#each mindNeeds as need}
                    {@const Icon = need.icon}
                    <button
                        onclick={() => selectNeed(need)}
                        class="group relative flex flex-col p-4 rounded-xl border-2 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1 {need.bgColor} {need.borderColor} {need.hoverColor}"
                        disabled={isAnimating}
                    >
                        <!-- 颜色条 -->
                        <div class="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r {need.color}"></div>
                        
                        <!-- 图标 -->
                        <div class="w-10 h-10 rounded-lg bg-gradient-to-br {need.color} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform">
                            <Icon class="w-5 h-5 text-white" />
                        </div>
                        
                        <!-- 标签 -->
                        <h3 class="font-bold text-slate-900 dark:text-white text-base mb-0.5">
                            {need.label}
                        </h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">
                            {need.sublabel}
                        </p>
                        
                        <!-- 描述 -->
                        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                            {need.description}
                        </p>

                        <!-- 悬停效果 -->
                        <div class="absolute inset-0 rounded-xl bg-white/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </button>
                {/each}
            </div>
        </div>

        <!-- 自由输入区域 -->
        <div class="mb-8">
            <div class="relative">
                <textarea
                    bind:value={freeInput}
                    onkeydown={handleKeydown}
                    placeholder="或者直接说说你的情况..."
                    rows="3"
                    class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none text-slate-900 dark:text-white placeholder:text-slate-400"
                ></textarea>
                <button
                    onclick={handleFreeInput}
                    disabled={!freeInput.trim() || isAnimating}
                    class="absolute right-2 bottom-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                >
                    <span>开始</span>
                    <ArrowRight class="w-4 h-4" />
                </button>
            </div>
        </div>

        <!-- 场景包入口 -->
        <div class="mb-8">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                    快捷场景
                </h2>
                <button 
                    onclick={() => showScenarios = !showScenarios}
                    class="text-xs text-indigo-600 hover:text-indigo-500"
                >
                    {showScenarios ? '收起' : '查看全部'}
                </button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {#each scenarios.slice(0, showScenarios ? scenarios.length : 4) as scenario}
                    {@const IconComponent = getScenarioIcon(scenario.icon)}
                    <button
                        onclick={() => selectScenario(scenario)}
                        class="group flex flex-col items-center p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-slate-800 hover:shadow-md transition-all"
                        disabled={isAnimating}
                    >
                        <div 
                            class="w-8 h-8 rounded-lg flex items-center justify-center mb-2 text-lg"
                            style="background: {scenario.color}20"
                        >
                            {scenario.icon}
                        </div>
                        <span class="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {scenario.name}
                        </span>
                    </button>
                {/each}
            </div>
        </div>

        <!-- 圆桌会诊入口 -->
        <div class="text-center">
            <button
                onclick={startRoundTable}
                class="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
                disabled={isAnimating}
            >
                <MessageCircle class="w-5 h-5" />
                <span>开启圆桌会诊</span>
                <span class="text-xs opacity-70 bg-white/20 px-2 py-0.5 rounded">5 位专家协同</span>
            </button>
        </div>

        <!-- 底部说明 -->
        <div class="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p class="text-xs text-slate-400">
                💡 我是认知决策工具，不是心理咨询师。帮你看清问题，不替你做决定。
            </p>
        </div>
    </div>
</div>
