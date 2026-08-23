/**
 * Audit Logging Service
 * 
 * Problem: No tracking of workflow changes and user actions
 * Solution: Comprehensive audit logging for compliance and debugging
 * 
 * Benefits:
 * - Full audit trail for compliance
 * - Debug workflow execution issues
 * - Track user actions and changes
 */

import { writable, derived, get } from 'svelte/store';
import { flowState } from './flowState.svelte';
import type { FlowNode, FlowEdge } from './types';

// Audit log entry
export interface AuditEntry {
  id: string;
  timestamp: number;
  userId?: string;
  action: AuditAction;
  entityType: 'flow' | 'node' | 'edge' | 'group' | 'template';
  entityId?: string;
  entityName?: string;
  details: Record<string, any>;
  metadata?: Record<string, any>;
}

export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'execute' 
  | 'publish'
  | 'import'
  | 'export'
  | 'share'
  | 'deploy'
  | 'rollback';

// Audit log storage
const AUDIT_LOG_KEY = 'flow_editor_audit_log';
const MAX_ENTRIES = 1000;

// Stores
export const auditLog = writable<AuditEntry[]>([]);
export const auditLogEnabled = writable<boolean>(true);

// Filter stores
export const auditFilter = writable<{
  actions: AuditAction[];
  entityTypes: string[];
  userId?: string;
  startDate?: number;
  endDate?: number;
}>({
  actions: [],
  entityTypes: [],
});

// Filtered audit log
export const filteredAuditLog = derived(
  [auditLog, auditFilter],
  ([$log, $filter]) => {
    return $log.filter(entry => {
      // Filter by actions
      if ($filter.actions.length > 0 && !$filter.actions.includes(entry.action)) {
        return false;
      }
      
      // Filter by entity types
      if ($filter.entityTypes.length > 0 && !$filter.entityTypes.includes(entry.entityType)) {
        return false;
      }
      
      // Filter by user
      if ($filter.userId && entry.userId !== $filter.userId) {
        return false;
      }
      
      // Filter by date range
      if ($filter.startDate && entry.timestamp < $filter.startDate) {
        return false;
      }
      if ($filter.endDate && entry.timestamp > $filter.endDate) {
        return false;
      }
      
      return true;
    });
  }
);

// Load audit log from storage
function loadAuditLog(): AuditEntry[] {
  try {
    const stored = localStorage.getItem(AUDIT_LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save audit log to storage
function saveAuditLog(entries: AuditEntry[]) {
  try {
    // Keep only last MAX_ENTRIES
    const trimmed = entries.slice(-MAX_ENTRIES);
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(trimmed));
  } catch {}
}

// Add audit entry
export function logAction(
  action: AuditAction,
  entityType: AuditEntry['entityType'],
  details: Record<string, any>,
  entityId?: string,
  entityName?: string
) {
  if (!get(auditLogEnabled)) return;
  
  const entry: AuditEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    action,
    entityType,
    entityId,
    entityName,
    details,
  };
  
  auditLog.update(log => {
    const updated = [...log, entry];
    saveAuditLog(updated);
    return updated;
  });
}

// Log node creation
export function logNodeCreated(node: FlowNode) {
  logAction('create', 'node', {
    nodeType: node.type,
    position: node.position,
    label: node.data?.label,
  }, node.id, node.data?.label);
}

// Log node update
export function logNodeUpdated(nodeId: string, changes: Record<string, any>) {
  logAction('update', 'node', changes, nodeId);
}

// Log node deletion
export function logNodeDeleted(nodeId: string, nodeData: FlowNode) {
  logAction('delete', 'node', {
    nodeType: nodeData.type,
    label: nodeData.data?.label,
  }, nodeId, nodeData.data?.label);
}

// Log edge creation
export function logEdgeCreated(edge: FlowEdge) {
  logAction('create', 'edge', {
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
  }, edge.id);
}

// Log edge deletion
export function logEdgeDeleted(edgeId: string, edgeData: FlowEdge) {
  logAction('delete', 'edge', {
    source: edgeData.source,
    target: edgeData.target,
  }, edgeId);
}

// Log flow save
export function logFlowSaved(flowId: string, flowName: string) {
  logAction('update', 'flow', {
    nodeCount: flowState.nodes.length,
    edgeCount: flowState.edges.length,
  }, flowId, flowName);
}

// Log flow import
export function logFlowImported(fileName: string, nodeCount: number, edgeCount: number) {
  logAction('import', 'flow', {
    fileName,
    nodeCount,
    edgeCount,
  });
}

// Log flow export
export function logFlowExported(format: string, nodeCount: number, edgeCount: number) {
  logAction('export', 'flow', {
    format,
    nodeCount,
    edgeCount,
  });
}

// Log workflow execution
export function logExecutionStarted(flowId: string, flowName: string) {
  logAction('execute', 'flow', {
    startedAt: Date.now(),
  }, flowId, flowName);
}

export function logExecutionCompleted(flowId: string, flowName: string, duration: number) {
  logAction('execute', 'flow', {
    completedAt: Date.now(),
    duration,
  }, flowId, flowName);
}

export function logExecutionFailed(flowId: string, flowName: string, error: string) {
  logAction('execute', 'flow', {
    failedAt: Date.now(),
    error,
  }, flowId, flowName);
}

// Get audit entries for entity
export function getEntriesForEntity(
  entityId: string,
  entityType?: AuditEntry['entityType']
): AuditEntry[] {
  return get(auditLog).filter(entry => {
    if (entry.entityId !== entityId) return false;
    if (entityType && entry.entityType !== entityType) return false;
    return true;
  });
}

// Get recent entries
export function getRecentEntries(count: number = 10): AuditEntry[] {
  return get(auditLog).slice(-count);
}

// Clear audit log
export function clearAuditLog() {
  auditLog.set([]);
  saveAuditLog([]);
}

// Export audit log
export function exportAuditLog(format: 'json' | 'csv' = 'json'): string {
  const log = get(auditLog);
  
  if (format === 'csv') {
    const headers = ['ID', 'Timestamp', 'Action', 'Entity Type', 'Entity ID', 'Details'];
    const rows = log.map(entry => [
      entry.id,
      new Date(entry.timestamp).toISOString(),
      entry.action,
      entry.entityType,
      entry.entityId || '',
      JSON.stringify(entry.details),
    ]);
    
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
  
  return JSON.stringify(log, null, 2);
}

// Toggle audit logging
export function toggleAuditLogging() {
  auditLogEnabled.update(v => !v);
}

// Initialize
export function initializeAuditLog() {
  auditLog.set(loadAuditLog());
}

// Auto-log flow changes
export function setupAutoLogging() {
  // This would integrate with flow state changes
  // to automatically log node/edge modifications
}

export const auditLogUtils = {
  auditLog,
  auditLogEnabled,
  auditFilter,
  filteredAuditLog,
  logAction,
  logNodeCreated,
  logNodeUpdated,
  logNodeDeleted,
  logEdgeCreated,
  logEdgeDeleted,
  logFlowSaved,
  logFlowImported,
  logFlowExported,
  logExecutionStarted,
  logExecutionCompleted,
  logExecutionFailed,
  getEntriesForEntity,
  getRecentEntries,
  clearAuditLog,
  exportAuditLog,
  toggleAuditLogging,
  initializeAuditLog,
  setupAutoLogging,
};

export default auditLogUtils;
