/**
 * Version History Service
 * 
 * Problem: No way to track and manage workflow versions over time
 * Solution: Comprehensive version history with naming, comparison, and rollback
 * 
 * Benefits:
 * - Full version history for workflows
 * - Ability to compare versions visually
 * - Easy rollback to previous states
 */

import { writable, derived, get } from 'svelte/store';
import type { FlowNode, FlowEdge } from '../components/flow-editor/types';

// Version types
export interface FlowVersion {
    id: string;
    workflowId: string;
    name: string;
    description?: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
    createdAt: number;
    author?: string;
    tags?: string[];
    isAutoSave?: boolean;
}

export interface VersionDiff {
    added: FlowNode[];
    removed: FlowNode[];
    modified: { old: FlowNode; new: FlowNode }[];
    edgeChanges: {
        added: FlowEdge[];
        removed: FlowEdge[];
    };
}

// Storage key
const VERSION_HISTORY_KEY = 'flow_editor_version_history';
const MAX_VERSIONS_PER_WORKFLOW = 50;

// Stores
export const versions = writable<FlowVersion[]>([]);
export const currentWorkflowId = writable<string | null>(null);
export const selectedVersionId = writable<string | null>(null);

// Load from storage
function loadVersions(): FlowVersion[] {
    try {
        const stored = localStorage.getItem(VERSION_HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

// Save to storage
function saveVersions(v: FlowVersion[]) {
    try {
        localStorage.setItem(VERSION_HISTORY_KEY, JSON.stringify(v));
    } catch {
        console.error('Failed to save versions');
    }
}

// Get versions for a specific workflow
export function getVersionsForWorkflow(workflowId: string): FlowVersion[] {
    return get(versions)
        .filter(v => v.workflowId === workflowId)
        .sort((a, b) => b.createdAt - a.createdAt);
}

// Save a new version
export function saveVersion(
    workflowId: string,
    nodes: FlowNode[],
    edges: FlowEdge[],
    name: string,
    description?: string,
    author?: string,
    tags?: string[],
    isAutoSave = false
): FlowVersion {
    const version: FlowVersion = {
        id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workflowId,
        name,
        description,
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        createdAt: Date.now(),
        author,
        tags,
        isAutoSave,
    };

    versions.update(list => {
        // Get workflow versions
        const workflowVersions = list.filter(v => v.workflowId === workflowId);
        
        // If auto-save, limit to 10 auto-saves
        if (isAutoSave) {
            const autoSaves = workflowVersions.filter(v => v.isAutoSave);
            if (autoSaves.length >= 10) {
                // Remove oldest auto-save
                const oldestAutoSave = autoSaves.sort((a, b) => a.createdAt - b.createdAt)[0];
                list = list.filter(v => v.id !== oldestAutoSave.id);
            }
        }
        
        // Limit total versions per workflow
        if (workflowVersions.length >= MAX_VERSIONS_PER_WORKFLOW) {
            const oldest = workflowVersions.sort((a, b) => a.createdAt - b.createdAt)[0];
            list = list.filter(v => v.id !== oldest.id);
        }

        const updated = [...list, version];
        saveVersions(updated);
        return updated;
    });

    return version;
}

/**
 * P3-24: Create Named Checkpoint (Milestone version protected from auto-pruning)
 */
export function createNamedCheckpoint(
    workflowId: string,
    nodes: FlowNode[],
    edges: FlowEdge[],
    name: string,
    description?: string,
    author?: string
): FlowVersion {
    return saveVersion(
        workflowId,
        nodes,
        edges,
        name || `里程碑快照 - ${new Date().toLocaleTimeString()}`,
        description,
        author,
        ['checkpoint', 'milestone'],
        false
    );
}

// Load a specific version
export function loadVersion(versionId: string): { nodes: FlowNode[]; edges: FlowEdge[] } | null {
    const version = get(versions).find(v => v.id === versionId);
    if (!version) return null;
    
    return {
        nodes: JSON.parse(JSON.stringify(version.nodes)),
        edges: JSON.parse(JSON.stringify(version.edges)),
    };
}

// Delete a version
export function deleteVersion(versionId: string): boolean {
    let found = false;
    
    versions.update(list => {
        const index = list.findIndex(v => v.id === versionId);
        if (index !== -1) {
            list.splice(index, 1);
            found = true;
            saveVersions(list);
        }
        return list;
    });
    
    return found;
}

// Compare two versions
export function compareVersions(versionId1: string, versionId2: string): VersionDiff {
    const v1 = get(versions).find(v => v.id === versionId1);
    const v2 = get(versions).find(v => v.id === versionId2);
    
    if (!v1 || !v2) {
        return {
            added: [],
            removed: [],
            modified: [],
            edgeChanges: { added: [], removed: [] },
        };
    }
    
    const nodeMap1 = new Map(v1.nodes.map(n => [n.id, n]));
    const nodeMap2 = new Map(v2.nodes.map(n => [n.id, n]));
    
    // Find added nodes (in v2 but not in v1)
    const added: FlowNode[] = [];
    for (const [id, node] of nodeMap2) {
        if (!nodeMap1.has(id)) {
            added.push(node);
        }
    }
    
    // Find removed nodes (in v1 but not in v2)
    const removed: FlowNode[] = [];
    for (const [id, node] of nodeMap1) {
        if (!nodeMap2.has(id)) {
            removed.push(node);
        }
    }
    
    // Find modified nodes
    const modified: { old: FlowNode; new: FlowNode }[] = [];
    for (const [id, node1] of nodeMap1) {
        const node2 = nodeMap2.get(id);
        if (node2 && JSON.stringify(node1) !== JSON.stringify(node2)) {
            modified.push({ old: node1, new: node2 });
        }
    }
    
    // Edge changes
    const edgeMap1 = new Map(v1.edges.map(e => [e.id, e]));
    const edgeMap2 = new Map(v2.edges.map(e => [e.id, e]));
    
    const edgeAdded: FlowEdge[] = [];
    const edgeRemoved: FlowEdge[] = [];
    
    for (const [id, edge] of edgeMap2) {
        if (!edgeMap1.has(id)) edgeAdded.push(edge);
    }
    for (const [id, edge] of edgeMap1) {
        if (!edgeMap2.has(id)) edgeRemoved.push(edge);
    }
    
    return {
        added,
        removed,
        modified,
        edgeChanges: { added: edgeAdded, removed: edgeRemoved },
    };
}

// Rollback to a specific version
export function rollbackToVersion(versionId: string): { nodes: FlowNode[]; edges: FlowEdge[] } | null {
    const version = get(versions).find(v => v.id === versionId);
    if (!version) return null;
    
    // Create a new version marking the rollback
    saveVersion(
        version.workflowId,
        version.nodes,
        version.edges,
        `Rollback to: ${version.name}`,
        `Rolled back from current state`,
        undefined,
        ['rollback'],
        false
    );
    
    return {
        nodes: JSON.parse(JSON.stringify(version.nodes)),
        edges: JSON.parse(JSON.stringify(version.edges)),
    };
}

// Get version metadata for display
export function getVersionMeta(versionId: string): FlowVersion | undefined {
    return get(versions).find(v => v.id === versionId);
}

// Clear all versions for a workflow
export function clearWorkflowVersions(workflowId: string): void {
    versions.update(list => {
        const updated = list.filter(v => v.workflowId !== workflowId);
        saveVersions(updated);
        return updated;
    });
}

// Export versions
export function exportVersions(workflowId: string): string {
    const workflowVersions = getVersionsForWorkflow(workflowId);
    return JSON.stringify(workflowVersions, null, 2);
}

// Import versions
export function importVersions(json: string): number {
    try {
        const imported = JSON.parse(json) as FlowVersion[];
        let count = 0;
        
        versions.update(list => {
            imported.forEach(v => {
                // Generate new ID to avoid conflicts
                const newVersion: FlowVersion = {
                    ...v,
                    id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    createdAt: Date.now(),
                };
                list.push(newVersion);
                count++;
            });
            saveVersions(list);
            return list;
        });
        
        return count;
    } catch {
        return 0;
    }
}

// Initialize
export function initializeVersionHistory() {
    versions.set(loadVersions());
}

// Auto-save wrapper
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleAutoSave(
    workflowId: string,
    nodes: FlowNode[],
    edges: FlowEdge[],
    intervalMs = 30000 // 30 seconds
) {
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
    }
    
    autoSaveTimer = setTimeout(() => {
        saveVersion(
            workflowId,
            nodes,
            edges,
            `Auto-save ${new Date().toLocaleString()}`,
            'Automatically saved draft',
            undefined,
            ['autosave'],
            true
        );
        autoSaveTimer = null;
    }, intervalMs);
}

export const versionHistoryUtils = {
    versions,
    currentWorkflowId,
    selectedVersionId,
    saveVersion,
    loadVersion,
    deleteVersion,
    compareVersions,
    rollbackToVersion,
    getVersionMeta,
    getVersionsForWorkflow,
    clearWorkflowVersions,
    exportVersions,
    importVersions,
    initializeVersionHistory,
    scheduleAutoSave,
};

export default versionHistoryUtils;
