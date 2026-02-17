<script lang="ts">
    import { personaStore, type AbstractPersona } from '$lib/persona';
    import { skillRegistry, type SkillDefinition } from '$lib/skills';
    import { goto } from "$app/navigation";
    import { fade, fly } from "svelte/transition";
    import {
        Users,
        Puzzle,
        GitBranch,
        Sparkles,
        Search,
        Plus,
        Zap,
        Target,
        Layers,
        ArrowRight,
        ChevronRight,
        Bot,
        Star,
        Play,
        Settings,
        User,
        Wrench,
        Combine,
        Brain,
        Rocket,
        X,
        Check
    } from "lucide-svelte";

    // ============== 视图模式 ==============
    type ViewMode = 'unified' | 'personas' | 'skills' | 'orchestration';
    let currentView = $state<ViewMode>('unified');

    // 搜索
    let searchQuery = $state('');
    
    // 模态框状态
    let showOrchestrationModal = $state(false);
    let orchestrationName = $state('');
    let orchestrationDescription = $state('');
    let selectedPersonaId = $state('');
    let selectedSkillIds = $state<string[]>([]);

    // 获取数据
    let allPersonas = $derived(personaStore.allPersonas);
    let allSkills = $derived(skillRegistry.getAll());

    // 技能类型标签
    const skillTypeLabels: Record<string, { label: string; icon: string; color: string }> = {
        analysis: { label: '分析型', icon: '🔍', color: '#3B82F6' },
        quantitative: { label: '量化型', icon: '⚖️', color: '#8B5CF6' },
        evaluation: { label: '评估型', icon: '🎯', color: '#F59E0B' },
        exploration: { label: '探索型', icon: '🔄', color: '#10B981' },
        generation: { label: '生成型', icon: '✨', color: '#EC4899' }
    };

    // 编排配置（模拟存储）
    interface AgentConfig {
        id: string;
        name: string;
        description: string;
        personaId: string;
        skillIds: string[];
        createdAt: number;
        isBuiltIn: boolean;
    }

    // 预设的 Agent 配置（人格 + 技能的组合）
    let agentConfigs = $state<AgentConfig[]>([
        {
            id: 'mentor_agent',
            name: '智者导师 Agent',
            description: '智者导师人格 + 重构技能',
            personaId: 'mentor_sage',
            skillIds: ['reframe', 'decompose'],
            createdAt: Date.now(),
            isBuiltIn: true
        },
        {
            id: 'analyst_agent',
            name: '理性分析 Agent',
            description: '理性分析专家人格 + 决策矩阵',
            personaId: 'analytic_expert',
            skillIds: ['decision_matrix', 'resource_audit'],
            createdAt: Date.now(),
            isBuiltIn: true
        },
        {
            id: 'coach_agent',
            name: '行动教练 Agent',
            description: '行动教练人格 + 行动清单',
            personaId: 'action_coach',
            skillIds: ['action_list'],
            createdAt: Date.now(),
            isBuiltIn: true
        }
    ]);

    // 筛选逻辑
    let filteredPersonas = $derived.by(() => {
        let list = allPersonas;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(p => 
                p.name.toLowerCase().includes(q) ||
                p.roleSetting.toLowerCase().includes(q) ||
                p.personalityTags.some(t => t.toLowerCase().includes(q))
            );
        }
        return list;
    });

    let filteredSkills = $derived.by(() => {
        let list = allSkills;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(s => 
                s.name.toLowerCase().includes(q) ||
                s.oneLiner.toLowerCase().includes(q)
            );
        }
        return list;
    });

    let filteredAgents = $derived.by(() => {
        let list = agentConfigs;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(a => 
                a.name.toLowerCase().includes(q) ||
                a.description.toLowerCase().includes(q)
            );
        }
        return list;
    });

    // 获取人格绑定的技能
    function getPersonaSkills(persona: AbstractPersona): SkillDefinition[] {
        if (!persona.personalSkills) return [];
        return persona.personalSkills
            .map(sb => skillRegistry.getById(sb.skillId))
            .filter((s): s is SkillDefinition => !!s);
    }

    // 获取 Agent 配置关联的数据
    function getAgentPersona(agent: AgentConfig) {
        return personaStore.getPersonaById(agent.personaId);
    }

    function getAgentSkills(agent: AgentConfig): SkillDefinition[] {
        return agent.skillIds
            .map(id => skillRegistry.getById(id))
            .filter((s): s is SkillDefinition => !!s);
    }

    // 创建新的编排
    function createOrchestration() {
        if (!orchestrationName || !selectedPersonaId) return;
        
        const newAgent: AgentConfig = {
            id: `agent_${Date.now()}`,
            name: orchestrationName,
            description: orchestrationDescription || `${orchestrationName} = 人格 + ${selectedSkillIds.length}个技能`,
            personaId: selectedPersonaId,
            skillIds: selectedSkillIds,
            createdAt: Date.now(),
            isBuiltIn: false
        };
        
        agentConfigs = [...agentConfigs, newAgent];
        
        // 重置表单
        orchestrationName = '';
        orchestrationDescription = '';
        selectedPersonaId = '';
        selectedSkillIds = [];
        showOrchestrationModal = false;
    }

    // 启动 Agent
    function launchAgent(agent: AgentConfig) {
        const persona = getAgentPersona(agent);
        if (persona) {
            goto(`/agent-studio/personas?launch=${persona.id}`);
        }
    }

    // 启动人格
    function launchPersona(persona: AbstractPersona) {
        goto(`/agent-studio/personas?launch=${persona.id}`);
    }
</script>

<div class="min-h-[calc(100vh-12rem)]" in:fade={{ duration: 200 }}>
    <!-- ============== 顶部 Header ============== -->
    <div class="text-center mb-8">
        <h1 class="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            AI 拟人化 Agent 系统
        </h1>
        <p class="text-slate-500 dark:text-slate-400">
            人格 × 技能 = Agent | 多个 Agent = Squad
        </p>
    </div>

    <!-- ============== 全局搜索 ============== -->
    <div class="max-w-2xl mx-auto mb-8">
        <div class="relative">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
                type="text" 
                bind:value={searchQuery}
                placeholder="搜索人格、技能或 Agent..." 
                class="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm"
            />
        </div>
    </div>

    <!-- ============== 四大核心组件导航 ============== -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <!-- 组件一：人格 -->
        <button 
            onclick={() => currentView = 'personas'}
            class="group relative p-5 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-[1.02] {currentView === 'personas' ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}"
        >
            <div class="flex items-center gap-3 mb-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
                    <User class="w-6 h-6" />
                </div>
                <div>
                    <h3 class="font-bold text-slate-900 dark:text-white">人格</h3>
                    <p class="text-sm text-slate-500">独立身份属性</p>
                </div>
            </div>
            <div class="text-2xl font-bold text-violet-600 dark:text-violet-400">
                {allPersonas.length}
            </div>
            <p class="text-xs text-slate-400 mt-1">抽象人格 Identity</p>
        </button>

        <!-- 组件二：技能 -->
        <button 
            onclick={() => currentView = 'skills'}
            class="group relative p-5 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-[1.02] {currentView === 'skills' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}"
        >
            <div class="flex items-center gap-3 mb-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white">
                    <Wrench class="w-6 h-6" />
                </div>
                <div>
                    <h3 class="font-bold text-slate-900 dark:text-white">技能</h3>
                    <p class="text-sm text-slate-500">独立能力属性</p>
                </div>
            </div>
            <div class="text-2xl font-bold text-teal-600 dark:text-teal-400">
                {allSkills.length}
            </div>
            <p class="text-xs text-slate-400 mt-1">认知工具 Capability</p>
        </button>

        <!-- 组件三：编排 = 人格 × 技能 -->
        <button 
            onclick={() => currentView = 'orchestration'}
            class="group relative p-5 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-[1.02] {currentView === 'orchestration' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}"
        >
            <div class="flex items-center gap-3 mb-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white">
                    <Combine class="w-6 h-6" />
                </div>
                <div>
                    <h3 class="font-bold text-slate-900 dark:text-white">编排</h3>
                    <p class="text-sm text-slate-500">人格 × 技能</p>
                </div>
            </div>
            <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {agentConfigs.length}
            </div>
            <p class="text-xs text-slate-400 mt-1">Agent = Persona × Skill</p>
        </button>

        <!-- 组件四：统一视图 -->
        <button 
            onclick={() => currentView = 'unified'}
            class="group relative p-5 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-[1.02] {currentView === 'unified' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}"
        >
            <div class="flex items-center gap-3 mb-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white">
                    <Brain class="w-6 h-6" />
                </div>
                <div>
                    <h3 class="font-bold text-slate-900 dark:text-white">统一视图</h3>
                    <p class="text-sm text-slate-500">全局概览</p>
                </div>
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span>人格</span>
                <span>×</span>
                <span>技能</span>
                <span>=</span>
                <span>Agent</span>
            </div>
        </button>
    </div>

    <!-- ============== 内容区域 ============== -->
    
    <!-- 人格视图 -->
    {#if currentView === 'personas'}
        <section>
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <User class="w-5 h-5 text-violet-500" />
                    人格库
                </h2>
                <a href="/agent-studio/personas" class="text-sm text-violet-600 hover:text-violet-500">
                    管理人格 →
                </a>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {#each filteredPersonas as persona}
                    <button 
                        onclick={() => launchPersona(persona)}
                        class="group p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-300 hover:shadow-lg transition-all text-left"
                    >
                        <div class="flex items-center gap-3 mb-3">
                            <div 
                                class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                style="background: linear-gradient(135deg, {persona.visual.primaryColor}, {persona.visual.primaryColor}AA)"
                            >
                                {persona.name[0]}
                            </div>
                            <div class="flex-1 min-w-0">
                                <h4 class="font-semibold text-slate-900 dark:text-white truncate">{persona.name}</h4>
                                <p class="text-xs text-slate-500 truncate">{persona.roleSetting}</p>
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-1">
                            {#each persona.personalityTags.slice(0, 3) as tag}
                                <span class="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs rounded">
                                    {tag}
                                </span>
                            {/each}
                        </div>
                    </button>
                {/each}
            </div>
        </section>

    <!-- 技能视图 -->
    {:else if currentView === 'skills'}
        <section>
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Wrench class="w-5 h-5 text-teal-500" />
                    技能库
                </h2>
                <a href="/agent-studio/skills" class="text-sm text-teal-600 hover:text-teal-500">
                    管理技能 →
                </a>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each filteredSkills as skill}
                    <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-lg">{skillTypeLabels[skill.type]?.icon || '🔧'}</span>
                            <h4 class="font-semibold text-slate-900 dark:text-white">{skill.name}</h4>
                        </div>
                        <p class="text-sm text-slate-500">{skill.oneLiner}</p>
                    </div>
                {/each}
            </div>
        </section>

    <!-- 编排视图 = 人格 × 技能 -->
    {:else if currentView === 'orchestration'}
        <section>
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Combine class="w-5 h-5 text-amber-500" />
                    编排中心 (Agent = 人格 × 技能)
                </h2>
                <button 
                    onclick={() => showOrchestrationModal = true}
                    class="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-500 transition-colors flex items-center gap-2"
                >
                    <Plus class="w-4 h-4" />
                    新建编排
                </button>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each filteredAgents as agent}
                    {@const persona = getAgentPersona(agent)}
                    {@const skills = getAgentSkills(agent)}
                    <div class="group p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-300 hover:shadow-lg transition-all">
                        <!-- 头部 -->
                        <div class="flex items-start justify-between mb-3">
                            <div class="flex items-center gap-3">
                                <div 
                                    class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                    style="background: linear-gradient(135deg, {persona?.visual.primaryColor || '#8B5CF6'}, {persona?.visual.primaryColor || '#8B5CF6'}AA)"
                                >
                                    {agent.name[0]}
                                </div>
                                <div>
                                    <h4 class="font-bold text-slate-900 dark:text-white">{agent.name}</h4>
                                    <p class="text-xs text-slate-500">{agent.description}</p>
                                </div>
                            </div>
                            {#if agent.isBuiltIn}
                                <span class="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs rounded">预设</span>
                            {/if}
                        </div>
                        
                        <!-- 人格部分 -->
                        <div class="mb-3 p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                            <div class="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400 mb-1">
                                <User class="w-3 h-3" />
                                <span class="font-medium">人格</span>
                            </div>
                            <div class="text-sm text-slate-700 dark:text-slate-300">
                                {persona?.name || '未选择'}
                            </div>
                        </div>
                        
                        <!-- 技能部分 -->
                        <div class="mb-3 p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                            <div class="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 mb-1">
                                <Wrench class="w-3 h-3" />
                                <span class="font-medium">技能</span>
                            </div>
                            <div class="flex flex-wrap gap-1">
                                {#each skills as skill}
                                    <span class="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-xs rounded">
                                        {skill.name}
                                    </span>
                                {/each}
                                {#if skills.length === 0}
                                    <span class="text-xs text-slate-400">未选择</span>
                                {/if}
                            </div>
                        </div>
                        
                        <!-- 操作 -->
                        <button 
                            onclick={() => launchAgent(agent)}
                            class="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Rocket class="w-4 h-4" />
                            启动 Agent
                        </button>
                    </div>
                {/each}
            </div>
        </section>

    <!-- 统一视图 -->
    {:else}
        <div class="space-y-8">
            <!-- 架构说明 -->
            <div class="p-6 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border border-indigo-200 dark:border-indigo-800">
                <h3 class="text-lg font-bold text-indigo-900 dark:text-indigo-100 mb-3 flex items-center gap-2">
                    <Brain class="w-5 h-5" />
                    AI 拟人化架构
                </h3>
                <div class="flex flex-wrap items-center justify-center gap-4 text-lg">
                    <!-- 人格 -->
                    <div class="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow">
                        <User class="w-5 h-5 text-violet-500" />
                        <span class="font-medium">人格</span>
                        <span class="text-slate-400">×</span>
                    </div>
                    
                    <!-- 技能 -->
                    <div class="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow">
                        <Wrench class="w-5 h-5 text-teal-500" />
                        <span class="font-medium">技能</span>
                    </div>
                    
                    <span class="text-2xl text-slate-400">=</span>
                    
                    <!-- Agent -->
                    <div class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-teal-500 text-white rounded-xl shadow">
                        <Bot class="w-5 h-5" />
                        <span class="font-bold">Agent</span>
                    </div>
                    
                    <span class="text-2xl text-slate-400">→</span>
                    
                    <!-- Squad (未来) -->
                    <div class="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl">
                        <Layers class="w-5 h-5 text-slate-500" />
                        <span class="font-medium text-slate-500">Squad</span>
                    </div>
                </div>
            </div>

            <!-- 人格卡片 -->
            <section>
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <User class="w-5 h-5 text-violet-500" />
                        人格库 <span class="text-sm font-normal text-slate-400">（独立属性）</span>
                    </h2>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {#each allPersonas as persona}
                        <button 
                            onclick={() => launchPersona(persona)}
                            class="group p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-300 hover:shadow-md transition-all text-left"
                        >
                            <div class="flex items-center gap-2">
                                <div 
                                    class="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                                    style="background: linear-gradient(135deg, {persona.visual.primaryColor}, {persona.visual.primaryColor}AA)"
                                >
                                    {persona.name[0]}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h4 class="font-medium text-slate-900 dark:text-white text-sm truncate">{persona.name}</h4>
                                </div>
                            </div>
                        </button>
                    {/each}
                </div>
            </section>

            <!-- 技能卡片 -->
            <section>
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Wrench class="w-5 h-5 text-teal-500" />
                        技能库 <span class="text-sm font-normal text-slate-400">（独立属性）</span>
                    </h2>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {#each allSkills as skill}
                        <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-left">
                            <div class="flex items-center gap-2">
                                <span class="text-lg">{skillTypeLabels[skill.type]?.icon || '🔧'}</span>
                                <span class="font-medium text-slate-900 dark:text-white text-sm">{skill.name}</span>
                            </div>
                        </div>
                    {/each}
                </div>
            </section>

            <!-- 编排 Agent -->
            <section>
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Combine class="w-5 h-5 text-amber-500" />
                        已编排 Agent <span class="text-sm font-normal text-slate-400">（人格 × 技能）</span>
                    </h2>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {#each agentConfigs as agent}
                        {@const persona = getAgentPersona(agent)}
                        {@const skills = getAgentSkills(agent)}
                        <button 
                            onclick={() => launchAgent(agent)}
                            class="group p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-300 hover:shadow-lg transition-all text-left"
                        >
                            <div class="flex items-center gap-3 mb-3">
                                <div 
                                    class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                    style="background: linear-gradient(135deg, {persona?.visual.primaryColor || '#8B5CF6'}, {persona?.visual.primaryColor || '#8B5CF6'}AA)"
                                >
                                    {agent.name[0]}
                                </div>
                                <div class="flex-1">
                                    <h4 class="font-bold text-slate-900 dark:text-white">{agent.name}</h4>
                                </div>
                            </div>
                            
                            <!-- 公式展示 -->
                            <div class="flex items-center justify-center gap-2 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg mb-3 text-sm">
                                <span class="text-violet-600">{persona?.name || '?'}</span>
                                <span class="text-slate-400">×</span>
                                <span class="text-teal-600">{skills.length}技能</span>
                            </div>
                            
                            <div class="flex items-center justify-between">
                                <span class="text-xs text-slate-400">点击启动</span>
                                <Rocket class="w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </button>
                    {/each}
                    
                    <!-- 新建编排 -->
                    <button 
                        onclick={() => showOrchestrationModal = true}
                        class="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all flex flex-col items-center justify-center gap-2 text-center min-h-[140px]"
                    >
                        <Plus class="w-8 h-8 text-slate-400 group-hover:text-amber-500" />
                        <span class="text-sm text-slate-500 group-hover:text-amber-600">新建编排</span>
                    </button>
                </div>
            </section>
        </div>
    {/if}

    <!-- ============== 新建编排模态框 ============== -->
    {#if showOrchestrationModal}
        <div 
            class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onclick={() => showOrchestrationModal = false}
            transition:fade={{ duration: 200 }}
        >
            <div 
                class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full"
                onclick={(e) => e.stopPropagation()}
                transition:fly={{ y: 20, duration: 300 }}
            >
                <div class="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h3 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Combine class="w-5 h-5 text-amber-500" />
                        新建编排 (Agent)
                    </h3>
                    <p class="text-sm text-slate-500 mt-1">将人格与技能组合成 Agent</p>
                </div>
                
                <div class="p-6 space-y-4">
                    <!-- Agent 名称 -->
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Agent 名称</label>
                        <input 
                            type="text" 
                            bind:value={orchestrationName}
                            placeholder="例如：职业顾问 Agent"
                            class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                        />
                    </div>
                    
                    <!-- Agent 描述 -->
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-slate-700 dark:text-slate-300">描述</label>
                        <input 
                            type="text" 
                            bind:value={orchestrationDescription}
                            placeholder="简短描述这个 Agent"
                            class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                        />
                    </div>
                    
                    <!-- 选择人格 -->
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <User class="w-4 h-4 text-violet-500" />
                            选择人格 <span class="text-red-500">*</span>
                        </label>
                        <select 
                            bind:value={selectedPersonaId}
                            class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                        >
                            <option value="">请选择人格...</option>
                            {#each allPersonas as persona}
                                <option value={persona.id}>{persona.name} - {persona.roleSetting}</option>
                            {/each}
                        </select>
                    </div>
                    
                    <!-- 选择技能 -->
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Wrench class="w-4 h-4 text-teal-500" />
                            选择技能
                        </label>
                        <div class="max-h-40 overflow-y-auto space-y-1 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            {#each allSkills as skill}
                                <label class="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedSkillIds.includes(skill.id)}
                                        onchange={(e) => {
                                            if (e.currentTarget.checked) {
                                                selectedSkillIds = [...selectedSkillIds, skill.id];
                                            } else {
                                                selectedSkillIds = selectedSkillIds.filter(id => id !== skill.id);
                                            }
                                        }}
                                        class="rounded text-amber-500"
                                    />
                                    <span class="text-sm">{skill.name}</span>
                                    <span class="text-xs text-slate-400">- {skill.oneLiner}</span>
                                </label>
                            {/each}
                        </div>
                    </div>
                    
                    <!-- 预览公式 -->
                    <div class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <div class="text-sm text-center">
                            <span class="text-violet-600">{allPersonas.find(p => p.id === selectedPersonaId)?.name || '人格'}</span>
                            <span class="text-slate-400 mx-2">×</span>
                            <span class="text-teal-600">{selectedSkillIds.length}个技能</span>
                            <span class="text-slate-400 mx-2">=</span>
                            <span class="font-bold text-amber-600">Agent</span>
                        </div>
                    </div>
                </div>
                
                <div class="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                    <button 
                        onclick={() => showOrchestrationModal = false}
                        class="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        取消
                    </button>
                    <button 
                        onclick={createOrchestration}
                        disabled={!orchestrationName || !selectedPersonaId}
                        class="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Check class="w-4 h-4" />
                        创建 Agent
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>
