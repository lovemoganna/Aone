<script lang="ts">
    import {
        agentStore,
        type Agent,
        type Squad,
        type SquadMember,
    } from "$lib/agents";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import AgentAvatar from "$lib/components/ui/AgentAvatar.svelte";
    import { fade, fly, slide } from "svelte/transition";
    import {
        Users,
        UserPlus,
        Check,
        X,
        Search,
        ChevronRight,
        Sparkles,
        ArrowLeft,
        Settings,
        Layout,
        Crown,
        Shield,
        Eye,
        MessageSquare,
        Trash2,
        ArrowUp,
        ArrowDown,
    } from "lucide-svelte";

    // Props
    interface Props {
        mode?: "create" | "edit";
        squadId?: string;
        onSave?: (squad: Squad) => void;
        onCancel?: () => void;
    }

    let { mode = "create", squadId = "", onSave, onCancel }: Props = $props();

    // ============== 步骤管理 ==============
    type Step = "info" | "members" | "preview";
    let currentStep = $state<Step>("info");

    // ============== 表单数据 ==============
    let squadName = $state("");
    let squadDescription = $state("");
    let orchestrationType = $state<Squad["orchestrationType"]>("sequential");
    let members = $state<SquadMember[]>([]);

    // ============== 搜索状态 ==============
    let agentSearchQuery = $state("");

    // ============== 编辑模式初始化 ==============
    // svelte-ignore state_referenced_locally
    if (mode === "edit" && squadId) {
        const squads = agentStore.getAllSquads();
        const existing = squads.find((s) => s.id === squadId);
        if (existing) {
            squadName = existing.name;
            squadDescription = existing.description;
            orchestrationType = existing.orchestrationType;
            members = [...existing.members];
        }
    }

    // ============== 数据源 ==============
    let allAgents = $derived(agentStore.getAll());

    let filteredAgents = $derived.by(() => {
        if (!agentSearchQuery) return allAgents;
        const q = agentSearchQuery.toLowerCase();
        return allAgents.filter(
            (a) =>
                a.name.toLowerCase().includes(q) ||
                a.description.toLowerCase().includes(q),
        );
    });

    // ============== 角色配置 ==============
    const roleConfig: Record<
        string,
        { label: string; icon: any; color: string; bg: string }
    > = {
        leader: {
            label: "Leader",
            icon: Crown,
            color: "text-amber-500",
            bg: "bg-amber-100 dark:bg-amber-900/30",
        },
        expert: {
            label: "Expert",
            icon: Shield,
            color: "text-blue-500",
            bg: "bg-blue-100 dark:bg-blue-900/30",
        },
        observer: {
            label: "Observer",
            icon: Eye,
            color: "text-slate-500",
            bg: "bg-slate-100 dark:bg-slate-800",
        },
        coordinator: {
            label: "Coordinator",
            icon: MessageSquare,
            color: "text-violet-500",
            bg: "bg-violet-100 dark:bg-violet-900/30",
        },
    };

    const orchestrationTypes: {
        value: Squad["orchestrationType"];
        label: string;
        desc: string;
    }[] = [
        { value: "sequential", label: "Sequential", desc: "按顺序依次执行" },
        { value: "parallel", label: "Parallel", desc: "并行执行后汇总" },
        { value: "debate", label: "Debate", desc: "各抒己见进行辩论" },
        { value: "round_robin", label: "Round Robin", desc: "循环发言" },
    ];

    // ============== 操作 ==============
    function addMember(agentId: string) {
        if (members.some((m) => m.agentId === agentId)) return;
        members = [...members, { agentId, role: "expert" }];
    }

    function removeMember(agentId: string) {
        members = members.filter((m) => m.agentId !== agentId);
    }

    function updateMemberRole(agentId: string, role: SquadMember["role"]) {
        members = members.map((m) =>
            m.agentId === agentId ? { ...m, role } : m,
        );
    }

    // P2 #23: Squad member reorder
    function moveMemberUp(index: number) {
        if (index <= 0) return;
        const newMembers = [...members];
        [newMembers[index - 1], newMembers[index]] = [
            newMembers[index],
            newMembers[index - 1],
        ];
        members = newMembers;
    }

    function moveMemberDown(index: number) {
        if (index >= members.length - 1) return;
        const newMembers = [...members];
        [newMembers[index], newMembers[index + 1]] = [
            newMembers[index + 1],
            newMembers[index],
        ];
        members = newMembers;
    }

    function goToStep(step: Step) {
        currentStep = step;
    }

    function nextStep() {
        if (currentStep === "info") currentStep = "members";
        else if (currentStep === "members") currentStep = "preview";
    }

    function prevStep() {
        if (currentStep === "preview") currentStep = "members";
        else if (currentStep === "members") currentStep = "info";
    }

    let canProceedFromInfo = $derived(!!squadName.trim());
    let canProceedFromMembers = $derived(members.length > 0);
    let canSave = $derived(!!squadName.trim() && members.length > 0);

    function handleSave() {
        if (!canSave) return;

        if (mode === "edit" && squadId) {
            agentStore.updateSquad(squadId, {
                name: squadName.trim(),
                description: squadDescription.trim(),
                members,
                orchestrationType,
            });
            const squads = agentStore.getAllSquads();
            const updated = squads.find((s) => s.id === squadId);
            if (updated) {
                toastStore.success(`Squad「${updated.name}」已更新`);
                if (onSave) onSave(updated);
            }
        } else {
            const newSquad = agentStore.createSquad({
                name: squadName.trim(),
                description:
                    squadDescription.trim() || `${members.length} Agents Squad`,
                members,
                orchestrationType,
            });
            toastStore.success(`Squad「${newSquad.name}」已创建`);
            if (onSave) onSave(newSquad);
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            e.preventDefault();
            onCancel?.();
        } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            if (currentStep === "preview" && canSave) {
                handleSave();
            } else if (currentStep === "info" && canProceedFromInfo) {
                currentStep = "members";
            } else if (currentStep === "members" && canProceedFromMembers) {
                currentStep = "preview";
            }
        }
    }

    // ============== 步骤指示器 ==============
    const steps: { key: Step; label: string; icon: any }[] = [
        { key: "info", label: "基本信息", icon: Settings },
        { key: "members", label: "成员组建", icon: Users },
        { key: "preview", label: "预览确认", icon: Check },
    ];
</script>

<svelte:window onkeydown={handleKeyDown} />

<div
    class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden"
>
    <!-- ============== 头部 ============== -->
    <div
        class="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0"
    >
        <div class="flex items-center gap-3">
            <div
                class="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white"
            >
                <Users class="w-5 h-5" />
            </div>
            <div>
                <h2 class="text-lg font-bold text-slate-900 dark:text-white">
                    {mode === "edit" ? "编辑协同小组 (Squad)" : "组建协同小组 (Squad)"}
                </h2>
                <p class="text-xs text-slate-500">组建多 Agent 互补协作团队</p>
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

    <!-- ============== 步骤指示器 ============== -->
    <div
        class="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0"
    >
        {#each steps as step, i}
            {@const Icon = step.icon}
            <button
                onclick={() => {
                    if (step.key === "members" && !canProceedFromInfo) return;
                    if (
                        step.key === "preview" &&
                        (!canProceedFromInfo || !canProceedFromMembers)
                    )
                        return;
                    goToStep(step.key);
                }}
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all {currentStep ===
                step.key
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}"
            >
                <Icon class="w-3.5 h-3.5" />
                <span>{step.label}</span>
            </button>
            {#if i < steps.length - 1}
                <ChevronRight class="w-3.5 h-3.5 text-slate-300" />
            {/if}
        {/each}
    </div>

    <!-- ============== 内容区域 ============== -->
    <div class="flex-1 overflow-y-auto p-6">
        <!-- Step 1: 基本信息 -->
        {#if currentStep === "info"}
            <div in:fly={{ x: -20, duration: 200 }}>
                <h3
                    class="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"
                >
                    <Settings class="w-4 h-4 text-indigo-500" />
                    协同小组基本配置
                </h3>

                <div class="space-y-4 max-w-lg">
                    <div>
                        <label
                            for="squad-builder-name"
                            class="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block"
                            >小组名称 <span class="text-red-500">*</span></label
                        >
                        <input
                            id="squad-builder-name"
                            type="text"
                            bind:value={squadName}
                            placeholder="例如：产品研发战队"
                            class="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs text-slate-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label
                            for="squad-builder-description"
                            class="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block"
                            >描述（可选）</label
                        >
                        <input
                            id="squad-builder-description"
                            type="text"
                            bind:value={squadDescription}
                            placeholder="团队职责与攻坚目标描述"
                            class="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs text-slate-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <div
                            class="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block"
                            >编排流转模式</div
                        >
                        <div class="grid grid-cols-2 gap-3">
                            {#each orchestrationTypes as type}
                                <button
                                    onclick={() =>
                                        (orchestrationType = type.value)}
                                    aria-pressed={orchestrationType === type.value}
                                    class="p-3 rounded-xl border text-left transition-all hover:shadow-xs {orchestrationType ===
                                    type.value
                                        ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/30'
                                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'}"
                                >
                                    <div
                                        class="font-semibold text-xs text-slate-900 dark:text-white mb-0.5"
                                    >
                                        {type.label}
                                    </div>
                                    <div class="text-[11px] text-slate-500">
                                        {type.desc}
                                    </div>
                                </button>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Step 2: 成员组建 -->
        {:else if currentStep === "members"}
            <div in:fly={{ x: 20, duration: 200 }} class="flex gap-6 h-full">
                <!-- 左侧：可选 Agent -->
                <div class="w-1/2 flex flex-col">
                    <h3
                        class="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-between"
                    >
                        <span>可用 Agent</span>
                        <span class="text-xs font-normal text-slate-500"
                            >{allAgents.length} 个</span
                        >
                    </h3>

                    <div class="relative mb-3">
                        <Search
                            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                        />
                        <input
                            type="text"
                            bind:value={agentSearchQuery}
                            placeholder="搜索 Agent..."
                            class="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div class="flex-1 overflow-y-auto space-y-2 pr-1">
                        {#each filteredAgents as agent}
                            {@const isSelected = members.some(
                                (m) => m.agentId === agent.id,
                            )}
                            <button
                                onclick={() =>
                                    isSelected
                                        ? removeMember(agent.id)
                                        : addMember(agent.id)}
                                class="w-full p-2.5 rounded-xl border text-left transition-all hover:shadow-xs flex items-center gap-2.5 {isSelected
                                    ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/30'
                                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'}"
                            >
                                <AgentAvatar agent={agent.id || agent.name} size="xs" shape="rounded" />
                                <div class="flex-1 min-w-0">
                                    <div
                                        class="font-semibold text-xs text-slate-900 dark:text-white truncate"
                                    >
                                        {agent.name}
                                    </div>
                                    <div
                                        class="text-[11px] text-slate-500 truncate mt-0.5"
                                    >
                                        {agent.description}
                                    </div>
                                </div>
                                {#if isSelected}
                                    <Check class="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                {/if}
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- 右侧：已选成员 -->
                <div
                    class="w-1/2 flex flex-col border-l border-slate-100 dark:border-slate-800 pl-6"
                >
                    <h3
                        class="text-xs font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2"
                    >
                        <span>小组已选成员</span>
                        <span
                            class="px-1.5 py-0.2 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300 text-[10px] font-bold rounded"
                            >{members.length}</span
                        >
                    </h3>

                    <div class="flex-1 overflow-y-auto space-y-2.5 pr-1">
                        {#if members.length === 0}
                            <div
                                class="flex flex-col items-center justify-center h-40 text-slate-400 text-xs"
                            >
                                <UserPlus class="w-6 h-6 mb-2 opacity-40" />
                                <p>从左侧选择 Agent 加入攻坚团队</p>
                            </div>
                        {:else}
                            {#each members as member, idx}
                                {@const agent = allAgents.find(
                                    (a) => a.id === member.agentId,
                                )}
                                {#if agent}
                                    <div
                                        class="p-2.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-xl"
                                        transition:slide={{ duration: 150 }}
                                    >
                                        <div
                                            class="flex items-center gap-2.5 mb-2"
                                        >
                                            <AgentAvatar agent={agent.id || agent.name} size="xs" shape="rounded" />
                                            <div class="flex-1 min-w-0">
                                                <div
                                                    class="font-semibold text-xs text-slate-900 dark:text-white truncate"
                                                >
                                                    {agent.name}
                                                </div>
                                            </div>
                                            <button
                                                onclick={() =>
                                                    removeMember(agent.id)}
                                                class="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                title="移除成员"
                                            >
                                                <Trash2 class="w-3.5 h-3.5" />
                                            </button>
                                            <!-- P2 #23: Reorder buttons -->
                                            <div
                                                class="flex flex-col -space-y-0.5"
                                            >
                                                <button
                                                    onclick={() =>
                                                        moveMemberUp(idx)}
                                                    disabled={idx === 0}
                                                    class="p-0.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                    title="上移"
                                                >
                                                    <ArrowUp class="w-3 h-3" />
                                                </button>
                                                <button
                                                    onclick={() =>
                                                        moveMemberDown(idx)}
                                                    disabled={idx ===
                                                        members.length - 1}
                                                    class="p-0.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                    title="下移"
                                                >
                                                    <ArrowDown
                                                        class="w-3 h-3"
                                                    />
                                                </button>
                                            </div>
                                        </div>

                                        <!-- 角色选择 -->
                                        <div
                                            class="flex gap-1 bg-white dark:bg-slate-900/60 p-1 rounded-lg border border-slate-200/60 dark:border-slate-800/60"
                                        >
                                            {#each Object.entries(roleConfig) as [roleKey, config]}
                                                {@const isActive =
                                                    member.role === roleKey}
                                                {@const RoleIcon = config.icon}
                                                <button
                                                    onclick={() =>
                                                        updateMemberRole(
                                                            member.agentId,
                                                            roleKey as SquadMember["role"],
                                                        )}
                                                    class="flex-1 flex items-center justify-center py-1 rounded transition-all {isActive
                                                        ? 'bg-slate-100 dark:bg-slate-800 shadow-xs ' +
                                                          config.color
                                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}"
                                                    title={config.label}
                                                >
                                                    <RoleIcon class="w-3.5 h-3.5" />
                                                </button>
                                            {/each}
                                        </div>
                                        <div
                                            class="mt-1 text-center text-[10px] text-slate-400 font-mono"
                                        >
                                            角色: {roleConfig[member.role]
                                                .label}
                                        </div>
                                    </div>
                                {/if}
                            {/each}
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Step 3: 预览 -->
        {:else if currentStep === "preview"}
            <div in:fly={{ x: 20, duration: 200 }}>
                <h3
                    class="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"
                >
                    <Check class="w-4 h-4 text-emerald-500" />
                    确认协同小组配置
                </h3>

                <div
                    class="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-950/30"
                >
                    <div class="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-200/80 dark:border-slate-800">
                        <div
                            class="w-12 h-12 rounded-xl bg-indigo-600 shadow-xs flex items-center justify-center text-white shrink-0"
                        >
                            <Users class="w-6 h-6" />
                        </div>
                        <div>
                            <h2
                                class="text-base font-bold text-slate-900 dark:text-white"
                            >
                                {squadName || "未命名协同小组"}
                            </h2>
                            <p class="text-xs text-slate-500 mt-0.5">
                                {squadDescription || "暂无描述"}
                            </p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3 mb-5">
                        <div
                            class="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs"
                        >
                            <div class="text-[10px] font-semibold text-slate-400 mb-0.5">
                                编排模式
                            </div>
                            <div
                                class="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5"
                            >
                                <Layout class="w-3.5 h-3.5 text-indigo-500" />
                                {orchestrationTypes.find(
                                    (t) => t.value === orchestrationType,
                                )?.label}
                            </div>
                        </div>
                        <div
                            class="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs"
                        >
                            <div class="text-[10px] font-semibold text-slate-400 mb-0.5">
                                团队规模
                            </div>
                            <div
                                class="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5"
                            >
                                <Users class="w-3.5 h-3.5 text-emerald-500" />
                                {members.length} 位专家 Agent
                            </div>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <h4
                            class="font-semibold text-slate-700 dark:text-slate-300 text-xs"
                        >
                            已选成员阵容
                        </h4>
                        <div class="grid gap-2 sm:grid-cols-2">
                            {#each members as member}
                                {@const agent = allAgents.find(
                                    (a) => a.id === member.agentId,
                                )}
                                {@const roleInfo = roleConfig[member.role]}
                                {@const RoleIcon = roleInfo.icon}
                                {#if agent}
                                    <div
                                        class="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs"
                                    >
                                        <div class="flex items-center gap-2.5 min-w-0">
                                            <AgentAvatar agent={agent.id || agent.name} size="xs" shape="rounded" />
                                            <div class="min-w-0">
                                                <div
                                                    class="font-semibold text-xs text-slate-900 dark:text-white truncate"
                                                >
                                                    {agent.name}
                                                </div>
                                                <div class="text-[10px] text-slate-400 truncate">
                                                    {agent.personaId}
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            class="flex items-center gap-1 px-2 py-0.5 rounded {roleInfo.bg} {roleInfo.color} text-[10px] font-semibold shrink-0"
                                        >
                                            <RoleIcon class="w-3 h-3" />
                                            {roleInfo.label}
                                        </div>
                                    </div>
                                {/if}
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    </div>

    <!-- ============== 底部操作栏 ============== -->
    <div
        class="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0"
    >
        <div>
            {#if currentStep !== "info"}
                <button
                    onclick={prevStep}
                    class="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                >
                    <ArrowLeft class="w-3.5 h-3.5" />
                    上一步
                </button>
            {:else}
                <button
                    onclick={onCancel}
                    class="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    取消
                </button>
            {/if}
        </div>

        <div class="flex items-center gap-2.5">
            {#if currentStep === "preview"}
                <button
                    onclick={handleSave}
                    disabled={!canSave}
                    class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-xs hover:bg-indigo-500 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                    <Check class="w-3.5 h-3.5" />
                    {mode === "edit" ? "保存小组" : "创建协同小组"}
                </button>
            {:else}
                <button
                    onclick={nextStep}
                    disabled={(currentStep === "info" && !canProceedFromInfo) ||
                        (currentStep === "members" && !canProceedFromMembers)}
                    class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-xs hover:bg-indigo-500 shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                    下一步
                    <ChevronRight class="w-3.5 h-3.5" />
                </button>
            {/if}
        </div>
    </div>
</div>
