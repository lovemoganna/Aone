<script lang="ts">
    import { onMount, untrack } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { base } from "$app/paths";
    import { Button } from "$lib/components/ui";
    import { settingsStore } from "$lib/stores/settingsStore.svelte";
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { agentStore as registryStore } from "$lib/agents/store";
    import { workflowStore } from "$lib/orchestration/workflowStore.svelte";
    import HandoffDropdown from "$lib/components/ui/HandoffDropdown.svelte";
    import SettingsModal from "./components/SettingsModal.svelte";
    import DebugPanel from "./components/DebugPanel.svelte";
    import ExportModal from "./components/ExportModal.svelte";
    import SquadManagerModal from "./lobby/SquadManagerModal.svelte";
    import RightSidebar from "./components/RightSidebar.svelte";
    import ChatArea from "./components/ChatArea.svelte";
    import JointWarfareCanvas from "./components/JointWarfareCanvas.svelte";
    import DecisionAuditConsole from "./components/DecisionAuditConsole.svelte";
    import { squadEngine } from "$lib/stores/squadEngine.svelte";
    import { warfareEngine } from "$lib/stores/warfareEngine.svelte";
    import { dataBridge } from "$lib/stores/dataBridge";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import { 
        AlertTriangle, 
        ArrowLeft, 
        Bot, 
        GitBranch, 
        MessageSquare, 
        Route, 
        Settings, 
        Trash2, 
        Users, 
        History, 
        RotateCcw, 
        X, 
        Swords, 
        FileText, 
        Scale, 
        MoreHorizontal, 
        ChevronDown 
    } from "lucide-svelte";
    import { getAgentDisplayName } from "$lib/constants/agentConstants";

    let settingsOpen = $state(false);
    let exportOpen = $state(false);
    let moreMenuOpen = $state(false);
    let loadedWorkflowId = $state<string | null>(null);

    let routeAgentId = $derived($page.url.searchParams.get("agentId"));
    let routeSquadId = $derived($page.url.searchParams.get("squadId"));
    let routeWorkflowId = $derived($page.url.searchParams.get("workflowId"));
    let routeContextType = $derived.by(() => {
        if (routeWorkflowId) return "工作流";
        if (routeSquadId) return "协同小组";
        if (routeAgentId) return "Agent";
        return "直接任务";
    });
    let hasRouteSelection = $derived(Boolean(routeAgentId || routeSquadId || routeWorkflowId));
    let activeAgents = $derived(agentStore.getActiveAgents());
    let shouldShowDebugPanel = $derived.by(() =>
        agentStore.debugPanelOpen ||
        agentStore.debugLogs.some((log) => log.status === "error" || log.type === "error" || log.type === "fallback"),
    );

    let routeSelectionLabel = $derived.by(() => {
        if (routeAgentId) {
            const agent = agentStore.agents.find((item) => item.id === routeAgentId);
            return agent ? getAgentDisplayName(agent.id, agent.name) : "未知 Agent";
        }

        if (routeSquadId) {
            const squad = registryStore.getAllSquads().find((item) => item.id === routeSquadId);
            return squad ? squad.name : "未知协同小组";
        }

        if (routeWorkflowId) {
            const workflow = $workflowStore.find((item) => item.id === routeWorkflowId);
            return workflow ? workflow.name : "未知工作流";
        }

        if (activeAgents.length === 1) return getAgentDisplayName(activeAgents[0].id, activeAgents[0].name);
        if (activeAgents.length > 1) return `${activeAgents.length} 位专家协同`;
        return "全能小队";
    });

    let contextBannerDetail = $derived.by(() => {
        if (routeWorkflowId) return "在下方输入任务，该工作流将在执行前载入对应节点方案。";
        if (routeSquadId) return "在下方输入任务，该小队已在协作链路中激活。";
        if (routeAgentId) {
            const agent = agentStore.agents.find((item) => item.id === routeAgentId);
            return agent
                ? "已从工作坊载入该 Agent 作为协作起点。"
                : "Agent 链接已失效，请重新选择。";
        }
        return "在下方输入任务，或点击预设场景快速开始。";
    });

    let ContextIcon = $derived.by(() => {
        if (routeWorkflowId) return Route;
        if (routeSquadId) return Users;
        if (routeAgentId) return Bot;
        return MessageSquare;
    });

    function handleKeydown(event: KeyboardEvent) {
        if ((event.ctrlKey || event.metaKey) && event.key === ",") {
            event.preventDefault();
            settingsOpen = !settingsOpen;
        }
    }

    function handleSaveSquad(ids: string[]) {
        agentStore.currentSession.activeAgentIds = ids;
        agentStore.isSquadManagerOpen = false;
    }

    const SNAPSHOT_KEY = "aone_multiagent_session_snapshot";
    let hasSavedSnapshot = $state(false);
    let savedSnapshotInfo = $state<{ count: number; time: string } | null>(null);

    onMount(() => {
        try {
            const raw = localStorage.getItem(SNAPSHOT_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.messages && parsed.messages.length > 0 && agentStore.currentSession.messages.length === 0) {
                    hasSavedSnapshot = true;
                    savedSnapshotInfo = {
                        count: parsed.messages.length,
                        time: new Date(parsed.timestamp || Date.now()).toLocaleTimeString()
                    };
                }
            }

            const handoff = dataBridge.consume("/multi-agent");
            if (handoff && handoff.payload) {
                setTimeout(() => {
                    window.dispatchEvent(
                        new CustomEvent("insert-chat-input", {
                            detail: { text: handoff.payload }
                        })
                    );
                    toastStore.success(`已从 ${handoff.sourceTool} 载入任务指令`);
                }, 50);
            }
        } catch (e) {}
    });

    function handleSwitchMode(targetMode: 'squad' | 'joint_warfare') {
        if (agentStore.mode === targetMode) return;
        const isRunning = agentStore.pipelineState.isRunning || squadEngine.state.isRunning || warfareEngine.state.isRunning;
        if (isRunning) {
            const ok = confirm(`当前正在推演中，切换模式将终止当前任务，是否继续？`);
            if (!ok) return;
            squadEngine.cancelCollaboration();
            warfareEngine.cancelWarfare();
        }
        agentStore.setMode(targetMode);
    }

    function restoreSavedSnapshot() {
        try {
            const raw = localStorage.getItem(SNAPSHOT_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                agentStore.currentSession.messages = parsed.messages || [];
                if (parsed.activeAgentIds) {
                    agentStore.currentSession.activeAgentIds = parsed.activeAgentIds;
                }
                if (parsed.mode) {
                    agentStore.mode = parsed.mode;
                }
                if (parsed.jointWarfareState) {
                    Object.assign(agentStore.jointWarfareState, parsed.jointWarfareState);
                }
                if (parsed.squadPhaseOutputs && squadEngine.state) {
                    squadEngine.state.phaseOutputs = parsed.squadPhaseOutputs;
                }
                hasSavedSnapshot = false;

                const cpRaw = localStorage.getItem('aone_multiagent_checkpoint');
                if (cpRaw) {
                    try {
                        const cp = JSON.parse(cpRaw);
                        if (cp && cp.goal && cp.governanceState) {
                            agentStore.savedCheckpoint = cp;
                            setTimeout(() => {
                                agentStore.resumeFromCheckpoint();
                            }, 500);
                        }
                    } catch (e2) {}
                }
            }
        } catch (e) {}
    }

    function discardSavedSnapshot() {
        localStorage.removeItem(SNAPSHOT_KEY);
        hasSavedSnapshot = false;
    }

    function clearWorkspace() {
        squadEngine.cancelCollaboration();
        warfareEngine.cancelWarfare();
        agentStore.clearSession();
        agentStore.resetJointWarfare();
        localStorage.removeItem(SNAPSHOT_KEY);
        hasSavedSnapshot = false;
        goto(`${base}/multi-agent`, { replaceState: true });
    }

    $effect(() => {
        const msgs = agentStore.currentSession.messages;
        const jwState = agentStore.jointWarfareState;
        if (msgs.length > 0 || jwState.stage !== 'idle') {
            untrack(() => {
                try {
                    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({
                        messages: msgs,
                        activeAgentIds: agentStore.currentSession.activeAgentIds,
                        mode: agentStore.mode,
                        jointWarfareState: {
                            stage: jwState.stage,
                            progress: jwState.progress,
                            squadA: jwState.squadA,
                            squadB: jwState.squadB,
                            crossReview: jwState.crossReview,
                            conflicts: jwState.conflicts,
                            evidence: jwState.evidence,
                            arbitrationResult: jwState.arbitrationResult,
                            overtimeRounds: jwState.overtimeRounds
                        },
                        squadPhaseOutputs: squadEngine.state.phaseOutputs,
                        timestamp: Date.now()
                    }));
                } catch (e) {}
                if (agentStore.pipelineState.isRunning || agentStore.pipelineState.governanceState?.status === 'accepted') {
                    agentStore.saveCheckpoint();
                }
            });
        }
    });

    $effect(() => {
        const agentId = routeAgentId;
        const squadId = routeSquadId;
        const workflowId = routeWorkflowId;

        untrack(() => {
            if (agentId) {
                if (loadedWorkflowId !== null) loadedWorkflowId = null;
                if (agentStore.agents.some((agent) => agent.id === agentId)) {
                    if (
                        !agentStore.currentSession.activeAgentIds.includes(agentId) ||
                        agentStore.currentSession.activeAgentIds.length !== 1
                    ) {
                        agentStore.currentSession.activeAgentIds = [agentId];
                    }
                }
            } else if (squadId) {
                if (loadedWorkflowId !== null) loadedWorkflowId = null;
                const squad = registryStore.getAllSquads().find((item) => item.id === squadId);
                if (squad) {
                    const memberIds = squad.members.map((member) => member.agentId);
                    const current = agentStore.currentSession.activeAgentIds;
                    const isSame = current.length === memberIds.length && current.every((id) => memberIds.includes(id));

                    if (!isSame) {
                        agentStore.currentSession.activeAgentIds = memberIds;
                    }
                }
            } else if (workflowId) {
                if (loadedWorkflowId !== workflowId) {
                    loadedWorkflowId = workflowId;
                    agentStore.clearSession();
                    void agentStore.loadWorkflowAsStrategy(workflowId);
                }
            } else {
                if (loadedWorkflowId !== null) {
                    loadedWorkflowId = null;
                }
            }
        });
    });
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
    <title>多 Agent 协作工作台 - Aone Toolkit</title>
</svelte:head>

<div class="h-full w-full flex flex-col bg-slate-50 dark:bg-slate-950 p-2.5 sm:p-3.5 overflow-hidden">
    <div class="flex flex-1 h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <!-- Top Clean Engineering Navigation Header -->
        <header class="border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-2 bg-slate-50/70 dark:bg-slate-900/80 shrink-0">
            <div class="flex items-center justify-between gap-3 min-h-8">
                <div class="flex items-center gap-2.5 min-w-0">
                    <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs">
                        <Bot class="h-4 w-4" />
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-2">
                            <h1 class="truncate text-xs sm:text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                                多 Agent 协作工作台
                            </h1>
                            <span class="text-xs text-slate-400 font-mono">/ {agentStore.mode === 'joint_warfare' ? '攻坚对抗' : '单小队'}</span>
                        </div>
                    </div>
                </div>

                <!-- Right Controls -->
                <div class="flex items-center gap-2 shrink-0">
                    <!-- Segmented Mode Control -->
                    <div class="flex items-center rounded-lg bg-slate-200/80 p-0.5 dark:bg-slate-800 text-xs">
                        <button
                            type="button"
                            onclick={() => handleSwitchMode('squad')}
                            class="flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition cursor-pointer {agentStore.mode === 'squad' ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}"
                        >
                            <Bot class="h-3.5 w-3.5 text-slate-700 dark:text-slate-300" />
                            <span>单小队协同</span>
                        </button>
                        <button
                            type="button"
                            onclick={() => handleSwitchMode('joint_warfare')}
                            class="flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition cursor-pointer {agentStore.mode === 'joint_warfare' ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}"
                        >
                            <Swords class="h-3.5 w-3.5 text-rose-500" />
                            <span>攻坚对抗</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onclick={() => agentStore.toggleDecisionConsole('matrix')}
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition active:scale-95 cursor-pointer"
                        title="查看决策矩阵与工单控制台"
                    >
                        <Scale class="h-3.5 w-3.5" />
                        <span>决策审计台</span>
                    </button>

                    <button
                        type="button"
                        onclick={() => (settingsOpen = true)}
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-indigo-400 dark:hover:border-indigo-600 transition cursor-pointer shadow-2xs group"
                        title={`AI 引擎网关配置: ${settingsStore.currentProvider?.name || '未配置'} (${settingsStore.selectedModel || '未选择模型'})`}
                    >
                        <Settings class="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-500 group-hover:rotate-45 transition-transform duration-200" />
                        <span>配置</span>
                        <span class="inline-flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                            <span class="w-1.5 h-1.5 rounded-full {settingsStore.isConfigured ? 'bg-emerald-500 shadow-xs' : 'bg-amber-500'}"></span>
                            <span class="hidden md:inline truncate max-w-[80px]">{settingsStore.currentProvider?.name || '未配置'}</span>
                        </span>
                    </button>

                    <div class="relative">
                        <button
                            type="button"
                            onclick={() => (moreMenuOpen = !moreMenuOpen)}
                            class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
                            title="更多操作"
                        >
                            <MoreHorizontal class="h-3.5 w-3.5" />
                        </button>

                        {#if moreMenuOpen}
                            <div class="fixed inset-0 z-20" onclick={() => (moreMenuOpen = false)} role="presentation"></div>
                            <div class="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-30 p-1 space-y-0.5 text-xs animate-in fade-in duration-100">
                                <button
                                    type="button"
                                    onclick={() => { moreMenuOpen = false; agentStore.isSquadManagerOpen = true; }}
                                    class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-left"
                                >
                                    <Users class="h-3.5 w-3.5 text-slate-500" />
                                    <span>小队成员编排</span>
                                </button>
                                <button
                                    type="button"
                                    onclick={() => { moreMenuOpen = false; exportOpen = true; }}
                                    class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-left"
                                >
                                    <FileText class="h-3.5 w-3.5 text-slate-500" />
                                    <span>导出记录</span>
                                </button>
                                <button
                                    type="button"
                                    onclick={() => { moreMenuOpen = false; goto(`${base}/agent-studio`); }}
                                    class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-left"
                                >
                                    <ArrowLeft class="h-3.5 w-3.5 text-slate-500" />
                                    <span>进入 Agent 工作坊</span>
                                </button>
                                <div class="border-t border-slate-100 dark:border-slate-800 pt-0.5">
                                    <HandoffDropdown
                                        sourceTool="多 Agent 工作台"
                                        dataType="prompt"
                                        getData={() => agentStore.currentSession.messages.map(m => `[${m.role}/${m.agentId || 'user'}]: ${m.content}`).join('\n\n')}
                                        buttonClass="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-left font-normal"
                                    />
                                </div>
                            </div>
                        {/if}
                    </div>

                    <button
                        type="button"
                        onclick={clearWorkspace}
                        class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        title="清空当前工作区"
                    >
                        <Trash2 class="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {#if hasSavedSnapshot && savedSnapshotInfo}
                <div class="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300 mt-2">
                    <div class="flex items-center gap-2">
                        <History class="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span>检测到上次未完成会话 ({savedSnapshotInfo.count} 条记录 · {savedSnapshotInfo.time})</span>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            class="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-900 transition cursor-pointer"
                            onclick={restoreSavedSnapshot}
                        >
                            <RotateCcw class="h-3 w-3" />
                            恢复
                        </button>
                        <button
                            type="button"
                            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                            onclick={discardSavedSnapshot}
                            title="丢弃快照"
                            aria-label="丢弃快照"
                        >
                            <X class="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            {/if}
        </header>

        <!-- Main Workspace -->
        <div class="relative min-h-0 flex-1 overflow-hidden">
            <div class="flex h-full min-h-0 overflow-hidden">
                <div class="relative flex min-w-0 flex-1 flex-col overflow-hidden">
                    {#if agentStore.mode === 'joint_warfare'}
                        <div class="flex-1 min-h-0 overflow-y-auto">
                            <JointWarfareCanvas />
                        </div>
                    {:else}
                        {#if agentStore.currentSession.messages.length === 0 && hasRouteSelection}
                            <div class="mx-4 mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300 shrink-0">
                                <div class="flex items-center gap-2.5">
                                    <ContextIcon class="h-4 w-4 text-slate-700 dark:text-slate-300 shrink-0" />
                                    <div>
                                        <span class="font-bold">{routeContextType}: {routeSelectionLabel}</span>
                                        <span class="text-slate-400 ml-1.5">{contextBannerDetail}</span>
                                    </div>
                                </div>
                            </div>
                        {/if}
                        <ChatArea />
                        {#if shouldShowDebugPanel}
                            <DebugPanel />
                        {/if}
                    {/if}
                </div>
                <RightSidebar />
            </div>
        </div>
    </div>
</div>

{#if settingsOpen}
    <SettingsModal bind:open={settingsOpen} />
{/if}
{#if exportOpen}
    <ExportModal bind:open={exportOpen} />
{/if}
{#if agentStore.isSquadManagerOpen}
    <SquadManagerModal
        isOpen={agentStore.isSquadManagerOpen}
        selectedIds={agentStore.currentSession.activeAgentIds}
        save={(ids: string[]) => handleSaveSquad(ids)}
        close={() => (agentStore.isSquadManagerOpen = false)}
    />
{/if}

<DecisionAuditConsole />
