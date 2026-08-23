/**
 * Visual Diff Service
 * 
 * Problem: When comparing workflow versions, difficult to see what changed
 * Solution: Visual diff that highlights added/removed/modified nodes and edges
 * 
 * Benefits:
 * - Clear visualization of workflow changes
 * - Faster version comparison
 * - Better collaboration review
 */

import type { FlowNode, FlowEdge } from './types';

export interface DiffResult {
    addedNodes: FlowNode[];
    removedNodes: FlowNode[];
    modifiedNodes: { old: FlowNode; new: FlowNode }[];
    addedEdges: FlowEdge[];
    removedEdges: FlowEdge[];
    modifiedEdges: { old: FlowEdge; new: FlowEdge }[];
    unchanged: {
        nodes: FlowNode[];
        edges: FlowEdge[];
    };
}

export interface NodeDiff {
    type: 'added' | 'removed' | 'modified' | 'unchanged';
    node: FlowNode;
    changes?: {
        position?: { old: { x: number; y: number }; new: { x: number; y: number } };
        label?: { old: string; new: string };
        data?: { old: any; new: any };
    };
}

export interface EdgeDiff {
    type: 'added' | 'removed' | 'modified' | 'unchanged';
    edge: FlowEdge;
    changes?: {
        source?: { old: string; new: string };
        target?: { old: string; new: string };
        label?: { old: string; new: string };
    };
}

// Compare two nodes
function compareNodes(oldNode: FlowNode, newNode: FlowNode): NodeDiff['changes'] | null {
    const changes: NodeDiff['changes'] = {};
    let hasChanges = false;

    // Check position
    if (oldNode.position.x !== newNode.position.x || oldNode.position.y !== newNode.position.y) {
        changes.position = { old: oldNode.position, new: newNode.position };
        hasChanges = true;
    }

    // Check label
    if (oldNode.data?.label !== newNode.data?.label) {
        changes.label = { old: oldNode.data?.label || '', new: newNode.data?.label || '' };
        hasChanges = true;
    }

    // Check data (excluding position and label)
    const oldData: Partial<typeof oldNode.data> = { ...oldNode.data };
    const newData: Partial<typeof newNode.data> = { ...newNode.data };
    delete oldData.label;
    delete newData.label;
    
    if (JSON.stringify(oldData) !== JSON.stringify(newData)) {
        changes.data = { old: oldData, new: newData };
        hasChanges = true;
    }

    return hasChanges ? changes : null;
}

// Compare two edges
function compareEdges(oldEdge: FlowEdge, newEdge: FlowEdge): EdgeDiff['changes'] | null {
    const changes: EdgeDiff['changes'] = {};
    let hasChanges = false;

    if (oldEdge.source !== newEdge.source) {
        changes.source = { old: oldEdge.source, new: newEdge.source };
        hasChanges = true;
    }

    if (oldEdge.target !== newEdge.target) {
        changes.target = { old: oldEdge.target, new: newEdge.target };
        hasChanges = true;
    }

    if (oldEdge.label !== newEdge.label) {
        changes.label = { old: oldEdge.label || '', new: newEdge.label || '' };
        hasChanges = true;
    }

    return hasChanges ? changes : null;
}

// Main diff function
export function compareWorkflows(
    oldNodes: FlowNode[],
    oldEdges: FlowEdge[],
    newNodes: FlowNode[],
    newEdges: FlowEdge[]
): DiffResult {
    const oldNodeMap = new Map(oldNodes.map(n => [n.id, n]));
    const newNodeMap = new Map(newNodes.map(n => [n.id, n]));
    const oldEdgeMap = new Map(oldEdges.map(e => [e.id, e]));
    const newEdgeMap = new Map(newEdges.map(e => [e.id, e]));

    const result: DiffResult = {
        addedNodes: [],
        removedNodes: [],
        modifiedNodes: [],
        addedEdges: [],
        removedEdges: [],
        modifiedEdges: [],
        unchanged: { nodes: [], edges: [] },
    };

    // Find added, removed, and modified nodes
    const processedNewNodeIds = new Set<string>();
    
    for (const oldNode of oldNodes) {
        const newNode = newNodeMap.get(oldNode.id);
        if (!newNode) {
            result.removedNodes.push(oldNode);
        } else {
            processedNewNodeIds.add(oldNode.id);
            const changes = compareNodes(oldNode, newNode);
            if (changes) {
                result.modifiedNodes.push({ old: oldNode, new: newNode });
            } else {
                result.unchanged.nodes.push(newNode);
            }
        }
    }

    for (const newNode of newNodes) {
        if (!oldNodeMap.has(newNode.id) && !processedNewNodeIds.has(newNode.id)) {
            result.addedNodes.push(newNode);
        }
    }

    // Find added, removed, and modified edges
    const processedNewEdgeIds = new Set<string>();
    
    for (const oldEdge of oldEdges) {
        const newEdge = newEdgeMap.get(oldEdge.id);
        if (!newEdge) {
            result.removedEdges.push(oldEdge);
        } else {
            processedNewEdgeIds.add(oldEdge.id);
            const changes = compareEdges(oldEdge, newEdge);
            if (changes) {
                result.modifiedEdges.push({ old: oldEdge, new: newEdge });
            } else {
                result.unchanged.edges.push(newEdge);
            }
        }
    }

    for (const newEdge of newEdges) {
        if (!oldEdgeMap.has(newEdge.id) && !processedNewEdgeIds.has(newEdge.id)) {
            result.addedEdges.push(newEdge);
        }
    }

    return result;
}

// Get summary statistics
export function getDiffSummary(diff: DiffResult): {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
    total: number;
} {
    const added = diff.addedNodes.length + diff.addedEdges.length;
    const removed = diff.removedNodes.length + diff.removedEdges.length;
    const modified = diff.modifiedNodes.length + diff.modifiedEdges.length;
    const unchanged = diff.unchanged.nodes.length + diff.unchanged.edges.length;
    
    return {
        added,
        removed,
        modified,
        unchanged,
        total: added + removed + modified + unchanged,
    };
}

// Generate change list for display
export function generateChangeList(diff: DiffResult): string[] {
    const changes: string[] = [];
    
    for (const node of diff.addedNodes) {
        changes.push(`+ Added node: ${node.data?.label || node.type} (${node.id.slice(0, 8)})`);
    }
    
    for (const node of diff.removedNodes) {
        changes.push(`- Removed node: ${node.data?.label || node.type} (${node.id.slice(0, 8)})`);
    }
    
    for (const { old, new: newNode } of diff.modifiedNodes) {
        const changeParts: string[] = [];
        if (old.data?.label !== newNode.data?.label) {
            changeParts.push(`label: "${old.data?.label}" → "${newNode.data?.label}"`);
        }
        if (old.position.x !== newNode.position.x || old.position.y !== newNode.position.y) {
            changeParts.push(`position: (${old.position.x}, ${old.position.y}) → (${newNode.position.x}, ${newNode.position.y})`);
        }
        if (changeParts.length > 0) {
            changes.push(`~ Modified node: ${newNode.data?.label || newNode.type} (${changeParts.join(', ')})`);
        }
    }
    
    for (const edge of diff.addedEdges) {
        changes.push(`+ Added edge: ${edge.source.slice(0, 8)} → ${edge.target.slice(0, 8)}`);
    }
    
    for (const edge of diff.removedEdges) {
        changes.push(`- Removed edge: ${edge.source.slice(0, 8)} → ${edge.target.slice(0, 8)}`);
    }
    
    return changes;
}

export const visualDiffUtils = {
    compareWorkflows,
    getDiffSummary,
    generateChangeList,
};

export default visualDiffUtils;
