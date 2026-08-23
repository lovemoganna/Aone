<script lang="ts">
    import { AlertCircle, AlertTriangle, Info, X, RefreshCw, CheckCircle } from 'lucide-svelte';
    import { slide } from 'svelte/transition';
    import type { FlowEdge, FlowNode } from './types';
    
    let {
        nodes = [],
        edges = [],
        isOpen = $bindable(false),
        onIssueClick = (issue: ValidationIssue) => {},
    } = $props<{
        nodes: FlowNode[];
        edges: FlowEdge[];
        isOpen?: boolean;
        onIssueClick?: (issue: ValidationIssue) => void;
    }>();

    // Validation Issue type
    interface ValidationIssue {
        id: string;
        type: 'node' | 'edge' | 'flow';
        severity: 'error' | 'warning' | 'info';
        message: string;
        nodeId?: string;
        edgeId?: string;
        field?: string;
        fix?: () => void;
    }

    // Run validation
    let issues = $derived.by((): ValidationIssue[] => {
        const allIssues: ValidationIssue[] = [];
        
        // Flow-level validation
        if (nodes.length === 0) {
            allIssues.push({
                id: 'flow-no-nodes',
                type: 'flow',
                severity: 'error',
                message: '工作流为空',
            });
            return allIssues;
        }

        // Check for start node
        const hasStart = nodes.some((n: FlowNode) => n.type === 'start');
        if (nodes.length > 0 && !hasStart) {
            allIssues.push({
                id: 'flow-no-start',
                type: 'flow',
                severity: 'warning',
                message: '缺少开始节点',
            });
        }

        // Check for end node
        const hasEnd = nodes.some((n: FlowNode) => n.type === 'end');
        if (nodes.length > 0 && !hasEnd) {
            allIssues.push({
                id: 'flow-no-end',
                type: 'flow',
                severity: 'info',
                message: '建议添加结束节点',
            });
        }

        // ENHANCEMENT 10: Check for nodes with no incoming connections (except start nodes)
        const targetIds = new Set<string>();
        edges.forEach((edge: any) => {
            targetIds.add(edge.target);
        });
        
        nodes.forEach((node: any) => {
            // Skip start nodes - they don't need incoming connections
            if (node.type === 'start') return;
            
            if (!targetIds.has(node.id) && nodes.length > 1) {
                allIssues.push({
                    id: `no-incoming-${node.id}`,
                    type: 'node',
                    severity: 'info',
                    message: `节点 "${node.data?.label || node.id}" 没有输入连接`,
                    nodeId: node.id,
                });
            }
        });

        // ENHANCEMENT 10: Check for nodes with no outgoing connections (except end nodes)
        const sourceIds = new Set<string>();
        edges.forEach((edge: any) => {
            sourceIds.add(edge.source);
        });
        
        nodes.forEach((node: any) => {
            // Skip end nodes - they don't need outgoing connections
            if (node.type === 'end') return;
            
            if (!sourceIds.has(node.id) && nodes.length > 1) {
                allIssues.push({
                    id: `no-outgoing-${node.id}`,
                    type: 'node',
                    severity: 'info',
                    message: `节点 "${node.data?.label || node.id}" 没有输出连接`,
                    nodeId: node.id,
                });
            }
        });

        // ENHANCEMENT 12: Check for cycles in the graph
        const adjacency = new Map<string, string[]>();
        edges.forEach((edge: any) => {
            if (!adjacency.has(edge.source)) {
                adjacency.set(edge.source, []);
            }
            adjacency.get(edge.source)!.push(edge.target);
        });

        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        
        function detectCycleFrom(nodeId: string, path: string[]): string[] | null {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            
            const neighbors = adjacency.get(nodeId) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    const cycle = detectCycleFrom(neighbor, [...path, neighbor]);
                    if (cycle) return cycle;
                } else if (recursionStack.has(neighbor)) {
                    // Found cycle
                    const cycleStart = path.indexOf(neighbor);
                    return [...path.slice(cycleStart), neighbor];
                }
            }
            
            recursionStack.delete(nodeId);
            return null;
        }

        for (const node of nodes) {
            if (!visited.has(node.id)) {
                const cycle = detectCycleFrom(node.id, [node.id]);
                if (cycle) {
                    allIssues.push({
                        id: `cycle-detected`,
                        type: 'flow',
                        severity: 'warning',
                        message: `检测到循环: ${cycle.join(' -> ')}`,
                    });
                    break; // Only report one cycle
                }
            }
        }

        // Check for orphaned nodes
        const connectedIds = new Set<string>();
        edges.forEach((edge: any) => {
            connectedIds.add(edge.source);
            connectedIds.add(edge.target);
        });
        
        nodes.forEach((node: any) => {
            if (!connectedIds.has(node.id) && nodes.length > 1) {
                allIssues.push({
                    id: `orphaned-${node.id}`,
                    type: 'node',
                    severity: 'info',
                    message: `节点 "${node.data?.label || node.id}" 未连接到任何其他节点`,
                    nodeId: node.id,
                });
            }
            
            // Check for nodes without labels
            if (!node.data?.label) {
                allIssues.push({
                    id: `no-label-${node.id}`,
                    type: 'node',
                    severity: 'warning',
                    message: `节点缺少标签`,
                    nodeId: node.id,
                });
            }
        });

        // Check for duplicate edges
        const edgePairs = new Set<string>();
        edges.forEach((edge: any) => {
            const pair = `${edge.source}->${edge.target}`;
            if (edgePairs.has(pair)) {
                allIssues.push({
                    id: `duplicate-edge-${edge.id}`,
                    type: 'edge',
                    severity: 'warning',
                    message: '存在重复的连接',
                    edgeId: edge.id,
                });
            }
            edgePairs.add(pair);
        });

        // Check for self-loops
        edges.forEach((edge: any) => {
            if (edge.source === edge.target) {
                allIssues.push({
                    id: `self-loop-${edge.id}`,
                    type: 'edge',
                    severity: 'error',
                    message: '连接不能指向节点自身',
                    edgeId: edge.id,
                });
            }
        });

        // Check for nodes with required fields
        nodes.forEach((node: any) => {
            if (node.type === 'agent' && !node.data?.agentName) {
                allIssues.push({
                    id: `agent-no-name-${node.id}`,
                    type: 'node',
                    severity: 'error',
                    message: `Agent 节点未选择 Agent`,
                    nodeId: node.id,
                });
            }
            if (node.type === 'skill' && !node.data?.skillName) {
                allIssues.push({
                    id: `skill-no-name-${node.id}`,
                    type: 'node',
                    severity: 'error',
                    message: `Skill 节点未选择技能`,
                    nodeId: node.id,
                });
            }
            if (node.type === 'condition' && !node.data?.condition?.variable) {
                allIssues.push({
                    id: `condition-no-var-${node.id}`,
                    type: 'node',
                    severity: 'warning',
                    message: `条件节点未配置条件`,
                    nodeId: node.id,
                });
            }
        });

        return allIssues;
    });

    let errorCount = $derived(issues.filter(i => i.severity === 'error').length);
    let warningCount = $derived(issues.filter(i => i.severity === 'warning').length);
    let infoCount = $derived(issues.filter(i => i.severity === 'info').length);

    function getIcon(severity: string) {
        switch (severity) {
            case 'error': return AlertCircle;
            case 'warning': return AlertTriangle;
            default: return Info;
        }
    }

    function getColor(severity: string) {
        switch (severity) {
            case 'error': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
            case 'warning': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20';
            default: return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
        }
    }
</script>

{#if isOpen}
    <div 
        class="fixed right-4 top-20 w-80 max-h-[60vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden z-50"
        transition:slide={{ duration: 200 }}
    >
        <!-- Header -->
        <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <div class="flex items-center gap-2">
                <CheckCircle class="w-4 h-4 {errorCount > 0 ? 'text-red-500' : warningCount > 0 ? 'text-amber-500' : 'text-green-500'}" />
                <span class="font-semibold text-sm text-slate-900 dark:text-white">
                    验证结果
                </span>
            </div>
            <div class="flex items-center gap-2">
                <!-- Count badges -->
                {#if errorCount > 0}
                    <span class="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full">
                        {errorCount}
                    </span>
                {/if}
                {#if warningCount > 0}
                    <span class="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs rounded-full">
                        {warningCount}
                    </span>
                {/if}
                <button 
                    onclick={() => isOpen = false}
                    class="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                >
                    <X class="w-4 h-4 text-slate-400" />
                </button>
            </div>
        </div>

        <!-- Issues List -->
        <div class="flex-1 overflow-y-auto p-2 space-y-2">
            {#if issues.length === 0}
                <div class="text-center py-8 text-slate-400">
                    <CheckCircle class="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p class="text-sm">验证通过</p>
                </div>
            {:else}
                {#each issues as issue (issue.id)}
                    {@const IssueIcon = getIcon(issue.severity)}
                    <button
                        class="w-full text-left p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors {getColor(issue.severity)}"
                        onclick={() => onIssueClick(issue)}
                    >
                        <div class="flex items-start gap-2">
                            <IssueIcon class="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div class="flex-1 min-w-0">
                                <p class="text-xs font-medium text-slate-900 dark:text-white">
                                    {issue.message}
                                </p>
                                <p class="text-[10px] text-slate-400 mt-1">
                                    {issue.type === 'node' ? '节点' : issue.type === 'edge' ? '连接' : '工作流'}
                                    {#if issue.nodeId}
                                        • ID: {issue.nodeId.slice(0, 8)}...
                                    {/if}
                                </p>
                            </div>
                        </div>
                    </button>
                {/each}
            {/if}
        </div>

        <!-- Footer -->
        {#if issues.length > 0}
            <div class="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <button
                    class="w-full py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center gap-1"
                >
                    <RefreshCw class="w-3 h-3" />
                    重新验证
                </button>
            </div>
        {/if}
    </div>
{/if}
