<script lang="ts">
    import { fade, slide } from "svelte/transition";
    import { skillRegistry, type SkillDefinition, type SkillType } from "$lib/skills";
    import SkillEditor from "$lib/components/agent-studio/SkillEditor.svelte";
    import {
        AlertCircle,
        ArrowRight,
        Copy,
        Download,
        Edit3,
        Plus,
        RefreshCw,
        Search,
        Trash2,
        Upload,
        Wrench,
        Zap,
    } from "lucide-svelte";

    type ScopeFilter = "all" | "builtin" | "custom";

    let searchQuery = $state("");
    let activeType = $state<"" | SkillType>("");
    let scopeFilter = $state<ScopeFilter>("all");
    let isEditorOpen = $state(false);
    let editingSkill = $state<Partial<SkillDefinition> | null>(null);
    let notice = $state("");
    let error = $state("");

    let allSkills = $derived(skillRegistry.getAll());
    let customCount = $derived(allSkills.filter((skill) => !skill.isBuiltIn).length);
    let builtinCount = $derived(allSkills.filter((skill) => skill.isBuiltIn).length);

    const skillTypes: { id: "" | SkillType; label: string; icon: string }[] = [
        { id: "", label: "全部", icon: "✨" },
        { id: "analysis", label: "结构化拆解", icon: "🔍" },
        { id: "quantitative", label: "量化决策", icon: "⚖️" },
        { id: "evaluation", label: "风险评估", icon: "🃏" },
        { id: "exploration", label: "多维发散", icon: "🔄" },
        { id: "generation", label: "输出生成", icon: "✅" },
    ];

    const skillTypeConfig: Record<string, { label: string; bg: string; icon: string }> = {
        analysis: { label: "结构化拆解", bg: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300", icon: "🔍" },
        quantitative: { label: "量化决策", bg: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300", icon: "⚖️" },
        evaluation: { label: "风险评估", bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300", icon: "🃏" },
        exploration: { label: "多维发散", bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300", icon: "🔄" },
        generation: { label: "输出生成", bg: "bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300", icon: "✅" },
    };

    function getTypeCount(typeId: "" | SkillType): number {
        let base = allSkills;
        if (scopeFilter === "builtin") base = base.filter((s) => s.isBuiltIn);
        if (scopeFilter === "custom") base = base.filter((s) => !s.isBuiltIn);
        if (!typeId) return base.length;
        return base.filter((s) => s.type === typeId).length;
    }

    let filteredSkills = $derived.by(() => {
        const query = searchQuery.trim().toLowerCase();
        return allSkills.filter((skill) => {
            if (scopeFilter === "builtin" && !skill.isBuiltIn) return false;
            if (scopeFilter === "custom" && skill.isBuiltIn) return false;

            const matchesType = !activeType || skill.type === activeType;
            if (!matchesType) return false;

            if (!query) return true;

            return [
                skill.name,
                skill.oneLiner,
                skill.description,
                skill.type,
                skill.io?.input,
                skill.io?.output,
                ...(skill.tags || []),
                ...(skill.trigger?.keywords || []),
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query));
        });
    });

    function clearMessages() {
        notice = "";
        error = "";
    }

    function openCreate() {
        clearMessages();
        editingSkill = {};
        isEditorOpen = true;
    }

    function openEdit(skill: SkillDefinition) {
        clearMessages();
        editingSkill = JSON.parse(JSON.stringify(skill));
        isEditorOpen = true;
    }

    function duplicateSkill(id: string) {
        clearMessages();
        try {
            const copy = skillRegistry.duplicate(id);
            notice = `已成功克隆技能副本「${copy.name}」`;
        } catch (err) {
            error = (err as Error).message;
        }
    }

    function deleteSkill(skill: SkillDefinition) {
        clearMessages();
        if (skill.isBuiltIn) {
            error = "内置技能受系统保护无法删除。点击编辑可生成可定制的覆盖版本。";
            return;
        }

        if (confirm(`确认删除自定义技能「${skill.name}」吗？使用该技能的 Agent 将解除关联。`)) {
            try {
                skillRegistry.unregister(skill.id);
                notice = `已删除技能「${skill.name}」`;
            } catch (err) {
                error = (err as Error).message;
            }
        }
    }

    function saveSkill(skillData: SkillDefinition) {
        clearMessages();
        try {
            if (editingSkill?.id && skillRegistry.getById(editingSkill.id)) {
                skillRegistry.update(editingSkill.id, skillData);
                notice = `已保存技能「${skillData.name}」`;
            } else {
                skillRegistry.register(skillData);
                notice = `已创建新技能「${skillData.name}」`;
            }
            isEditorOpen = false;
            editingSkill = null;
        } catch (err) {
            error = (err as Error).message;
        }
    }

    function exportSkills() {
        clearMessages();
        const data = skillRegistry.exportAll();
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `custom_skills_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
        notice = "已导出全部自定义技能数据。";
    }

    function importSkills() {
        clearMessages();
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,application/json";
        input.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const count = skillRegistry.importSkills(await file.text());
                notice = `成功导入 ${count} 个技能！`;
            } catch (err) {
                error = `导入失败: ${(err as Error).message}`;
            }
        };
        input.click();
    }
</script>

<svelte:head>
    <title>认知技能库 - Agent Studio</title>
</svelte:head>

<div class="space-y-6 max-w-7xl mx-auto" in:fade={{ duration: 180 }}>
    <!-- Clean, unboxed page header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
            <div class="flex items-center gap-2">
                <h1 class="text-xl font-bold text-slate-900 dark:text-white">认知技能库 (Skills)</h1>
                <span class="text-xs text-slate-400 font-mono">({allSkills.length} 总技能 · {builtinCount} 内置 · {customCount} 自定义)</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                技能是 Agent 组装搭载的结构化认知工具，支持 I/O 协议定义、正则自动触发与多阶段流水线。
            </p>
        </div>
        <div class="flex flex-wrap items-center gap-2 shrink-0">
            <button
                onclick={openCreate}
                class="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-teal-500 active:scale-95 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
                <Plus class="h-3.5 w-3.5" />
                新建技能
            </button>
            <button
                onclick={importSkills}
                class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
                <Upload class="h-3.5 w-3.5" />
                导入
            </button>
            <button
                onclick={exportSkills}
                class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
                <Download class="h-3.5 w-3.5" />
                导出
            </button>
            <a
                href="/agent-studio"
                class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
                返回工作坊
                <ArrowRight class="h-3.5 w-3.5" />
            </a>
        </div>
    </div>

    {#if notice || error}
        <section class="rounded-xl border p-3 text-xs {error ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300'}">
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    <AlertCircle class="h-4 w-4 shrink-0" />
                    <span>{error || notice}</span>
                </div>
                <button onclick={clearMessages} class="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer">关闭</button>
            </div>
        </section>
    {/if}

    <!-- Main Content Section matching +page.svelte and personas/+page.svelte -->
    <section class="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        <!-- Control Header matching Personas and Main page -->
        <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div class="relative w-full lg:max-w-md">
                <Search class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                    bind:value={searchQuery}
                    aria-label="搜索技能、设定或I/O契约"
                    class="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none transition focus:border-teal-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-white"
                    placeholder="搜索技能、设定、触发词、I/O..."
                />
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
                <div class="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs mr-2">
                    <button
                        onclick={() => (scopeFilter = "all")}
                        class="px-2 py-0.5 rounded-md font-medium transition-all {scopeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'}"
                    >
                        全部
                    </button>
                    <button
                        onclick={() => (scopeFilter = "builtin")}
                        class="px-2 py-0.5 rounded-md font-medium transition-all {scopeFilter === 'builtin' ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'}"
                    >
                        内置
                    </button>
                    <button
                        onclick={() => (scopeFilter = "custom")}
                        class="px-2 py-0.5 rounded-md font-medium transition-all {scopeFilter === 'custom' ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'}"
                    >
                        自定义
                    </button>
                </div>

                {#each skillTypes as type}
                    {@const isCurrent = activeType === type.id}
                    <button
                        onclick={() => (activeType = type.id)}
                        class="rounded-lg px-2.5 py-1 text-xs font-medium transition {isCurrent ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}"
                    >
                        <span>{type.label}</span>
                    </button>
                {/each}
            </div>
        </div>

        <!-- Cards Grid in identical style as personas and main studio cards -->
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {#each filteredSkills as skill (skill.id)}
                {@const typeConfig = skillTypeConfig[skill.type] || skillTypeConfig.analysis}
                <article
                    class="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 transition-all hover:border-slate-300 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/30 dark:hover:border-slate-700"
                    in:slide={{ duration: 160 }}
                >
                    <div>
                        <!-- Card Top (Avatar + Title + Tags) -->
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 border border-teal-200/50 dark:border-teal-900/50 text-lg shadow-xs">
                                {skill.visual?.icon || typeConfig.icon || "⚡"}
                            </div>
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-2">
                                    <h3 class="font-bold text-sm text-slate-900 dark:text-white truncate" title={skill.name}>{skill.name}</h3>
                                    <span class="rounded px-1.5 py-0.5 text-[10px] font-medium {skill.isBuiltIn ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'}">
                                        {skill.isBuiltIn ? "内置" : "自定义"}
                                    </span>
                                </div>
                                <div class="mt-1 flex items-center gap-1.5">
                                    <span class="rounded px-1.5 py-0.2 text-[10px] font-medium {typeConfig.bg}">
                                        {typeConfig.label}
                                    </span>
                                    {#if skill.version}
                                        <span class="font-mono text-[10px] text-slate-400">v{skill.version}</span>
                                    {/if}
                                </div>
                            </div>
                        </div>

                        <!-- One-liner & Description -->
                        <p class="mt-3 text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">{skill.oneLiner}</p>
                        <p class="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{skill.description}</p>

                        <!-- Structured Clean Metadata: inline & uncluttered -->
                        <div class="mt-3.5 space-y-1.5 border-t border-slate-200/60 dark:border-slate-800/60 pt-2.5 text-xs">
                            <div class="flex items-baseline justify-between text-[11px]">
                                <span class="text-slate-400 shrink-0">输入</span>
                                <span class="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px] text-right">{skill.io?.input || "结构化请求"}</span>
                            </div>
                            <div class="flex items-baseline justify-between text-[11px]">
                                <span class="text-teal-600 dark:text-teal-400 shrink-0">输出</span>
                                <span class="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px] text-right">{skill.io?.output || "推演成果"}</span>
                            </div>
                        </div>

                        {#if (skill.trigger?.keywords || skill.tags || []).length > 0}
                            <div class="mt-2.5 flex flex-wrap gap-1">
                                {#each (skill.trigger?.keywords || skill.tags || []).slice(0, 4) as tag}
                                    <span class="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        #{tag}
                                    </span>
                                {/each}
                            </div>
                        {/if}
                    </div>

                    <!-- Footer -->
                    <div class="mt-3.5 flex items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                        <div class="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                            <Zap class="h-3 w-3 text-teal-500" />
                            {skill.steps?.length || 0} 个阶段流
                        </div>
                        <div class="flex items-center gap-0.5">
                            <button
                                onclick={() => duplicateSkill(skill.id)}
                                aria-label={`克隆技能 ${skill.name}`}
                                class="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                                title="克隆技能"
                            >
                                <Copy class="h-3.5 w-3.5" />
                            </button>
                            <button
                                onclick={() => openEdit(skill)}
                                aria-label={skill.isBuiltIn ? `查看/自定义技能 ${skill.name}` : `编辑技能 ${skill.name}`}
                                class="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                                title={skill.isBuiltIn ? "查看并创建自定义副本" : "编辑技能"}
                            >
                                <Edit3 class="h-3.5 w-3.5" />
                            </button>
                            {#if !skill.isBuiltIn}
                                <button
                                    onclick={() => deleteSkill(skill)}
                                    aria-label={`删除技能 ${skill.name}`}
                                    class="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                                    title="删除自定义技能"
                                >
                                    <Trash2 class="h-3.5 w-3.5" />
                                </button>
                            {:else}
                                <span
                                    class="rounded-lg p-1.5 text-slate-300 dark:text-slate-600"
                                    title="内置稳定技能"
                                    aria-label="内置技能受保护"
                                >
                                    <RefreshCw class="h-3.5 w-3.5" />
                                </span>
                            {/if}
                        </div>
                    </div>
                </article>
            {:else}
                <div class="col-span-full rounded-xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-800">
                    <Wrench class="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <h3 class="font-semibold text-sm text-slate-900 dark:text-white">没有匹配的技能</h3>
                    <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">请清空搜索条件或为此 Agent 工作流创建一个自定义技能。</p>
                    <button
                        onclick={openCreate}
                        class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-500 cursor-pointer"
                    >
                        <Plus class="h-3.5 w-3.5" />
                        新建技能
                    </button>
                </div>
            {/each}
        </div>
    </section>
</div>

{#if isEditorOpen}
    <SkillEditor
        skill={editingSkill || {}}
        onSave={saveSkill}
        onCancel={() => {
            isEditorOpen = false;
            editingSkill = null;
        }}
    />
{/if}
