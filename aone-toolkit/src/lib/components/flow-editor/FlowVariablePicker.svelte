<script lang="ts">
    import { fly } from "svelte/transition";
    import type { FlowNode, FlowEdge } from "./types";

    let {
        filter = "",
        onSelect = (variable: string) => {},
        onClose = () => {},
        position = { x: 0, y: 0 },
        nodes = [],
        edges = [],
        nodeId = "",
    } = $props<{
        filter?: string;
        onSelect?: (variable: string) => void;
        onClose?: () => void;
        position?: { x: number; y: number };
        nodes?: FlowNode[];
        edges?: FlowEdge[];
        nodeId?: string;
    }>();

    // Traversal Implementation
    function getUpstreamVariables(
        targetId: string,
        allNodes: FlowNode[],
        allEdges: FlowEdge[],
    ): string[] {
        const vars: string[] = [];
        if (!targetId) return vars;

        // BFS traversal
        const visited = new Set<string>();
        const queue: string[] = [targetId];
        visited.add(targetId);

        const upstreamNodes: FlowNode[] = [];

        while (queue.length > 0) {
            const currId = queue.shift()!;

            // Find incoming edges
            const incoming = allEdges.filter((e) => e.target === currId);

            for (const edge of incoming) {
                const sourceNode = allNodes.find((n) => n.id === edge.source);
                if (sourceNode && !visited.has(edge.source)) {
                    visited.add(edge.source);
                    upstreamNodes.push(sourceNode); // Add to list
                    queue.push(edge.source);
                }
            }
        }

        // Generate variables dynamically from upstream nodes
        for (const node of upstreamNodes) {
            const label = (node.data.label || node.id)
                .replace(/\s+/g, "_")
                .toLowerCase();
            const prefix = `${label}_${node.id.slice(0, 4)}`;

            // 1. Inspect dynamic outputSchema if present
            let hasDynamicSchema = false;
            const schemaObj = node.data.outputSchema ?? node.data.schema;
            if (schemaObj) {
                try {
                    const parsedObj = typeof schemaObj === 'string' ? JSON.parse(schemaObj) : schemaObj;
                    if (parsedObj && typeof parsedObj === 'object') {
                        const keys = Object.keys(parsedObj.properties || parsedObj);
                        for (const key of keys) {
                            vars.push(`${prefix}.${key}`);
                            hasDynamicSchema = true;
                        }
                    }
                } catch {
                    // Ignore parse errors
                }
            }

            // 2. Inspect outputs or fields array
            if (Array.isArray(node.data.outputs)) {
                for (const out of node.data.outputs) {
                    vars.push(`${prefix}.${out}`);
                    hasDynamicSchema = true;
                }
            } else if (Array.isArray(node.data.fields)) {
                for (const field of node.data.fields) {
                    vars.push(`${prefix}.${field}`);
                    hasDynamicSchema = true;
                }
            }

            // 3. Structural fallbacks if no dynamic schema was provided
            if (!hasDynamicSchema) {
                if (node.type === "start") {
                    vars.push(`trigger.body`);
                    vars.push(`trigger.query`);
                } else if (node.type === "agent") {
                    vars.push(`${prefix}.response`);
                } else if (node.type === "condition") {
                    vars.push(`${prefix}.result`);
                } else if (node.type === "loop") {
                    vars.push(`${label}.item`);
                    vars.push(`${label}.index`);
                } else {
                    vars.push(`${prefix}.output`);
                }
            }
        }

        // Add global variables
        vars.push("env.API_KEY");
        vars.push("user.id");

        return vars;
    }

    let variables = $derived(getUpstreamVariables(nodeId, nodes, edges));

    let items = $derived(
        variables.filter((v) => v.toLowerCase().includes(filter.toLowerCase())),
    );

    let selectedIndex = $state(0);

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % items.length;
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (items[selectedIndex]) {
                onSelect(items[selectedIndex]);
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            onClose();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
    class="fixed z-[100] bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 w-64 overflow-hidden"
    style="left: {position.x}px; top: {position.y}px;"
    transition:fly={{ y: 10, duration: 150 }}
>
    {#if items.length === 0}
        <div class="px-3 py-2 text-xs text-slate-400">
            No variables found{filter ? ` for "${filter}"` : ""}
        </div>
    {:else}
        <div class="max-h-60 overflow-y-auto">
            {#each items as item, i}
                <div
                    class="px-3 py-2 text-sm cursor-pointer flex items-center gap-2
                    {i === selectedIndex
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'}"
                    onclick={() => onSelect(item)}
                    role="button"
                    tabindex="0"
                    onkeydown={(e) => e.key === "Enter" && onSelect(item)}
                >
                    <span class="font-mono text-xs opacity-50"
                        >&#123;&#123;</span
                    >
                    <span class="flex-1 truncate" title={item}>{item}</span>
                    <span class="font-mono text-xs opacity-50"
                        >&#125;&#125;</span
                    >
                </div>
            {/each}
        </div>
    {/if}
</div>
