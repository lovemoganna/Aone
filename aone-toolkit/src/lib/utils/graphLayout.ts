export interface LayoutNode {
    id: string;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    [key: string]: any;
}

export interface LayoutEdge {
    source: string;
    target: string;
    [key: string]: any;
}

export interface AutoLayoutOptions {
    direction?: 'LR' | 'TB' | 'RL' | 'BT';
    nodeWidth?: number;
    nodeHeight?: number;
    rankSep?: number;
    nodeSep?: number;
}

/**
 * Fast, pure TypeScript Sugiyama-style hierarchical layout algorithm for flowcharts and DAGs.
 */
export function applyAutoLayout<N extends LayoutNode, E extends LayoutEdge>(
    nodes: N[],
    edges: E[],
    options: AutoLayoutOptions = {}
): { nodes: N[]; width: number; height: number } {
    if (!nodes || nodes.length === 0) {
        return { nodes: [], width: 0, height: 0 };
    }

    const direction = options.direction || 'LR';
    const defaultWidth = options.nodeWidth || 180;
    const defaultHeight = options.nodeHeight || 80;
    const rankSep = options.rankSep || 80;
    const nodeSep = options.nodeSep || 40;

    const isHorizontal = direction === 'LR' || direction === 'RL';

    // 1. Build adjacency & degree maps
    const adj = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    const nodeMap = new Map<string, N>();

    nodes.forEach(n => {
        nodeMap.set(n.id, { ...n });
        adj.set(n.id, []);
        inDegree.set(n.id, 0);
    });

    edges.forEach(e => {
        if (nodeMap.has(e.source) && nodeMap.has(e.target) && e.source !== e.target) {
            adj.get(e.source)!.push(e.target);
            inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
        }
    });

    // 2. Rank assignment (Layering using longest path / BFS)
    const ranks = new Map<string, number>();
    const queue: string[] = [];

    nodes.forEach(n => {
        if ((inDegree.get(n.id) || 0) === 0) {
            ranks.set(n.id, 0);
            queue.push(n.id);
        }
    });

    // Fallback for disconnected cycles
    if (queue.length === 0 && nodes.length > 0) {
        ranks.set(nodes[0].id, 0);
        queue.push(nodes[0].id);
    }

    while (queue.length > 0) {
        const curr = queue.shift()!;
        const currRank = ranks.get(curr) || 0;
        const neighbors = adj.get(curr) || [];

        for (const next of neighbors) {
            const nextRank = ranks.get(next);
            if (nextRank === undefined || nextRank < currRank + 1) {
                ranks.set(next, currRank + 1);
                queue.push(next);
            }
        }
    }

    // Assign rank 0 to any remaining unassigned nodes
    nodes.forEach(n => {
        if (!ranks.has(n.id)) {
            ranks.set(n.id, 0);
        }
    });

    // 3. Group nodes by rank
    const layers = new Map<number, string[]>();
    let maxRank = 0;

    ranks.forEach((rank, nodeId) => {
        if (!layers.has(rank)) layers.set(rank, []);
        layers.get(rank)!.push(nodeId);
        if (rank > maxRank) maxRank = rank;
    });

    // 4. Calculate coordinates
    const positionedNodes: N[] = [];
    let canvasMaxWidth = 0;
    let canvasMaxHeight = 0;

    const startX = 60;
    const startY = 60;

    for (let r = 0; r <= maxRank; r++) {
        const layerNodes = layers.get(r) || [];
        const layerCount = layerNodes.length;

        layerNodes.forEach((nodeId, idx) => {
            const originalNode = nodeMap.get(nodeId)!;
            const w = originalNode.width || defaultWidth;
            const h = originalNode.height || defaultHeight;

            let x = 0;
            let y = 0;

            if (isHorizontal) {
                x = startX + r * (defaultWidth + rankSep);
                y = startY + idx * (defaultHeight + nodeSep);
                if (direction === 'RL') {
                    x = startX + (maxRank - r) * (defaultWidth + rankSep);
                }
            } else {
                x = startX + idx * (defaultWidth + nodeSep);
                y = startY + r * (defaultHeight + rankSep);
                if (direction === 'BT') {
                    y = startY + (maxRank - r) * (defaultHeight + rankSep);
                }
            }

            const updatedNode = {
                ...originalNode,
                x,
                y,
                position: { x, y }
            };

            positionedNodes.push(updatedNode);

            if (x + w + 60 > canvasMaxWidth) canvasMaxWidth = x + w + 60;
            if (y + h + 60 > canvasMaxHeight) canvasMaxHeight = y + h + 60;
        });
    }

    return {
        nodes: positionedNodes,
        width: Math.max(800, canvasMaxWidth),
        height: Math.max(600, canvasMaxHeight)
    };
}
