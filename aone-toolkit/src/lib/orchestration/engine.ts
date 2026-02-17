/**
 * 编排模块 - 编排引擎
 * 负责工作流的执行和动态任务编排
 */

import type {
    OrchestrationWorkflow,
    OrchestrationNode,
    ExecutionContext,
    ExecutionResult,
    ExecutionLog,
    IOrchestrationEngine
} from './types';
import { agentRegistry, agentExecutor } from '../agents';
import { skillRegistry, skillExecutor } from '../skills';

class OrchestrationEngine implements IOrchestrationEngine {
    private activeExecutions: Map<string, {
        context: ExecutionContext;
        currentNodeId: string;
        paused: boolean;
        logs: ExecutionLog[];
    }> = new Map();

    async execute(
        workflow: OrchestrationWorkflow, 
        context: ExecutionContext
    ): Promise<ExecutionResult> {
        const executionId = `${workflow.id}-${Date.now()}`;
        
        // 初始化执行上下文
        this.activeExecutions.set(executionId, {
            context,
            currentNodeId: workflow.entryNodeId,
            paused: false,
            logs: []
        });

        const logs: ExecutionLog[] = [];
        
        try {
            // 从入口节点开始执行
            let currentNodeId = workflow.entryNodeId;
            const outputs: Record<string, any> = {};
            
            while (currentNodeId) {
                const execution = this.activeExecutions.get(executionId);
                if (!execution || execution.paused) {
                    break;
                }

                const node = workflow.nodes.find(n => n.id === currentNodeId);
                if (!node) {
                    throw new Error(`Node not found: ${currentNodeId}`);
                }

                // 记录开始时间
                const startTime = Date.now();
                
                // 执行节点
                let nodeOutput: any;
                try {
                    nodeOutput = await this.executeNode(node, {
                        ...context,
                        variables: { ...context.variables, ...outputs }
                    });
                    
                    logs.push({
                        nodeId: node.id,
                        nodeName: node.name,
                        startTime,
                        endTime: Date.now(),
                        duration: Date.now() - startTime,
                        status: 'completed',
                        output: nodeOutput
                    });
                    
                    // 保存输出
                    if (node.config && 'outputKey' in node.config && node.config.outputKey) {
                        outputs[node.config.outputKey] = nodeOutput;
                    }
                    
                } catch (error: any) {
                    logs.push({
                        nodeId: node.id,
                        nodeName: node.name,
                        startTime,
                        endTime: Date.now(),
                        duration: Date.now() - startTime,
                        status: 'error',
                        error: error.message
                    });
                    
                    return {
                        success: false,
                        outputs,
                        logs,
                        error: error.message
                    };
                }

                // 找到下一节点
                currentNodeId = this.findNextNode(workflow, currentNodeId, nodeOutput, outputs);
            }

            // 清理
            this.activeExecutions.delete(executionId);

            return {
                success: true,
                outputs,
                logs
            };

        } catch (error: any) {
            this.activeExecutions.delete(executionId);
            
            return {
                success: false,
                outputs: {},
                logs,
                error: error.message
            };
        }
    }

    private async executeNode(node: OrchestrationNode, context: ExecutionContext): Promise<any> {
        switch (node.type) {
            case 'agent':
                return await this.executeAgentNode(node, context);
            case 'skill':
                return await this.executeSkillNode(node, context);
            case 'condition':
                return this.evaluateConditionNode(node, context);
            case 'parallel':
                return await this.executeParallelNode(node, context);
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }

    private async executeAgentNode(node: OrchestrationNode, context: ExecutionContext): Promise<any> {
        const config = node.config as { agentId: string; inputMapping?: Record<string, string> };
        const agent = agentRegistry.getById(config.agentId);
        
        if (!agent) {
            throw new Error(`Agent not found: ${config.agentId}`);
        }

        // 构建输入
        let input = context.userInput;
        if (config.inputMapping) {
            for (const [key, varName] of Object.entries(config.inputMapping)) {
                input = input.replace(`{${key}}`, context.variables[varName] || '');
            }
        }

        const response = await agentExecutor.execute({
            agentId: agent.id,
            sessionId: context.sessionId,
            userInput: input,
            history: []
        });

        return response.content;
    }

    private async executeSkillNode(node: OrchestrationNode, context: ExecutionContext): Promise<any> {
        const config = node.config as { skillId: string; inputMapping?: Record<string, string> };
        const skill = skillRegistry.getById(config.skillId);
        
        if (!skill) {
            throw new Error(`Skill not found: ${config.skillId}`);
        }

        let input = context.userInput;
        if (config.inputMapping) {
            for (const [key, varName] of Object.entries(config.inputMapping)) {
                input = input.replace(`{${key}}`, context.variables[varName] || '');
            }
        }

        const result = await skillExecutor.execute({
            skillId: skill.id,
            userInput: input,
            conversationHistory: context.history.join('\n')
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        return result.output;
    }

    private evaluateConditionNode(node: OrchestrationNode, context: ExecutionContext): boolean {
        const config = node.config as { expression: string };
        
        // 简单的表达式求值（可以扩展为更复杂的规则引擎）
        try {
            // 替换变量
            let expression = config.expression;
            for (const [key, value] of Object.entries(context.variables)) {
                expression = expression.replace(new RegExp(`\\$${key}`, 'g'), JSON.stringify(value));
            }
            
            // 使用 Function 进行安全求值
            return new Function(`return ${expression}`)();
        } catch (e) {
            console.error('Condition evaluation error:', e);
            return false;
        }
    }

    private async executeParallelNode(node: OrchestrationNode, context: ExecutionContext): Promise<any> {
        const config = node.config as { nodeIds: string[]; mergeStrategy: string };
        
        // 并行执行所有子节点
        const promises = config.nodeIds.map(async (nodeId) => {
            const subNode = { id: nodeId, type: 'agent' as const, name: nodeId, config: {} };
            return await this.executeNode(subNode, context);
        });

        const results = await Promise.all(promises);

        // 根据合并策略返回结果
        switch (config.mergeStrategy) {
            case 'first':
                return results[0];
            case 'majority':
                // 简单返回第一个
                return results[0];
            case 'all':
            default:
                return results;
        }
    }

    private findNextNode(
        workflow: OrchestrationWorkflow, 
        currentNodeId: string, 
        nodeOutput: any,
        variables: Record<string, any>
    ): string | undefined {
        // 找到从当前节点出发的边
        const edges = workflow.edges.filter(e => e.source === currentNodeId);
        
        if (edges.length === 0) {
            return undefined;
        }

        if (edges.length === 1) {
            return edges[0].target;
        }

        // 多条边 - 根据条件选择
        for (const edge of edges) {
            if (!edge.condition) continue;
            
            try {
                let condition = edge.condition;
                // 替换变量
                for (const [key, value] of Object.entries(variables)) {
                    condition = condition.replace(new RegExp(`\\$${key}`, 'g'), JSON.stringify(value));
                }
                
                if (new Function(`return ${condition}`)()) {
                    return edge.target;
                }
            } catch (e) {
                console.error('Edge condition error:', e);
            }
        }

        // 默认返回第一条边
        return edges[0].target;
    }

    pause(executionId: string): void {
        const execution = this.activeExecutions.get(executionId);
        if (execution) {
            execution.paused = true;
        }
    }

    resume(executionId: string): void {
        const execution = this.activeExecutions.get(executionId);
        if (execution) {
            execution.paused = false;
        }
    }

    cancel(executionId: string): void {
        this.activeExecutions.delete(executionId);
    }

    validate(workflow: OrchestrationWorkflow): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // 检查入口节点
        if (!workflow.entryNodeId) {
            errors.push('Workflow must have an entry node');
        }

        // 检查节点存在性
        const nodeIds = new Set(workflow.nodes.map(n => n.id));
        for (const edge of workflow.edges) {
            if (!nodeIds.has(edge.source)) {
                errors.push(`Edge references non-existent source node: ${edge.source}`);
            }
            if (!nodeIds.has(edge.target)) {
                errors.push(`Edge references non-existent target node: ${edge.target}`);
            }
        }

        // 检查 Agent/Skill 引用
        for (const node of workflow.nodes) {
            if (node.type === 'agent') {
                const config = node.config as { agentId: string };
                if (!agentRegistry.getById(config.agentId)) {
                    errors.push(`Node "${node.name}" references non-existent agent: ${config.agentId}`);
                }
            }
            if (node.type === 'skill') {
                const config = node.config as { skillId: string };
                if (!skillRegistry.getById(config.skillId)) {
                    errors.push(`Node "${node.name}" references non-existent skill: ${config.skillId}`);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

export const orchestrationEngine = new OrchestrationEngine();
export default orchestrationEngine;
