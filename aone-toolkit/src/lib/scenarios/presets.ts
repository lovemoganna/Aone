/**
 * 场景包预设系统
 * 
 * 预定义的 Agent + Skills + Workflow 组合
 * 用户可以直接使用场景包，也可以完全忽略它们
 */

import type { CognitiveAgent } from '../agents/cognitive-agents';

// ============== 场景包定义 ==============

export interface Scenario {
    id: string;
    name: string;
    description: string;
    
    // 推荐组合
    recommendedAgents: string[];    // Agent ID 列表
    recommendedSkills: string[];  // Skill ID 列表
    
    // 入口
    entryPrompt: string;
    
    // 视觉
    icon: string;
    color: string;
    
    // 标签
    tags: string[];
    
    // 是否内置
    isBuiltIn: boolean;
}

// ============== 预设场景包 ==============

export const scenarioPresets: Scenario[] = [
    // 职业转型包
    {
        id: 'career_transition',
        name: '职业转型',
        description: '职业发展有问题？来聊聊。',
        recommendedAgents: ['decomposer', 'calculator', 'pathfinder', 'closer'],
        recommendedSkills: ['decompose', 'decision_matrix', 'reframe', 'action_list'],
        entryPrompt: '想换工作/转行/创业？我们来理一理。',
        icon: '💼',
        color: '#3B82F6',
        tags: ['职业', '发展', '规划', '转型'],
        isBuiltIn: true
    },
    
    // 重大决策包
    {
        id: 'major_decision',
        name: '重大决策',
        description: '帮助分析重大决策',
        recommendedAgents: ['calculator', 'stress_tester', 'closer'],
        recommendedSkills: ['decision_matrix', 'stress_test', 'action_list'],
        entryPrompt: '有重大决策要做？我们来量化比较。',
        icon: '⚖️',
        color: '#8B5CF6',
        tags: ['决策', '分析', '风险', '量化'],
        isBuiltIn: true
    },
    
    // 破局包
    {
        id: 'breakthrough',
        name: '破局',
        description: '觉得走投无路了？可能是框架限制了你。',
        recommendedAgents: ['decomposer', 'pathfinder', 'closer'],
        recommendedSkills: ['decompose', 'reframe', 'action_list'],
        entryPrompt: '觉得走投无路了？换个角度看世界。',
        icon: '💡',
        color: '#F59E0B',
        tags: ['创意', '突破', '可能性', '创新'],
        isBuiltIn: true
    },
    
    // 执行力加速包
    {
        id: 'execution_boost',
        name: '执行力',
        description: '道理都懂就是不动？给你一个30分钟内就能开始的第一步。',
        recommendedAgents: ['closer'],
        recommendedSkills: ['action_list', 'resource_audit'],
        entryPrompt: '道理都懂就是不动？来列个清单。',
        icon: '🚀',
        color: '#22C55E',
        tags: ['行动', '执行', '效率', '清单'],
        isBuiltIn: true
    },
    
    // 关系处理包
    {
        id: 'relationship',
        name: '关系处理',
        description: '处理人际关系中的困惑和挑战',
        recommendedAgents: ['decomposer', 'pathfinder', 'stress_tester'],
        recommendedSkills: ['decompose', 'reframe', 'stress_test'],
        entryPrompt: '人际关有困惑？我们来理一理。',
        icon: '🤝',
        color: '#EC4899',
        tags: ['关系', '人际', '沟通', '情感'],
        isBuiltIn: true
    },
    
    // 创业探索包
    {
        id: 'startup',
        name: '创业探索',
        description: '创业路上的问题，这里有答案',
        recommendedAgents: ['calculator', 'pathfinder', 'stress_tester'],
        recommendedSkills: ['decision_matrix', 'resource_audit', 'stress_test'],
        entryPrompt: '想创业或有商业想法？我们来验证一下。',
        icon: '🏢',
        color: '#6366F1',
        tags: ['创业', '商业', '验证', '市场'],
        isBuiltIn: true
    }
];

// ============== 工具函数 ==============

/**
 * 获取所有场景包
 */
export function getAllScenarios(): Scenario[] {
    return scenarioPresets;
}

/**
 * 根据 ID 获取场景包
 */
export function getScenarioById(id: string): Scenario | undefined {
    return scenarioPresets.find(s => s.id === id);
}

/**
 * 根据标签获取场景包
 */
export function getScenariosByTag(tag: string): Scenario[] {
    return scenarioPresets.filter(s => s.tags.includes(tag));
}

/**
 * 获取场景包的 Agent 配置
 */
export function getScenarioConfig(scenario: Scenario): {
    agentIds: string[];
    skillIds: string[];
} {
    return {
        agentIds: scenario.recommendedAgents,
        skillIds: scenario.recommendedSkills
    };
}

/**
 * 生成场景包导入配置（YAML格式）
 */
export function exportScenarioAsYaml(scenario: Scenario): string {
    return `
# 场景包配置 - ${scenario.name}
# 可以通过拖拽导入到系统中

name: ${scenario.name}
description: ${scenario.description}

# 推荐 Agent
agents:
${scenario.recommendedAgents.map(a => `  - ${a}`).join('\n')}

# 推荐 Skills
skills:
${scenario.recommendedSkills.map(s => `  - ${s}`).join('\n')}

# 入口引导语
entry_prompt: "${scenario.entryPrompt}"

# 标签
tags:
${scenario.tags.map(t => `  - ${t}`).join('\n')}
`.trim();
}

/**
 * 从场景包创建 Agent 配置
 */
export function createAgentFromScenario(scenario: Scenario): {
    name: string;
    description: string;
    agentIds: string[];
    skillIds: string[];
} {
    return {
        name: `${scenario.name} Agent`,
        description: scenario.description,
        agentIds: scenario.recommendedAgents,
        skillIds: scenario.recommendedSkills
    };
}

export default scenarioPresets;
