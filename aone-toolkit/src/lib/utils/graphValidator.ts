export interface GraphNodeLike {
    id: string;
    type?: string;
    label?: string;
    data?: any;
}

export interface GraphEdgeLike {
    id?: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
}

export interface GraphIssue {
    code: 'CYCLE_DETECTED' | 'ORPHAN_NODE' | 'DEAD_END' | 'UNREACHABLE' | 'MISSING_ENTRY' | 'SELF_LOOP';
    severity: 'error' | 'warning';
    message: string;
    nodeIds: string[];
}

export interface GraphValidationResult {
    isValid: boolean;
    hasErrors: boolean;
    hasWarnings: boolean;
    errors: GraphIssue[];
    warnings: GraphIssue[];
    stats: {
        nodeCount: number;
        edgeCount: number;
        entryNodes: string[];
        exitNodes: string[];
        isolatedNodes: string[];
    };
}

/**
 * Validates graph topology, detects cycles, dead-ends, orphans, and reachability.
 */
export function validateGraphTopology(
    nodes: GraphNodeLike[],
    edges: GraphEdgeLike[]
): GraphValidationResult {
    const errors: GraphIssue[] = [];
    const warnings: GraphIssue[] = [];

    if (!nodes || nodes.length === 0) {
        return {
            isValid: true,
            hasErrors: false,
            hasWarnings: false,
            errors: [],
            warnings: [],
            stats: { nodeCount: 0, edgeCount: 0, entryNodes: [], exitNodes: [], isolatedNodes: [] }
        };
    }

    const nodeMap = new Map<string, GraphNodeLike>();
    const adj = new Map<string, string[]>();
    const revAdj = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    const outDegree = new Map<string, number>();

    nodes.forEach(n => {
        nodeMap.set(n.id, n);
        adj.set(n.id, []);
        revAdj.set(n.id, []);
        inDegree.set(n.id, 0);
        outDegree.set(n.id, 0);
    });

    edges.forEach(e => {
        if (nodeMap.has(e.source) && nodeMap.has(e.target)) {
            // Self-loop check
            if (e.source === e.target) {
                errors.push({
                    code: 'SELF_LOOP',
                    severity: 'error',
                    message: `节点 "${nodeMap.get(e.source)?.label || e.source}" 存在自连接死循环`,
                    nodeIds: [e.source]
                });
            }
            adj.get(e.source)!.push(e.target);
            revAdj.get(e.target)!.push(e.source);
            outDegree.set(e.source, (outDegree.get(e.source) || 0) + 1);
            inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
        }
    });

    const isolatedNodes: string[] = [];
    const entryNodes: string[] = [];
    const exitNodes: string[] = [];

    nodes.forEach(n => {
        const inDeg = inDegree.get(n.id) || 0;
        const outDeg = outDegree.get(n.id) || 0;

        if (inDeg === 0 && outDeg === 0) {
            isolatedNodes.push(n.id);
            if (nodes.length > 1) {
                warnings.push({
                    code: 'ORPHAN_NODE',
                    severity: 'warning',
                    message: `节点 "${n.label || n.data?.label || n.id}" 是未连接的孤立节点`,
                    nodeIds: [n.id]
                });
            }
        } else if (inDeg === 0) {
            entryNodes.push(n.id);
        } else if (outDeg === 0) {
            exitNodes.push(n.id);
        }
    });

    // Cycle detection via DFS with 3 colors (0: unvisited, 1: visiting, 2: visited)
    const visited = new Map<string, number>();
    const parent = new Map<string, string | null>();
    const cycleNodes = new Set<string>();

    nodes.forEach(n => visited.set(n.id, 0));

    function dfs(nodeId: string, path: string[]) {
        visited.set(nodeId, 1);
        path.push(nodeId);

        const neighbors = adj.get(nodeId) || [];
        for (const neighbor of neighbors) {
            const state = visited.get(neighbor);
            if (state === 1) {
                // Found back-edge (Cycle)
                const cycleStartIdx = path.indexOf(neighbor);
                const currentCycle = path.slice(cycleStartIdx);
                currentCycle.forEach(id => cycleNodes.add(id));

                const names = currentCycle.map(id => nodeMap.get(id)?.label || nodeMap.get(id)?.data?.label || id).join(' -> ');
                errors.push({
                    code: 'CYCLE_DETECTED',
                    severity: 'error',
                    message: `检测到死循环环路: ${names} -> ${nodeMap.get(neighbor)?.label || neighbor}`,
                    nodeIds: currentCycle
                });
            } else if (state === 0) {
                dfs(neighbor, path);
            }
        }

        path.pop();
        visited.set(nodeId, 2);
    }

    nodes.forEach(n => {
        if (visited.get(n.id) === 0) {
            dfs(n.id, []);
        }
    });

    // Check reachability from entry nodes
    if (entryNodes.length > 0) {
        const reachableFromEntry = new Set<string>();
        const queue = [...entryNodes];
        queue.forEach(id => reachableFromEntry.add(id));

        while (queue.length > 0) {
            const curr = queue.shift()!;
            const neighbors = adj.get(curr) || [];
            for (const next of neighbors) {
                if (!reachableFromEntry.has(next)) {
                    reachableFromEntry.add(next);
                    queue.push(next);
                }
            }
        }

        const unreachable = nodes.filter(n => !reachableFromEntry.has(n.id) && !isolatedNodes.includes(n.id));
        if (unreachable.length > 0) {
            warnings.push({
                code: 'UNREACHABLE',
                severity: 'warning',
                message: `存在从起始节点无法到达的执行链路 (${unreachable.length} 个节点)`,
                nodeIds: unreachable.map(n => n.id)
            });
        }
    }

    return {
        isValid: errors.length === 0,
        hasErrors: errors.length > 0,
        hasWarnings: warnings.length > 0,
        errors,
        warnings,
        stats: {
            nodeCount: nodes.length,
            edgeCount: edges.length,
            entryNodes,
            exitNodes,
            isolatedNodes
        }
    };
}
