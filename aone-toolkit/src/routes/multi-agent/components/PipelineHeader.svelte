<script lang="ts">
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { slide } from "svelte/transition";
    import {
        Search,
        Scale,
        Compass,
        ShieldAlert,
        CheckSquare,
        Bot,
        Loader2,
        Download,
        MessageSquare,
    } from "lucide-svelte";
    import { Button } from "$lib/components/ui";

    function handleDownloadReport() {
        const report = agentStore.exportReport();
        const blob = new Blob([report], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `认知决策报告-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
    }

    let state = $derived(agentStore.pipelineState);
    let currentAgentId = $derived(state.currentAgentId);
    let currentAgent = $derived(currentAgentId ? agentStore.getAgent(currentAgentId) : null);
    
    // Agent 图标映射
    const agentIcons: Record<string, any> = {
        decomposer: Search,
        calculator: Scale,
        pathfinder: Compass,
        stress_tester: ShieldAlert,
        closer: CheckSquare,
    };

    let AgentIcon = $derived(currentAgentId ? (agentIcons[currentAgentId] || Bot) : Bot);
    
    // 判断当前阶段
    let currentPhase = $derived(() => {
        if (state.waitingForReview) return "等待审核";
        if (state.isRunning) {
            if (state.stage === "execute") return "执行中";
            if (state.stage === "strategy") return "制定策略";
            return "思考中";
        }
        if (agentStore.metaFlowFinished) return "已完成";
        return "等待输入";
    });
</script>

{#if agentStore.currentSession.messages.length > 0}
    <div
        transition:slide
        class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between"
    >
        <div class="flex items-center gap-3">
            <!-- 当前 Agent 指示器 -->
            {#if currentAgent && state.isRunning}
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg {currentAgent.color} flex items-center justify-center shadow-sm">
                        <AgentIcon class="w-4 h-4 text-white" />
                    </div>
                    <div class="flex flex-col">
                        <span class="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {currentAgent.name}
                        </span>
                        <span class="text-[10px] text-slate-400">
                            {currentPhase()}
                        </span>
                    </div>
                </div>
            {:else}
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <MessageSquare class="w-4 h-4 text-slate-400" />
                    </div>
                    <span class="text-xs text-slate-500">{currentPhase()}</span>
                </div>
            {/if}
        </div>

        <div class="flex items-center gap-3">
            <!-- 加载指示器 -->
            {#if agentStore.metaFlowIsRunning && !agentStore.metaFlowFinished}
                <div class="flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 class="w-4 h-4 animate-spin text-indigo-500" />
                    <span>处理中...</span>
                </div>
            {/if}

            <!-- 完成时显示下载按钮 -->
            {#if agentStore.metaFlowFinished}
                <Button
                    variant="outline"
                    size="sm"
                    onclick={handleDownloadReport}
                    class="gap-2 text-xs"
                >
                    <Download class="w-3.5 h-3.5" />
                    导出报告
                </Button>
            {/if}
        </div>
    </div>
{/if}
