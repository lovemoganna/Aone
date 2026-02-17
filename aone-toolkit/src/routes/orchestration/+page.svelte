<script lang="ts">
    import {
        GitBranch,
        Plus,
        Save,
        Trash2,
        Settings,
        Users,
        Puzzle,
        ChevronRight,
        X,
        Check,
        Search,
        CheckCircle,
        Circle,
        Workflow,
        BookOpen,
        Rocket
    } from 'lucide-svelte';
    import { fade, slide, fly } from 'svelte/transition';
    
    // 场景数据
    interface Scenario {
        id: string;
        name: string;
        description: string;
        entryPrompt: string;
        icon: string;
        color: string;
        tags: string[];
        recommendedPersonas: string[];
        recommendedSkills: string[];
        isBuiltIn: boolean;
    }
    
    // 预设场景
    let scenarios: Scenario[] = $state([
        {
            id: 'career_advisor',
            name: '职业顾问',
            description: '专业的职业发展咨询助手',
            recommendedPersonas: [],
            recommendedSkills: ['decompose', 'decision_matrix', 'action_list'],
            entryPrompt: '职业发展有问题？来聊聊。',
            icon: '💼',
            color: '#3B82F6',
            tags: ['职业', '发展', '规划'],
            isBuiltIn: true
        },
        {
            id: 'decision_helper',
            name: '决策助手',
            description: '帮助分析重大决策',
            recommendedPersonas: [],
            recommendedSkills: ['decision_matrix', 'stress_test', 'resource_audit'],
            entryPrompt: '有重大决策要做？我们来量化分析。',
            icon: '⚖️',
            color: '#8B5CF6',
            tags: ['决策', '分析', '风险'],
            isBuiltIn: true
        },
        {
            id: 'creative_partner',
            name: '创意伙伴',
            description: '打破思维定式，激发创意',
            recommendedPersonas: [],
            recommendedSkills: ['reframe', 'decompose', 'action_list'],
            entryPrompt: '思维卡住了？换个角度看世界。',
            icon: '💡',
            color: '#F59E0B',
            tags: ['创意', '突破', '可能性'],
            isBuiltIn: true
        },
        {
            id: 'action_coach',
            name: '行动教练',
            description: '将想法转化为行动',
            recommendedPersonas: [],
            recommendedSkills: ['action_list', 'resource_audit'],
            entryPrompt: '想做的事情太多？来列个清单。',
            icon: '🚀',
            color: '#22C55E',
            tags: ['行动', '执行', '效率'],
            isBuiltIn: true
        }
    ]);
    
    // 模拟人格数据
    const mockPersonas = [
        { id: 'mentor_sage', name: '智者导师', roleSetting: '人生导师与智者' },
        { id: 'analytic_expert', name: '理性分析专家', roleSetting: '数据分析师与逻辑思考者' },
        { id: 'creative_innovator', name: '创意创新者', roleSetting: '突破思维边界的创新者' },
        { id: 'action_coach', name: '行动教练', roleSetting: '推动想法落地的执行专家' },
        { id: 'empathy_companion', name: '共情陪伴者', roleSetting: '情感支持与陪伴者' }
    ];
    
    // 模拟技能数据
    const mockSkills = [
        { id: 'decompose', name: '拆问题', oneLiner: '把一团乱麻拆成编号的清单' },
        { id: 'decision_matrix', name: '摆天平', oneLiner: '把纠结变成可比较的数字' },
        { id: 'stress_test', name: '翻底牌', oneLiner: '把恐惧变成可评估的风险' },
        { id: 'resource_audit', name: '算家底', oneLiner: '看看你到底有多少家底' },
        { id: 'reframe', name: '换框架', oneLiner: '换个角度，世界大不同' },
        { id: 'action_list', name: '出清单', oneLiner: '把想法变成今天就能做的动作' }
    ];
    
    // 当前视图
    let activeView: 'scenarios' | 'builder' = $state('scenarios');
    
    // 搜索过滤
    let searchQuery = $state('');
    let filterTag = $state('');
    
    // 编辑状态
    let isEditing = $state(false);
    let editingScenario = $state<Scenario | null>(null);
    
    // 表单数据
    let formName = $state('');
    let formDescription = $state('');
    let formEntryPrompt = $state('');
    let formIcon = $state('💡');
    let formColor = $state('#8B5CF6');
    let formTags = $state('');
    let selectedPersonas = $state<string[]>([]);
    let selectedSkills = $state<string[]>([]);
    
    // 预设选项
    const iconOptions = ['💼', '⚖️', '💡', '🚀', '🎯', '🧠', '💪', '🔮', '📚', '🎨'];
    const colorOptions = ['#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#22C55E', '#14B8A6', '#0EA5E9'];
    
    // 视图选项
    const scenarioTypes = [
        { id: 'scenarios', label: '场景包', icon: BookOpen },
        { id: 'builder', label: '编排构建器', icon: Workflow }
    ];
    
    // 所有标签
    let allTags = $derived.by(() => {
        const tags = new Set<string>();
        for (const s of scenarios) {
            for (const t of s.tags) {
                tags.add(t);
            }
        }
        return Array.from(tags).sort();
    });
    
    // 过滤后场景
    let filteredScenarios = $derived.by(() => {
        let list = scenarios;
        
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(s => 
                s.name.toLowerCase().includes(q) ||
                s.description.toLowerCase().includes(q) ||
                s.tags.some(t => t.toLowerCase().includes(q))
            );
        }
        
        if (filterTag) {
            list = list.filter(s => s.tags.includes(filterTag));
        }
        
        return list;
    });
    
    // 调整颜色
    function adjustColor(hex: string, amount: number): string {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + amount));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
        const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    
    // 重置表单
    function resetForm() {
        formName = '';
        formDescription = '';
        formEntryPrompt = '';
        formIcon = '💡';
        formColor = '#8B5CF6';
        formTags = '';
        selectedPersonas = [];
        selectedSkills = [];
        
        isEditing = false;
        editingScenario = null;
    }
    
    // 开始创建
    function handleCreate() {
        resetForm();
        isEditing = true;
    }
    
    // 开始编辑
    function handleEdit(scenario: Scenario) {
        formName = scenario.name;
        formDescription = scenario.description;
        formEntryPrompt = scenario.entryPrompt;
        formIcon = scenario.icon || '💡';
        formColor = scenario.color || '#8B5CF6';
        formTags = scenario.tags.join(', ');
        selectedPersonas = [...scenario.recommendedPersonas];
        selectedSkills = [...scenario.recommendedSkills];
        
        editingScenario = scenario;
        isEditing = true;
    }
    
    // 保存
    function handleSave() {
        if (!formName || !formDescription || !formEntryPrompt) return;
        
        const scenarioData: Scenario = {
            id: editingScenario?.id || `scenario_${Date.now()}`,
            name: formName,
            description: formDescription,
            entryPrompt: formEntryPrompt,
            icon: formIcon,
            color: formColor,
            tags: formTags.split(',').map(t => t.trim()).filter(t => t),
            recommendedPersonas: selectedPersonas,
            recommendedSkills: selectedSkills,
            isBuiltIn: editingScenario?.isBuiltIn || false
        };
        
        if (editingScenario) {
            const index = scenarios.findIndex(s => s.id === editingScenario!.id);
            if (index !== -1) {
                scenarios[index] = scenarioData;
            }
        } else {
            scenarios = [...scenarios, scenarioData];
        }
        
        resetForm();
    }
    
    // 删除
    function handleDelete(id: string) {
        if (confirm('确定要删除这个场景包吗？')) {
            scenarios = scenarios.filter(s => s.id !== id);
            if (editingScenario?.id === id) {
                resetForm();
            }
        }
    }
    
    // 切换人格选择
    function togglePersona(id: string) {
        if (selectedPersonas.includes(id)) {
            selectedPersonas = selectedPersonas.filter(p => p !== id);
        } else {
            selectedPersonas = [...selectedPersonas, id];
        }
    }
    
    // 切换技能选择
    function toggleSkill(id: string) {
        if (selectedSkills.includes(id)) {
            selectedSkills = selectedSkills.filter(s => s !== id);
        } else {
            selectedSkills = [...selectedSkills, id];
        }
    }
    
    // 获取人格名称
    function getPersonaName(id: string): string {
        return mockPersonas.find(p => p.id === id)?.name || id;
    }
    
    // 获取技能名称
    function getSkillName(id: string): string {
        return mockSkills.find(s => s.id === id)?.name || id;
    }
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <!-- Logo & Title -->
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <GitBranch class="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 class="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            编排中心
                        </h1>
                        <p class="text-xs text-slate-500 dark:text-slate-400">Agent + Skills 动态编排系统</p>
                    </div>
                </div>
                
                <!-- Actions -->
                <div class="flex items-center gap-3">
                    <!-- View Toggle -->
                    <div class="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                        {#each scenarioTypes as type}
                            <button 
                                onclick={() => activeView = type.id as any}
                                class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all {activeView === type.id ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}"
                            >
                                <type.icon class="w-4 h-4" />
                                {type.label}
                            </button>
                        {/each}
                    </div>
                    
                    <!-- Create -->
                    <button 
                        onclick={handleCreate}
                        class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus class="w-4 h-4" />
                        <span class="hidden sm:inline">新建场景</span>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {#if activeView === 'scenarios'}
            <!-- 场景包视图 -->
            <div class="space-y-6">
                <!-- Search & Filters -->
                <div class="flex flex-col md:flex-row gap-4">
                    <div class="relative flex-1">
                        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            bind:value={searchQuery}
                            placeholder="搜索场景包..." 
                            class="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <button 
                            onclick={() => filterTag = ''}
                            class="px-3 py-1.5 rounded-full text-sm font-medium transition-all {filterTag === '' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}"
                        >
                            全部
                        </button>
                        {#each allTags.slice(0, 6) as tag}
                            <button 
                                onclick={() => filterTag = tag}
                                class="px-3 py-1.5 rounded-full text-sm font-medium transition-all {filterTag === tag ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}"
                            >
                                {tag}
                            </button>
                        {/each}
                    </div>
                </div>
                
                <!-- Scenarios Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {#each filteredScenarios as scenario (scenario.id)}
                        <div 
                            class="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300"
                            transition:fly={{ y: 20, duration: 300 }}
                        >
                            <!-- Card Header -->
                            <div class="relative h-20 bg-gradient-to-r from-[{scenario.color}] to-[{adjustColor(scenario.color, -30)}]">
                                <div class="absolute top-4 left-4 w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl">
                                    {scenario.icon}
                                </div>
                                
                                <!-- Actions -->
                                <div class="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onclick={() => handleEdit(scenario)}
                                        class="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                                        title="编辑"
                                    >
                                        <Settings class="w-4 h-4" />
                                    </button>
                                    {#if !scenario.isBuiltIn}
                                        <button 
                                            onclick={() => handleDelete(scenario.id)}
                                            class="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-red-500 transition-colors"
                                            title="删除"
                                        >
                                            <Trash2 class="w-4 h-4" />
                                        </button>
                                    {/if}
                                </div>
                                
                                {#if scenario.isBuiltIn}
                                    <span class="absolute bottom-3 right-3 px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full font-medium">
                                        预设
                                    </span>
                                {/if}
                            </div>
                            
                            <!-- Card Body -->
                            <div class="p-5">
                                <h3 class="font-bold text-lg text-slate-900 dark:text-white mb-1">
                                    {scenario.name}
                                </h3>
                                <p class="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4">
                                    {scenario.description}
                                </p>
                                
                                <!-- Tags -->
                                <div class="flex flex-wrap gap-1.5 mb-4">
                                    {#each scenario.tags.slice(0, 3) as tag}
                                        <span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-full">
                                            {tag}
                                        </span>
                                    {/each}
                                </div>
                                
                                <!-- Components -->
                                <div class="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <!-- Personas -->
                                    <div>
                                        <p class="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                                            <Users class="w-3 h-3" />
                                            推荐人格 ({scenario.recommendedPersonas.length})
                                        </p>
                                        <div class="flex flex-wrap gap-1">
                                            {#each scenario.recommendedPersonas.slice(0, 3) as pid}
                                                <span class="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs rounded">
                                                    {getPersonaName(pid)}
                                                </span>
                                            {/each}
                                            {#if scenario.recommendedPersonas.length === 0}
                                                <span class="text-xs text-slate-400">暂无</span>
                                            {/if}
                                        </div>
                                    </div>
                                    
                                    <!-- Skills -->
                                    <div>
                                        <p class="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                                            <Puzzle class="w-3 h-3" />
                                            推荐技能 ({scenario.recommendedSkills.length})
                                        </p>
                                        <div class="flex flex-wrap gap-1">
                                            {#each scenario.recommendedSkills.slice(0, 3) as sid}
                                                <span class="px-2 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 text-xs rounded">
                                                    {getSkillName(sid)}
                                                </span>
                                            {/each}
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Entry Prompt -->
                                <div class="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <p class="text-xs text-slate-400 mb-1">入口引导</p>
                                    <p class="text-sm text-slate-600 dark:text-slate-300 italic">
                                        "{scenario.entryPrompt}"
                                    </p>
                                </div>
                                
                                <!-- Use Button -->
                                <button 
                                    class="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                                >
                                    <Rocket class="w-4 h-4" />
                                    启动场景
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
                
                {#if filteredScenarios.length === 0}
                    <div class="text-center py-16">
                        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <GitBranch class="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">暂无场景包</h3>
                        <p class="text-slate-500 dark:text-slate-400 mb-4">创建你的第一个编排场景</p>
                        <button 
                            onclick={handleCreate}
                            class="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-500 transition-colors"
                        >
                            <Plus class="w-4 h-4" />
                            新建场景
                        </button>
                    </div>
                {/if}
            </div>
        {:else}
            <!-- 编排构建器 -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- 左侧：组件库 -->
                <div class="lg:col-span-1 space-y-6">
                    <!-- 人格库 -->
                    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5">
                        <h3 class="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Users class="w-4 h-4 text-purple-500" />
                            可用人格
                        </h3>
                        <div class="space-y-2 max-h-64 overflow-y-auto">
                            {#each mockPersonas as persona}
                                <button 
                                    onclick={() => togglePersona(persona.id)}
                                    class="w-full flex items-center gap-3 p-3 rounded-xl border transition-all {selectedPersonas.includes(persona.id) ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'}"
                                >
                                    <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                        {persona.name[0]}
                                    </div>
                                    <div class="flex-1 text-left">
                                        <p class="text-sm font-medium text-slate-900 dark:text-white">{persona.name}</p>
                                        <p class="text-xs text-slate-500">{persona.roleSetting}</p>
                                    </div>
                                    {#if selectedPersonas.includes(persona.id)}
                                        <CheckCircle class="w-5 h-5 text-purple-500" />
                                    {:else}
                                        <Circle class="w-5 h-5 text-slate-300" />
                                    {/if}
                                </button>
                            {/each}
                        </div>
                    </div>
                    
                    <!-- 技能库 -->
                    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-5">
                        <h3 class="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Puzzle class="w-4 h-4 text-teal-500" />
                            可用技能
                        </h3>
                        <div class="space-y-2 max-h-64 overflow-y-auto">
                            {#each mockSkills as skill}
                                <button 
                                    onclick={() => toggleSkill(skill.id)}
                                    class="w-full flex items-center gap-3 p-3 rounded-xl border transition-all {selectedSkills.includes(skill.id) ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-teal-300'}"
                                >
                                    <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-white text-lg">
                                        🔧
                                    </div>
                                    <div class="flex-1 text-left">
                                        <p class="text-sm font-medium text-slate-900 dark:text-white">{skill.name}</p>
                                        <p class="text-xs text-slate-500">{skill.oneLiner}</p>
                                    </div>
                                    {#if selectedSkills.includes(skill.id)}
                                        <CheckCircle class="w-5 h-5 text-teal-500" />
                                    {:else}
                                        <Circle class="w-5 h-5 text-slate-300" />
                                    {/if}
                                </button>
                            {/each}
                        </div>
                    </div>
                </div>
                
                <!-- 右侧：构建面板 -->
                <div class="lg:col-span-2">
                    {#if isEditing}
                        <!-- 编辑模式 -->
                        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
                            <div class="p-6 border-b border-slate-200 dark:border-slate-800">
                                <div class="flex items-center justify-between">
                                    <h2 class="text-xl font-bold text-slate-900 dark:text-white">
                                        {editingScenario ? '编辑场景' : '新建场景'}
                                    </h2>
                                    <button 
                                        onclick={resetForm}
                                        class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                    >
                                        <X class="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            
                            <div class="p-6 space-y-6">
                                <!-- 名称 -->
                                <div class="space-y-2">
                                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        场景名称 <span class="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        bind:value={formName}
                                        placeholder="例如：职业转型顾问"
                                        class="input-base"
                                    />
                                </div>
                                
                                <!-- 描述 -->
                                <div class="space-y-2">
                                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        描述 <span class="text-red-500">*</span>
                                    </label>
                                    <textarea 
                                        bind:value={formDescription}
                                        rows="2"
                                        placeholder="描述这个场景的用途..."
                                        class="input-base resize-none"
                                    ></textarea>
                                </div>
                                
                                <!-- 入口引导 -->
                                <div class="space-y-2">
                                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        入口引导语 <span class="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        bind:value={formEntryPrompt}
                                        placeholder="用户进入场景时的引导语"
                                        class="input-base"
                                    />
                                </div>
                                
                                <!-- 已选组件 -->
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="space-y-2">
                                        <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            已选人格 ({selectedPersonas.length})
                                        </label>
                                        <div class="min-h-20 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                            {#if selectedPersonas.length === 0}
                                                <p class="text-sm text-slate-400 text-center py-2">从左侧选择人格</p>
                                            {:else}
                                                <div class="flex flex-wrap gap-2">
                                                    {#each selectedPersonas as pid}
                                                        <span class="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-lg flex items-center gap-1">
                                                            {getPersonaName(pid)}
                                                            <button onclick={() => togglePersona(pid)}><X class="w-3 h-3" /></button>
                                                        </span>
                                                    {/each}
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                    
                                    <div class="space-y-2">
                                        <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            已选技能 ({selectedSkills.length})
                                        </label>
                                        <div class="min-h-20 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                            {#if selectedSkills.length === 0}
                                                <p class="text-sm text-slate-400 text-center py-2">从左侧选择技能</p>
                                            {:else}
                                                <div class="flex flex-wrap gap-2">
                                                    {#each selectedSkills as sid}
                                                        <span class="px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs rounded-lg flex items-center gap-1">
                                                            {getSkillName(sid)}
                                                            <button onclick={() => toggleSkill(sid)}><X class="w-3 h-3" /></button>
                                                        </span>
                                                    {/each}
                                                </div>
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- 图标和颜色 -->
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="space-y-2">
                                        <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            图标
                                        </label>
                                        <div class="flex flex-wrap gap-2">
                                            {#each iconOptions as icon}
                                                <button 
                                                    onclick={() => formIcon = icon}
                                                    class="w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all {formIcon === icon ? 'bg-purple-100 dark:bg-purple-900/30 ring-2 ring-purple-500' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'}"
                                                >
                                                    {icon}
                                                </button>
                                            {/each}
                                        </div>
                                    </div>
                                    
                                    <div class="space-y-2">
                                        <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            主题色
                                        </label>
                                        <div class="flex flex-wrap gap-2">
                                            {#each colorOptions as color}
                                                <button 
                                                    onclick={() => formColor = color}
                                                    class="w-10 h-10 rounded-lg transition-all hover:scale-110 {formColor === color ? 'ring-2 ring-offset-2 ring-purple-500' : ''}"
                                                    style="background-color: {color}"
                                                ></button>
                                            {/each}
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- 标签 -->
                                <div class="space-y-2">
                                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        标签 <span class="text-slate-400 text-xs">(逗号分隔)</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        bind:value={formTags}
                                        placeholder="例如：职业, 规划, 决策"
                                        class="input-base"
                                    />
                                </div>
                            </div>
                            
                            <div class="p-6 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                                <button 
                                    onclick={handleSave}
                                    disabled={!formName || !formDescription || !formEntryPrompt}
                                    class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save class="w-4 h-4" />
                                    保存场景
                                </button>
                                <button 
                                    onclick={resetForm}
                                    class="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    取消
                                </button>
                            </div>
                        </div>
                    {:else}
                        <!-- 预览模式 -->
                        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-8 text-center">
                            <div class="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Workflow class="w-12 h-12 text-white" />
                            </div>
                            <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                编排构建器
                            </h3>
                            <p class="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                                从左侧选择人格和技能，组合成自定义的 Agent 场景包。创建后可以随时调整配置。
                            </p>
                            
                            {#if selectedPersonas.length > 0 || selectedSkills.length > 0}
                                <div class="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <p class="text-sm text-slate-500 mb-3">当前选择预览</p>
                                    <div class="flex flex-wrap justify-center gap-2">
                                        {#each selectedPersonas as pid}
                                            <span class="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm rounded-lg">
                                                {getPersonaName(pid)}
                                            </span>
                                        {/each}
                                        {#each selectedSkills as sid}
                                            <span class="px-3 py-1.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-sm rounded-lg">
                                                {getSkillName(sid)}
                                            </span>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                            
                            <button 
                                onclick={handleCreate}
                                disabled={selectedPersonas.length === 0 && selectedSkills.length === 0}
                                class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus class="w-4 h-4" />
                                创建场景包
                            </button>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .input-base {
        @apply w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400;
    }
</style>
