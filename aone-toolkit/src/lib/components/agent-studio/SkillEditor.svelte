<script lang="ts">
    import { type SkillDefinition, type SkillType, type SkillStep, type SkillException } from '$lib/skills/types';
    import { 
        X, 
        Plus, 
        Trash2, 
        Save, 
        Info, 
        Zap, 
        Layers, 
        FileText, 
        AlertCircle,
        Palette,
        Tag,
        Code
    } from 'lucide-svelte';
    import { fade, scale } from 'svelte/transition';

    let { 
        skill = {}, 
        onSave, 
        onCancel 
    } = $props<{
        skill?: Partial<SkillDefinition>;
        onSave: (skill: SkillDefinition) => void;
        onCancel: () => void;
    }>();

    let activeTab = $state('basic');

    // 本地编辑状态
    // svelte-ignore state_referenced_locally
    let editedSkill = $state({
        id: skill.id || `skill_${Date.now()}`,
        name: skill.name || '',
        description: skill.description || '',
        oneLiner: skill.oneLiner || '',
        type: skill.type || 'analysis' as SkillType,
        io: {
            input: skill.io?.input || '',
            output: skill.io?.output || '',
            format: skill.io?.format || ''
        },
        trigger: {
            keywords: skill.trigger?.keywords ? [...skill.trigger.keywords] : [],
            patterns: skill.trigger?.patterns ? [...skill.trigger.patterns] : [],
            conditions: skill.trigger?.conditions ? [...skill.trigger.conditions] : []
        },
        steps: skill.steps ? JSON.parse(JSON.stringify(skill.steps)) : [] as SkillStep[],
        outputTemplate: skill.outputTemplate || '',
        exceptions: skill.exceptions ? JSON.parse(JSON.stringify(skill.exceptions)) : [] as SkillException[],
        visual: {
            color: skill.visual?.color || '#3B82F6',
            icon: skill.visual?.icon || '🔍',
            gradient: skill.visual?.gradient || ''
        },
        compatibleAgents: skill.compatibleAgents ? [...skill.compatibleAgents] : ['general'],
        tags: skill.tags ? [...skill.tags] : [],
        version: skill.version || '1.0.0',
        isBuiltIn: false
    });

    const skillTypes: { id: SkillType; label: string; icon: string }[] = [
        { id: 'analysis', label: '分析型', icon: '🔍' },
        { id: 'quantitative', label: '量化型', icon: '⚖️' },
        { id: 'evaluation', label: '评估型', icon: '🃏' },
        { id: 'exploration', label: '探索型', icon: '🔄' },
        { id: 'generation', label: '生成型', icon: '✅' }
    ];

    function addKeyword() {
        editedSkill.trigger.keywords = [...editedSkill.trigger.keywords, ''];
    }

    function removeKeyword(index: number) {
        editedSkill.trigger.keywords = editedSkill.trigger.keywords.filter((_: string, i: number) => i !== index);
    }

    function addStep() {
        const nextOrder = editedSkill.steps.length + 1;
        editedSkill.steps = [...editedSkill.steps, {
            order: nextOrder,
            description: '',
            action: '',
            outputKey: ''
        }];
    }

    function removeStep(index: number) {
        editedSkill.steps = editedSkill.steps.filter((_: SkillStep, i: number) => i !== index)
            .map((s: SkillStep, i: number) => ({ ...s, order: i + 1 }));
    }

    function addException() {
        editedSkill.exceptions = [...editedSkill.exceptions, {
            condition: '',
            response: ''
        }];
    }

    function removeException(index: number) {
        editedSkill.exceptions = editedSkill.exceptions.filter((_: SkillException, i: number) => i !== index);
    }

    function handleSave() {
        if (!editedSkill.name.trim()) return;
        onSave(editedSkill as SkillDefinition);
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
        } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            handleSave();
        }
    }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div 
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    transition:fade={{ duration: 160 }}
>
    <div 
        class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        transition:scale={{ duration: 180, start: 0.96 }}
    >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white">
                    <Zap class="w-5 h-5" />
                </div>
                <div>
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white">
                        {skill.id ? '编辑技能' : '创建新技能'}
                    </h3>
                    <p class="text-xs text-slate-500">定制化您的认知工具</p>
                </div>
            </div>
            <button 
                onclick={onCancel}
                class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                aria-label="关闭"
            >
                <X class="w-5 h-5" />
            </button>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-slate-200 dark:border-slate-800 px-6 overflow-x-auto no-scrollbar">
            {#each [
                { id: 'basic', label: '基础信息', icon: Info },
                { id: 'trigger', label: '触发机制', icon: Zap },
                { id: 'workflow', label: '工作流', icon: Layers },
                { id: 'output', label: '输出定义', icon: FileText },
                { id: 'visual', label: '外观标签', icon: Palette }
            ] as tab}
                <button 
                    onclick={() => activeTab = tab.id}
                    class="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap
                    {activeTab === tab.id 
                        ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-semibold' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}"
                >
                    <tab.icon class="w-4 h-4" />
                    {tab.label}
                </button>
            {/each}
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {#if activeTab === 'basic'}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6" in:fade={{ duration: 150 }}>
                    <div class="space-y-4">
                        {#if skill.isBuiltIn}
                            <div class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex gap-3 items-start" in:fade>
                                <AlertCircle class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div class="text-xs text-amber-700 dark:text-amber-300">
                                    <p class="font-bold mb-1">注意：您正在编辑内置技能</p>
                                    <p>内置技能的修改将作为“自定义覆盖”保存。您可以随时通过删除操作恢复到原始版本。</p>
                                </div>
                            </div>
                        {/if}
                        <div>
                            <label for="skill-editor-name" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">技能名称*</label>
                            <input 
                                id="skill-editor-name"
                                type="text" 
                                bind:value={editedSkill.name}
                                placeholder="例如：SWOT分析"
                                class="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-xs text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label for="skill-editor-one-liner" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">一句话说明*</label>
                            <input 
                                id="skill-editor-one-liner"
                                type="text" 
                                bind:value={editedSkill.oneLiner}
                                placeholder="简单描述技能的作用"
                                class="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-xs text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label for="skill-editor-type" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">技能类型</label>
                            <select 
                                id="skill-editor-type"
                                bind:value={editedSkill.type}
                                class="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-xs text-slate-900 dark:text-white"
                            >
                                {#each skillTypes as type}
                                    <option value={type.id}>{type.icon} {type.label}</option>
                                {/each}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label for="skill-editor-description" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">详细描述</label>
                        <textarea 
                            id="skill-editor-description"
                            bind:value={editedSkill.description}
                            placeholder="详细说明技能的背景、用途和逻辑..."
                            rows="8"
                            class="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-xs text-slate-900 dark:text-white resize-none"
                        ></textarea>
                    </div>
                </div>
            {:else if activeTab === 'trigger'}
                <div class="space-y-6" in:fade={{ duration: 150 }}>
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <div class="block text-sm font-medium text-slate-700 dark:text-slate-300">触发关键词</div>
                            <button 
                                onclick={addKeyword}
                                class="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1 font-medium"
                            >
                                <Plus class="w-3.5 h-3.5" /> 添加
                            </button>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            {#each editedSkill.trigger.keywords as keyword, i}
                                <div class="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <input 
                                        type="text" 
                                        aria-label={`Keyword ${i + 1}`}
                                        bind:value={editedSkill.trigger.keywords[i]}
                                        class="bg-transparent border-none outline-none text-xs w-20 text-slate-900 dark:text-white"
                                        placeholder="关键词"
                                    />
                                    <button onclick={() => removeKeyword(i)} class="text-slate-400 hover:text-red-500" title="Remove keyword" aria-label={`Remove keyword ${i + 1}`}>
                                        <X class="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            {/each}
                            {#if editedSkill.trigger.keywords.length === 0}
                                <p class="text-xs text-slate-400 italic">暂无关键词，技能将难以被自动识别</p>
                            {/if}
                        </div>
                    </div>

                    <div>
                        <label for="skill-editor-patterns" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">正则匹配模式 (可选)</label>
                        <textarea 
                            id="skill-editor-patterns"
                            bind:value={editedSkill.trigger.patterns}
                            placeholder="每行一个正则表达式"
                            rows="3"
                            class="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-xs text-slate-900 dark:text-white resize-none"
                        ></textarea>
                    </div>

                    <div>
                        <label for="skill-editor-conditions" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">触发条件描述</label>
                        <textarea 
                            id="skill-editor-conditions"
                            bind:value={editedSkill.trigger.conditions}
                            placeholder="描述在哪种语境或条件下应该触发此技能..."
                            rows="3"
                            class="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-xs text-slate-900 dark:text-white resize-none"
                        ></textarea>
                    </div>
                </div>
            {:else if activeTab === 'workflow'}
                <div class="space-y-4" in:fade={{ duration: 150 }}>
                    <div class="flex items-center justify-between">
                        <div class="block text-sm font-medium text-slate-700 dark:text-slate-300">执行步骤</div>
                        <button 
                            onclick={addStep}
                            class="px-3 py-1.5 bg-teal-600 text-white text-xs rounded-lg hover:bg-teal-500 shadow-xs transition-colors flex items-center gap-1 font-medium"
                        >
                            <Plus class="w-3.5 h-3.5" /> 添加步骤
                        </button>
                    </div>
                    
                    <div class="space-y-2.5">
                        {#each editedSkill.steps as step, i}
                            <div class="flex items-start gap-3 p-3.5 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-xl relative group">
                                <div class="w-5 h-5 rounded-md bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                                    {step.order}
                                </div>
                                <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    <input 
                                        type="text" 
                                        aria-label={`Step ${i + 1} description`}
                                        bind:value={step.description}
                                        placeholder="步骤描述（例如：收集关键信息）"
                                        class="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                                    />
                                    <input 
                                        type="text" 
                                        aria-label={`Step ${i + 1} action`}
                                        bind:value={step.action}
                                        placeholder="执行动作（给AI的指令）"
                                        class="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                                    />
                                </div>
                                <button 
                                    onclick={() => removeStep(i)}
                                    class="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                    title="Remove step"
                                    aria-label={`Remove step ${i + 1}`}
                                >
                                    <Trash2 class="w-4 h-4" />
                                </button>
                            </div>
                        {/each}
                        {#if editedSkill.steps.length === 0}
                            <div class="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                                点击“添加步骤”定义技能逻辑
                            </div>
                        {/if}
                    </div>

                    <div class="pt-4 border-t border-slate-200/80 dark:border-slate-800">
                        <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                            <AlertCircle class="w-4 h-4 text-amber-500" /> 异常处理
                        </div>
                        <div class="space-y-2">
                            {#each editedSkill.exceptions as ex, i}
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                                    <input 
                                        type="text" 
                                        aria-label={`Exception ${i + 1} condition`}
                                        bind:value={ex.condition}
                                        placeholder="异常条件（如：缺少核心数据）"
                                        class="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                                    />
                                    <div class="flex gap-2">
                                        <input 
                                            type="text" 
                                            aria-label={`Exception ${i + 1} response`}
                                            bind:value={ex.response}
                                            placeholder="响应策略（如：提示用户补充信息）"
                                            class="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                                        />
                                        <button onclick={() => removeException(i)} class="text-slate-400 hover:text-red-500" title="Remove exception" aria-label={`Remove exception ${i + 1}`}>
                                            <X class="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            {/each}
                            <button 
                                onclick={addException}
                                class="text-xs text-slate-500 hover:text-teal-600 flex items-center gap-1 mt-2 font-medium"
                            >
                                <Plus class="w-3.5 h-3.5" /> 添加异常处理
                            </button>
                        </div>
                    </div>
                </div>
            {:else if activeTab === 'output'}
                <div class="space-y-6" in:fade={{ duration: 150 }}>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label for="skill-editor-input" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">预期输入</label>
                            <textarea 
                                id="skill-editor-input"
                                bind:value={editedSkill.io.input}
                                placeholder="描述技能需要的输入信息..."
                                rows="3"
                                class="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-xs text-slate-900 dark:text-white resize-none"
                            ></textarea>
                        </div>
                        <div>
                            <label for="skill-editor-output" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">预期输出</label>
                            <textarea 
                                id="skill-editor-output"
                                bind:value={editedSkill.io.output}
                                placeholder="描述技能产生的输出成果..."
                                rows="3"
                                class="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-xs text-slate-900 dark:text-white resize-none"
                            ></textarea>
                        </div>
                    </div>

                    <div>
                        <div class="flex items-center justify-between mb-1.5">
                            <label for="skill-editor-output-template" class="block text-sm font-medium text-slate-700 dark:text-slate-300">输出模板 (Output Template)</label>
                            <span class="text-[10px] text-slate-400">支持 Markdown 格式</span>
                        </div>
                        <textarea 
                            id="skill-editor-output-template"
                            bind:value={editedSkill.outputTemplate}
                            placeholder="定义 AI 最终输出的结构模板..."
                            rows="10"
                            class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-xs font-mono text-slate-900 dark:text-white"
                        ></textarea>
                    </div>
                </div>
            {:else if activeTab === 'visual'}
                <div class="space-y-6" in:fade={{ duration: 150 }}>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="space-y-6">
                            <div>
                                <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">图标 (Emoji)</div>
                                <div class="flex flex-wrap gap-2.5">
                                    {#each ['🔍', '⚖️', '🃏', '🔄', '✅', '🚀', '🧠', '🛠️', '📊', '🌐'] as icon}
                                        <button 
                                            onclick={() => editedSkill.visual.icon = icon}
                                            title={`Set icon ${icon}`}
                                            aria-label={`Set icon ${icon}`}
                                            class="w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all
                                            {editedSkill.visual.icon === icon ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}"
                                        >
                                            {icon}
                                        </button>
                                    {/each}
                                </div>
                            </div>

                            <div>
                                <div class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">主题色</div>
                                <div class="flex flex-wrap gap-2.5">
                                    {#each ['#3B82F6', '#14B8A6', '#8B5CF6', '#EAB308', '#22C55E', '#EF4444', '#F97316', '#6366F1'] as color}
                                        <button 
                                            onclick={() => editedSkill.visual.color = color}
                                            title={`Set skill color ${color}`}
                                            aria-label={`Set skill color ${color}`}
                                            class="w-7 h-7 rounded-full transition-all border-2 border-white dark:border-slate-900
                                            {editedSkill.visual.color === color ? 'scale-110 shadow-xs ring-2 ring-offset-2 ring-teal-500' : 'opacity-80 hover:opacity-100'}"
                                            style="background-color: {color}"
                                        ></button>
                                    {/each}
                                </div>
                            </div>
                        </div>

                        <div class="space-y-6">
                            <div>
                                <label for="skill-editor-tags" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                                    <Tag class="w-4 h-4" /> 标签 (Tags)
                                </label>
                                <textarea 
                                    id="skill-editor-tags"
                                    value={editedSkill.tags.join(', ')}
                                    onchange={(e) => editedSkill.tags = e.currentTarget.value.split(',').map(t => t.trim()).filter(Boolean)}
                                    placeholder="输入标签，用逗号分隔..."
                                    rows="2"
                                    class="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-xs text-slate-900 dark:text-white resize-none"
                                ></textarea>
                            </div>

                            <div class="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-700/80">
                                <p class="text-xs font-semibold text-slate-500 mb-2.5">卡片预览</p>
                                <div class="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
                                    <div 
                                        class="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                                        style="background-color: {editedSkill.visual.color}15; color: {editedSkill.visual.color}"
                                    >
                                        {editedSkill.visual.icon}
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <h4 class="font-bold text-sm truncate dark:text-white">{editedSkill.name || '技能名称'}</h4>
                                        <p class="text-xs text-slate-500 truncate mt-0.5">{editedSkill.oneLiner || '一句话说明预览'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <Code class="w-3.5 h-3.5" />
                ID: {editedSkill.id}
            </div>
            <div class="flex items-center gap-2.5">
                <button 
                    onclick={onCancel}
                    class="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                    取消
                </button>
                <button 
                    onclick={handleSave}
                    class="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
                >
                    <Save class="w-3.5 h-3.5" />
                    保存技能
                </button>
            </div>
        </div>
    </div>
</div>

<style>
    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }
    .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }

    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 10px;
    }
    :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #334155;
    }
</style>
