/**
 * 编排模块 - 类型定义
 * 可配置的任务编排系统
 */

import type { AgentDefinition } from '../agents/types';
import type { SkillDefinition } from '../skills/types';

// ============== 编排节点类型 ==============

export type OrchestrationNodeType =
    | 'agent'      // Agent 节点
    | 'skill'      // Skill 节点
    | 'condition'  // 条件分支
    | 'parallel'   // 并行执行
    | 'subworkflow'; // 子工作流

// ============== 节点定义 ==============

export interface OrchestrationNode {
    id: string;
    type: OrchestrationNodeType;
    name: string;
    config: AgentNodeConfig | SkillNodeConfig | ConditionNodeConfig | ParallelNodeConfig | SubworkflowNodeConfig;
    position?: { x: number; y: number };
    
    // 执行策略（可选）
    executionPolicy?: ExecutionPolicy;
}

export interface AgentNodeConfig {
    agentId: string;
    inputMapping?: Record<string, string>;  // 输入映射
    outputKey?: string;                     // 输出存储键
}

export interface SkillNodeConfig {
    skillId: string;
    agentId?: string;                       // 绑定的 Agent
    inputMapping?: Record<string, string>;
    outputKey?: string;
}

export interface ConditionNodeConfig {
    expression: string;                      // 条件表达式
    trueNodeId?: string;                     // 条件为真时的下一节点
    falseNodeId?: string;                    // 条件为假时的下一节点
}

export interface ParallelNodeConfig {
    nodeIds: string[];                       // 并行执行的节点 ID 列表
    mergeStrategy: 'all' | 'first' | 'majority'; // 合并策略
}

export interface SubworkflowNodeConfig {
    workflowId: string;                      // 引用的工作流 ID
    inputMapping?: Record<string, string>;   // 输入映射
    outputKey?: string;                      // 输出存储键
    waitForCompletion: boolean;              // 是否等待子工作流完成
    onError?: 'continue' | 'stop' | 'retry'; // 错误处理策略
}

// ============== 重试与超时配置 ==============

export interface RetryConfig {
    maxRetries: number;                        // 最大重试次数
    retryDelay: number;                       // 重试延迟（毫秒）
    backoff: 'none' | 'linear' | 'exponential'; // 退避策略
    retryableErrors?: string[];               // 可重试的错误类型
}

export interface TimeoutConfig {
    nodeTimeout: number;                       // 节点执行超时（毫秒）
    workflowTimeout?: number;                  // 工作流总超时（毫秒）
    enableTimeout: boolean;                    // 是否启用超时
}

// 合并的重试和超时配置
export interface ExecutionPolicy {
    retry?: RetryConfig;
    timeout?: TimeoutConfig;
}

// ============== 工作流定义 ==============

export interface OrchestrationWorkflow {
    id: string;
    name: string;
    description: string;

    // 节点
    nodes: OrchestrationNode[];

    // 边（节点连接）
    edges: OrchestrationEdge[];

    // 入口节点
    entryNodeId: string;

    // 技能组合模板（可选）
    skillTemplateId?: string;
    skillTemplateConfig?: {
        selectedOptionalSkills?: string[];
        selectedMutualGroups?: string[][];
    };

    // 元数据
    version: string;
    author?: string;
    tags: string[];
    isBuiltIn: boolean;
    createdAt?: number;
    updatedAt?: number;
}

export interface OrchestrationEdge {
    id: string;
    source: string;
    target: string;
    label?: string;                          // 边标签（如"完成时"）
    condition?: string;                      // 触发条件
}

// ============== 场景包 ==============

export interface ScenarioPackage {
    id: string;
    name: string;
    description: string;

    // 推荐的工作流
    workflowId?: string;

    // 推荐 Agent 组合
    recommendedAgents: string[];

    // 推荐 Skill 组合
    recommendedSkills: string[];

    // 入口引导语
    entryPrompt: string;

    // 图标和颜色
    icon?: string;
    color?: string;

    tags: string[];
    isBuiltIn: boolean;
}

// ============== 运行时 ==============

export interface ExecutionOptions {
    maxExecutionSteps?: number;
    maxNodeVisits?: number;
    branchTimeoutMs?: number;
}

export interface ExecutionContext {
    workflowId: string;
    sessionId: string;
    userInput: string;
    variables: Record<string, any>;          // 运行时变量
    history: string[];
    options?: ExecutionOptions;
}

export interface ExecutionResult {
    success: boolean;
    outputs: Record<string, any>;
    logs: ExecutionLog[];
    error?: string;
}

export interface ExecutionLog {
    nodeId: string;
    nodeName: string;
    startTime: number;
    endTime: number;
    duration: number;
    status: 'pending' | 'running' | 'completed' | 'error';
    input?: any;
    output?: any;
    error?: string;
}

// ============== 编排引擎接口 ==============

export interface IOrchestrationEngine {
    // 执行工作流
    execute(
        workflow: OrchestrationWorkflow,
        context: ExecutionContext,
        onProgress?: (log: ExecutionLog) => void
    ): Promise<ExecutionResult>;

    // 暂停执行
    pause(executionId: string): void;

    // 恢复执行
    resume(executionId: string): void;

    // 取消执行
    cancel(executionId: string): void;

    // 验证工作流
    validate(workflow: OrchestrationWorkflow): { valid: boolean; errors: string[] };
}

// ============== 预置场景包 ==============

export const BUILT_IN_SCENARIOS: ScenarioPackage[] = [
    {
        id: 'career_transition',
        name: '职业转型包',
        description: '帮助用户理清职业方向，做出更好的职业决策',
        recommendedAgents: ['decomposer', 'calculator', 'pathfinder', 'closer'],
        recommendedSkills: ['decompose', 'decision_matrix', 'reframe', 'action_list'],
        entryPrompt: '想换工作/转行/创业？我们来理一理。',
        icon: '💼',
        color: '#3B82F6',
        tags: ['职业', '转型', '规划'],
        isBuiltIn: true
    },
    {
        id: 'major_decision',
        name: '重大决策包',
        description: '帮助用户分析和评估重大人生决策',
        recommendedAgents: ['calculator', 'stress_tester', 'closer'],
        recommendedSkills: ['decision_matrix', 'stress_test', 'action_list'],
        entryPrompt: '有个大决定拿不定主意？我们来量化比较。',
        icon: '⚖️',
        color: '#8B5CF6',
        tags: ['决策', '分析', '风险'],
        isBuiltIn: true
    },
    {
        id: 'break_stuck',
        name: '破局包',
        description: '帮助用户打破思维僵局，找到新出路',
        recommendedAgents: ['decomposer', 'pathfinder', 'closer'],
        recommendedSkills: ['decompose', 'reframe', 'action_list'],
        entryPrompt: '觉得走投无路了？可能是框架限制了你。',
        icon: '🔓',
        color: '#F59E0B',
        tags: ['破局', '创新', '可能性'],
        isBuiltIn: true
    },
    {
        id: 'action_accelerator',
        name: '执行力加速包',
        description: '帮助用户将想法转化为行动',
        recommendedAgents: ['closer'],
        recommendedSkills: ['action_list'],
        entryPrompt: '道理都懂就是不动？给你一个30分钟内就能开始的第一步。',
        icon: '🚀',
        color: '#22C55E',
        tags: ['执行', '行动', '效率'],
        isBuiltIn: true
    }
];
