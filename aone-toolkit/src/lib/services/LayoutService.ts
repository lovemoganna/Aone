import dagre from 'dagre';
import type { FlowNode, FlowEdge } from '$lib/components/flow-editor/types';

interface LayoutOptions {
    direction: 'TB' | 'LR'; // Top-Bottom or Left-Right
    nodeWidth: number;
    nodeHeight: number;
    rankSep: number;
    nodeSep: number;
}

export class LayoutService {
    private static defaultOptions: LayoutOptions = {
        direction: 'LR',
        nodeWidth: 250,
        nodeHeight: 150,
        rankSep: 100,
        nodeSep: 50
    };

    static calculateLayout(
        nodes: FlowNode[],
        edges: FlowEdge[],
        options: Partial<LayoutOptions> = {}
    ): { nodes: FlowNode[]; edges: FlowEdge[] } {
        const opts = { ...this.defaultOptions, ...options };

        const g = new dagre.graphlib.Graph();
        g.setGraph({
            rankdir: opts.direction,
            ranksep: opts.rankSep,
            nodesep: opts.nodeSep
        });

        g.setDefaultEdgeLabel(() => ({}));

        // Add nodes
        nodes.forEach((node) => {
            // Use actual dimensions if available, otherwise default
            const width = node.data?.style?.width || opts.nodeWidth;
            const height = node.data?.style?.height || opts.nodeHeight;

            g.setNode(node.id, {
                width,
                height,
                // Pass format-specific data if needed
                label: node.data.label
            });
        });

        // Add edges
        edges.forEach((edge) => {
            g.setEdge(edge.source, edge.target);
        });

        // Calculate layout
        dagre.layout(g);

        // Map back to nodes
        const layoutedNodes = nodes.map((node) => {
            const nodeWithPosition = g.node(node.id);
            if (!nodeWithPosition) return node;

            // Dagre gives center position, we typically use top-left
            return {
                ...node,
                position: {
                    x: nodeWithPosition.x - nodeWithPosition.width / 2,
                    y: nodeWithPosition.y - nodeWithPosition.height / 2
                }
            };
        });

        return { nodes: layoutedNodes, edges };
    }
}
