/**
 * Execution Log Export Service
 * Provides functionality to export execution logs in various formats
 */

import type { ExecutionLog, ExecutionResult } from './types';

export interface LogExportOptions {
    format: 'json' | 'csv' | 'txt';
    includeTimestamps: boolean;
    includeDuration: boolean;
    includeInputs: boolean;
    includeOutputs: boolean;
}

/**
 * Export execution logs to JSON format
 */
export function exportLogsToJson(logs: ExecutionLog[], workflowName?: string): string {
    const data = {
        exportedAt: new Date().toISOString(),
        workflowName,
        totalSteps: logs.length,
        logs: logs.map(log => ({
            nodeId: log.nodeId,
            nodeName: log.nodeName,
            status: log.status,
            startTime: log.startTime,
            endTime: log.endTime,
            duration: log.endTime && log.startTime ? log.endTime - log.startTime : undefined,
            input: log.input,
            output: log.output,
            error: log.error
        }))
    };
    
    return JSON.stringify(data, null, 2);
}

/**
 * Export execution logs to CSV format
 */
export function exportLogsToCsv(logs: ExecutionLog[]): string {
    const headers = ['Node ID', 'Node Name', 'Status', 'Start Time', 'End Time', 'Duration (ms)', 'Error'];
    const rows = logs.map(log => [
        log.nodeId,
        log.nodeName,
        log.status,
        log.startTime ? new Date(log.startTime).toISOString() : '',
        log.endTime ? new Date(log.endTime).toISOString() : '',
        log.endTime && log.startTime ? String(log.endTime - log.startTime) : '',
        log.error || ''
    ]);
    
    return [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
}

/**
 * Export execution logs to plain text format
 */
export function exportLogsToTxt(logs: ExecutionLog[], workflowName?: string): string {
    const lines: string[] = [];
    
    if (workflowName) {
        lines.push(`Workflow: ${workflowName}`);
        lines.push('='.repeat(50));
    }
    
    lines.push(`Exported: ${new Date().toISOString()}`);
    lines.push(`Total Steps: ${logs.length}`);
    lines.push('='.repeat(50));
    lines.push('');
    
    logs.forEach((log, index) => {
        const duration = log.endTime && log.startTime ? `(${log.endTime - log.startTime}ms)` : '';
        const status = log.status === 'completed' ? 'OK' : log.status === 'error' ? 'ERR' : '...';
        
        lines.push(`${index + 1}. ${status} ${log.nodeName} ${duration}`);
        
        if (log.error) {
            lines.push(`   Error: ${log.error}`);
        }
        
        if (log.output) {
            lines.push(`   Output: ${JSON.stringify(log.output)}`);
        }
        
        lines.push('');
    });
    
    return lines.join('\n');
}

/**
 * Download logs as file
 */
export function downloadLogs(
    logs: ExecutionLog[],
    filename: string = 'execution-logs',
    options: LogExportOptions
): void {
    let content: string;
    let mimeType: string;
    let extension: string;
    
    switch (options.format) {
        case 'json':
            content = exportLogsToJson(logs);
            mimeType = 'application/json';
            extension = 'json';
            break;
        case 'csv':
            content = exportLogsToCsv(logs);
            mimeType = 'text/csv';
            extension = 'csv';
            break;
        case 'txt':
        default:
            content = exportLogsToTxt(logs);
            mimeType = 'text/plain';
            extension = 'txt';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Export execution result (includes logs)
 */
export function exportExecutionResult(result: ExecutionResult, workflowName?: string, options?: Partial<LogExportOptions>): void {
    const opts: LogExportOptions = {
        format: 'json',
        includeTimestamps: true,
        includeDuration: true,
        includeInputs: true,
        includeOutputs: true,
        ...options
    };
    
    downloadLogs(result.logs, workflowName || 'execution-result', opts);
}
