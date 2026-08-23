<script lang="ts">
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { fade, fly, slide } from "svelte/transition";
    import {
        ArrowLeft,
        ArrowRight,
        Bot,
        Copy,
        Edit,
        Edit3,
        Layers3,
        Plus,
        Rocket,
        Search,
        Trash2,
        Users,
    } from "lucide-svelte";
    import { agentStore as registryStore, type Agent, type Squad } from "$lib/agents";
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import AgentFlowEditor from "$lib/components/agent-studio/AgentFlowEditor.svelte";
    import SquadBuilder from "$lib/components/agent-studio/SquadBuilder.svelte";
    import AgentAvatar from "$lib/components/ui/AgentAvatar.svelte";
    import {
        workflowStore,
        type WorkflowRecord,
    } from "$lib/orchestration/workflowStore.svelte";
    import { toastStore } from "$lib/stores/toastStore.svelte";

    type ViewMode = "squads" | "workflows";

    let viewMode = $state<ViewMode>("squads");
    let searchQuery = $state("");
    let squadTypeFilter = $state<"" | Squad["orchestrationType"]>("");
    let selectedWorkflowId = $state<string | null>(null);
    let showSquadBuilder = $state(false);
    let editingSquadId = $state("");

    const squadsAdapter = { subscribe: registryStore.subscribeSquads };
    let squads = $derived($squadsAdapter);
    let allAgents = $derived($registryStore);

    const agentAliases: Record<string, string> = {
        builtin_mentor_agent: "导师 Agent",
        builtin_analyst_agent: "分析师 Agent",
        builtin_coach_agent: "教练 Agent",
    };

    const orchestrationConfig: Record<Squad["orchestrationType"], { label: string; icon: string; bg: string }> = {
        sequential: { label: "顺序流转", icon: "➡️", bg: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
        parallel: { label: "并行分发", icon: "⚡", bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
        debate: { label: "对抗辩论", icon: "⚔️", bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
        round_robin: { label: "轮询共识", icon: "🔄", bg: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300" },
    };

    const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
        lead: { label: "组长", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-950/40" },
        worker: { label: "主力", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-950/40" },
        reviewer: { label: "审核", color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 dark:bg-purple-950/40" },
        analyst: { label: "分析", color: "text-teal-700 dark:text-teal-300", bg: "bg-teal-50 dark:bg-teal-950/40" },
    };

    let filteredSquads = $derived.by(() => {
        const q = searchQuery.trim().toLowerCase();
        return squads.filter((squad) => {
            const memberNames = squad.members
                .map((m) => {
                    const agent = allAgents.find((a) => a.id === m.agentId);
                    return agent ? displayAgentName(agent) : "";
                })
                .join(" ");

            const matchesQuery =
                !q ||
                [squad.name, squad.description, squad.orchestrationType, memberNames]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(q));

            const matchesType = !squadTypeFilter || squad.orchestrationType === squadTypeFilter;
            return matchesQuery && matchesType;
        });
    });

    let filteredWorkflows = $derived.by(() => {
        const q = searchQuery.trim().toLowerCase();
        const workflows = [...$workflowStore].sort(
            (a, b) => b.updatedAt - a.updatedAt,
        );

        if (!q) return workflows;

        return workflows.filter((workflow) =>
            [workflow.name, workflow.description, ...(workflow.tags || [])]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(q)),
        );
    });

    let currentWorkflowTitle = $derived.by(() => {
        if (selectedWorkflowId === "new") return "新建工作流画布";
        return (
            $workflowStore.find((workflow) => workflow.id === selectedWorkflowId)
                ?.name ?? "工作流画布编辑器"
        );
    });

    let selectedWorkflowRunHref = $derived.by(() =>
        selectedWorkflowId && selectedWorkflowId !== "new"
            ? `/multi-agent?workflowId=${encodeURIComponent(selectedWorkflowId)}`
            : "/multi-agent",
    );

    function displayAgentName(agent: Agent) {
        return agentAliases[agent.id] || agent.name;
    }

    function createSquad() {
        editingSquadId = "";
        showSquadBuilder = true;
    }

    function editSquad(id: string) {
        editingSquadId = id;
        showSquadBuilder = true;
    }

    function closeSquadBuilder() {
        editingSquadId = "";
        showSquadBuilder = false;
    }

    function onSquadSave(squad: Squad) {
        showSquadBuilder = false;
        editingSquadId = "";
        toastStore.success(`协同小组已就绪: ${squad.name}`);
    }

    function deleteSquad(id: string) {
        const squad = squads.find((item) => item.id === id);
        const label = squad ? ` "${squad.name}"` : "";

        if (confirm(`确认删除协同小组${label}吗？`)) {
            registryStore.deleteSquad(id);
            toastStore.success("协同小组已删除。");
        }
    }

    function launchSquad(squad: Squad) {
        agentStore.currentSession.activeAgentIds = squad.members.map(
            (member) => member.agentId,
        );
        goto(`${base}/multi-agent?squadId=${encodeURIComponent(squad.id)}`);
    }

    function openWorkflow(id: string | "new") {
        selectedWorkflowId = id;
        viewMode = "workflows";
    }

    function closeWorkflowEditor() {
        selectedWorkflowId = null;
    }

    function runWorkflow(workflow: WorkflowRecord) {
        goto(`${base}/multi-agent?workflowId=${encodeURIComponent(workflow.id)}`);
    }

    function cloneWorkflow(workflow: WorkflowRecord) {
        const clone = workflowStore.cloneWorkflow(workflow.id);
        if (clone) {
            toastStore.success(`已成功克隆工作流副本「${workflow.name}」`);
        }
    }

    function deleteWorkflow(workflow: WorkflowRecord) {
        if (confirm(`确认删除工作流「${workflow.name}」吗？`)) {
            workflowStore.deleteWorkflow(workflow.id);
            toastStore.success("工作流已删除。");
        }
    }

    function formatDate(value: number) {
        return new Date(value).toLocaleDateString("zh-CN", {
            month: "short",
            day: "numeric",
        });
    }
</script>

<svelte:head>
    <title>协同编排中心 - Agent Studio</title>
</svelte:head>

{#if selectedWorkflowId}
    <section class="flex h-[calc(100vh-10rem)] min-h-[640px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div class="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200/80 px-5 py-3.5 dark:border-slate-800">
            <div class="flex min-w-0 items-center gap-3">
                <button
                    onclick={closeWorkflowEditor}
                    class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/80 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
                    aria-label="返回工作流列表"
                    title="返回工作流列表"
                >
                    <ArrowLeft class="h-4 w-4" />
                </button>
                <div class="min-w-0">
                    <div class="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        图形化编排画布
                    </div>
                    <h1 class="truncate text-base font-bold text-slate-950 dark:text-white">
                        {currentWorkflowTitle}
                    </h1>
                </div>
            </div>
            <a
                href={selectedWorkflowRunHref}
                class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 shadow-xs"
            >
                <Rocket class="h-3.5 w-3.5" />
                {selectedWorkflowId === "new" ? "打开工作台" : "在工作台运行"}
            </a>
        </div>

        <div class="min-h-0 flex-1 relative">
            <AgentFlowEditor
                workflowId={selectedWorkflowId === "new" ? null : selectedWorkflowId}
                onSaveSuccess={() => {
                    toastStore.success("工作流画布已保存。");
                }}
            />
        </div>
    </section>
{:else}
    <div class="space-y-6 max-w-7xl mx-auto" in:fade={{ duration: 180 }}>
        <!-- Clean, unboxed page header -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
            <div>
                <div class="flex items-center gap-2">
                    <h1 class="text-xl font-bold text-slate-900 dark:text-white">协同编排中心 (Orchestration)</h1>
                    <span class="text-xs text-slate-400 font-mono">({squads.length} 协同小组 · {$workflowStore.length} 工作流)</span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    组织多角色 Agent 攻坚协同（顺序接力、并行分发、对抗辩论），或使用可视化画布固化执行方案。
                </p>
            </div>
            <div class="flex flex-wrap items-center gap-2 shrink-0">
                {#if viewMode === "squads"}
                    <button
                        onclick={createSquad}
                        class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 active:scale-95 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
                    >
                        <Plus class="h-3.5 w-3.5" />
                        新建协同小组
                    </button>
                {:else}
                    <button
                        onclick={() => openWorkflow("new")}
                        class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 active:scale-95 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
                    >
                        <Plus class="h-3.5 w-3.5" />
                        新建工作流画布
                    </button>
                {/if}
                <a
                    href="{base}/multi-agent"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                    进入工作台
                    <ArrowRight class="h-3.5 w-3.5" />
                </a>
            </div>
        </div>

        <!-- Unified Section Container matching Home & Personas -->
        <section class="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <!-- Search & Controls Header -->
            <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div class="relative w-full lg:max-w-md">
                    <Search class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                        bind:value={searchQuery}
                        aria-label={viewMode === "squads" ? "搜索协同小组或成员" : "搜索工作流"}
                        class="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-white"
                        placeholder={viewMode === "squads" ? "搜索小组名称、设定或成员..." : "搜索工作流名称、标签..."}
                    />
                </div>

                <div class="flex flex-wrap items-center gap-2">
                    <!-- Segmented View Switcher -->
                    <div class="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                        <button
                            onclick={() => (viewMode = "squads")}
                            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all cursor-pointer {viewMode === 'squads' ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white font-semibold' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'}"
                        >
                            <Users class="h-3.5 w-3.5" />
                            <span>协同小组 ({squads.length})</span>
                        </button>
                        <button
                            onclick={() => (viewMode = "workflows")}
                            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all cursor-pointer {viewMode === 'workflows' ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white font-semibold' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'}"
                        >
                            <Layers3 class="h-3.5 w-3.5" />
                            <span>工作流 ({$workflowStore.length})</span>
                        </button>
                    </div>

                    {#if viewMode === "squads"}
                        <!-- Squad mode filter pills -->
                        <div class="flex flex-wrap gap-1">
                            <button
                                onclick={() => (squadTypeFilter = "")}
                                class="rounded-lg px-2.5 py-1 text-xs font-medium transition {squadTypeFilter === '' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}"
                            >
                                全部
                            </button>
                            {#each Object.entries(orchestrationConfig) as [typeKey, config]}
                                <button
                                    onclick={() => (squadTypeFilter = typeKey as Squad["orchestrationType"])}
                                    class="rounded-lg px-2.5 py-1 text-xs font-medium transition {squadTypeFilter === typeKey ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}"
                                >
                                    <span>{config.label}</span>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Content Area in identical style as personas and main studio cards -->
            {#if viewMode === "squads"}
                {#if filteredSquads.length === 0}
                    <div class="rounded-xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-800">
                        <Users class="mx-auto mb-2 h-8 w-8 text-slate-300" />
                        <h3 class="font-semibold text-sm text-slate-900 dark:text-white">
                            {squads.length === 0 ? "暂无协同攻坚小组" : "没有匹配的协同小组"}
                        </h3>
                        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">请清空搜索条件或新建一个多人攻坚小组。</p>
                        <button
                            onclick={createSquad}
                            class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 cursor-pointer"
                        >
                            <Plus class="h-3.5 w-3.5" />
                            新建协同小组
                        </button>
                    </div>
                {:else}
                    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {#each filteredSquads as squad (squad.id)}
                            {@const modeConfig = orchestrationConfig[squad.orchestrationType] || orchestrationConfig.sequential}
                            <article
                                class="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 transition-all hover:border-slate-300 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/30 dark:hover:border-slate-700"
                                in:slide={{ duration: 160 }}
                            >
                                <div>
                                    <!-- Card Top -->
                                    <div class="flex items-start gap-3">
                                        <div class="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/50 text-lg shadow-xs">
                                            {modeConfig.icon}
                                        </div>
                                        <div class="min-w-0 flex-1">
                                            <div class="flex items-center gap-2">
                                                <h3 class="font-bold text-sm text-slate-900 dark:text-white truncate" title={squad.name}>
                                                    {squad.name}
                                                </h3>
                                                <span class="rounded px-1.5 py-0.5 text-[10px] font-medium {modeConfig.bg}">
                                                    {modeConfig.label}
                                                </span>
                                            </div>
                                            <p class="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                {squad.description || "暂无协同描述。"}
                                            </p>
                                        </div>
                                    </div>

                                    <!-- Tactical Member Chips: inline & uncluttered -->
                                    <div class="mt-3.5 space-y-1.5 border-t border-slate-200/60 dark:border-slate-800/60 pt-2.5 text-xs">
                                        <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                                            <span>阵容分工</span>
                                            <span>{squad.members.length} 位</span>
                                        </div>
                                        {#if squad.members.length > 0}
                                            <div class="flex flex-wrap gap-1.5">
                                                {#each squad.members.slice(0, 4) as member}
                                                    {@const agent = allAgents.find((a) => a.id === member.agentId)}
                                                    {@const role = roleConfig[member.role] || roleConfig.worker}
                                                    {#if agent}
                                                        <div class="inline-flex items-center gap-1.5 rounded-md bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 px-2 py-1 text-xs">
                                                            <AgentAvatar agent={agent.id || agent.name} size="xs" shape="rounded" />
                                                            <span class="truncate max-w-[85px] text-[11px] font-medium text-slate-700 dark:text-slate-200">{displayAgentName(agent)}</span>
                                                            <span class="px-1 py-0.2 rounded text-[9px] font-semibold {role.bg} {role.color}">{role.label}</span>
                                                        </div>
                                                    {/if}
                                                {/each}
                                                {#if squad.members.length > 4}
                                                    <span class="text-[10px] text-slate-400 self-center">+{squad.members.length - 4}</span>
                                                {/if}
                                            </div>
                                        {:else}
                                            <span class="text-[10px] text-slate-400">未链接小组成员</span>
                                        {/if}
                                    </div>
                                </div>

                                <!-- Card Footer -->
                                <div class="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                                    <div class="flex items-center gap-0.5">
                                        <button
                                            onclick={() => editSquad(squad.id)}
                                            class="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                                            aria-label="编辑小组"
                                            title="编辑小组"
                                        >
                                            <Edit3 class="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onclick={() => deleteSquad(squad.id)}
                                            class="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                                            aria-label="删除小组"
                                            title="删除小组"
                                        >
                                            <Trash2 class="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    <button
                                        onclick={() => launchSquad(squad)}
                                        disabled={squad.members.length === 0}
                                        class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
                                    >
                                        <Rocket class="h-3.5 w-3.5" />
                                        启动小组
                                    </button>
                                </div>
                            </article>
                        {/each}
                    </div>
                {/if}
            {:else}
                {#if filteredWorkflows.length === 0}
                    <div class="rounded-xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-800">
                        <Layers3 class="mx-auto mb-2 h-8 w-8 text-slate-300" />
                        <h3 class="font-semibold text-sm text-slate-900 dark:text-white">
                            {$workflowStore.length === 0 ? "暂无工作流" : "没有匹配的工作流"}
                        </h3>
                        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">请清空搜索条件或新建一个图形化工作流画布。</p>
                        <button
                            onclick={() => openWorkflow("new")}
                            class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 cursor-pointer"
                        >
                            <Plus class="h-3.5 w-3.5" />
                            新建工作流画布
                        </button>
                    </div>
                {:else}
                    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {#each filteredWorkflows as workflow (workflow.id)}
                            <article
                                class="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 transition-all hover:border-slate-300 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/30 dark:hover:border-slate-700"
                                in:slide={{ duration: 160 }}
                            >
                                <div>
                                    <!-- Card Top -->
                                    <div class="flex items-start gap-3">
                                        <div class="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/50 text-lg shadow-xs">
                                            🔀
                                        </div>
                                        <div class="min-w-0 flex-1">
                                            <div class="flex items-center gap-2">
                                                <h3 class="font-bold text-sm text-slate-900 dark:text-white truncate" title={workflow.name}>
                                                    {workflow.name}
                                                </h3>
                                                <span class="rounded px-1.5 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                                                    工作流
                                                </span>
                                            </div>
                                            <p class="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                {workflow.description || "暂无工作流描述。"}
                                            </p>
                                        </div>
                                    </div>

                                    <!-- Stats line: inline & uncluttered -->
                                    <div class="mt-3.5 space-y-1.5 border-t border-slate-200/60 dark:border-slate-800/60 pt-2.5 text-xs">
                                        <div class="flex items-center justify-between text-[11px]">
                                            <span class="text-slate-400">画布规模</span>
                                            <span class="font-medium text-slate-700 dark:text-slate-300 font-mono">
                                                {workflow.workflow?.nodes?.length || 0} 节点 · {workflow.workflow?.edges?.length || 0} 连线
                                            </span>
                                        </div>
                                        <div class="flex items-center justify-between text-[11px]">
                                            <span class="text-slate-400">最近更新</span>
                                            <span class="text-slate-500 dark:text-slate-400 font-mono">{formatDate(workflow.updatedAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Card Footer -->
                                <div class="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                                    <div class="flex items-center gap-0.5">
                                        <button
                                            onclick={() => cloneWorkflow(workflow)}
                                            class="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                                            aria-label="克隆工作流"
                                            title="克隆工作流"
                                        >
                                            <Copy class="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onclick={() => openWorkflow(workflow.id)}
                                            class="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                                            aria-label="编辑画布"
                                            title="编辑画布"
                                        >
                                            <Edit3 class="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onclick={() => deleteWorkflow(workflow)}
                                            class="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                                            aria-label="删除工作流"
                                            title="删除工作流"
                                        >
                                            <Trash2 class="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    <button
                                        onclick={() => runWorkflow(workflow)}
                                        class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 active:scale-95 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
                                    >
                                        <Rocket class="h-3.5 w-3.5" />
                                        在工作台运行
                                    </button>
                                </div>
                            </article>
                        {/each}
                    </div>
                {/if}
            {/if}
        </section>
    </div>
{/if}

{#if showSquadBuilder}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        onclick={closeSquadBuilder}
        onkeydown={(event) => {
            if (event.key === "Escape") closeSquadBuilder();
        }}
        role="button"
        tabindex="0"
        transition:fade={{ duration: 160 }}
    >
        <div
            onclick={(event) => event.stopPropagation()}
            onkeydown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            tabindex="-1"
            transition:fly={{ y: 18, duration: 220 }}
        >
            <SquadBuilder
                mode={editingSquadId ? "edit" : "create"}
                squadId={editingSquadId}
                onSave={onSquadSave}
                onCancel={closeSquadBuilder}
            />
        </div>
    </div>
{/if}
