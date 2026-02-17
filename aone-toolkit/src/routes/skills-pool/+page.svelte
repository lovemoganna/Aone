<script lang="ts">
    import { skillRegistry, type SkillDefinition, type SkillType } from '$lib/skills';
    import {
        Puzzle,
        Plus,
        Save,
        Trash2,
        Copy,
        Download,
        Upload,
        Search,
        Filter,
        Settings,
        Code,
        Zap,
        Target,
        MessageSquare,
        Lightbulb,
        FileText,
        ChevronRight,
        X,
        Check,
        Info,
        RefreshCw,
        MoreVertical,
        Play,
        Edit2
    } from 'lucide-svelte';
    import { fade, slide, fly } from 'svelte/transition';
    
    // 获取所有技能
    let allSkills = $derived(skillRegistry.getAll());
    
    // 搜索过滤
    let searchQuery = $state('');
    let filterType = $state<SkillType | ''>('');
    let filterAgent = $state('');
    
    // 编辑状态
    let isEditing = $state(false);
    let isCreating = $state(false);
    let editingSkill = $state<SkillDefinition | null>(null);
    
    // 表单数据
    let formName = $state('');
    let formDescription = $state('');
    let formOneLiner = $state('');
    let formType = $state<SkillType>('analysis');
    let formOutputTemplate = $state('');
    let formTriggerKeywords = $state('');
    let formTags = $state('');
    let formColor = $state('#3B82F6');
    let formIcon = $state('🔧');
    
    // 技能类型选项
    const skillTypes: { value: SkillType; label: string; desc: string; icon: any }[] = [
        { value: 'analysis', label: '分析型', desc: '拆解问题，提取关键信息', icon: Search },
        { value: 'quantitative', label: '量化型', desc: '将定性转为定量分析', icon: Target },
        { value: 'evaluation', label: '评估型', desc: '评估风险、方案可行性', icon: Zap },
        { value: 'exploration', label: '探索型', desc: '发现新的可能性和角度', icon: Lightbulb },
        { value: 'generation', label: '生成型', desc: '生成内容、方案、行动', icon: FileText }
    ];
    
    // 颜色选项
    const colorOptions = [
        '#3B82F6', '#0EA5E9', '#14B8A6', '#22C55E', '#F59E0B',
        '#EF4444', '#EC4899', '#8B5CF6', '#6366F1', '#6B7280'
    ];
    
    // 常用图标
    const iconOptions = ['🔍', '⚖️', '🃏', '💎', '🔄', '✅', '🎯', '💡', '📊', '🔧', '🛠️', '📝'];
    
    // 过滤后技能
    let filteredSkills = $derived.by(() => {
        let list = allSkills;
        
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(s => 
                s.name.toLowerCase().includes(q) ||
                s.description.toLowerCase().includes(q) ||
                s.tags.some(t => t.toLowerCase().includes(q))
            );
        }
        
        if (filterType) {
            list = list.filter(s => s.type === filterType);
        }
        
        return list;
    });
    
    // 按类型分组
    let skillsByType = $derived.by(() => {
        const grouped: Record<string, SkillDefinition[]> = {};
        for (const skill of allSkills) {
            if (!grouped[skill.type]) {
                grouped[skill.type] = [];
            }
            grouped[skill.type].push(skill);
        }
        return grouped;
    });
    
    // 重置表单
    function resetForm() {
        formName = '';
        formDescription = '';
        formOneLiner = '';
        formType = 'analysis';
        formOutputTemplate = '';
        formTriggerKeywords = '';
        formTags = '';
        formColor = '#3B82F6';
        formIcon = '🔧';
        
        isEditing = false;
        isCreating = false;
        editingSkill = null;
    }
    
    // 开始创建
    function handleCreate() {
        resetForm();
        isCreating = true;
        isEditing = true;
    }
    
    // 开始编辑
    function handleEdit(skill: SkillDefinition) {
        formName = skill.name;
        formDescription = skill.description;
        formOneLiner = skill.oneLiner;
        formType = skill.type;
        formOutputTemplate = skill.outputTemplate;
        formTriggerKeywords = skill.trigger.keywords?.join(', ') || '';
        formTags = skill.tags.join(', ');
        formColor = skill.visual.color;
        formIcon = skill.visual.icon;
        
        editingSkill = skill;
        isEditing = true;
        isCreating = false;
    }
    
    // 保存
    function handleSave() {
        if (!formName || !formDescription || !formOutputTemplate) return;
        
        const skillData: Partial<SkillDefinition> = {
            name: formName,
            description: formDescription,
            oneLiner: formOneLiner,
            type: formType,
            outputTemplate: formOutputTemplate,
            trigger: {
                keywords: formTriggerKeywords.split(',').map(k => k.trim()).filter(k => k)
            },
            tags: formTags.split(',').map(t => t.trim()).filter(t => t),
            visual: {
                color: formColor,
                icon: formIcon,
                gradient: `from-[${formColor}] to-[${adjustColor(formColor, -30)}]`
            }
        };
        
        if (isCreating) {
            const newId = `skill_${Date.now()}`;
            skillRegistry.register({
                id: newId,
                ...skillData,
                steps: [],
                io: { input: '', output: '' },
                exceptions: [],
                compatibleAgents: [],
                version: '1.0.0',
                isBuiltIn: false
            } as SkillDefinition);
        } else if (editingSkill) {
            skillRegistry.update(editingSkill.id, skillData);
        }
        
        resetForm();
    }
    
    // 删除
    function handleDelete(id: string) {
        if (confirm('确定要删除这个技能吗？')) {
            skillRegistry.unregister(id);
            if (editingSkill?.id === id) {
                resetForm();
            }
        }
    }
    
    // 导出
    function handleExport(skill: SkillDefinition) {
        const data = JSON.stringify(skill, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${skill.name.replace(/\s+/g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // 获取类型信息
    function getTypeInfo(type: string) {
        return skillTypes.find(t => t.value === type) || skillTypes[0];
    }
    
    // 调整颜色
    function adjustColor(hex: string, amount: number): string {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + amount));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
        const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <!-- Logo & Title -->
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
                        <Puzzle class="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 class="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                            技能池
                        </h1>
                        <p class="text-xs text-slate-500 dark:text-slate-400">认知工具管理中心</p>
                    </div>
                </div>
                
                <!-- Actions -->
                <div class="flex items-center gap-3">
                    <!-- Search -->
                    <div class="relative hidden md:block">
                        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            bind:value={searchQuery}
                            placeholder="搜索技能..." 
                            class="w-64 pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                        />
                    </div>
                    
                    <!-- Create Button -->
                    <button 
                        onclick={handleCreate}
                        class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-medium shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus class="w-4 h-4" />
                        <span class="hidden sm:inline">新建技能</span>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {#if !isEditing}
            <!-- 技能列表视图 -->
            <div class="space-y-8">
                <!-- Type Filters -->
                <div class="flex flex-wrap gap-2">
                    <button 
                        onclick={() => filterType = ''}
                        class="px-4 py-2 rounded-xl text-sm font-medium transition-all {filterType === '' ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}"
                    >
                        全部 ({allSkills.length})
                    </button>
                    {#each skillTypes as type}
                        <button 
                            onclick={() => filterType = type.value}
                            class="px-4 py-2 rounded-xl text-sm font-medium transition-all {filterType === type.value ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}"
                        >
                            {type.label} ({skillsByType[type.value]?.length || 0})
                        </button>
                    {/each}
                </div>

                <!-- Skills Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {#each filteredSkills as skill (skill.id)}
                        {@const typeInfo = getTypeInfo(skill.type)}
                        <div 
                            class="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden hover:border-teal-500/30 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300"
                            transition:fly={{ y: 20, duration: 300 }}
                        >
                            <!-- Card Header -->
                            <div class="relative h-16 bg-gradient-to-r from-[{skill.visual.color}] to-[{adjustColor(skill.visual.color, -30)}]">
                                <div class="absolute top-3 left-3 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl">
                                    {skill.visual.icon}
                                </div>
                                
                                <!-- Actions -->
                                <div class="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onclick={() => handleEdit(skill)}
                                        class="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                                        title="编辑"
                                    >
                                        <Settings class="w-4 h-4" />
                                    </button>
                                    <button 
                                        onclick={() => handleExport(skill)}
                                        class="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                                        title="导出"
                                    >
                                        <Download class="w-4 h-4" />
                                    </button>
                                    {#if !skill.isBuiltIn}
                                        <button 
                                            onclick={() => handleDelete(skill.id)}
                                            class="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-red-500 transition-colors"
                                            title="删除"
                                        >
                                            <Trash2 class="w-4 h-4" />
                                        </button>
                                    {/if}
                                </div>
                                
                                <!-- Type Badge -->
                                <span class="absolute bottom-3 left-3 px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full font-medium">
                                    {typeInfo.label}
                                </span>
                                
                                {#if skill.isBuiltIn}
                                    <span class="absolute bottom-3 right-3 px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full font-medium">
                                        内置
                                    </span>
                                {/if}
                            </div>
                            
                            <!-- Card Body -->
                            <div class="p-5">
                                <h3 class="font-bold text-lg text-slate-900 dark:text-white mb-1">
                                    {skill.name}
                                </h3>
                                <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">
                                    {skill.oneLiner}
                                </p>
                                <p class="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4">
                                    {skill.description}
                                </p>
                                
                                <!-- Tags -->
                                <div class="flex flex-wrap gap-1.5 mb-4">
                                    {#each skill.tags.slice(0, 4) as tag}
                                        <span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-full">
                                            {tag}
                                        </span>
                                    {/each}
                                </div>
                                
                                <!-- Keywords -->
                                {#if skill.trigger.keywords && skill.trigger.keywords.length > 0}
                                    <div class="pt-3 border-t border-slate-100 dark:border-slate-800">
                                        <p class="text-xs text-slate-400 mb-1">触发关键词</p>
                                        <div class="flex flex-wrap gap-1">
                                            {#each skill.trigger.keywords.slice(0, 3) as keyword}
                                                <span class="px-2 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 text-xs rounded">
                                                    {keyword}
                                                </span>
                                            {/each}
                                            {#if skill.trigger.keywords.length > 3}
                                                <span class="text-xs text-slate-400">+{skill.trigger.keywords.length - 3}</span>
                                            {/if}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
                
                {#if filteredSkills.length === 0}
                    <div class="text-center py-16">
                        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Puzzle class="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">暂无技能</h3>
                        <p class="text-slate-500 dark:text-slate-400 mb-4">创建你的第一个认知工具技能</p>
                        <button 
                            onclick={handleCreate}
                            class="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors"
                        >
                            <Plus class="w-4 h-4" />
                            新建技能
                        </button>
                    </div>
                {/if}
            </div>
        {:else}
            <!-- 编辑面板 -->
            <div class="max-w-3xl mx-auto">
                <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
                    <!-- Header -->
                    <div class="p-6 border-b border-slate-200 dark:border-slate-800">
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-bold text-slate-900 dark:text-white">
                                {isCreating ? '新建技能' : '编辑技能'}
                            </h2>
                            <button 
                                onclick={resetForm}
                                class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <X class="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    
                    <!-- Form -->
                    <div class="p-6 space-y-6">
                        <!-- 名称 -->
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                名称 <span class="text-red-500">*</span>
                            </label>
                            <input 
                                type="text" 
                                bind:value={formName}
                                placeholder="例如：拆问题、摆天平"
                                class="input-base"
                            />
                        </div>
                        
                        <!-- 一句话说明 -->
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                一句话说明
                            </label>
                            <input 
                                type="text" 
                                bind:value={formOneLiner}
                                placeholder="用一句话描述这个技能的作用"
                                class="input-base"
                            />
                        </div>
                        
                        <!-- 类型选择 -->
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                类型
                            </label>
                            <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
                                {#each skillTypes as type}
                                    <button 
                                        onclick={() => formType = type.value}
                                        class="p-3 rounded-xl border-2 transition-all text-center {formType === type.value ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}"
                                    >
                                        <div class="text-2xl mb-1">{type.value === 'analysis' ? '🔍' : type.value === 'quantitative' ? '📊' : type.value === 'evaluation' ? '⚖️' : type.value === 'exploration' ? '💡' : '✅'}</div>
                                        <div class="text-xs font-medium text-slate-700 dark:text-slate-300">{type.label}</div>
                                    </button>
                                {/each}
                            </div>
                        </div>
                        
                        <!-- 描述 -->
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                详细描述 <span class="text-red-500">*</span>
                            </label>
                            <textarea 
                                bind:value={formDescription}
                                rows="3"
                                placeholder="详细描述这个技能的功能和使用场景..."
                                class="input-base resize-none"
                            ></textarea>
                        </div>
                        
                        <!-- 触发关键词 -->
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                触发关键词 <span class="text-slate-400 text-xs">(逗号分隔)</span>
                            </label>
                            <input 
                                type="text" 
                                bind:value={formTriggerKeywords}
                                placeholder="例如：问题太多, 理不清, 不知道从哪开始"
                                class="input-base"
                            />
                        </div>
                        
                        <!-- 标签 -->
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                标签 <span class="text-slate-400 text-xs">(逗号分隔)</span>
                            </label>
                            <input 
                                type="text" 
                                bind:value={formTags}
                                placeholder="例如：拆解, 分析, 优先级"
                                class="input-base"
                            />
                        </div>
                        
                        <!-- 输出模板 -->
                        <div class="space-y-2">
                            <label class="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Code class="w-4 h-4 text-teal-500" />
                                输出模板 <span class="text-red-500">*</span>
                            </label>
                            <textarea 
                                bind:value={formOutputTemplate}
                                rows="8"
                                placeholder="定义技能的输出格式..."
                                class="input-base font-mono text-sm resize-none"
                            ></textarea>
                        </div>
                        
                        <!-- 视觉配置 -->
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    图标
                                </label>
                                <div class="flex flex-wrap gap-2">
                                    {#each iconOptions as icon}
                                        <button 
                                            onclick={() => formIcon = icon}
                                            class="w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all {formIcon === icon ? 'bg-teal-100 dark:bg-teal-900/30 ring-2 ring-teal-500' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'}"
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
                                            class="w-10 h-10 rounded-lg transition-all hover:scale-110 {formColor === color ? 'ring-2 ring-offset-2 ring-teal-500' : ''}"
                                            style="background-color: {color}"
                                        ></button>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="p-6 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                        <button 
                            onclick={handleSave}
                            disabled={!formName || !formDescription || !formOutputTemplate}
                            class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save class="w-4 h-4" />
                            {isCreating ? '创建' : '保存'}
                        </button>
                        <button 
                            onclick={resetForm}
                            class="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            取消
                        </button>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .input-base {
        @apply w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400;
    }
</style>
