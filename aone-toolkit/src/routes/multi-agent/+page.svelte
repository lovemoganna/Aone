<script lang="ts">
    import { Panel, Button } from "$lib/components/ui";
    import { settingsStore } from "$lib/stores/settingsStore.svelte";
    import AgentSidebar from "./components/AgentSidebar.svelte";
    import ChatArea from "./components/ChatArea.svelte";
    import PipelineHeader from "./components/PipelineHeader.svelte";
    import SettingsModal from "./components/SettingsModal.svelte";
    import DebugPanel from "./components/DebugPanel.svelte";
    import ExportModal from "./components/ExportModal.svelte";
    import EntranceSelector from "./components/EntranceSelector.svelte";
    import { Settings, Wifi, WifiOff, Trash2, Users, Plus } from "lucide-svelte";
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { goto } from "$app/navigation";

    import SquadManagerModal from "./lobby/SquadManagerModal.svelte";

    let settingsOpen = $state(false);
    let exportOpen = $state(false);

    function handleKeydown(e: KeyboardEvent) {
        // Ctrl/Cmd + , to open settings
        if ((e.ctrlKey || e.metaKey) && e.key === ",") {
            e.preventDefault();
            settingsOpen = !settingsOpen;
        }
    }

    function handleSaveSquad(ids: string[]) {
        agentStore.currentSession.activeAgentIds = ids;
        agentStore.isSquadManagerOpen = false;
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
    <title>Multi-Agent - Aone Toolkit</title>
</svelte:head>

<div class="h-[calc(100vh-3rem)]">
    <Panel class="h-full flex flex-col">
        {#snippet header()}
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div
                        class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-4 h-4 text-white"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
                            />
                        </svg>
                    </div>
                    <div class="flex flex-col">
                        <h1
                            class="text-lg font-semibold text-slate-900 dark:text-white"
                        >
                            认知决策工具
                        </h1>
                        <span class="text-xs text-slate-500">
                            {#if agentStore.currentSession.activeAgentIds.length > 0}
                                {@const currentAgent = agentStore.agents.find(a => a.id === agentStore.currentSession.activeAgentIds[0])}
                                <span class="inline-flex items-center gap-1">
                                    <span
                                        class="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block"
                                    ></span>
                                    当前思维: {currentAgent?.name || '未知'} · {currentAgent?.role || ''}
                                </span>
                            {:else if settingsStore.isConfigured}
                                <span class="inline-flex items-center gap-1">
                                    <span
                                        class="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"
                                    ></span>
                                    {settingsStore.currentProvider?.name} · {settingsStore.selectedModel}
                                </span>
                            {:else}
                                <span class="inline-flex items-center gap-1">
                                    <span
                                        class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"
                                    ></span>
                                    Mock Mode — Configure provider ⚙️
                                </span>
                            {/if}
                        </span>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onclick={() => agentStore.isSquadManagerOpen = true}
                        class="gap-1.5"
                    >
                        <Users class="w-3.5 h-3.5" />
                        管理团队
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onclick={() => goto("/agent-studio")}
                        class="gap-1.5"
                    >
                        <Plus class="w-3.5 h-3.5" />
                        新增智能体
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onclick={() => agentStore.clearSession()}
                        class="gap-1.5"
                    >
                        <Trash2 class="w-3.5 h-3.5" />
                        Clear
                    </Button>
                    <!-- 圆桌会诊按钮 -->
                    <Button
                        variant="secondary"
                        size="sm"
                        onclick={() => agentStore.isSquadManagerOpen = true}
                        class="gap-1.5 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-300/50 dark:border-violet-700/50"
                    >
                        <Users class="w-3.5 h-3.5 text-violet-500" />
                        <span class="text-violet-600 dark:text-violet-400">圆桌会诊</span>
                    </Button>
                </div>
            </div>
        {/snippet}

        <div class="flex-1 flex overflow-hidden">
            <AgentSidebar onexport={() => (exportOpen = true)} />
            <div class="flex-1 flex flex-col min-w-0 relative">
                {#if agentStore.currentSession.messages.length === 0}
                    <EntranceSelector />
                {/if}
                <PipelineHeader />
                <ChatArea />
                <DebugPanel />
            </div>
        </div>
    </Panel>
</div>

<SettingsModal bind:open={settingsOpen} />
<ExportModal bind:open={exportOpen} />
<SquadManagerModal
    isOpen={agentStore.isSquadManagerOpen}
    selectedIds={agentStore.currentSession.activeAgentIds}
    onsave={(ids) => handleSaveSquad(ids)}
    onclose={() => (agentStore.isSquadManagerOpen = false)}
/>
