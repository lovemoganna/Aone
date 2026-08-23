export interface Position {
    x: number;
    y: number;
}

export interface Dimensions {
    width: number;
    height: number;
}

export type NodeType =
    | 'agent'
    | 'skill'
    | 'router'
    | 'parallel'
    | 'end'
    | 'start'
    | 'condition'
    | 'group'
    | 'loop'
    | 'broadcast'
    | 'listen'
    | (string & {});

export interface NodeCategory {
    id: string;
    label: string;
    icon: string;
    color: string;
}

// P0-3: Dynamic Ports Support
export interface Port {
    id: string;
    label: string;
    type: 'input' | 'output';
}

// Node types that support dynamic ports
export const DYNAMIC_PORT_TYPES: NodeType[] = ['router', 'parallel', 'switch', 'broadcast'];

export interface NodeData {
    label: string;
    icon?: any; // Component
    color?: string;
    description?: string;
    inputs?: string[];
    outputs?: string[];
    // P0-3: Dynamic ports - override static inputs/outputs
    dynamicInputs?: Port[];
    dynamicOutputs?: Port[];
    // For Condition
    condition?: { variable: string; operator: string; value: string };
    // For Group/Loop
    style?: { width?: number; height?: number };
    // Virtual Edge Channel
    broadcastChannel?: string;
    // P0-3: Allow custom port configuration
    useDynamicPorts?: boolean;
    [key: string]: any;
}

export interface FlowNode {
    id: string;
    type: NodeType;
    position: Position;
    data: NodeData;
    selected?: boolean;
    dragging?: boolean;
    // Structural
    parentId?: string;
    collapsed?: boolean;
    extent?: 'parent';
    // Debugging
    isBreakpoint?: boolean;
    executionState?: 'idle' | 'waiting' | 'running' | 'completed' | 'error';
    errorMessage?: string;
    style?: Record<string, any>;
}

export type EdgeType = 'bezier' | 'step' | 'straight';
export type EdgeStyle = 'solid' | 'dashed' | 'dotted';
export type ArrowStyle = 'arrow' | 'diamond' | 'circle' | 'none';

export interface FlowEdge {
    id: string;
    source: string;
    sourceHandle?: string;
    target: string;
    targetHandle?: string;
    selected?: boolean;
    animated?: boolean;
    label?: string;
    // ENHANCEMENT 3: Edge Properties
    type?: EdgeType;
    style?: EdgeStyle;
    strokeWidth?: number;
    strokeColor?: string;
    arrowStyle?: ArrowStyle;
    // ENHANCEMENT 4: Bidirectional Edge
    bidirectional?: boolean;
    // ENHANCEMENT 21: Virtual Connection
    virtual?: boolean;
    // ENHANCEMENT 18: Edge Comment
    comment?: string;
}

export interface FlowState {
    nodes: FlowNode[];
    edges: FlowEdge[];
    viewport?: Viewport;
    action?: string;
}

export interface HistoryEntry extends FlowState {
    timestamp?: number;
}

export interface Viewport {
    x: number;
    y: number;
    zoom: number;
}
