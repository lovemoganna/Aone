<script lang="ts">
    // @ts-nocheck
    // Force rebuild 3
    import { onMount, tick } from "svelte";
    import { Users, Zap, GitBranch, Navigation, Square } from "lucide-svelte";
    import FlowCanvas from "./FlowCanvas.svelte";
    import FlowNode from "./FlowNode.svelte";
    import FlowEdge from "./FlowEdge.svelte";
    import FlowSearch from "./FlowSearch.svelte";
    import FlowMinimap from "./FlowMinimap.svelte";
    import FlowContextMenu from "./FlowContextMenu.svelte";
    import FlowDebugToolbar from "./FlowDebugToolbar.svelte";
    import FlowShortcuts from "./FlowShortcuts.svelte";
    import { historyStore } from "$lib/stores/historyStore.svelte";
    import type {
        FlowNode as FlowNodeType,
        FlowEdge as FlowEdgeType,
        Viewport,
        NodeType,
    } from "./types";
    import { LayoutService } from "$lib/services/LayoutService";
    import FlowToolbar from "./FlowToolbar.svelte";
    import FlowToast from "./FlowToast.svelte";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import FlowTracePanel from "./FlowTracePanel.svelte";
    import FlowAssetHub from "./FlowAssetHub.svelte";
    import FlowGlobalVariables from "./FlowGlobalVariables.svelte";
    import FlowVersionHistory from "./FlowVersionHistory.svelte";
    import FlowValidationPanel from "./FlowValidationPanel.svelte";
    import FlowEdgeProperties from "./FlowEdgeProperties.svelte";
    import { saveSnapshot, type FlowSnapshot } from "$lib/utils/idb";
    import {
        downloadFlowAsFile,
        importFlow,
        readFileAsText,
    } from "./flowImportExport";

    let {
        nodes = $bindable([]),
        edges = $bindable([]),
        readOnly = false,
        onNodeSelect = (id: string | null) => {},
        onEdgeCreate = (source: string, target: string) => {},
        selectedNodeIds = $bindable(new Set()),
        onCanvasDoubleClick = (
            pos: { x: number; y: number },
            e: MouseEvent,
        ) => {},
        onConnectionDrop = (
            sourceId: string,
            handleType: "input" | "output",
            pos: { x: number; y: number },
            e: MouseEvent,
        ) => {},
        gridType = "dots",
        gridColor = "#64748b",
        // ENHANCEMENT: Highlight executing node
        executingNodeId = null,
    } = $props<{
        nodes: FlowNodeType[];
        edges: FlowEdgeType[];
        readOnly?: boolean;
        onNodeSelect?: (id: string | null) => void;
        onEdgeCreate?: (source: string, target: string) => void;
        selectedNodeIds?: Set<string>;
        onCanvasDoubleClick?: (
            pos: { x: number; y: number },
            e: MouseEvent,
        ) => void;
        onConnectionDrop?: (
            sourceId: string,
            handleType: "input" | "output",
            pos: { x: number; y: number },
            e: MouseEvent,
        ) => void;
        gridType?: "dots" | "lines"; // New
        gridColor?: string; // New
        executingNodeId?: string | null; // Highlight executing node
    }>();

    let viewport = $state<Viewport>({ x: 0, y: 0, zoom: 1 });
    let selectedEdgeId = $state<string | null>(null);
    let editorContainer: HTMLDivElement | undefined = $state();
    let editorDims = $state({ w: 0, h: 0 });

    // Drag Snapshot for Undo/Redo
    let dragSnapshot = new Map<string, { x: number; y: number }>();
    let dragStartMouse = { x: 0, y: 0 };
    let alignmentLines = $state<
        { x1: number; y1: number; x2: number; y2: number }[]
    >([]);

    // Connection State
    let connectingNodeId = $state<string | null>(null);
    let connectingHandleType = $state<"input" | "output" | null>(null);
    let connectionMousePos = $state<{ x: number; y: number } | null>(null);

    // ENHANCEMENT 1: Smart Connection - Snapping & Validation
    let snapTarget = $state<{
        nodeId: string;
        handleType: "input" | "output";
        x: number;
        y: number;
    } | null>(null);
    let connectionValid = $state<boolean>(true);
    let connectionWarning = $state<string>("");
    const SNAP_THRESHOLD = 80; // pixels - increased for better magnetic snap feel

    // ENHANCEMENT 3: One-Click Connection Mode
    let isConnectMode = $state<boolean>(false);
    let connectModeSource = $state<{
        nodeId: string;
        handleType: "input" | "output";
    } | null>(null);

    // ENHANCEMENT 14: Smart Connection Suggestions
    let showConnectionSuggestions = $state<boolean>(false);
    let connectionSuggestions = $state<
        { nodeId: string; label: string; reason: string }[]
    >([]);

    // P1-6: Node Copy/Paste
    let copiedNodes = $state<FlowNodeType[]>([]);
    let copiedEdges = $state<FlowEdgeType[]>([]);

    // Copy selected nodes
    function copyNodes() {
        if (selectedNodeIds.size === 0) return;

        copiedNodes = nodes.filter((n: FlowNodeType) =>
            selectedNodeIds.has(n.id),
        );

        // Copy edges that are fully within selected nodes
        const nodeIds = new Set(copiedNodes.map((n) => n.id));
        copiedEdges = edges.filter(
            (e: FlowEdgeType) => nodeIds.has(e.source) && nodeIds.has(e.target),
        );
    }

    // Paste copied nodes
    function pasteNodes() {
        if (copiedNodes.length === 0) return;

        const idMap = new Map<string, string>();
        const offset = 50; // Offset for pasted nodes

        // Create new nodes with new IDs
        const newNodes = copiedNodes.map((n: FlowNodeType) => {
            const newId = `${n.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            idMap.set(n.id, newId);
            return {
                ...n,
                id: newId,
                position: {
                    x: n.position.x + offset,
                    y: n.position.y + offset,
                },
                selected: true,
            };
        });

        // Create new edges with updated references
        const newEdges = copiedEdges.map((e: FlowEdgeType) => ({
            ...e,
            id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            source: idMap.get(e.source) || e.source,
            target: idMap.get(e.target) || e.target,
        }));

        // Add to nodes array
        nodes = [...nodes, ...newNodes];
        edges = [...edges, ...newEdges];

        // Select the pasted nodes
        selectedNodeIds.clear();
        newNodes.forEach((n) => selectedNodeIds.add(n.id));

        // Add to history
        historyStore.push({
            execute: () => {
                nodes = [...nodes, ...newNodes];
                edges = [...edges, ...newEdges];
                newNodes.forEach((n) => selectedNodeIds.add(n.id));
            },
            undo: () => {
                const newNodeIds = new Set(newNodes.map((n) => n.id));
                nodes = nodes.filter(
                    (n: FlowNodeType) => !newNodeIds.has(n.id),
                );
                const newEdgeIds = new Set(newEdges.map((e) => e.id));
                edges = edges.filter(
                    (e: FlowEdgeType) => !newEdgeIds.has(e.id),
                );
                selectedNodeIds.clear();
            },
        });
    }

    // Get connection suggestions for selected node
    function getConnectionSuggestions(
        nodeId: string,
    ): { nodeId: string; label: string; reason: string }[] {
        const node = nodes.find((n: FlowNodeType) => n.id === nodeId);
        if (!node) return [];

        const suggestions: { nodeId: string; label: string; reason: string }[] =
            [];
        const connectedTargetIds = new Set(
            edges
                .filter((e: FlowEdgeType) => e.source === nodeId)
                .map((e: FlowEdgeType) => e.target),
        );
        const connectedSourceIds = new Set(
            edges
                .filter((e: FlowEdgeType) => e.target === nodeId)
                .map((e: FlowEdgeType) => e.source),
        );

        for (const otherNode of nodes) {
            if (otherNode.id === nodeId) continue;

            // Check if already connected
            if (
                connectedTargetIds.has(otherNode.id) ||
                connectedSourceIds.has(otherNode.id)
            )
                continue;

            // Check compatibility
            const validation = validateConnection(node.type, otherNode.type);
            if (validation.valid) {
                // This node can be connected
                if (
                    node.type === "start" ||
                    !connectedTargetIds.has(otherNode.id)
                ) {
                    suggestions.push({
                        nodeId: otherNode.id,
                        label: otherNode.data?.label || otherNode.type,
                        reason: "可连接",
                    });
                }
            }
        }

        return suggestions.slice(0, 5); // Limit to 5 suggestions
    }

    // Update suggestions when selection changes
    $effect(() => {
        if (selectedNodeIds.size === 1) {
            const nodeId = Array.from(selectedNodeIds)[0];
            connectionSuggestions = getConnectionSuggestions(nodeId);
        } else {
            connectionSuggestions = [];
        }
    });

    // ENHANCEMENT 1: Keyboard Navigation Connection Mode
    let isNavConnectMode = $state<boolean>(false);
    let navConnectSource = $state<string | null>(null);
    let navConnectTarget = $state<string | null>(null);

    // Node type compatibility matrix for validation
    // Allow all connections by default (permissive mode)
    const NODE_COMPATIBILITY: Record<string, string[]> = {
        agent: ["skill", "router", "condition", "end", "parallel", "switch"],
        skill: ["agent", "router", "condition", "end", "parallel", "switch"],
        router: ["agent", "skill", "condition", "end", "parallel"],
        condition: ["agent", "skill", "end", "parallel"],
        parallel: ["agent", "skill", "condition", "end"],
        start: ["agent", "skill", "router", "parallel", "condition"],
        end: [],
        note: [], // Notes don't connect
        broadcast: [], // Use virtual edges, not physical
        listen: ["agent", "skill", "router", "condition"],
        switch: ["agent", "skill", "condition", "end"],
        group: ["agent", "skill", "router", "condition", "end", "parallel"],
        loop: ["agent", "skill", "router", "condition", "end", "parallel"],
    };

    // Check if connection is valid between two node types
    function validateConnection(
        sourceType: string,
        targetType: string,
    ): { valid: boolean; warning: string } {
        const compatible = NODE_COMPATIBILITY[sourceType] || [];
        if (compatible.includes(targetType)) {
            return { valid: true, warning: "" };
        }
        // Special case: allow self-connection warning
        if (sourceType === targetType) {
            return { valid: false, warning: "Cannot connect node to itself" };
        }
        return {
            valid: false,
            warning: `Incompatible: ${sourceType} → ${targetType}`,
        };
    }

    // ENHANCEMENT 9: Detect cycle in graph using DFS
    function detectCycle(
        sourceId: string,
        targetId: string,
    ): { hasCycle: boolean; cyclePath: string[] } {
        // Build adjacency list from existing edges + new potential edge
        const adjacency = new Map<string, string[]>();

        // Add existing edges
        for (const edge of edges) {
            if (!adjacency.has(edge.source)) {
                adjacency.set(edge.source, []);
            }
            adjacency.get(edge.source)!.push(edge.target);
        }

        // Add the new potential edge
        if (!adjacency.has(sourceId)) {
            adjacency.set(sourceId, []);
        }
        adjacency.get(sourceId)!.push(targetId);

        // DFS to detect cycle
        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        const path: string[] = [];

        function dfs(nodeId: string): boolean {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            path.push(nodeId);

            const neighbors = adjacency.get(nodeId) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    if (dfs(neighbor)) {
                        return true;
                    }
                } else if (recursionStack.has(neighbor)) {
                    // Found a cycle
                    const cycleStart = path.indexOf(neighbor);
                    const cyclePath = path.slice(cycleStart);
                    cyclePath.push(neighbor); // Complete the cycle
                    return true;
                }
            }

            path.pop();
            recursionStack.delete(nodeId);
            return false;
        }

        // Check from all nodes
        for (const nodeId of nodes.map((n) => n.id)) {
            if (!visited.has(nodeId)) {
                path.length = 0;
                if (dfs(nodeId)) {
                    return { hasCycle: true, cyclePath: [...path] };
                }
            }
        }

        return { hasCycle: false, cyclePath: [] };
    }

    // ENHANCEMENT 9: Check if new connection would create cycle
    function checkConnectionCycle(
        sourceId: string,
        targetId: string,
    ): { hasCycle: boolean; message: string } {
        // Only check reverse: would connecting create a path from target back to source?
        // That's what creates a cycle in a directed graph
        const reverseReachable = new Set<string>();
        const reverseQueue = [targetId];

        while (reverseQueue.length > 0) {
            const current = reverseQueue.shift()!;
            if (current === sourceId) {
                return {
                    hasCycle: true,
                    message: "连接会形成循环: 源节点已可到达目标节点",
                };
            }
            if (!reverseReachable.has(current)) {
                reverseReachable.add(current);
                const outgoing = edges.filter((e) => e.source === current);
                for (const edge of outgoing) {
                    reverseQueue.push(edge.target);
                }
            }
        }

        return { hasCycle: false, message: "" };
    }

    // ENHANCEMENT 2: Calculate step path for connection preview
    function calculateStepPath(
        sourcePos: { x: number; y: number },
        sourceDims: { width: number; height: number },
        targetPos: { x: number; y: number },
        targetDims: { width: number; height: number },
    ): string {
        const sx = sourcePos.x + sourceDims.width;
        const sy = sourcePos.y + sourceDims.height / 2;
        const tx = targetPos.x;
        const ty = targetPos.y + targetDims.height / 2;

        const borderRadius = 8;
        const gap = 30;

        let points: { x: number; y: number }[] = [];
        points.push({ x: sx, y: sy });

        const srcRight = sx + gap;
        const tgtLeft = tx - gap;

        if (tgtLeft > srcRight) {
            const midX = (srcRight + tgtLeft) / 2;
            points.push({ x: midX, y: sy });
            points.push({ x: midX, y: ty });
            points.push({ x: tx, y: ty });
        } else {
            const verticalGap = 40;
            const midY =
                ty > sy
                    ? Math.max(
                          sy + sourceDims.height / 2,
                          ty + targetDims.height / 2,
                      ) + verticalGap
                    : Math.min(
                          sy - sourceDims.height / 2,
                          ty - targetDims.height / 2,
                      ) - verticalGap;

            points.push({ x: srcRight, y: sy });
            points.push({ x: srcRight, y: midY });
            points.push({ x: tgtLeft, y: midY });
            points.push({ x: tgtLeft, y: ty });
            points.push({ x: tx, y: ty });
        }

        if (points.length < 2) return `M ${sx} ${sy}`;

        let res = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const curr = points[i];
            if (i === points.length - 1) {
                res += ` L ${curr.x} ${curr.y}`;
                break;
            }
            const prev = points[i - 1];
            const next = points[i + 1];

            const dx1 = curr.x - prev.x;
            const dy1 = curr.y - prev.y;
            const dx2 = next.x - curr.x;
            const dy2 = next.y - curr.y;

            const seg1Len = Math.sqrt(dx1 * dx1 + dy1 * dy1);
            const seg2Len = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            const r = Math.min(borderRadius, seg1Len / 2, seg2Len / 2);

            if (r === 0) {
                res += ` L ${curr.x} ${curr.y}`;
                continue;
            }

            const p1x = curr.x - (dx1 === 0 ? 0 : (dx1 / Math.abs(dx1)) * r);
            const p1y = curr.y - (dy1 === 0 ? 0 : (dy1 / Math.abs(dy1)) * r);
            const p2x = curr.x + (dx2 === 0 ? 0 : (dx2 / Math.abs(dx2)) * r);
            const p2y = curr.y + (dy2 === 0 ? 0 : (dy2 / Math.abs(dy2)) * r);

            res += ` L ${p1x} ${p1y}`;
            const crossProduct = dx1 * dy2 - dy1 * dx2;
            const sweepFlag = crossProduct > 0 ? 1 : 0;
            res += ` A ${r} ${r} 0 0 ${sweepFlag} ${p2x} ${p2y}`;
        }
        return res;
    }

    // ENHANCEMENT 4: Get all valid connection targets
    let validConnectionTargets = $derived.by(() => {
        if (!connectingNodeId) return [];
        const sourceNode = nodes.find((n) => n.id === connectingNodeId);
        if (!sourceNode) return [];

        const validTargets: { nodeId: string; x: number; y: number }[] = [];

        for (const node of nodes) {
            if (node.id === connectingNodeId) continue;
            if (node.type === "group" || node.type === "loop") continue;

            const nodeW =
                node.data?.style?.width || (node.type === "group" ? 400 : 256);
            const nodeH =
                node.data?.style?.height || (node.type === "group" ? 300 : 100);

            // Check if target accepts input (input handle on left)
            const inputX = node.position.x;
            const inputY = node.position.y + nodeH / 2;

            const validation = validateConnection(sourceNode.type, node.type);
            if (validation.valid) {
                validTargets.push({ nodeId: node.id, x: inputX, y: inputY });
            }
        }

        return validTargets;
    });

    // Find nearest snap target handle
    // ENHANCEMENT 15: Enhanced snap detection - also detect if mouse is near node body
    function findSnapTarget(mousePos: {
        x: number;
        y: number;
    }): typeof snapTarget {
        if (!connectingNodeId) return null;

        const sourceNode = nodes.find((n) => n.id === connectingNodeId);
        if (!sourceNode) return null;

        let closestTarget: typeof snapTarget = null;
        let closestDist = SNAP_THRESHOLD;

        for (const node of nodes) {
            if (node.id === connectingNodeId) continue;
            if (node.type === "group" || node.type === "loop") continue;

            // Calculate handle positions
            const nodeW =
                node.data?.style?.width || (node.type === "group" ? 400 : 256);
            const nodeH =
                node.data?.style?.height || (node.type === "group" ? 300 : 100);

            // ENHANCEMENT 15: Check if mouse is within node bounds (with padding)
            const padding = 20;
            const nodeLeft = node.position.x - padding;
            const nodeRight = node.position.x + nodeW + padding;
            const nodeTop = node.position.y - padding;
            const nodeBottom = node.position.y + nodeH + padding;

            const isNearNode =
                mousePos.x >= nodeLeft &&
                mousePos.x <= nodeRight &&
                mousePos.y >= nodeTop &&
                mousePos.y <= nodeBottom;

            // Input handle (left side)
            const inputX = node.position.x;
            const inputY = node.position.y + nodeH / 2;
            const inputDist = Math.sqrt(
                (mousePos.x - inputX) ** 2 + (mousePos.y - inputY) ** 2,
            );

            // ENHANCEMENT 15: If near node body but not close to handle, snap to nearest edge
            if (isNearNode && connectingHandleType === "output") {
                // Find closest point on node left edge
                const closestY = Math.max(
                    node.position.y,
                    Math.min(mousePos.y, node.position.y + nodeH),
                );
                const distToInputEdge = Math.sqrt(
                    (mousePos.x - node.position.x) ** 2 +
                        (mousePos.y - closestY) ** 2,
                );
                if (distToInputEdge < closestDist) {
                    closestDist = distToInputEdge;
                    closestTarget = {
                        nodeId: node.id,
                        handleType: "input",
                        x: inputX,
                        y: closestY,
                    };
                }
            }

            if (inputDist < closestDist && connectingHandleType === "output") {
                closestDist = inputDist;
                closestTarget = {
                    nodeId: node.id,
                    handleType: "input",
                    x: inputX,
                    y: inputY,
                };
            }

            // Output handle (right side)
            const outputX = node.position.x + nodeW;
            const outputY = node.position.y + nodeH / 2;
            const outputDist = Math.sqrt(
                (mousePos.x - outputX) ** 2 + (mousePos.y - outputY) ** 2,
            );

            // ENHANCEMENT 15: If near node body but not close to handle, snap to nearest edge
            if (isNearNode && connectingHandleType === "input") {
                // Find closest point on node right edge
                const closestY = Math.max(
                    node.position.y,
                    Math.min(mousePos.y, node.position.y + nodeH),
                );
                const distToOutputEdge = Math.sqrt(
                    (mousePos.x - (node.position.x + nodeW)) ** 2 +
                        (mousePos.y - closestY) ** 2,
                );
                if (distToOutputEdge < closestDist) {
                    closestDist = distToOutputEdge;
                    closestTarget = {
                        nodeId: node.id,
                        handleType: "output",
                        x: outputX,
                        y: closestY,
                    };
                }
            }

            if (outputDist < closestDist && connectingHandleType === "input") {
                closestDist = outputDist;
                closestTarget = {
                    nodeId: node.id,
                    handleType: "output",
                    x: outputX,
                    y: outputY,
                };
            }
        }

        return closestTarget;
    }

    // --- Auto Layout ---
    function handleAutoLayout(direction: "TB" | "LR" = "LR") {
        const { nodes: layoutedNodes, edges: layoutedEdges } =
            LayoutService.calculateLayout(nodes, edges, { direction });

        // Push to history
        const oldNodes = JSON.parse(JSON.stringify(nodes));
        historyStore.push({
            execute: () => {
                nodes = layoutedNodes;
            },
            undo: () => {
                nodes = oldNodes;
            },
        });

        nodes = layoutedNodes;

        // Fit view after layout? Maybe not strictly necessary but helpful
        // fitView(); // we don't have fitView yet, maybe add later
    }

    // ENHANCEMENT 2: Beautify all edge paths
    function handleBeautifyEdges() {
        // Convert all edges to step type for cleaner orthogonal routing
        const oldEdges = JSON.parse(JSON.stringify(edges));

        const beautifiedEdges = edges.map((edge: FlowEdgeType) => ({
            ...edge,
            type: "step" as const, // Use step routing for cleaner look
        }));

        historyStore.push({
            execute: () => {
                edges = beautifiedEdges;
            },
            undo: () => {
                edges = oldEdges;
            },
        });

        edges = beautifiedEdges;
    }

    // --- Import/Export ---
    function handleExport() {
        downloadFlowAsFile(nodes, edges, "workflow.json");
        toastStore.success("工作流已导出");
    }

    async function handleImport() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            try {
                const text = await readFileAsText(file);
                const result = importFlow(text);
                if (result.success && result.data) {
                    const oldNodes = [...nodes];
                    const oldEdges = [...edges];
                    nodes = result.data.nodes;
                    edges = result.data.edges;
                    historyStore.push({
                        execute: () => {
                            nodes = result.data!.nodes;
                            edges = result.data!.edges;
                        },
                        undo: () => {
                            nodes = oldNodes;
                            edges = oldEdges;
                        },
                    });
                    toastStore.success(
                        `已导入 ${result.data.nodes.length} 个节点和 ${result.data.edges.length} 条边`,
                    );
                } else {
                    toastStore.error(result.error || "导入失败");
                }
            } catch (err) {
                toastStore.error("文件读取失败");
            }
        };
        input.click();
    }

    // --- Search & Navigation ---
    let isSearchOpen = $state(false);
    let isBatchEditOpen = $state(false);

    // P1-8: Batch edit state
    let batchEditColor = $state<string | null>(null);
    let batchEditPrefix = $state<string | null>(null);

    function handleSearchOpen() {
        isSearchOpen = true;
    }

    function handleSearchClose() {
        isSearchOpen = false;
    }

    function handleSearchSelect(id: string) {
        // Select node
        selectedNodeIds.clear();
        selectedNodeIds.add(id);
        onNodeSelect(id);

        // Zoom to node
        const node = nodes.find((n: FlowNodeType) => n.id === id);
        if (node && editorDims.w > 0 && editorDims.h > 0) {
            const w =
                node.data?.style?.width || (node.type === "group" ? 400 : 256);
            const h =
                node.data?.style?.height || (node.type === "group" ? 300 : 100);

            const centerX = node.position.x + w / 2;
            const centerY = node.position.y + h / 2;

            // Target center of viewport
            const zoom = 1.2; // Zoom in a bit
            const x = editorDims.w / 2 - centerX * zoom;
            const y = editorDims.h / 2 - centerY * zoom;

            viewport = { x, y, zoom };
        }
    }

    // --- Alignment & Distribution ---
    function handleAlign(
        align: "left" | "center" | "right" | "top" | "middle" | "bottom",
    ) {
        if (selectedNodeIds.size < 2) return;

        const selected = nodes.filter((n: FlowNodeType) =>
            selectedNodeIds.has(n.id),
        );
        if (selected.length < 2) return;

        // Calculate bounds of selection
        let minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity;
        selected.forEach((n: FlowNodeType) => {
            const w = n.data?.style?.width || (n.type === "group" ? 400 : 256);
            const h = n.data?.style?.height || (n.type === "group" ? 300 : 100);
            minX = Math.min(minX, n.position.x);
            maxX = Math.max(maxX, n.position.x + w);
            minY = Math.min(minY, n.position.y);
            maxY = Math.max(maxY, n.position.y + h);
        });

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const oldNodes = JSON.parse(JSON.stringify(nodes));

        nodes = nodes.map((n: FlowNodeType) => {
            if (!selectedNodeIds.has(n.id)) return n;
            const w = n.data?.style?.width || (n.type === "group" ? 400 : 256);
            const h = n.data?.style?.height || (n.type === "group" ? 300 : 100);

            let newX = n.position.x;
            let newY = n.position.y;

            switch (align) {
                case "left":
                    newX = minX;
                    break;
                case "center":
                    newX = centerX - w / 2;
                    break;
                case "right":
                    newX = maxX - w;
                    break;
                case "top":
                    newY = minY;
                    break;
                case "middle":
                    newY = centerY - h / 2;
                    break;
                case "bottom":
                    newY = maxY - h;
                    break;
            }

            return {
                ...n,
                position: { x: newX, y: newY },
            };
        });

        historyStore.push({
            execute: () => {
                /* re-apply logic or store state */
            },
            undo: () => {
                nodes = oldNodes;
            },
        });
    }

    // ENHANCEMENT 7: Distribute nodes evenly
    function handleDistribute(direction: "horizontal" | "vertical") {
        if (selectedNodeIds.size < 3) return;

        const selected = nodes.filter((n: FlowNodeType) =>
            selectedNodeIds.has(n.id),
        );
        if (selected.length < 3) return;

        const oldNodes = JSON.parse(JSON.stringify(nodes));

        if (direction === "horizontal") {
            // Sort by X position
            selected.sort((a, b) => a.position.x - b.position.x);

            const first = selected[0];
            const last = selected[selected.length - 1];
            const firstW =
                first.data?.style?.width ||
                (first.type === "group" ? 400 : 256);
            const lastW =
                last.data?.style?.width || (last.type === "group" ? 400 : 256);

            const totalWidth = selected.reduce((sum, n) => {
                const w =
                    n.data?.style?.width || (n.type === "group" ? 400 : 256);
                return sum + w;
            }, 0);

            const space =
                last.position.x + lastW - first.position.x - totalWidth;
            const gap = space / (selected.length - 1);

            let currentX = first.position.x;
            for (const node of selected) {
                const w =
                    node.data?.style?.width ||
                    (node.type === "group" ? 400 : 256);
                const h =
                    node.data?.style?.height ||
                    (node.type === "group" ? 300 : 100);

                nodes = nodes.map((n: FlowNodeType) => {
                    if (n.id === node.id) {
                        return {
                            ...n,
                            position: { x: currentX, y: n.position.y },
                        };
                    }
                    return n;
                });

                currentX += w + gap;
            }
        } else {
            // Sort by Y position
            selected.sort((a, b) => a.position.y - b.position.y);

            const first = selected[0];
            const last = selected[selected.length - 1];
            const firstH =
                first.data?.style?.height ||
                (first.type === "group" ? 300 : 100);
            const lastH =
                last.data?.style?.height || (last.type === "group" ? 300 : 100);

            const totalHeight = selected.reduce((sum, n) => {
                const h =
                    n.data?.style?.height || (n.type === "group" ? 300 : 100);
                return sum + h;
            }, 0);

            const space =
                last.position.y + lastH - first.position.y - totalHeight;
            const gap = space / (selected.length - 1);

            let currentY = first.position.y;
            for (const node of selected) {
                const w =
                    node.data?.style?.width ||
                    (node.type === "group" ? 400 : 256);
                const h =
                    node.data?.style?.height ||
                    (node.type === "group" ? 300 : 100);

                nodes = nodes.map((n: FlowNodeType) => {
                    if (n.id === node.id) {
                        return {
                            ...n,
                            position: { x: n.position.x, y: currentY },
                        };
                    }
                    return n;
                });

                currentY += h + gap;
            }
        }

        historyStore.push({
            execute: () => {
                /* Already applied */
            },
            undo: () => {
                nodes = oldNodes;
            },
        });
    }

    function handleZoomIn() {
        viewport.zoom = Math.min(viewport.zoom * 1.2, 5);
    }

    function handleZoomOut() {
        viewport.zoom = Math.max(viewport.zoom / 1.2, 0.1);
    }

    function handleFitView() {
        if (nodes.length === 0) return;
        // Calc bounds
        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
        nodes.forEach((n: FlowNodeType) => {
            const w = n.data?.style?.width || 256;
            const h = n.data?.style?.height || 100;
            minX = Math.min(minX, n.position.x);
            minY = Math.min(minY, n.position.y);
            maxX = Math.max(maxX, n.position.x + w);
            maxY = Math.max(maxY, n.position.y + h);
        });

        const padding = 50;
        const w = maxX - minX + padding * 2;
        const h = maxY - minY + padding * 2;

        if (editorDims.w === 0) return;

        const scale = Math.min(editorDims.w / w, editorDims.h / h);
        const safeScale = Math.min(scale, 1); // Don't zoom in too much if few nodes

        // Center
        const cx = minX - padding + w / 2;
        const cy = minY - padding + h / 2;

        viewport = {
            zoom: safeScale,
            x: editorDims.w / 2 - cx * safeScale,
            y: editorDims.h / 2 - cy * safeScale,
        };
    }

    // P1 #14: Atomic node deletion (removes nodes AND connected edges)
    function deleteSelectedNodes() {
        if (selectedNodeIds.size === 0 && !selectedEdgeId) return;

        const oldNodes = JSON.parse(JSON.stringify(nodes));
        const oldEdges = JSON.parse(JSON.stringify(edges));
        const deletedNodeIds = new Set(selectedNodeIds);

        if (deletedNodeIds.size > 0) {
            // Remove nodes and all connected edges atomically
            nodes = nodes.filter(
                (n: FlowNodeType) => !deletedNodeIds.has(n.id),
            );
            edges = edges.filter(
                (e: FlowEdgeType) =>
                    !deletedNodeIds.has(e.source) &&
                    !deletedNodeIds.has(e.target),
            );
            selectedNodeIds.clear();
            onNodeSelect(null);
            toastStore.success(
                `已删除 ${deletedNodeIds.size} 个节点及关联连线`,
            );
        } else if (selectedEdgeId) {
            // Delete selected edge
            edges = edges.filter((e: FlowEdgeType) => e.id !== selectedEdgeId);
            selectedEdgeId = null;
            toastStore.success("已删除连线");
        }

        historyStore.push({
            execute: () => {
                nodes = nodes.filter(
                    (n: FlowNodeType) => !deletedNodeIds.has(n.id),
                );
                edges = edges.filter(
                    (e: FlowEdgeType) =>
                        !deletedNodeIds.has(e.source) &&
                        !deletedNodeIds.has(e.target),
                );
            },
            undo: () => {
                nodes = oldNodes;
                edges = oldEdges;
            },
        });
    }

    // P1 #14 + P3 #24: Keyboard shortcuts
    $effect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            // Skip if typing in input/textarea
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT")
                return;

            if (e.key === "Delete" || e.key === "Backspace") {
                e.preventDefault();
                deleteSelectedNodes();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "z") {
                e.preventDefault();
                historyStore.undo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "y") {
                e.preventDefault();
                historyStore.redo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "c") {
                copyNodes();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "v") {
                pasteNodes();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "a") {
                e.preventDefault();
                selectedNodeIds.clear();
                nodes.forEach((n: FlowNodeType) => selectedNodeIds.add(n.id));
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    });

    // --- Node Actions ---

    function handleNodeSelect(id: string, e?: MouseEvent) {
        // ENHANCEMENT 3: Handle connection mode clicks
        if (isConnectMode && e) {
            const targetNode = nodes.find((n) => n.id === id);
            if (!targetNode) return;

            if (!connectModeSource) {
                // First click - select source node's output
                connectModeSource = { nodeId: id, handleType: "output" };
                // Highlight the node
                selectedNodeIds.clear();
                selectedNodeIds.add(id);
            } else if (connectModeSource.nodeId !== id) {
                // Second click - create connection
                // Validate first
                const sourceNode = nodes.find(
                    (n) => n.id === connectModeSource!.nodeId,
                );
                if (sourceNode) {
                    const validation = validateConnection(
                        sourceNode.type,
                        targetNode.type,
                    );

                    // Check if connection already exists
                    const exists = edges.some(
                        (edge) =>
                            edge.source === connectModeSource!.nodeId &&
                            edge.target === id,
                    );

                    if (!exists) {
                        const newEdgeId = `e-${connectModeSource.nodeId}-${id}-${Date.now()}`;
                        const newEdge = {
                            id: newEdgeId,
                            source: connectModeSource.nodeId,
                            target: id,
                        };

                        // Add to history
                        historyStore.push({
                            execute: () => {
                                edges = [...edges, newEdge];
                            },
                            undo: () => {
                                edges = edges.filter(
                                    (edge: FlowEdgeType) =>
                                        edge.id !== newEdgeId,
                                );
                            },
                        });

                        edges = [...edges, newEdge];
                    }
                }

                // Reset connection mode
                connectModeSource = null;
                selectedNodeIds.clear();
                selectedNodeIds.add(id);
            }
            return;
        }

        // ITEM 7: Path Isolation Spotlight (Alt+Click)
        if (e?.altKey) {
            e.preventDefault();

            // Toggle off if already highlighted specifically on this node alone?
            // Better: just compute downstream
            const newHighlighted = new Set<string>();
            const queue = [id];
            newHighlighted.add(id);

            while (queue.length > 0) {
                const current = queue.shift()!;
                // Find all edges where source is current
                edges.forEach((edge: FlowEdgeType) => {
                    if (
                        edge.source === current &&
                        !newHighlighted.has(edge.target)
                    ) {
                        newHighlighted.add(edge.target);
                        queue.push(edge.target);
                    }
                });
            }

            highlightedNodeIds = newHighlighted;
            return; // Don't trigger normal selection
        }

        if (e?.shiftKey || e?.ctrlKey || e?.metaKey) {
            // Toggle
            if (selectedNodeIds.has(id)) {
                selectedNodeIds.delete(id);
            } else {
                selectedNodeIds.add(id);
            }
        } else {
            // Exclusive Select (unless already selected and dragging)
            if (!selectedNodeIds.has(id)) {
                selectedNodeIds.clear();
                selectedNodeIds.add(id);
            }
        }

        highlightedNodeIds = null; // Clear highlight on normal select
        selectedEdgeId = null;
        // Compat: fire for the clicked node
        onNodeSelect(id);
    }

    function handleBackgroundClick(e: MouseEvent) {
        // Clear selection if clicking background
        // FlowCanvas handles box select on drag, but click is distinct
        if (!e.shiftKey && !e.ctrlKey) {
            selectedNodeIds.clear();
            selectedEdgeId = null;
            highlightedNodeIds = null; // Clear highlight
            onNodeSelect(null);
        }
    }

    function handleBoxSelect(rect: {
        x: number;
        y: number;
        w: number;
        h: number;
    }) {
        // Node assumed 200x100 roughly
        const NODE_W = 200;
        const NODE_H = 100;

        const newSelection = new Set<string>();

        for (const node of nodes) {
            // AABB Intersection
            const nx = node.position.x;
            const ny = node.position.y;
            if (
                nx < rect.x + rect.w &&
                nx + NODE_W > rect.x &&
                ny < rect.y + rect.h &&
                ny + NODE_H > rect.y
            ) {
                newSelection.add(node.id);
            }
        }

        selectedNodeIds.clear();
        for (const id of newSelection) selectedNodeIds.add(id);
    }

    function handleEdgeSelect(id: string) {
        selectedEdgeId = id;
        selectedNodeIds.clear();
        onNodeSelect(null);
        // ENHANCEMENT 3: Open edge properties panel when edge is selected
        const edge = edges.find((e: FlowEdgeType) => e.id === id);
        if (edge) {
            selectedEdge = edge;
            isEdgePropertiesOpen = true;
        }
    }

    // --- Node Dragging (History) ---

    function handleNodeDragStart(e: MouseEvent, id: string) {
        // If dragging a node not in selection, select it exclusively
        if (!selectedNodeIds.has(id)) {
            if (!e.shiftKey) selectedNodeIds.clear();
            selectedNodeIds.add(id);
        }

        // Store initial mouse position for delta calculation
        dragStartMouse = { x: e.clientX, y: e.clientY };

        // Snapshot all selected nodes
        dragSnapshot.clear();
        for (const nodeId of selectedNodeIds) {
            const n = nodes.find((n: FlowNodeType) => n.id === nodeId);
            if (n) {
                dragSnapshot.set(nodeId, { ...n.position });
            }
        }
    }

    function handleNodeDragEnd(e: MouseEvent, id: string) {
        // Diff with snapshot
        const changes: {
            id: string;
            from: { x: number; y: number };
            to: { x: number; y: number };
        }[] = [];

        for (const [nodeId, startPos] of dragSnapshot) {
            const n = nodes.find((n: FlowNodeType) => n.id === nodeId);
            if (n) {
                // Snap to Grid (20px)
                const snappedX = Math.round(n.position.x / 20) * 20;
                const snappedY = Math.round(n.position.y / 20) * 20;

                // Update position immediately to snapped
                n.position.x = snappedX;
                n.position.y = snappedY;

                if (
                    n.position.x !== startPos.x ||
                    n.position.y !== startPos.y
                ) {
                    changes.push({
                        id: nodeId,
                        from: startPos,
                        to: { ...n.position },
                    });
                }
            }
        }

        if (changes.length > 0) {
            historyStore.push({
                execute: () => {
                    nodes = nodes.map((n: FlowNodeType) => {
                        const change = changes.find((c) => c.id === n.id);
                        return change
                            ? { ...n, position: { ...change.to } }
                            : n;
                    });
                },
                undo: () => {
                    nodes = nodes.map((n: FlowNodeType) => {
                        const change = changes.find((c) => c.id === n.id);
                        return change
                            ? { ...n, position: { ...change.from } }
                            : n;
                    });
                },
            });
        }

        // --- Parenting Logic (Item 11: Grouping) ---
        const draggedNode = nodes.find((n: FlowNodeType) => n.id === id);
        if (
            draggedNode &&
            draggedNode.type !== "group" &&
            draggedNode.type !== "loop"
        ) {
            let foundParentId: string | undefined;
            // Reverse order to check topmost groups
            for (let i = nodes.length - 1; i >= 0; i--) {
                const target = nodes[i];
                if (target.id === id) continue;
                if (target.type !== "group" && target.type !== "loop") continue;
                if (target.collapsed) continue;

                // Simple bbox check (assuming default sizes if not set)
                const w = target.style?.width || 400;
                const h = target.style?.height || 300;

                if (
                    draggedNode.position.x >= target.position.x &&
                    draggedNode.position.x <= target.position.x + w && // Removed +100 requirement for easier dropping
                    draggedNode.position.y >= target.position.y &&
                    draggedNode.position.y <= target.position.y + h // Removed +50 requirement
                ) {
                    foundParentId = target.id;
                    break;
                }
            }

            if (foundParentId !== draggedNode.parentId) {
                // Remove from old parent, add to new
                draggedNode.parentId = foundParentId;
            }
        }
        dragSnapshot.clear();
        alignmentLines = [];
    }

    function handleNodeDrag(e: MouseEvent, id: string) {
        if (dragSnapshot.size === 0) return;

        const dx = (e.clientX - dragStartMouse.x) / viewport.zoom;
        const dy = (e.clientY - dragStartMouse.y) / viewport.zoom;

        // Item 11: Nested Group movement
        // We must translate children of moving groups
        const draggingGroupIds = Array.from(selectedNodeIds).filter(
            (nId) =>
                nodes.find((n: FlowNodeType) => n.id === nId)?.type ===
                    "group" ||
                nodes.find((n: FlowNodeType) => n.id === nId)?.type === "loop",
        );

        // Find all children
        const childrenToMove = new Set<string>();
        for (const gId of draggingGroupIds) {
            nodes.forEach((n: FlowNodeType) => {
                if (n.parentId === gId && !selectedNodeIds.has(n.id)) {
                    childrenToMove.add(n.id);
                }
            });
        }

        // Move children
        for (const childId of childrenToMove) {
            const childNode = nodes.find((n: FlowNodeType) => n.id === childId);
            const startPos = dragSnapshot.get(childId) || {
                x: childNode?.position.x || 0,
                y: childNode?.position.y || 0,
            };
            if (childNode) {
                // Cache start pos if not already
                if (!dragSnapshot.has(childId)) {
                    dragSnapshot.set(childId, { ...startPos });
                }
                childNode.position.x = startPos.x + dx;
                childNode.position.y = startPos.y + dy;
            }
        }

        // Snapping Logic
        const SNAP_THRESHOLD = 5;
        const alignments: { x1: number; y1: number; x2: number; y2: number }[] =
            [];

        // We only snap the "primary" node being dragged (id)
        // Then apply the same delta to all other selected nodes.
        // If the primary node is not in selection (edge case?), use the first selected.
        const primaryNodeId = selectedNodeIds.has(id)
            ? id
            : selectedNodeIds.values().next().value;
        const primarySnapshot = dragSnapshot.get(primaryNodeId);

        if (!primarySnapshot) return;

        let snappedDx = dx;
        let snappedDy = dy;

        // Candidate position for primary node
        let proposedX = primarySnapshot.x + dx;
        let proposedY = primarySnapshot.y + dy;

        // Fixed sizes for now (should be dynamic ideally)
        const NODE_W = 256;
        const NODE_H = 100; // Estimated

        // Checks against unselected nodes
        // We find the CLOSEST snap.
        let minDistX = SNAP_THRESHOLD;
        let minDistY = SNAP_THRESHOLD;

        for (const node of nodes) {
            if (selectedNodeIds.has(node.id)) continue;

            const targetX = node.position.x;
            const targetY = node.position.y;

            // Horizontal Snapping (Align X)
            // Left to Left
            if (Math.abs(proposedX - targetX) < minDistX) {
                minDistX = Math.abs(proposedX - targetX);
                snappedDx = targetX - primarySnapshot.x;
                alignments.push({
                    x1: targetX,
                    y1: Math.min(proposedY, targetY) - 50,
                    x2: targetX,
                    y2: Math.max(proposedY, targetY) + NODE_H + 50,
                });
            }
            // Right to Right
            if (Math.abs(proposedX + NODE_W - (targetX + NODE_W)) < minDistX) {
                minDistX = Math.abs(proposedX + NODE_W - (targetX + NODE_W));
                snappedDx = targetX - primarySnapshot.x; // Same shift
                alignments.push({
                    x1: targetX + NODE_W,
                    y1: Math.min(proposedY, targetY) - 50,
                    x2: targetX + NODE_W,
                    y2: Math.max(proposedY, targetY) + NODE_H + 50,
                });
            }
            // Center to Center
            if (
                Math.abs(proposedX + NODE_W / 2 - (targetX + NODE_W / 2)) <
                minDistX
            ) {
                minDistX = Math.abs(
                    proposedX + NODE_W / 2 - (targetX + NODE_W / 2),
                );
                snappedDx = targetX - primarySnapshot.x;
                const cx = targetX + NODE_W / 2;
                alignments.push({
                    x1: cx,
                    y1: Math.min(proposedY, targetY) - 50,
                    x2: cx,
                    y2: Math.max(proposedY, targetY) + NODE_H + 50,
                });
            }

            // Vertical Snapping (Align Y)
            // Top to Top
            if (Math.abs(proposedY - targetY) < minDistY) {
                minDistY = Math.abs(proposedY - targetY);
                snappedDy = targetY - primarySnapshot.y;
                alignments.push({
                    x1: Math.min(proposedX, targetX) - 50,
                    y1: targetY,
                    x2: Math.max(proposedX, targetX) + NODE_W + 50,
                    y2: targetY,
                });
            }
            // Bottom to Bottom (Est)
            if (Math.abs(proposedY + NODE_H - (targetY + NODE_H)) < minDistY) {
                minDistY = Math.abs(proposedY + NODE_H - (targetY + NODE_H));
                snappedDy = targetY - primarySnapshot.y;
                alignments.push({
                    x1: Math.min(proposedX, targetX) - 50,
                    y1: targetY + NODE_H,
                    x2: Math.max(proposedX, targetX) + NODE_W + 50,
                    y2: targetY + NODE_H,
                });
            }
            // Center to Center
            if (
                Math.abs(proposedY + NODE_H / 2 - (targetY + NODE_H / 2)) <
                minDistY
            ) {
                minDistY = Math.abs(
                    proposedY + NODE_H / 2 - (targetY + NODE_H / 2),
                );
                snappedDy = targetY - primarySnapshot.y;
                const cy = targetY + NODE_H / 2;
                alignments.push({
                    x1: Math.min(proposedX, targetX) - 50,
                    y1: cy,
                    x2: Math.max(proposedX, targetX) + NODE_W + 50,
                    y2: cy,
                });
            }
        }

        // Apply snapped delta to all selected nodes
        for (const nodeId of selectedNodeIds) {
            const node = nodes.find((n: FlowNodeType) => n.id === nodeId);
            const startPos = dragSnapshot.get(nodeId);
            if (node && startPos) {
                node.position.x = startPos.x + snappedDx;
                node.position.y = startPos.y + snappedDy;
            }
        }

        // Update guides if we snapped
        // Filter unique lines optionally?
        if (Math.abs(snappedDx - dx) > 0.1 || Math.abs(snappedDy - dy) > 0.1) {
            alignmentLines = alignments;
        } else {
            alignmentLines = [];
        }
    }

    // --- Connection Logic ---

    function getCanvasPosition(clientX: number, clientY: number) {
        if (!editorContainer) return { x: 0, y: 0 };
        const rect = editorContainer.getBoundingClientRect();
        return {
            x: (clientX - rect.left - viewport.x) / viewport.zoom,
            y: (clientY - rect.top - viewport.y) / viewport.zoom,
        };
    }

    function handleConnectStart(
        nodeId: string,
        handleType: "input" | "output",
        e: MouseEvent,
    ) {
        if (readOnly) return;
        if (handleType === "input") return;

        connectingNodeId = nodeId;
        connectingHandleType = handleType;
        connectionMousePos = getCanvasPosition(e.clientX, e.clientY);

        window.addEventListener("mousemove", handleGlobalMouseMove);
        window.addEventListener("mouseup", handleGlobalMouseUp);
    }

    function handleConnectEnd(
        nodeId: string,
        handleType: "input" | "output",
        e: MouseEvent,
    ) {
        if (!connectingNodeId) return;

        // ENHANCEMENT 1: Smart Connection - Use snap target if available
        const targetNodeId = snapTarget?.nodeId || nodeId;
        // Use snap target's handle type if available, otherwise use the event's handle type
        const targetHandleType = snapTarget?.handleType || handleType;

        // Validate connection before creating
        const sourceNode = nodes.find((n) => n.id === connectingNodeId);
        const targetNode = nodes.find((n) => n.id === targetNodeId);

        if (sourceNode && targetNode) {
            const validation = validateConnection(
                sourceNode.type,
                targetNode.type,
            );
            if (!validation.valid) {
                // Show warning but still allow connection (soft validation)
                console.warn("Connection warning:", validation.warning);
            }

            // ENHANCEMENT 9: Check for cycle before creating connection
            const cycleCheck = checkConnectionCycle(
                connectingNodeId,
                targetNodeId,
            );
            if (cycleCheck.hasCycle) {
                // Show warning and ask for confirmation
                const proceed = window.confirm(
                    `警告: ${cycleCheck.message}\n\n这将创建一个循环依赖。是否继续?`,
                );
                if (!proceed) {
                    cleanupConnection();
                    return;
                }
            }
        }

        if (
            connectingNodeId !== targetNodeId &&
            targetHandleType === "input" &&
            connectingHandleType === "output"
        ) {
            const newEdgeId = `e-${connectingNodeId}-${targetNodeId}-${Date.now()}`;
            const exists = edges.some(
                (e) =>
                    e.source === connectingNodeId && e.target === targetNodeId,
            );
            if (!exists) {
                const newEdge = {
                    id: newEdgeId,
                    source: connectingNodeId,
                    target: targetNodeId,
                };
                // History
                historyStore.push({
                    execute: () => {
                        edges = [...edges, newEdge];
                        onEdgeCreate(newEdge.source, newEdge.target);
                    },
                    undo: () => {
                        edges = edges.filter(
                            (e: FlowEdgeType) => e.id !== newEdge.id,
                        );
                    },
                });

                edges = [...edges, newEdge];
                onEdgeCreate(connectingNodeId, targetNodeId);
            }
        }

        cleanupConnection();
    }

    // ENHANCEMENT: Handle context menu on handles for quick connect and node creation
    let handleContextMenuState = $state<{
        nodeId: string;
        handleType: "input" | "output";
        x: number;
        y: number;
    } | null>(null);

    function handleHandleContextMenu(
        nodeId: string,
        handleType: "input" | "output",
        x: number,
        y: number,
    ) {
        handleContextMenuState = { nodeId, handleType, x, y };
    }

    function closeHandleContextMenu() {
        handleContextMenuState = null;
    }

    function connectToNode(targetNodeId: string) {
        if (!handleContextMenuState) return;

        const sourceNodeId = handleContextMenuState.nodeId;
        const handleType = handleContextMenuState.handleType;

        // Only allow output -> input connections
        if (handleType !== "output") {
            closeHandleContextMenu();
            return;
        }

        // Check for cycle
        const cycleCheck = checkConnectionCycle(sourceNodeId, targetNodeId);
        if (cycleCheck.hasCycle) {
            const proceed = window.confirm(
                `警告: ${cycleCheck.message}\n\n这将创建一个循环依赖。是否继续?`,
            );
            if (!proceed) {
                closeHandleContextMenu();
                return;
            }
        }

        // Check if connection already exists
        const exists = edges.some(
            (e) => e.source === sourceNodeId && e.target === targetNodeId,
        );

        if (!exists) {
            const newEdgeId = `e-${sourceNodeId}-${targetNodeId}-${Date.now()}`;
            const newEdge = {
                id: newEdgeId,
                source: sourceNodeId,
                target: targetNodeId,
            };

            historyStore.push({
                execute: () => {
                    edges = [...edges, newEdge];
                    onEdgeCreate(newEdge.source, newEdge.target);
                },
                undo: () => {
                    edges = edges.filter(
                        (e: FlowEdgeType) => e.id !== newEdge.id,
                    );
                },
            });

            edges = [...edges, newEdge];
            onEdgeCreate(sourceNodeId, targetNodeId);
        }

        closeHandleContextMenu();
    }

    function createNodeAtHandle(type: NodeType = "agent") {
        if (!handleContextMenuState) return;

        const sourceNodeId = handleContextMenuState.nodeId;
        const sourceNode = nodes.find((n) => n.id === sourceNodeId);

        if (!sourceNode) {
            closeHandleContextMenu();
            return;
        }

        // Calculate position for new node
        const nodeW =
            sourceNode.data?.style?.width ||
            (sourceNode.type === "group" ? 400 : 256);
        const nodeH =
            sourceNode.data?.style?.height ||
            (sourceNode.type === "group" ? 300 : 100);

        const newNodeX = sourceNode.position.x + nodeW + 100;
        const newNodeY = sourceNode.position.y;

        const newNodeId = crypto.randomUUID();
        const newNode: FlowNodeType = {
            id: newNodeId,
            type,
            position: { x: newNodeX, y: newNodeY },
            data: {
                label: getDefaultLabel(type),
            },
            selected: false,
        };

        // Create edge from source to new node
        const newEdgeId = `e-${sourceNodeId}-${newNodeId}-${Date.now()}`;
        const newEdge = {
            id: newEdgeId,
            source: sourceNodeId,
            target: newNodeId,
        };

        historyStore.push({
            execute: () => {
                nodes = [...nodes, newNode];
                edges = [...edges, newEdge];
                onEdgeCreate(newEdge.source, newEdge.target);
                selectedNodeIds.clear();
                selectedNodeIds.add(newNodeId);
            },
            undo: () => {
                nodes = nodes.filter((n: FlowNodeType) => n.id !== newNodeId);
                edges = edges.filter((e: FlowEdgeType) => e.id !== newEdgeId);
                selectedNodeIds.clear();
            },
        });

        nodes = [...nodes, newNode];
        edges = [...edges, newEdge];
        selectedNodeIds.clear();
        selectedNodeIds.add(newNodeId);

        closeHandleContextMenu();
    }

    function getDefaultLabel(type: NodeType): string {
        switch (type) {
            case "agent":
                return "New Agent";
            case "skill":
                return "New Skill";
            case "condition":
                return "Condition";
            case "router":
                return "Router";
            case "parallel":
                return "Parallel";
            case "end":
                return "End";
            case "group":
                return "Group";
            case "loop":
                return "Loop";
            default:
                return "New Node";
        }
    }

    function updateConnectionValidation(targetNodeId: string) {
        if (!connectingNodeId) return;
        const sourceNode = nodes.find(
            (n: FlowNodeType) => n.id === connectingNodeId,
        );
        const targetNode = nodes.find(
            (n: FlowNodeType) => n.id === targetNodeId,
        );
        if (!sourceNode || !targetNode) return;

        const validation = validateConnection(sourceNode.type, targetNode.type);
        connectionValid = validation.valid;
        connectionWarning = validation.warning;

        if (connectionValid) {
            const cycleCheck = checkConnectionCycle(
                connectingNodeId,
                targetNodeId,
            );
            if (cycleCheck.hasCycle) {
                connectionValid = false;
                connectionWarning = cycleCheck.message;
            }
        }
    }

    function handleGlobalMouseMove(e: MouseEvent) {
        connectionMousePos = getCanvasPosition(e.clientX, e.clientY);

        // ENHANCEMENT 1: Smart Connection - Update snap target
        if (connectionMousePos) {
            snapTarget = findSnapTarget(connectionMousePos);

            // Update validation based on potential target
            if (snapTarget) {
                updateConnectionValidation(snapTarget.nodeId);
            } else {
                connectionValid = true;
                connectionWarning = "";
            }
        }
    }

    function handleGlobalMouseUp(e: MouseEvent) {
        // If we were connecting and released on the canvas (not handled by handleConnectEnd of a node)
        // We need to check if we clicked on a node/handle?
        // handleConnectEnd (on FlowNode) fires `mouseup` on the handle.
        // This global listener fires on window.
        // We can check if the target is a handle? Or we can rely on order of events.
        // If handleConnectEnd fired, `connectingNodeId` is cleared.
        // So if `connectingNodeId` is still set here, it means we dropped on empty space (or invalid target).

        if (connectingNodeId && onConnectionDrop) {
            const pos = getCanvasPosition(e.clientX, e.clientY);
            // Verify we dropped on canvas (e.target is inside container or is the svg/bg)
            // Actually, if we are here, we are ending a connection drag.
            // We should fire the event.
            onConnectionDrop(connectingNodeId, connectingHandleType!, pos, e);
        }

        cleanupConnection();
    }

    function cleanupConnection() {
        connectingNodeId = null;
        connectingHandleType = null;
        connectionMousePos = null;
        window.removeEventListener("mousemove", handleGlobalMouseMove);
        window.removeEventListener("mouseup", handleGlobalMouseUp);
    }

    // ENHANCEMENT 1: Navigate to adjacent node in navigation mode
    function navigateToAdjacentNode(direction: string) {
        if (!navConnectSource) return;

        const sourceNode = nodes.find((n) => n.id === navConnectSource);
        if (!sourceNode) return;

        // Find nodes in the direction
        let candidates = nodes.filter((n) => n.id !== navConnectSource);

        // Filter based on direction
        if (direction === "ArrowRight") {
            candidates = candidates.filter(
                (n) => n.position.x > sourceNode.position.x,
            );
            candidates.sort((a, b) => a.position.x - b.position.x);
        } else if (direction === "ArrowLeft") {
            candidates = candidates.filter(
                (n) => n.position.x < sourceNode.position.x,
            );
            candidates.sort((a, b) => b.position.x - a.position.x);
        } else if (direction === "ArrowDown") {
            candidates = candidates.filter(
                (n) => n.position.y > sourceNode.position.y,
            );
            candidates.sort((a, b) => a.position.y - b.position.y);
        } else if (direction === "ArrowUp") {
            candidates = candidates.filter(
                (n) => n.position.y < sourceNode.position.y,
            );
            candidates.sort((a, b) => b.position.y - a.position.y);
        }

        // Select the closest node in that direction
        if (candidates.length > 0) {
            navConnectTarget = candidates[0].id;
            selectedNodeIds.clear();
            selectedNodeIds.add(candidates[0].id);
        }
    }

    // ENHANCEMENT 1: Create connection from navigation mode
    function createConnectionFromNavMode() {
        if (!navConnectSource || !navConnectTarget) return;

        const sourceNode = nodes.find((n) => n.id === navConnectSource);
        const targetNode = nodes.find((n) => n.id === navConnectTarget);

        if (!sourceNode || !targetNode) return;

        // Check for cycle
        const cycleCheck = checkConnectionCycle(
            navConnectSource,
            navConnectTarget,
        );
        if (cycleCheck.hasCycle) {
            const proceed = window.confirm(
                `警告: ${cycleCheck.message}\n\n这将创建一个循环依赖。是否继续?`,
            );
            if (!proceed) {
                isNavConnectMode = false;
                navConnectSource = null;
                navConnectTarget = null;
                return;
            }
        }

        // Check if connection already exists
        const exists = edges.some(
            (edge) =>
                edge.source === navConnectSource &&
                edge.target === navConnectTarget,
        );

        if (!exists) {
            const newEdgeId = `e-${navConnectSource}-${navConnectTarget}-${Date.now()}`;
            const newEdge = {
                id: newEdgeId,
                source: navConnectSource,
                target: navConnectTarget,
            };

            historyStore.push({
                execute: () => {
                    edges = [...edges, newEdge];
                },
                undo: () => {
                    edges = edges.filter(
                        (edge: FlowEdgeType) => edge.id !== newEdgeId,
                    );
                },
            });

            edges = [...edges, newEdge];
            console.log(
                "Connected:",
                sourceNode.data.label,
                "->",
                targetNode.data.label,
            );
        }

        // Move to next candidate and continue
        const currentTarget = navConnectTarget;
        isNavConnectMode = false;
        navConnectSource = null;
        navConnectTarget = null;

        // Optionally keep connection mode on for continuous connection
        // isNavConnectMode = true;
        // navConnectSource = currentTarget;
    }

    // --- Keyboard ---
    function handleKeyDown(e: KeyboardEvent) {
        // ENHANCEMENT 1: Tab enters navigation connection mode
        if (e.key === "Tab" && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const activeElement = document.activeElement;
            const isInput =
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement;
            if (!isInput && selectedNodeIds.size > 0) {
                e.preventDefault();
                // Enter navigation mode with first selected node as source
                isNavConnectMode = true;
                navConnectSource = Array.from(selectedNodeIds)[0] || null;
                navConnectTarget = null;
                return;
            }
        }

        // ENHANCEMENT 1: Arrow keys navigate in navigation mode
        if (
            isNavConnectMode &&
            ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
        ) {
            e.preventDefault();
            navigateToAdjacentNode(e.key);
            return;
        }

        // ENHANCEMENT 1: Enter creates connection in navigation mode
        if (
            e.key === "Enter" &&
            isNavConnectMode &&
            navConnectSource &&
            navConnectTarget
        ) {
            e.preventDefault();
            createConnectionFromNavMode();
            return;
        }

        // ENHANCEMENT 1: Escape exits navigation mode
        if (e.key === "Escape" && isNavConnectMode) {
            isNavConnectMode = false;
            navConnectSource = null;
            navConnectTarget = null;
            return;
        }

        // Undo / Redo
        if ((e.ctrlKey || e.metaKey) && e.key === "z") {
            e.preventDefault();
            historyStore.undo();
            return;
        }
        if (
            (e.ctrlKey || e.metaKey) &&
            (e.key === "y" || (e.shiftKey && e.key === "Z"))
        ) {
            e.preventDefault();
            historyStore.redo();
            return;
        }

        // P1-6: Copy (Ctrl+C)
        if (
            (e.ctrlKey || e.metaKey) &&
            e.key === "c" &&
            selectedNodeIds.size > 0
        ) {
            e.preventDefault();
            copyNodes();
            return;
        }

        // P1-6: Paste (Ctrl+V)
        if (
            (e.ctrlKey || e.metaKey) &&
            e.key === "v" &&
            copiedNodes.length > 0
        ) {
            e.preventDefault();
            pasteNodes();
            return;
        }

        // Search (Ctrl+K)
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
            e.preventDefault();
            isSearchOpen = !isSearchOpen;
            return;
        }

        // Search (Ctrl+F)
        if ((e.ctrlKey || e.metaKey) && e.key === "f") {
            e.preventDefault();
            isSearchOpen = !isSearchOpen;
            return;
        }

        // ENHANCEMENT 4: Validation Panel (Ctrl+Shift+V)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "V") {
            e.preventDefault();
            isValidationOpen = !isValidationOpen;
            return;
        }

        // ENHANCEMENT 3: One-Click Connection Mode (C key)
        if (e.key === "c" && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const activeElement = document.activeElement;
            const isInput =
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement;
            if (!isInput) {
                e.preventDefault();
                // Toggle connection mode
                if (isConnectMode) {
                    // Exit connect mode
                    isConnectMode = false;
                    connectModeSource = null;
                } else {
                    // Enter connect mode
                    isConnectMode = true;
                }
                return;
            }
        }

        // Exit connect mode with Escape
        if (e.key === "Escape" && isConnectMode) {
            isConnectMode = false;
            connectModeSource = null;
            return;
        }

        // ENHANCEMENT 6: Quick Duplicate (D key)
        if (
            e.key === "d" &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey &&
            selectedNodeIds.size > 0
        ) {
            const activeElement = document.activeElement;
            const isInput =
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement;
            if (!isInput) {
                e.preventDefault();
                // Duplicate all selected nodes
                duplicateSelectedNodes();
                return;
            }
        }

        // NEW: Quick Connect Selected Nodes (L key) - Connect first two selected nodes
        if (
            e.key === "l" &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey &&
            selectedNodeIds.size === 2
        ) {
            const activeElement = document.activeElement;
            const isInput =
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement;
            if (!isInput) {
                e.preventDefault();
                // Get the two selected nodes
                const selectedArray = Array.from(selectedNodeIds);
                const sourceId = selectedArray[0];
                const targetId = selectedArray[1];

                const sourceNode = nodes.find((n) => n.id === sourceId);
                const targetNode = nodes.find((n) => n.id === targetId);

                if (sourceNode && targetNode) {
                    // Validate connection
                    const validation = validateConnection(
                        sourceNode.type,
                        targetNode.type,
                    );

                    // Check for cycle
                    const cycleCheck = checkConnectionCycle(sourceId, targetId);
                    if (cycleCheck.hasCycle) {
                        const proceed = window.confirm(
                            `警告: ${cycleCheck.message}\n\n这将创建一个循环依赖。是否继续?`,
                        );
                        if (!proceed) {
                            return;
                        }
                    }

                    // Check if connection already exists
                    const exists = edges.some(
                        (edge) =>
                            edge.source === sourceId &&
                            edge.target === targetId,
                    );

                    if (!exists) {
                        const newEdgeId = `e-${sourceId}-${targetId}-${Date.now()}`;
                        const newEdge = {
                            id: newEdgeId,
                            source: sourceId,
                            target: targetId,
                        };

                        // Add to history
                        historyStore.push({
                            execute: () => {
                                edges = [...edges, newEdge];
                            },
                            undo: () => {
                                edges = edges.filter(
                                    (edge: FlowEdgeType) =>
                                        edge.id !== newEdgeId,
                                );
                            },
                        });

                        edges = [...edges, newEdge];
                        console.log(
                            "Connected nodes:",
                            sourceNode.data.label,
                            "->",
                            targetNode.data.label,
                        );
                    }
                }
                return;
            }
        }

        // ENHANCEMENT 3: Batch Sequential Connection (O key)
        if (
            e.key === "o" &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey &&
            selectedNodeIds.size >= 2
        ) {
            const activeElement = document.activeElement;
            const isInput =
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement;
            if (!isInput) {
                e.preventDefault();

                // Get selected nodes and sort by position (left to right, then top to bottom)
                const selectedArray = Array.from(selectedNodeIds);
                const selectedNodesList = selectedArray
                    .map((id) => nodes.find((n) => n.id === id))
                    .filter(Boolean) as FlowNodeType[];

                // Sort: primary by X, secondary by Y
                selectedNodesList.sort((a, b) => {
                    const xDiff = a.position.x - b.position.x;
                    if (Math.abs(xDiff) > 50) return xDiff;
                    return a.position.y - b.position.y;
                });

                // Create sequential connections
                const newEdges: FlowEdgeType[] = [];
                const skipCount = { value: 0 };

                for (let i = 0; i < selectedNodesList.length - 1; i++) {
                    const sourceNode = selectedNodesList[i];
                    const targetNode = selectedNodesList[i + 1];

                    // Skip if already connected
                    const exists = edges.some(
                        (edge) =>
                            edge.source === sourceNode.id &&
                            edge.target === targetNode.id,
                    );

                    if (exists) {
                        skipCount.value++;
                        continue;
                    }

                    // Check for cycle
                    const cycleCheck = checkConnectionCycle(
                        sourceNode.id,
                        targetNode.id,
                    );
                    if (cycleCheck.hasCycle) {
                        const proceed = window.confirm(
                            `警告: ${cycleCheck.message}\n\n跳过此连接?`,
                        );
                        if (!proceed) continue;
                        skipCount.value++;
                        continue;
                    }

                    const newEdgeId = `e-${sourceNode.id}-${targetNode.id}-${Date.now()}-${i}`;
                    newEdges.push({
                        id: newEdgeId,
                        source: sourceNode.id,
                        target: targetNode.id,
                    });
                }

                if (newEdges.length > 0) {
                    historyStore.push({
                        execute: () => {
                            edges = [...edges, ...newEdges];
                        },
                        undo: () => {
                            const edgeIds = new Set(newEdges.map((e) => e.id));
                            edges = edges.filter((e) => !edgeIds.has(e.id));
                        },
                    });

                    edges = [...edges, ...newEdges];
                    console.log(
                        `Created ${newEdges.length} sequential connections, skipped ${skipCount.value}`,
                    );
                } else if (skipCount.value > 0) {
                    toastStore.info(`已跳过 ${skipCount.value} 个现有连接`);
                } else {
                    toastStore.warning("没有可创建的连接");
                }
                return;
            }
        }

        // Trace (T)
        if (e.key === "t" && !e.ctrlKey && !e.metaKey) {
            const activeElement = document.activeElement;
            const isInput =
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement;
            if (!isInput && selectedNodeIds.size === 1) {
                e.preventDefault();
                traceNodeId = Array.from(selectedNodeIds)[0];
                isTraceOpen = true;
                return;
            }
        }

        // ENHANCEMENT 2: Beautify Edges (Shift+L)
        if (e.key === "l" && e.shiftKey && !e.ctrlKey && !e.metaKey) {
            const activeElement = document.activeElement;
            const isInput =
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement;
            if (!isInput) {
                e.preventDefault();
                handleBeautifyEdges();
                return;
            }
        }

        // Copy (Ctrl+C)
        if ((e.ctrlKey || e.metaKey) && e.key === "c") {
            // e.preventDefault(); // Let browser copy if text selected? No, in canvas we want nodes.
            // Only if focused on canvas logic?
            // If text input focused, don't copy nodes.
            const activeElement = document.activeElement;
            const isInput =
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement;
            if (isInput) return;

            e.preventDefault();

            const nodesToCopy = nodes.filter((n: FlowNodeType) =>
                selectedNodeIds.has(n.id),
            );
            // Copy edges only if both source and target are in selection
            const edgesToCopy = edges.filter(
                (edge: FlowEdgeType) =>
                    selectedNodeIds.has(edge.source) &&
                    selectedNodeIds.has(edge.target),
            );

            if (nodesToCopy.length > 0) {
                const clipboardData = {
                    aoneFlow: true,
                    nodes: nodesToCopy,
                    edges: edgesToCopy,
                };
                navigator.clipboard.writeText(JSON.stringify(clipboardData));
                console.log("Copied to clipboard", clipboardData);
            }
            return;
        }

        // Paste (Ctrl+V)
        if ((e.ctrlKey || e.metaKey) && e.key === "v") {
            const activeElement = document.activeElement;
            const isInput =
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement;
            if (isInput) return;

            e.preventDefault();

            navigator.clipboard.readText().then((text) => {
                try {
                    const data = JSON.parse(text);
                    if (data && data.aoneFlow && Array.isArray(data.nodes)) {
                        /* Logic to paste nodes */
                        // Map old IDs to new IDs
                        const idMap = new Map<string, string>();
                        const newNodes = data.nodes.map((n: FlowNodeType) => {
                            const newId = crypto.randomUUID();
                            idMap.set(n.id, newId);
                            return {
                                ...n,
                                id: newId,
                                position: {
                                    x: n.position.x + 50, // Offset slightly
                                    y: n.position.y + 50,
                                },
                                selected: true, // Auto-select new
                            };
                        });

                        const newEdges = (data.edges || [])
                            .map((edge: FlowEdgeType) => {
                                const newSource = idMap.get(edge.source);
                                const newTarget = idMap.get(edge.target);
                                if (newSource && newTarget) {
                                    return {
                                        ...edge,
                                        id: crypto.randomUUID(),
                                        source: newSource,
                                        target: newTarget,
                                        selected: false,
                                    };
                                }
                                return null;
                            })
                            .filter(Boolean) as FlowEdgeType[];

                        // History Command
                        historyStore.push({
                            execute: () => {
                                // Add items
                                nodes = [...nodes, ...newNodes];
                                edges = [...edges, ...newEdges];
                                // Select them
                                selectedNodeIds.clear();
                                for (const n of newNodes)
                                    selectedNodeIds.add(n.id);
                            },
                            undo: () => {
                                // Remove items
                                const newIds = new Set(
                                    newNodes.map((n: FlowNodeType) => n.id),
                                );
                                const newEdgeIds = new Set(
                                    newEdges.map((e: FlowEdgeType) => e.id),
                                );
                                nodes = nodes.filter(
                                    (n: FlowNodeType) => !newIds.has(n.id),
                                );
                                edges = edges.filter(
                                    (e) => !newEdgeIds.has(e.id),
                                );
                                selectedNodeIds.clear(); // Potentially restore previous selection?
                            },
                        });

                        // Execute immediate
                        selectedNodeIds.clear();
                        nodes = [...nodes, ...newNodes];
                        edges = [...edges, ...newEdges];
                        for (const n of newNodes) selectedNodeIds.add(n.id);
                    }
                } catch (err) {
                    console.error("Paste failed", err);
                }
            });
            return;
        }

        // Delete
        if (e.key === "Delete" || e.key === "Backspace") {
            const nodesToDelete = [...selectedNodeIds];
            const edgeToDelete = selectedEdgeId;

            if (nodesToDelete.length > 0 || edgeToDelete) {
                // Snapshot state
                const deletedNodes = nodes.filter((n: FlowNodeType) =>
                    selectedNodeIds.has(n.id),
                );
                const deletedEdges = edges.filter(
                    (e: FlowEdgeType) =>
                        selectedNodeIds.has(e.source) ||
                        selectedNodeIds.has(e.target) ||
                        e.id === edgeToDelete,
                );

                historyStore.push({
                    execute: () => {
                        nodes = nodes.filter(
                            (n: FlowNodeType) => !selectedNodeIds.has(n.id),
                        );
                        edges = edges.filter(
                            (e: FlowEdgeType) =>
                                !selectedNodeIds.has(e.source) &&
                                !selectedNodeIds.has(e.target) &&
                                e.id !== edgeToDelete,
                        );
                        selectedNodeIds.clear();
                        selectedEdgeId = null;
                    },
                    undo: () => {
                        nodes = [...nodes, ...deletedNodes];
                        edges = [...edges, ...deletedEdges];
                    },
                });

                // Apply immediate
                nodes = nodes.filter(
                    (n: FlowNodeType) => !selectedNodeIds.has(n.id),
                );
                edges = edges.filter(
                    (e) =>
                        !selectedNodeIds.has(e.source) &&
                        !selectedNodeIds.has(e.target) &&
                        e.id !== edgeToDelete,
                );
                selectedNodeIds.clear();
                selectedEdgeId = null;
            }
        }
    }

    onMount(() => {
        if (!editorContainer) return;
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                editorDims = {
                    w: entry.contentRect.width,
                    h: entry.contentRect.height,
                };
            }
        });
        ro.observe(editorContainer);
        return () => ro.disconnect();
    });

    // --- Context Menu ---
    let contextMenu = $state<{
        x: number;
        y: number;
        type: "node" | "edge" | "canvas";
        targetId?: string;
    } | null>(null);

    function handleContextMenu(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        const canvasPos = getCanvasPosition(e.clientX, e.clientY);

        let targetNodeId: string | undefined;
        // Simple Top-down hit test (reverse iteration)
        for (let i = nodes.length - 1; i >= 0; i--) {
            const node = nodes[i];
            const nx = node.position.x;
            const ny = node.position.y;
            const w =
                node.style?.width ||
                (node.type === "group" || node.type === "loop" ? 400 : 256);
            const h =
                node.style?.height ||
                (node.type === "group" || node.type === "loop" ? 300 : 100); // Approx

            if (
                canvasPos.x >= nx &&
                canvasPos.x <= nx + w &&
                canvasPos.y >= ny &&
                canvasPos.y <= ny + h
            ) {
                targetNodeId = node.id;
                break;
            }
        }

        if (targetNodeId) {
            contextMenu = {
                x: e.clientX,
                y: e.clientY,
                type: "node",
                targetId: targetNodeId,
            };
        } else {
            contextMenu = {
                x: e.clientX,
                y: e.clientY,
                type: "canvas",
            };
        }
    }

    function handleContextAction(action: string, targetId?: string) {
        if (action === "add_node") {
            if (contextMenu && onCanvasDoubleClick) {
                const pos = getCanvasPosition(contextMenu.x, contextMenu.y);
                onCanvasDoubleClick(
                    pos,
                    new MouseEvent("dblclick", {
                        clientX: contextMenu.x,
                        clientY: contextMenu.y,
                    }),
                );
            }
        } else if (action === "delete" && targetId) {
            const node = nodes.find((n: FlowNodeType) => n.id === targetId);
            if (node) {
                // Also remove connected edges (#6: auto-clean orphaned edges)
                const connectedEdges = edges.filter(
                    (e: FlowEdgeType) =>
                        e.source === targetId || e.target === targetId,
                );
                historyStore.push({
                    execute: () => {
                        nodes = nodes.filter(
                            (n: FlowNodeType) => n.id !== targetId,
                        );
                        edges = edges.filter(
                            (e: FlowEdgeType) =>
                                e.source !== targetId && e.target !== targetId,
                        );
                    },
                    undo: () => {
                        nodes = [...nodes, node];
                        edges = [...edges, ...connectedEdges];
                    },
                });
                nodes = nodes.filter((n: FlowNodeType) => n.id !== targetId);
                edges = edges.filter(
                    (e: FlowEdgeType) =>
                        e.source !== targetId && e.target !== targetId,
                );
                if (selectedNodeIds.has(targetId)) {
                    selectedNodeIds.delete(targetId);
                }
            }
        } else if (action === "duplicate" && targetId) {
            // Duplicate the target node
            selectedNodeIds.clear();
            selectedNodeIds.add(targetId);
            duplicateSelectedNodes();
        } else if (action === "copy") {
            copyNodes();
        } else if (action === "paste") {
            pasteNodes();
        } else if (action === "fit_view") {
            handleFitView();
        } else if (action === "toggle_breakpoint" && targetId) {
            nodes = nodes.map((n: FlowNodeType) => {
                if (n.id === targetId) {
                    return {
                        ...n,
                        data: { ...n.data, breakpoint: !n.data?.breakpoint },
                    };
                }
                return n;
            });
        } else if (action === "toggle_error_handler" && targetId) {
            nodes = nodes.map((n: FlowNodeType) => {
                if (n.id === targetId) {
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            errorHandler: !n.data?.errorHandler,
                        },
                    };
                }
                return n;
            });
        } else if (action === "trace_execution" && targetId) {
            traceNodeId = targetId;
            isTraceOpen = true;
        } else if (action === "group_selection") {
            const selected = nodes.filter((n: FlowNodeType) =>
                selectedNodeIds.has(n.id),
            );
            if (selected.length < 2) return;

            let minX = Infinity,
                minY = Infinity,
                maxX = -Infinity,
                maxY = -Infinity;
            selected.forEach((n: FlowNodeType) => {
                minX = Math.min(minX, n.position.x);
                minY = Math.min(minY, n.position.y);
                const w = n.style?.width || 256;
                const h = n.style?.height || 100;
                maxX = Math.max(maxX, n.position.x + w);
                maxY = Math.max(maxY, n.position.y + h);
            });

            const PADDING = 40;
            minX -= PADDING;
            minY -= PADDING;
            maxX += PADDING;
            maxY += PADDING;

            const groupId = crypto.randomUUID();
            const groupNode: any = {
                id: groupId,
                type: "group",
                position: { x: minX, y: minY },
                data: {
                    label: "New Group",
                    style: { width: maxX - minX, height: maxY - minY },
                },
                selected: true,
            };

            historyStore.push({
                execute: () => {
                    nodes = [groupNode, ...nodes];
                    selectedNodeIds.clear();
                    selectedNodeIds.add(groupId);
                },
                undo: () => {
                    nodes = nodes.filter((n: FlowNodeType) => n.id !== groupId);
                },
            });

            nodes = [groupNode, ...nodes];
            selectedNodeIds.clear();
            selectedNodeIds.add(groupId);
        } else if (action === "lock" && targetId) {
            nodes = nodes.map((n: FlowNodeType) => {
                if (n.id === targetId) {
                    return { ...n, data: { ...n.data, locked: true } };
                }
                return n;
            });
        } else if (action === "unlock" && targetId) {
            nodes = nodes.map((n: FlowNodeType) => {
                if (n.id === targetId) {
                    return { ...n, data: { ...n.data, locked: false } };
                }
                return n;
            });
        } else if (action === "save_template") {
            const selected = nodes.filter((n: FlowNodeType) =>
                selectedNodeIds.has(n.id),
            );
            if (selected.length === 0) {
                toastStore.warning("请先选中要保存为模板的节点。");
                return;
            }

            const templateName = prompt("请输入此模板的名称：");
            if (!templateName) return;

            // Serialize selected nodes and their internal edges
            const serializedNodes = JSON.parse(JSON.stringify(selected));
            const selectedIds = new Set(
                selected.map((n: FlowNodeType) => n.id),
            );
            const serializedEdges = JSON.parse(
                JSON.stringify(
                    edges.filter(
                        (e) =>
                            selectedIds.has(e.source) &&
                            selectedIds.has(e.target),
                    ),
                ),
            );

            const templatePayload = {
                id: crypto.randomUUID(),
                name: templateName,
                nodes: serializedNodes,
                edges: serializedEdges,
                createdAt: new Date().toISOString(),
            };

            // Save to localStorage
            const existingTemplatesRaw = localStorage.getItem(
                "aone_flow_templates",
            );
            const existingTemplates = existingTemplatesRaw
                ? JSON.parse(existingTemplatesRaw)
                : [];
            existingTemplates.push(templatePayload);
            localStorage.setItem(
                "aone_flow_templates",
                JSON.stringify(existingTemplates),
            );

            // Dispatch a window event so FlowAssetHub can re-render
            window.dispatchEvent(new CustomEvent("aone_templates_updated"));

            toastStore.success(`模板 '${templateName}' 保存成功！`);
        } else if (action === "save_snippet") {
            // P1-4: Save selected nodes as snippet
            const selected = nodes.filter((n: FlowNodeType) =>
                selectedNodeIds.has(n.id),
            );
            if (selected.length === 0) {
                toastStore.warning("请先选中要保存为代码片段的节点。");
                return;
            }

            const snippetName = prompt("请输入此代码片段的名称：");
            if (!snippetName) return;

            // Serialize selected nodes and their internal edges
            const serializedNodes = JSON.parse(JSON.stringify(selected));
            const selectedIds = new Set(
                selected.map((n: FlowNodeType) => n.id),
            );
            const serializedEdges = JSON.parse(
                JSON.stringify(
                    edges.filter(
                        (e) =>
                            selectedIds.has(e.source) &&
                            selectedIds.has(e.target),
                    ),
                ),
            );

            const snippetPayload = {
                id: crypto.randomUUID(),
                name: snippetName,
                nodes: serializedNodes,
                edges: serializedEdges,
                nodeCount: selected.length,
                createdAt: Date.now(),
            };

            // Save to localStorage
            const existingSnippetsRaw = localStorage.getItem(
                "flow_editor_snippets",
            );
            const existingSnippets = existingSnippetsRaw
                ? JSON.parse(existingSnippetsRaw)
                : [];
            existingSnippets.push(snippetPayload);
            localStorage.setItem(
                "flow_editor_snippets",
                JSON.stringify(existingSnippets),
            );

            // Dispatch a window event so FlowAssetHub can re-render
            window.dispatchEvent(new CustomEvent("aone_snippets_updated"));

            toastStore.success(`代码片段 '${snippetName}' 保存成功！`);
        } else if (action === "batch_edit") {
            // P1-8: Batch edit selected nodes
            const selected = nodes.filter((n: FlowNodeType) =>
                selectedNodeIds.has(n.id),
            );
            if (selected.length < 2) {
                toastStore.warning("请至少选择 2 个节点进行批量编辑。");
                return;
            }

            // Show batch edit modal
            isBatchEditOpen = true;
        }
    }

    // NEW: Handle Ctrl+Drag duplicate
    function handleNodeDuplicate(nodeId: string) {
        const sourceNode = nodes.find((n: FlowNodeType) => n.id === nodeId);
        if (!sourceNode) return;

        // Create a duplicate node with offset
        const newNode: FlowNodeType = {
            ...JSON.parse(JSON.stringify(sourceNode)),
            id: crypto.randomUUID(),
            position: {
                x: sourceNode.position.x + 40,
                y: sourceNode.position.y + 40,
            },
            selected: true,
        };

        // Find and duplicate connected edges (but keep source edges to original)
        const newEdges: FlowEdgeType[] = [];
        const connectedEdges = edges.filter(
            (e) => e.source === sourceNode.id || e.target === sourceNode.id,
        );

        for (const edge of connectedEdges) {
            if (edge.source === sourceNode.id) {
                // Edge from source to another node - create edge from newNode
                newEdges.push({
                    ...edge,
                    id: `e-${newNode.id}-${edge.target}-${Date.now()}`,
                    source: newNode.id,
                });
            }
            // Note: We don't create edges targeting sourceNode to avoid complexity
        }

        // Add to history
        historyStore.push({
            execute: () => {
                nodes = [...nodes, newNode, ...newEdges];
                edges = [...edges, ...newEdges];
                selectedNodeIds.clear();
                selectedNodeIds.add(newNode.id);
            },
            undo: () => {
                nodes = nodes.filter((n: FlowNodeType) => n.id !== newNode.id);
                edges = edges.filter(
                    (e: FlowEdgeType) => e.id !== newEdges[0]?.id,
                );
                selectedNodeIds.delete(newNode.id);
            },
        });

        // Execute immediately
        nodes = [...nodes, newNode, ...newEdges];
        edges = [...edges, ...newEdges];
        selectedNodeIds.clear();
        selectedNodeIds.add(newNode.id);
    }

    // ENHANCEMENT 6: Duplicate selected nodes (for D key)
    function duplicateSelectedNodes() {
        if (selectedNodeIds.size === 0) return;

        const selectedIds = Array.from(selectedNodeIds);
        const idMap = new Map<string, string>();
        const newNodes: FlowNodeType[] = [];

        // First pass: create all new nodes
        for (const nodeId of selectedIds) {
            const sourceNode = nodes.find((n: FlowNodeType) => n.id === nodeId);
            if (!sourceNode) continue;

            const newId = crypto.randomUUID();
            idMap.set(nodeId, newId);

            newNodes.push({
                ...JSON.parse(JSON.stringify(sourceNode)),
                id: newId,
                position: {
                    x: sourceNode.position.x + 40,
                    y: sourceNode.position.y + 40,
                },
            });
        }

        // Second pass: create edges between duplicated nodes
        const newEdges: FlowEdgeType[] = [];
        for (const edge of edges) {
            const newSource = idMap.get(edge.source);
            const newTarget = idMap.get(edge.target);

            if (newSource && newTarget) {
                newEdges.push({
                    ...edge,
                    id: `e-${newSource}-${newTarget}-${Date.now()}`,
                    source: newSource,
                    target: newTarget,
                });
            }
        }

        // Add to history
        historyStore.push({
            execute: () => {
                nodes = [...nodes, ...newNodes];
                edges = [...edges, ...newEdges];
                selectedNodeIds.clear();
                for (const n of newNodes) selectedNodeIds.add(n.id);
            },
            undo: () => {
                const newNodeIds = new Set(newNodes.map((n) => n.id));
                const newEdgeIds = new Set(newEdges.map((e) => e.id));
                nodes = nodes.filter(
                    (n: FlowNodeType) => !newNodeIds.has(n.id),
                );
                edges = edges.filter(
                    (e: FlowEdgeType) => !newEdgeIds.has(e.id),
                );
            },
        });

        // Execute
        nodes = [...nodes, ...newNodes];
        edges = [...edges, ...newEdges];
        selectedNodeIds.clear();
        for (const n of newNodes) selectedNodeIds.add(n.id);
    }

    function handleNodeAction(action: string, nodeId: string, data?: any) {
        const node = nodes.find((n: FlowNodeType) => n.id === nodeId);
        if (!node) return;

        if (action === "delete") {
            nodes = nodes.filter((n: FlowNodeType) => n.id !== nodeId);
            edges = edges.filter(
                (e) => e.source !== nodeId && e.target !== nodeId,
            );
        } else if (action === "clone") {
            const newNode = JSON.parse(JSON.stringify(node));
            newNode.id = crypto.randomUUID();
            newNode.position.x += 20;
            newNode.position.y += 20;
            newNode.selected = false;
            nodes = [...nodes, newNode];
        } else if (action === "duplicate" && targetId) {
            const node = nodes.find((n: FlowNodeType) => n.id === targetId);
            if (node) {
                const newNode = {
                    ...node,
                    id: crypto.randomUUID(),
                    position: {
                        x: node.position.x + 20,
                        y: node.position.y + 20,
                    },
                    selected: true,
                };
                historyStore.push({
                    execute: () => {
                        nodes = [...nodes, newNode];
                        selectedNodeIds.add(newNode.id);
                    },
                    undo: () => {
                        nodes = nodes.filter(
                            (n: FlowNodeType) => n.id !== newNode.id,
                        );
                        selectedNodeIds.delete(newNode.id);
                    },
                });
                selectedNodeIds.add(newNode.id);
            }
        } else if (action === "fit_view") {
            handleFitView();
        } else if (action === "toggle_breakpoint" && targetId) {
            const node = nodes.find((n: FlowNodeType) => n.id === targetId);
            if (node) {
                const wasBreakpoint = node.isBreakpoint;
                historyStore.push({
                    execute: () => {
                        const n = nodes.find(
                            (n: FlowNodeType) => n.id === targetId,
                        );
                        if (n) n.isBreakpoint = !wasBreakpoint;
                    },
                    undo: () => {
                        const n = nodes.find(
                            (n: FlowNodeType) => n.id === targetId,
                        );
                        if (n) n.isBreakpoint = wasBreakpoint;
                    },
                });
                node.isBreakpoint = !wasBreakpoint;
            }
        } else if (action === "toggle_error_handler" && targetId) {
            const node = nodes.find((n: FlowNodeType) => n.id === targetId);
            if (node) {
                const wasOnError = node.data.onError;
                historyStore.push({
                    execute: () => {
                        const n = nodes.find(
                            (n: FlowNodeType) => n.id === targetId,
                        );
                        if (n) n.data.onError = !wasOnError;
                    },
                    undo: () => {
                        const n = nodes.find(
                            (n: FlowNodeType) => n.id === targetId,
                        );
                        if (n) n.data.onError = wasOnError;
                    },
                });
                node.data.onError = !wasOnError;
            }
        } else if (action === "inject_data") {
            const node = nodes.find((n: FlowNodeType) => n.id === nodeId);
            if (node) {
                node.executionState = "completed";
                historyStore.push({
                    execute: () => {
                        node.executionState = "completed";
                    },
                    undo: () => {
                        node.executionState = "idle";
                    },
                });
                // Auto-run next steps (Mock)
                setTimeout(() => runExecutionStep(true), 500);
            }
        }
    }

    // --- Visibility Logic ---
    function isNodeHidden(node: FlowNode): boolean {
        if (!node.parentId) return false;
        let curr = node;
        while (curr.parentId) {
            const parent = nodes.find((p) => p.id === curr.parentId);
            if (!parent) break;
            if (parent.collapsed) return true;
            curr = parent;
        }
        return false;
    }

    let visibleNodes = $derived(
        nodes
            .filter((n: FlowNodeType) => !isNodeHidden(n))
            .sort((a, b) => (a.type === "group" || a.type === "loop" ? -1 : 1)),
    );

    let debugState = $state<"idle" | "running" | "paused">("idle");
    let executionTimer: number | undefined;
    let debugToolbar: FlowDebugToolbar | undefined;
    let isTraceOpen = $state(false);
    let traceNodeId = $state<string | null>(null);
    let hoveredEdgeId = $state<string | null>(null);
    let highlightedNodeIds = $state<Set<string> | null>(null);

    // ENHANCEMENT 6: Handle edge hover to highlight connected nodes
    // ENHANCEMENT 7: Also highlight downstream path
    function handleEdgeHover(edgeId: string, isHovered: boolean) {
        if (isHovered) {
            hoveredEdgeId = edgeId;
            // Find connected nodes
            const edge = edges.find((e: FlowEdgeType) => e.id === edgeId);
            if (edge) {
                // ENHANCEMENT 7: Find all downstream nodes and edges
                const downstreamNodes = new Set<string>();
                const downstreamEdges = new Set<string>();

                // Start from the source node and traverse downstream
                const queue = [edge.source];
                downstreamNodes.add(edge.source);

                while (queue.length > 0) {
                    const currentId = queue.shift()!;
                    // Find all edges from current node
                    const outgoingEdges = edges.filter(
                        (e: FlowEdgeType) => e.source === currentId,
                    );
                    for (const outEdge of outgoingEdges) {
                        if (!downstreamEdges.has(outEdge.id)) {
                            downstreamEdges.add(outEdge.id);
                            if (!downstreamNodes.has(outEdge.target)) {
                                downstreamNodes.add(outEdge.target);
                                queue.push(outEdge.target);
                            }
                        }
                    }
                }

                highlightedNodeIds = downstreamNodes;
            }
        } else {
            hoveredEdgeId = null;
            highlightedNodeIds = null;
        }
    }

    let isAssetHubOpen = $state(false);
    let isGlobalsOpen = $state(false);
    let isHistoryOpen = $state(false);

    // ENHANCEMENT 4: Validation Panel
    let isValidationOpen = $state(false);

    // ENHANCEMENT 3: Edge Properties Panel
    let isEdgePropertiesOpen = $state(false);
    let selectedEdge = $state<FlowEdgeType | null>(null);

    // Collaborative presence - empty by default (can be enabled for multi-user)
    let presence = $state<
        { id: string; name: string; color: string; x: number; y: number }[]
    >([]);

    function handleDebugPlay() {
        debugState = "running";
        // Mock Execution Loop
        runExecutionStep();
    }

    function handleDebugPause() {
        debugState = "paused";
        if (executionTimer) clearTimeout(executionTimer);
    }

    function handleDebugStep() {
        // execute one step then pause
        runExecutionStep(true);
    }

    function handleDebugStop() {
        debugState = "idle";
        if (executionTimer) clearTimeout(executionTimer);
        // Reset node states
        nodes.forEach((n: FlowNodeType) => (n.executionState = "idle"));
    }

    function runExecutionStep(singleStep = false) {
        // Find next node to execute
        // Simple mock strategy: find first 'idle' node connected to 'completed' nodes or find start node
        // For demo: just pick a random 'idle' node or sequential

        // 1. Find currently running?
        const runningNode = nodes.find(
            (n: FlowNodeType) => n.executionState === "running",
        );
        if (runningNode) {
            runningNode.executionState = "completed";
            if (debugToolbar) {
                debugToolbar.addLog(
                    runningNode.id,
                    runningNode.data.label,
                    `Node execution completed`,
                    "success",
                );
            }
            // Find targets
            const outEdges = edges.filter(
                (e: FlowEdgeType) => e.source === runningNode.id,
            );
            outEdges.forEach((edge: FlowEdgeType) => {
                const target = nodes.find(
                    (n: FlowNodeType) => n.id === edge.target,
                );
                if (target) target.executionState = "waiting";
            });
        }

        // 2. Find waiting nodes
        const waitingNode = nodes.find(
            (n: FlowNodeType) => n.executionState === "waiting",
        );
        if (waitingNode) {
            // Check breakpoint
            if (
                waitingNode.isBreakpoint &&
                debugState !== "paused" &&
                !singleStep
            ) {
                debugState = "paused";
                if (debugToolbar) {
                    debugToolbar.addLog(
                        waitingNode.id,
                        waitingNode.data.label,
                        `Breakpoint hit, pausing.`,
                        "warn",
                    );
                }
                return; // Stop here
            }

            waitingNode.executionState = "running";
            if (debugToolbar) {
                debugToolbar.addLog(
                    waitingNode.id,
                    waitingNode.data.label,
                    `Node execution started`,
                    "info",
                );
            }
        } else {
            // If no waiting, find Start node if nothing completed yet
            const hasCompleted = nodes.some(
                (n: FlowNodeType) => n.executionState === "completed",
            );
            if (!hasCompleted) {
                const startNode =
                    nodes.find((n: FlowNodeType) => n.type === "start") ||
                    nodes[0];
                if (startNode) {
                    startNode.executionState = "running";
                    if (debugToolbar) {
                        debugToolbar.addLog(
                            startNode.id,
                            startNode.data.label,
                            `Flow execution started`,
                            "info",
                        );
                    }
                }
            } else {
                // Done?
                if (!runningNode) {
                    debugState = "idle"; // Finished
                    return;
                }
            }
        }

        if (!singleStep && debugState === "running") {
            executionTimer = setTimeout(
                () => runExecutionStep(),
                1000,
            ) as unknown as number;
        } else if (singleStep) {
            // If single step, we pause after execution start?
            // Actually 'step' usually means complete current line and move to next.
            // Here we moved state.
            debugState = "paused";
        }
    }

    function handleCanvasDrop(
        e: DragEvent,
        canvasPos: { x: number; y: number },
    ) {
        const raw = e.dataTransfer?.getData("application/json");
        if (!raw) return;

        try {
            const data = JSON.parse(raw);
            if (data.type === "template" && data.payload) {
                const templ = data.payload;

                // Map old IDs to new IDs
                const idMap = new Map<string, string>();

                // Calculate bounding box of template to center it on drop point
                let minX = Infinity,
                    minY = Infinity;
                templ.nodes.forEach((n: any) => {
                    minX = Math.min(minX, n.position.x);
                    minY = Math.min(minY, n.position.y);
                });

                const newNodes = templ.nodes.map((n: any) => {
                    const newId = crypto.randomUUID();
                    idMap.set(n.id, newId);
                    return {
                        ...n,
                        id: newId,
                        position: {
                            x: canvasPos.x + (n.position.x - minX),
                            y: canvasPos.y + (n.position.y - minY),
                        },
                    };
                });

                const newEdges = (templ.edges || [])
                    .map((edge: any) => {
                        const newSource = idMap.get(edge.source);
                        const newTarget = idMap.get(edge.target);
                        if (newSource && newTarget) {
                            return {
                                ...edge,
                                id: crypto.randomUUID(),
                                source: newSource,
                                target: newTarget,
                            };
                        }
                        return null;
                    })
                    .filter(Boolean);

                // History command
                historyStore.push({
                    execute: () => {
                        nodes = [...nodes, ...newNodes];
                        edges = [...edges, ...newEdges];
                        selectedNodeIds.clear();
                        for (const n of newNodes) selectedNodeIds.add(n.id);
                    },
                    undo: () => {
                        const newIds = new Set(newNodes.map((n: any) => n.id));
                        const newEdgeIds = new Set(
                            newEdges.map((e: any) => e.id),
                        );
                        nodes = nodes.filter(
                            (n: FlowNodeType) => !newIds.has(n.id),
                        );
                        edges = edges.filter(
                            (e: FlowEdgeType) => !newEdgeIds.has(e.id),
                        );
                        selectedNodeIds.clear();
                    },
                });

                // Immediate execute
                nodes = [...nodes, ...newNodes];
                edges = [...edges, ...newEdges];
                selectedNodeIds.clear();
                for (const n of newNodes) selectedNodeIds.add(n.id);
            } else if (data.type === "snippet" && data.payload) {
                // P1-4: Handle snippet drop - same logic as template
                const snippet = data.payload;

                // Map old IDs to new IDs
                const idMap = new Map<string, string>();

                // Calculate bounding box to center on drop point
                let minX = Infinity,
                    minY = Infinity;
                snippet.nodes.forEach((n: any) => {
                    minX = Math.min(minX, n.position.x);
                    minY = Math.min(minY, n.position.y);
                });

                const newNodes = snippet.nodes.map((n: any) => {
                    const newId = crypto.randomUUID();
                    idMap.set(n.id, newId);
                    return {
                        ...n,
                        id: newId,
                        position: {
                            x: canvasPos.x + (n.position.x - minX),
                            y: canvasPos.y + (n.position.y - minY),
                        },
                    };
                });

                const newEdges = (snippet.edges || [])
                    .map((edge: any) => {
                        const newSource = idMap.get(edge.source);
                        const newTarget = idMap.get(edge.target);
                        if (newSource && newTarget) {
                            return {
                                ...edge,
                                id: crypto.randomUUID(),
                                source: newSource,
                                target: newTarget,
                            };
                        }
                        return null;
                    })
                    .filter(Boolean);

                // History command
                historyStore.push({
                    execute: () => {
                        nodes = [...nodes, ...newNodes];
                        edges = [...edges, ...newEdges];
                        selectedNodeIds.clear();
                        for (const n of newNodes) selectedNodeIds.add(n.id);
                    },
                    undo: () => {
                        const newIds = new Set(newNodes.map((n: any) => n.id));
                        const newEdgeIds = new Set(
                            newEdges.map((e: any) => e.id),
                        );
                        nodes = nodes.filter(
                            (n: FlowNodeType) => !newIds.has(n.id),
                        );
                        edges = edges.filter(
                            (e: FlowEdgeType) => !newEdgeIds.has(e.id),
                        );
                        selectedNodeIds.clear();
                    },
                });

                // Immediate execute
                nodes = [...nodes, ...newNodes];
                edges = [...edges, ...newEdges];
                selectedNodeIds.clear();
                for (const n of newNodes) selectedNodeIds.add(n.id);
            }
        } catch (err) {
            console.error("Failed to parse dropped template", err);
        }
    }
    // --- Auto-Save Snapshots ---
    let lastSavedHash = "";
    let lastSavedNodeCount = -1;
    let lastSavedEdgeCount = -1;

    onMount(() => {
        const interval = setInterval(async () => {
            if (nodes.length > 0) {
                // Fast path: if length changed or we haven't saved anything yet
                const isDirty = nodes.length !== lastSavedNodeCount || edges.length !== lastSavedEdgeCount;
                if (isDirty) {
                    const currentHash = `${nodes.length}_${edges.length}_${nodes[0]?.id || ''}_${nodes[nodes.length - 1]?.id || ''}`;
                    if (currentHash !== lastSavedHash) {
                        lastSavedHash = currentHash;
                        lastSavedNodeCount = nodes.length;
                        lastSavedEdgeCount = edges.length;
                        await saveSnapshot({
                            id: crypto.randomUUID(),
                            timestamp: Date.now(),
                            description: `Auto-save (${nodes.length} nodes)`,
                            trigger: "auto",
                            nodes: JSON.parse(JSON.stringify(nodes)),
                            edges: JSON.parse(JSON.stringify(edges)),
                        });
                        window.dispatchEvent(
                            new CustomEvent("aone_snapshots_updated"),
                        );
                    }
                }
            }
        }, 30000); // 30 seconds

        return () => {
            clearInterval(interval);
        };
    });

    function handleRestoreSnapshot(snap: FlowSnapshot) {
        historyStore.push({
            execute: () => {
                nodes = JSON.parse(JSON.stringify(snap.nodes));
                edges = JSON.parse(JSON.stringify(snap.edges));
            },
            undo: () => {
                // Not ideal, undoing a full restore might need the PRE-restore state logged
            },
        });
        nodes = JSON.parse(JSON.stringify(snap.nodes));
        edges = JSON.parse(JSON.stringify(snap.edges));
        isHistoryOpen = false;

        if (debugToolbar) {
            debugToolbar.addLog(
                "restore",
                "System",
                `Restored to ${new Date(snap.timestamp).toLocaleTimeString()}`,
                "info",
            );
        }
    }
</script>

<svelte:window onkeydown={handleKeyDown} />

<FlowSearch
    bind:isOpen={isSearchOpen}
    {nodes}
    onSelect={handleSearchSelect}
    onClose={() => (isSearchOpen = false)}
/>

<div
    bind:this={editorContainer}
    class="w-full h-full text-slate-900 dark:text-slate-100 font-sans relative"
    oncontextmenu={handleContextMenu}
    role="presentation"
>
    <FlowCanvas
        bind:viewport
        onBoxSelect={handleBoxSelect}
        {onCanvasDoubleClick}
        onDrop={handleCanvasDrop}
        {gridType}
        {gridColor}
        {presence}
    >
        <!-- Edges Layer (Bottom) -->
        <svg
            class="absolute inset-0 overflow-visible pointer-events-none w-full h-full"
            style="z-index: 0;"
        >
            {#each edges as edge (edge.id)}
                {@const source = nodes.find(
                    (n: FlowNodeType) => n.id === edge.source,
                )}
                {@const target = nodes.find(
                    (n: FlowNodeType) => n.id === edge.target,
                )}
                {#if source && target}
                    <g
                        class="transition-all duration-300 pointer-events-auto {highlightedNodeIds &&
                        (!highlightedNodeIds.has(source.id) ||
                            !highlightedNodeIds.has(target.id))
                            ? 'opacity-10'
                            : 'opacity-100'}"
                    >
                        <FlowEdge
                            {edge}
                            sourceNode={source}
                            targetNode={target}
                            selected={selectedEdgeId === edge.id}
                            onSelect={handleEdgeSelect}
                            onHover={handleEdgeHover}
                            type="step"
                        />
                    </g>
                {/if}
            {/each}

            <!-- Temp Connection Line -->
            {#if connectingNodeId && connectionMousePos}
                {@const source = nodes.find(
                    (n: FlowNodeType) => n.id === connectingNodeId,
                )}
                {#if source}
                    {@const sourceW = source.data?.style?.width || 256}
                    {@const sourceH = source.data?.style?.height || 100}
                    {@const sx = source.position.x + sourceW}
                    {@const sy = source.position.y + sourceH / 2}

                    <!-- ENHANCEMENT 4: Show all valid connection targets as pulse indicators -->
                    {#each validConnectionTargets as validTarget}
                        {@const targetNode = nodes.find(
                            (n: FlowNodeType) => n.id === validTarget.nodeId,
                        )}
                        {#if targetNode && validTarget.nodeId !== snapTarget?.nodeId}
                            <circle
                                cx={validTarget.x}
                                cy={validTarget.y}
                                r="12"
                                fill="none"
                                stroke="#3b82f6"
                                stroke-width="1.5"
                                stroke-dasharray="3,3"
                                class="animate-ping opacity-50"
                            />
                            <circle
                                cx={validTarget.x}
                                cy={validTarget.y}
                                r="4"
                                fill="#3b82f6"
                                class="opacity-70"
                            />
                        {/if}
                    {/each}

                    <!-- ENHANCEMENT 2: Use step path calculation when has valid snap target -->
                    {@const targetX = snapTarget
                        ? snapTarget.x
                        : connectionMousePos.x}
                    {@const targetY = snapTarget
                        ? snapTarget.y
                        : connectionMousePos.y}

                    <!-- Calculate full path for preview -->
                    {@const hasValidTarget = snapTarget !== null}
                    {@const previewPath = hasValidTarget
                        ? (() => {
                              const targetNode = nodes.find(
                                  (n: FlowNodeType) =>
                                      n.id === snapTarget?.nodeId,
                              );
                              if (!targetNode) return "";
                              const targetW =
                                  targetNode.data?.style?.width || 256;
                              const targetH =
                                  targetNode.data?.style?.height || 100;
                              return calculateStepPath(
                                  {
                                      x: source.position.x,
                                      y: source.position.y,
                                  },
                                  { width: sourceW, height: sourceH },
                                  {
                                      x: targetNode.position.x,
                                      y: targetNode.position.y,
                                  },
                                  { width: targetW, height: targetH },
                              );
                          })()
                        : `M ${sx} ${sy} C ${sx + 50} ${sy}, ${targetX - 50} ${targetY}, ${targetX} ${targetY}`}

                    {@const strokeColor = !connectionValid
                        ? "#ef4444"
                        : snapTarget
                          ? "#22c55e"
                          : "#3b82f6"}
                    {@const strokeWidth =
                        !connectionValid || snapTarget ? 3 : 2}

                    <!-- Preview path shadow for depth effect -->
                    <path
                        d={previewPath}
                        stroke="black"
                        stroke-width={strokeWidth + 4}
                        stroke-opacity="0.15"
                        fill="none"
                        class="transition-all duration-150"
                    />
                    <!-- Main preview path -->
                    <path
                        d={previewPath}
                        stroke={strokeColor}
                        stroke-width={strokeWidth}
                        stroke-dasharray={snapTarget ? "0" : "8,4"}
                        fill="none"
                        class="transition-all duration-150"
                    />

                    <!-- Arrow head at end -->
                    {#if hasValidTarget}
                        <polygon
                            points={`${targetX},${targetY - 6} ${targetX + 10},${targetY} ${targetX},${targetY + 6}`}
                            fill={strokeColor}
                            class="transition-all duration-150"
                        />
                    {/if}

                    <!-- Snap target indicator -->
                    {#if snapTarget}
                        <circle
                            cx={snapTarget.x}
                            cy={snapTarget.y}
                            r="10"
                            fill="none"
                            stroke="#22c55e"
                            stroke-width="2.5"
                            class="animate-pulse"
                        />
                    {/if}

                    <!-- Connection end point -->
                    <circle
                        cx={targetX}
                        cy={targetY}
                        r="5"
                        fill={strokeColor}
                        stroke="white"
                        stroke-width="1.5"
                        class="transition-all duration-150"
                    />

                    <!-- Source node highlight -->
                    <rect
                        x={source.position.x - 2}
                        y={source.position.y - 2}
                        width={sourceW + 4}
                        height={sourceH + 4}
                        fill="none"
                        stroke="#3b82f6"
                        stroke-width="2"
                        stroke-dasharray="4,2"
                        rx="12"
                        class="animate-pulse opacity-70"
                    />

                    <!-- Warning tooltip -->
                    {#if connectionWarning}
                        <foreignObject
                            x={Math.min(targetX + 15, editorDims.w - 150)}
                            y={targetY - 30}
                            width="160"
                            height="40"
                        >
                            <div
                                class="bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap"
                            >
                                {connectionWarning}
                            </div>
                        </foreignObject>
                    {/if}
                {/if}
            {/if}
        </svg>

        <!-- Nodes Layer (Top) -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="absolute inset-0 pointer-events-none"
            style="z-index: 1;"
            onclick={handleBackgroundClick}
        >
            {#each visibleNodes as node (node.id)}
                <div class="pointer-events-auto contents">
                    <div
                        class="transition-all duration-300 {highlightedNodeIds &&
                        !highlightedNodeIds.has(node.id)
                            ? 'opacity-20 grayscale brightness-75'
                            : 'opacity-100'}"
                    >
                        <FlowNode
                            bind:node={
                                nodes[
                                    nodes.findIndex(
                                        (n: FlowNodeType) => n.id === node.id,
                                    )
                                ]
                            }
                            selected={selectedNodeIds.has(node.id)}
                            executing={executingNodeId === node.id}
                            onSelect={(id, e) => handleNodeSelect(id, e)}
                            onDragStart={handleNodeDragStart}
                            onDrag={handleNodeDrag}
                            onDragEnd={handleNodeDragEnd}
                            onDuplicate={(id) => handleNodeDuplicate(id)}
                            onConnectStart={handleConnectStart}
                            onConnectEnd={handleConnectEnd}
                            onHandleContextMenu={handleHandleContextMenu}
                            onAction={handleNodeAction}
                            zoom={viewport.zoom}
                            {nodes}
                            {edges}
                        />
                    </div>
                </div>
            {/each}
        </div>

        <!-- Alignment Guides Layer (Topmost) -->
        <svg
            class="absolute inset-0 pointer-events-none overflow-visible w-full h-full"
            style="z-index: 50;"
        >
            {#each alignmentLines as line}
                <line
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke="#ec4899"
                    stroke-width="1"
                    stroke-dasharray="4,4"
                />
            {/each}
        </svg>

        <div class="absolute bottom-4 left-4 z-50">
            <FlowMinimap
                {nodes}
                bind:viewport
                nodeColor="#94a3b8"
                viewportW={editorDims.w}
                viewportH={editorDims.h}
            />
        </div>

        <div class="absolute top-4 right-4 z-50 flex flex-col items-end gap-2">
            <FlowToolbar
                onAutoLayout={handleAutoLayout}
                onAlign={handleAlign}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onFitView={handleFitView}
                onSearch={handleSearchOpen}
                onOpenAssetHub={() => (isAssetHubOpen = true)}
                onOpenGlobals={() => (isGlobalsOpen = true)}
                onOpenHistory={() => (isHistoryOpen = true)}
                onExport={handleExport}
                onImport={handleImport}
            />
            <FlowShortcuts />

            <!-- ENHANCEMENT 3: Connection Mode Indicator -->
            {#if isConnectMode}
                <div
                    class="mt-2 px-3 py-2 bg-green-500 text-white rounded-lg shadow-lg flex items-center gap-2 animate-pulse"
                >
                    <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                    </svg>
                    <span class="text-xs font-medium">
                        {#if connectModeSource}
                            点击目标节点创建连接
                        {:else}
                            点击源节点开始连接
                        {/if}
                    </span>
                    <button
                        class="ml-2 hover:bg-green-600 rounded px-1"
                        title="Exit connection mode"
                        aria-label="Exit connection mode"
                        onclick={() => {
                            isConnectMode = false;
                            connectModeSource = null;
                        }}
                    >
                        <svg
                            class="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
            {/if}

            <!-- ENHANCEMENT 14: Smart Connection Suggestions -->
            {#if connectionSuggestions.length > 0 && !isConnectMode && !isNavConnectMode}
                <div
                    class="mt-2 px-3 py-2 bg-slate-800 text-white rounded-lg shadow-lg"
                >
                    <div class="text-xs font-medium mb-2 text-slate-300">
                        连接建议
                    </div>
                    <div class="space-y-1">
                        {#each connectionSuggestions as suggestion}
                            <button
                                class="w-full text-left px-2 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-between"
                                onclick={() => {
                                    // Connect to this node
                                    const sourceId =
                                        Array.from(selectedNodeIds)[0];
                                    if (sourceId && suggestion.nodeId) {
                                        const newEdgeId = `e-${sourceId}-${suggestion.nodeId}-${Date.now()}`;
                                        const newEdge = {
                                            id: newEdgeId,
                                            source: sourceId,
                                            target: suggestion.nodeId,
                                        };
                                        edges = [...edges, newEdge];
                                    }
                                }}
                            >
                                <span>{suggestion.label}</span>
                                <span class="text-slate-400 text-[10px]"
                                    >{suggestion.reason}</span
                                >
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}

            <!-- ENHANCEMENT 1: Navigation Connection Mode Indicator -->
            {#if isNavConnectMode}
                <div
                    class="mt-2 px-3 py-2 bg-blue-500 text-white rounded-lg shadow-lg flex items-center gap-2"
                >
                    <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M7 8l4 4m0 0l-4 4m4-4H3"
                        />
                    </svg>
                    <span class="text-xs font-medium">
                        {#if navConnectTarget}
                            按回车连接至目标 / 方向键切换 / Esc退出
                        {:else}
                            方向键选择目标节点 / 回车连接 / Esc退出
                        {/if}
                    </span>
                    <button
                        class="ml-2 hover:bg-blue-600 rounded px-1"
                        title="Exit navigation connection mode"
                        aria-label="Exit navigation connection mode"
                        onclick={() => {
                            isNavConnectMode = false;
                            navConnectSource = null;
                            navConnectTarget = null;
                        }}
                    >
                        <svg
                            class="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
            {/if}
        </div>
    </FlowCanvas>

    {#if contextMenu}
        <FlowContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            type={contextMenu.type}
            targetId={contextMenu.targetId}
            onClose={() => (contextMenu = null)}
            onAction={handleContextAction}
        />
    {/if}

    <!-- ENHANCEMENT: Handle Context Menu for Quick Connect and Node Creation -->
    {#if handleContextMenuState}
        <div
            class="fixed z-[100] bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 min-w-[180px]"
            style="left: {handleContextMenuState.x}px; top: {handleContextMenuState.y}px;"
        >
            <div
                class="px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700"
            >
                {handleContextMenuState.handleType === "output"
                    ? "输出连接"
                    : "输入连接"}
            </div>

            {#if handleContextMenuState.handleType === "output"}
                <div class="py-1">
                    <button
                        class="w-full px-3 py-1.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                        onclick={() =>
                            connectToNode(handleContextMenuState!.nodeId)}
                    >
                        <span class="text-blue-500">→</span>
                        连接至节点...
                    </button>
                </div>

                <div
                    class="border-t border-slate-200 dark:border-slate-700 py-1"
                >
                    <div class="px-3 py-1 text-xs text-slate-400">快速创建</div>
                    <button
                        class="w-full px-3 py-1.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                        onclick={() => createNodeAtHandle("agent")}
                    >
                        <Users class="w-4 h-4 text-violet-500" />
                        Agent 节点
                    </button>
                    <button
                        class="w-full px-3 py-1.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                        onclick={() => createNodeAtHandle("skill")}
                    >
                        <Zap class="w-4 h-4 text-emerald-500" />
                        Skill 节点
                    </button>
                    <button
                        class="w-full px-3 py-1.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                        onclick={() => createNodeAtHandle("condition")}
                    >
                        <GitBranch class="w-4 h-4 text-amber-500" />
                        条件节点
                    </button>
                    <button
                        class="w-full px-3 py-1.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                        onclick={() => createNodeAtHandle("router")}
                    >
                        <Navigation class="w-4 h-4 text-blue-500" />
                        路由节点
                    </button>
                    <button
                        class="w-full px-3 py-1.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                        onclick={() => createNodeAtHandle("end")}
                    >
                        <Square class="w-4 h-4 text-slate-500" />
                        结束节点
                    </button>
                </div>
            {:else}
                <div class="px-3 py-2 text-xs text-slate-400">
                    右键输出句柄创建新连接
                </div>
            {/if}

            <div class="border-t border-slate-200 dark:border-slate-700 py-1">
                <button
                    class="w-full px-3 py-1.5 text-left text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                    onclick={closeHandleContextMenu}
                >
                    取消
                </button>
            </div>
        </div>

        <!-- Backdrop to close menu -->
        <div
            class="fixed inset-0 z-[99]"
            onclick={closeHandleContextMenu}
            onkeydown={(e) => {
                if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    closeHandleContextMenu();
                }
            }}
            oncontextmenu={(e) => {
                e.preventDefault();
                closeHandleContextMenu();
            }}
            role="button"
            tabindex="0"
            aria-label="Close handle context menu"
        ></div>
    {/if}

    {#if isSearchOpen}
        <FlowSearch
            {nodes}
            onSelectNode={handleSearchSelect}
            onClose={handleSearchClose}
        />
    {/if}

    <!-- P1-8: Batch Edit Modal -->
    {#if isBatchEditOpen}
        <div
            class="fixed inset-0 z-50 bg-black/30 flex items-center justify-center"
            onclick={() => (isBatchEditOpen = false)}
            onkeydown={(e) => e.key === "Escape" && (isBatchEditOpen = false)}
            role="dialog"
            tabindex="-1"
        >
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <div
                class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-96 max-h-[80vh] overflow-hidden"
                onclick={(e) => e.stopPropagation()}
                role="document"
            >
                <div
                    class="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between"
                >
                    <h3
                        class="font-semibold text-slate-800 dark:text-slate-200"
                    >
                        Batch Edit ({selectedNodeIds.size} nodes)
                    </h3>
                    <button
                        class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Close batch edit"
                        aria-label="Close batch edit"
                        onclick={() => (isBatchEditOpen = false)}
                    >
                        <X size={18} class="text-slate-500" />
                    </button>
                </div>
                <div class="p-4 space-y-4">
                    <!-- Batch Color -->
                    <div class="space-y-2">
                        <div
                            class="text-sm font-medium text-slate-700 dark:text-slate-300"
                            >Set Color</div
                        >
                        <div class="flex gap-2 flex-wrap">
                            {#each ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6"] as color}
                                <button
                                    class="w-8 h-8 rounded-lg border-2 {batchEditColor ===
                                    color
                                        ? 'border-slate-800 dark:border-white'
                                        : 'border-transparent'}"
                                    style="background-color: {color}"
                                    title={`Set batch color ${color}`}
                                    aria-label={`Set batch color ${color}`}
                                    onclick={() => (batchEditColor = color)}
                                ></button>
                            {/each}
                            <button
                                class="w-8 h-8 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                                title="Clear batch color"
                                aria-label="Clear batch color"
                                onclick={() => (batchEditColor = null)}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    <!-- Batch Prefix -->
                    <div class="space-y-2">
                        <label
                            class="text-sm font-medium text-slate-700 dark:text-slate-300"
                            for="batch-edit-prefix"
                            >Add Prefix to Labels</label
                        >
                        <input
                            id="batch-edit-prefix"
                            type="text"
                            bind:value={batchEditPrefix}
                            placeholder="e.g., Step_"
                            class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                        />
                    </div>

                    <!-- Apply Button -->
                    <button
                        class="w-full py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                        onclick={() => {
                            // Apply batch edits
                            const selected = nodes.filter((n: FlowNodeType) =>
                                selectedNodeIds.has(n.id),
                            );
                            const updatedNodes = nodes.map(
                                (n: FlowNodeType) => {
                                    if (selectedNodeIds.has(n.id)) {
                                        let newData = { ...n.data };
                                        if (batchEditColor) {
                                            newData.color = batchEditColor;
                                        }
                                        if (batchEditPrefix) {
                                            newData.label =
                                                batchEditPrefix +
                                                (n.data?.label || n.type);
                                        }
                                        return { ...n, data: newData };
                                    }
                                    return n;
                                },
                            );
                            nodes = updatedNodes;
                            isBatchEditOpen = false;
                            batchEditColor = null;
                            batchEditPrefix = "";
                        }}
                    >
                        Apply Changes
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <FlowTracePanel
        bind:isOpen={isTraceOpen}
        node={nodes.find((n: FlowNodeType) => n.id === traceNodeId) || null}
        onClose={() => {
            isTraceOpen = false;
        }}
    />

    <FlowAssetHub
        bind:isOpen={isAssetHubOpen}
        onClose={() => (isAssetHubOpen = false)}
    />

    <FlowGlobalVariables
        bind:isOpen={isGlobalsOpen}
        onClose={() => (isGlobalsOpen = false)}
    />

    <FlowVersionHistory
        bind:isOpen={isHistoryOpen}
        onClose={() => (isHistoryOpen = false)}
        onRestore={handleRestoreSnapshot}
    />

    <FlowToast />

    <!-- ENHANCEMENT 4: Validation Panel -->
    <FlowValidationPanel
        bind:isOpen={isValidationOpen}
        {nodes}
        {edges}
        onIssueClick={(issue) => {
            if (issue.nodeId) {
                selectedNodeIds.clear();
                selectedNodeIds.add(issue.nodeId);
                // Zoom to node would go here
            }
        }}
    />

    <!-- ENHANCEMENT 3: Edge Properties Panel -->
    <FlowEdgeProperties
        bind:edge={selectedEdge}
        bind:isOpen={isEdgePropertiesOpen}
        onDelete={(edgeId) => {
            edges = edges.filter((e: FlowEdgeType) => e.id !== edgeId);
            selectedEdgeId = null;
            selectedEdge = null;
        }}
        onCopy={(edgeId) => {
            // Copy edge functionality
            const edge = edges.find((e: FlowEdgeType) => e.id === edgeId);
            if (edge) {
                const newEdge = {
                    ...edge,
                    id: `e-${edge.source}-${edge.target}-${Date.now()}`,
                };
                edges = [...edges, newEdge];
            }
        }}
    />

    <div class="absolute top-4 left-1/2 -translate-x-1/2 z-50">
        <FlowDebugToolbar
            bind:this={debugToolbar}
            flowState={debugState}
            onPlay={handleDebugPlay}
            onPause={handleDebugPause}
            onStep={handleDebugStep}
            onStop={handleDebugStop}
        />
    </div>

    <!-- P1-12: Minimap Navigation -->
    <div class="absolute bottom-4 right-4 z-50">
        <FlowMinimap
            {nodes}
            bind:viewport
            viewportW={editorDims.w}
            viewportH={editorDims.h}
        />
    </div>
</div>
