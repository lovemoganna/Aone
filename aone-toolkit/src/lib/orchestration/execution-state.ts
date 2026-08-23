/**
 * 编排执行状态管理器
 * 负责编排会话的持久化、恢复和时间旅行
 */

import { browser } from '$app/environment';
import type { OrchestrationWorkflow, ExecutionContext } from './types';

// ============== 会话状态 ==============

export interface OrchestrationSession {
    // 唯一标识
    id: string;
    
    // 会话名称
    name: string;
    
    // 时间戳
    createdAt: number;
    updatedAt: number;
    lastActiveAt: number;
    
    // 当前状态
    status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
    
    // 原始输入
    originalInput: string;
    
    // 执行的 Workflow
    workflow?: OrchestrationWorkflow;
    
    // 执行轨迹
    trajectory: ExecutionStep[];
    
    // 当前断点
    currentCheckpoint?: CheckpointData;
    
    // 执行结果
    result?: {
        success: boolean;
        outputs: Record<string, any>;
        error?: string;
        completedAt: number;
    };
    
    // 元数据
    tags: string[];
    notes?: string;
    
    // 关联的 Agents 和 Skills
    involvedAgents?: string[];
    involvedSkills?: string[];
}

// ============== 执行步骤 ==============

export interface ExecutionStep {
    // 步骤索引
    stepIndex: number;
    
    // 时间戳
    timestamp: number;
    
    // 执行的节点
    nodeId?: string;
    nodeType?: 'agent' | 'skill' | 'condition' | 'parallel';
    agentId?: string;
    skillId?: string;
    
    // 输入输出
    input?: any;
    output?: any;
    error?: string;
    
    // 持续时间
    duration?: number;
    
    // 用户交互点
    requiresUserInput?: boolean;
    userInput?: string;
}

// ============== 断点数据 ==============

export interface CheckpointData {
    // 断点ID
    id: string;
    
    // 创建时间
    createdAt: number;
    
    // 对应的步骤索引
    stepIndex: number;
    
    // 完整工作流快照
    workflowSnapshot?: OrchestrationWorkflow;
    
    // 工作流状态
    workflowState: {
        currentNodeId: string;
        completedNodeIds: string[];
        pendingNodeIds: string[];
        variables: Record<string, any>;
        outputs: Record<string, any>;
    };
    
    // 运行时上下文（完整的运行时状态）
    runtimeContext: {
        // Agent 运行时状态
        agentStates: Record<string, {
            status: 'idle' | 'thinking' | 'speaking' | 'waiting' | 'error';
            lastResponse?: string;
            error?: string;
            metadata?: Record<string, any>;
        }>;
        
        // Skill 运行时状态
        skillStates: Record<string, {
            status: 'pending' | 'running' | 'completed' | 'error';
            currentStep?: number;
            result?: string;
            error?: string;
        }>;
        
        // 边的条件判断结果
        edgeResults: Record<string, boolean>;
    };
    
    // 执行上下文快照
    contextSnapshot: Partial<ExecutionContext>;
    
    // 到此节点为止的完整执行轨迹
    trajectorySnapshot: ExecutionStep[];
    
    // 描述
    description?: string;
    
    // 标签
    tags?: string[];
}

// ============== 状态管理器 ==============

class ExecutionStateManager {
    private storageKey = 'orchestration_sessions';
    private sessions: Map<string, OrchestrationSession> = new Map();
    private initialized = false;
    
    constructor() {
        if (browser) {
            this.loadFromStorage();
        }
    }
    
    // 从 localStorage 加载
    private loadFromStorage(): void {
        if (!browser) return;
        
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const sessions = JSON.parse(data) as OrchestrationSession[];
                for (const session of sessions) {
                    this.sessions.set(session.id, session);
                }
            }
        } catch (e) {
            console.error('Failed to load sessions from storage:', e);
        }
        
        this.initialized = true;
    }
    
    // 保存到 localStorage
    private saveToStorage(): void {
        if (!browser) return;
        
        try {
            const sessions = Array.from(this.sessions.values());
            localStorage.setItem(this.storageKey, JSON.stringify(sessions));
        } catch (e) {
            console.error('Failed to save sessions to storage:', e);
        }
    }
    
    // ============== 会话管理 ==============
    
    // 创建新会话
    createSession(input: string, name?: string): OrchestrationSession {
        const session: OrchestrationSession = {
            id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: name || this.generateSessionName(input),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastActiveAt: Date.now(),
            status: 'pending',
            originalInput: input,
            trajectory: [],
            tags: [],
            involvedAgents: [],
            involvedSkills: []
        };
        
        this.sessions.set(session.id, session);
        this.saveToStorage();
        
        return session;
    }
    
    // 获取会话
    getSession(id: string): OrchestrationSession | undefined {
        return this.sessions.get(id);
    }
    
    // 获取所有会话
    getAllSessions(): OrchestrationSession[] {
        return Array.from(this.sessions.values())
            .sort((a, b) => b.updatedAt - a.updatedAt);
    }
    
    // 更新会话
    updateSession(id: string, updates: Partial<OrchestrationSession>): OrchestrationSession | undefined {
        const session = this.sessions.get(id);
        if (!session) return undefined;
        
        const updated = {
            ...session,
            ...updates,
            updatedAt: Date.now()
        };
        
        this.sessions.set(id, updated);
        this.saveToStorage();
        
        return updated;
    }
    
    // 删除会话
    deleteSession(id: string): boolean {
        const result = this.sessions.delete(id);
        if (result) {
            this.saveToStorage();
        }
        return result;
    }
    
    // ============== 执行步骤记录 ==============
    
    // 记录执行步骤
    recordStep(
        sessionId: string,
        step: Omit<ExecutionStep, 'stepIndex' | 'timestamp'>
    ): OrchestrationSession | undefined {
        const session = this.sessions.get(sessionId);
        if (!session) return undefined;
        
        const fullStep: ExecutionStep = {
            ...step,
            stepIndex: session.trajectory.length,
            timestamp: Date.now()
        };
        
        session.trajectory.push(fullStep);
        session.updatedAt = Date.now();
        session.lastActiveAt = Date.now();
        
        // 自动创建检查点（每10步或关键节点）
        if (this.shouldCreateCheckpoint(fullStep)) {
            session.currentCheckpoint = this.createCheckpoint(session, fullStep);
        }
        
        this.sessions.set(sessionId, session);
        this.saveToStorage();
        
        return session;
    }
    
    // 判断是否应该创建检查点
    private shouldCreateCheckpoint(step: ExecutionStep): boolean {
        // 每个 Agent/Skill 节点完成后创建检查点
        return step.nodeType === 'agent' || step.nodeType === 'skill';
    }
    
    // 创建检查点（增强版 - 完整执行上下文）
    private createCheckpoint(
        session: OrchestrationSession,
        step: ExecutionStep,
        runtimeStates?: {
            agentStates?: Record<string, any>;
            skillStates?: Record<string, any>;
            edgeResults?: Record<string, boolean>;
        }
    ): CheckpointData {
        const completedNodeIds = session.trajectory
            .filter(s => s.stepIndex <= step.stepIndex && s.nodeId)
            .map(s => s.nodeId!);
        
        // 计算待执行的节点（从工作流中找出未完成的）
        const pendingNodeIds: string[] = [];
        if (session.workflow) {
            const allNodeIds = session.workflow.nodes.map(n => n.id);
            pendingNodeIds.push(...allNodeIds.filter(id => !completedNodeIds.includes(id)));
        }
        
        return {
            id: `checkpoint_${Date.now()}`,
            createdAt: Date.now(),
            stepIndex: step.stepIndex,
            
            // 保存完整工作流快照
            workflowSnapshot: session.workflow ? JSON.parse(JSON.stringify(session.workflow)) : undefined,
            
            workflowState: {
                currentNodeId: step.nodeId || '',
                completedNodeIds,
                pendingNodeIds,
                variables: {}, // 可以从运行时状态获取
                outputs: {}    // 从步骤输出中提取
            },
            
            // 运行时上下文
            runtimeContext: {
                agentStates: runtimeStates?.agentStates || {},
                skillStates: runtimeStates?.skillStates || {},
                edgeResults: runtimeStates?.edgeResults || {}
            },
            
            // 执行上下文快照
            contextSnapshot: {
                userInput: session.originalInput,
                sessionId: session.id,
                workflowId: session.workflow?.id
            },
            
            // 完整的执行轨迹
            trajectorySnapshot: JSON.parse(JSON.stringify(session.trajectory)),
            
            description: `步骤 ${step.stepIndex}: ${step.nodeType} - ${step.nodeId}`,
            tags: ['auto-save']
        };
    }
    
    // ============== 暂停和恢复 ==============
    
    // 暂停会话
    pauseSession(sessionId: string): OrchestrationSession | undefined {
        const session = this.sessions.get(sessionId);
        if (!session) return undefined;
        
        session.status = 'paused';
        session.updatedAt = Date.now();
        
        if (!session.currentCheckpoint && session.trajectory.length > 0) {
            const lastStep = session.trajectory[session.trajectory.length - 1];
            session.currentCheckpoint = this.createCheckpoint(session, lastStep);
        }
        
        this.sessions.set(sessionId, session);
        this.saveToStorage();
        
        return session;
    }
    
    // 恢复会话
    resumeSession(sessionId: string): OrchestrationSession | undefined {
        const session = this.sessions.get(sessionId);
        if (!session || session.status !== 'paused') return undefined;
        
        session.status = 'running';
        session.updatedAt = Date.now();
        
        this.sessions.set(sessionId, session);
        this.saveToStorage();
        
        return session;
    }
    
    // 完成会话
    completeSession(
        sessionId: string,
        result: NonNullable<OrchestrationSession['result']>
    ): OrchestrationSession | undefined {
        const session = this.sessions.get(sessionId);
        if (!session) return undefined;
        
        session.status = result.success ? 'completed' : 'failed';
        session.result = {
            ...result,
            completedAt: Date.now()
        };
        session.updatedAt = Date.now();
        
        this.sessions.set(sessionId, session);
        this.saveToStorage();
        
        return session;
    }
    
    // ============== 时间旅行 ==============
    
    // 回溯到指定步骤
    timeTravel(
        sessionId: string,
        targetStepIndex: number
    ): {
        session: OrchestrationSession;
        restoredState: {
            currentNodeId: string;
            variables: Record<string, any>;
            completedSteps: ExecutionStep[];
        };
    } | undefined {
        const session = this.sessions.get(sessionId);
        if (!session) return undefined;
        
        if (targetStepIndex < 0 || targetStepIndex >= session.trajectory.length) {
            return undefined;
        }
        
        // 重建状态
        const completedSteps = session.trajectory.slice(0, targetStepIndex + 1);
        const targetStep = completedSteps[completedSteps.length - 1];
        
        const restoredState = {
            currentNodeId: targetStep.nodeId || '',
            variables: {} as Record<string, any>,
            completedSteps
        };
        
        // 更新会话
        session.status = 'paused';
        session.updatedAt = Date.now();
        
        this.sessions.set(sessionId, session);
        this.saveToStorage();
        
        return { session, restoredState };
    }
    
    // ============== 断点恢复 ==============
    
    /**
     * 从断点恢复完整的执行上下文
     */
    restoreFromCheckpoint(sessionId: string, checkpointId: string): {
        session: OrchestrationSession;
        restoredState: {
            workflow: OrchestrationWorkflow | undefined;
            currentNodeId: string;
            completedNodeIds: string[];
            pendingNodeIds: string[];
            outputs: Record<string, any>;
            variables: Record<string, any>;
            runtimeContext: CheckpointData['runtimeContext'];
            trajectory: ExecutionStep[];
        };
    } | undefined {
        const session = this.sessions.get(sessionId);
        if (!session || !session.currentCheckpoint) return undefined;
        
        if (session.currentCheckpoint.id !== checkpointId) {
            // 查找指定断点
            const checkpoint = this.findCheckpoint(session, checkpointId);
            if (!checkpoint) return undefined;
            
            return {
                session,
                restoredState: {
                    workflow: checkpoint.workflowSnapshot,
                    currentNodeId: checkpoint.workflowState.currentNodeId,
                    completedNodeIds: checkpoint.workflowState.completedNodeIds,
                    pendingNodeIds: checkpoint.workflowState.pendingNodeIds,
                    outputs: checkpoint.workflowState.outputs,
                    variables: checkpoint.workflowState.variables,
                    runtimeContext: checkpoint.runtimeContext,
                    trajectory: checkpoint.trajectorySnapshot
                }
            };
        }
        
        // 返回当前断点
        return {
            session,
            restoredState: {
                workflow: session.currentCheckpoint.workflowSnapshot,
                currentNodeId: session.currentCheckpoint.workflowState.currentNodeId,
                completedNodeIds: session.currentCheckpoint.workflowState.completedNodeIds,
                pendingNodeIds: session.currentCheckpoint.workflowState.pendingNodeIds,
                outputs: session.currentCheckpoint.workflowState.outputs,
                variables: session.currentCheckpoint.workflowState.variables,
                runtimeContext: session.currentCheckpoint.runtimeContext,
                trajectory: session.currentCheckpoint.trajectorySnapshot
            }
        };
    }
    
    /**
     * 查找指定断点
     */
    private findCheckpoint(session: OrchestrationSession, checkpointId: string): CheckpointData | undefined {
        if (session.currentCheckpoint?.id === checkpointId) {
            return session.currentCheckpoint;
        }
        // 未来可以添加断点历史存储
        return undefined;
    }
    
    /**
     * 创建带运行时状态的断点（供外部调用）
     */
    createCheckpointWithRuntime(
        sessionId: string,
        step: ExecutionStep,
        runtimeStates?: {
            agentStates?: Record<string, any>;
            skillStates?: Record<string, any>;
            edgeResults?: Record<string, boolean>;
        }
    ): OrchestrationSession | undefined {
        const session = this.sessions.get(sessionId);
        if (!session) return undefined;
        
        session.currentCheckpoint = this.createCheckpoint(session, step, runtimeStates);
        session.updatedAt = Date.now();
        
        this.sessions.set(sessionId, session);
        this.saveToStorage();
        
        return session;
    }
    
    // ============== 查询和统计 ==============
    
    // 按状态筛选
    getSessionsByStatus(status: OrchestrationSession['status']): OrchestrationSession[] {
        return this.getAllSessions().filter(s => s.status === status);
    }
    
    // 按时间范围筛选
    getSessionsByDateRange(startTime: number, endTime: number): OrchestrationSession[] {
        return this.getAllSessions().filter(
            s => s.createdAt >= startTime && s.createdAt <= endTime
        );
    }
    
    // 获取最近会话
    getRecentSessions(limit: number = 10): OrchestrationSession[] {
        return this.getAllSessions().slice(0, limit);
    }
    
    // 获取会话统计
    getSessionStats(): {
        total: number;
        completed: number;
        failed: number;
        paused: number;
        running: number;
    } {
        const sessions = this.getAllSessions();
        
        return {
            total: sessions.length,
            completed: sessions.filter(s => s.status === 'completed').length,
            failed: sessions.filter(s => s.status === 'failed').length,
            paused: sessions.filter(s => s.status === 'paused').length,
            running: sessions.filter(s => s.status === 'running').length
        };
    }
    
    // ============== 辅助方法 ==============
    
    // 生成会话名称
    private generateSessionName(input: string): string {
        // 提取输入的前20个字符作为名称
        const truncated = input.slice(0, 20);
        const timestamp = new Date().toLocaleString('zh-CN', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `${truncated}${input.length > 20 ? '...' : ''} - ${timestamp}`;
    }
    
    // 导出所有会话
    exportSessions(): string {
        return JSON.stringify(Array.from(this.sessions.values()), null, 2);
    }
    
    // 导入会话
    importSessions(jsonString: string): {
        success: boolean;
        imported: number;
        errors: string[];
    } {
        const errors: string[] = [];
        let imported = 0;
        
        try {
            const sessions = JSON.parse(jsonString) as OrchestrationSession[];
            
            for (const session of sessions) {
                if (!session.id || !session.originalInput) {
                    errors.push(`Invalid session data`);
                    continue;
                }
                
                this.sessions.set(session.id, session);
                imported++;
            }
            
            this.saveToStorage();
        } catch (e) {
            errors.push(`JSON parse error: ${e}`);
        }
        
        return {
            success: errors.length === 0,
            imported,
            errors
        };
    }
    
    // 清空所有会话
    clearAllSessions(): void {
        this.sessions.clear();
        this.saveToStorage();
    }
}

// 导出单例
export const executionStateManager = new ExecutionStateManager();
export default executionStateManager;
