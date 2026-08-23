/**
 * Skill 模块 - Skill 注册表
 * 负责 Skill 的注册、查询和管理
 */

import type { SkillDefinition, ISkillRegistry, SkillContext, SkillResult } from './types';
import { builtInSkills } from './builtins';
import { MetaFlowService } from '$lib/services/MetaFlowService';

class SkillRegistry implements ISkillRegistry {
    private skillsList = $state<SkillDefinition[]>([]);
    private initialized = false;

    constructor() {
        this.initialize();
    }

    private initialize() {
        if (this.initialized) return;
        
        // 1. 加载内置 Skill
        const builtIn = builtInSkills.map(skill => ({ 
            ...skill, 
            isBuiltIn: true,
            createdAt: skill.createdAt || Date.now(),
            updatedAt: skill.updatedAt || Date.now()
        }));
        
        // 2. 从本地存储加载自定义 Skill (可能包含对内置技能的覆盖)
        let customSkills: SkillDefinition[] = [];
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('custom_skills');
                if (stored) {
                    customSkills = JSON.parse(stored) as SkillDefinition[];
                }
            } catch (e) {
                console.error('Failed to load skills from storage:', e);
            }
        }

        // 3. 合并：自定义技能覆盖同 ID 的内置技能
        const mergedMap = new Map<string, SkillDefinition>();
        
        // 先放内置
        builtIn.forEach(s => mergedMap.set(s.id, s));
        
        // 后放自定义（同ID会覆盖）
        customSkills.forEach(s => {
            mergedMap.set(s.id, { ...s, isBuiltIn: false });
        });
        
        this.skillsList = Array.from(mergedMap.values());
        this.initialized = true;
    }

    private saveToStorage() {
        if (typeof window === 'undefined') return;
        const customSkills = this.skillsList.filter(s => !s.isBuiltIn);
        localStorage.setItem('custom_skills', JSON.stringify(customSkills));
    }

    getAll(): SkillDefinition[] {
        return this.skillsList;
    }

    getById(id: string): SkillDefinition | undefined {
        return this.skillsList.find(s => s.id === id);
    }

    register(skill: SkillDefinition): void {
        // 如果已经存在同名 ID 的非内置技能，报错
        const existing = this.getById(skill.id);
        if (existing && !existing.isBuiltIn) {
            throw new Error(`Skill with id "${skill.id}" already exists`);
        }
        
        const newSkill = {
            ...skill,
            createdAt: skill.createdAt || Date.now(),
            updatedAt: Date.now(),
            isBuiltIn: false
        };
        
        // 如果是覆盖内置技能，替换它
        const index = this.skillsList.findIndex(s => s.id === skill.id);
        if (index !== -1) {
            this.skillsList[index] = newSkill;
        } else {
            this.skillsList = [...this.skillsList, newSkill];
        }
        
        this.saveToStorage();
    }

    unregister(id: string): boolean {
        const skill = this.getById(id);
        if (!skill) return false;
        
        if (skill.isBuiltIn) {
            throw new Error(`无法删除原始内置技能。`);
        }

        // 检查是否在覆盖内置技能
        const originalBuiltIn = builtInSkills.find(s => s.id === id);
        
        if (originalBuiltIn) {
            // 如果是覆盖了内置技能，则恢复为内置版本
            const index = this.skillsList.findIndex(s => s.id === id);
            this.skillsList[index] = {
                ...originalBuiltIn,
                isBuiltIn: true,
                createdAt: originalBuiltIn.createdAt || Date.now(),
                updatedAt: Date.now()
            };
        } else {
            // 彻底删除
            this.skillsList = this.skillsList.filter(s => s.id !== id);
        }
        
        this.saveToStorage();
        return true;
    }

    // 复制 Skill
    duplicate(id: string): SkillDefinition {
        const skill = this.getById(id);
        if (!skill) throw new Error(`Skill not found: ${id}`);
        
        const newId = `${skill.id}_copy_${Date.now().toString(36)}`;
        const newSkill: SkillDefinition = {
            ...JSON.parse(JSON.stringify(skill)),
            id: newId,
            name: `${skill.name} (副本)`,
            isBuiltIn: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        this.skillsList = [...this.skillsList, newSkill];
        this.saveToStorage();
        return newSkill;
    }

    update(id: string, updates: Partial<SkillDefinition>): boolean {
        const index = this.skillsList.findIndex(s => s.id === id);
        if (index === -1) return false;
        
        const skill = this.skillsList[index];
        
        // 更新并统一转为非内置（即持久化在 custom_skills 中）
        this.skillsList[index] = {
            ...skill,
            ...updates,
            isBuiltIn: false,
            updatedAt: Date.now()
        };
        
        this.saveToStorage();
        return true;
    }

    // 导出所有自定义 Skill
    exportAll(): string {
        const customSkills = this.skillsList.filter(s => !s.isBuiltIn);
        return JSON.stringify(customSkills, null, 2);
    }

    // 批量导入 Skill
    importSkills(json: string): number {
        try {
            const skills = JSON.parse(json) as SkillDefinition[];
            let count = 0;
            
            for (const skill of skills) {
                this.register(skill);
                count++;
            }
            
            return count;
        } catch (e) {
            throw new Error(`Invalid skill config: ${(e as Error).message}`);
        }
    }

    getByAgent(agentId: string): SkillDefinition[] {
        return this.skillsList.filter(skill => 
            skill.compatibleAgents.includes(agentId)
        );
    }

    getByType(type: string): SkillDefinition[] {
        return this.skillsList.filter(skill => 
            skill.type === type
        );
    }

    // 触发检测 - 根据用户输入判断应该使用哪个 Skill
    detectSkill(userInput: string): SkillDefinition | null {
        const input = userInput.toLowerCase();
        
        for (const skill of this.skillsList) {
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
                    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
                    if (regex.test(input)) {
                        return skill;
                    }
                }
            }
        }
        
        return null;
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
                skillId: skill.id,
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
