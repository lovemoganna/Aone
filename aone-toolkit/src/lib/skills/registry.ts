/**
 * Skill 模块 - Skill 注册表
 * 负责 Skill 的注册、查询和管理
 */

import type { SkillDefinition, ISkillRegistry, SkillContext, SkillResult } from './types';
import { builtInSkills } from './builtins';
import { MetaFlowService } from '$lib/services/MetaFlowService';

class SkillRegistry implements ISkillRegistry {
    private skills: Map<string, SkillDefinition> = new Map();
    private initialized = false;

    constructor() {
        this.initialize();
    }

    private initialize() {
        if (this.initialized) return;
        
        // 注册内置 Skill
        for (const skill of builtInSkills) {
            this.skills.set(skill.id, skill);
        }
        
        this.initialized = true;
    }

    getAll(): SkillDefinition[] {
        return Array.from(this.skills.values());
    }

    getById(id: string): SkillDefinition | undefined {
        return this.skills.get(id);
    }

    register(skill: SkillDefinition): void {
        if (this.skills.has(skill.id)) {
            throw new Error(`Skill with id "${skill.id}" already exists`);
        }
        
        if (!skill.id || !skill.name || !skill.steps) {
            throw new Error('Skill must have id, name, and steps');
        }
        
        this.skills.set(skill.id, {
            ...skill,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isBuiltIn: false
        });
    }

    unregister(id: string): boolean {
        const skill = this.skills.get(id);
        if (!skill) return false;
        
        if (skill.isBuiltIn) {
            throw new Error(`Cannot unregister built-in skill: ${id}`);
        }
        
        return this.skills.delete(id);
    }

    getByAgent(agentId: string): SkillDefinition[] {
        return Array.from(this.skills.values()).filter(skill => 
            skill.compatibleAgents.includes(agentId)
        );
    }

    getByType(type: string): SkillDefinition[] {
        return Array.from(this.skills.values()).filter(skill => 
            skill.type === type
        );
    }

    // 触发检测 - 根据用户输入判断应该使用哪个 Skill
    detectSkill(userInput: string): SkillDefinition | null {
        const input = userInput.toLowerCase();
        
        for (const skill of this.skills.values()) {
            // 检查关键词
            if (skill.trigger.keywords) {
                for (const keyword of skill.trigger.keywords) {
                    if (input.includes(keyword.toLowerCase())) {
                        return skill;
                    }
                }
            }
            
            // 检查正则模式
            if (skill.trigger.patterns) {
                for (const pattern of skill.trigger.patterns) {
                    if (pattern.test(input)) {
                        return skill;
                    }
                }
            }
        }
        
        return null;
    }

    // 更新 Skill
    update(id: string, updates: Partial<SkillDefinition>): boolean {
        const skill = this.skills.get(id);
        if (!skill) return false;
        
        if (skill.isBuiltIn) {
            throw new Error(`Cannot update built-in skill: ${id}`);
        }
        
        this.skills.set(id, {
            ...skill,
            ...updates,
            updatedAt: Date.now()
        });
        
        return true;
    }

    // 导出所有自定义 Skill
    exportAll(): string {
        const customSkills = Array.from(this.skills.values())
            .filter(s => !s.isBuiltIn);
        
        return JSON.stringify(customSkills, null, 2);
    }

    // 批量导入 Skill
    importSkills(json: string): number {
        try {
            const skills = JSON.parse(json) as SkillDefinition[];
            let count = 0;
            
            for (const skill of skills) {
                if (!this.skills.has(skill.id)) {
                    this.register(skill);
                    count++;
                }
            }
            
            return count;
        } catch (e) {
            throw new Error(`Invalid skill config: ${(e as Error).message}`);
        }
    }
}

// ============== Skill 执行器 ==============

class SkillExecutor {
    async execute(context: SkillContext): Promise<SkillResult> {
        const skill = skillRegistry.getById(context.skillId);
        if (!skill) {
            return {
                skillId: context.skillId,
                success: false,
                output: '',
                error: `Skill not found: ${context.skillId}`
            };
        }

        try {
            // 构建执行 Prompt
            const prompt = this.buildExecutionPrompt(skill, context);
            
            // 调用 AI 执行
            const result = await MetaFlowService.callAI(prompt);
            
            return {
                skillId: skill.id,
                success: true,
                output: result,
                metadata: {
                    type: skill.type,
                    stepsExecuted: skill.steps.length
                }
            };
            
        } catch (error: any) {
            return {
                skillId: skill.skillId,
                success: false,
                output: '',
                error: error.message
            };
        }
    }

    validate(context: SkillContext): boolean {
        const skill = skillRegistry.getById(context.skillId);
        if (!skill) return false;
        
        // 检查是否在兼容的 Agent 上使用
        if (context.agentId && !skill.compatibleAgents.includes(context.agentId)) {
            return false;
        }
        
        return true;
    }

    private buildExecutionPrompt(skill: SkillDefinition, context: SkillContext): string {
        let prompt = `**任务**: 执行【${skill.name}】(${skill.type})
**输入**: "${context.userInput}"

`;
        
        if (skill.steps.length > 0) {
            prompt += `**执行步骤**:
`;
            for (const step of skill.steps) {
                prompt += `${step.order}. ${step.description}\n`;
            }
            prompt += `\n`;
        }
        
        prompt += `**输出格式**:
${skill.outputTemplate}
`;
        
        // 添加历史上下文
        if (context.conversationHistory) {
            prompt += `\n**对话历史**:
${context.conversationHistory}
`;
        }
        
        return prompt;
    }
}

// 导出单例
export const skillRegistry = new SkillRegistry();
export const skillExecutor = new SkillExecutor();
export default skillRegistry;
