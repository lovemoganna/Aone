import type { OrchestrationWorkflow, OrchestrationNode } from './types';

export interface StrategyStep {
    step: number;
    agent: string;
    skill?: string;
    instruction: string;
    nodeId?: string; // Track original node ID for visualization
}

/**
 * Converts an OrchestrationWorkflow into a linear Strategy for execution in the Chat interface.
 * 
 * Limitations:
 * - Condition nodes: Currently always selects the 'true' branch or first edge.
 * - Parallel nodes: Currently sequentializes nodes.
 */
export function workflowToStrategy(workflow: OrchestrationWorkflow): StrategyStep[] {
    const steps: StrategyStep[] = [];

    // 1. Find entry node
    let currentNodeId: string | undefined = workflow.entryNodeId;
    const visited = new Set<string>();
    let stepIndex = 1;

    // 2. Traverse the graph (Linear walk)
    while (currentNodeId && !visited.has(currentNodeId)) {
        visited.add(currentNodeId);
        const node = workflow.nodes.find(n => n.id === currentNodeId);

        if (!node) break;

        // 3. Process Node
        processNode(node, steps, stepIndex);

        // Increment step index if we added steps
        if (steps.length > 0 && steps[steps.length - 1].step === stepIndex) {
            stepIndex++;
        }

        // 4. Find next node
        currentNodeId = findNextNodeId(workflow, node);
    }

    return steps;
}

function processNode(node: OrchestrationNode, steps: StrategyStep[], currentStepIndex: number) {
    if (node.type === 'agent') {
        const config = node.config as { agentId: string };
        steps.push({
            step: currentStepIndex,
            agent: config.agentId,
            instruction: node.name || `Execute ${config.agentId}`,
            nodeId: node.id
        });
    } else if (node.type === 'skill') {
        const config = node.config as { skillId: string; agentId?: string };
        // Default to 'decomposer' or 'calculator' if no agent specified for skill, 
        // but ideally the UI should enforce agent selection for skills.
        // For now, let's use a meaningful default or the one from config.
        const agentId = config.agentId || 'decomposer';

        steps.push({
            step: currentStepIndex,
            agent: agentId,
            skill: config.skillId,
            instruction: node.name || `Execute Skill: ${config.skillId}`,
            nodeId: node.id
        });
    } else if (node.type === 'parallel') {
        // Sequentialize for now
        // In a real parallel implementation, this would generate multiple steps with same index or a special parallel struct
        // For the chat linear execution, we just add them sequentially
        const config = node.config as { nodeIds: string[] };
        // Note: This logic assumes parallel nodes are expanded in the strategy or handled by the engine.
        // Since we are bridging to a LINEAR strategy execution:
        // We can't easily jump into 'sub-nodes' without looking them up.
        // The current engine doesn't allow 'nested' strategies easily.
        // SIMPLIFICATION: We will skip complex parallel node expansion HERE 
        // and rely on the linear traversal finding the next nodes if they are linked.
        // BUT, parallel nodes usually point to multiple NEXT nodes.
        // If this 'parallel' node contains the IDs of nodes to run:
        // We should add them to the steps list.

        // However, standard OrchestrationNode definition for 'parallel' usually implies
        // it controls execution of other nodes.
        // Let's assume for this bridge we just log a placeholder or try to process them.
        steps.push({
            step: currentStepIndex,
            agent: 'coordinator', // System agent
            instruction: `[PARALLEL START] ${node.name}`,
            nodeId: node.id
        });
    }
}

function findNextNodeId(workflow: OrchestrationWorkflow, currentNode: OrchestrationNode): string | undefined {
    // Find edges starting from this node
    const edges = workflow.edges.filter(e => e.source === currentNode.id);

    if (edges.length === 0) return undefined;

    // Simple heuristic for linear conversion:
    // 1. If Condition Node: try to find 'true' path (conceptual)
    // 2. Otherwise take the first edge

    // In strict DAG, we might have multiple outgoing edges (parallel).
    // For this linear bridge, we prioritize the first connection.
    return edges[0].target;
}
