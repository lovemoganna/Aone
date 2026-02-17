<script lang="ts">
    import { Search, Rocket, GitMerge, ArrowLeft, ArrowRight, Users, Plus, X, Settings, Trash2, Edit, Copy, Play, Check, Wrench, User } from "lucide-svelte";
    import { fade, fly } from "svelte/transition";
    import { agentStore, type Agent } from '$lib/agents';
    import { personaStore, type AbstractPersona } from '$lib/persona';
    import { skillRegistry, type SkillDefinition } from '$lib/skills';
    import AgentFlowEditor from '$lib/components/agent-studio/AgentFlowEditor.svelte';

    // 视图模式
    let viewMode = $state<'grid' | 'simple' | 'flow' | 'squad'>('grid');
    let orchestrationSearchQuery = $state('');
    
    // 预设场景
    interface Scenario {
        id: string;
        name: string;
        description: string;
        icon: string;
        color: string;
        tags: string[];
        recommendedPersonaId?: string;
        recommendedSkillIds: string[];
        isBuiltIn: boolean;
    }

    let scenarios: Scenario[] = $state([
        { id: 'career_advisor', name: '职业顾问', description: '专业的职业发展咨询助手', icon: '💼', color: '#3B82F6', tags: ['职业', '发展'], recommendedSkillIds: [], isBuiltIn: true },
        { id: 'decision_helper', name: '决策助手', description: '帮助分析重大决策', icon: '⚖️', color: '#8B5CF6', tags: ['决策', '分析'], recommendedSkillIds: [], isBuiltIn: true },
        { id: 'creative_partner', name: '创意伙伴', description: '打破思维定式，激发创意', icon: '💡', color: '#F59E0B', tags: ['创意', '突破'], recommendedSkillIds: [], isBuiltIn: true },
        { id: 'action_coach', name: '行动教练', description: '将想法转化为行动', icon: '🚀', color: '#22C55E', tags: ['行动', '执行'], recommendedSkillIds: [], isBuiltIn: true }
    ]);

    let filteredScenarios = $derived.by(() => {
        if (!orchestrationSearchQuery) return scenarios;
        const q = orchestrationSearchQuery.toLowerCase();
        return scenarios.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    });

    // 获取用户创建的 Agents
    let userAgents = $derived(agentStore.getAll());
    let allPersonas = $derived(personaStore.allPersonas);
    let allSkills = $derived(skillRegistry.getAll());

    // ====== 快速组合模式状态 ======
    let simpleModeName = $state('');
    let simpleModeDescription = $state('');
    let simpleModeSelectedPersona = $state('');
    let simpleModeSelectedSkills = $state<string[]>([]);

    function startSimpleMode() {
        viewMode = 'simple';
    }

    function startFlowMode() {
        viewMode = 'flow';
    }

    function startSquadMode() {
        viewMode = 'squad';
    }

    function backToGrid() {
        viewMode = 'grid';
        // 重置表单
        simpleModeName = '';
        simpleModeDescription = '';
        simpleModeSelectedPersona = '';
        simpleModeSelectedSkills = [];
    }

    function toggleSkill(skillId: string) {
        if (simpleModeSelectedSkills.includes(skillId)) {
            simpleModeSelectedSkills = simpleModeSelectedSkills.filter(id => id !== skillId);
        } else {
            simpleModeSelectedSkills = [...simpleModeSelectedSkills, skillId];
        }
    }

    function createAgent() {
        if (!simpleModeName || !simpleModeSelectedPersona) return;
        
        agentStore.create({
            name: simpleModeName,
            description: simpleModeDescription,
            personaId: simpleModeSelectedPersona,
            skillIds: simpleModeSelectedSkills,
        });
        
        // 创建成功后返回
        backToGrid();
    }

    function deleteAgent(id: string) {
        if (confirm('确定要删除这个 Agent 吗？')) {
            agentStore.delete(id);
        }
    }
</script>

<!-- ========== 网格视图 ========== -->
{#if viewMode === 'grid'}
<div class="space-y-6" in:fade={{ duration: 200 }}>
    <!-- Header -->
    <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">编排中心</h2>
            <p class="text-slate-500 dark:text-slate-400">Persona × Skills = Agent → Squad</p>
    </div>

    <!-- Search -->
    <div class="relative max-w-md mx-auto">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
            type="text" 
            bind:value={orchestrationSearchQuery}
            placeholder="搜索场景..." 
                class="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
        />
    </div>

        <!-- 编排模式选择 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <!-- 快速组合 -->
            <button 
                onclick={startSimpleMode}
                class="p-6 rounded-2xl border-2 border-dashed border-violet-300 dark:border-violet-700 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all flex flex-col items-center gap-3"
            >
                <div class="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <Plus class="w-6 h-6 text-violet-600" />
                </div>
                <div class="text-center">
                    <div class="font-bold text-violet-700 dark:text-violet-400">快速组合</div>
                    <div class="text-sm text-violet-500/70 mt-1">Persona + Skills</div>
                </div>
            </button>

            <!-- 流程编排 -->
            <button 
                onclick={startFlowMode}
                class="p-6 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex flex-col items-center gap-3"
            >
                <div class="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <GitMerge class="w-6 h-6 text-indigo-600" />
                </div>
                <div class="text-center">
                    <div class="font-bold text-indigo-700 dark:text-indigo-400">流程编排</div>
                    <div class="text-sm text-indigo-500/70 mt-1">可视化流程设计</div>
                </div>
            </button>

            <!-- Squad 协作 -->
            <button 
                onclick={startSquadMode}
                class="p-6 rounded-2xl border-2 border-dashed border-teal-300 dark:border-teal-700 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all flex flex-col items-center gap-3"
            >
                <div class="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                    <Users class="w-6 h-6 text-teal-600" />
                </div>
                <div class="text-center">
                    <div class="font-bold text-teal-700 dark:text-teal-400">Squad 协作</div>
                    <div class="text-sm text-teal-500/70 mt-1">多 Agent 团队</div>
                </div>
            </button>
        </div>

        <!-- 我的 Agent 库 -->
        <div class="max-w-6xl mx-auto">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold text-slate-900 dark:text-white">我的 Agent 库</h3>
                <span class="text-sm text-slate-500">{userAgents.length} 个 Agent</span>
            </div>

            {#if userAgents.length > 0}
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {#each userAgents as agent (agent.id)}
                        <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-lg transition-shadow">
                            <div class="flex items-start justify-between mb-3">
                                <div 
                                    class="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                                    style="background: {agent.visual.primaryColor}20"
                                >
                                    {agent.visual.icon || '🤖'}
                                </div>
                                <div class="flex gap-1">
                                    <button class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                                        <Edit class="w-4 h-4 text-slate-400" />
                                    </button>
                                    <button 
                                        onclick={() => deleteAgent(agent.id)}
                                        class="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    >
                                        <Trash2 class="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                            </div>
                            <h4 class="font-bold text-slate-900 dark:text-white mb-1">{agent.name}</h4>
                            <p class="text-sm text-slate-500 line-clamp-2 mb-3">{agent.description || '暂无描述'}</p>
                            <div class="flex items-center gap-2 text-xs text-slate-400">
                                <span class="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 rounded">
                                    {allPersonas.find(p => p.id === agent.personaId)?.name || '未选择人格'}
                                </span>
                                <span>+{agent.skillIds.length} 技能</span>
                            </div>
                            <button class="w-full mt-3 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2">
                                <Play class="w-4 h-4" />
                                启动
                            </button>
                        </div>
                    {/each}
                    </div>
            {:else}
                <div class="text-center py-12 text-slate-500">
                    <p>还没有创建任何 Agent</p>
                    <p class="text-sm mt-1">选择上面的模式开始创建</p>
                </div>
                        {/if}
                    </div>

        <!-- 预设场景 -->
        <div class="max-w-6xl mx-auto mt-8">
            <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-4">预设场景</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {#each filteredScenarios as scenario (scenario.id)}
                    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden hover:border-purple-500/30 hover:shadow-xl transition-all">
                        <div class="h-16 bg-gradient-to-r" style="background: linear-gradient(to right, {scenario.color}, {scenario.color}dd)">
                            <div class="h-full flex items-center justify-center text-3xl">
                                {scenario.icon}
                            </div>
                        </div>
                        <div class="p-4">
                            <div class="flex items-center justify-between mb-1">
                                <h4 class="font-bold text-slate-900 dark:text-white">{scenario.name}</h4>
                                <span class="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded-full">预设</span>
                            </div>
                            <p class="text-sm text-slate-600 dark:text-slate-300 mb-3">{scenario.description}</p>
                            <div class="flex flex-wrap gap-1 mb-3">
                        {#each scenario.tags as tag}
                            <span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded">
                                {tag}
                            </span>
                        {/each}
                    </div>
                            <button class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium">
                        <Rocket class="w-4 h-4" />
                        启动
                    </button>
                </div>
            </div>
        {/each}
    </div>
</div>
    </div>

<!-- ========== 快速组合模式 ========== -->
{:else if viewMode === 'simple'}
    <div class="max-w-4xl mx-auto" in:fade={{ duration: 200 }}>
        <div class="flex items-center gap-4 mb-6">
            <button onclick={backToGrid} class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <ArrowLeft class="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div>
                <h2 class="text-xl font-bold text-slate-900 dark:text-white">快速组合</h2>
                <p class="text-sm text-slate-500">将 Persona 与 Skills 组合成 Agent</p>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- 左侧：配置 -->
            <div class="space-y-4">
                <!-- Agent 名称 -->
                <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Agent 名称 <span class="text-red-500">*</span>
                    </label>
                    <input 
                        type="text"
                        bind:value={simpleModeName}
                        placeholder="例如：职业顾问 Agent"
                        class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                </div>

                <!-- Agent 描述 -->
                <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">描述</label>
                    <textarea 
                        bind:value={simpleModeDescription}
                        placeholder="简短描述这个 Agent"
                        rows="3"
                        class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg resize-none"
                    ></textarea>
                </div>

                <!-- 选择人格 -->
                <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <User class="w-4 h-4 text-violet-500" />
                        选择人格 <span class="text-red-500">*</span>
                    </label>
                    {#if allPersonas.length > 0}
                        <div class="space-y-2 max-h-60 overflow-y-auto">
                            {#each allPersonas as persona (persona.id)}
                                <button 
                                    onclick={() => simpleModeSelectedPersona = persona.id}
                                    class="w-full p-3 rounded-lg border text-left transition-all {simpleModeSelectedPersona === persona.id ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-violet-300'}"
                                >
                                    <div class="font-medium text-slate-900 dark:text-white">{persona.name}</div>
                                    <div class="text-xs text-slate-500 mt-0.5">{persona.roleSetting}</div>
                                </button>
                            {/each}
                        </div>
                    {:else}
                        <div class="text-center py-4 text-slate-500">
                            <p>暂无可用人格</p>
                            <a href="/agent-studio/personas" class="text-violet-500 text-sm hover:underline">去创建人格 →</a>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- 右侧：技能选择 -->
            <div class="space-y-4">
                <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <Wrench class="w-4 h-4 text-teal-500" />
                        选择技能
                        <span class="text-xs text-slate-400">可选多个</span>
                    </label>
                    {#if allSkills.length > 0}
                        <div class="space-y-2 max-h-96 overflow-y-auto">
                            {#each allSkills as skill (skill.id)}
                                <label 
                                    class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all {simpleModeSelectedSkills.includes(skill.id) ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-teal-300'}"
                                >
                                    <input 
                                        type="checkbox"
                                        checked={simpleModeSelectedSkills.includes(skill.id)}
                                        onchange={() => toggleSkill(skill.id)}
                                        class="rounded text-teal-500"
                                    />
                                    <div class="flex-1">
                                        <div class="font-medium text-slate-900 dark:text-white">{skill.name}</div>
                                        <div class="text-xs text-slate-500">{skill.oneLiner}</div>
                                    </div>
                                    <div 
                                        class="w-3 h-3 rounded-full"
                                        style="background: {skill.visual.color}"
                                    ></div>
                                </label>
                            {/each}
                        </div>
                    {:else}
                        <div class="text-center py-4 text-slate-500">
                            <p>暂无可用技能</p>
                        </div>
                    {/if}
                </div>

                <!-- 预览公式 -->
                <div class="p-4 bg-gradient-to-r from-violet-50 to-teal-50 dark:from-violet-900/20 dark:to-teal-900/20 rounded-xl border border-violet-200 dark:border-violet-800">
                    <div class="text-center">
                        <div class="text-sm text-slate-500 mb-2">组合公式</div>
                        <div class="text-lg font-bold">
                            <span class="text-violet-600">{allPersonas.find(p => p.id === simpleModeSelectedPersona)?.name || '人格'}</span>
                            <span class="text-slate-400 mx-2">×</span>
                            <span class="text-teal-600">{simpleModeSelectedSkills.length}个技能</span>
                            <span class="text-slate-400 mx-2">=</span>
                            <span class="text-amber-600">Agent</span>
                        </div>
                    </div>
                </div>

                <!-- 创建按钮 -->
                <button 
                    onclick={createAgent}
                    disabled={!simpleModeName || !simpleModeSelectedPersona}
                    class="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <Check class="w-5 h-5" />
                    创建 Agent
                </button>
            </div>
        </div>
    </div>

<!-- ========== 流程编排模式 ========== -->
{:else if viewMode === 'flow'}
    <div class="h-[calc(100vh-12rem)]" in:fade={{ duration: 200 }}>
        <div class="flex items-center justify-between mb-4 px-4">
            <div class="flex items-center gap-3">
                <button onclick={backToGrid} class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                    <ArrowLeft class="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                    <h2 class="text-xl font-bold text-slate-900 dark:text-white">流程编排</h2>
                    <p class="text-sm text-slate-500">可视化设计 Agent 工作流程</p>
                </div>
            </div>
            <div class="flex gap-2">
                <button class="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm flex items-center gap-2">
                    <Copy class="w-4 h-4" />
                    导出
                </button>
                <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm flex items-center gap-2">
                    <Play class="w-4 h-4" />
                    运行
                </button>
            </div>
        </div>

        <div class="h-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <AgentFlowEditor />
        </div>
    </div>

<!-- ========== Squad 协作模式 ========== -->
{:else if viewMode === 'squad'}
    <div class="max-w-4xl mx-auto" in:fade={{ duration: 200 }}>
        <div class="flex items-center gap-4 mb-6">
            <button onclick={backToGrid} class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <ArrowLeft class="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div>
                <h2 class="text-xl font-bold text-slate-900 dark:text-white">Squad 协作</h2>
                <p class="text-sm text-slate-500">创建多 Agent 协作团队</p>
            </div>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div class="text-center py-12 text-slate-500">
                <Users class="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p class="text-lg font-medium mb-2">Squad 协作模式</p>
                <p class="text-sm">即将推出 - 多 Agent 团队协作功能</p>
            </div>
        </div>
    </div>
{/if}

<style>
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>
