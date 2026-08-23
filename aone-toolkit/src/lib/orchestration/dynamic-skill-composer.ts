/**
 * 动态技能组合引擎
 * 根据任务上下文动态推荐和组合 Skills
 */

import type { SkillDefinition } from '../skills/types';
import type { AgentDefinition } from '../agents/types';
import { skillRegistry } from '../skills';
import { agentRegistry } from '../agents/registry';
import { skillSetTemplateRegistry } from './skill-set-template-registry';
import type { SkillSetTemplate } from './skill-set-template';
import { compatibilityMatrixBuilder } from './compatibility-matrix';

// ============== 任务上下文 ==============

export interface TaskContext {
    // 用户原始输入
    userInput: string;

    // 任务类型
    taskType: 'code-review' | 'bug-fix' | 'new-feature' | 'refactor' | 'documentation' | 'testing' | 'security' | 'performance' | 'deployment' | 'unknown';

    // 影响的技术领域
    affectedDomains: string[];  // 'frontend', 'backend', 'database', 'security', etc.

    // 影响的技术栈
    techStack: string[];  // 'react', 'nodejs', 'prisma', etc.

    // 影响文件类型
    affectedFileTypes?: string[];

    // 复杂度评估
    complexity: 'simple' | 'moderate' | 'complex';

    // 是否有明确目标
    hasClearGoal: boolean;
}

// ============== 技能推荐 ==============

export interface SkillRecommendation {
    skillId: string;
    skill: SkillDefinition;

    // 推荐原因
    reason: string;

    // 置信度 (0-1)
    confidence: number;

    // 优先级 (1-5)
    priority: number;

    // 来源
    source: 'explicit' | 'template' | 'inferred' | 'compatibility';

    // 是否必需
    isRequired: boolean;
}

// ============== 技能执行计划 ==============

export interface SkillExecutionPlan {
    // 将激活的核心技能
    coreSkills: SkillRecommendation[];

    // 可选技能
    optionalSkills: SkillRecommendation[];

    // 不推荐的技能
    discouragedSkills: SkillRecommendation[];

    // 推荐的 Agent
    recommendedAgents: Array<{
        agent: AgentDefinition;
        reason: string;
        confidence: number;
    }>;

    // 推荐的模板
    recommendedTemplates: SkillSetTemplate[];

    // 整体置信度
    overallConfidence: number;

    // 分析摘要
    summary: string;
}

// ============== 动态技能组合引擎 ==============

class DynamicSkillComposer {

    // 1. 任务分析 - 从用户输入提取任务上下文
    async analyzeTask(userInput: string): Promise<TaskContext> {
        const lowerInput = userInput.toLowerCase();

        // 任务类型识别
        const taskType = this.detectTaskType(lowerInput);

        // 技术领域识别
        const affectedDomains = this.detectAffectedDomains(lowerInput);

        // 技术栈识别
        const techStack = this.detectTechStack(lowerInput);

        // 复杂度评估
        const complexity = this.assessComplexity(lowerInput, affectedDomains);

        // 目标清晰度
        const hasClearGoal = this.hasClearGoal(userInput);

        return {
            userInput,
            taskType,
            affectedDomains,
            techStack,
            complexity,
            hasClearGoal
        };
    }

    // 2. 技能推荐 - 基于任务上下文推荐 Skills
    async recommendSkills(
        taskContext: TaskContext,
        agentIds?: string[]
    ): Promise<SkillRecommendation[]> {
        const recommendations: SkillRecommendation[] = [];

        // 2.1 从模板匹配
        const templateRecommendations = this.getFromTemplates(taskContext);
        recommendations.push(...templateRecommendations);

        // 2.2 从 Agent 定义推断
        if (agentIds && agentIds.length > 0) {
            const agentRecommendations = this.getFromAgents(agentIds);
            recommendations.push(...agentRecommendations);
        }

        // 2.3 从兼容性矩阵
        const compatibilityRecommendations = this.getFromCompatibility(taskContext);
        recommendations.push(...compatibilityRecommendations);

        // 2.4 从任务类型推断
        const typeRecommendations = this.getFromTaskType(taskContext);
        recommendations.push(...typeRecommendations);

        // 去重和优先级排序
        return this.deduplicateAndRank(recommendations);
    }

    // 3. 生成执行计划 - 组合推荐生成完整的执行计划
    async composeExecutionPlan(
        userInput: string,
        agentIds?: string[]
    ): Promise<SkillExecutionPlan> {
        // 分析任务
        const taskContext = await this.analyzeTask(userInput);

        // 获取推荐
        const recommendations = await this.recommendSkills(taskContext, agentIds);

        // 分离核心、可选和反对
        const coreSkills = recommendations.filter(r => r.isRequired || r.priority >= 4);
        const optionalSkills = recommendations.filter(r => !r.isRequired && r.priority < 4 && r.priority >= 2);
        const discouragedSkills = recommendations.filter(r => r.priority < 2);

        // 获取推荐的 Agents
        const recommendedAgents = this.recommendAgents(taskContext, recommendations);

        // 获取推荐的模板
        const recommendedTemplates = skillSetTemplateRegistry.recommendForTask(userInput).slice(0, 3);

        // 计算整体置信度
        const overallConfidence = this.calculateOverallConfidence(recommendations);

        // 生成摘要
        const summary = this.generateSummary(taskContext, coreSkills, recommendedAgents);

        return {
            coreSkills,
            optionalSkills,
            discouragedSkills,
            recommendedAgents,
            recommendedTemplates,
            overallConfidence,
            summary
        };
    }

    // ============== 私有方法 ==============

    // 任务类型检测
    private detectTaskType(input: string): TaskContext['taskType'] {
        const patterns: Array<{ pattern: RegExp; type: TaskContext['taskType'] }> = [
            { pattern: /review|审查|审计|检查/i, type: 'code-review' },
            { pattern: /bug|fix|修复|错误|问题/i, type: 'bug-fix' },
            { pattern: /new|create|添加|新建|开发/i, type: 'new-feature' },
            { pattern: /refactor|重构|优化代码/i, type: 'refactor' },
            { pattern: /doc|文档|说明/i, type: 'documentation' },
            { pattern: /test|测试|coverage/i, type: 'testing' },
            { pattern: /security|安全|vulnerability|漏洞/i, type: 'security' },
            { pattern: /performance|speed|slow|优化|性能/i, type: 'performance' },
            { pattern: /deploy|部署|发布/i, type: 'deployment' }
        ];

        for (const { pattern, type } of patterns) {
            if (pattern.test(input)) {
                return type;
            }
        }

        return 'unknown';
    }

    // 影响领域检测
    private detectAffectedDomains(input: string): string[] {
        const domainPatterns: Array<{ pattern: RegExp; domain: string }> = [
            { pattern: /frontend|ui|界面|前端|组件/i, domain: 'frontend' },
            { pattern: /backend|api|server|后端|接口/i, domain: 'backend' },
            { pattern: /database|db|sql|数据|schema/i, domain: 'database' },
            { pattern: /security|auth|login|auth|安全/i, domain: 'security' },
            { pattern: /devops|docker|k8s|部署/i, domain: 'devops' },
            { pattern: /mobile|app|ios|android/i, domain: 'mobile' },
            { pattern: /game|unity|godot/i, domain: 'game' }
        ];

        const domains: string[] = [];
        for (const { pattern, domain } of domainPatterns) {
            if (pattern.test(input)) {
                domains.push(domain);
            }
        }

        return domains.length > 0 ? domains : ['general'];
    }

    // 技术栈检测
    private detectTechStack(input: string): string[] {
        const techPatterns: Array<{ pattern: RegExp; tech: string }> = [
            { pattern: /react/i, tech: 'react' },
            { pattern: /next\.?js/i, tech: 'nextjs' },
            { pattern: /vue/i, tech: 'vue' },
            { pattern: /angular/i, tech: 'angular' },
            { pattern: /nodejs|node/i, tech: 'nodejs' },
            { pattern: /python/i, tech: 'python' },
            { pattern: /fastapi/i, tech: 'fastapi' },
            { pattern: /prisma/i, tech: 'prisma' },
            { pattern: /typescript|ts/i, tech: 'typescript' },
            { pattern: /tailwind/i, tech: 'tailwind' },
            { pattern: /docker/i, tech: 'docker' },
            { pattern: /postgresql|postgres|pg/i, tech: 'postgresql' },
            { pattern: /mongodb|mongo/i, tech: 'mongodb' }
        ];

        const techStack: string[] = [];
        for (const { pattern, tech } of techPatterns) {
            if (pattern.test(input)) {
                techStack.push(tech);
            }
        }

        return techStack;
    }

    // 复杂度评估
    private assessComplexity(input: string, domains: string[]): 'simple' | 'moderate' | 'complex' {
        const complexityIndicators = {
            simple: [/small|tiny|simple|简单|小/i, /one|单个|一个/i],
            moderate: [/medium|moderate|中等|一般/i],
            complex: [/complex|large|big|复杂|大型|多个|many/i]
        };

        for (const pattern of complexityIndicators.complex) {
            if (pattern.test(input)) return 'complex';
        }

        if (domains.length > 2) return 'complex';

        for (const pattern of complexityIndicators.moderate) {
            if (pattern.test(input)) return 'moderate';
        }

        return 'simple';
    }

    // 目标清晰度
    private hasClearGoal(input: string): boolean {
        const vagueIndicators = [/maybe|perhaps|可能|也许/i, /not sure|不确定/i, /whatever|都行/i];
        return !vagueIndicators.some(p => p.test(input));
    }

    // 从模板获取推荐
    private getFromTemplates(taskContext: TaskContext): SkillRecommendation[] {
        const recommendations: SkillRecommendation[] = [];
        const templates = skillSetTemplateRegistry.recommendForTask(taskContext.userInput);

        for (const template of templates.slice(0, 2)) {
            const result = skillSetTemplateRegistry.applyTemplate(template.id);
            if (result) {
                for (const skillId of [...result.activatedCoreSkills, ...result.activatedOptionalSkills]) {
                    const skill = skillRegistry.getById(skillId);
                    if (skill) {
                        recommendations.push({
                            skillId,
                            skill,
                            reason: `模板 "${template.name}" 推荐`,
                            confidence: 0.8 * result.confidence,
                            priority: 4,
                            source: 'template',
                            isRequired: result.activatedCoreSkills.includes(skillId)
                        });
                    }
                }
            }
        }

        return recommendations;
    }

    // 从 Agent 定义获取推荐
    private getFromAgents(agentIds: string[]): SkillRecommendation[] {
        const recommendations: SkillRecommendation[] = [];

        for (const agentId of agentIds) {
            const agent = agentRegistry.getById(agentId);
            if (!agent) continue;

            // 获取 Agent 的默认 Skills
            if (agent.defaultSkills) {
                for (const skillId of agent.defaultSkills) {
                    const skill = skillRegistry.getById(skillId);
                    if (skill) {
                        recommendations.push({
                            skillId,
                            skill,
                            reason: `Agent "${agent.name}" 的默认技能`,
                            confidence: 0.7,
                            priority: 4,
                            source: 'explicit',
                            isRequired: true
                        });
                    }
                }
            }
        }

        return recommendations;
    }

    // 从兼容性矩阵获取推荐
    private getFromCompatibility(taskContext: TaskContext): SkillRecommendation[] {
        const recommendations: SkillRecommendation[] = [];

        // 基于技术栈从兼容性矩阵获取推荐
        for (const domain of taskContext.affectedDomains) {
            const skillRecs = compatibilityMatrixBuilder.getRecommendedSkillsForAgent(
                `${domain}-specialist` as any
            );

            for (const skill of [...skillRecs.required, ...skillRecs.recommended]) {
                recommendations.push({
                    skillId: skill.id,
                    skill,
                    reason: `与 "${domain}" 领域兼容`,
                    confidence: 0.6,
                    priority: 3,
                    source: 'compatibility',
                    isRequired: false
                });
            }
        }

        return recommendations;
    }

    // 从任务类型获取推荐
    private getFromTaskType(taskContext: TaskContext): SkillRecommendation[] {
        const recommendations: SkillRecommendation[] = [];

        const taskTypeSkills: Record<string, string[]> = {
            'code-review': ['clean-code', 'code-review-checklist'],
            'bug-fix': ['systematic-debugging', 'clean-code'],
            'new-feature': ['plan-writing', 'architecture'],
            'refactor': ['clean-code', 'code-review-checklist'],
            'documentation': ['documentation-templates'],
            'testing': ['testing-patterns', 'webapp-testing', 'tdd-workflow'],
            'security': ['vulnerability-scanner', 'red-team-tactics'],
            'performance': ['performance-profiling'],
            'deployment': ['deployment-procedures', 'docker-expert']
        };

        const relevantSkills = taskTypeSkills[taskContext.taskType] || [];

        for (const skillId of relevantSkills) {
            const skill = skillRegistry.getById(skillId);
            if (skill) {
                recommendations.push({
                    skillId,
                    skill,
                    reason: `任务类型 "${taskContext.taskType}" 典型技能`,
                    confidence: 0.5,
                    priority: 3,
                    source: 'inferred',
                    isRequired: false
                });
            }
        }

        return recommendations;
    }

    // 去重和优先级排序
    private deduplicateAndRank(recommendations: SkillRecommendation[]): SkillRecommendation[] {
        const seen = new Map<string, SkillRecommendation>();

        for (const rec of recommendations) {
            const existing = seen.get(rec.skillId);
            if (!existing) {
                seen.set(rec.skillId, rec);
            } else {
                // 保留置信度更高的
                if (rec.confidence > existing.confidence) {
                    seen.set(rec.skillId, rec);
                } else if (rec.confidence === existing.confidence && rec.priority > existing.priority) {
                    seen.set(rec.skillId, rec);
                }
            }
        }

        return Array.from(seen.values()).sort((a, b) => {
            if (a.isRequired !== b.isRequired) return a.isRequired ? -1 : 1;
            if (a.priority !== b.priority) return b.priority - a.priority;
            return b.confidence - a.confidence;
        });
    }

    // 推荐 Agents
    private recommendAgents(
        taskContext: TaskContext,
        skillRecommendations: SkillRecommendation[]
    ): Array<{ agent: AgentDefinition; reason: string; confidence: number }> {
        const recommendations: Array<{ agent: AgentDefinition; reason: string; confidence: number }> = [];

        // 基于影响领域推荐
        for (const domain of taskContext.affectedDomains) {
            const agentId = `${domain}-specialist`;
            const agent = agentRegistry.getById(agentId);

            if (agent) {
                recommendations.push({
                    agent,
                    reason: `处理 "${domain}" 领域任务`,
                    confidence: 0.8
                });
            }
        }

        // 基于任务类型推荐
        const taskTypeAgents: Record<string, string> = {
            'code-review': 'code-archaeologist',
            'bug-fix': 'debugger',
            'security': 'security-auditor',
            'testing': 'test-engineer',
            'deployment': 'devops-engineer',
            'performance': 'performance-optimizer'
        };

        const agentId = taskTypeAgents[taskContext.taskType];
        if (agentId) {
            const agent = agentRegistry.getById(agentId);
            if (agent && !recommendations.find(r => r.agent.id === agent.id)) {
                recommendations.push({
                    agent,
                    reason: `适合 "${taskContext.taskType}" 任务`,
                    confidence: 0.7
                });
            }
        }

        return recommendations;
    }

    // 计算整体置信度
    private calculateOverallConfidence(recommendations: SkillRecommendation[]): number {
        if (recommendations.length === 0) return 0;

        const weightedSum = recommendations.reduce(
            (sum, rec) => sum + rec.confidence * rec.priority,
            0
        );
        const maxPossible = recommendations.length * 5;

        return weightedSum / maxPossible;
    }

    // 生成摘要
    private generateSummary(
        taskContext: TaskContext,
        coreSkills: SkillRecommendation[],
        recommendedAgents: Array<{ agent: AgentDefinition; reason: string; confidence: number }>
    ): string {
        const parts: string[] = [];

        // 任务类型
        parts.push(`任务类型: ${taskContext.taskType}`);

        // 复杂度
        parts.push(`复杂度: ${taskContext.complexity}`);

        // 影响领域
        if (taskContext.affectedDomains.length > 0) {
            parts.push(`影响领域: ${taskContext.affectedDomains.join(', ')}`);
        }

        // 核心技能数量
        parts.push(`推荐技能: ${coreSkills.length} 个核心 + 可选技能`);

        // 推荐 Agents
        if (recommendedAgents.length > 0) {
            parts.push(`推荐 Agents: ${recommendedAgents.map(r => r.agent.name).join(', ')}`);
        }

        return parts.join(' | ');
    }
}

// 导出单例
export const dynamicSkillComposer = new DynamicSkillComposer();
export default dynamicSkillComposer;
