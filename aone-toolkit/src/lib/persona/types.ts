/**
 * 抽象人格模块 - 类型定义
 * 7 大核心字段：
 * 1. 名称 (Name)
 * 2. 角色设定 (Role Setting)
 * 3. 个人简介 (Personal Introduction)
 * 4. 性格标签 (Personality Tags)
 * 5. 个人Skills (Personal Skills)
 * 6. 人格矩阵 (Personality Matrix)
 * 7. 系统提示词 (System Prompt)
 */

import type { ComponentType } from 'svelte';

// ============== 基础类型 ==============

/**
 * 人格矩阵配置
 * 用于量化抽象人格的性格特征
 */
export interface PersonaMatrix {
    // 核心维度 (0-10)
    rationality: number;        // 理性 vs 感性
    creativity: number;         // 严谨 vs 创意
    empathy: number;            // 冷酷 vs 共情
    
    // 扩展维度
    openness: number;           // 保守 vs 开放
    dominance: number;          // 顺从 vs 主导
    stability: number;          // 敏感 vs 稳定
    
    // MBTI 类型 (可选)
    mbti?: string;
    
    // 沟通风格
    communicationStyle: 'direct' | 'diplomatic' | 'analytical' | 'supportive' | 'socratic' | 'casual';
    
    // 表达方式
    expressionStyle: 'concise' | 'detailed' | 'narrative' | 'bullet';
    
    // 情感倾向
    emotionalTone: 'neutral' | 'warm' | 'humorous' | 'serious' | 'optimistic' | 'cautious';
}

/**
 * 性格标签
 */
export interface PersonalityTag {
    id: string;
    name: string;
    category: 'strength' | 'weakness' | 'preference' | 'behavior';
    description?: string;
}

/**
 * 技能绑定
 */
export interface SkillBinding {
    skillId: string;
    proficiency: number;      // 0-10 熟练度
    priority: number;        // 优先级
    autoActivate: boolean;   // 是否自动激活
}

/**
 * 视觉配置
 */
export interface PersonaVisual {
    avatarUrl?: string;          // 头像图片URL (支持上传)
    avatarShape: 'circle' | 'square' | 'rounded' | 'hexagon';
    primaryColor: string;        // 主题色 HEX
    secondaryColor?: string;     // 辅助色 HEX
    gradient?: string;           // 渐变类名
    icon?: string;              // Lucide 图标名 (备用)
}

/**
 * Agent 配置
 */
export interface PersonaConfig {
    temperature: number;         // 0-1 生成温度
    maxTokens?: number;         // 最大 token 数
    model?: string;             // 指定模型
    responseFormat?: 'markdown' | 'json' | 'plain';
}

// ============== 抽象人格 Agent 定义 ==============

export interface AbstractPersona {
    // 基础信息 (7 大字段)
    id: string;
    name: string;                           // 1. 名称
    roleSetting: string;                    // 2. 角色设定
    personalIntroduction: string;           // 3. 个人简介
    personalityTags: string[];              // 4. 性格标签
    personalSkills: SkillBinding[];         // 5. 个人Skills
    personaMatrix: PersonaMatrix;            // 6. 人格矩阵
    systemPrompt: string;                   // 7. 系统提示词
    
    // 扩展配置
    visual: PersonaVisual;
    config?: PersonaConfig;
    outputRestraintMode?: 'inherit' | 'strict' | 'standard' | 'relaxed' | 'custom' | 'off';
    customRestraintRule?: string;
    
    // 背景故事 (可选)
    background?: string;
    
    // 目标与动机
    goals?: string[];
    motivations?: string[];
    
    // 限制与禁忌
    constraints?: string[];
    forbiddenBehaviors?: string[];
    
    // 开场白
    openingGreeting?: string;
    
    // 元数据
    version: string;
    author?: string;
    createdAt?: number;
    updatedAt?: number;
    isBuiltIn: boolean;        // 是否内置
    isPublic: boolean;         // 是否公开
    usageCount: number;        // 使用次数
}

// ============== 技能组合配置 ==============

/**
 * 技能组合 (Skill Combo)
 * 用于预定义 Agent + Skills 的组合
 */
export interface SkillCombo {
    id: string;
    name: string;
    description: string;
    personaId: string;         // 绑定的抽象人格
    skillIds: string[];        // 技能列表
    triggerConditions?: string[];
    
    // 元数据
    version: string;
    isBuiltIn: boolean;
    author?: string;
    createdAt?: number;
}

// ============== 场景包 ==============

/**
 * 编排场景包
 * 预定义的 Agent + Skills + Workflow 组合
 */
export interface PersonaScenario {
    id: string;
    name: string;
    description: string;
    
    // 推荐组合
    recommendedPersonas: string[];    // 抽象人格 ID 列表
    recommendedSkills: string[];      // 技能 ID 列表
    
    // 入口
    entryPrompt: string;
    
    // 视觉
    icon?: string;
    color?: string;
    
    tags: string[];
    isBuiltIn: boolean;
}

// ============== 运行时 ==============

export type PersonaStatus = 'idle' | 'thinking' | 'speaking' | 'waiting' | 'error';

export interface PersonaRuntime {
    personaId: string;
    status: PersonaStatus;
    currentSkillId?: string;
    lastActiveAt: number;
    responseCount: number;
    errorCount: number;
}

// ============== 预设抽象人格 ==============

export const DEFAULT_PERSONA_MATRIX: PersonaMatrix = {
    rationality: 5,
    creativity: 5,
    empathy: 5,
    openness: 5,
    dominance: 5,
    stability: 5,
    communicationStyle: 'direct',
    expressionStyle: 'concise',
    emotionalTone: 'neutral'
};

// 预设场景包
export const BUILT_IN_SCENARIOS: PersonaScenario[] = [
    {
        id: 'career_advisor',
        name: '职业顾问',
        description: '专业的职业发展咨询助手',
        recommendedPersonas: [],
        recommendedSkills: ['decompose', 'decision_matrix', 'action_list'],
        entryPrompt: '职业发展有问题？来聊聊。',
        icon: '💼',
        color: '#3B82F6',
        tags: ['职业', '发展', '规划'],
        isBuiltIn: true
    },
    {
        id: 'decision_helper',
        name: '决策助手',
        description: '帮助分析重大决策',
        recommendedPersonas: [],
        recommendedSkills: ['decision_matrix', 'stress_test', 'resource_audit'],
        entryPrompt: '有重大决策要做？我们来量化分析。',
        icon: '⚖️',
        color: '#8B5CF6',
        tags: ['决策', '分析', '风险'],
        isBuiltIn: true
    },
    {
        id: 'creative_partner',
        name: '创意伙伴',
        description: '打破思维定式，激发创意',
        recommendedPersonas: [],
        recommendedSkills: ['reframe', 'decompose', 'action_list'],
        entryPrompt: '思维卡住了？换个角度看世界。',
        icon: '💡',
        color: '#F59E0B',
        tags: ['创意', '突破', '可能性'],
        isBuiltIn: true
    },
    {
        id: 'action_coach',
        name: '行动教练',
        description: '将想法转化为行动',
        recommendedPersonas: [],
        recommendedSkills: ['action_list', 'resource_audit'],
        entryPrompt: '想做的事情太多？来列个清单。',
        icon: '🚀',
        color: '#22C55E',
        tags: ['行动', '执行', '效率'],
        isBuiltIn: true
    }
];
