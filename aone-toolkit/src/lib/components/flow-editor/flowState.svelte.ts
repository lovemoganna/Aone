import type { FlowEdge, FlowNode, FlowState, Viewport } from './types';

export const flowState = $state<
    FlowState & {
        viewport: Viewport;
        addNode: (node: FlowNode) => void;
        addEdge: (edge: FlowEdge) => void;
        updateNode: (id: string, updates: Partial<FlowNode>) => void;
        removeNode: (id: string) => void;
        removeEdge: (id: string) => void;
        undo: () => void;
        redo: () => void;
    }
>({
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    addNode: (node) => addNode(node),
    addEdge: (edge) => addEdge(edge),
    updateNode: (id, updates) => updateNode(id, updates),
    removeNode: (id) => removeNode(id),
    removeEdge: (id) => removeEdge(id),
    undo: () => {},
    redo: () => {},
});

export const history = $state<{
    past: FlowState[];
    present: FlowState;
    future: FlowState[];
}>({
    past: [],
    present: { nodes: [], edges: [] },
    future: [],
});

export function addNode(node: FlowNode) {
    flowState.nodes = [...flowState.nodes, node];
    history.present = {
        ...history.present,
        nodes: flowState.nodes,
        edges: flowState.edges,
    };
}

export function addEdge(edge: FlowEdge) {
    flowState.edges = [...flowState.edges, edge];
    history.present = {
        ...history.present,
        nodes: flowState.nodes,
        edges: flowState.edges,
    };
}

export function updateNode(id: string, updates: Partial<FlowNode>) {
    flowState.nodes = flowState.nodes.map((node) =>
        node.id === id
            ? {
                  ...node,
                  ...updates,
                  data: updates.data ? { ...node.data, ...updates.data } : node.data,
              }
            : node,
    );
    history.present = {
        ...history.present,
        nodes: flowState.nodes,
        edges: flowState.edges,
    };
}

export function removeNode(id: string) {
    flowState.nodes = flowState.nodes.filter((node) => node.id !== id);
    flowState.edges = flowState.edges.filter(
        (edge) => edge.source !== id && edge.target !== id,
    );
    history.present = {
        ...history.present,
        nodes: flowState.nodes,
        edges: flowState.edges,
    };
}

export function removeEdge(id: string) {
    flowState.edges = flowState.edges.filter((edge) => edge.id !== id);
    history.present = {
        ...history.present,
        nodes: flowState.nodes,
        edges: flowState.edges,
    };
}
