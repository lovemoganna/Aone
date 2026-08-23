<script lang="ts">
    import { base } from "$app/paths";
    import { fade, fly } from "svelte/transition";
    import { personaStore, type AbstractPersona, type PersonaMatrix, type SkillBinding } from "$lib/persona";
    import { skillRegistry } from "$lib/skills";
    import { settingsStore, DEFAULT_AI_RESTRAINT_RULE } from "$lib/stores/settingsStore.svelte";
    import { AgentAvatar } from "$lib/components/ui";
    import {
        ArrowRight,
        Copy,
        Edit3,
        Plus,
        Save,
        Search,
        Sliders,
        Trash2,
        User,
        Users,
        Wrench,
        X,
        ShieldCheck,
        RotateCcw,
        Sparkles,
    } from "lucide-svelte";

    type CommunicationStyle = PersonaMatrix["communicationStyle"];
    type ExpressionStyle = PersonaMatrix["expressionStyle"];
    type EmotionalTone = PersonaMatrix["emotionalTone"];
    type AvatarShape = AbstractPersona["visual"]["avatarShape"];

    let searchQuery = $state("");
    let activeTag = $state("");
    let isEditing = $state(false);
    let editingPersona = $state<AbstractPersona | null>(null);

    let formName = $state("");
    let formRoleSetting = $state("");
    let formPersonalIntro = $state("");
    let formPersonalityTags = $state("");
    let formSystemPrompt = $state("");
    let formOutputRestraintMode = $state<"inherit" | "strict" | "standard" | "relaxed" | "custom" | "off">("inherit");
    let formCustomRestraintRule = $state("");
    let formRationality = $state(5);
    let formCreativity = $state(5);
    let formEmpathy = $state(5);
    let formOpenness = $state(5);
    let formDominance = $state(5);
    let formStability = $state(5);
    let formMbti = $state("");
    let formCommunicationStyle = $state<CommunicationStyle>("direct");
    let formExpressionStyle = $state<ExpressionStyle>("concise");
    let formEmotionalTone = $state<EmotionalTone>("neutral");
    let formPrimaryColor = $state("#8B5CF6");
    let formAvatarShape = $state<AvatarShape>("circle");
    let formSkillBindings = $state<SkillBinding[]>([]);

    let allPersonas = $derived(personaStore.allPersonas);
    let availableSkills = $derived(skillRegistry.getAll());
    let customCount = $derived(allPersonas.filter((persona) => !persona.isBuiltIn).length);

    let allTags = $derived.by(() => {
        const tags = new Set<string>();
        for (const persona of allPersonas) {
            for (const tag of persona.personalityTags) tags.add(tag);
        }
        return Array.from(tags).sort();
    });

    let filteredPersonas = $derived.by(() => {
        const query = searchQuery.trim().toLowerCase();
        return allPersonas.filter((persona) => {
            const matchesQuery =
                !query ||
                [persona.name, persona.roleSetting, persona.personalIntroduction, persona.systemPrompt, ...persona.personalityTags]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(query));
            const matchesTag = !activeTag || persona.personalityTags.includes(activeTag);
            return matchesQuery && matchesTag;
        });
    });

    const colorPresets = ["#8B5CF6", "#3B82F6", "#0EA5E9", "#10B981", "#F59E0B", "#F97316", "#EF4444", "#EC4899"];
    const matrixFields = [
        { key: "rationality", label: "理性值" },
        { key: "creativity", label: "创造力" },
        { key: "empathy", label: "同理心" },
        { key: "openness", label: "开放性" },
        { key: "dominance", label: "支配欲" },
        { key: "stability", label: "稳定性" },
    ] as const;

    let previewEffectivePrompt = $derived.by(() => {
        let rule = '';
        if (formOutputRestraintMode === 'inherit') {
            rule = settingsStore.activeRestraintRule;
        } else if (formOutputRestraintMode === 'off') {
            rule = '';
        } else if (formOutputRestraintMode === 'custom') {
            rule = formCustomRestraintRule || settingsStore.customRestraintRule || DEFAULT_AI_RESTRAINT_RULE;
        } else if (formOutputRestraintMode === 'strict') {
            rule = `${DEFAULT_AI_RESTRAINT_RULE}\n【极致克制附加令】：严禁超过 3 个核心要点，严禁任何过渡句与修饰词，直接输出核心结论与执行参数。`;
        } else if (formOutputRestraintMode === 'relaxed') {
            rule = `【AI 输出效率指南】：优先结论，保持直接高效，必要时可补充关键背景与延伸。`;
        } else {
            rule = DEFAULT_AI_RESTRAINT_RULE;
        }

        if (!rule) return formSystemPrompt.trim();
        return `${rule}\n\n==================================================\n${formSystemPrompt.trim()}`;
    });

    function resetForm() {
        formName = "";
        formRoleSetting = "";
        formPersonalIntro = "";
        formPersonalityTags = "";
        formSystemPrompt = "";
        formOutputRestraintMode = "inherit";
        formCustomRestraintRule = "";
        formRationality = 5;
        formCreativity = 5;
        formEmpathy = 5;
        formOpenness = 5;
        formDominance = 5;
        formStability = 5;
        formMbti = "";
        formCommunicationStyle = "direct";
        formExpressionStyle = "concise";
        formEmotionalTone = "neutral";
        formPrimaryColor = "#8B5CF6";
        formAvatarShape = "circle";
        formSkillBindings = [];
    }

    function openCreateForm() {
        resetForm();
        editingPersona = null;
        isEditing = true;
    }

    function openEditForm(persona: AbstractPersona) {
        const editable = persona.isBuiltIn ? personaStore.duplicatePersona(persona.id) || persona : persona;
        formName = editable.name;
        formRoleSetting = editable.roleSetting;
        formPersonalIntro = editable.personalIntroduction;
        formPersonalityTags = editable.personalityTags.join(", ");
        formSystemPrompt = editable.systemPrompt;
        formOutputRestraintMode = editable.outputRestraintMode || "inherit";
        formCustomRestraintRule = editable.customRestraintRule || "";
        formRationality = editable.personaMatrix.rationality;
        formCreativity = editable.personaMatrix.creativity;
        formEmpathy = editable.personaMatrix.empathy;
        formOpenness = editable.personaMatrix.openness;
        formDominance = editable.personaMatrix.dominance;
        formStability = editable.personaMatrix.stability;
        formMbti = editable.personaMatrix.mbti || "";
        formCommunicationStyle = editable.personaMatrix.communicationStyle || "direct";
        formExpressionStyle = editable.personaMatrix.expressionStyle || "concise";
        formEmotionalTone = editable.personaMatrix.emotionalTone || "neutral";
        formPrimaryColor = editable.visual.primaryColor || "#8B5CF6";
        formAvatarShape = editable.visual.avatarShape || "circle";
        formSkillBindings = (editable.personalSkills || []).map((binding) => ({ ...binding }));
        editingPersona = editable;
        isEditing = true;
    }

    function closeForm() {
        isEditing = false;
        editingPersona = null;
    }

    function currentMatrix(): PersonaMatrix {
        return {
            rationality: formRationality,
            creativity: formCreativity,
            empathy: formEmpathy,
            openness: formOpenness,
            dominance: formDominance,
            stability: formStability,
            mbti: formMbti || undefined,
            communicationStyle: formCommunicationStyle,
            expressionStyle: formExpressionStyle,
            emotionalTone: formEmotionalTone,
        };
    }

    function savePersona() {
        if (!formName.trim() || !formRoleSetting.trim()) return;

        const payload: Partial<AbstractPersona> = {
            name: formName.trim(),
            roleSetting: formRoleSetting.trim(),
            personalIntroduction: formPersonalIntro.trim(),
            personalityTags: formPersonalityTags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            personalSkills: formSkillBindings,
            personaMatrix: currentMatrix(),
            systemPrompt: formSystemPrompt.trim(),
            outputRestraintMode: formOutputRestraintMode,
            customRestraintRule: formCustomRestraintRule.trim(),
            visual: {
                avatarUrl: editingPersona?.visual.avatarUrl || "",
                avatarShape: formAvatarShape,
                primaryColor: formPrimaryColor,
                gradient: editingPersona?.visual.gradient || "from-violet-500 to-purple-600",
            },
        };

        if (editingPersona && !editingPersona.isBuiltIn) {
            personaStore.updatePersona(editingPersona.id, payload);
        } else {
            personaStore.createPersona(payload);
        }

        closeForm();
    }

    function duplicatePersona(persona: AbstractPersona) {
        const copy = personaStore.duplicatePersona(persona.id);
        if (copy) openEditForm(copy);
    }

    function deletePersona(persona: AbstractPersona) {
        if (persona.isBuiltIn) return;
        if (confirm(`Delete persona "${persona.name}"? Agents using it may lose their persona link.`)) {
            personaStore.deletePersona(persona.id);
        }
    }

    function addSkillBinding() {
        const firstSkill = availableSkills[0];
        if (!firstSkill) return;
        formSkillBindings = [
            ...formSkillBindings,
            {
                skillId: firstSkill.id,
                proficiency: 5,
                priority: formSkillBindings.length + 1,
                autoActivate: false,
            },
        ];
    }

    function updateSkillBinding(index: number, updates: Partial<SkillBinding>) {
        formSkillBindings = formSkillBindings.map((binding, itemIndex) => (itemIndex === index ? { ...binding, ...updates } : binding));
    }

    function removeSkillBinding(index: number) {
        formSkillBindings = formSkillBindings.filter((_, itemIndex) => itemIndex !== index);
    }

    function matrixValue(key: (typeof matrixFields)[number]["key"]) {
        return {
            rationality: formRationality,
            creativity: formCreativity,
            empathy: formEmpathy,
            openness: formOpenness,
            dominance: formDominance,
            stability: formStability,
        }[key];
    }

    function setMatrixValue(key: (typeof matrixFields)[number]["key"], value: number) {
        if (key === "rationality") formRationality = value;
        if (key === "creativity") formCreativity = value;
        if (key === "empathy") formEmpathy = value;
        if (key === "openness") formOpenness = value;
        if (key === "dominance") formDominance = value;
        if (key === "stability") formStability = value;
    }
</script>

<svelte:head>
    <title>Persona Library - Agent Studio</title>
</svelte:head>

<div class="space-y-6 max-w-7xl mx-auto" in:fade={{ duration: 180 }}>
    <!-- Clean, unboxed header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
            <div class="flex items-center gap-2">
                <h1 class="text-xl font-bold text-slate-900 dark:text-white">角色人设库 (Personas)</h1>
                <span class="text-xs text-slate-400 font-mono">({allPersonas.length} 预设 / {customCount} 自定义)</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                定义语气身份、行为习惯与默认技能偏好，为专属 Agent 提供 3D 拟人化数字专家人格。
            </p>
        </div>
        <div class="flex items-center gap-2.5 shrink-0">
            <button onclick={openCreateForm} class="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-violet-500 active:scale-95 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
                <Plus class="h-3.5 w-3.5" />
                新建角色人设
            </button>
            <a href="{base}/agent-studio" class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                返回工作坊
                <ArrowRight class="h-3.5 w-3.5" />
            </a>
        </div>
    </div>

    {#if isEditing}
        <section class="rounded-2xl border border-violet-200 bg-white shadow-sm dark:border-violet-900/60 dark:bg-slate-900" transition:fly={{ y: 16, duration: 180 }}>
            <div class="flex items-start justify-between border-b border-slate-200 p-5 dark:border-slate-800">
                <div>
                    <h2 class="text-lg font-bold text-slate-950 dark:text-white">{editingPersona ? "编辑角色" : "新建角色"}</h2>
                    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">名称和角色设定为必填项。其他选项有助于进一步优化 Agent 的具体行为表现。</p>
                </div>
                <button onclick={closeForm} class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200" aria-label="Close persona form">
                    <X class="h-5 w-5" />
                </button>
            </div>

            <div class="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div class="space-y-5">
                    <div class="grid gap-4 md:grid-cols-2">
                        <label class="block">
                            <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">名称 *</span>
                            <input bind:value={formName} class="input-base mt-2" placeholder="决策导师" />
                        </label>
                        <label class="block">
                            <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">角色设定 *</span>
                            <input bind:value={formRoleSetting} class="input-base mt-2" placeholder="为模糊纠结的决策提供务实的指导" />
                        </label>
                    </div>

                    <label class="block">
                        <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">角色简介</span>
                        <textarea bind:value={formPersonalIntro} rows="3" class="input-base mt-2 resize-none" placeholder="简述角色的背景故事和行为习惯..."></textarea>
                    </label>

                    <label class="block">
                        <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">标签</span>
                        <input bind:value={formPersonalityTags} class="input-base mt-2" placeholder="结构化, 冷静, 分析型" />
                    </label>

                    <div class="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                        <div class="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                            <Sliders class="h-4 w-4 text-violet-500" />
                            性格属性矩阵
                        </div>
                        <div class="grid gap-4 md:grid-cols-2">
                            {#each matrixFields as field}
                                <label class="block">
                                    <div class="mb-1 flex justify-between text-sm">
                                        <span class="font-medium text-slate-700 dark:text-slate-200">{field.label}</span>
                                        <span class="text-slate-500">{matrixValue(field.key)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        value={matrixValue(field.key)}
                                        oninput={(event) => setMatrixValue(field.key, Number(event.currentTarget.value))}
                                        class="w-full accent-violet-600"
                                    />
                                </label>
                            {/each}
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label class="block">
                            <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">系统提示词 (System prompt)</span>
                            <textarea bind:value={formSystemPrompt} rows="5" class="input-base mt-2 resize-none font-mono text-sm" placeholder="定义行为规则、语气偏好、局限性以及回复风格..."></textarea>
                        </label>

                        <!-- AI Output Restraint Iron Rule Block -->
                        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 p-4 space-y-3">
                            <div class="flex items-center justify-between gap-2">
                                <div class="flex items-center gap-2">
                                    <ShieldCheck class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    <span class="text-xs font-bold text-slate-900 dark:text-white">AI 输出克制铁律武装</span>
                                </div>
                                <span class="text-[10px] px-2 py-0.5 rounded font-mono {formOutputRestraintMode === 'off' ? 'bg-slate-200 dark:bg-slate-700 text-slate-500' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'}">
                                    {formOutputRestraintMode === 'inherit' ? `继承全局 (${settingsStore.restraintLevel})` : formOutputRestraintMode === 'off' ? '未启用' : '独立生效'}
                                </span>
                            </div>

                            <div class="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-xs">
                                {#each [
                                    { id: 'inherit', label: '继承全局' },
                                    { id: 'standard', label: '标准克制' },
                                    { id: 'strict', label: '极致严格' },
                                    { id: 'relaxed', label: '宽松模式' },
                                    { id: 'custom', label: '角色自定义' },
                                    { id: 'off', label: '关闭铁律' }
                                ] as opt}
                                    <button
                                        type="button"
                                        onclick={() => (formOutputRestraintMode = opt.id as any)}
                                        class="px-2 py-1.5 rounded-lg border text-center transition-all cursor-pointer text-[11px] {formOutputRestraintMode === opt.id
                                            ? 'border-indigo-500 bg-white dark:bg-slate-900 font-bold text-indigo-600 dark:text-indigo-400 shadow-2xs'
                                            : 'border-transparent hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}"
                                    >
                                        {opt.label}
                                    </button>
                                {/each}
                            </div>

                            {#if formOutputRestraintMode === 'custom'}
                                <div class="space-y-1">
                                    <div class="flex items-center justify-between text-[11px] text-slate-500">
                                        <span>本角色独立铁律规则：</span>
                                        <button
                                            type="button"
                                            onclick={() => (formCustomRestraintRule = DEFAULT_AI_RESTRAINT_RULE)}
                                            class="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                        >
                                            填入默认铁律
                                        </button>
                                    </div>
                                    <textarea
                                        bind:value={formCustomRestraintRule}
                                        rows="4"
                                        class="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none leading-relaxed"
                                        placeholder="输入本角色专属的克制铁律..."
                                    ></textarea>
                                </div>
                            {/if}

                            <!-- Effective Combined Prompt Preview -->
                            <details class="text-xs group">
                                <summary class="cursor-pointer text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 select-none">
                                    <Sparkles class="w-3 h-3 text-indigo-500" />
                                    <span>查看运行时完整组装 System Prompt（含铁律前缀）</span>
                                </summary>
                                <div class="mt-2 p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[10px] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto border border-slate-800">
                                    {previewEffectivePrompt}
                                </div>
                            </details>
                        </div>
                    </div>
                </div>

                <aside class="space-y-5">
                    <div class="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                        <div class="mb-3 flex items-center justify-between">
                            <span class="text-sm font-bold text-slate-900 dark:text-white">形象与风格设定</span>
                            <AgentAvatar agent={formName || formRoleSetting || "decomposer"} size="md" shape={formAvatarShape as any} glow={true} />
                        </div>
                        <label class="block">
                            <span class="text-xs font-semibold text-slate-500">MBTI</span>
                            <input bind:value={formMbti} class="input-base mt-1 text-sm" placeholder="INTJ" />
                        </label>
                        <div class="mt-3 grid gap-3">
                            <select bind:value={formCommunicationStyle} class="input-base text-sm">
                                <option value="direct">直接 (Direct)</option>
                                <option value="diplomatic">委婉 (Diplomatic)</option>
                                <option value="analytical">分析型 (Analytical)</option>
                                <option value="supportive">支持型 (Supportive)</option>
                                <option value="socratic">苏格拉底追问式 (Socratic)</option>
                                <option value="casual">随和 (Casual)</option>
                            </select>
                            <select bind:value={formExpressionStyle} class="input-base text-sm">
                                <option value="concise">简洁 (Concise)</option>
                                <option value="detailed">详细 (Detailed)</option>
                                <option value="narrative">叙事叙述 (Narrative)</option>
                                <option value="bullet">分条列举 (Bullet)</option>
                            </select>
                            <select bind:value={formEmotionalTone} class="input-base text-sm">
                                <option value="neutral">中性 (Neutral)</option>
                                <option value="warm">温暖 (Warm)</option>
                                <option value="humorous">幽默 (Humorous)</option>
                                <option value="serious">严谨 (Serious)</option>
                                <option value="optimistic">乐观 (Optimistic)</option>
                                <option value="cautious">谨慎 (Cautious)</option>
                            </select>
                            <select bind:value={formAvatarShape} class="input-base text-sm">
                                <option value="circle">圆形头像</option>
                                <option value="square">方形头像</option>
                                <option value="rounded">圆角头像</option>
                                <option value="hexagon">六边形头像</option>
                            </select>
                        </div>
                        <div class="mt-4 flex flex-wrap gap-2">
                            {#each colorPresets as color}
                                <button
                                    onclick={() => (formPrimaryColor = color)}
                                    class="h-7 w-7 rounded-full border-2 {formPrimaryColor === color ? 'border-slate-900 dark:border-white' : 'border-transparent'}"
                                    style="background-color: {color}"
                                    title="Set color {color}"
                                    aria-label="Set color {color}"
                                ></button>
                            {/each}
                        </div>
                    </div>

                    <div class="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                        <div class="mb-3 flex items-center justify-between">
                            <div class="text-sm font-bold text-slate-900 dark:text-white">默认绑定技能</div>
                            <button onclick={addSkillBinding} class="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-500">
                                <Plus class="h-3.5 w-3.5" /> 添加
                            </button>
                        </div>
                        <div class="space-y-3">
                            {#each formSkillBindings as binding, index}
                                <div class="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/60">
                                    <select value={binding.skillId} onchange={(event) => updateSkillBinding(index, { skillId: event.currentTarget.value })} class="input-base text-sm">
                                        {#each availableSkills as skill}
                                            <option value={skill.id}>{skill.name}</option>
                                        {/each}
                                    </select>
                                    <div class="mt-2 grid grid-cols-[1fr_auto] items-center gap-2">
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={binding.proficiency}
                                            oninput={(event) => updateSkillBinding(index, { proficiency: Number(event.currentTarget.value) })}
                                            class="accent-violet-600"
                                        />
                                        <span class="text-xs text-slate-500">{binding.proficiency}/10</span>
                                    </div>
                                    <div class="mt-2 flex items-center justify-between gap-2">
                                        <label class="inline-flex items-center gap-2 text-xs text-slate-500">
                                            <input type="checkbox" checked={binding.autoActivate} onchange={(event) => updateSkillBinding(index, { autoActivate: event.currentTarget.checked })} />
                                            自动激活
                                        </label>
                                        <button onclick={() => removeSkillBinding(index)} class="text-xs font-semibold text-red-500 hover:text-red-600">移除</button>
                                    </div>
                                </div>
                            {:else}
                                <p class="text-sm leading-6 text-slate-500 dark:text-slate-400">暂无默认技能。在组装 Agent 时依然可以为它们手动附加技能。</p>
                            {/each}
                        </div>
                    </div>
                </aside>
            </div>

            <div class="flex justify-end gap-3 border-t border-slate-200 p-4 dark:border-slate-800">
                <button onclick={closeForm} class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">取消</button>
                <button onclick={savePersona} disabled={!formName.trim() || !formRoleSetting.trim()} class="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
                    <Save class="h-4 w-4" />
                    保存角色
                </button>
            </div>
        </section>
    {/if}

    <section class="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div class="relative w-full lg:max-w-md">
                <Search class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <!-- [问题3] 为角色搜索输入框补充 aria-label 可访问性属性 -->
                <input bind:value={searchQuery} aria-label="搜索角色、设定或系统提示词" class="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-white" placeholder="搜索角色、设定、系统提示词..." />
            </div>
            <div class="flex flex-wrap gap-1.5">
                <button onclick={() => (activeTag = "")} class="rounded-lg px-2.5 py-1 text-xs font-medium transition {activeTag === '' ? 'bg-violet-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}">全部</button>
                {#each allTags.slice(0, 8) as tag}
                    <button onclick={() => (activeTag = tag)} class="rounded-lg px-2.5 py-1 text-xs font-medium transition {activeTag === tag ? 'bg-violet-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}">{tag}</button>
                {/each}
            </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {#each filteredPersonas as persona (persona.id)}
                <article class="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 transition-all hover:border-slate-300 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/30 dark:hover:border-slate-700">
                    <div>
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 shrink-0">
                                <AgentAvatar agent={persona.id || persona.name} size="sm" shape="rounded" glow={false} />
                            </div>
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-2">
                                    <h3 class="font-bold text-sm text-slate-900 dark:text-white truncate">{persona.name}</h3>
                                    <span class="rounded px-1.5 py-0.5 text-[10px] font-medium {persona.isBuiltIn ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'}">
                                        {persona.isBuiltIn ? "内置" : "自定义"}
                                    </span>
                                </div>
                                <p class="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{persona.roleSetting}</p>
                            </div>
                        </div>

                        <p class="mt-3 line-clamp-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{persona.personalIntroduction || "暂无角色介绍。"}</p>

                        {#if persona.personalityTags.length > 0}
                            <div class="mt-2.5 flex flex-wrap gap-1">
                                {#each persona.personalityTags.slice(0, 4) as tag}
                                    <span class="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{tag}</span>
                                {/each}
                            </div>
                        {/if}

                        <!-- Inline Clean Persona Matrix -->
                        <div class="mt-3 grid grid-cols-3 gap-1.5 text-center text-[10px] text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60 pt-2.5">
                            <div><span class="font-bold text-slate-800 dark:text-slate-200">{persona.personaMatrix.rationality}</span>/10 理性</div>
                            <div><span class="font-bold text-slate-800 dark:text-slate-200">{persona.personaMatrix.creativity}</span>/10 创造</div>
                            <div><span class="font-bold text-slate-800 dark:text-slate-200">{persona.personaMatrix.empathy}</span>/10 同理</div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="mt-3.5 flex items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                        <div class="inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <Wrench class="h-3 w-3 text-teal-500" />
                            {persona.personalSkills?.length || 0} 个默认技能
                        </div>
                        <div class="flex items-center gap-0.5">
                            <!-- [问题1] 为角色卡片操作按钮补充 aria-label 与 focus-visible 焦点状态 -->
                            <button onclick={() => duplicatePersona(persona)} aria-label={`克隆角色 ${persona.name}`} class="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:hover:bg-slate-900 transition-colors" title="克隆角色">
                                <Copy class="h-3.5 w-3.5" />
                            </button>
                            <button onclick={() => openEditForm(persona)} aria-label={persona.isBuiltIn ? `克隆并编辑角色 ${persona.name}` : `编辑角色 ${persona.name}`} class="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-900 transition-colors" title={persona.isBuiltIn ? "克隆并编辑" : "编辑角色"}>
                                <Edit3 class="h-3.5 w-3.5" />
                            </button>
                            {#if !persona.isBuiltIn}
                                <button onclick={() => deletePersona(persona)} aria-label={`删除角色 ${persona.name}`} class="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-slate-900 transition-colors" title="删除角色">
                                    <Trash2 class="h-3.5 w-3.5" />
                                </button>
                            {/if}
                        </div>
                    </div>
                </article>
            {:else}
                <div class="col-span-full rounded-xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-800">
                    <User class="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <h3 class="font-semibold text-sm text-slate-900 dark:text-white">没有匹配的角色人设</h3>
                    <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">请清空搜索条件或为此 Agent 工作流创建一个自定义角色。</p>
                </div>
            {/each}
        </div>
    </section>
</div>

<style>
    .input-base {
        width: 100%;
        border-radius: 0.75rem;
        border: 1px solid rgb(226 232 240);
        background: white;
        padding: 0.625rem 0.75rem;
        color: rgb(15 23 42);
        outline: none;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .input-base:focus {
        border-color: rgb(124 58 237);
        box-shadow: 0 0 0 2px rgb(124 58 237 / 0.16);
    }

    :global(.dark) .input-base {
        border-color: rgb(51 65 85);
        background: rgb(15 23 42);
        color: white;
    }
</style>
