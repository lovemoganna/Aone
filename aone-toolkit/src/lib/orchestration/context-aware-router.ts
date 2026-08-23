/**
 * 上下文感知的智能路由
 * 基于语义分析和项目上下文进行智能 Agent 路由
 */

import type { AgentDefinition } from '../agents/types';
import { agentRegistry } from '../agents/registry';
import { dynamicSkillComposer, type TaskContext, type SkillExecutionPlan } from './dynamic-skill-composer';
import { skillSetTemplateRegistry } from './skill-set-template-registry';

// ============== 路由决策 ==============

export interface RoutingDecision {
    // 主要 Agent
    primaryAgent: AgentDefinition;

    // 辅助 Agents（可选）
    secondaryAgents: AgentDefinition[];

    // 推荐 Skills
    recommendedSkills: string[];

    // 置信度
    confidence: number;

    // 决策理由
    reasons: string[];

    // 路由类型
    routingType: 'direct' | 'orchestrated' | 'delegated';

    // 是否需要用户确认
    requiresConfirmation: boolean;
}

// ============== 意图分析 ==============

export interface IntentAnalysis {
    // 表面意图（用户说的）
    surfaceIntent: string;

    // 深层意图（用户真正想要的）
    deepIntent: string;

    // 隐含需要的 Agent
    impliedAgents: string[];

    // 紧急程度
    urgency: 'low' | 'medium' | 'high';

    // 复杂度评估
    complexity: 'simple' | 'moderate' | 'complex';

    // 是否需要多 Agent 协作
    needsOrchestration: boolean;
}

// ============== 项目上下文 ==============

export interface ProjectContext {
    // 技术栈
    techStack: {
        frontend?: string[];
        backend?: string[];
        database?: string[];
        infrastructure?: string[];
    };

    // 最近修改的文件类型
    recentChanges: string[];

    // 正在开发的功能
    activeFeatures: string[];

    // 已知的 Issue
    knownIssues: string[];

    // 项目类型
    projectType: 'web' | 'mobile' | 'api' | 'fullstack' | 'unknown';
}

// ============== 上下文感知路由器 ==============

class ContextAwareRouter {

    // 1. 路由决策 - 主要入口
    async route(userInput: string): Promise<RoutingDecision> {
        // 1.1 分析用户意图
        const intent = await this.analyzeIntent(userInput);

        // 1.2 构建任务上下文
        const taskContext = await dynamicSkillComposer.analyzeTask(userInput);

        // 1.3 生成技能执行计划
        const skillPlan = await dynamicSkillComposer.composeExecutionPlan(userInput);

        // 1.4 确定主要 Agent
        const primaryAgent = this.determinePrimaryAgent(intent, taskContext, skillPlan);

        // 1.5 确定辅助 Agents
        const secondaryAgents = this.determineSecondaryAgents(intent, taskContext, skillPlan);

        // 1.6 确定推荐 Skills
        const recommendedSkills = this.determineRecommendedSkills(skillPlan);

        // 1.7 计算置信度
        const confidence = this.calculateConfidence(intent, taskContext, skillPlan);

        // 1.8 生成理由
        const reasons = this.generateReasons(intent, taskContext, primaryAgent, secondaryAgents);

        // 1.9 确定路由类型
        const routingType = this.determineRoutingType(secondaryAgents.length, taskContext.complexity);

        // 1.10 判断是否需要用户确认
        const requiresConfirmation = this.needsConfirmation(intent, confidence);

        return {
            primaryAgent,
            secondaryAgents,
            recommendedSkills,
            confidence,
            reasons,
            routingType,
            requiresConfirmation
        };
    }

    // 2. 意图分析 - 使用规则和模式匹配
    private async analyzeIntent(userInput: string): Promise<IntentAnalysis> {
        const lowerInput = userInput.toLowerCase();

        // 2.1 表面意图提取
        const surfaceIntent = this.extractSurfaceIntent(userInput);

        // 2.2 深层意图推断
        const deepIntent = this.inferDeepIntent(userInput);

        // 2.3 隐含 Agent 识别
        const impliedAgents = this.identifyImpliedAgents(lowerInput);

        // 2.4 紧急程度评估
        const urgency = this.assessUrgency(lowerInput);

        // 2.5 复杂度评估
        const complexity = this.assessComplexity(lowerInput);

        // 2.6 是否需要多 Agent 协作
        const needsOrchestration = this.requiresOrchestration(lowerInput, complexity);

        return {
            surfaceIntent,
            deepIntent,
            impliedAgents,
            urgency,
            complexity,
            needsOrchestration
        };
    }

    // 3. 确定主要 Agent
    private determinePrimaryAgent(
        intent: IntentAnalysis,
        taskContext: TaskContext,
        skillPlan: SkillExecutionPlan
    ): AgentDefinition {
        // 如果有推荐的 Agents，使用推荐中的第一个
        if (skillPlan.recommendedAgents.length > 0) {
            return skillPlan.recommendedAgents[0].agent;
        }

        // 基于任务类型和影响领域选择
        const taskTypeAgentMap: Record<string, string> = {
            'code-review': 'code-archaeologist',
            'bug-fix': 'debugger',
            'security': 'security-auditor',
            'testing': 'test-engineer',
            'deployment': 'devops-engineer',
            'performance': 'performance-optimizer',
            'new-feature': 'project-planner',
            'refactor': 'code-archaeologist'
        };

        // 尝试基于任务类型
        const agentId = taskTypeAgentMap[taskContext.taskType];
        if (agentId) {
            const agent = agentRegistry.getById(agentId);
            if (agent) return agent;
        }

        // 尝试基于影响领域
        if (taskContext.affectedDomains.length > 0) {
            const domain = taskContext.affectedDomains[0];
            const domainAgentId = `${domain}-specialist`;
            const agent = agentRegistry.getById(domainAgentId);
            if (agent) return agent;
        }

        // 默认使用 orchestrator
        const defaultAgent = agentRegistry.getById('orchestrator');
        if (defaultAgent) return defaultAgent;

        // 兜底：返回第一个可用 Agent
        return agentRegistry.getAll()[0];
    }

    // 4. 确定辅助 Agents
    private determineSecondaryAgents(
        intent: IntentAnalysis,
        taskContext: TaskContext,
        skillPlan: SkillExecutionPlan
    ): AgentDefinition[] {
        const agents: AgentDefinition[] = [];

        // 从推荐计划中获取
        if (skillPlan.recommendedAgents.length > 1) {
            for (const rec of skillPlan.recommendedAgents.slice(1, 4)) {
                agents.push(rec.agent);
            }
        }

        // 基于多领域影响添加
        if (taskContext.affectedDomains.length > 1) {
            for (const domain of taskContext.affectedDomains.slice(1)) {
                const agent = agentRegistry.getById(`${domain}-specialist`);
                if (agent && !agents.find(a => a.id === agent.id)) {
                    agents.push(agent);
                }
            }
        }

        // 如果需要编排，添加测试和安全的 Agent
        if (intent.needsOrchestration) {
            const testAgent = agentRegistry.getById('test-engineer');
            if (testAgent && !agents.find(a => a.id === testAgent.id)) {
                agents.push(testAgent);
            }
        }

        return agents;
    }

    // 5. 确定推荐 Skills
    private determineRecommendedSkills(skillPlan: SkillExecutionPlan): string[] {
        const skills: string[] = [];

        // 添加核心 Skills
        for (const rec of skillPlan.coreSkills.slice(0, 5)) {
            skills.push(rec.skillId);
        }

        // 添加部分可选 Skills
        for (const rec of skillPlan.optionalSkills.slice(0, 3)) {
            if (!skills.includes(rec.skillId)) {
                skills.push(rec.skillId);
            }
        }

        return skills;
    }

    // 6. 计算置信度
    private calculateConfidence(
        intent: IntentAnalysis,
        taskContext: TaskContext,
        skillPlan: SkillExecutionPlan
    ): number {
        let confidence = 0.5; // 基础置信度

        // 目标清晰度加分
        if (taskContext.hasClearGoal) {
            confidence += 0.15;
        }

        // 推荐 Agents 数量
        if (skillPlan.recommendedAgents.length > 0) {
            confidence += 0.1;
        }

        // 推荐 Skills 数量
        if (skillPlan.coreSkills.length >= 2) {
            confidence += 0.1;
        }

        // 任务类型明确性
        if (taskContext.taskType !== 'unknown') {
            confidence += 0.1;
        }

        // 影响领域明确性
        if (taskContext.affectedDomains.length > 0 && taskContext.affectedDomains[0] !== 'general') {
            confidence += 0.1;
        }

        return Math.min(0.95, confidence);
    }

    // 7. 生成决策理由
    private generateReasons(
        intent: IntentAnalysis,
        taskContext: TaskContext,
        primaryAgent: AgentDefinition,
        secondaryAgents: AgentDefinition[]
    ): string[] {
        const reasons: string[] = [];

        // 任务类型
        if (taskContext.taskType !== 'unknown') {
            reasons.push(`任务类型: ${taskContext.taskType}`);
        }

        // 影响领域
        if (taskContext.affectedDomains.length > 0) {
            reasons.push(`涉及领域: ${taskContext.affectedDomains.join(', ')}`);
        }

        // 复杂度
        reasons.push(`复杂度评估: ${taskContext.complexity}`);

        // 主要 Agent 理由
        reasons.push(`主 Agent: ${primaryAgent.name} (${primaryAgent.oneLiner})`);

        // 辅助 Agents
        if (secondaryAgents.length > 0) {
            reasons.push(`协作 Agents: ${secondaryAgents.map(a => a.name).join(', ')}`);
        }

        // 是否需要编排
        if (intent.needsOrchestration) {
            reasons.push('此任务需要多 Agent 协作');
        }

        return reasons;
    }

    // 8. 确定路由类型
    private determineRoutingType(secondaryAgentCount: number, complexity: string): 'direct' | 'orchestrated' | 'delegated' {
        if (complexity === 'complex' || secondaryAgentCount >= 2) {
            return 'orchestrated';
        }

        if (secondaryAgentCount > 0) {
            return 'delegated';
        }

        return 'direct';
    }

    // 9. 判断是否需要确认
    private needsConfirmation(intent: IntentAnalysis, confidence: number): boolean {
        // 置信度低需要确认
        if (confidence < 0.7) return true;

        // 复杂任务需要确认
        if (intent.complexity === 'complex') return true;

        // 需要编排需要确认
        if (intent.needsOrchestration) return true;

        return false;
    }

    // ============== 辅助方法 ==============

    private extractSurfaceIntent(input: string): string {
        // 提取用户输入中最直接表达的需求
        const patterns = [
            /我要(.+)/i,
            /帮我(.+)/i,
            /请(.+)/i,
            /需要(.+)/i,
            /(.+)一下/i
        ];

        for (const pattern of patterns) {
            const match = input.match(pattern);
            if (match) {
                return match[1] || match[0];
            }
        }

        return input;
    }

    private inferDeepIntent(input: string): string {
        // 基于关键词推断深层意图
        const deepIntentMap: Array<{ keywords: string[]; intent: string }> = [
            { keywords: ['慢', '性能', '卡'], intent: '优化性能' },
            { keywords: ['错误', 'bug', '崩溃'], intent: '修复问题' },
            { keywords: ['安全', '漏洞'], intent: '安全审查' },
            { keywords: ['测试', '覆盖'], intent: '确保质量' },
            { keywords: ['新', '添加', '创建'], intent: '开发新功能' },
            { keywords: ['部署', '发布'], intent: '部署上线' }
        ];

        const lowerInput = input.toLowerCase();

        for (const { keywords, intent } of deepIntentMap) {
            if (keywords.some(k => lowerInput.includes(k))) {
                return intent;
            }
        }

        return '理解需求并执行';
    }

    private identifyImpliedAgents(input: string): string[] {
        const agents: string[] = [];

        const agentKeywords: Record<string, string[]> = {
            'frontend-specialist': ['前端', '界面', '组件', '样式'],
            'backend-specialist': ['后端', '接口', 'API', '数据库'],
            'security-auditor': ['安全', '漏洞', '权限', '登录'],
            'test-engineer': ['测试', '覆盖', '用例'],
            'devops-engineer': ['部署', 'Docker', 'CI/CD'],
            'database-architect': ['数据库', 'Schema', '表结构'],
            'performance-optimizer': ['性能', '优化', '慢'],
            'debugger': ['调试', '错误', 'Bug']
        };

        for (const [agentId, keywords] of Object.entries(agentKeywords)) {
            if (keywords.some(k => input.includes(k))) {
                agents.push(agentId);
            }
        }

        return agents;
    }

    private assessUrgency(input: string): 'low' | 'medium' | 'high' {
        const urgentKeywords = ['紧急', '立即', '马上', 'urgent', 'asap', 'critical'];
        const mediumKeywords = ['尽快', '及时', 'soon'];

        if (urgentKeywords.some(k => input.includes(k))) return 'high';
        if (mediumKeywords.some(k => input.includes(k))) return 'medium';
        return 'low';
    }

    private assessComplexity(input: string): 'simple' | 'moderate' | 'complex' {
        const complexIndicators = ['系统', '完整', '全面', '多个', '复杂'];
        const simpleIndicators = ['简单', '单个', '小'];

        if (complexIndicators.some(k => input.includes(k))) return 'complex';
        if (simpleIndicators.some(k => input.includes(k))) return 'simple';
        return 'moderate';
    }

    private requiresOrchestration(input: string, complexity: string): boolean {
        // 复杂任务或者包含多个领域
        const multiDomainIndicators = ['前端', '后端', '数据库', '部署'];
        const domainCount = multiDomainIndicators.filter(d => input.includes(d)).length;

        return complexity === 'complex' || domainCount >= 2;
    }

    // ============== 路由报告生成 ==============

    generateRoutingReport(userInput: string, decision: RoutingDecision): string {
        return `
## 🎯 路由决策报告

**用户输入**: ${userInput}

**决策结果**:
- 路由类型: ${decision.routingType}
- 置信度: ${(decision.confidence * 100).toFixed(0)}%
- 需要确认: ${decision.requiresConfirmation ? '是' : '否'}

**主 Agent**: ${decision.primaryAgent.name}
- 描述: ${decision.primaryAgent.oneLiner}

${decision.secondaryAgents.length > 0 ? `**协作 Agents**: ${decision.secondaryAgents.map(a => a.name).join(', ')}` : ''}

**推荐 Skills**: ${decision.recommendedSkills.join(', ')}

**决策理由**:
${decision.reasons.map(r => `- ${r}`).join('\n')}
        `.trim();
    }
}

// 导出单例
export const contextAwareRouter = new ContextAwareRouter();
export default contextAwareRouter;
