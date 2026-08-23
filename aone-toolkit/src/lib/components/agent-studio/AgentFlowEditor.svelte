<script lang="ts">
    import { untrack } from "svelte";
    import { get } from "svelte/store";
    import {
        Users,
        Wrench,
        Play,
        Save,
        Trash2,
        X,
        GitBranch,
        MousePointer2,
        BarChart3,
        FileText,
        Maximize2,
        Minimize2,
        Check,
        Copy,
    } from "lucide-svelte";
    import FlowEditor from "$lib/components/flow-editor/FlowEditor.svelte";
    import FlowCommandPalette from "$lib/components/flow-editor/FlowCommandPalette.svelte";
    import type {
        FlowNode,
        FlowEdge,
        NodeType,
        NodeData,
    } from "$lib/components/flow-editor/types";
    import { workflowStore } from "$lib/orchestration/workflowStore.svelte";
    import { agentStore } from "$lib/agents/store";
    import type {
        AgentNodeConfig,
        SkillNodeConfig,
    } from "$lib/orchestration/types";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import { SvelteSet } from "svelte/reactivity";

    // Props
    let { workflowId = null, onSaveSuccess = () => {} } = $props<{
        workflowId?: string | null;
        onSaveSuccess?: () => void;
    }>();

    // State
    let nodes = $state<FlowNode[]>([]);
    let edges = $state<FlowEdge[]>([]);
    let selectedNodeIds = $state(new SvelteSet<string>());
    let isLoaded = $state(false);
    let showLogs = $state(false);

    // P1 #8: Dirty check state (P0 #1: safe serialization)
    let lastSavedState = $state("");

    function safeStringify(obj: any): string {
        const seen = new WeakSet();
        try {
            return JSON.stringify(obj, (_key, value) => {
                if (typeof value === "object" && value !== null) {
                    if (value instanceof HTMLElement || value instanceof Node)
                        return undefined;
                    if (seen.has(value)) return "[Circular]";
                    seen.add(value);
                }
                return value;
            });
        } catch {
            return `__fallback_${Date.now()}`;
        }
    }

    let isDirty = $derived.by(() => {
        if (!isLoaded) return false;
        try {
            const currentState = safeStringify({ nodes, edges });
            return currentState !== lastSavedState;
        } catch {
            return true;
        }
    });

    function markClean() {
        lastSavedState = safeStringify({ nodes, edges });
    }

    let paletteVisible = $state(false);
    let palettePos = $state({ x: 0, y: 0 });
    let paletteCanvasPos = $state({ x: 0, y: 0 });

    let connectionDropSource = $state<{
        nodeId: string;
        handleType: "input" | "output";
        nodeType?: string;
    } | null>(null);

    function handleConnectionDrop(
        sourceId: string,
        handleType: "input" | "output",
        pos: { x: number; y: number },
        e: MouseEvent,
    ) {
        paletteCanvasPos = pos;
        palettePos = { x: e.clientX, y: e.clientY };
        const node = nodes.find((n) => n.id === sourceId);
        connectionDropSource = {
            nodeId: sourceId,
            handleType,
            nodeType: node?.type,
        };
        paletteVisible = true;
    }

    // P0 #10: Schema guard state (replaces window.confirm)
    let schemaWarning = $state<{
        source: string;
        target: string;
        sourceNode: any;
        targetNode: any;
    } | null>(null);

    function dismissSchemaWarning() {
        schemaWarning = null;
    }

    function applySchemaAutoRepair() {
        if (!schemaWarning) return;
        const { source, target, sourceNode, targetNode } = schemaWarning;

        // Remove the invalid edge
        edges = edges.filter(
            (e) => !(e.source === source && e.target === target),
        );

        // Insert Transform Node
        const transformId = addNode("skill", {
            x: (sourceNode.position.x + targetNode.position.x) / 2,
            y: (sourceNode.position.y + targetNode.position.y) / 2 - 40,
        });

        const tNode = nodes.find((n) => n.id === transformId);
        if (tNode) {
            tNode.data.label = "Auto Transform (JSON→Bool)";
            tNode.data.skillName = "TypeConverter";
        }

        // Add repaired edges
        edges = [
            ...edges,
            { id: `e-${source}-${transformId}`, source, target: transformId },
            { id: `e-${transformId}-${target}`, source: transformId, target },
        ];

        schemaWarning = null;
        toastStore.success("已自动插入 Transform 节点");
    }

    // ITEM 4: Schema-based Typing Guard (Auto-Repair)
    function handleEdgeCreate(source: string, target: string) {
        const sourceNode = nodes.find((n) => n.id === source);
        const targetNode = nodes.find((n) => n.id === target);

        const outputsJson = ["skill", "agent"].includes(sourceNode?.type || "");
        const expectsBool = ["condition", "router"].includes(
            targetNode?.type || "",
        );

        if (outputsJson && expectsBool) {
            schemaWarning = { source, target, sourceNode, targetNode };
        }
    }

    // P1 #11: Auto-save
    let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
    let lastAutoSaved = $state<string | null>(null);

    $effect(() => {
        if (isDirty && isLoaded && nodes.length > 0) {
            if (autoSaveTimer) clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(() => {
                saveWorkflow();
                lastAutoSaved = new Date().toLocaleTimeString();
            }, 30000); // 30 seconds
        }
        return () => {
            if (autoSaveTimer) clearTimeout(autoSaveTimer);
        };
    });

    // P2 #18: Workflow metrics
    let metrics = $derived.by(() => {
        const typeCounts: Record<string, number> = {};
        for (const n of nodes) {
            typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
        }
        return {
            nodeCount: nodes.length,
            edgeCount: edges.length,
            typeCounts,
        };
    });

    // P3 #25: Workflow README
    let showReadme = $state(false);
    let readmeContent = $state("");

    // Execution State
    const { activeExecution } = workflowStore;
    let isRunning = $derived($activeExecution.isRunning);
    let currentExecutionNodeId = $derived($activeExecution.currentNodeId);
    let executionLogs = $derived($activeExecution.logs);

    // Auto-scroll logs when new logs are added
    $effect(() => {
        if (executionLogs.length > 0 && showLogs) {
            setTimeout(() => {
                const logEnd = document.getElementById("log-end");
                logEnd?.scrollIntoView({ behavior: "smooth" });
            }, 50);
        }
    });

    // Show logs automatically when running starts
    $effect(() => {
        if (isRunning && !showLogs) {
            showLogs = true;
        }
    });

    // Derived single selection for property panel
    let singleSelectedNodeId = $derived(
        selectedNodeIds.size === 1 ? Array.from(selectedNodeIds)[0] : null,
    );

    function getSelectedNode() {
        return nodes.find((n) => selectedNodeIds.has(n.id));
    }

    // Bulk selection derived state
    let selectedNodesItems = $derived(
        Array.from(selectedNodeIds)
            .map((id) => nodes.find((n) => n.id === id))
            .filter(Boolean) as FlowNode[],
    );

    let bulkCommonLabel = $derived.by(() => {
        if (selectedNodesItems.length < 2) return "";
        const first = selectedNodesItems[0].data.label;
        return selectedNodesItems.every((n) => n.data.label === first)
            ? first
            : "";
    });

    let bulkCommonAgentId = $derived.by(() => {
        if (selectedNodesItems.length < 2) return "";
        const types = selectedNodesItems.map((n) => n.type);
        if (types.some((t) => t !== "agent")) return "";
        const first = selectedNodesItems[0].data.agentId;
        return selectedNodesItems.every((n) => n.data.agentId === first)
            ? first
            : "";
    });

    function applyBulkLabel(e: Event) {
        const target = e.target as HTMLInputElement;
        const newLabel = target.value;
        if (!newLabel) return;
        nodes = nodes.map((n) => {
            if (selectedNodeIds.has(n.id)) {
                return { ...n, data: { ...n.data, label: newLabel } };
            }
            return n;
        });
    }

    function applyBulkAgent(e: Event) {
        const target = e.target as HTMLSelectElement;
        const newAgentId = target.value;
        if (!newAgentId) return;
        const agent = $agentStore.find((a) => a.id === newAgentId);
        nodes = nodes.map((n) => {
            if (selectedNodeIds.has(n.id) && n.type === "agent") {
                return {
                    ...n,
                    data: {
                        ...n.data,
                        agentId: newAgentId,
                        agentName: agent?.name || "Unknown",
                        label: agent?.name || n.data.label,
                    },
                };
            }
            return n;
        });
    }

    // Handle workflowId changes
    $effect(() => {
        const id = workflowId;
        untrack(() => loadWorkflow(id));
    });

    async function loadWorkflow(id: string | null | undefined) {
        if (!id) {
            nodes = [
                {
                    id: "agent-1",
                    type: "agent",
                    position: { x: 200, y: 300 },
                    data: {
                        label: "用户意图分析",
                        agentName: "拆局者",
                        agentId: "decomposer",
                    },
                },
                {
                    id: "skill-1",
                    type: "skill",
                    position: { x: 500, y: 300 },
                    data: {
                        label: "问题分解",
                        skillName: "decompose",
                        skillId: "decompose",
                    },
                },
                {
                    id: "agent-2",
                    type: "agent",
                    position: { x: 800, y: 300 },
                    data: {
                        label: "生成回复",
                        agentName: "收尾者",
                        agentId: "closer",
                    },
                },
            ];
            edges = [
                {
                    id: "e-agent-skill",
                    source: "agent-1",
                    target: "skill-1",
                    type: "step",
                    style: "solid",
                },
                {
                    id: "e-skill-agent",
                    source: "skill-1",
                    target: "agent-2",
                    type: "step",
                    style: "solid",
                },
            ];
            isLoaded = true;
            markClean();
            return;
        }

        const record = workflowStore.getWorkflow(id);
        if (record) {
            nodes = record.workflow.nodes.map((n) => {
                const data: NodeData = {
                    label: n.name,
                    description: undefined,
                };

                if (n.type === "agent") {
                    const config = n.config as AgentNodeConfig;
                    data.agentId = config.agentId;
                    const agent = config.agentId
                        ? $agentStore.find((a) => a.id === config.agentId)
                        : undefined;
                    data.agentName = agent ? agent.name : n.name;
                    data.label = data.agentName;
                } else if (n.type === "skill") {
                    const config = n.config as SkillNodeConfig;
                    data.skillId = config.skillId;
                    data.skillName = n.name;
                }

                return {
                    id: n.id,
                    type: mapOrchestrationTypeToFlowType(n.type),
                    position: n.position || { x: 0, y: 0 },
                    data,
                };
            });

            edges = record.workflow.edges.map((e) => ({
                id: e.id,
                source: e.source,
                target: e.target,
            }));
        }
        isLoaded = true;
        markClean();
    }

    function mapOrchestrationTypeToFlowType(type: string): NodeType {
        if (type === "condition") return "condition";
        return (type as NodeType) || "agent";
    }

    // --- Actions ---

    function handleCanvasDoubleClick(
        pos: { x: number; y: number },
        e: MouseEvent,
    ) {
        paletteCanvasPos = pos;
        palettePos = { x: e.clientX, y: e.clientY };
        paletteVisible = true;
    }

    function addNode(type: NodeType, pos?: { x: number; y: number }) {
        const id = `${type}-${Date.now()}`;
        const position = pos || {
            x: 400 + Math.random() * 50,
            y: 300 + Math.random() * 50,
        };

        let data: any = { label: "新节点" };
        if (type === "agent")
            data = { label: "Agent 节点", agentName: "选择 Agent" };
        if (type === "skill")
            data = { label: "技能节点", skillName: "选择技能" };
        if (type === "router") data = { label: "分支路由" };
        if (type === "parallel") data = { label: "并行处理" };
        if (type === "condition") data = { label: "条件分支" };

        nodes = [...nodes, { id, type, position, data }];
        return id;
    }

    function deleteSelected() {
        if (selectedNodeIds.size > 0) {
            nodes = nodes.filter((n) => !selectedNodeIds.has(n.id));
            edges = edges.filter(
                (e) =>
                    !selectedNodeIds.has(e.source) &&
                    !selectedNodeIds.has(e.target),
            );
            selectedNodeIds.clear();
        }
    }

    function saveWorkflow() {
        const workflowData = {
            id: workflowId || crypto.randomUUID(),
            name: workflowId
                ? $workflowStore.find((w) => w.id === workflowId)?.name ||
                  "Updated Workflow"
                : "New Workflow",
            description: "Created via Flow Editor V2",
            nodes: nodes.map((n) => ({
                id: n.id,
                type: n.type === "router" ? "condition" : n.type,
                name: n.data.agentName || n.data.skillName || n.data.label,
                config: {
                    agentId: n.data.agentId,
                    skillId: n.data.skillId,
                },
                position: n.position,
            })),
            edges: edges.map((e) => ({
                id: e.id,
                source: e.source,
                target: e.target,
            })),
            entryNodeId:
                nodes.find((n) => n.type === "start")?.id || nodes[0]?.id || "",
            version: "2.0.0",
        };

        const startNode = nodes.find((n) => n.type === "start");
        if (startNode) {
            const entryEdge = edges.find((e) => e.source === startNode.id);
            if (entryEdge) {
                workflowData.entryNodeId = entryEdge.target;
            }
        }

        workflowStore.saveWorkflow({
            id: workflowData.id,
            name: workflowData.name,
            description: workflowData.description,
            workflow: workflowData as any,
        });

        onSaveSuccess();
        markClean();
        toastStore.success("工作流已保存");
    }

    let showRunModal = $state(false);
    let runInputText = $state("请分析并处理当前任务需求");
    let isLogsExpanded = $state(false);
    let logsCopied = $state(false);

    function copyLogs() {
        if (executionLogs.length === 0) return;
        const text = executionLogs
            .map((log) => `[${log.type}] ${log.content?.nodeName || "Node"}: ${typeof log.content?.output === "object" ? JSON.stringify(log.content?.output, null, 2) : String(log.content?.output || "")}`)
            .join("\n\n");
        navigator.clipboard.writeText(text).then(() => {
            logsCopied = true;
            setTimeout(() => (logsCopied = false), 2000);
        });
    }

    function runWorkflow() {
        if (nodes.length === 0) {
            toastStore.error("画布为空，无法执行工作流");
            return;
        }
        showRunModal = true;
    }

    async function executeWithRunModal() {
        showRunModal = false;

        if (!workflowId) {
            const entryNode = nodes[0];
            const entryNodeId = entryNode?.id || nodes[0]?.id;

            const workflowData = {
                name: "未命名工作流",
                description: "",
                workflow: {
                    id: `temp-${Date.now()}`,
                    name: "未命名工作流",
                    description: "",
                    nodes: nodes.map((n) => ({
                        id: n.id,
                        type:
                            n.type === "agent"
                                ? "agent"
                                : n.type === "skill"
                                  ? "skill"
                                  : n.type,
                        name: n.data?.label || n.type,
                        position: n.position,
                        config:
                            n.type === "agent"
                                ? { agentId: n.data?.agentId }
                                : n.type === "skill"
                                  ? { skillId: n.data?.skillId }
                                  : {},
                    })),
                    edges: edges.map((e) => ({
                        id: e.id,
                        source: e.source,
                        target: e.target,
                    })),
                    entryNodeId: entryNodeId,
                } as any,
            };

            workflowStore.saveWorkflow(workflowData);
            const savedWorkflows = get(workflowStore);
            const savedWorkflow = savedWorkflows[savedWorkflows.length - 1];
            workflowId = savedWorkflow.id;
        }

        showLogs = true;
        await workflowStore.executeWorkflow(workflowId, runInputText);
    }
</script>

<div class="w-full h-full flex overflow-hidden">
    <!-- Sidebar / Toolbar (Floating) -->
    <div
        class="absolute left-4 top-4 bottom-4 w-16 flex flex-col items-center py-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-10 gap-4"
    >
        <div class="p-2 rounded-xl bg-slate-100 dark:bg-slate-700">
            <MousePointer2 class="w-5 h-5 text-indigo-500" />
        </div>

        <div class="w-8 h-[1px] bg-slate-200 dark:bg-slate-700"></div>

        <button
            onclick={() => addNode("agent")}
            class="p-2 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 text-slate-400 hover:text-violet-500 transition-colors"
            title="Add Agent"
        >
            <Users class="w-5 h-5" />
        </button>
        <button
            onclick={() => addNode("skill")}
            class="p-2 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-900/20 text-slate-400 hover:text-teal-500 transition-colors"
            title="Add Skill"
        >
            <Wrench class="w-5 h-5" />
        </button>
        <button
            onclick={() => addNode("condition")}
            class="p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-400 hover:text-amber-500 transition-colors"
            title="Add Condition"
        >
            <GitBranch class="w-5 h-5" />
        </button>
    </div>

    <!-- Main Canvas -->
    <div class="flex-1 relative">
        {#if isLoaded}
            <FlowEditor
                bind:nodes
                bind:edges
                bind:selectedNodeIds
                onCanvasDoubleClick={handleCanvasDoubleClick}
                onConnectionDrop={handleConnectionDrop}
                onEdgeCreate={handleEdgeCreate}
                executingNodeId={currentExecutionNodeId}
            />

            <FlowCommandPalette
                visible={paletteVisible}
                position={palettePos}
                sourceNodeType={connectionDropSource?.nodeType}
                onClose={() => (paletteVisible = false)}
                onSelect={(type) => {
                    const newId = addNode(type, paletteCanvasPos);

                    if (connectionDropSource && newId) {
                        const newEdge: FlowEdge = {
                            id: `e-${connectionDropSource.nodeId}-${newId}-${Date.now()}`,
                            source: connectionDropSource.nodeId,
                            target: newId,
                        };
                        edges = [...edges, newEdge];
                        connectionDropSource = null;
                    }
                    paletteVisible = false;
                }}
            />
        {:else}
            <div
                class="absolute inset-0 flex items-center justify-center text-slate-400"
            >
                Loading...
            </div>
        {/if}

        <!-- Top Right Actions -->
        <div class="absolute top-4 right-4 flex gap-2">
            <button
                onclick={saveWorkflow}
                class="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 {isDirty
                    ? 'ring-2 ring-amber-400'
                    : ''}"
            >
                <Save class="w-4 h-4" />
                Save
                {#if isDirty}
                    <span
                        class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"
                    ></span>
                {/if}
            </button>
            {#if lastAutoSaved}
                <span
                    class="text-xs text-slate-400 self-center"
                    title="自动保存时间">✓ {lastAutoSaved}</span
                >
            {/if}
            <button
                onclick={runWorkflow}
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 text-sm font-medium transition-colors"
            >
                <Play class="w-4 h-4" />
                {isRunning ? "Running..." : "Run"}
            </button>
            <!-- P3 #25: README toggle -->
            <button
                onclick={() => (showReadme = !showReadme)}
                class="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-500 transition-colors {showReadme
                    ? 'ring-2 ring-blue-400'
                    : ''}"
                title="工作流说明文档"
            >
                <FileText class="w-4 h-4" />
            </button>
        </div>

        <!-- P3 #25: Workflow README Panel -->
        {#if showReadme}
            <div
                class="absolute top-20 right-4 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden z-20"
                style="max-height: 60%;"
            >
                <div
                    class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center"
                >
                    <h3
                        class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2"
                    >
                        <FileText class="w-4 h-4 text-blue-500" />
                        工作流说明
                    </h3>
                    <button
                        onclick={() => (showReadme = false)}
                        class="text-slate-400 hover:text-slate-600"
                    >
                        <X class="w-4 h-4" />
                    </button>
                </div>
                <div class="p-4 flex-1 overflow-y-auto">
                    <textarea
                        bind:value={readmeContent}
                        placeholder="记录工作流的用途、参数说明、注意事项..."
                        class="w-full h-full min-h-[200px] text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                    ></textarea>
                </div>
            </div>
        {/if}

        <!-- Property Panel (Right) -->
        {#if singleSelectedNodeId}
            {@const node = nodes.find((n) => n.id === singleSelectedNodeId)}
            {#if node}
                <div
                    class="absolute right-4 top-20 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-200"
                    style="max-height: calc(100% - 140px);"
                >
                    <div
                        class="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur"
                    >
                        <h3 class="font-bold text-slate-900 dark:text-white">
                            Configuration
                        </h3>
                        <button
                            onclick={() => selectedNodeIds.clear()}
                            class="text-slate-400 hover:text-slate-600"
                            title="Close configuration panel"
                            aria-label="Close configuration panel"
                        >
                            <X class="w-4 h-4" />
                        </button>
                    </div>

                    <div class="p-5 overflow-y-auto space-y-6">
                        <!-- Common Props -->
                        <div class="space-y-3">
                            <label
                                class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                                for="agent-flow-node-name"
                                >Node Name</label
                            >
                            <input
                                id="agent-flow-node-name"
                                type="text"
                                bind:value={node.data.label}
                                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        {#if node.type === "agent"}
                            <div class="space-y-3">
                                <label
                                    class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                                    for="agent-flow-select-agent"
                                    >Select Agent</label
                                >
                                <select
                                    id="agent-flow-select-agent"
                                    class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    bind:value={node.data.agentId}
                                    onchange={(e) => {
                                        const agent = $agentStore.find(
                                            (a) =>
                                                a.id === e.currentTarget.value,
                                        );
                                        node.data.agentName =
                                            agent?.name || "Unknown";
                                        node.data.label =
                                            agent?.name || node.data.label;
                                    }}
                                >
                                    <option value="">Select an Agent...</option>
                                    {#each $agentStore as agent}
                                        <option value={agent.id}
                                            >{agent.name}</option
                                        >
                                    {/each}
                                </select>
                            </div>
                        {/if}

                        <div
                            class="pt-4 border-t border-slate-100 dark:border-slate-700"
                        >
                            <button
                                onclick={deleteSelected}
                                class="w-full py-2 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
                            >
                                <Trash2 class="w-4 h-4" />
                                Delete Node
                            </button>
                        </div>
                    </div>
                </div>
            {/if}
        {:else if selectedNodeIds.size > 1}
            <!-- Multi-select Bulk Actions -->
            <div
                class="absolute right-4 top-20 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-200"
            >
                <div
                    class="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur"
                >
                    <h3 class="font-bold text-slate-900 dark:text-white">
                        {selectedNodeIds.size} Nodes Selected
                    </h3>
                    <button
                        onclick={() => selectedNodeIds.clear()}
                        class="text-slate-400 hover:text-slate-600"
                        title="Close bulk selection panel"
                        aria-label="Close bulk selection panel"
                    >
                        <X class="w-4 h-4" />
                    </button>
                </div>
                <div class="p-5 space-y-6">
                    <!-- Bulk Intersect Properties -->
                    <div class="space-y-3">
                        <label
                            class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                            for="agent-flow-bulk-label"
                        >
                            Override Labels (All)
                        </label>
                        <input
                            id="agent-flow-bulk-label"
                            type="text"
                            placeholder={bulkCommonLabel
                                ? bulkCommonLabel
                                : "(Mixed Labels - Type to overwrite all)"}
                            onchange={applyBulkLabel}
                            class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400"
                        />
                    </div>

                    {#if selectedNodesItems.every((n) => n.type === "agent")}
                        <div class="space-y-3">
                            <label
                                class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                                for="agent-flow-bulk-agent"
                            >
                                Override Agent (All)
                            </label>
                            <select
                                id="agent-flow-bulk-agent"
                                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={bulkCommonAgentId}
                                onchange={applyBulkAgent}
                            >
                                <option value="" disabled={!!bulkCommonAgentId}>
                                    {bulkCommonAgentId
                                        ? "Select an Agent..."
                                        : "(Mixed Agents - Select to overwrite all)"}
                                </option>
                                {#each $agentStore as agent}
                                    <option value={agent.id}
                                        >{agent.name}</option
                                    >
                                {/each}
                            </select>
                        </div>
                    {/if}

                    <div
                        class="pt-4 border-t border-slate-100 dark:border-slate-700"
                    >
                        <button
                            onclick={deleteSelected}
                            class="w-full py-2 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Trash2 class="w-4 h-4" />
                            Delete {selectedNodeIds.size} Items
                        </button>
                    </div>
                </div>
            </div>
        {/if}

        <!-- P0 #10: Schema Warning Banner -->
        {#if schemaWarning}
            <div
                class="absolute bottom-48 right-4 left-24 z-30 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-xl p-3 flex items-center gap-3 shadow-lg animate-in slide-in-from-bottom-4 duration-200"
            >
                <div
                    class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center shrink-0"
                >
                    <span class="text-amber-600 text-lg">⚠</span>
                </div>
                <div class="flex-1 text-sm">
                    <p class="font-medium text-amber-800 dark:text-amber-200">
                        Schema Guard: 类型不匹配
                    </p>
                    <p
                        class="text-amber-600 dark:text-amber-400 text-xs mt-0.5"
                    >
                        源节点输出 [JSON]，但目标节点期望
                        [Boolean]。是否自动插入 Transform 节点？
                    </p>
                </div>
                <button
                    onclick={applySchemaAutoRepair}
                    class="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg transition-colors"
                    >自动修复</button
                >
                <button
                    onclick={dismissSchemaWarning}
                    class="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors"
                    >忽略</button
                >
            </div>
        {/if}

        <!-- P2 #18: Workflow Metrics Bar -->
        <div
            class="absolute bottom-4 left-24 flex items-center gap-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs text-slate-500 z-10"
        >
            <div class="flex items-center gap-1.5">
                <BarChart3 class="w-3.5 h-3.5 text-blue-500" />
                <span class="font-medium">{metrics.nodeCount}</span> 节点
            </div>
            <div class="w-px h-4 bg-slate-200 dark:bg-slate-600"></div>
            <div class="flex items-center gap-1.5">
                <GitBranch class="w-3.5 h-3.5 text-emerald-500" />
                <span class="font-medium">{metrics.edgeCount}</span> 连线
            </div>
            {#if Object.keys(metrics.typeCounts).length > 0}
                <div class="w-px h-4 bg-slate-200 dark:bg-slate-600"></div>
                <div class="flex items-center gap-1.5 flex-wrap">
                    {#each Object.entries(metrics.typeCounts) as [type, count]}
                        <span
                            class="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px]"
                            >{type}: {count}</span
                        >
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Logs Panel (Bottom Right) -->
        {#if showLogs}
            <div
                class="absolute bottom-4 right-4 z-20 flex flex-col font-mono text-xs bg-slate-900/95 text-slate-200 backdrop-blur rounded-xl border border-slate-700 shadow-2xl overflow-hidden transition-all duration-200 {isLogsExpanded ? 'w-[560px] h-[360px]' : 'w-80 h-48'}"
            >
                <div class="px-3.5 py-2 border-b border-slate-800 flex justify-between items-center bg-slate-950/70">
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full {isRunning ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}"></div>
                        <span class="font-bold text-slate-200 text-xs">执行控制台</span>
                        {#if isRunning}
                            <span class="text-amber-400 text-[10px] animate-pulse">执行中...</span>
                        {/if}
                    </div>
                    <div class="flex items-center gap-1">
                        <button
                            onclick={() => (isLogsExpanded = !isLogsExpanded)}
                            class="p-1 text-slate-400 hover:text-slate-200 rounded transition"
                            title={isLogsExpanded ? "收起" : "展开"}
                            aria-label={isLogsExpanded ? "收起" : "展开"}
                        >
                            {#if isLogsExpanded}
                                <Minimize2 class="w-3.5 h-3.5" />
                            {:else}
                                <Maximize2 class="w-3.5 h-3.5" />
                            {/if}
                        </button>
                        <button
                            onclick={copyLogs}
                            class="p-1 text-slate-400 hover:text-slate-200 rounded transition"
                            title="复制日志"
                            aria-label="复制日志"
                        >
                            {#if logsCopied}
                                <Check class="w-3.5 h-3.5 text-emerald-400" />
                            {:else}
                                <Copy class="w-3.5 h-3.5" />
                            {/if}
                        </button>
                        <button
                            onclick={() => (showLogs = false)}
                            class="p-1 text-slate-400 hover:text-slate-200 rounded transition"
                            title="关闭"
                            aria-label="关闭"
                        >
                            <X class="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto p-3 space-y-2.5" role="log">
                    {#each executionLogs as log, i}
                        <div
                            class="border-l-2 pl-2.5 py-0.5 transition-all {log.type === 'error'
                                ? 'border-red-500 bg-red-950/30 text-red-200'
                                : log.type === 'result'
                                  ? 'border-emerald-500 bg-emerald-950/30 text-emerald-200'
                                  : 'border-indigo-500/80 bg-slate-800/30'}"
                        >
                            <div class="flex items-center justify-between text-[10px] text-slate-400">
                                <span class="font-medium text-slate-300">{log.content?.nodeName || "节点"}</span>
                                <span>[{log.type}] {new Date(log.content?.startTime || Date.now()).toLocaleTimeString()}</span>
                            </div>
                            <pre class="text-slate-300 mt-1 text-[11px] whitespace-pre-wrap break-all font-mono leading-relaxed max-h-36 overflow-y-auto bg-black/20 p-1.5 rounded">{typeof log.content?.output === "object" ? JSON.stringify(log.content?.output, null, 2) : String(log.content?.output || "")}</pre>
                        </div>
                    {/each}
                    {#if executionLogs.length === 0}
                        <div class="text-slate-500 italic text-center py-6">
                            就绪 - 点击 Run 开始执行工作流
                        </div>
                    {/if}
                    <div id="log-end"></div>
                </div>
            </div>
        {/if}
    </div>
</div>

{#if showRunModal}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
        onclick={() => (showRunModal = false)}
        onkeydown={(e) => { if (e.key === "Escape") showRunModal = false; }}
        role="button"
        tabindex="0"
    >
        <div
            class="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            tabindex="-1"
        >
            <div class="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div class="flex items-center gap-2">
                    <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                        <Play class="h-4 w-4" />
                    </div>
                    <h3 class="font-bold text-slate-900 dark:text-white">运行工作流</h3>
                </div>
                <button
                    onclick={() => (showRunModal = false)}
                    class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                    aria-label="关闭"
                >
                    <X class="h-4 w-4" />
                </button>
            </div>

            <div class="mt-4 space-y-3">
                <label for="workflow-run-input" class="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    初始输入数据 / 任务描述
                </label>
                <textarea
                    id="workflow-run-input"
                    bind:value={runInputText}
                    rows="4"
                    placeholder="输入要传递给首个节点的初始指令或 JSON 数据..."
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                ></textarea>
            </div>

            <div class="mt-5 flex items-center justify-end gap-2">
                <button
                    onclick={() => (showRunModal = false)}
                    class="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                    取消
                </button>
                <button
                    onclick={executeWithRunModal}
                    class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-500 active:scale-95"
                >
                    <Play class="h-3.5 w-3.5" />
                    确认并执行
                </button>
            </div>
        </div>
    </div>
{/if}
