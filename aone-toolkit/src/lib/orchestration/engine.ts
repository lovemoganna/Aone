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

function safeEvaluateExpression(expr: string, vars: Record<string, any>): boolean {
    try {
        let evaluated = expr.trim();
        for (const [key, value] of Object.entries(vars || {})) {
            evaluated = evaluated.replace(new RegExp(`\\$${key}`, 'g'), JSON.stringify(value));
        }
        
        if (evaluated === 'true') return true;
        if (evaluated === 'false') return false;
        
        const eqMatch = evaluated.match(/^\s*(.+?)\s*===?\s*(.+?)\s*$/);
        if (eqMatch) {
            try {
                return JSON.parse(eqMatch[1]) === JSON.parse(eqMatch[2]);
            } catch {
                return eqMatch[1].trim() === eqMatch[2].trim();
            }
        }
        
        const neqMatch = evaluated.match(/^\s*(.+?)\s*!==?\s*(.+?)\s*$/);
        if (neqMatch) {
            try {
                return JSON.parse(neqMatch[1]) !== JSON.parse(neqMatch[2]);
            } catch {
                return neqMatch[1].trim() !== neqMatch[2].trim();
            }
        }

        const numCompMatch = evaluated.match(/^\s*(-?\d+(?:\.\d+)?)\s*(>|<|>=|<=)\s*(-?\d+(?:\.\d+)?)\s*$/);
        if (numCompMatch) {
            const a = parseFloat(numCompMatch[1]);
            const op = numCompMatch[2];
            const b = parseFloat(numCompMatch[3]);
            if (op === '>') return a > b;
            if (op === '<') return a < b;
            if (op === '>=') return a >= b;
            if (op === '<=') return a <= b;
        }

        return Boolean(evaluated);
    } catch {
        return false;
    }
}

// ============== 执行快照 ==============

export interface ExecutionSnapshot {
    executionId: string;
    workflow: OrchestrationWorkflow;
    currentNodeId: string;
    completedNodeIds: string[];
    outputs: Record<string, any>;
    variables: Record<string, any>;
    logs: ExecutionLog[];
    pausedAt: number;
}

// ============== 可编辑执行状态 ==============

interface EditableExecutionState {
    executionId: string;
    originalWorkflow: OrchestrationWorkflow;
    currentWorkflow: OrchestrationWorkflow;
    context: ExecutionContext;
    currentNodeId: string;
    paused: boolean;
    logs: ExecutionLog[];
    outputs: Record<string, any>;
    completedNodeIds: string[];
}

// 工作流存储接口
export interface IWorkflowStorage {
    getWorkflow(id: string): import('./types').OrchestrationWorkflow | undefined;
    getAllWorkflows(): import('./types').OrchestrationWorkflow[];
}

class OrchestrationEngine implements IOrchestrationEngine {
    private activeExecutions: Map<string, {
        context: ExecutionContext;
        currentNodeId: string;
        paused: boolean;
        logs: ExecutionLog[];
    }> = new Map();
    
    // 可编辑的执行状态（用于支持执行中修改工作流）
    private editableExecutions: Map<string, EditableExecutionState> = new Map();
    
    // 工作流存储（可由外部注入）
    private static workflowStorage: IWorkflowStorage | null = null;
    
    /**
     * 注册工作流存储（用于子工作流调用）
     */
    static setWorkflowStorage(storage: IWorkflowStorage): void {
        OrchestrationEngine.workflowStorage = storage;
    }

    async execute(
        workflow: OrchestrationWorkflow,
        context: ExecutionContext,
        onProgress?: (log: ExecutionLog) => void
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
            let currentNodeId: string | undefined = workflow.entryNodeId;
            const outputs: Record<string, any> = {};
            const maxSteps = context.options?.maxExecutionSteps || 300;
            const maxNodeVisits = context.options?.maxNodeVisits || 50;
            const nodeVisitCounts = new Map<string, number>();
            let stepCount = 0;

            while (currentNodeId) {
                stepCount++;
                if (stepCount > maxSteps) {
                    throw new Error(`[Circuit Breaker] Workflow execution steps exceeded safety limit (${maxSteps}). Terminated to prevent infinite loop.`);
                }

                const visits = (nodeVisitCounts.get(currentNodeId) || 0) + 1;
                nodeVisitCounts.set(currentNodeId, visits);
                if (visits > maxNodeVisits) {
                    throw new Error(`[Circuit Breaker] Node (${currentNodeId}) exceeded maximum allowed iterations (${maxNodeVisits}). Terminated loop overflow.`);
                }

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
                    }, workflow);

                    const logEntry: ExecutionLog = {
                        nodeId: node.id,
                        nodeName: node.name,
                        startTime,
                        endTime: Date.now(),
                        duration: Date.now() - startTime,
                        status: 'completed',
                        output: nodeOutput
                    };
                    logs.push(logEntry);
                    if (onProgress) onProgress(logEntry);

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

    private async executeNode(
        node: OrchestrationNode,
        context: ExecutionContext,
        workflow: OrchestrationWorkflow
    ): Promise<any> {
        // 获取执行策略
        const policy = node.executionPolicy;
        const retryConfig = policy?.retry;
        const timeoutConfig = policy?.timeout;
        
        // 如果有重试配置，执行带重试的节点
        if (retryConfig && retryConfig.maxRetries > 0) {
            return await this.executeNodeWithRetry(node, context, workflow, retryConfig, timeoutConfig);
        }
        
        // 如果有超时配置（但没有重试），执行带超时的节点
        if (timeoutConfig?.enableTimeout) {
            return await this.executeNodeWithTimeout(node, context, workflow, timeoutConfig);
        }
        
        // 默认执行
        return await this.executeNodeCore(node, context, workflow);
    }
    
    /**
     * 核心节点执行逻辑
     */
    private async executeNodeCore(
        node: OrchestrationNode,
        context: ExecutionContext,
        workflow: OrchestrationWorkflow
    ): Promise<any> {
        switch (node.type) {
            case 'agent':
                return await this.executeAgentNode(node, context);
            case 'skill':
                return await this.executeSkillNode(node, context);
            case 'condition':
                return this.evaluateConditionNode(node, context);
            case 'parallel':
                return await this.executeParallelNode(node, context, workflow);
            case 'subworkflow':
                return await this.executeSubworkflowNode(node, context);
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }
    
    /**
     * 执行子工作流节点
     */
    private async executeSubworkflowNode(node: OrchestrationNode, context: ExecutionContext): Promise<any> {
        const config = node.config as import('./types').SubworkflowNodeConfig;
        
        // 从工作流存储中获取子工作流
        const subWorkflow = this.getSubworkflow(config.workflowId);
        
        if (!subWorkflow) {
            throw new Error(`Subworkflow not found: ${config.workflowId}`);
        }
        
        // 构建子工作流的输入
        let subInput = context.userInput;
        if (config.inputMapping) {
            for (const [key, varName] of Object.entries(config.inputMapping)) {
                subInput = subInput.replace(`{${key}}`, context.variables[varName] || '');
            }
        }
        
        // 创建子工作流的执行上下文
        const subContext: ExecutionContext = {
            ...context,
            userInput: subInput,
            workflowId: subWorkflow.id
        };
        
        // 执行子工作流
        const result = await this.execute(subWorkflow, subContext);
        
        if (!result.success) {
            // 根据错误处理策略处理
            const errorStrategy = config.onError || 'stop';
            
            if (errorStrategy === 'stop') {
                throw new Error(`Subworkflow failed: ${result.error}`);
            } else if (errorStrategy === 'continue') {
                console.warn(`Subworkflow ${subWorkflow.name} failed, continuing: ${result.error}`);
                return { success: false, error: result.error, outputs: result.outputs };
            } else if (errorStrategy === 'retry') {
                // 重试一次
                const retryResult = await this.execute(subWorkflow, subContext);
                if (!retryResult.success) {
                    throw new Error(`Subworkflow failed after retry: ${retryResult.error}`);
                }
                return retryResult.outputs;
            }
        }
        
        return result.outputs;
    }
    
    /**
     * 获取子工作流（由外部提供）
     */
    private getSubworkflow(workflowId: string): OrchestrationWorkflow | null {
        if (OrchestrationEngine.workflowStorage) {
            return OrchestrationEngine.workflowStorage.getWorkflow(workflowId) || null;
        }
        
        // 尝试从 workflowStore 获取
        if (typeof window !== 'undefined') {
            try {
                // 动态导入 workflowStore
                const { workflowStore } = require('./workflowStore');
                const workflow = workflowStore.getWorkflow(workflowId);
                return workflow?.workflow || null;
            } catch (e) {
                // 忽略错误
            }
        }
        
        return null;
    }
    
    /**
     * 带重试的节点执行
     */
    private async executeNodeWithRetry(
        node: OrchestrationNode,
        context: ExecutionContext,
        workflow: OrchestrationWorkflow,
        retryConfig: import('./types').RetryConfig,
        timeoutConfig?: import('./types').TimeoutConfig
    ): Promise<any> {
        let lastError: Error | null = null;
        let attempt = 0;
        
        while (attempt <= retryConfig.maxRetries) {
            attempt++;
            
            try {
                // 如果有超时配置
                if (timeoutConfig?.enableTimeout) {
                    return await this.executeNodeWithTimeout(node, context, workflow, timeoutConfig);
                }
                
                return await this.executeNodeCore(node, context, workflow);
                
            } catch (error: any) {
                lastError = error;
                
                // 检查错误是否可重试
                if (retryConfig.retryableErrors && retryConfig.retryableErrors.length > 0) {
                    const isRetryable = retryConfig.retryableErrors.some(
                        errType => error.message?.includes(errType)
                    );
                    if (!isRetryable) {
                        throw error; // 不可重试的错误直接抛出
                    }
                }
                
                // 如果还有重试次数
                if (attempt <= retryConfig.maxRetries) {
                    // 计算延迟
                    let delay = retryConfig.retryDelay;
                    
                    if (retryConfig.backoff === 'exponential') {
                        delay = retryConfig.retryDelay * Math.pow(2, attempt - 1);
                    } else if (retryConfig.backoff === 'linear') {
                        delay = retryConfig.retryDelay * attempt;
                    }
                    
                    console.log(`Node ${node.name} failed, retrying in ${delay}ms (attempt ${attempt}/${retryConfig.maxRetries})`);
                    
                    await this.sleep(delay);
                }
            }
        }
        
        // 所有重试都失败
        throw lastError || new Error(`Node ${node.name} failed after ${retryConfig.maxRetries} retries`);
    }
    
    /**
     * 带超时的节点执行
     */
    private async executeNodeWithTimeout(
        node: OrchestrationNode,
        context: ExecutionContext,
        workflow: OrchestrationWorkflow,
        timeoutConfig: import('./types').TimeoutConfig
    ): Promise<any> {
        const timeout = timeoutConfig.nodeTimeout;
        
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Node ${node.name} execution timeout after ${timeout}ms`));
            }, timeout);
            
            this.executeNodeCore(node, context, workflow)
                .then(result => {
                    clearTimeout(timer);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    }
    
    /**
     * 睡眠函数
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
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
        return safeEvaluateExpression(config.expression, context.variables);
    }

    private async executeParallelNode(
        node: OrchestrationNode,
        context: ExecutionContext,
        workflow: OrchestrationWorkflow
    ): Promise<any> {
        const config = node.config as { nodeIds: string[]; mergeStrategy: string; timeoutMs?: number };
        const timeoutMs = config.timeoutMs || context.options?.branchTimeoutMs || 30000;

        // 并行执行所有子节点，增加单分支超时防护
        const promises = config.nodeIds.map(async (nodeId) => {
            const subNode = workflow.nodes.find(n => n.id === nodeId);
            if (!subNode) throw new Error(`Parallel node references missing node: ${nodeId}`);
            
            return Promise.race([
                this.executeNode(subNode, context, workflow),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error(`[Branch Timeout] Branch node ${nodeId} timed out after ${timeoutMs}ms`)), timeoutMs)
                )
            ]);
        });

        const results = await Promise.allSettled(promises);
        const settledValues = results.map(res => 
            res.status === 'fulfilled' ? res.value : { error: (res as PromiseRejectedResult).reason?.message || 'Branch failed' }
        );

        // 根据合并策略返回结果
        switch (config.mergeStrategy) {
            case 'first':
                const firstSuccess = results.find(r => r.status === 'fulfilled');
                return firstSuccess ? (firstSuccess as PromiseFulfilledResult<any>).value : settledValues[0];
            case 'majority':
                // 优先返回首个成功结果，若全部失败则返回第一个错误
                const anySuccess = results.find(r => r.status === 'fulfilled');
                return anySuccess ? (anySuccess as PromiseFulfilledResult<any>).value : settledValues[0];
            case 'all':
            default:
                return settledValues;
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

            if (safeEvaluateExpression(edge.condition, variables)) {
                return edge.target;
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
        this.editableExecutions.delete(executionId);
    }
    
    // ============== 动态工作流修改支持 ==============
    
    /**
     * 开始可编辑执行 - 支持执行中修改工作流
     */
    async executeEditable(
        workflow: OrchestrationWorkflow,
        context: ExecutionContext,
        onProgress?: (log: ExecutionLog) => void
    ): Promise<{ executionId: string }> {
        const executionId = `editable_${workflow.id}_${Date.now()}`;
        
        // 初始化可编辑执行状态
        this.editableExecutions.set(executionId, {
            executionId,
            originalWorkflow: JSON.parse(JSON.stringify(workflow)),
            currentWorkflow: JSON.parse(JSON.stringify(workflow)),
            context,
            currentNodeId: workflow.entryNodeId,
            paused: false,
            logs: [],
            outputs: {},
            completedNodeIds: []
        });
        
        // 启动异步执行
        this.runEditableExecution(executionId, onProgress);
        
        return { executionId };
    }
    
    /**
     * 运行可编辑执行的主循环
     */
    private async runEditableExecution(
        executionId: string,
        onProgress?: (log: ExecutionLog) => void
    ): Promise<ExecutionResult> {
        const state = this.editableExecutions.get(executionId);
        if (!state) {
            return { success: false, outputs: {}, logs: [], error: 'Execution not found' };
        }
        
        const { currentWorkflow, context } = state;
        
        try {
            let currentNodeId: string | undefined = state.currentNodeId;
            
            while (currentNodeId && !state.paused) {
                const node = currentWorkflow.nodes.find(n => n.id === currentNodeId);
                if (!node) {
                    throw new Error(`Node not found: ${currentNodeId}`);
                }
                
                const startTime = Date.now();
                
                try {
                    const nodeOutput = await this.executeNode(node, {
                        ...context,
                        variables: { ...context.variables, ...state.outputs }
                    }, currentWorkflow);
                    
                    const logEntry: ExecutionLog = {
                        nodeId: node.id,
                        nodeName: node.name,
                        startTime,
                        endTime: Date.now(),
                        duration: Date.now() - startTime,
                        status: 'completed',
                        output: nodeOutput
                    };
                    
                    state.logs.push(logEntry);
                    state.completedNodeIds.push(node.id);
                    
                    if (onProgress) onProgress(logEntry);
                    
                    // 保存输出
                    if (node.config && 'outputKey' in node.config && node.config.outputKey) {
                        state.outputs[node.config.outputKey] = nodeOutput;
                    }
                    
                } catch (error: any) {
                    state.logs.push({
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
                        outputs: state.outputs,
                        logs: state.logs,
                        error: error.message
                    };
                }
                
                // 找到下一节点
                currentNodeId = this.findNextNode(currentWorkflow, currentNodeId, state.outputs, state.outputs);
                state.currentNodeId = currentNodeId || '';
            }
            
            return {
                success: !state.paused,
                outputs: state.outputs,
                logs: state.logs,
                error: state.paused ? 'Execution paused' : undefined
            };
            
        } catch (error: any) {
            return {
                success: false,
                outputs: state.outputs,
                logs: state.logs,
                error: error.message
            };
        }
    }
    
    /**
     * 获取执行快照
     */
    getSnapshot(executionId: string): ExecutionSnapshot | null {
        const state = this.editableExecutions.get(executionId);
        if (!state) {
            return null;
        }
        
        return {
            executionId,
            workflow: state.currentWorkflow,
            currentNodeId: state.currentNodeId,
            completedNodeIds: [...state.completedNodeIds],
            outputs: { ...state.outputs },
            variables: { ...state.context.variables },
            logs: [...state.logs],
            pausedAt: Date.now()
        };
    }
    
    /**
     * 暂停可编辑执行
     */
    pauseEditable(executionId: string): boolean {
        const state = this.editableExecutions.get(executionId);
        if (!state) return false;
        
        state.paused = true;
        return true;
    }
    
    /**
     * 恢复可编辑执行
     */
    resumeEditable(executionId: string): void {
        const state = this.editableExecutions.get(executionId);
        if (!state || !state.paused) return;
        
        state.paused = false;
        this.runEditableExecution(executionId);
    }
    
    /**
     * 修改工作流（执行中动态修改）
     */
    modifyWorkflow(executionId: string, modifiedWorkflow: OrchestrationWorkflow): boolean {
        const state = this.editableExecutions.get(executionId);
        if (!state) return false;
        
        // 验证修改后的工作流
        const validation = this.validate(modifiedWorkflow);
        if (!validation.valid) {
            console.error('Invalid workflow modification:', validation.errors);
            return false;
        }
        
        // 更新当前工作流
        state.currentWorkflow = JSON.parse(JSON.stringify(modifiedWorkflow));
        
        return true;
    }
    
    /**
     * 使用修改后的工作流继续执行
     */
    continueWithModifiedWorkflow(
        executionId: string,
        modifiedWorkflow: OrchestrationWorkflow,
        onProgress?: (log: ExecutionLog) => void
    ): Promise<ExecutionResult> {
        const state = this.editableExecutions.get(executionId);
        if (!state) {
            return Promise.resolve({ 
                success: false, 
                outputs: {}, 
                logs: [], 
                error: 'Execution not found' 
            });
        }
        
        // 验证并更新工作流
        const validation = this.validate(modifiedWorkflow);
        if (!validation.valid) {
            return Promise.resolve({ 
                success: false, 
                outputs: state.outputs, 
                logs: state.logs, 
                error: `Invalid workflow: ${validation.errors.join(', ')}` 
            });
        }
        
        state.currentWorkflow = JSON.parse(JSON.stringify(modifiedWorkflow));
        state.paused = false;
        
        return this.runEditableExecution(executionId, onProgress);
    }
    
    /**
     * 取消可编辑执行
     */
    cancelEditable(executionId: string): void {
        this.editableExecutions.delete(executionId);
    }
    
    /**
     * 获取可编辑执行状态
     */
    getEditableState(executionId: string): EditableExecutionState | null {
        return this.editableExecutions.get(executionId) || null;
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
