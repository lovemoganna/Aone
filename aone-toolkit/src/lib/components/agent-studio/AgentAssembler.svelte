<script lang="ts">
    import { personaStore } from "$lib/persona";
    import { skillRegistry, type SkillDefinition } from "$lib/skills";
    import { agentStore, type Agent } from "$lib/agents";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import { settingsStore } from "$lib/stores/settingsStore.svelte";
    import AgentAvatar from "$lib/components/ui/AgentAvatar.svelte";
    import { fly } from "svelte/transition";
    import {
        ArrowLeft,
        Bot,
        Check,
        ChevronRight,
        Search,
        Sparkles,
        User,
        Wrench,
        X,
        ShieldCheck,
    } from "lucide-svelte";

    interface Props {
        mode?: "create" | "edit";
        agentId?: string;
        onSave?: (agent: Agent) => void;
        onCancel?: () => void;
    }

    let { mode = "create", agentId = "", onSave, onCancel }: Props = $props();

    type Step = "persona" | "skills" | "preview";
    let currentStep = $state<Step>("persona");

    let agentName = $state("");
    let agentDescription = $state("");
    let selectedPersonaId = $state("");
    let selectedSkillIds = $state<string[]>([]);
    let skillSearchQuery = $state("");
    let editInitialized = $state(false);

    $effect(() => {
        if (mode === "edit" && agentId) {
            const existing = agentStore.getById(agentId);
            if (existing) {
                agentName = existing.name;
                agentDescription = existing.description;
                selectedPersonaId = existing.personaId;
                selectedSkillIds = [...existing.skillIds];
            }
        } else if (mode === "create") {
            agentName = "";
            agentDescription = "";
            selectedPersonaId = "";
            selectedSkillIds = [];
        }
    });

    let allPersonas = $derived(personaStore.allPersonas);
    let allSkills = $derived(skillRegistry.getAll());

    let filteredSkills = $derived.by(() => {
        const query = skillSearchQuery.trim().toLowerCase();
        if (!query) return allSkills;

        return allSkills.filter((skill) => {
            return (
                skill.name.toLowerCase().includes(query) ||
                skill.oneLiner.toLowerCase().includes(query) ||
                skill.description.toLowerCase().includes(query)
            );
        });
    });

    let selectedPersona = $derived(allPersonas.find((persona) => persona.id === selectedPersonaId) || null);

    let selectedSkillDefs = $derived(
        selectedSkillIds
            .map((id) => skillRegistry.getById(id))
            .filter((skill): skill is SkillDefinition => Boolean(skill)),
    );

    const skillTypeConfig: Record<string, { label: string; bg: string; text: string }> = {
        analysis: { label: "结构化拆解 (Analysis)", bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-300" },
        quantitative: { label: "量化决策 (Quant)", bg: "bg-violet-50 dark:bg-violet-950/30", text: "text-violet-700 dark:text-violet-300" },
        evaluation: { label: "风险评估 (Evaluate)", bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-300" },
        exploration: { label: "多维发散 (Explore)", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300" },
        generation: { label: "输出生成 (Generate)", bg: "bg-pink-50 dark:bg-pink-950/30", text: "text-pink-700 dark:text-pink-300" },
    };

    const steps: { key: Step; label: string; icon: typeof User }[] = [
        { key: "persona", label: "角色人设", icon: User },
        { key: "skills", label: "技能配备", icon: Wrench },
        { key: "preview", label: "确认信息", icon: Check },
    ];

    let canProceedFromPersona = $derived(Boolean(selectedPersonaId));
    let canSave = $derived(Boolean(selectedPersonaId && agentName.trim()));

    function selectPersona(id: string) {
        selectedPersonaId = id;
        const persona = allPersonas.find((item) => item.id === id);
        if (persona && !agentName.trim()) {
            agentName = `${persona.name} Agent`;
        }
    }

    function toggleSkill(skillId: string) {
        selectedSkillIds = selectedSkillIds.includes(skillId)
            ? selectedSkillIds.filter((id) => id !== skillId)
            : [...selectedSkillIds, skillId];
    }

    function removeSkill(skillId: string) {
        selectedSkillIds = selectedSkillIds.filter((id) => id !== skillId);
    }

    function goToStep(step: Step) {
        if ((step === "skills" || step === "preview") && !canProceedFromPersona) return;
        currentStep = step;
    }

    function nextStep() {
        if (currentStep === "persona" && canProceedFromPersona) currentStep = "skills";
        else if (currentStep === "skills") currentStep = "preview";
    }

    function prevStep() {
        if (currentStep === "preview") currentStep = "skills";
        else if (currentStep === "skills") currentStep = "persona";
    }

    function handleSave() {
        if (!canSave) return;

        const cleanName = agentName.trim();
        const cleanDescription = agentDescription.trim();

        if (mode === "edit" && agentId) {
            agentStore.update(agentId, {
                name: cleanName,
                description: cleanDescription,
                personaId: selectedPersonaId,
                skillIds: selectedSkillIds,
            });

            const updated = agentStore.getById(agentId);
            if (updated) {
                toastStore.success(`Agent "${updated.name}" 已更新`);
                onSave?.(updated);
            }
            return;
        }

        const newAgent = agentStore.create({
            name: cleanName,
            description: cleanDescription || `${cleanName} combines one persona with ${selectedSkillIds.length} selected skills.`,
            personaId: selectedPersonaId,
            skillIds: selectedSkillIds,
        });

        toastStore.success(`Agent "${newAgent.name}" 已创建`);
        onSave?.(newAgent);
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            e.preventDefault();
            onCancel?.();
        } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            if (currentStep === "preview" && canSave) {
                handleSave();
            } else if (currentStep === "persona" && canProceedFromPersona) {
                currentStep = "skills";
            } else if (currentStep === "skills") {
                currentStep = "preview";
            }
        }
    }

    function stepStatus(step: Step) {
        if (currentStep === step) return "active";
        if (step === "persona" && selectedPersonaId) return "done";
        if (step === "skills" && currentStep === "preview") return "done";
        return "idle";
    }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white shadow-2xl dark:bg-slate-900">
    <div class="flex shrink-0 items-start justify-between border-b border-slate-200 p-5 dark:border-slate-800">
        <div class="flex items-start gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Sparkles class="h-5 w-5" />
            </div>
            <div>
                <h2 class="text-lg font-bold text-slate-950 dark:text-white">
                    {mode === "edit" ? "编辑 Agent" : "拼装 Agent"}
                </h2>
                <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    角色人设 x 认知技能 = 专属 Agent。保存后可在工作坊中管理与启动。
                </p>
            </div>
        </div>
        <button
            onclick={onCancel}
            class="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="关闭"
            aria-label="关闭拼装器"
        >
            <X class="h-5 w-5" />
        </button>
    </div>

    <!-- // [问题2] 步骤条容器增加横向滚动与防挤压，防止 375px 窄屏溢出截断 -->
    <div class="flex shrink-0 items-center gap-2 border-b border-slate-100 px-6 py-3 overflow-x-auto no-scrollbar dark:border-slate-800">
        {#each steps as step, index}
            {@const status = stepStatus(step.key)}
            {@const StepIcon = step.icon}
            <button
                onclick={() => goToStep(step.key)}
                class="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition {status === 'active'
                    ? 'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                    : status === 'done'
                      ? 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}"
                aria-current={status === "active" ? "step" : undefined}
            >
                <StepIcon class="h-3.5 w-3.5" />
                <span>{step.label}</span>
            </button>
            {#if index < steps.length - 1}
                <ChevronRight class="h-3.5 w-3.5 text-slate-300" />
            {/if}
        {/each}
    </div>

    <div class="flex-1 overflow-y-auto p-6">
        {#if currentStep === "persona"}
            <section in:fly={{ x: -16, duration: 180 }} class="space-y-5">
                <div>
                    <h3 class="flex items-center gap-2 text-base font-bold text-slate-950 dark:text-white">
                        <User class="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        选择角色人设
                    </h3>
                    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        选择此 Agent 的行为基底。Agent 的名称后续仍可进行编辑。
                    </p>
                </div>

                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {#each allPersonas as persona}
                        <button
                            onclick={() => selectPersona(persona.id)}
                            class="rounded-xl border-2 p-4 text-left transition hover:shadow-xs {selectedPersonaId === persona.id
                                ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/30'
                                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'}"
                        >
                            <div class="flex items-start justify-between gap-3">
                                <div class="flex items-start gap-3">
                                    <AgentAvatar agent={persona.id || persona.name} size="sm" shape="rounded" />
                                    <div>
                                        <div class="font-semibold text-slate-900 dark:text-white">{persona.name}</div>
                                        <p class="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                            {persona.roleSetting}
                                        </p>
                                    </div>
                                </div>
                                {#if selectedPersonaId === persona.id}
                                    <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                                        <Check class="h-3.5 w-3.5" />
                                    </span>
                                {/if}
                            </div>
                        </button>
                    {/each}
                </div>

                <div class="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40 sm:grid-cols-2">
                    <label class="block">
                        <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">Agent 名称 *</span>
                        <input
                            bind:value={agentName}
                            class="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            placeholder="例如：职业顾问 Agent"
                        />
                    </label>
                    <label class="block">
                        <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">描述说明</span>
                        <input
                            bind:value={agentDescription}
                            class="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            placeholder="这个 Agent 能提供什么帮助？"
                        />
                    </label>
                </div>
            </section>
        {:else if currentStep === "skills"}
            <section in:fly={{ x: 16, duration: 180 }} class="space-y-5">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h3 class="flex items-center gap-2 text-base font-bold text-slate-950 dark:text-white">
                            <Wrench class="h-4 w-4 text-teal-600 dark:text-teal-400" />
                            配备技能
                        </h3>
                        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            已选择 {selectedSkillIds.length} 个技能。技能定义了 Agent 可用的工作工具。
                        </p>
                    </div>
                    <div class="relative w-full sm:w-72">
                        <Search class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                            bind:value={skillSearchQuery}
                            aria-label="搜索技能"
                            class="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            placeholder="搜索技能..."
                        />
                    </div>
                </div>

                {#if selectedSkillDefs.length > 0}
                    <div class="flex flex-wrap gap-2 rounded-xl border border-teal-200/80 bg-teal-50/50 p-3 dark:border-teal-900/60 dark:bg-teal-950/20">
                        {#each selectedSkillDefs as skill}
                            <button
                                onclick={() => removeSkill(skill.id)}
                                class="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition hover:text-red-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:text-red-300"
                                title="移除 {skill.name}"
                            >
                                {skill.name}
                                <X class="h-3 w-3" />
                            </button>
                        {/each}
                    </div>
                {/if}

                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {#each filteredSkills as skill}
                        {@const config = skillTypeConfig[skill.type] || skillTypeConfig.analysis}
                        <button
                            onclick={() => toggleSkill(skill.id)}
                            class="rounded-xl border-2 p-4 text-left transition hover:shadow-xs {selectedSkillIds.includes(skill.id)
                                ? 'border-teal-600 bg-teal-50/50 dark:border-teal-500 dark:bg-teal-950/30'
                                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'}"
                        >
                            <div class="flex items-start justify-between gap-3">
                                <div class="min-w-0">
                                    <div class="mb-2 flex flex-wrap items-center gap-2">
                                        <span class="rounded-md px-2 py-0.5 text-xs font-semibold {config.bg} {config.text}">
                                            {config.label}
                                        </span>
                                        {#if selectedSkillIds.includes(skill.id)}
                                            <span class="rounded-md bg-teal-600 px-2 py-0.5 text-xs font-semibold text-white">已选择</span>
                                        {/if}
                                    </div>
                                    <div class="font-semibold text-slate-900 dark:text-white">{skill.name}</div>
                                    <p class="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{skill.oneLiner}</p>
                                    {#if skill.io}
                                        <div class="mt-3 grid gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
                                            <div>
                                                <span class="font-semibold text-slate-700 dark:text-slate-200">输入</span>
                                                <p class="mt-0.5 line-clamp-2">{skill.io.input}</p>
                                            </div>
                                            <div>
                                                <span class="font-semibold text-slate-700 dark:text-slate-200">输出</span>
                                                <p class="mt-0.5 line-clamp-2">{skill.io.output}</p>
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                                <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full {selectedSkillIds.includes(skill.id) ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}">
                                    <Check class="h-3.5 w-3.5" />
                                </span>
                            </div>
                        </button>
                    {/each}
                </div>
            </section>
        {:else}
            <section in:fly={{ x: 16, duration: 180 }} class="space-y-5">
                <div>
                    <h3 class="flex items-center gap-2 text-base font-bold text-slate-950 dark:text-white">
                        <Bot class="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        检查 Agent 信息
                    </h3>
                    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        保存后将返回 Agent 工作坊。确认启动后将以此 Agent 为上下文打开工作台。
                    </p>
                </div>

                <div class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/40">
                    <div class="flex flex-col gap-5 sm:flex-row sm:items-start">
                        <AgentAvatar agent={selectedPersonaId || agentName} size="xl" shape="rounded" />
                        <div class="min-w-0 flex-1">
                            <h4 class="text-xl font-bold text-slate-950 dark:text-white">{agentName || "未命名 Agent"}</h4>
                            <p class="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                {agentDescription || "暂无描述。"}
                            </p>

                            <div class="mt-5 grid gap-4 sm:grid-cols-2">
                                <div class="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                                    <div class="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        <User class="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                                        角色人设 (Persona)
                                    </div>
                                    <div class="font-medium text-xs text-slate-900 dark:text-white">
                                        {selectedPersona?.name || "未选择角色"}
                                    </div>
                                </div>

                                <div class="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                                    <div class="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        <Wrench class="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                                        配备技能 ({selectedSkillDefs.length})
                                    </div>
                                    {#if selectedSkillDefs.length > 0}
                                        <div class="flex flex-wrap gap-1.5">
                                            {#each selectedSkillDefs as skill}
                                                <span class="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                    {skill.name}
                                                </span>
                                            {/each}
                                        </div>
                                    {:else}
                                        <p class="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                            未配备任何技能。该 Agent 仍可正常启动，但暂不具备任何结构化的工具。
                                        </p>
                                    {/if}
                                </div>
                            </div>

                            <!-- AI Output Restraint Iron Rule Info -->
                            <div class="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 dark:border-indigo-950/40 dark:bg-indigo-950/20">
                                <div class="flex items-center justify-between gap-2">
                                    <div class="flex items-center gap-2">
                                        <ShieldCheck class="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                        <span class="text-xs font-bold text-slate-900 dark:text-white">AI 输出克制铁律武装</span>
                                    </div>
                                    <span class="text-[10px] px-2 py-0.5 rounded font-mono bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                                        {settingsStore.enableOutputRestraint && settingsStore.restraintLevel !== 'off' ? `全局启用 · ${settingsStore.restraintLevel}` : '已暂停'}
                                    </span>
                                </div>
                                <p class="mt-1.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                                    {settingsStore.enableOutputRestraint && settingsStore.restraintLevel !== 'off'
                                        ? '该 Agent 执行时将自动前置注入最高铁律：短、准、直接、高信息密度；只保留结论、关键依据与必要动作。'
                                        : '当前未启用全局克制铁律。'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        {/if}
    </div>

    <div class="flex shrink-0 items-center justify-between border-t border-slate-200 p-4 dark:border-slate-800">
        <button
            onclick={currentStep === "persona" ? onCancel : prevStep}
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
            {#if currentStep !== "persona"}
                <ArrowLeft class="h-3.5 w-3.5" />
            {/if}
            {currentStep === "persona" ? "取消" : "上一步"}
        </button>

        {#if currentStep === "preview"}
            <button
                onclick={handleSave}
                disabled={!canSave}
                class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 shadow-xs disabled:cursor-not-allowed disabled:opacity-50"
            >
                <Check class="h-3.5 w-3.5" />
                {mode === "edit" ? "保存修改" : "创建并进入启动确认"}
            </button>
        {:else}
            <button
                onclick={nextStep}
                disabled={currentStep === "persona" && !canProceedFromPersona}
                class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 shadow-xs disabled:cursor-not-allowed disabled:opacity-50"
            >
                下一步
                <ChevronRight class="h-3.5 w-3.5" />
            </button>
        {/if}
    </div>
</div>
