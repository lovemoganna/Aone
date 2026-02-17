</**
 * 思维建议器 (Thought Advisor)
 * 根据用户输入智能推荐合适的 Agent
 */

import type { Agent } from '../stores/agentStore.svelte';

interface AdvisorResult {
    recommendedAgents: string[];
    confidence: number;
    reasoning: string;
}

// 关键词到 Agent 的映射
const KEYWORD_AGENT_MAP: Record<string, { agent: string; weight: number }[]> = {
    'decomposer': [
        { agent: 'decomposer', weight: 1.0 },
        { agent: 'pathfinder', weight: 0.3 }
    ],
    'calculator': [
        { agent: 'calculator', weight: 1.0 },
        { agent: 'stress_tester', weight: 0.5 }
    ],
    'pathfinder': [
        { agent: 'pathfinder', weight: 1.0 },
        { agent: 'decomposer', weight: 0.3 }
    ],
    'stress_tester': [
        { agent: 'stress_tester', weight: 1.0 },
        { agent: 'calculator', weight: 0.4 }
    ],
    'closer': [
        { agent: 'closer', weight: 1.0 },
        { agent: 'calculator', weight: 0.3 }
    ],
    // 常见问题关键词
    '选择': [
        { agent: 'calculator', weight: 0.8 },
        { agent: 'pathfinder', weight: 0.6 },
        { agent: 'decomposer', weight: 0.4 }
    ],
    '决策': [
        { agent: 'calculator', weight: 0.9 },
        { agent: 'stress_tester', weight: 0.7 },
        { agent: 'closer', weight: 0.5 }
    ],
    '分析': [
        { agent: 'decomposer', weight: 0.9 },
        { agent: 'calculator', weight: 0.6 }
    ],
    '规划': [
        { agent: 'pathfinder', weight: 0.8 },
        { agent: 'decomposer', weight: 0.5 },
        { agent: 'closer', weight: 0.4 }
    ],
    '风险': [
        { agent: 'stress_tester', weight: 1.0 },
        { agent: 'calculator', weight: 0.7 }
    ],
    '执行': [
        { agent: 'closer', weight: 0.9 },
        { agent: 'calculator', weight: 0.4 }
    ],
    '迷茫': [
        { agent: 'pathfinder', weight: 1.0 },
        { agent: 'decomposer', weight: 0.5 }
    ],
    '困惑': [
        { agent: 'decomposer', weight: 0.9 },
        { agent: 'pathfinder', weight: 0.6 }
    ],
    '担心': [
        { agent: 'stress_tester', weight: 1.0 },
        { agent: 'closer', weight: 0.4 }
    ],
    '犹豫': [
        { agent: 'calculator', weight: 0.8 },
        { agent: 'pathfinder', weight: 0.6 }
    ],
    '焦虑': [
        { agent: 'stress_tester', weight: 0.9 },
        { agent: 'closer', weight: 0.5 }
    ]
};

// 意图模式匹配
const INTENT_PATTERNS: { pattern: RegExp; agents: string[]; weight: number }[] = [
    { pattern: /(帮我|能否|能不能).*(分析|拆解|分解)/, agents: ['decomposer'], weight: 0.9 },
    { pattern: /(哪个|选择|应该|该).*(好|做)/, agents: ['calculator', 'pathfinder'], weight: 0.8 },
    { pattern: /(风险|担心|害怕|最坏)/, agents: ['stress_tester'], weight: 0.95 },
    { pattern: /(怎么办|怎么|如何)/, agents: ['pathfinder', 'decomposer'], weight: 0.7 },
    { pattern: /(计划|安排|步骤|清单)/, agents: ['closer', 'pathfinder'], weight: 0.8 },
    { pattern: /(算账|成本|收益|利弊)/, agents: ['calculator'], weight: 0.95 },
    { pattern: /(迷茫|不知道|没方向)/, agents: ['pathfinder'], weight: 0.9 },
    { pattern: /(推演|假设|如果.*会)/, agents: ['stress_tester'], weight: 0.85 }
];

export class ThoughtAdvisor {
    private agents: Map<string, Agent>;

    constructor(agents: Agent[]) {
        this.agents = new Map(agents.map(a => [a.id, a]));
    }

    /**
     * 分析用户输入，推荐合适的 Agent
     */
    analyze(input: string): AdvisorResult {
        const normalizedInput = input.toLowerCase();
        const scores = new Map<string, number>();
        
        // 1. 关键词匹配
        for (const [keyword, mappings] of Object.entries(KEYWORD_AGENT_MAP)) {
            if (normalizedInput.includes(keyword)) {
                for (const { agent, weight } of mappings) {
                    const current = scores.get(agent) || 0;
                    scores.set(agent, current + weight);
                }
            }
        }

        // 2. 意图模式匹配
        for (const { pattern, agents: patternAgents, weight } of INTENT_PATTERNS) {
            if (pattern.test(normalizedInput)) {
                for (const agent of patternAgents) {
                    const current = scores.get(agent) || 0;
                    scores.set(agent, current + weight);
                }
            }
        }

        // 3. 排序并生成结果
        const sorted = Array.from(scores.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        if (sorted.length === 0) {
            return {
                recommendedAgents: ['decomposer'],
                confidence: 0.3,
                reasoning: '未识别到明确意图，建议从拆局者开始'
            };
        }

        const topAgent = sorted[0];
        const confidence = Math.min(1, topAgent[1] / 2);

        return {
            recommendedAgents: sorted.map(([id]) => id),
            confidence,
            reasoning: this.generateReasoning(sorted, input)
        };
    }

    /**
     * 生成推荐理由
     */
    private generateReasoning(scored: [string, number][], input: string): string {
        const reasons: string[] = [];
        
        for (const [agentId, score] of scored.slice(0, 2)) {
            const agent = this.agents.get(agentId);
            if (!agent) continue;
            
            if (agentId === 'decomposer') {
                reasons.push('适合拆解复杂问题');
            } else if (agentId === 'calculator') {
                reasons.push('擅长利弊分析和决策');
            } else if (agentId === 'pathfinder') {
                reasons.push('能帮你找到新方向');
            } else if (agentId === 'stress_tester') {
                reasons.push('能识别潜在风险');
            } else if (agentId === 'closer') {
                reasons.push('擅长制定行动计划');
            }
        }

        return reasons.join('，') || '综合分析后推荐';
    }
}

export const thoughtAdvisor = new ThoughtAdvisor([]);

export default ThoughtAdvisor;
