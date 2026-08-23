/**
 * Agent-Skill 兼容性矩阵模块
 * 用于可视化和管理 Agent 与 Skill 之间的兼容性关系
 */

import type { SkillDefinition } from '../skills/types';
import type { AgentDefinition } from '../agents/types';
import { skillRegistry } from '../skills';
import { agentRegistry } from '../agents/registry';

// ============== 兼容性级别 ==============

export type CompatibilityLevel = 'required' | 'recommended' | 'optional' | 'incompatible';

// ============== 兼容性关系 ==============

export interface CompatibilityRelation {
    agentId: string;
    skillId: string;
    
    // 兼容性级别
    level: CompatibilityLevel;
    
    // 使用场景描述
    useCases: string[];
    
    // 效果评分 (0-1)
    effectivenessScore?: number;
    
    // 备注
    note?: string;
}

// ============== 矩阵单元格 ==============

export interface MatrixCell {
    skillId: string;
    agentId: string;
    relation: CompatibilityRelation;
}

// ============== 兼容性矩阵 ==============

export interface CompatibilityMatrix {
    // 矩阵维度
    agents: AgentDefinition[];
    skills: SkillDefinition[];
    
    // 单元格数据
    cells: Map<string, MatrixCell>;  // key: `${agentId}:${skillId}`
    
    // 统计信息
    stats: {
        totalRelations: number;
        requiredCount: number;
        recommendedCount: number;
        optionalCount: number;
        incompatibleCount: number;
    };
}

// ============== 兼容性矩阵构建器 ==============

class CompatibilityMatrixBuilder {
    
    // 构建完整矩阵
    buildMatrix(): CompatibilityMatrix {
        const agents = agentRegistry.getAll();
        const skills = skillRegistry.getAll();
        const cells = new Map<string, MatrixCell>();
        
        let requiredCount = 0;
        let recommendedCount = 0;
        let optionalCount = 0;
        let incompatibleCount = 0;
        
        for (const agent of agents) {
            for (const skill of skills) {
                const relation = this.inferRelation(agent, skill);
                const key = `${agent.id}:${skill.id}`;
                
                cells.set(key, {
                    skillId: skill.id,
                    agentId: agent.id,
                    relation
                });
                
                // 统计
                switch (relation.level) {
                    case 'required': requiredCount++; break;
                    case 'recommended': recommendedCount++; break;
                    case 'optional': optionalCount++; break;
                    case 'incompatible': incompatibleCount++; break;
                }
            }
        }
        
        return {
            agents,
            skills,
            cells,
            stats: {
                totalRelations: cells.size,
                requiredCount,
                recommendedCount,
                optionalCount,
                incompatibleCount
            }
        };
    }
    
    // 从 Agent 和 Skill 定义推断兼容性关系
    private inferRelation(agent: AgentDefinition, skill: SkillDefinition): CompatibilityRelation {
        const relation: CompatibilityRelation = {
            agentId: agent.id,
            skillId: skill.id,
            level: 'optional',
            useCases: []
        };
        
        // 1. 检查 Agent 的 defaultSkills
        if (agent.defaultSkills?.includes(skill.id)) {
            relation.level = 'required';
            relation.useCases.push('Agent 默认技能');
        }
        
        // 2. 检查 Agent 的 compatibleAgents (Skill 角度)
        if (skill.compatibleAgents?.includes(agent.id)) {
            if (relation.level !== 'required') {
                relation.level = 'recommended';
            }
            relation.useCases.push('Skill 兼容列表');
        }
        
        // 3. 检查 Skill 的 recommendedAgents
        if (skill.recommendedAgents?.includes(agent.id)) {
            if (relation.level !== 'required') {
                relation.level = 'recommended';
            }
            relation.useCases.push('Skill 推荐列表');
        }
        
        // 4. 检查标签匹配
        const agentTags = new Set(agent.traits?.tags || []);
        const skillTags = new Set(skill.tags || []);
        const intersection = [...agentTags].filter(t => skillTags.has(t));
        
        if (intersection.length > 0) {
            if (relation.level === 'optional') {
                relation.effectivenessScore = Math.min(0.9, 0.5 + (intersection.length * 0.1));
            }
        }
        
        // 5. 基于类型的推断规则
        if (this.isIncompatibleByType(agent, skill)) {
            relation.level = 'incompatible';
            relation.note = '领域不兼容';
        }
        
        return relation;
    }
    
    // 判断是否领域不兼容
    private isIncompatibleByType(agent: AgentDefinition, skill: SkillDefinition): boolean {
        // Agent 专精领域 vs Skill 类型的不合理组合
        const incompatibleMap: Record<string, string[]> = {
            // 这些 Agent 不应该使用某些类型的 Skill
            'game-developer': ['vulnerability-scanner', 'seo-fundamentals', 'mobile-design'],
            'security-auditor': ['game-development'],
            'mobile-developer': ['game-development', 'vulnerability-scanner'],
            'seo-specialist': ['game-development', 'mobile-design'],
            'database-architect': ['game-development', 'mobile-design', 'seo-fundamentals']
        };
        
        const incompatibleSkills = incompatibleMap[agent.id];
        return incompatibleSkills?.includes(skill.id) || false;
    }
    
    // 获取特定 Agent 的推荐 Skills
    getRecommendedSkillsForAgent(agentId: string): {
        required: SkillDefinition[];
        recommended: SkillDefinition[];
        optional: SkillDefinition[];
        incompatible: SkillDefinition[];
    } {
        const agent = agentRegistry.getById(agentId);
        if (!agent) {
            return { required: [], recommended: [], optional: [], incompatible: [] };
        }
        
        const skills = skillRegistry.getAll();
        const result = {
            required: [] as SkillDefinition[],
            recommended: [] as SkillDefinition[],
            optional: [] as SkillDefinition[],
            incompatible: [] as SkillDefinition[]
        };
        
        for (const skill of skills) {
            const relation = this.inferRelation(agent, skill);
            switch (relation.level) {
                case 'required':
                    result.required.push(skill);
                    break;
                case 'recommended':
                    result.recommended.push(skill);
                    break;
                case 'optional':
                    result.optional.push(skill);
                    break;
                case 'incompatible':
                    result.incompatible.push(skill);
                    break;
            }
        }
        
        return result;
    }
    
    // 获取特定 Skill 的适用 Agents
    getCompatibleAgentsForSkill(skillId: string): {
        required: AgentDefinition[];
        recommended: AgentDefinition[];
        optional: AgentDefinition[];
    } {
        const skill = skillRegistry.getById(skillId);
        if (!skill) {
            return { required: [], recommended: [], optional: [] };
        }
        
        const agents = agentRegistry.getAll();
        const result = {
            required: [] as AgentDefinition[],
            recommended: [] as AgentDefinition[],
            optional: [] as AgentDefinition[]
        };
        
        for (const agent of agents) {
            const relation = this.inferRelation(agent, skill);
            switch (relation.level) {
                case 'required':
                    result.required.push(agent);
                    break;
                case 'recommended':
                case 'optional':
                    result.recommended.push(agent);
                    break;
            }
        }
        
        return result;
    }
    
    // 导出可视化数据
    exportVisualizationData(): {
        nodes: Array<{ id: string; label: string; type: 'agent' | 'skill' }>;
        links: Array<{ source: string; target: string; level: CompatibilityLevel }>;
    } {
        const matrix = this.buildMatrix();
        
        const nodes: Array<{ id: string; label: string; type: 'agent' | 'skill' }> = [];
        const links: Array<{ source: string; target: string; level: CompatibilityLevel }> = [];
        
        // 添加 Agent 节点
        for (const agent of matrix.agents) {
            nodes.push({
                id: agent.id,
                label: agent.name,
                type: 'agent'
            });
        }
        
        // 添加 Skill 节点
        for (const skill of matrix.skills) {
            nodes.push({
                id: skill.id,
                label: skill.name,
                type: 'skill'
            });
        }
        
        // 添加链接（只添加 required 和 recommended）
        for (const cell of matrix.cells.values()) {
            if (cell.relation.level === 'required' || cell.relation.level === 'recommended') {
                links.push({
                    source: cell.agentId,
                    target: cell.skillId,
                    level: cell.relation.level
                });
            }
        }
        
        return { nodes, links };
    }
}

// 导出单例
export const compatibilityMatrixBuilder = new CompatibilityMatrixBuilder();
export default compatibilityMatrixBuilder;
