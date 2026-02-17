/**
 * Skill 模块 - 类型定义
 * 认知工具（Skills）的核心类型系统
 */

// ============== Skill 基础类型 ==============

export type SkillType = 
    | 'analysis'    // 分析型
    | 'quantitative' // 量化型
    | 'evaluation'  // 评估型
    | 'exploration' // 探索型
    | 'generation'; // 生成型

export interface SkillIO {
    input: string;      // 输入描述
    output: string;     // 输出描述
    format?: string;   // 格式要求
}

export interface SkillTrigger {
    keywords?: string[];       // 触发关键词
    patterns?: string[];        // 正则匹配模式
    conditions?: string[];      // 条件描述
}

export interface SkillException {
    condition: string;          // 异常条件
    response: string;           // 响应策略
}

export interface SkillVisual {
    color: string;              // 主题色
    icon: string;               // 图标 emoji
    gradient?: string;         // 渐变类名
}

// ============== Skill 定义 ==============

export interface SkillStep {
    order: number;
    description: string;
    action: string;
    outputKey?: string;
}

export interface SkillDefinition {
    id: string;
    name: string;
    description: string;
    oneLiner: string;           // 一句话说明
    
    // 类型分类
    type: SkillType;
    
    // 输入输出
    io: SkillIO;
    
    // 触发条件
    trigger: SkillTrigger;
    
    // 执行步骤
    steps: SkillStep[];
    
    // 输出格式模板
    outputTemplate: string;
    
    // 异常处理
    exceptions: SkillException[];
    
    // 视觉
    visual: SkillVisual;
    
    // 适配 Agent
    compatibleAgents: string[]; // 兼容的 Agent ID
    recommendedAgents?: string[]; // 推荐的 Agent ID
    
    // 元数据
    version: string;
    author?: string;
    tags: string[];
    isBuiltIn: boolean;
    createdAt?: number;
    updatedAt?: number;
}

// ============== Skill 执行 ==============

export interface SkillContext {
    skillId: string;
    userInput: string;
    conversationHistory: string;
    agentId?: string;
    metadata?: Record<string, any>;
}

export interface SkillResult {
    skillId: string;
    success: boolean;
    output: string;
    error?: string;
    metadata?: Record<string, any>;
}

// ============== Skill 注册表 ==============

export interface ISkillRegistry {
    getAll(): SkillDefinition[];
    getById(id: string): SkillDefinition | undefined;
    register(skill: SkillDefinition): void;
    unregister(id: string): boolean;
    getByAgent(agentId: string): SkillDefinition[];
    getByType(type: SkillType): SkillDefinition[];
}

// ============== Skill 执行器 ==============

export interface ISkillExecutor {
    execute(context: SkillContext): Promise<SkillResult>;
    validate(context: SkillContext): boolean;
}
