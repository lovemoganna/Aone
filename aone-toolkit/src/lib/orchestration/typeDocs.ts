// @ts-nocheck
/**
 * Type Documentation Generator
 * Generates markdown documentation for TypeScript types
 */

import type { OrchestrationWorkflow, OrchestrationNode, OrchestrationNodeType } from './types';

/**
 * Generate markdown documentation for a workflow
 */
export function generateWorkflowDocs(workflow: OrchestrationWorkflow): string {
    const lines: string[] = [];
    
    lines.push(`# ${workflow.name}`);
    lines.push('');
    lines.push(`> ${workflow.description || 'No description'}`);
    lines.push('');
    lines.push(`**Version:** ${workflow.version || '1.0'} | **Entry Node:** ${workflow.entryNodeId}`);
    lines.push('');
    
    // Nodes section
    lines.push('## 节点');
    lines.push('');
    lines.push('| ID | Type | Name | Description |');
    lines.push('|---|---|---|---|');
    
    for (const node of workflow.nodes) {
        const desc = (node as OrchestrationNode & { description?: string }).description || '-';
        lines.push(`| \`${node.id}\` | \`${node.type}\` | ${node.name} | ${desc} |`);
    }
    
    lines.push('');
    
    // Edges section
    lines.push('## 连接');
    lines.push('');
    lines.push('| From | To | Label |');
    lines.push('|---|---|---|');
    
    for (const edge of workflow.edges || []) {
        lines.push(`| \`${edge.source}\` | \`${edge.target}\` | ${edge.label || '-'} |`);
    }
    
    lines.push('');
    
    return lines.join('\n');
}

/**
 * Generate markdown documentation for node types
 */
export function generateNodeTypeDocs(): string {
    const lines: string[] = [];
    
    lines.push('# 节点类型参考');
    lines.push('');
    
    const nodeTypes: Array<{ type: string; name: string; desc: string; config?: string }> = [
        { type: 'start', name: '开始', desc: '工作流的起始节点', config: '无' },
        { type: 'end', name: '结束', desc: '工作流的终止节点', config: '无' },
        { type: 'agent', name: 'Agent', desc: '调用 AI Agent 执行任务', config: 'agentId, timeout, retry' },
        { type: 'skill', name: 'Skill', desc: '调用认知技能处理任务', config: 'skillId, input' },
        { type: 'condition', name: '条件', desc: '根据条件分支', config: 'expression, trueNodeId, falseNodeId' },
        { type: 'parallel', name: '并行', desc: '并行执行多个节点', config: 'nodeIds[], strategy' },
        { type: 'subworkflow', name: '子工作流', desc: '调用子工作流', config: 'workflowId, input' },
    ];
    
    lines.push('| Type | Name | Description | Config |');
    lines.push('|---|---|---|---|');
    
    for (const nt of nodeTypes) {
        lines.push(`| \`${nt.type}\` | ${nt.name} | ${nt.desc} | ${nt.config} |`);
    }
    
    return lines.join('\n');
}

/**
 * Export documentation as file
 */
export function downloadDocs(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
