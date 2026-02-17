/**
 * Agent 模块 - 类型定义
 * 抽象人格 Agent 的核心类型系统
 */

import type { ComponentType } from 'svelte';

// ============== Agent 基础类型 ==============

export interface AgentCapability {
    id: string;
    name: string;
    description: string;
    tags: string[];
}

export interface AgentPersonaConfig {
    rationality: number;      // 0-10 理性程度
    creativity: number;        // 0-10 创造力
    empathy: number;           // 0-10 同理心
    mbti?: string;            // MBTI 类型
    communicationStyle?: 'direct' | 'diplomatic' | 'analytical' | 'supportive';
}

export interface AgentVisual {
    primaryColor: string;      // 主题色 HEX
    avatarShape: 'circle' | 'square' | 'hexagon' | 'prism';
    icon?: string;            // Lucide 图标名
    gradient?: string;         // 渐变色类名
}

export interface AgentTraits {
    tags: string[];           // 能力标签
    strengths: string[];      // 优势领域
    weaknesses?: string[];     // 弱点/限制
}

export interface AgentConfig {
    temperature: number;       // 0-1 生成温度
    maxTokens?: number;        // 最大 token 数
    model?: string;            // 指定模型
}

// ============== Agent 定义 ==============

export interface AgentDefinition {
    id: string;
    name: string;
    perspective: string;        // 思维模式/认知框架
    oneLiner: string;          // 一句话描述
    
    // 核心定义
    coreBelief: string;         // 核心认知框架
    whenToUse: string;         // 何时使用
    dialogueStyle: string;     // 对话风格要点
    forbidden: string[];       // 禁止行为列表
    openingLine: string;       // 开场白
    
    // 配置
    visual: AgentVisual;
    traits: AgentTraits;
    personaConfig?: AgentPersonaConfig;
    config?: AgentConfig;
    
    // 技能绑定
    defaultSkills: string[];  // 默认装备的技能 ID 列表
    
    // 元数据
    version: string;
    author?: string;
    createdAt?: number;
    updatedAt?: number;
    isBuiltIn: boolean;        // 是否内置（不可删除）
}

// ============== Agent 运行时状态 ==============

export type AgentStatus = 'idle' | 'thinking' | 'speaking' | 'waiting' | 'error';

export interface AgentRuntimeState {
    id: string;
    status: AgentStatus;
    currentSkillId?: string;
    lastActiveAt: number;
    responseCount: number;
    errorCount: number;
}

// ============== Agent 执行上下文 ==============

export interface AgentExecutionContext {
    agentId: string;
    sessionId: string;
    userInput: string;
    history: ConversationMessage[];
    metadata?: Record<string, any>;
}

export interface ConversationMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    agentId?: string;
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface AgentResponse {
    agentId: string;
    content: string;
    skillUsed?: string;
    metadata?: Record<string, any>;
    finishReason: 'completed' | 'error' | 'cancelled' | 'max_tokens';
}

// ============== Agent 注册表接口 ==============

export interface IAgentRegistry {
    getAll(): AgentDefinition[];
    getById(id: string): AgentDefinition | undefined;
    register(agent: AgentDefinition): void;
    unregister(id: string): boolean;
    getByTags(tags: string[]): AgentDefinition[];
}

// ============== Agent 执行器接口 ==============

export interface IAgentExecutor {
    execute(context: AgentExecutionContext): Promise<AgentResponse>;
    streamExecute(context: AgentExecutionContext, onChunk: (chunk: string) => void): Promise<AgentResponse>;
    cancel(executionId: string): void;
}
