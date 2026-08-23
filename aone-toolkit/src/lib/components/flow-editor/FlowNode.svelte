<script lang="ts">
    import {
        Users,
        Wrench,
        Play,
        GitBranch,
        AlertTriangle,
        Maximize,
        Minimize,
        Plus,
        Trash2,
        Loader2,
        CheckCircle2,
        XCircle,
        Lock,
    } from "lucide-svelte";
    import type { FlowNode, NodeType, FlowEdge } from "./types";
    import FlowVariablePicker from "./FlowVariablePicker.svelte";
    import { tick } from "svelte";

    let {
        node = $bindable(),
        selected = false,
        executing = false,
        onSelect = (id: string, e?: MouseEvent) => {},
        onDragStart = () => {},
        onDrag = () => {},
        onDragEnd = () => {},
        onDuplicate = (nodeId: string) => {}, // NEW: Callback for duplicate action
        onConnectStart = (
            nodeId: string,
            handleType: "input" | "output",
            e: MouseEvent,
        ) => {},
        onConnectEnd = (
            nodeId: string,
            handleType: "input" | "output",
            e: MouseEvent,
        ) => {},
        onHandleContextMenu = (
            nodeId: string,
            handleType: "input" | "output",
            x: number,
            y: number,
        ) => {}, // NEW: Context menu on handles
        onAction = (action: string, nodeId: string, data?: any) => {},
        nodes = [],
        edges = [],
        zoom = 1, // NEW: Item 10 Semantic Zoom
    } = $props<{
        node: FlowNode;
        selected?: boolean;
        executing?: boolean;
        onSelect?: (id: string, e?: MouseEvent) => void;
        onDragStart?: (e: MouseEvent, id: string) => void;
        onDrag?: (e: MouseEvent, id: string) => void;
        onDragEnd?: (e: MouseEvent, id: string) => void;
        onDuplicate?: (nodeId: string) => void; // NEW: Callback for duplicate action
        onConnectStart?: (
            nodeId: string,
            handleType: "input" | "output",
            e: MouseEvent,
        ) => void;
        onConnectEnd?: (
            nodeId: string,
            handleType: "input" | "output",
            e: MouseEvent,
        ) => void;
        onAction?: (action: string, nodeId: string, data?: any) => void;
        onHandleContextMenu?: (nodeId: string, handleType: "input" | "output", x: number, y: number) => void; // NEW: Context menu on handles
        nodes?: FlowNode[];
        edges?: FlowEdge[];
        zoom?: number;
    }>();

    let isDragging = $state(false);
    let isDuplicating = $state(false); // NEW: Track duplicate mode

    // P2-14: Inline Renaming on Canvas
    let isEditingLabel = $state(false);
    let editedLabel = $state("");

    function startInlineEdit(e: MouseEvent) {
        e.stopPropagation();
        editedLabel = node.data?.label || "";
        isEditingLabel = true;
    }

    function saveInlineEdit() {
        if (editedLabel.trim()) {
            if (!node.data) node.data = {};
            node.data.label = editedLabel.trim();
        }
        isEditingLabel = false;
    }

    function cancelInlineEdit() {
        isEditingLabel = false;
    }

    function handleMouseDown(e: MouseEvent) {
        e.stopPropagation();
        onSelect(node.id, e);

        // Only drag if left click
        if (e.button !== 0) return;

        // NEW: Item 22 Lock Check
        if (node.data?.locked) return;

        // NEW: Ctrl+Drag = Duplicate mode
        if (e.ctrlKey || e.metaKey) {
            isDuplicating = true;
            // Trigger duplicate callback
            if (onDuplicate) {
                onDuplicate(node.id);
            }
            return; // Don't start dragging, just duplicate
        }

        isDragging = true;
        onDragStart(e, node.id);

        const startX = e.clientX;
        const startY = e.clientY;

        function handleMouseMove(moveEvent: MouseEvent) {
            onDrag(moveEvent, node.id);
        }

        function handleMouseUp(upEvent: MouseEvent) {
            isDragging = false;
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            onDragEnd(upEvent, node.id);
        }

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    }

    function handleHandleMouseDown(e: MouseEvent, type: "input" | "output") {
        e.stopPropagation();
        onConnectStart(node.id, type, e);
    }

    function handleHandleMouseUp(e: MouseEvent, type: "input" | "output") {
        e.stopPropagation();
        onConnectEnd(node.id, type, e);
    }

    const nodeConfig: Record<
        NodeType,
        { icon: any; color: string; bg: string; border: string }
    > = {
        agent: {
            icon: Users,
            color: "text-violet-500",
            bg: "bg-violet-50 dark:bg-violet-900/40",
            border: "border-violet-200 dark:border-violet-700",
        },
        skill: {
            icon: Wrench,
            color: "text-emerald-500",
            bg: "bg-emerald-50 dark:bg-emerald-900/40",
            border: "border-emerald-200 dark:border-emerald-700",
        },
        router: {
            icon: GitBranch,
            color: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-900/40",
            border: "border-blue-200 dark:border-blue-700",
        },
        parallel: {
            icon: GitBranch,
            color: "text-amber-500",
            bg: "bg-amber-50 dark:bg-amber-900/40",
            border: "border-amber-200 dark:border-amber-700",
        },
        condition: {
            icon: AlertTriangle,
            color: "text-rose-500",
            bg: "bg-rose-50 dark:bg-rose-900/40",
            border: "border-rose-200 dark:border-rose-700",
        },
        start: {
            icon: Play,
            color: "text-slate-500",
            bg: "bg-slate-50 dark:bg-slate-900/40",
            border: "border-slate-200 dark:border-slate-700",
        },
        end: {
            icon: Play, // Placeholder or Stop
            color: "text-slate-500",
            bg: "bg-slate-50 dark:bg-slate-900/40",
            border: "border-slate-200 dark:border-slate-700",
        },
        broadcast: {
            icon: Play, // Placeholder
            color: "text-purple-500",
            bg: "bg-purple-50 dark:bg-purple-900/40",
            border: "border-purple-200 dark:border-purple-700",
        },
        listen: {
            icon: Play, // Placeholder
            color: "text-purple-500",
            bg: "bg-purple-50 dark:bg-purple-900/40",
            border: "border-purple-200 dark:border-purple-700",
        },

        group: {
            icon: Users, // Placeholder
            color: "text-slate-500",
            bg: "bg-slate-50/50 dark:bg-slate-900/50",
            border: "border-slate-300 dark:border-slate-600 border-dashed",
        },
        loop: {
            icon: Play, // Placeholder
            color: "text-amber-600",
            bg: "bg-amber-50/50 dark:bg-amber-900/20",
            border: "border-amber-300 dark:border-amber-600 border-dashed",
        },
    };

    let config = $derived(
        nodeConfig[node.type as NodeType] || nodeConfig.agent,
    );
    let Icon = $derived(config.icon);

    function handleDoubleClick(e: MouseEvent) {
        e.stopPropagation();
        if (node.type === "group" || node.type === "loop") {
            // Toggle collapse
            node.collapsed = !node.collapsed;
        }
    }

    // NEW: Broadcast/Listen Logic (Item 8)
    let availableBroadcasts = $derived.by(() => {
        if (!nodes) return [];
        return nodes
            .filter(
                (n: FlowNode) =>
                    n.type === "broadcast" && n.data.broadcastChannel,
            )
            .map((n: FlowNode) => n.data.broadcastChannel as string);
    });

    // --- Dynamic Ports (Router) ---
    function addPort(e: MouseEvent) {
        e.stopPropagation();
        if (!node.data.outputs) node.data.outputs = [];
        node.data.outputs = [
            ...node.data.outputs,
            `Route ${node.data.outputs.length + 1}`,
        ];
    }

    // --- Condition Builder ---
    let showVarPicker = $state(false);
    let pickerPos = $state({ x: 0, y: 0 });
    let activeInput: "variable" | "value" | null = $state(null);

    function openVarPicker(e: MouseEvent, field: "variable" | "value") {
        e.stopPropagation();
        activeInput = field;
        pickerPos = { x: e.clientX, y: e.clientY + 20 };
        showVarPicker = true;
    }

    function handleVarSelect(val: string) {
        if (!node.data.condition)
            node.data.condition = { variable: "", operator: "==", value: "" };
        if (activeInput === "variable") node.data.condition.variable = val;
        if (activeInput === "value") node.data.condition.value = val;
        showVarPicker = false;
        activeInput = null;
    }

    // ENHANCEMENT 8: Connection status indicator on handles
    let inputConnectionStatus = $derived.by(() => {
        if (!edges || edges.length === 0) return "none"; // No connections
        const hasInput = edges.some((e: FlowEdge) => e.target === node.id);
        if (!hasInput) return "none";
        
        // Check for issues
        const incomingEdge = edges.find((e: FlowEdge) => e.target === node.id);
        if (incomingEdge) {
            const sourceNode = nodes?.find((n: FlowNode) => n.id === incomingEdge.source);
            if (sourceNode && sourceNode.id === node.id) return "error"; // Self-loop
            // Check for duplicate edges (redundant)
            const allIncoming = edges.filter((e: FlowEdge) => e.target === node.id);
            if (allIncoming.length > 1) return "warning";
        }
        return "connected";
    });

    let outputConnectionStatus = $derived.by(() => {
        if (!edges || edges.length === 0) return "none";
        const hasOutput = edges.some((e: FlowEdge) => e.source === node.id);
        if (!hasOutput) return "none";
        
        // Check for issues
        const outgoingEdges = edges.filter((e: FlowEdge) => e.source === node.id);
        for (const edge of outgoingEdges) {
            if (edge.target === node.id) return "error"; // Self-loop
        }
        
        // Check for many connections (could be warning)
        if (outgoingEdges.length > 3) return "warning";
        
        return "connected";
    });

    function getStatusColor(status: string): string {
        switch (status) {
            case "connected": return "bg-emerald-500";
            case "error": return "bg-red-500";
            case "warning": return "bg-amber-500";
            default: return "bg-slate-300 dark:bg-slate-600";
        }
    }

    function getStatusDotPosition(isInput: boolean): string {
        return isInput 
            ? "left-[2px] top-1/2 -translate-y-1/2" 
            : "right-[2px] top-1/2 -translate-y-1/2";
    }
</script>

{#if showVarPicker}
    <FlowVariablePicker
        position={pickerPos}
        onSelect={handleVarSelect}
        onClose={() => (showVarPicker = false)}
        {nodes}
        {edges}
        nodeId={node.id}
    />
{/if}

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
    class="absolute rounded-xl border-2 shadow-sm backdrop-blur-sm transition-all duration-200
    {node.type === 'group' || node.type === 'loop'
        ? config.bg + ' ' + config.border
        : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700'}
    {node.executionState === 'running' || executing
        ? 'ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 border-blue-500 animate-[pulse_2s_ease-in-out_infinite]'
        : ''}
    {node.executionState === 'completed'
        ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900 border-emerald-500'
        : ''}
    {node.executionState === 'error'
        ? 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-slate-900 border-red-500 bg-red-50 dark:bg-red-900/10'
        : ''}
    {selected &&
    node.executionState !== 'running' &&
    node.executionState !== 'completed' &&
    node.executionState !== 'error'
        ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 border-blue-500'
        : node.type !== 'group' && node.type !== 'loop' && !node.executionState
          ? 'hover:border-slate-300 dark:hover:border-slate-600'
          : ''}
    {isDragging ? 'cursor-grabbing scale-105 shadow-xl z-50' : ''}
    {isDuplicating ? 'cursor-copy' : 'cursor-grab'}
    {(node.type === 'group' || node.type === 'loop') && !node.collapsed
        ? 'z-0'
        : 'z-10'}
    "
    style="
        left: {node.position.x}px; 
        top: {node.position.y}px;
        width: {node.collapsed
        ? '200px'
        : node.style?.width
          ? node.style.width + 'px'
          : node.type === 'group' || node.type === 'loop'
            ? '400px'
            : '256px'};
        height: {node.collapsed
        ? '40px'
        : node.style?.height
          ? node.style.height + 'px'
          : node.type === 'group' || node.type === 'loop'
            ? '300px'
            : 'auto'};
    "
    onmousedown={handleMouseDown}
    ondblclick={handleDoubleClick}
    role="button"
    tabindex="0"
>
    <!-- Group/Loop Label -->
    {#if node.type === "group" || node.type === "loop"}
        <div
            class="px-2 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-transparent flex items-center justify-between h-full"
        >
            <div class="flex items-center gap-2">
                <button
                    class="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                    onclick={(e) => {
                        e.stopPropagation();
                        node.collapsed = !node.collapsed;
                    }}
                >
                    {#if node.collapsed}
                        <Maximize class="w-3 h-3" />
                    {:else}
                        <Minimize class="w-3 h-3" />
                    {/if}
                </button>
                <span>{node.data.label}</span>
            </div>

            {#if node.collapsed}
                <span
                    class="text-[10px] bg-slate-200 dark:bg-slate-700 px-1 rounded"
                    >Group</span
                >
            {/if}
        </div>
        {#if !node.collapsed}
            <!-- Content Area (Empty, acts as container) -->
            <div class="w-full h-full relative">
                <!-- Grid pattern or watermark? -->
            </div>
        {/if}
    {:else}
        <!-- Standard Node Header -->
        <div
            class="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 {config.bg}"
        >
            <div
                class="p-1.5 rounded-lg bg-white dark:bg-black/20 {config.color}"
            >
                <Icon class="w-4 h-4" />
            </div>
            <div class="flex-1 min-w-0">
                {#if isEditingLabel}
                    <input
                        type="text"
                        bind:value={editedLabel}
                        onkeydown={(e) => {
                            if (e.key === "Enter") saveInlineEdit();
                            if (e.key === "Escape") cancelInlineEdit();
                        }}
                        onblur={saveInlineEdit}
                        class="w-full text-xs font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-blue-500 outline-none text-slate-900 dark:text-white"
                        autofocus
                        onclick={(e) => e.stopPropagation()}
                    />
                {:else}
                    <h3
                        ondblclick={startInlineEdit}
                        class="text-sm font-bold text-slate-900 dark:text-white truncate cursor-text hover:text-blue-600 dark:hover:text-blue-400"
                        title="双击原地快速重命名"
                    >
                        {node.data.label}
                    </h3>
                {/if}
                <p
                    class="text-[10px] opacity-60 uppercase tracking-wider font-semibold"
                >
                    {node.type}
                </p>
            </div>
        </div>

        <!-- NEW: Execution State Badge -->
        {#if node.executionState && node.executionState !== "idle" && node.executionState !== "waiting"}
            <div
                class="absolute -top-3 -right-3 z-50 bg-white dark:bg-slate-800 rounded-full shadow-md border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center"
            >
                {#if node.executionState === "running"}
                    <Loader2 class="w-4 h-4 text-blue-500 animate-spin" />
                {:else if node.executionState === "completed"}
                    <CheckCircle2 class="w-4 h-4 text-emerald-500" />
                {:else if node.executionState === "error"}
                    <XCircle class="w-4 h-4 text-red-500" />
                {/if}
            </div>
            {#if node.executionState === "error" && node.errorMessage}
                <div
                    class="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-medium border-b border-red-200 dark:border-red-800"
                >
                    {node.errorMessage}
                </div>
            {/if}
        {/if}

        <!-- NEW: Inline Parameter Preview (Item 3) -->
        {#if node.type === "agent" && node.data.agentName}
            <div class="px-4 pt-3 pb-0">
                <div
                    class="text-[10px] bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2 py-1.5 rounded truncate border border-violet-100 dark:border-violet-800/50 shadow-sm flex flex-col gap-1"
                >
                    <div
                        class="font-semibold uppercase tracking-wider opacity-80 border-b border-violet-200 dark:border-violet-700/50 pb-0.5"
                    >
                        Core Config
                    </div>
                    <div class="flex gap-2">
                        <span class="opacity-70 font-mono">Agent:</span>
                        <span class="font-medium truncate"
                            >{node.data.agentName}</span
                        >
                    </div>
                </div>
            </div>
        {/if}
        {#if node.type === "skill" && node.data.skillName}
            <div class="px-4 pt-3 pb-0">
                <div
                    class="text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1.5 rounded truncate border border-emerald-100 dark:border-emerald-800/50 shadow-sm flex flex-col gap-1"
                >
                    <div
                        class="font-semibold uppercase tracking-wider opacity-80 border-b border-emerald-200 dark:border-emerald-700/50 pb-0.5"
                    >
                        Core Config
                    </div>
                    <div class="flex gap-2">
                        <span class="opacity-70 font-mono">Skill:</span>
                        <span class="font-medium truncate"
                            >{node.data.skillName}</span
                        >
                    </div>
                </div>
            </div>
        {/if}

        {#if node.type === "broadcast"}
            <!-- Broadcast receives input, emits virtually -->
            <div
                class="absolute left-[-6px] top-[14px] w-3 h-3 rounded-full bg-purple-400 dark:bg-purple-500 border border-white dark:border-slate-800 hover:bg-purple-600 hover:scale-125 transition-all cursor-crosshair z-10 group"
                title="Input"
                role="button"
                tabindex="0"
                onmousedown={(e) => handleHandleMouseDown(e, "input")}
                onmouseup={(e) => handleHandleMouseUp(e, "input")}
                oncontextmenu={(e) => { e.preventDefault(); e.stopPropagation(); onHandleContextMenu(node.id, "input", e.clientX, e.clientY); }}
            >
                <div
                    class="absolute -inset-3 bg-transparent rounded-full z-0"
                ></div>
            </div>
            <div class="px-4 py-3 pb-2 space-y-2">
                <div class="text-xs text-slate-500 font-medium">
                    Channel Name
                </div>
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div class="nodrag" onclick={(e) => e.stopPropagation()}>
                    <input
                        type="text"
                        class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-purple-500 outline-none {node
                            .data?.locked
                            ? 'opacity-50 cursor-not-allowed'
                            : ''}"
                        placeholder="e.g., userData"
                        bind:value={node.data.broadcastChannel}
                        disabled={node.data?.locked}
                    />
                </div>
            </div>
        {/if}

        {#if node.type === "listen"}
            <!-- Listen receives virtually, emits output -->
            <div
                class="absolute right-[-6px] top-[14px] w-3 h-3 rounded-full bg-purple-400 dark:bg-purple-500 border border-white dark:border-slate-800 hover:bg-purple-600 hover:scale-125 transition-all cursor-crosshair z-10 group"
                title="Output"
                role="button"
                tabindex="0"
                onmousedown={(e) => handleHandleMouseDown(e, "output")}
                onmouseup={(e) => handleHandleMouseUp(e, "output")}
                oncontextmenu={(e) => { e.preventDefault(); e.stopPropagation(); onHandleContextMenu(node.id, "output", e.clientX, e.clientY); }}
            >
                <div
                    class="absolute -inset-3 bg-transparent rounded-full z-0"
                ></div>
            </div>
            <div class="px-4 py-3 pb-2 space-y-2">
                <div class="text-xs text-slate-500 font-medium">Listen To</div>
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div class="nodrag" onclick={(e) => e.stopPropagation()}>
                    <select
                        class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-purple-500 outline-none appearance-none {node
                            .data?.locked
                            ? 'opacity-50 cursor-not-allowed'
                            : ''}"
                        bind:value={node.data.broadcastChannel}
                        disabled={node.data?.locked}
                    >
                        <option value="" disabled selected
                            >Select Channel</option
                        >
                        {#each availableBroadcasts as channel}
                            <option value={channel}>{channel}</option>
                        {/each}
                    </select>
                </div>
            </div>
        {/if}

        {#if (zoom >= 0.3 || (node.type === "group" && !node.data?.collapsed)) && node.data?.locked}
            <div
                class="absolute -top-3 -right-3 z-50 bg-amber-500 text-white p-1 rounded-full shadow-lg border-2 border-white dark:border-slate-800"
            >
                <Lock size={12} />
            </div>
        {/if}

        <!-- Body -->
        <div
            class="transition-opacity duration-300 {zoom < 0.6
                ? 'opacity-0 h-0 overflow-hidden p-0'
                : 'opacity-100'}"
        >
            {#if node.data.description || (node.data.inputs && node.data.inputs.length > 0) || (node.data.outputs && node.data.outputs.length > 0) || node.type === "condition"}
                <div class="p-4 space-y-3">
                    {#if node.data.description}
                        <p class="text-xs text-slate-500 dark:text-slate-400">
                            {node.data.description}
                        </p>
                    {/if}

                    {#if node.data.inputs}
                        <div
                            class="text-[10px] text-slate-400 flex flex-wrap gap-1"
                        >
                            In: {node.data.inputs.join(", ")}
                        </div>
                    {/if}

                    <!-- Outputs -->
                    <div class="flex flex-col gap-2 relative">
                        {#each node.data.outputs || [] as output, i (output)}
                            <div
                                class="relative flex items-center justify-end group/port"
                            >
                                {#if node.type === "router"}
                                    <button
                                        class="absolute right-full mr-2 p-0.5 text-slate-400 hover:text-red-500 opacity-0 group-hover/port:opacity-100 transition-opacity"
                                        onclick={(e) => {
                                            e.stopPropagation();
                                            const newOutputs = [
                                                ...(node.data.outputs || []),
                                            ];
                                            newOutputs.splice(i, 1);
                                            node.data.outputs = newOutputs;
                                        }}
                                        aria-label="Remove port"
                                    >
                                        <Trash2 class="w-3 h-3" />
                                    </button>
                                {/if}
                                <span
                                    class="text-xs text-slate-500 dark:text-slate-400 mr-2"
                                    >{output}</span
                                >
                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                <div
                                    class="absolute right-[-14px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-500 border border-white dark:border-slate-800 hover:bg-blue-500 hover:scale-125 transition-all cursor-crosshair z-10 group"
                                    title="Output"
                                    onmousedown={(e) =>
                                        handleHandleMouseDown(e, "output")}
                                    onmouseup={(e) =>
                                        handleHandleMouseUp(e, "output")}
                                >
                                    <div
                                        class="absolute -inset-3 bg-transparent rounded-full z-0"
                                    ></div>
                                </div>
                            </div>
                        {/each}

                        {#if node.type === "router" && !node.data?.locked}
                            <button
                                class="mt-1 flex items-center justify-center gap-1 text-[10px] text-slate-400 hover:text-blue-500 border border-dashed border-slate-300 dark:border-slate-600 rounded px-1 py-0.5 w-full transition-colors"
                                onclick={(e) => {
                                    e.stopPropagation();
                                    const existing = node.data.outputs || [];
                                    let idx = 1;
                                    let name = `option_${idx}`;
                                    while (existing.includes(name)) {
                                        idx++;
                                        name = `option_${idx}`;
                                    }
                                    node.data.outputs = [...existing, name];
                                }}
                            >
                                <Plus class="w-3 h-3" />
                                <span>Add Route</span>
                            </button>
                        {/if}
                    </div>
                </div>
            {/if}
        </div>
        <!-- Standard Handles for Normal Nodes -->
        {#if !["start", "group", "note", "listen"].includes(node.type)}
            <!-- Input Handle -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 border border-white dark:border-slate-800 hover:bg-blue-500 hover:scale-125 transition-all cursor-crosshair z-10 group {node
                    .data?.locked
                    ? 'pointer-events-none opacity-0'
                    : ''}"
                title="Input"
                role="button"
                tabindex="0"
                onmousedown={(e) => handleHandleMouseDown(e, "input")}
                onmouseup={(e) => handleHandleMouseUp(e, "input")}
            >
                <div
                    class="absolute -inset-3 bg-transparent rounded-full z-0"
                ></div>
                <!-- ENHANCEMENT 8: Connection Status Indicator -->
                <div
                    class="absolute {getStatusDotPosition(true)} w-2 h-2 rounded-full {getStatusColor(inputConnectionStatus)} border border-white dark:border-slate-800 z-20 shadow-sm"
                    title={inputConnectionStatus === "none" ? "未连接" : inputConnectionStatus === "connected" ? "已连接" : inputConnectionStatus === "warning" ? "多条连接" : "连接错误"}
                ></div>
            </div>
        {/if}

        {#if !["end", "group", "note", "broadcast"].includes(node.type) && (!node.data.outputs || node.data.outputs.length === 0)}
            <!-- Output Handle (Default if no named outputs) -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 border border-white dark:border-slate-800 hover:bg-blue-500 hover:scale-125 transition-all cursor-crosshair z-10 group"
                title="Output"
                role="button"
                tabindex="0"
                onmousedown={(e) => handleHandleMouseDown(e, "output")}
                onmouseup={(e) => handleHandleMouseUp(e, "output")}
                oncontextmenu={(e) => { e.preventDefault(); e.stopPropagation(); onHandleContextMenu(node.id, "output", e.clientX, e.clientY); }}
            >
                <div
                    class="absolute -inset-3 bg-transparent rounded-full z-0"
                ></div>
                <!-- ENHANCEMENT 8: Connection Status Indicator -->
                <div
                    class="absolute {getStatusDotPosition(false)} w-2 h-2 rounded-full {getStatusColor(outputConnectionStatus)} border border-white dark:border-slate-800 z-20 shadow-sm"
                    title={outputConnectionStatus === "none" ? "未连接" : outputConnectionStatus === "connected" ? "已连接" : outputConnectionStatus === "warning" ? "多条连接" : "连接错误"}
                ></div>
                <!-- Execution State Indicator -->
                {#if node.executionState === "running"}
                    <div
                        class="absolute inset-0 rounded-xl border-2 border-amber-400 animate-pulse pointer-events-none z-40"
                    ></div>
                {/if}
            </div>
        {/if}

        <!-- Start Node Actions -->
        {#if node.type === "start"}
            <div class="px-4 pb-3">
                <button
                    class="w-full py-1 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors flex items-center justify-center gap-1"
                    onclick={(e) => {
                        e.stopPropagation();
                        onAction("inject_data", node.id);
                    }}
                >
                    <Icon class="w-3 h-3" />
                    Inject Mock Data
                </button>
            </div>
        {/if}

        <!-- Router: Add Port Button -->
        {#if node.type === "router"}
            <div class="px-4 pb-3">
                <button
                    class="w-full py-1 text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors dashed-border"
                    onclick={addPort}
                >
                    + Add Route
                </button>
            </div>
        {/if}

        <!-- Condition Builder -->
        {#if node.type === "condition"}
            <div class="px-3 pb-3 space-y-2">
                <div class="flex items-center gap-1">
                    <!-- Variable -->
                    <button
                        class="flex-1 text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-left truncate text-slate-600 dark:text-slate-300"
                        onclick={(e) => openVarPicker(e, "variable")}
                    >
                        {node.data.condition?.variable || "Select Var..."}
                    </button>
                </div>
                <div class="flex items-center gap-1">
                    <!-- Operator -->
                    <select
                        class="text-xs bg-slate-100 dark:bg-slate-800 border-none rounded py-1 px-1 w-12 text-center"
                        bind:value={node.data.condition!.operator}
                        onclick={(e) => e.stopPropagation()}
                        onmousedown={(e) => e.stopPropagation()}
                    >
                        <option value="==">==</option>
                        <option value="!=">!=</option>
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                        <option value="contains">Has</option>
                    </select>
                    <!-- Value -->
                    <div class="flex-1 flex items-center gap-1 relative">
                        <input
                            type="text"
                            class="flex-1 text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded w-full min-w-0"
                            placeholder="Value"
                            bind:value={node.data.condition!.value}
                            onclick={(e) => e.stopPropagation()}
                            onmousedown={(e) => e.stopPropagation()}
                        />
                        <button
                            class="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400"
                            onclick={(e) => openVarPicker(e, "value")}
                            title="Pick Variable"
                        >
                            <span class="font-mono text-[10px]"
                                >&lcub;&rcub;</span
                            >
                        </button>
                    </div>
                </div>
            </div>
        {/if}
    {/if}

    <!-- Handles -->

    <!-- Input Handle (Left) -->
    {#if node.type !== "start"}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white dark:border-slate-800 hover:bg-blue-500 hover:scale-125 transition-all cursor-crosshair z-10 group {selected ? 'bg-blue-500 ring-2 ring-blue-300 dark:ring-blue-600 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}"
            title="Input - Drag to connect or right-click for options"
            role="button"
            tabindex="0"
            onmousedown={(e) => handleHandleMouseDown(e, "input")}
            onmouseup={(e) => handleHandleMouseUp(e, "input")}
            oncontextmenu={(e) => { e.preventDefault(); e.stopPropagation(); onHandleContextMenu(node.id, "input", e.clientX, e.clientY); }}
        >
            <!-- ENHANCEMENT 5: Quick Connect - Show type label when selected -->
            {#if selected}
                <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-slate-400 whitespace-nowrap bg-white dark:bg-slate-800 px-1 rounded shadow pointer-events-none">
                    Input
                </div>
            {/if}
            <!-- Increased Hit Area -->
            <div
                class="absolute -inset-3 bg-transparent rounded-full z-0"
            ></div>
        </div>
    {/if}

    <!-- Output Handle (Right) -->
    {#if node.type !== "end"}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white dark:border-slate-800 hover:bg-blue-500 hover:scale-125 transition-all cursor-crosshair z-10 group {selected ? 'bg-blue-500 ring-2 ring-blue-300 dark:ring-blue-600 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}"
            title="Output - Drag to connect or right-click for options"
            role="button"
            tabindex="0"
            onmousedown={(e) => handleHandleMouseDown(e, "output")}
            onmouseup={(e) => handleHandleMouseUp(e, "output")}
            oncontextmenu={(e) => { e.preventDefault(); e.stopPropagation(); onHandleContextMenu(node.id, "output", e.clientX, e.clientY); }}
        >
            <!-- ENHANCEMENT 5: Quick Connect - Show type label when selected -->
            {#if selected}
                <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-slate-400 whitespace-nowrap bg-white dark:bg-slate-800 px-1 rounded shadow pointer-events-none">
                    Output
                </div>
            {/if}
            <!-- Increased Hit Area -->
            <div
                class="absolute -inset-3 bg-transparent rounded-full z-0"
            ></div>
            <!-- Breakpoint Indicator -->
            {#if node.isBreakpoint}
                <div
                    class="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-500 border-2 border-white dark:border-slate-900 shadow-sm z-50 animate-pulse"
                ></div>
            {/if}

            <!-- Execution State Indicator -->
            {#if node.executionState === "running"}
                <div
                    class="absolute inset-0 rounded-xl border-2 border-amber-400 animate-pulse pointer-events-none z-40"
                ></div>
            {/if}

            <!-- Error Handle (Bottom) -->
            {#if node.data.onError}
                <div
                    class="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-400 dark:bg-red-600 border border-white dark:border-slate-800 hover:bg-red-500 hover:scale-125 transition-all cursor-crosshair z-10 group"
                    title="Error Path"
                    role="button"
                    tabindex="0"
                    onmousedown={(e) => handleHandleMouseDown(e, "output")}
                    onmouseup={(e) => handleHandleMouseUp(e, "output")}
                    oncontextmenu={(e) => { e.preventDefault(); e.stopPropagation(); onHandleContextMenu(node.id, "output", e.clientX, e.clientY); }}
                >
                    <div
                        class="absolute -inset-3 bg-transparent rounded-full z-0"
                    ></div>
                </div>
            {/if}

            {#if node.executionState === "waiting"}
                <div
                    class="absolute inset-0 rounded-xl border-2 border-amber-400/50 pointer-events-none z-40"
                ></div>
            {:else if node.executionState === "completed"}
                <div
                    class="absolute inset-0 rounded-xl border-2 border-green-500 pointer-events-none z-40"
                ></div>
            {:else if node.executionState === "error"}
                <div
                    class="absolute inset-0 rounded-xl border-2 border-red-500 pointer-events-none z-40"
                ></div>
            {/if}
        </div>
    {/if}
</div>
