<script lang="ts">
    import { personaStore, type AbstractPersona, type PersonaMatrix } from '$lib/persona';
    import { DEFAULT_PERSONA_MATRIX } from '$lib/persona/types';
    import { skillRegistry } from '$lib/skills/registry';
    import type { SkillDefinition } from '$lib/skills/types';
    import {
        Users,
        Plus,
        Save,
        Trash2,
        Copy,
        Upload,
        Image,
        Sparkles,
        Settings,
        Brain,
        Puzzle,
        MessageSquare,
        Target,
        ChevronRight,
        X,
        Download,
        Upload as UploadIcon,
        Palette,
        Code,
        User,
        Shield,
        Zap,
        XCircle,
        Check,
        Info,
        ExternalLink,
        MoreVertical,
        Search,
        Filter
    } from 'lucide-svelte';
    import { fade, slide, fly } from 'svelte/transition';
    
    // 获取所有可用技能
    const allSkills: SkillDefinition[] = skillRegistry.getAll();
    
    // 当前视图模式
    let viewMode: 'grid' | 'list' = $state('grid');
    let searchQuery = $state('');
    let filterTag = $state('');
    
    // 表单状态
    let formName = $state('');
    let formRoleSetting = $state('');
    let formPersonalIntroduction = $state('');
    let formPersonalityTags = $state('');
    let formSystemPrompt = $state('');
    let formBackground = $state('');
    let formOpeningGreeting = $state('');
    
    // 人格矩阵
    let formRationality = $state(5);
    let formCreativity = $state(5);
    let formEmpathy = $state(5);
    let formOpenness = $state(5);
    let formDominance = $state(5);
    let formStability = $state(5);
    let formMbti = $state('');
    let formCommStyle = $state('direct');
    let formExpressionStyle = $state('concise');
    let formEmotionalTone = $state('neutral');
    
    // 视觉配置
    let formAvatarUrl = $state('');
    let formPrimaryColor = $state('#6366F1');
    let formAvatarShape = $state<'circle' | 'square' | 'rounded' | 'hexagon'>('circle');
    
    // 技能绑定
    let formSkills: { skillId: string; proficiency: number; autoActivate: boolean }[] = $state([]);
    
    // 高级设置
    let formTemperature = $state(0.7);
    
    // 面板状态
    let isEditing = $state(false);
    let isCreating = $state(false);
    let editingId = $state<string | null>(null);
    let showSkillPicker = $state(false);
    let activeTab = $state<'basic' | 'matrix' | 'skills' | 'prompt' | 'visual'>('basic');
    
    // 图片上传
    let fileInput: HTMLInputElement;
    let isUploading = $state(false);
    
    // 可选颜色
    const colorOptions = [
        '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B',
        '#22C55E', '#14B8A6', '#0EA5E9', '#3B82F6', '#6B7280'
    ];
    
    // MBTI 选项
    const mbtiOptions = ['', 'INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP',
        'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];
    
    // 沟通风格选项
    const commStyleOptions = [
        { value: 'direct', label: '直接了当 (Direct)', desc: '简洁明确，有话直说' },
        { value: 'diplomatic', label: '委婉圆滑 (Diplomatic)', desc: '注意措辞，温和表达' },
        { value: 'analytical', label: '分析严谨 (Analytical)', desc: '数据驱动，逻辑清晰' },
        { value: 'supportive', label: '支持鼓励 (Supportive)', desc: '情感支持，正向反馈' },
        { value: 'socratic', label: '提问引导 (Socratic)', desc: '通过提问启发思考' },
        { value: 'casual', label: '轻松随意 (Casual)', desc: '像朋友聊天，自然亲切' }
    ];
    
    // 表达风格选项
    const expressionStyleOptions = [
        { value: 'concise', label: '简洁精炼' },
        { value: 'detailed', label: '详细全面' },
        { value: 'narrative', label: '叙事风格' },
        { value: 'bullet', label: '要点清单' }
    ];
    
    // 情感倾向选项
    const emotionalToneOptions = [
        { value: 'neutral', label: '中性客观' },
        { value: 'warm', label: '温暖友好' },
        { value: 'humorous', label: '幽默风趣' },
        { value: 'serious', label: '严肃认真' },
        { value: 'optimistic', label: '积极乐观' },
        { value: 'cautious', label: '谨慎稳健' }
    ];
    
    // 过滤后的人格列表
    let filteredPersonas = $derived.by(() => {
        let list = personaStore.allPersonas;
        
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(p => 
                p.name.toLowerCase().includes(q) ||
                p.roleSetting.toLowerCase().includes(q) ||
                p.personalIntroduction.toLowerCase().includes(q) ||
                p.personalityTags.some(t => t.toLowerCase().includes(q))
            );
        }
        
        if (filterTag) {
            list = list.filter(p => p.personalityTags.includes(filterTag));
        }
        
        return list;
    });
    
    // 所有标签
    let allTags = $derived.by(() => {
        const tags = new Set<string>();
        for (const p of personaStore.allPersonas) {
            for (const t of p.personalityTags) {
                tags.add(t);
            }
        }
        return Array.from(tags).sort();
    });
    
    // 重置表单
    function resetForm() {
        formName = '';
        formRoleSetting = '';
        formPersonalIntroduction = '';
        formPersonalityTags = '';
        formSystemPrompt = '';
        formBackground = '';
        formOpeningGreeting = '';
        
        formRationality = 5;
        formCreativity = 5;
        formEmpathy = 5;
        formOpenness = 5;
        formDominance = 5;
        formStability = 5;
        formMbti = '';
        formCommStyle = 'direct';
        formExpressionStyle = 'concise';
        formEmotionalTone = 'neutral';
        
        formAvatarUrl = '';
        formPrimaryColor = '#6366F1';
        formAvatarShape = 'circle';
        
        formSkills = [];
        formTemperature = 0.7;
        
        isEditing = false;
        isCreating = false;
        editingId = null;
    }
    
    // 开始创建
    function handleCreate() {
        resetForm();
        isCreating = true;
        isEditing = true;
    }
    
    // 开始编辑
    function handleEdit(persona: AbstractPersona) {
        formName = persona.name;
        formRoleSetting = persona.roleSetting;
        formPersonalIntroduction = persona.personalIntroduction;
        formPersonalityTags = persona.personalityTags.join(', ');
        formSystemPrompt = persona.systemPrompt;
        formBackground = persona.background || '';
        formOpeningGreeting = persona.openingGreeting || '';
        
        formRationality = persona.personaMatrix.rationality;
        formCreativity = persona.personaMatrix.creativity;
        formEmpathy = persona.personaMatrix.empathy;
        formOpenness = persona.personaMatrix.openness;
        formDominance = persona.personaMatrix.dominance;
        formStability = persona.personaMatrix.stability;
        formMbti = persona.personaMatrix.mbti || '';
        formCommStyle = persona.personaMatrix.communicationStyle;
        formExpressionStyle = persona.personaMatrix.expressionStyle;
        formEmotionalTone = persona.personaMatrix.emotionalTone;
        
        formAvatarUrl = persona.visual.avatarUrl || '';
        formPrimaryColor = persona.visual.primaryColor;
        formAvatarShape = persona.visual.avatarShape;
        
        formSkills = persona.personalSkills.map(s => ({
            skillId: s.skillId,
            proficiency: s.proficiency,
            autoActivate: s.autoActivate
        }));
        
        formTemperature = persona.config?.temperature || 0.7;
        
        editingId = persona.id;
        isEditing = true;
        isCreating = false;
    }
    
    // 保存
    function handleSave() {
        if (!formName || !formRoleSetting || !formSystemPrompt) return;
        
        const personaData: Partial<AbstractPersona> = {
            name: formName,
            roleSetting: formRoleSetting,
            personalIntroduction: formPersonalIntroduction,
            personalityTags: formPersonalityTags.split(',').map(t => t.trim()).filter(t => t),
            systemPrompt: formSystemPrompt,
            background: formBackground,
            openingGreeting: formOpeningGreeting,
            personaMatrix: {
                rationality: formRationality,
                creativity: formCreativity,
                empathy: formEmpathy,
                openness: formOpenness,
                dominance: formDominance,
                stability: formStability,
                mbti: formMbti || undefined,
                communicationStyle: formCommStyle as any,
                expressionStyle: formExpressionStyle as any,
                emotionalTone: formEmotionalTone as any
            },
            visual: {
                avatarUrl: formAvatarUrl,
                primaryColor: formPrimaryColor,
                avatarShape: formAvatarShape,
                gradient: `from-[${formPrimaryColor}] to-purple-600`
            },
            config: {
                temperature: formTemperature
            },
            personalSkills: formSkills.map((s, i) => ({
                skillId: s.skillId,
                proficiency: s.proficiency,
                priority: i + 1,
                autoActivate: s.autoActivate
            }))
        };
        
        if (isCreating) {
            personaStore.createPersona(personaData);
        } else if (editingId) {
            personaStore.updatePersona(editingId, personaData);
        }
        
        resetForm();
    }
    
    // 删除
    function handleDelete(id: string) {
        if (confirm('确定要删除这个抽象人格吗？此操作不可恢复。')) {
            personaStore.deletePersona(id);
            if (editingId === id) {
                resetForm();
            }
        }
    }
    
    // 复制
    function handleDuplicate(id: string) {
        personaStore.duplicatePersona(id);
    }
    
    // 导出
    function handleExport(persona: AbstractPersona) {
        const data = JSON.stringify(persona, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${persona.name.replace(/\s+/g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // 图片上传处理
    async function handleImageUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        
        isUploading = true;
        
        try {
            // 将图片转换为 Base64
            const reader = new FileReader();
            reader.onload = (e) => {
                formAvatarUrl = e.target?.result as string;
                isUploading = false;
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Upload failed:', error);
            isUploading = false;
        }
    }
    
    // 触发文件选择
    function triggerFileInput() {
        fileInput?.click();
    }
    
    // 添加技能
    function addSkill(skillId: string) {
        if (!formSkills.find(s => s.skillId === skillId)) {
            formSkills = [...formSkills, { skillId, proficiency: 5, autoActivate: false }];
        }
        showSkillPicker = false;
    }
    
    // 移除技能
    function removeSkill(skillId: string) {
        formSkills = formSkills.filter(s => s.skillId !== skillId);
    }
    
    // 获取技能名称
    function getSkillName(skillId: string): string {
        return allSkills.find(s => s.id === skillId)?.name || skillId;
    }
    
    // 获取渐变样式
    function getGradient(color: string): string {
        return `linear-gradient(135deg, ${color} 0%, ${adjustColor(color, -30)} 100%)`;
    }
    
    // 调整颜色亮度
    function adjustColor(hex: string, amount: number): string {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + amount));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
        const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    
    // 头像形状样式
    function getShapeStyle(shape: string): string {
        switch(shape) {
            case 'circle': return 'rounded-full';
            case 'square': return 'rounded-none';
            case 'rounded': return 'rounded-2xl';
            case 'hexagon': return 'clip-path-hexagon';
            default: return 'rounded-full';
        }
    }
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <!-- Logo & Title -->
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <Users class="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 class="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                            人格工坊
                        </h1>
                        <p class="text-xs text-slate-500 dark:text-slate-400">抽象人格 Agent 管理中心</p>
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
                            placeholder="搜索人格..." 
                            class="w-64 pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                        />
                    </div>
                    
                    <!-- Create Button -->
                    <button 
                        onclick={handleCreate}
                        class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus class="w-4 h-4" />
                        <span class="hidden sm:inline">新建人格</span>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {#if !isEditing}
            <!-- 视图：人格列表 -->
            <div class="space-y-6">
                <!-- Filters -->
                <div class="flex flex-wrap items-center gap-3">
                    <Filter class="w-4 h-4 text-slate-400" />
                    <button 
                        onclick={() => filterTag = ''}
                        class="px-3 py-1.5 rounded-full text-sm font-medium transition-all {filterTag === '' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}"
                    >
                        全部
                    </button>
                    {#each allTags.slice(0, 8) as tag}
                        <button 
                            onclick={() => filterTag = tag}
                            class="px-3 py-1.5 rounded-full text-sm font-medium transition-all {filterTag === tag ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}"
                        >
                            {tag}
                        </button>
                    {/each}
                </div>

                <!-- Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {#each filteredPersonas as persona (persona.id)}
                        <div 
                            class="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300"
                            transition:fly={{ y: 20, duration: 300 }}
                        >
                            <!-- Card Header -->
                            <div class="relative h-24 bg-gradient-to-br {persona.visual.gradient || 'from-violet-500 to-purple-600'}">
                                <!-- Actions -->
                                <div class="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onclick={() => handleEdit(persona)}
                                        class="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                                        title="编辑"
                                    >
                                        <Settings class="w-4 h-4" />
                                    </button>
                                    <button 
                                        onclick={() => handleDuplicate(persona.id)}
                                        class="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                                        title="复制"
                                    >
                                        <Copy class="w-4 h-4" />
                                    </button>
                                    {#if !persona.isBuiltIn}
                                        <button 
                                            onclick={() => handleDelete(persona.id)}
                                            class="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-red-500 transition-colors"
                                            title="删除"
                                        >
                                            <Trash2 class="w-4 h-4" />
                                        </button>
                                    {/if}
                                </div>
                                
                                <!-- Badge -->
                                {#if persona.isBuiltIn}
                                    <span class="absolute top-3 left-3 px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full font-medium">
                                        预设
                                    </span>
                                {/if}
                            </div>
                            
                            <!-- Card Body -->
                            <div class="p-5 -mt-10 relative">
                                <!-- Avatar -->
                                <div class="flex items-end gap-4 mb-4">
                                    {#if persona.visual.avatarUrl}
                                        <img 
                                            src={persona.visual.avatarUrl} 
                                            alt={persona.name}
                                            class="w-16 h-16 {getShapeStyle(persona.visual.avatarShape)} object-cover border-4 border-white dark:border-slate-900 shadow-lg"
                                        />
                                    {:else}
                                        <div 
                                            class="w-16 h-16 {getShapeStyle(persona.visual.avatarShape)} flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-lg"
                                            style="background: {getGradient(persona.visual.primaryColor)}"
                                        >
                                            <User class="w-8 h-8 text-white/80" />
                                        </div>
                                    {/if}
                                    <div class="flex-1 min-w-0 pb-1">
                                        <h3 class="font-bold text-lg text-slate-900 dark:text-white truncate">
                                            {persona.name}
                                        </h3>
                                        <p class="text-sm text-slate-500 dark:text-slate-400 truncate">
                                            {persona.roleSetting}
                                        </p>
                                    </div>
                                </div>
                                
                                <!-- Introduction -->
                                <p class="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4">
                                    {persona.personalIntroduction}
                                </p>
                                
                                <!-- Tags -->
                                <div class="flex flex-wrap gap-1.5 mb-4">
                                    {#each persona.personalityTags.slice(0, 4) as tag}
                                        <span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-full">
                                            {tag}
                                        </span>
                                    {/each}
                                    {#if persona.personalityTags.length > 4}
                                        <span class="px-2 py-0.5 text-slate-400 text-xs">
                                            +{persona.personalityTags.length - 4}
                                        </span>
                                    {/if}
                                </div>
                                
                                <!-- Stats -->
                                <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div class="flex items-center gap-4 text-xs text-slate-400">
                                        <span class="flex items-center gap-1">
                                            <Puzzle class="w-3.5 h-3.5" />
                                            {persona.personalSkills.length} 技能
                                        </span>
                                    </div>
                                    <button 
                                        onclick={() => handleExport(persona)}
                                        class="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 flex items-center gap-1"
                                    >
                                        <Download class="w-3.5 h-3.5" />
                                        导出
                                    </button>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
                
                {#if filteredPersonas.length === 0}
                    <div class="text-center py-16">
                        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Users class="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">暂无抽象人格</h3>
                        <p class="text-slate-500 dark:text-slate-400 mb-4">创建你的第一个抽象人格 Agent</p>
                        <button 
                            onclick={handleCreate}
                            class="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-500 transition-colors"
                        >
                            <Plus class="w-4 h-4" />
                            新建人格
                        </button>
                    </div>
                {/if}
            </div>
        {:else}
            <!-- 视图：编辑面板 -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- 左侧：预览 -->
                <div class="lg:col-span-1">
                    <div class="sticky top-24">
                        <!-- 预览卡片 -->
                        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
                            <div class="h-20 bg-gradient-to-br {formAvatarUrl ? 'from-slate-600 to-slate-800' : `from-[${formPrimaryColor}] to-[${adjustColor(formPrimaryColor, -30)}]`}">
                                {#if formAvatarUrl}
                                    <img src={formAvatarUrl} alt="Avatar" class="w-full h-full object-cover opacity-30" />
                                {/if}
                            </div>
                            <div class="p-5 -mt-10 relative">
                                <div class="flex items-end gap-4 mb-4">
                                    {#if formAvatarUrl}
                                        <img 
                                            src={formAvatarUrl} 
                                            alt="Avatar"
                                            class="w-16 h-16 {getShapeStyle(formAvatarShape)} object-cover border-4 border-white dark:border-slate-900 shadow-lg"
                                        />
                                    {:else}
                                        <div 
                                            class="w-16 h-16 {getShapeStyle(formAvatarShape)} flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-lg"
                                            style="background: linear-gradient(135deg, {formPrimaryColor} 0%, {adjustColor(formPrimaryColor, -30)} 100%)"
                                        >
                                            <User class="w-8 h-8 text-white/80" />
                                        </div>
                                    {/if}
                                    <div class="flex-1 min-w-0">
                                        <h3 class="font-bold text-lg text-slate-900 dark:text-white truncate">
                                            {formName || '未命名人格'}
                                        </h3>
                                        <p class="text-sm text-slate-500 dark:text-slate-400 truncate">
                                            {formRoleSetting || '角色设定'}
                                        </p>
                                    </div>
                                </div>
                                
                                <p class="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 mb-4">
                                    {formPersonalIntroduction || '暂无简介'}
                                </p>
                                
                                <div class="flex flex-wrap gap-1.5">
                                    {#each formPersonalityTags.split(',').filter(t => t.trim()) as tag}
                                        <span class="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs rounded-full">
                                            {tag.trim()}
                                        </span>
                                    {/each}
                                </div>
                            </div>
                        </div>
                        
                        <!-- 快捷操作 -->
                        <div class="mt-4 flex gap-2">
                            <button 
                                onclick={handleSave}
                                disabled={!formName || !formRoleSetting || !formSystemPrompt}
                                class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                
                <!-- 右侧：编辑表单 -->
                <div class="lg:col-span-2">
                    <!-- Tabs -->
                    <div class="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
                        {#each [
                            { id: 'basic', label: '基础信息', icon: User },
                            { id: 'matrix', label: '人格矩阵', icon: Brain },
                            { id: 'skills', label: '技能绑定', icon: Puzzle },
                            { id: 'prompt', label: '系统提示词', icon: MessageSquare },
                            { id: 'visual', label: '视觉', icon: Palette }
                        ] as tab}
                            <button 
                                onclick={() => activeTab = tab.id as any}
                                class="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all {activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}"
                            >
                                <tab.icon class="w-4 h-4" />
                                <span class="hidden sm:inline">{tab.label}</span>
                            </button>
                        {/each}
                    </div>
                    
                    <!-- Tab Content -->
                    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6">
                        {#if activeTab === 'basic'}
                            <!-- 基础信息 -->
                            <div class="space-y-6" transition:fade>
                                <!-- 名称 -->
                                <div class="space-y-2">
                                    <label class="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                        <span class="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                                        名称 <span class="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        bind:value={formName}
                                        placeholder="例如：智慧导师、理性分析师"
                                        class="input-base"
                                    />
                                </div>
                                
                                <!-- 角色设定 -->
                                <div class="space-y-2">
                                    <label class="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                        <span class="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                                        角色设定 <span class="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        bind:value={formRoleSetting}
                                        placeholder="例如：人生导师、创意设计师"
                                        class="input-base"
                                    />
                                </div>
                                
                                <!-- 个人简介 -->
                                <div class="space-y-2">
                                    <label class="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                        <span class="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                                        个人简介
                                    </label>
                                    <textarea 
                                        bind:value={formPersonalIntroduction}
                                        rows="3"
                                        placeholder="简短描述这个抽象人格的特点和专长..."
                                        class="input-base resize-none"
                                    ></textarea>
                                </div>
                                
                                <!-- 性格标签 -->
                                <div class="space-y-2">
                                    <label class="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                        <span class="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                                        性格标签 <span class="text-slate-400 text-xs">(逗号分隔)</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        bind:value={formPersonalityTags}
                                        placeholder="例如：理性、严谨、幽默、温暖"
                                        class="input-base"
                                    />
                                </div>
                                
                                <!-- 背景故事 -->
                                <div class="space-y-2">
                                    <label class="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                        <span class="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                                        背景故事
                                    </label>
                                    <textarea 
                                        bind:value={formBackground}
                                        rows="3"
                                        placeholder="描述这个抽象人格的背景故事..."
                                        class="input-base resize-none"
                                    ></textarea>
                                </div>
                                
                                <!-- 开场白 -->
                                <div class="space-y-2">
                                    <label class="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                        <span class="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                                        开场白
                                    </label>
                                    <input 
                                        type="text" 
                                        bind:value={formOpeningGreeting}
                                        placeholder="首次对话时的问候语"
                                        class="input-base"
                                    />
                                </div>
                            </div>
                        {:else if activeTab === 'matrix'}
                            <!-- 人格矩阵 -->
                            <div class="space-y-8" transition:fade>
                                <!-- 核心维度 -->
                                <div>
                                    <h4 class="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Brain class="w-4 h-4 text-violet-500" />
                                        核心维度
                                    </h4>
                                    <div class="space-y-6">
                                        <!-- 理性 -->
                                        <div class="space-y-2">
                                            <div class="flex justify-between text-xs">
                                                <span class="text-slate-500">感性</span>
                                                <span class="font-medium text-slate-700 dark:text-slate-300">理性指数: {formRationality}</span>
                                                <span class="text-slate-500">逻辑</span>
                                            </div>
                                            <input 
                                                type="range" min="0" max="10" 
                                                bind:value={formRationality}
                                                class="w-full slider-base slider-blue"
                                            />
                                        </div>
                                        
                                        <!-- 创造 -->
                                        <div class="space-y-2">
                                            <div class="flex justify-between text-xs">
                                                <span class="text-slate-500">严谨</span>
                                                <span class="font-medium text-slate-700 dark:text-slate-300">创造指数: {formCreativity}</span>
                                                <span class="text-slate-500">发散</span>
                                            </div>
                                            <input 
                                                type="range" min="0" max="10" 
                                                bind:value={formCreativity}
                                                class="w-full slider-base slider-amber"
                                            />
                                        </div>
                                        
                                        <!-- 共情 -->
                                        <div class="space-y-2">
                                            <div class="flex justify-between text-xs">
                                                <span class="text-slate-500">冷酷</span>
                                                <span class="font-medium text-slate-700 dark:text-slate-300">共情指数: {formEmpathy}</span>
                                                <span class="text-slate-500">温暖</span>
                                            </div>
                                            <input 
                                                type="range" min="0" max="10" 
                                                bind:value={formEmpathy}
                                                class="w-full slider-base slider-rose"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- 扩展维度 -->
                                <div>
                                    <h4 class="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Target class="w-4 h-4 text-violet-500" />
                                        扩展维度
                                    </h4>
                                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div class="space-y-2">
                                            <label class="text-xs text-slate-500">开放程度</label>
                                            <input 
                                                type="range" min="0" max="10" 
                                                bind:value={formOpenness}
                                                class="w-full slider-base slider-violet"
                                            />
                                        </div>
                                        <div class="space-y-2">
                                            <label class="text-xs text-slate-500">主导性</label>
                                            <input 
                                                type="range" min="0" max="10" 
                                                bind:value={formDominance}
                                                class="w-full slider-base slider-violet"
                                            />
                                        </div>
                                        <div class="space-y-2">
                                            <label class="text-xs text-slate-500">稳定性</label>
                                            <input 
                                                type="range" min="0" max="10" 
                                                bind:value={formStability}
                                                class="w-full slider-base slider-violet"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- MBTI & 风格 -->
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div class="space-y-2">
                                        <label class="text-xs text-slate-500">MBTI 类型</label>
                                        <select bind:value={formMbti} class="input-base text-sm">
                                            {#each mbtiOptions as mbti}
                                                <option value={mbti}>{mbti || '未选择'}</option>
                                            {/each}
                                        </select>
                                    </div>
                                    <div class="space-y-2">
                                        <label class="text-xs text-slate-500">沟通风格</label>
                                        <select bind:value={formCommStyle} class="input-base text-sm">
                                            {#each commStyleOptions as style}
                                                <option value={style.value}>{style.label}</option>
                                            {/each}
                                        </select>
                                    </div>
                                    <div class="space-y-2">
                                        <label class="text-xs text-slate-500">情感倾向</label>
                                        <select bind:value={formEmotionalTone} class="input-base text-sm">
                                            {#each emotionalToneOptions as tone}
                                                <option value={tone.value}>{tone.label}</option>
                                            {/each}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        {:else if activeTab === 'skills'}
                            <!-- 技能绑定 -->
                            <div class="space-y-6" transition:fade>
                                <div class="flex items-center justify-between">
                                    <h4 class="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Puzzle class="w-4 h-4 text-violet-500" />
                                        已绑定技能
                                    </h4>
                                    <button 
                                        onclick={() => showSkillPicker = !showSkillPicker}
                                        class="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 flex items-center gap-1"
                                    >
                                        <Plus class="w-4 h-4" />
                                        添加技能
                                    </button>
                                </div>
                                
                                <!-- 已选技能列表 -->
                                {#if formSkills.length === 0}
                                    <div class="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                        <Puzzle class="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p class="text-sm text-slate-500">尚未绑定任何技能</p>
                                    </div>
                                {:else}
                                    <div class="space-y-3">
                                        {#each formSkills as skill, i}
                                            <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                                <div class="flex-1">
                                                    <span class="font-medium text-slate-900 dark:text-white">{getSkillName(skill.skillId)}</span>
                                                    <span class="text-xs text-slate-500 ml-2">ID: {skill.skillId}</span>
                                                </div>
                                                <label class="flex items-center gap-2 text-xs text-slate-500">
                                                    <input 
                                                        type="checkbox" 
                                                        bind:checked={skill.autoActivate}
                                                        class="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                                    />
                                                    自动激活
                                                </label>
                                                <button 
                                                    onclick={() => removeSkill(skill.skillId)}
                                                    class="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X class="w-4 h-4" />
                                                </button>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                                
                                <!-- 技能选择器 -->
                                {#if showSkillPicker}
                                    <div class="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2" transition:slide>
                                        <p class="text-xs text-slate-500 mb-3">点击添加技能：</p>
                                        <div class="flex flex-wrap gap-2">
                                            {#each allSkills as skill}
                                                <button 
                                                    onclick={() => addSkill(skill.id)}
                                                    class="px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-violet-500 transition-colors"
                                                >
                                                    {skill.name}
                                                </button>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {:else if activeTab === 'prompt'}
                            <!-- 系统提示词 -->
                            <div class="space-y-6" transition:fade>
                                <div class="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                                    <Info class="w-5 h-5 text-amber-500" />
                                    <p class="text-sm text-amber-700 dark:text-amber-300">
                                        这是发送给大模型的核心指令，定义了 Agent 的行为方式
                                    </p>
                                </div>
                                
                                <div class="space-y-2">
                                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Code class="w-4 h-4 text-violet-500" />
                                        系统提示词 <span class="text-red-500">*</span>
                                    </label>
                                    <textarea 
                                        bind:value={formSystemPrompt}
                                        rows="12"
                                        placeholder="你是一位... 你的核心职责是... 你应该... 你不应该..."
                                        class="input-base font-mono text-sm resize-none"
                                    ></textarea>
                                </div>
                                
                                <!-- 提示词模板 -->
                                <div class="space-y-2">
                                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        快速填充模板
                                    </label>
                                    <div class="flex flex-wrap gap-2">
                                        <button 
                                            onclick={() => formSystemPrompt += `\n\n# 指导原则\n1. `}
                                            class="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
                                        >
                                            + 指导原则
                                        </button>
                                        <button 
                                            onclick={() => formSystemPrompt += `\n\n# 沟通风格\n- `}
                                            class="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
                                        >
                                            + 沟通风格
                                        </button>
                                        <button 
                                            onclick={() => formSystemPrompt += `\n\n# 禁止行为\n- 禁止 `}
                                            class="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
                                        >
                                            + 禁止行为
                                        </button>
                                    </div>
                                </div>
                            </div>
                        {:else if activeTab === 'visual'}
                            <!-- 视觉配置 -->
                            <div class="space-y-6" transition:fade>
                                <!-- 头像上传 -->
                                <div class="space-y-2">
                                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Image class="w-4 h-4 text-violet-500" />
                                        头像图片
                                    </label>
                                    <div class="flex items-center gap-4">
                                        <button 
                                            onclick={triggerFileInput}
                                            class="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center hover:border-violet-500 transition-colors overflow-hidden"
                                        >
                                            {#if formAvatarUrl}
                                                <img src={formAvatarUrl} alt="Avatar" class="w-full h-full object-cover" />
                                            {:else}
                                                <UploadIcon class="w-8 h-8 text-slate-300" />
                                            {/if}
                                        </button>
                                        <input 
                                            type="file" 
                                            bind:this={fileInput}
                                            onchange={handleImageUpload}
                                            accept="image/*"
                                            class="hidden"
                                        />
                                        <div class="text-sm text-slate-500">
                                            <p>点击上传图片</p>
                                            <p>支持 JPG, PNG, GIF</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- 头像形状 -->
                                <div class="space-y-2">
                                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        头像形状
                                    </label>
                                    <div class="flex gap-3">
                                        {#each [
                                            { value: 'circle', label: '圆形' },
                                            { value: 'rounded', label: '圆角' },
                                            { value: 'square', label: '方形' }
                                        ] as shape}
                                            <button 
                                                onclick={() => formAvatarShape = shape.value as any}
                                                class="flex-1 py-2 px-4 rounded-xl border-2 transition-all {formAvatarShape === shape.value ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-slate-200 dark:border-slate-700'}"
                                            >
                                                <div class="w-8 h-8 mx-auto mb-1 {shape.value === 'circle' ? 'rounded-full' : shape.value === 'rounded' ? 'rounded-xl' : 'rounded-none'} bg-slate-300 dark:bg-slate-600"></div>
                                                <span class="text-xs text-slate-600 dark:text-slate-400">{shape.label}</span>
                                            </button>
                                        {/each}
                                    </div>
                                </div>
                                
                                <!-- 主题色 -->
                                <div class="space-y-2">
                                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        主题色
                                    </label>
                                    <div class="flex flex-wrap gap-2">
                                        {#each colorOptions as color}
                                            <button 
                                                onclick={() => formPrimaryColor = color}
                                                class="w-10 h-10 rounded-xl transition-all hover:scale-110 {formPrimaryColor === color ? 'ring-2 ring-offset-2 ring-violet-500' : ''}"
                                                style="background-color: {color}"
                                            ></button>
                                        {/each}
                                    </div>
                                </div>
                                
                                <!-- 高级设置 -->
                                <div class="pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                        <Zap class="w-4 h-4 text-violet-500" />
                                        高级设置
                                    </h4>
                                    <div class="space-y-4">
                                        <div class="space-y-2">
                                            <div class="flex justify-between text-xs">
                                                <span class="text-slate-500">严谨</span>
                                                <span class="font-medium text-slate-700 dark:text-slate-300">Temperature: {formTemperature}</span>
                                                <span class="text-slate-500">发散</span>
                                            </div>
                                            <input 
                                                type="range" min="0" max="1" step="0.1"
                                                bind:value={formTemperature}
                                                class="w-full slider-base slider-violet"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .input-base {
        @apply w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400;
    }
    
    .slider-base {
        @apply h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer;
    }
    
    .slider-blue {
        @apply accent-blue-500;
    }
    
    .slider-amber {
        @apply accent-amber-500;
    }
    
    .slider-rose {
        @apply accent-rose-500;
    }
    
    .slider-violet {
        @apply accent-violet-500;
    }
    
    .clip-path-hexagon {
        clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    }
</style>
