<script lang="ts">
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { AgentAvatar } from "$lib/components/ui";
    import {
        ArrowRight,
        Bot,
        Swords,
        CheckSquare,
        Compass,
        Search,
        ShieldAlert,
        Scale,
        Layers
    } from "lucide-svelte";
    import { COGNITIVE_AGENTS } from "$lib/constants/cognitiveAgents";

    let { 
        onSelectScenario = (prompt: string, mode: 'squad' | 'joint_warfare', autoSend?: boolean) => {},
        onSelectAgent = (agentId: string) => {},
        onSelectMode = (mode: 'squad' | 'joint_warfare') => {}
    } = $props<{
        onSelectScenario?: (prompt: string, mode: 'squad' | 'joint_warfare', autoSend?: boolean) => void;
        onSelectAgent?: (agentId: string) => void;
        onSelectMode?: (mode: 'squad' | 'joint_warfare') => void;
    }>();

    const quickStarts = Object.values(COGNITIVE_AGENTS).slice(0, 8).map(agent => ({
        id: agent.id,
        title: agent.alias,
        role: agent.roleTitle.split('与')[0],
        desc: agent.description,
    }));

    const presetScenarios: Array<{
        mode: 'squad' | 'joint_warfare';
        tag: string;
        title: string;
        desc: string;
        prompt: string;
    }> = [
        {
            mode: 'squad',
            tag: "系统架构",
            title: "单体系统微服务化演进方案评估",
            desc: "复杂度分拆、改造成本预估、潜在依赖风险评估与分步落地清单。",
            prompt: "我们团队的核心后端系统规模持续扩大，部署与维护成本上升。需要评估系统演进方案：是在现有单体基础上做物理模块隔离，还是进行微服务化改造？请从复杂度拆解、改造代价与隐性风险、分阶段迁移策略到落地执行工单输出完整技术方案。"
        },
        {
            mode: 'joint_warfare',
            tag: "技术选型",
            title: "技术路线辩驳：深度引入自主 Agent vs 审慎规则兜底",
            desc: "方案推进组与风控审查组并行推演、交叉质检、输出权衡分析与裁决结论。",
            prompt: "面对 AI 编码与自主 Agent 工具的引入，工程团队需要明确技术边界：一组主张在核心业务中深度开放 Agent 自动化流程，追求交付提效；另一组主张严格限制在测试与辅助环节，重点防范幻觉与安全合规风险。请两组展开对抗推演，明确分歧本质，并给出架构决策建议。"
        },
        {
            mode: 'squad',
            tag: "业务落地",
            title: "新功能 MVP 范围收敛与首期交付清单",
            desc: "梳理核心业务假设、评估可行性并制定首期可验收工单。",
            prompt: "我们要上线一套内部研发效能与工作流沉淀组件库，请协助进行方案梳理：梳理核心使用场景、剔除非关键依赖、收敛出首期 MVP 核心功能边界，并输出首周可落地的分工清单与验收标准。"
        }
    ];

    function handleModeClick(mode: 'squad' | 'joint_warfare') {
        agentStore.setMode(mode);
        onSelectMode(mode);
    }

    function handleScenarioClick(scenario: typeof presetScenarios[0], autoSend: boolean = false) {
        onSelectScenario(scenario.prompt, scenario.mode, autoSend);
    }

    function handleAgentClick(agentId: string) {
        const current = agentStore.currentSession.activeAgentIds;
        if (current.includes(agentId)) {
            if (current.length > 1) {
                agentStore.currentSession.activeAgentIds = current.filter(id => id !== agentId);
            }
        } else {
            agentStore.currentSession.activeAgentIds = [...current, agentId];
        }
        onSelectAgent(agentId);
    }
</script>

<div class="max-w-3xl mx-auto py-6 px-2 space-y-6">
    <!-- Header -->
    <div class="space-y-1">
        <h2 class="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            多 Agent 协同工作台
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400">
            在下方输入目标开始推演，或直接载入典型工程场景
        </p>
    </div>

    <!-- Preset Scenarios -->
    <div class="space-y-2.5">
        <div class="text-xs font-semibold text-slate-700 dark:text-slate-300">
            预设工程命题快速载入
        </div>
        <div class="space-y-2">
            {#each presetScenarios as scenario}
                <button
                    type="button"
                    onclick={() => handleScenarioClick(scenario, false)}
                    class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-center justify-between gap-3 hover:border-slate-400 dark:hover:border-slate-600 transition text-left cursor-pointer group"
                >
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold shrink-0">
                                {scenario.tag}
                            </span>
                            <span class="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-slate-800 dark:group-hover:text-slate-100">
                                {scenario.title}
                            </span>
                        </div>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                            {scenario.desc}
                        </p>
                    </div>

                    <div class="flex items-center gap-1 text-xs font-medium text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white shrink-0">
                        <span class="text-[11px]">载入</span>
                        <ArrowRight class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </button>
            {/each}
        </div>
    </div>

    <!-- Specialist Agents List -->
    <div class="space-y-2.5">
        <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span class="font-semibold">协作小队在岗成员 ({agentStore.currentSession.activeAgentIds.length})</span>
            <a href="/agent-studio" class="text-slate-500 hover:text-slate-900 dark:hover:text-white transition">
                前往 Agent 工作坊 ➔
            </a>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {#each quickStarts as item}
                {@const selected = agentStore.currentSession.activeAgentIds.includes(item.id)}
                <button
                    type="button"
                    onclick={() => handleAgentClick(item.id)}
                    class="p-2 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 {selected ? 'border-slate-400 dark:border-slate-600 bg-slate-100/70 dark:bg-slate-800' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'}"
                    title={selected ? "点击移出当前小队" : "点击加入当前小队"}
                >
                    <AgentAvatar agent={item.id} size="sm" shape="rounded" interactive={false} />
                    <div class="min-w-0 flex-1">
                        <div class="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center justify-between">
                            <span>{item.title}</span>
                            {#if selected}
                                <span class="text-[9px] font-mono text-slate-900 dark:text-slate-100 font-bold">✓</span>
                            {/if}
                        </div>
                        <div class="text-[10px] text-slate-400 truncate">{item.role}</div>
                    </div>
                </button>
            {/each}
        </div>
    </div>
</div>
