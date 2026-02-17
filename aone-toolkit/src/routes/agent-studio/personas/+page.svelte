<script lang="ts">
    import { personaStore, type AbstractPersona, type PersonaMatrix } from '$lib/persona';
    import { skillRegistry, type SkillDefinition } from '$lib/skills';
    import {
        Users,
        Plus,
        Search,
        Trash2,
        Edit2,
        Save,
        X,
        Puzzle,
        Sliders,
        Palette,
        MessageSquare,
        Target,
        Sparkles,
        ChevronDown,
        ChevronUp
    } from "lucide-svelte";
    import { fade, fly } from "svelte/transition";

    let personaSearchQuery = $state('');
    let personaFilterTag = $state('');
    let isEditingPersona = $state(false);
    let editingPersona = $state<AbstractPersona | null>(null);
    
    // 展开/折叠面板
    let showMatrix = $state(true);
    let showSkills = $state(true);
    let showVisual = $state(true);

    // Persona form - 7 大核心字段
    let formName = $state('');
    let formRoleSetting = $state('');
    let formPersonalIntro = $state('');
    let formPersonalityTags = $state('');
    let formSystemPrompt = $state('');
    
    // 人格矩阵
    let formRationality = $state(5);
    let formCreativity = $state(5);
    let formEmpathy = $state(5);
    let formOpenness = $state(5);
    let formDominance = $state(5);
    let formStability = $state(5);
    let formMbti = $state('');
    let formCommunicationStyle = $state<'direct' | 'diplomatic' | 'analytical' | 'supportive' | 'socratic' | 'casual'>('direct');
    let formExpressionStyle = $state<'concise' | 'detailed' | 'narrative' | 'bullet'>('concise');
    let formEmotionalTone = $state<'neutral' | 'warm' | 'humorous' | 'serious' | 'optimistic' | 'cautious'>('neutral');
    
    // 视觉配置
    let formPrimaryColor = $state('#8B5CF6');
    let formAvatarShape = $state<'circle' | 'square' | 'rounded' | 'hexagon'>('circle');
    
    // 绑定技能
    let formSkillBindings = $state<{skillId: string; proficiency: number; priority: number; autoActivate: boolean}[]>([]);
    let availableSkills = $derived(skillRegistry.getAll());

    let allPersonas = $derived(personaStore.allPersonas);
    let allPersonaTags = $derived.by(() => {
        const tags = new Set<string>();
        for (const p of allPersonas) {
            for (const t of p.personalityTags) {
                tags.add(t);
            }
        }
        return Array.from(tags).sort();
    });

    let filteredPersonas = $derived.by(() => {
        let list = allPersonas;
        if (personaSearchQuery) {
            const q = personaSearchQuery.toLowerCase();
            list = list.filter(p => 
                p.name.toLowerCase().includes(q) ||
                p.roleSetting.toLowerCase().includes(q) ||
                p.personalIntroduction.toLowerCase().includes(q)
            );
        }
        if (personaFilterTag) {
            list = list.filter(p => p.personalityTags.includes(personaFilterTag));
        }
        return list;
    });

    function resetForm() {
        formName = '';
        formRoleSetting = '';
        formPersonalIntro = '';
        formPersonalityTags = '';
        formSystemPrompt = '';
        formRationality = 5;
        formCreativity = 5;
        formEmpathy = 5;
        formOpenness = 5;
        formDominance = 5;
        formStability = 5;
        formMbti = '';
        formCommunicationStyle = 'direct';
        formExpressionStyle = 'concise';
        formEmotionalTone = 'neutral';
        formPrimaryColor = '#8B5CF6';
        formAvatarShape = 'circle';
        formSkillBindings = [];
    }

    function handleCreatePersona() {
        resetForm();
        editingPersona = null;
        isEditingPersona = true;
    }

    function handleEditPersona(persona: AbstractPersona) {
        formName = persona.name;
        formRoleSetting = persona.roleSetting;
        formPersonalIntro = persona.personalIntroduction;
        formPersonalityTags = persona.personalityTags.join(', ');
        formSystemPrompt = persona.systemPrompt;
        
        // 人格矩阵
        formRationality = persona.personaMatrix.rationality;
        formCreativity = persona.personaMatrix.creativity;
        formEmpathy = persona.personaMatrix.empathy;
        formOpenness = persona.personaMatrix.openness;
        formDominance = persona.personaMatrix.dominance;
        formStability = persona.personaMatrix.stability;
        formMbti = persona.personaMatrix.mbti || '';
        formCommunicationStyle = persona.personaMatrix.communicationStyle || 'direct';
        formExpressionStyle = persona.personaMatrix.expressionStyle || 'concise';
        formEmotionalTone = persona.personaMatrix.emotionalTone || 'neutral';
        
        // 视觉
        formPrimaryColor = persona.visual.primaryColor;
        formAvatarShape = persona.visual.avatarShape || 'circle';
        
        // 技能
        formSkillBindings = (persona.personalSkills || []).map(s => ({
            skillId: s.skillId,
            proficiency: s.proficiency,
            priority: s.priority,
            autoActivate: s.autoActivate
        }));
        
        editingPersona = persona;
        isEditingPersona = true;
    }

    function handleSavePersona() {
        if (!formName || !formRoleSetting) return;
        
        const tags = formPersonalityTags.split(',').map(t => t.trim()).filter(t => t);
        
        const matrix: PersonaMatrix = {
            rationality: formRationality,
            creativity: formCreativity,
            empathy: formEmpathy,
            openness: formOpenness,
            dominance: formDominance,
            stability: formStability,
            mbti: formMbti || undefined,
            communicationStyle: formCommunicationStyle,
            expressionStyle: formExpressionStyle,
            emotionalTone: formEmotionalTone
        };
        
        if (editingPersona) {
            personaStore.updatePersona(editingPersona.id, {
                name: formName,
                roleSetting: formRoleSetting,
                personalIntroduction: formPersonalIntro,
                personalityTags: tags,
                systemPrompt: formSystemPrompt,
                personaMatrix: matrix,
                personalSkills: formSkillBindings,
                visual: {
                    ...editingPersona.visual,
                    primaryColor: formPrimaryColor,
                    avatarShape: formAvatarShape
                }
            });
        } else {
            personaStore.addPersona({
                id: `persona_${Date.now()}`,
                name: formName,
                roleSetting: formRoleSetting,
                personalIntroduction: formPersonalIntro,
                personalityTags: tags,
                personalSkills: formSkillBindings,
                personaMatrix: matrix,
                systemPrompt: formSystemPrompt,
                visual: {
                    avatarUrl: '',
                    avatarShape: formAvatarShape,
                    primaryColor: formPrimaryColor,
                    gradient: 'from-violet-500 to-purple-600'
                },
                version: '1.0.0',
                isBuiltIn: false,
                isPublic: false,
                usageCount: 0
            });
        }
        
        isEditingPersona = false;
    }

    function handleDeletePersona(id: string) {
        if (confirm('确定要删除这个人格吗？')) {
            personaStore.deletePersona(id);
        }
    }

    // 技能绑定操作
    function addSkillBinding() {
        if (availableSkills.length > 0) {
            formSkillBindings = [...formSkillBindings, {
                skillId: availableSkills[0].id,
                proficiency: 5,
                priority: formSkillBindings.length + 1,
                autoActivate: false
            }];
        }
    }

    function removeSkillBinding(index: number) {
        formSkillBindings = formSkillBindings.filter((_, i) => i !== index);
    }

    function getSkillById(id: string): SkillDefinition | undefined {
        return skillRegistry.getById(id);
    }

    // 颜色预设
    const colorPresets = [
        '#8B5CF6', // violet
        '#3B82F6', // blue
        '#0EA5E9', // sky
        '#10B981', // emerald
        '#22C55E', // green
        '#F59E0B', // amber
        '#F97316', // orange
        '#EF4444', // red
        '#EC4899', // pink
        '#6366F1', // indigo
    ];
</script>

<div class="space-y-6" in:fade={{ duration: 200 }}>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h2 class="text-2xl font-bold text-slate-900 dark:text-white">人格工坊</h2>
            <p class="text-slate-500 dark:text-slate-400">创建和管理抽象人格 Agent</p>
        </div>
        <button 
            onclick={handleCreatePersona}
            class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
        >
            <Plus class="w-4 h-4" />
            新建人格
        </button>
    </div>

    <!-- Search & Filters -->
    {#if !isEditingPersona}
    <div class="flex flex-col md:flex-row gap-4">
        <div class="relative flex-1 max-w-md">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
                type="text" 
                bind:value={personaSearchQuery}
                placeholder="搜索人格..." 
                class="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
            />
        </div>
        <div class="flex flex-wrap gap-2">
            <button 
                onclick={() => personaFilterTag = ''}
                class="px-3 py-1.5 rounded-full text-sm font-medium transition-all {personaFilterTag === '' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}"
            >
                全部
            </button>
            {#each allPersonaTags.slice(0, 6) as tag}
                <button 
                    onclick={() => personaFilterTag = tag}
                    class="px-3 py-1.5 rounded-full text-sm font-medium transition-all {personaFilterTag === tag ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}"
                >
                    {tag}
                </button>
            {/each}
        </div>
    </div>
    {/if}

    {#if isEditingPersona}
        <!-- ============== 完整编辑表单 ============== -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" transition:fly={{ y: 20, duration: 300 }}>
            <!-- 头部 -->
            <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10">
                <h3 class="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles class="w-5 h-5 text-violet-500" />
                    {editingPersona ? '编辑人格' : '新建人格'} - 7 大核心字段
                </h3>
            </div>
            
            <div class="p-6 space-y-6">
                <!-- ============== 1. 名称 & 2. 角色设定 ============== -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <span class="w-5 h-5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold">1</span>
                            名称 <span class="text-red-500">*</span>
                        </label>
                        <input type="text" bind:value={formName} placeholder="例如：智者导师" class="input-base" />
                    </div>
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <span class="w-5 h-5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold">2</span>
                            角色设定 <span class="text-red-500">*</span>
                        </label>
                        <input type="text" bind:value={formRoleSetting} placeholder="例如：人生导师与智者" class="input-base" />
                    </div>
                </div>
                
                <!-- ============== 3. 个人简介 ============== -->
                <div class="space-y-2">
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span class="w-5 h-5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold">3</span>
                        个人简介
                    </label>
                    <textarea bind:value={formPersonalIntro} rows="3" placeholder="描述这个人格的特点、背景故事..." class="input-base resize-none"></textarea>
                </div>
                
                <!-- ============== 4. 性格标签 ============== -->
                <div class="space-y-2">
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span class="w-5 h-5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold">4</span>
                        性格标签 <span class="text-slate-400">(逗号分隔)</span>
                    </label>
                    <input type="text" bind:value={formPersonalityTags} placeholder="例如：智慧, 耐心, 启发性, 温和" class="input-base" />
                    {#if formPersonalityTags}
                        <div class="flex flex-wrap gap-1 mt-2">
                            {#each formPersonalityTags.split(',').filter(t => t.trim()) as tag}
                                <span class="px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs rounded-full">
                                    {tag.trim()}
                                </span>
                            {/each}
                        </div>
                    {/if}
                </div>
                
                <!-- ============== 5. 个人技能 ============== -->
                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <label class="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <span class="w-5 h-5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold">5</span>
                            个人技能
                        </label>
                        <button onclick={addSkillBinding} class="text-sm text-violet-600 hover:text-violet-500 flex items-center gap-1">
                            <Plus class="w-4 h-4" /> 添加技能
                        </button>
                    </div>
                    
                    {#if formSkillBindings.length > 0}
                        <div class="space-y-2 mt-2">
                            {#each formSkillBindings as binding, index}
                                {@const skill = getSkillById(binding.skillId)}
                                <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <select 
                                        bind:value={binding.skillId}
                                        class="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                    >
                                        {#each availableSkills as s}
                                            <option value={s.id}>{s.name} - {s.oneLiner}</option>
                                        {/each}
                                    </select>
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs text-slate-500">熟练度</span>
                                        <input 
                                            type="range" 
                                            bind:value={binding.proficiency} 
                                            min="1" max="10" 
                                            class="w-20"
                                        />
                                        <span class="text-xs text-slate-600 w-6">{binding.proficiency}</span>
                                    </div>
                                    <label class="flex items-center gap-1 text-xs">
                                        <input type="checkbox" bind:checked={binding.autoActivate} class="rounded" />
                                        自动
                                    </label>
                                    <button onclick={() => removeSkillBinding(index)} class="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded">
                                        <Trash2 class="w-4 h-4 text-red-500" />
                                    </button>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <p class="text-sm text-slate-400 italic">暂无绑定技能</p>
                    {/if}
                </div>
                
                <!-- ============== 6. 人格矩阵 (可折叠) ============== -->
                <div class="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <button 
                        onclick={() => showMatrix = !showMatrix}
                        class="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <label class="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <span class="w-5 h-5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold">6</span>
                            人格矩阵
                        </label>
                        {#if showMatrix}
                            <ChevronUp class="w-4 h-4 text-slate-500" />
                        {:else}
                            <ChevronDown class="w-4 h-4 text-slate-500" />
                        {/if}
                    </button>
                    
                    {#if showMatrix}
                        <div class="p-4 space-y-4">
                            <!-- 核心维度滑块 -->
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div class="space-y-2">
                                    <div class="flex justify-between text-sm">
                                        <span class="text-slate-600 dark:text-slate-400">理性</span>
                                        <span class="font-medium">{formRationality}/10</span>
                                    </div>
                                    <input type="range" bind:value={formRationality} min="0" max="10" class="w-full accent-violet-500" />
                                    <div class="flex justify-between text-xs text-slate-400">
                                        <span>感性</span>
                                        <span>理性</span>
                                    </div>
                                </div>
                                <div class="space-y-2">
                                    <div class="flex justify-between text-sm">
                                        <span class="text-slate-600 dark:text-slate-400">创意</span>
                                        <span class="font-medium">{formCreativity}/10</span>
                                    </div>
                                    <input type="range" bind:value={formCreativity} min="0" max="10" class="w-full accent-violet-500" />
                                    <div class="flex justify-between text-xs text-slate-400">
                                        <span>严谨</span>
                                        <span>创意</span>
                                    </div>
                                </div>
                                <div class="space-y-2">
                                    <div class="flex justify-between text-sm">
                                        <span class="text-slate-600 dark:text-slate-400">共情</span>
                                        <span class="font-medium">{formEmpathy}/10</span>
                                    </div>
                                    <input type="range" bind:value={formEmpathy} min="0" max="10" class="w-full accent-violet-500" />
                                    <div class="flex justify-between text-xs text-slate-400">
                                        <span>冷酷</span>
                                        <span>共情</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 扩展维度 -->
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div class="space-y-2">
                                    <div class="flex justify-between text-sm">
                                        <span class="text-slate-600 dark:text-slate-400">开放</span>
                                        <span class="font-medium">{formOpenness}/10</span>
                                    </div>
                                    <input type="range" bind:value={formOpenness} min="0" max="10" class="w-full accent-violet-500" />
                                </div>
                                <div class="space-y-2">
                                    <div class="flex justify-between text-sm">
                                        <span class="text-slate-600 dark:text-slate-400">主导</span>
                                        <span class="font-medium">{formDominance}/10</span>
                                    </div>
                                    <input type="range" bind:value={formDominance} min="0" max="10" class="w-full accent-violet-500" />
                                </div>
                                <div class="space-y-2">
                                    <div class="flex justify-between text-sm">
                                        <span class="text-slate-600 dark:text-slate-400">稳定</span>
                                        <span class="font-medium">{formStability}/10</span>
                                    </div>
                                    <input type="range" bind:value={formStability} min="0" max="10" class="w-full accent-violet-500" />
                                </div>
                            </div>
                            
                            <!-- 其他配置 -->
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                                <div class="space-y-2">
                                    <label class="text-xs text-slate-500">MBTI <span class="text-slate-400">(可选)</span></label>
                                    <input type="text" bind:value={formMbti} placeholder="例如：INTJ" class="input-base text-sm" />
                                </div>
                                <div class="space-y-2">
                                    <label class="text-xs text-slate-500">沟通风格</label>
                                    <select bind:value={formCommunicationStyle} class="input-base text-sm">
                                        <option value="direct">直接</option>
                                        <option value="diplomatic">外交</option>
                                        <option value="analytical">分析</option>
                                        <option value="supportive">支持</option>
                                        <option value="socratic">苏格拉底</option>
                                        <option value="casual">随意</option>
                                    </select>
                                </div>
                                <div class="space-y-2">
                                    <label class="text-xs text-slate-500">表达风格</label>
                                    <select bind:value={formExpressionStyle} class="input-base text-sm">
                                        <option value="concise">简洁</option>
                                        <option value="detailed">详细</option>
                                        <option value="narrative">叙事</option>
                                        <option value="bullet">清单</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
                
                <!-- ============== 7. 系统提示词 ============== -->
                <div class="space-y-2">
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span class="w-5 h-5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold">7</span>
                        系统提示词
                    </label>
                    <textarea bind:value={formSystemPrompt} rows="6" placeholder="定义 Agent 的行为方式、指导思想、禁止行为..." class="input-base resize-none font-mono text-sm"></textarea>
                </div>
                
                <!-- ============== 视觉配置 ============== -->
                <div class="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <button 
                        onclick={() => showVisual = !showVisual}
                        class="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <label class="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Palette class="w-4 h-4" />
                            视觉配置
                        </label>
                        {#if showVisual}
                            <ChevronUp class="w-4 h-4 text-slate-500" />
                        {:else}
                            <ChevronDown class="w-4 h-4 text-slate-500" />
                        {/if}
                    </button>
                    
                    {#if showVisual}
                        <div class="p-4 space-y-4">
                            <div class="space-y-2">
                                <label class="text-xs text-slate-500">主题色</label>
                                <div class="flex gap-2">
                                    {#each colorPresets as color}
                                        <button 
                                            onclick={() => formPrimaryColor = color}
                                            class="w-8 h-8 rounded-lg transition-transform hover:scale-110 {formPrimaryColor === color ? 'ring-2 ring-offset-2 ring-violet-500' : ''}"
                                            style="background: {color}"
                                        ></button>
                                    {/each}
                                    <input 
                                        type="color" 
                                        bind:value={formPrimaryColor}
                                        class="w-8 h-8 rounded-lg cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div class="flex items-center gap-4">
                                <div 
                                    class="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                                    style="background: linear-gradient(135deg, {formPrimaryColor}, {formPrimaryColor}CC)"
                                >
                                    {formName ? formName[0] : '?'}
                                </div>
                                <div class="text-sm text-slate-500">
                                    预览效果
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
            
            <!-- 底部操作 -->
            <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 bg-slate-50 dark:bg-slate-800/50">
                <button onclick={handleSavePersona} class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-500 transition-colors">
                    <Save class="w-4 h-4" />
                    保存人格
                </button>
                <button onclick={() => isEditingPersona = false} class="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                    取消
                </button>
            </div>
        </div>

    {:else}
        <!-- ============== 人格列表 ============== -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each filteredPersonas as persona (persona.id)}
                <div class="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden hover:border-violet-500/30 hover:shadow-xl transition-all">
                    <div class="h-2" style="background: linear-gradient(to right, {persona.visual.primaryColor}, {persona.visual.primaryColor}CC)"></div>
                    <div class="p-5">
                        <div class="flex items-start justify-between mb-3">
                            <div class="flex items-center gap-3">
                                <div 
                                    class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                                    style="background: linear-gradient(135deg, {persona.visual.primaryColor}, {persona.visual.primaryColor}CC)"
                                >
                                    {persona.name[0]}
                                </div>
                                <div>
                                    <h3 class="font-bold text-slate-900 dark:text-white">{persona.name}</h3>
                                    <p class="text-xs text-slate-500">{persona.roleSetting}</p>
                                </div>
                            </div>
                            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onclick={() => handleEditPersona(persona)} class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="编辑">
                                    <Edit2 class="w-4 h-4 text-slate-400" />
                                </button>
                                {#if !persona.isBuiltIn}
                                    <button onclick={() => handleDeletePersona(persona.id)} class="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="删除">
                                        <Trash2 class="w-4 h-4 text-red-400" />
                                    </button>
                                {/if}
                            </div>
                        </div>
                        
                        <p class="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4">
                            {persona.personalIntroduction || '暂无简介'}
                        </p>
                        
                        <div class="flex flex-wrap gap-1.5 mb-4">
                            {#each persona.personalityTags.slice(0, 4) as tag}
                                <span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-full">
                                    {tag}
                                </span>
                            {/each}
                        </div>
                        
                        <!-- 人格矩阵预览 -->
                        <div class="mb-4 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <div class="grid grid-cols-3 gap-2 text-xs">
                                <div class="text-center">
                                    <div class="text-slate-400">理性</div>
                                    <div class="font-medium">{persona.personaMatrix.rationality}</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-slate-400">创意</div>
                                    <div class="font-medium">{persona.personaMatrix.creativity}</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-slate-400">共情</div>
                                    <div class="font-medium">{persona.personaMatrix.empathy}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                            <span class="text-xs text-slate-400 flex items-center gap-1">
                                <Puzzle class="w-3 h-3" />
                                {persona.personalSkills?.length || 0} 技能
                            </span>
                            {#if persona.isBuiltIn}
                                <span class="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs rounded-full">预设</span>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        </div>
        
        {#if filteredPersonas.length === 0}
            <div class="text-center py-16">
                <Users class="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">暂无人格</h3>
                <button onclick={handleCreatePersona} class="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl font-medium">
                    <Plus class="w-4 h-4" />
                    创建人格
                </button>
            </div>
        {/if}
    {/if}
</div>

<style>
    .input-base {
        @apply w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400;
    }
    
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>
