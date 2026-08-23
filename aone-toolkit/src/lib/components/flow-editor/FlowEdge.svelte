<script lang="ts">
    import type { FlowEdge, FlowNode } from "./types";

    let {
        edge,
        sourceNode,
        targetNode,
        selected = false,
        animated = false,
        type = "bezier",
        onSelect = () => {},
        onHover = () => {},
    } = $props<{
        edge: FlowEdge;
        sourceNode: FlowNode;
        targetNode: FlowNode;
        selected?: boolean;
        animated?: boolean;
        type?: "bezier" | "step" | "straight";
        onSelect?: (id: string) => void;
        onHover?: (edgeId: string, isHovered: boolean) => void;
    }>();

    // ENHANCEMENT 3: Use edge properties for rendering
    let edgeType = $derived(edge.type || type);
    let edgeStyle = $derived(edge.style || 'solid');
    let strokeWidth = $derived(edge.strokeWidth || 2);
    let strokeColor = $derived(edge.strokeColor || '#64748b');
    let arrowStyle = $derived(edge.arrowStyle || 'arrow');
    let bidirectional = $derived(edge.bidirectional || false);
    let virtual = $derived(edge.virtual || false);
    let edgeComment = $derived(edge.comment || '');

    // Convert style to stroke-dasharray
    let dashArray = $derived.by(() => {
        if (edgeStyle === 'dashed') return "10,5";
        if (edgeStyle === 'dotted') return "2,4";
        return "0";
    });

    let showTooltip = $state(false);
    let tooltipPos = $state({ x: 0, y: 0 });

    // ENHANCEMENT 2: Connection Type Visualization
    // Infer data type based on source node type
    let inferredType = $derived.by(() => {
        if (!sourceNode) return "Any";
        
        switch (sourceNode.type) {
            case "agent":
                return "JSON";
            case "skill":
                return "Object";
            case "router":
            case "condition":
                return "Boolean";
            case "broadcast":
                return "Event";
            case "listen":
                return "Event";
            default:
                return "Any";
        }
    });
    
    // Check if connection has issues
    let connectionIssue = $derived.by(() => {
        if (!sourceNode || !targetNode) return null;
        
        // Self-loop check
        if (sourceNode.id === targetNode.id) {
            return { type: "error", message: "Self-loop detected" };
        }
        
        return null;
    });
    
    // ENHANCEMENT 8: Runtime Execution State
    let edgeExecutionState = $derived.by(() => {
        if (!sourceNode || !targetNode) return null;
        
        const sourceState = sourceNode.executionState;
        const targetState = targetNode.executionState;
        
        // If source is running, edge is active
        if (sourceState === "running") return "running";
        
        // If target is waiting, edge has data flowing
        if (sourceState === "completed" && targetState === "waiting") return "waiting";
        
        // If target is completed, edge is completed
        if (targetState === "completed") return "completed";
        
        // If target has error, edge has error
        if (targetState === "error") return "error";
        
        return null;
    });

    // Get edge style based on execution state
    let edgeStateStyle = $derived.by(() => {
        if (edgeExecutionState === "running") {
            return {
                stroke: "#3b82f6",
                animated: true,
                dashArray: "0",
                class: "animate-pulse"
            };
        }
        if (edgeExecutionState === "waiting") {
            return {
                stroke: "#f59e0b",
                animated: true,
                dashArray: "5,5",
                class: ""
            };
        }
        if (edgeExecutionState === "completed") {
            return {
                stroke: "#22c55e",
                animated: false,
                dashArray: "0",
                class: ""
            };
        }
        if (edgeExecutionState === "error") {
            return {
                stroke: "#ef4444",
                animated: false,
                dashArray: "5,5",
                class: ""
            };
        }
        return null;
    });

    // Calculate path
    let path = $derived.by(() => {
        if (!sourceNode || !targetNode) return "";

        // Get actual dimensions or defaults
        const srcW =
            sourceNode.data?.style?.width ||
            (sourceNode.type === "group" ? 400 : 256);
        const srcH =
            sourceNode.data?.style?.height ||
            (sourceNode.type === "group" ? 300 : 100);
        const tgtW =
            targetNode.data?.style?.width ||
            (targetNode.type === "group" ? 400 : 256);
        const tgtH =
            targetNode.data?.style?.height ||
            (targetNode.type === "group" ? 300 : 100);

        // Assume handles are: Source Right-Center, Target Left-Center
        const sx = sourceNode.position.x + srcW;
        const sy = sourceNode.position.y + srcH / 2;
        const tx = targetNode.position.x;
        const ty = targetNode.position.y + tgtH / 2;

        // ENHANCEMENT 3: Use edgeType from edge properties
        if (edgeType === "straight") {
            return `M ${sx} ${sy} L ${tx} ${ty}`;
        }

        if (edgeType === "step") {
            const borderRadius = 8;
            const gap = 30;

            let points: { x: number; y: number }[] = [];
            points.push({ x: sx, y: sy });

            // Ensure source bounding box avoidance
            const srcRight = sx + gap;

            // Ensure target bounding box avoidance
            const tgtLeft = tx - gap;

            if (tgtLeft > srcRight) {
                // Target is comfortably to the right. Use a standard Z shape.
                const midX = (srcRight + tgtLeft) / 2;
                points.push({ x: midX, y: sy });
                points.push({ x: midX, y: ty });
                points.push({ x: tx, y: ty });
            } else {
                // Target is left of source or too close horizontally. Route around.
                // We'll go right, then down/up, then left, then down/up to target.
                const verticalGap = 40;

                // Determine whether to go around top or bottom of the source node
                // If target is above source, route above. Else route below.
                const midY =
                    ty > sy
                        ? Math.max(sy + srcH / 2, ty + tgtH / 2) + verticalGap
                        : Math.min(sy - srcH / 2, ty - tgtH / 2) - verticalGap;

                // Path: [Start] -> [Right Of Source] -> [Clear Vertically] -> [Left of Target] -> [Target Level] -> [Target]
                points.push({ x: srcRight, y: sy });
                points.push({ x: srcRight, y: midY });
                points.push({ x: tgtLeft, y: midY });
                points.push({ x: tgtLeft, y: ty });
                points.push({ x: tx, y: ty });
            }

            // Render path with rounded orthogonal corners
            if (points.length < 2) return `M ${sx} ${sy}`;

            let res = `M ${points[0].x} ${points[0].y}`;

            for (let i = 1; i < points.length; i++) {
                const curr = points[i];
                if (i === points.length - 1) {
                    // Last point, just draw line
                    res += ` L ${curr.x} ${curr.y}`;
                    break;
                }

                const prev = points[i - 1];
                const next = points[i + 1];

                // Determine bend direction
                const dx1 = curr.x - prev.x;
                const dy1 = curr.y - prev.y;
                const dx2 = next.x - curr.x;
                const dy2 = next.y - curr.y;

                // Calculate the actual radius to use (can't be larger than half the segment length)
                const seg1Len = Math.sqrt(dx1 * dx1 + dy1 * dy1);
                const seg2Len = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                const r = Math.min(borderRadius, seg1Len / 2, seg2Len / 2);

                if (r === 0) {
                    res += ` L ${curr.x} ${curr.y}`;
                    continue;
                }

                // Point before the curve
                const p1x =
                    curr.x - (dx1 === 0 ? 0 : (dx1 / Math.abs(dx1)) * r);
                const p1y =
                    curr.y - (dy1 === 0 ? 0 : (dy1 / Math.abs(dy1)) * r);

                // Point after the curve
                const p2x =
                    curr.x + (dx2 === 0 ? 0 : (dx2 / Math.abs(dx2)) * r);
                const p2y =
                    curr.y + (dy2 === 0 ? 0 : (dy2 / Math.abs(dy2)) * r);

                res += ` L ${p1x} ${p1y}`;
                // Sweep flag depends on the turn direction
                // Cross product to determine Left or Right turn
                const crossProduct = dx1 * dy2 - dy1 * dx2;
                const sweepFlag = crossProduct > 0 ? 1 : 0;

                res += ` A ${r} ${r} 0 0 ${sweepFlag} ${p2x} ${p2y}`;
            }
            return res;
        }

        // Default Bezier
        // Adjust control points based on distance logic to avoid weird loops
        const dist = Math.sqrt((tx - sx) ** 2 + (ty - sy) ** 2);
        const minControl = 50;
        const maxControl = 150;
        const controlOffset = Math.min(
            maxControl,
            Math.max(minControl, dist * 0.4),
        );

        // If target is behind source, push control points further out vertically?
        // Standard Cubic Bezier
        // logic for "loop back":
        if (tx < sx) {
            // Target is left of source.
            // Push control points vertically away?
            // Or just make them very wide?
            // ReactFlow does: sx + offset, tx - offset.
            // If tx < sx, (sx+offset) is RIGHT, (tx-offset) is LEFT.
            // This creates a "S" shape that might overlap nodes if they are close vertically.
            // But it is the standard "Bezier".
            // We can improve curvature.
            return `M ${sx} ${sy} C ${sx + controlOffset} ${sy}, ${tx - controlOffset} ${ty}, ${tx} ${ty}`;
        }

        return `M ${sx} ${sy} C ${sx + controlOffset} ${sy}, ${tx - controlOffset} ${ty}, ${tx} ${ty}`;
    });
</script>

<g
    class="group cursor-pointer"
    onclick={(e) => {
        e.stopPropagation();
        onSelect(edge.id);
    }}
    onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            onSelect(edge.id);
        }
    }}
    onmouseenter={(e) => {
        showTooltip = true;
        tooltipPos = { x: e.clientX, y: e.clientY };
        onHover(edge.id, true);
    }}
    onmousemove={(e) => {
        if (showTooltip) {
            tooltipPos = { x: e.clientX, y: e.clientY };
        }
    }}
    onmouseleave={() => {
        showTooltip = false;
        onHover(edge.id, false);
    }}
    role="button"
    tabindex="0"
    aria-label={`Select edge ${edge.label || edge.id}`}
>
    <!-- Invisible wide path for easier selection -->
    {#if !virtual}
    <path d={path} fill="none" stroke="transparent" stroke-width="20" />

    <!-- Visible path -->
    <!-- ENHANCEMENT 2: Show error state on edge -->
    <!-- ENHANCEMENT 5: Enhanced flow animation -->
    <!-- ENHANCEMENT 8: Show execution state on edge -->
    <!-- ENHANCEMENT 3: Use edge properties -->
    <path
        d={path}
        fill="none"
        class="transition-all duration-300
        {selected
            ? 'stroke-blue-500 stroke-[3px]'
            : connectionIssue?.type === 'error'
              ? 'stroke-red-500 stroke-[2px]'
              : edgeStateStyle 
                ? `stroke-[${edgeStateStyle.stroke}]`
                : ''}
        {edgeStateStyle?.animated || animated ? 'animate-flow' : ''}"
        stroke={selected ? '#3b82f6' : connectionIssue?.type === 'error' ? '#ef4444' : (edgeStateStyle?.stroke || strokeColor)}
        stroke-width={selected ? 3 : strokeWidth}
        stroke-dasharray={edgeStateStyle?.dashArray || dashArray}
    />
    
    <!-- ENHANCEMENT 4: Bidirectional arrow -->
    {#if bidirectional}
        <!-- Reverse arrow at target -->
        {@const midX = (sourceNode && targetNode) ? (sourceNode.position.x + (sourceNode.data?.style?.width || 256) + targetNode.position.x) / 2 : 0}
        {@const midY = (sourceNode && targetNode) ? (sourceNode.position.y + targetNode.position.y) / 2 : 0}
        <path
            d={path}
            fill="none"
            stroke={strokeColor}
            stroke-width={strokeWidth}
            marker-end="url(#arrowhead-reverse)"
            transform="scale(-1, 1)"
            transform-origin="{midX} {midY}"
        />
    {/if}

    <!-- Arrow head -->
    {#if arrowStyle !== 'none'}
        <defs>
            <marker
                id="arrowhead-{edge.id}"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
            >
                <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill={selected ? '#3b82f6' : connectionIssue?.type === 'error' ? '#ef4444' : strokeColor}
                />
            </marker>
        </defs>
        <path
            d={path}
            fill="none"
            marker-end="url(#arrowhead-{edge.id})"
        />
    {/if}
    
    <!-- ENHANCEMENT 5: Animated flowing dot for running/waiting edges -->
    {#if edgeStateStyle?.animated || animated}
        <circle r="5" fill={edgeStateStyle?.stroke || "#3b82f6"} filter="drop-shadow(0 0 3px white)">
            <animateMotion 
                dur={edgeStateStyle?.animated && edgeStateStyle.dashArray === "5,5" ? "1s" : "2s"} 
                repeatCount="indefinite"
            >
                <mpath href="#edge-path-{edge.id}" />
            </animateMotion>
        </circle>
        <!-- Invisible path for animation reference -->
        <path id="edge-path-{edge.id}" d={path} fill="none" stroke="transparent" />
    {/if}
    {/if}

    <!-- ENHANCEMENT 2: Type Label on Edge -->
    <!-- ENHANCEMENT 3: Show edge label if exists -->
    {#if !selected && !connectionIssue && !virtual}
        {@const midX = (sourceNode && targetNode) ? (sourceNode.position.x + (sourceNode.data?.style?.width || 256) + targetNode.position.x) / 2 : 0}
        {@const midY = (sourceNode && targetNode) ? (sourceNode.position.y + targetNode.position.y) / 2 : 0}
        <g class="opacity-0 group-hover:opacity-100 transition-opacity">
            {#if edge.label}
            <!-- Show label if exists -->
            <rect
                x={midX - 30}
                y={midY - 12}
                width="60"
                height="24"
                rx="4"
                fill="white"
                stroke="currentColor"
                class="stroke-slate-300 dark:stroke-slate-600"
            />
            <text
                x={midX}
                y={midY + 4}
                text-anchor="middle"
                class="text-[10px] fill-slate-600 dark:fill-slate-400 font-medium"
            >
                {edge.label}
            </text>
            {:else}
            <!-- Show type label -->
            <rect
                x={midX - 20}
                y={midY - 10}
                width="40"
                height="20"
                rx="4"
                fill="white"
                stroke="currentColor"
                class="stroke-slate-300 dark:stroke-slate-600"
            />
            <text
                x={midX}
                y={midY + 4}
                text-anchor="middle"
                class="text-[8px] fill-slate-600 dark:fill-slate-400 font-mono"
            >
                {inferredType}
            </text>
            {/if}
        </g>
    {/if}

    {#if animated}
        <circle r="4" fill="#3b82f6">
            <animateMotion dur="1.5s" repeatCount="indefinite" {path} />
        </circle>
    {/if}
    
    <!-- ENHANCEMENT 2: Error indicator -->
    {#if connectionIssue}
        {@const midX = (sourceNode && targetNode) ? (sourceNode.position.x + (sourceNode.data?.style?.width || 256) + targetNode.position.x) / 2 : 0}
        {@const midY = (sourceNode && targetNode) ? (sourceNode.position.y + targetNode.position.y) / 2 : 0}
        <g>
            <circle
                cx={midX}
                cy={midY}
                r="8"
                fill="#ef4444"
                class="animate-pulse"
            />
            <text
                x={midX}
                y={midY + 3}
                text-anchor="middle"
                class="text-[8px] fill-white font-bold"
            >
                !
            </text>
        </g>
    {/if}
</g>

{#if showTooltip}
    <!-- ENHANCEMENT 2: Enhanced Tooltip with Type Info -->
    <!-- ENHANCEMENT 3: Show edge label and comment -->
    <foreignObject
        x={tooltipPos.x + 10}
        y={tooltipPos.y - 30}
        width="220"
        height={connectionIssue ? 100 : (edgeComment ? 130 : 100)}
        class="pointer-events-none z-50 overflow-visible"
    >
        <div
            class="bg-slate-800 dark:bg-slate-900 text-white text-[10px] px-2 py-1.5 rounded-md shadow-lg border {connectionIssue?.type === 'error' ? 'border-red-500' : 'border-slate-700'} font-mono"
        >
            <div class="font-bold flex items-center gap-1 mb-1">
                <div class="w-1.5 h-1.5 rounded-full {connectionIssue?.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}"></div>
                {connectionIssue ? 'Connection Issue' : (edge.label || 'Data Flow Schema')}
            </div>
            {#if connectionIssue}
                <div class="text-red-300 mt-1">
                    {connectionIssue.message}
                </div>
            {:else}
                <div class="opacity-80">
                    From: {sourceNode.data.label || sourceNode.type}
                </div>
                <div class="opacity-80">
                    To: {targetNode.data.label || targetNode.type}
                </div>
                <div class="text-blue-300 mt-1 flex items-center gap-1">
                    <span>Type:</span>
                    <span class="font-bold">{inferredType}</span>
                </div>
                {#if edgeComment}
                    <div class="text-slate-400 mt-1 pt-1 border-t border-slate-600">
                        {edgeComment}
                    </div>
                {/if}
                {#if virtual}
                    <div class="text-purple-300 mt-1 flex items-center gap-1">
                        <span>Virtual Connection</span>
                    </div>
                {/if}
            {/if}
        </div>
    </foreignObject>
{/if}

<style>
    /* ENHANCEMENT 5: Flow animation for connections */
    @keyframes flow {
        0% {
            stroke-dashoffset: 20;
        }
        100% {
            stroke-dashoffset: 0;
        }
    }
    
    .animate-flow {
        animation: flow 0.5s linear infinite;
    }
    
    /* Animated dot for active flow */
    @keyframes flowDot {
        0% {
            offset-distance: 0%;
        }
        100% {
            offset-distance: 100%;
        }
    }
</style>
