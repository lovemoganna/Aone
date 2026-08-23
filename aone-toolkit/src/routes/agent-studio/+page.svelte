<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { fade, fly } from "svelte/transition";
    import { agentStore as registryStore, type Agent } from "$lib/agents";
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { settingsStore } from "$lib/stores/settingsStore.svelte";
    import { personaStore } from "$lib/persona";
    import { skillRegistry, type SkillDefinition } from "$lib/skills";
    import AgentAssembler from "$lib/components/agent-studio/AgentAssembler.svelte";
    import AgentLauncher from "$lib/components/agent-studio/AgentLauncher.svelte";
    import SettingsModal from "../multi-agent/components/SettingsModal.svelte";
    import AgentAvatar from "$lib/components/ui/AgentAvatar.svelte";
    import {
        ArrowRight,
        Bot,
        CheckCircle2,
        GitBranch,
        Plus,
        Rocket,
        Search,
        Sparkles,
        Users,
        Wrench,
        ShieldCheck,
        Sliders,
    } from "lucide-svelte";

    let searchQuery = $state("");
    let showAssembler = $state(false);
    let showSettings = $state(false);
    let assemblerMode = $state<"create" | "edit">("create");
    let editingAgentId = $state<string | undefined>(undefined);
    let showLauncher = $state(false);
    let launchTargetAgent = $state<Agent | null>(null);

    const agentAliases: Record<string, string> = {
        decomposer: "拆局者 (Decomposer)",
        calculator: "算账的 (Calculator)",
        pathfinder: "找路的 (Pathfinder)",
        stress_tester: "兜底的 (Stress Tester)",
        closer: "收网的 (Closer)",
        challenger: "辩驳官 (Challenger)",
        evidence_scout: "求证者 (Evidence Scout)",
        synthesizer: "裁判官 (Synthesizer)",
        builtin_mentor_agent: "智者导师 Agent",
        builtin_analyst_agent: "理性分析 Agent",
        builtin_coach_agent: "行动教练 Agent",
    };

    const agentDescriptions: Record<string, string> = {
        decomposer: "首席结构化拆解与架构专家，将复杂问题拆解为编号清单与清晰逻辑层级。",
        calculator: "量化精算与决策矩阵专家，评估隐性成本、ROI 与边际投入产出比。",
        pathfinder: "破局探索与敏捷假设验证专家，寻找非常规突破路径与低成本尝试。",
        stress_tester: "审慎风控与极限压力推演卫士，识别致命假设盲区并构筑止损防线。",
        closer: "敏捷交付与执行落地指挥官，将所有共识收敛为清晰责任人与动作清单。",
        challenger: "批判审查与证伪攻击专家，专击方案软肋、脆弱假设与群体盲思。",
        evidence_scout: "客观事实与行业基准核验专家，调取真实先例、失败率与数据锚点。",
        synthesizer: "跨小队冲突仲裁与终审综合大家，基于严密论据给出最高置信度决策令。",
        builtin_mentor_agent: "智者导师人格 + 逆向重构思维，启发复杂模糊决策下的本质方向。",
        builtin_analyst_agent: "理性分析专家人格 + 决策矩阵建模，以量化数据支撑方案选择。",
        builtin_coach_agent: "行动教练人格 + 落地清单生成，推动想法以最低阻力转化落地。",
    };

    let allPersonas = $derived(personaStore.allPersonas);
    let allSkills = $derived(skillRegistry.getAll());
    let allAgents = $derived(registryStore.getAll());

    let filteredAgents = $derived.by(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return allAgents;

        return allAgents.filter((item) => {
            const persona = getPersona(item);
            const skills = getSkills(item);
            return [
                displayAgentName(item),
                displayDescription(item),
                persona?.name,
                persona?.roleSetting,
                ...skills.map((skill) => skill.name),
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(q));
        });
    });

    function displayAgentName(agent: Agent) {
        return agentAliases[agent.id] || agent.name;
    }

    function displayDescription(agent: Agent) {
        return agentDescriptions[agent.id] || agent.description;
    }

    function getPersona(agent: Agent) {
        return personaStore.getPersonaById(agent.personaId);
    }

    function getSkills(agent: Agent): SkillDefinition[] {
        return agent.skillIds
            .map((id) => skillRegistry.getById(id))
            .filter((skill): skill is SkillDefinition => Boolean(skill));
    }

    function createCustomAgent() {
        assemblerMode = "create";
        editingAgentId = undefined;
        showAssembler = true;
    }

    function editAgent(agent: Agent) {
        assemblerMode = "edit";
        editingAgentId = agent.id;
        showAssembler = true;
    }

    function launchAgent(agent: Agent) {
        launchTargetAgent = agent;
        showLauncher = true;
    }

    function closeLauncher() {
        showLauncher = false;
        launchTargetAgent = null;
    }

    function confirmLaunch() {
        if (!launchTargetAgent) return;
        agentStore.currentSession.activeAgentIds = [launchTargetAgent.id];
        goto(`${base}/multi-agent?agentId=${encodeURIComponent(launchTargetAgent.id)}`);
        closeLauncher();
    }

    function onAssemblerSave(agent: Agent) {
        showAssembler = false;
        agentStore.syncFromRegistry();
        if (assemblerMode === "create") {
            launchAgent(agent);
        }
    }

    function onAssemblerCancel() {
        showAssembler = false;
    }
</script>

<svelte:head>
    <title>Agent 工作坊 (Agent Studio) - Aone</title>
</svelte:head>

<div class="space-y-6 max-w-7xl mx-auto" in:fade={{ duration: 180 }}>
    <!-- Clean, unboxed application header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
            <h1 class="text-xl font-bold text-slate-900 dark:text-white">Agent 工作坊</h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                基于 MECE 原则拆分能力边界。将人设语气（Persona）与认知技能（Skills）自由拼装与在线武装配置专属 Agent。
            </p>
        </div>
        <div class="flex items-center gap-2.5 shrink-0">
            <button
                type="button"
                onclick={() => (showSettings = true)}
                class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                title="调整全工作坊 AI 输出克制铁律"
            >
                <ShieldCheck class="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>克制铁律 ({settingsStore.enableOutputRestraint && settingsStore.restraintLevel !== 'off' ? settingsStore.restraintLevel : '已关闭'})</span>
            </button>
            <button
                onclick={createCustomAgent}
                class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 active:scale-95 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
                <Plus class="h-3.5 w-3.5" />
                新建自定义 Agent
            </button>
            <a
                href="{base}/multi-agent"
                class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
                进入工作台
                <ArrowRight class="h-3.5 w-3.5" />
            </a>
        </div>
    </div>

    <!-- Agent Roster Grid -->
    <section>
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="text-xs font-medium text-slate-500 dark:text-slate-400">
                已注册 Agent 矩阵 ({filteredAgents.length})
            </div>
            <div class="relative w-full sm:w-72">
                <Search class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                    bind:value={searchQuery}
                    aria-label="搜索 Agent、角色或技能"
                    class="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs outline-none transition focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    placeholder="搜索 Agent 名称、人设或技能..."
                />
            </div>
        </div>

        {#if filteredAgents.length === 0}
            <div class="rounded-xl border border-dashed border-slate-200 p-10 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                未找到匹配的 Agent。
            </div>
        {:else}
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {#each filteredAgents as item (item.id)}
                    {@const persona = getPersona(item)}
                    {@const skills = getSkills(item)}
                    <!-- Clean, single-surface card without nested sub-boxes -->
                    <article class="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 transition-all hover:border-slate-300 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/30 dark:hover:border-slate-700">
                        <div>
                            <div class="flex items-start gap-3">
                                <div class="w-10 h-10 shrink-0">
                                    <AgentAvatar agent={item.id || item.name} size="sm" shape="rounded" interactive={true} glow={false} />
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center gap-2">
                                        <h3 class="font-bold text-sm text-slate-900 dark:text-white truncate">{displayAgentName(item)}</h3>
                                        {#if item.isBuiltIn}
                                            <span class="rounded px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">内置</span>
                                        {/if}
                                    </div>
                                    <p class="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        {displayDescription(item)}
                                    </p>
                                </div>
                            </div>

                            <!-- Structured Clean Metadata: inline & uncluttered -->
                            <div class="mt-3.5 space-y-2 border-t border-slate-200/60 dark:border-slate-800/60 pt-3">
                                <div class="flex items-center justify-between text-xs">
                                    <span class="text-slate-400 text-[11px]">绑定人设</span>
                                    <span class="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                                        {persona?.name || "通用智能体"}
                                    </span>
                                </div>

                                <div class="text-xs">
                                    <div class="flex items-center justify-between mb-1 text-[11px] text-slate-400">
                                        <span>装备技能</span>
                                        <span>{skills.length} 项</span>
                                    </div>
                                    {#if skills.length > 0}
                                        <div class="flex flex-wrap gap-1">
                                            {#each skills.slice(0, 3) as skill}
                                                <span class="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/50 dark:border-teal-900/50">
                                                    {skill.name}
                                                </span>
                                            {/each}
                                            {#if skills.length > 3}
                                                <span class="text-[10px] text-slate-400 self-center">+{skills.length - 3}</span>
                                            {/if}
                                        </div>
                                    {:else}
                                        <span class="text-[10px] text-slate-400">未附加技能</span>
                                    {/if}
                                </div>
                            </div>
                        </div>

                        <!-- Card Footer -->
                        <div class="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                            <div class="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                <CheckCircle2 class="h-3 w-3 text-emerald-500" />
                                就绪
                            </div>
                            <div class="flex items-center gap-2">
                                <button
                                    onclick={() => editAgent(item)}
                                    aria-label={`编辑 ${displayAgentName(item)} 配置`}
                                    class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 active:scale-95 cursor-pointer dark:border-slate-750 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-2xs"
                                >
                                    <Wrench class="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                    编辑
                                </button>
                                <button
                                    onclick={() => launchAgent(item)}
                                    aria-label={`启动 ${displayAgentName(item)}`}
                                    class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 shadow-xs"
                                >
                                    <Rocket class="h-3.5 w-3.5" />
                                    启动
                                </button>
                            </div>
                        </div>
                    </article>
                {/each}
            </div>
        {/if}
    </section>
</div>

{#if showAssembler}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md"
        onclick={() => (showAssembler = false)}
        transition:fade={{ duration: 160 }}
    >
        <div
            onclick={(event) => event.stopPropagation()}
            onkeydown={(event) => {
                if (event.key === "Escape") showAssembler = false;
                event.stopPropagation();
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Agent 拼装与武装配置"
            tabindex="-1"
            transition:fly={{ y: 18, duration: 220 }}
        >
            <AgentAssembler
                mode={assemblerMode}
                agentId={editingAgentId}
                onSave={onAssemblerSave}
                onCancel={onAssemblerCancel}
            />
        </div>
    </div>
{/if}

{#if showLauncher && launchTargetAgent}
    <AgentLauncher agent={launchTargetAgent} onClose={closeLauncher} onLaunch={confirmLaunch} />
{/if}

<SettingsModal bind:open={showSettings} />
