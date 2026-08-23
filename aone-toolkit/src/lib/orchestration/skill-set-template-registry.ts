/**
 * 智能匹配结果
 */
export interface SmartMatchResult {
    // 匹配类型
    type: 'template' | 'scenario';
    
    // 匹配的项
    item: SkillSetTemplate;
    
    // 匹配分数
    score: number;
    
    // 匹配原因
    matchedReasons: string[];
    
    // 置信度
    confidence: number;
}

/**
 * 技能组合模板注册表
 * 管理技能组合模板的注册、查询和应用
 */

import { 
    type SkillSetTemplate, 
    type ISkillSetTemplateRegistry,
    type SkillSetTemplateType,
    type TemplateApplicationResult,
    BUILT_IN_SKILL_SET_TEMPLATES 
} from './skill-set-template';
import { BUILT_IN_SCENARIOS } from './types';

class SkillSetTemplateRegistry implements ISkillSetTemplateRegistry {
    private templates: Map<string, SkillSetTemplate> = new Map();
    
    constructor() {
        // 初始化内置模板
        this.initBuiltInTemplates();
    }
    
    private initBuiltInTemplates(): void {
        for (const template of BUILT_IN_SKILL_SET_TEMPLATES) {
            this.templates.set(template.id, { ...template });
        }
    }
    
    getAll(): SkillSetTemplate[] {
        return Array.from(this.templates.values());
    }
    
    getById(id: string): SkillSetTemplate | undefined {
        return this.templates.get(id);
    }
    
    getByAgent(agentId: string): SkillSetTemplate[] {
        return Array.from(this.templates.values()).filter(
            template => 
                template.agentId === agentId || 
                (template.agentIds && template.agentIds.includes(agentId)) ||
                template.type === 'cross-agent'
        );
    }
    
    getByType(type: SkillSetTemplateType): SkillSetTemplate[] {
        return Array.from(this.templates.values()).filter(
            template => template.type === type
        );
    }
    
    getByKeyword(keyword: string): SkillSetTemplate[] {
        const lowerKeyword = keyword.toLowerCase();
        
        return Array.from(this.templates.values()).filter(template => {
            // 搜索名称、描述、标签
            const searchableText = [
                template.name,
                template.description,
                ...template.tags,
                ...(template.useCases || [])
            ].join(' ').toLowerCase();
            
            if (searchableText.includes(lowerKeyword)) {
                return true;
            }
            
            // 搜索触发关键词
            if (template.triggers?.keywords) {
                for (const kw of template.triggers.keywords) {
                    if (kw.toLowerCase().includes(lowerKeyword)) {
                        return true;
                    }
                }
            }
            
            return false;
        });
    }
    
    register(template: SkillSetTemplate): void {
        if (this.templates.has(template.id)) {
            console.warn(`Template ${template.id} already exists, overwriting...`);
        }
        
        this.templates.set(template.id, {
            ...template,
            createdAt: template.createdAt || Date.now(),
            updatedAt: Date.now()
        });
    }
    
    unregister(id: string): boolean {
        const template = this.templates.get(id);
        
        if (!template) {
            return false;
        }
        
        // 不允许删除内置模板
        if (template.isBuiltIn) {
            console.warn(`Cannot delete built-in template: ${id}`);
            return false;
        }
        
        return this.templates.delete(id);
    }
    
    updateUsage(id: string): void {
        const template = this.templates.get(id);
        if (template) {
            template.usageCount++;
            template.updatedAt = Date.now();
        }
    }
    
    // ============== 模板应用 ==============
    
    /**
     * 根据任务输入自动推荐模板
     */
    recommendForTask(taskInput: string): SkillSetTemplate[] {
        const recommendations: Array<{
            template: SkillSetTemplate;
            score: number;
            matchedReasons: string[];
        }> = [];
        
        const lowerInput = taskInput.toLowerCase();
        
        for (const template of this.templates.values()) {
            let score = 0;
            const matchedReasons: string[] = [];
            
            // 匹配触发关键词
            if (template.triggers?.keywords) {
                for (const keyword of template.triggers.keywords) {
                    if (lowerInput.includes(keyword.toLowerCase())) {
                        score += 10;
                        matchedReasons.push(`匹配关键词: ${keyword}`);
                    }
                }
            }
            
            // 匹配任务类型
            if (template.triggers?.taskTypes) {
                for (const taskType of template.triggers.taskTypes) {
                    if (lowerInput.includes(taskType.toLowerCase())) {
                        score += 8;
                        matchedReasons.push(`匹配任务类型: ${taskType}`);
                    }
                }
            }
            
            // 匹配标签
            for (const tag of template.tags) {
                if (lowerInput.includes(tag.toLowerCase())) {
                    score += 5;
                    matchedReasons.push(`匹配标签: ${tag}`);
                }
            }
            
            if (score > 0) {
                recommendations.push({
                    template,
                    score,
                    matchedReasons
                });
            }
        }
        
        // 按分数排序
        recommendations.sort((a, b) => b.score - a.score);
        
        return recommendations.map(r => r.template);
    }
    
    // ============== 智能自动匹配 ==============
    
    /**
     * 智能自动匹配 - 同时匹配技能模板和场景包
     * @param input 用户输入
     * @param options 可选选项
     * @returns 匹配结果数组
     */
    autoMatch(input: string, options?: {
        maxResults?: number;
        minScore?: number;
        types?: Array<'template' | 'scenario'>;
    }): SmartMatchResult[] {
        const maxResults = options?.maxResults ?? 5;
        const minScore = options?.minScore ?? 1;
        const types = options?.types ?? ['template', 'scenario'];
        
        const results: SmartMatchResult[] = [];
        const lowerInput = input.toLowerCase();
        
        // 匹配技能模板
        if (types.includes('template')) {
            for (const template of this.templates.values()) {
                const matchResult = this.calculateMatchScore(template, lowerInput);
                if (matchResult.score >= minScore) {
                    results.push({
                        type: 'template',
                        item: template,
                        score: matchResult.score,
                        matchedReasons: matchResult.reasons,
                        confidence: Math.min(0.95, matchResult.score / 20)
                    });
                }
            }
        }
        
        // 匹配场景包
        if (types.includes('scenario')) {
            for (const scenario of BUILT_IN_SCENARIOS) {
                const matchResult = this.calculateScenarioMatchScore(scenario, lowerInput);
                if (matchResult.score >= minScore) {
                    // 将场景包转换为 SkillSetTemplate 格式返回
                    const templateLike = this.scenarioToTemplateLike(scenario);
                    results.push({
                        type: 'scenario',
                        item: templateLike,
                        score: matchResult.score,
                        matchedReasons: matchResult.reasons,
                        confidence: Math.min(0.95, matchResult.score / 20)
                    });
                }
            }
        }
        
        // 按分数排序并限制数量
        results.sort((a, b) => b.score - a.score);
        
        return results.slice(0, maxResults);
    }
    
    /**
     * 计算模板匹配分数
     */
    private calculateMatchScore(template: SkillSetTemplate, lowerInput: string): {
        score: number;
        reasons: string[];
    } {
        let score = 0;
        const reasons: string[] = [];
        
        // 匹配入口引导语（最高优先级）
        if (template.name) {
            const nameWords = template.name.toLowerCase().split(/[\s\-_]/);
            for (const word of nameWords) {
                if (word.length > 2 && lowerInput.includes(word)) {
                    score += 15;
                    reasons.push(`匹配名称: ${word}`);
                    break;
                }
            }
        }
        
        // 匹配触发关键词
        if (template.triggers?.keywords) {
            for (const keyword of template.triggers.keywords) {
                const lowerKeyword = keyword.toLowerCase();
                if (lowerInput.includes(lowerKeyword)) {
                    score += 12;
                    reasons.push(`触发词: ${keyword}`);
                } else {
                    // 模糊匹配
                    for (const inputWord of lowerInput.split(/\s+/)) {
                        if (inputWord.length > 3 && (lowerKeyword.includes(inputWord) || inputWord.includes(lowerKeyword))) {
                            score += 6;
                            reasons.push(`相关词: ${keyword}`);
                            break;
                        }
                    }
                }
            }
        }
        
        // 匹配任务类型
        if (template.triggers?.taskTypes) {
            for (const taskType of template.triggers.taskTypes) {
                if (lowerInput.includes(taskType.toLowerCase())) {
                    score += 10;
                    reasons.push(`任务类型: ${taskType}`);
                }
            }
        }
        
        // 匹配标签
        for (const tag of template.tags) {
            if (lowerInput.includes(tag.toLowerCase())) {
                score += 8;
                reasons.push(`标签: ${tag}`);
            }
        }
        
        // 匹配使用场景
        if (template.useCases) {
            for (const useCase of template.useCases) {
                const useCaseWords = useCase.toLowerCase().split(/[\s\-_]/);
                for (const word of useCaseWords) {
                    if (word.length > 2 && lowerInput.includes(word)) {
                        score += 5;
                        reasons.push(`使用场景: ${useCase}`);
                        break;
                    }
                }
            }
        }
        
        // 匹配描述
        if (template.description) {
            const descWords = template.description.toLowerCase().split(/\s+/);
            for (const word of descWords) {
                if (word.length > 4 && lowerInput.includes(word)) {
                    score += 3;
                    reasons.push(`描述相关`);
                    break;
                }
            }
        }
        
        return { score, reasons: [...new Set(reasons)] };
    }
    
    /**
     * 计算场景包匹配分数
     */
    private calculateScenarioMatchScore(scenario: typeof BUILT_IN_SCENARIOS[0], lowerInput: string): {
        score: number;
        reasons: string[];
    } {
        let score = 0;
        const reasons: string[] = [];
        
        // 匹配场景名称
        if (scenario.name) {
            const nameWords = scenario.name.toLowerCase().split(/[\s\-_]/);
            for (const word of nameWords) {
                if (word.length > 2 && lowerInput.includes(word)) {
                    score += 15;
                    reasons.push(`匹配场景: ${word}`);
                    break;
                }
            }
        }
        
        // 匹配入口引导语
        if (scenario.entryPrompt) {
            const promptWords = scenario.entryPrompt.toLowerCase().split(/\s+/);
            for (const word of promptWords) {
                if (word.length > 3 && lowerInput.includes(word)) {
                    score += 12;
                    reasons.push(`引导语相关`);
                    break;
                }
            }
        }
        
        // 匹配标签
        for (const tag of scenario.tags) {
            if (lowerInput.includes(tag.toLowerCase())) {
                score += 10;
                reasons.push(`标签: ${tag}`);
            }
        }
        
        // 匹配描述
        if (scenario.description) {
            const descWords = scenario.description.toLowerCase().split(/\s+/);
            for (const word of descWords) {
                if (word.length > 4 && lowerInput.includes(word)) {
                    score += 5;
                    reasons.push(`描述相关`);
                    break;
                }
            }
        }
        
        return { score, reasons: [...new Set(reasons)] };
    }
    
    /**
     * 将场景包转换为模板格式（用于统一返回）
     */
    private scenarioToTemplateLike(scenario: typeof BUILT_IN_SCENARIOS[0]): SkillSetTemplate {
        return {
            id: `scenario_${scenario.id}`,
            name: scenario.name,
            description: scenario.description,
            type: 'task-driven',
            skillSets: {
                core: [],
                optional: scenario.recommendedSkills,
                mutual: []
            },
            triggers: {
                keywords: scenario.tags,
                taskTypes: scenario.tags
            },
            useCases: [scenario.entryPrompt],
            tags: scenario.tags,
            version: '1.0.0',
            isBuiltIn: true,
            usageCount: 0,
            rating: 4.5
        };
    }
    
    /**
     * 获取快速建议 - 用于输入时的即时反馈
     * @param input 用户输入
     * @returns 简要建议列表
     */
    getQuickSuggestions(input: string): Array<{
        id: string;
        name: string;
        type: 'template' | 'scenario';
        icon: string;
    }> {
        if (!input || input.length < 2) {
            // 返回最热门的模板
            return this.getAll()
                .sort((a, b) => b.usageCount - a.usageCount)
                .slice(0, 3)
                .map(t => ({
                    id: t.id,
                    name: t.name,
                    type: 'template' as const,
                    icon: '📦'
                }));
        }
        
        const matches = this.autoMatch(input, { maxResults: 5, minScore: 1 });
        
        return matches.map(m => ({
            id: m.item.id,
            name: m.item.name,
            type: m.type,
            icon: m.type === 'scenario' ? '🎯' : '📦'
        }));
    }
    
    /**
     * 应用模板，生成激活的技能列表
     */
    applyTemplate(
        templateId: string, 
        options?: {
            selectedOptionalSkills?: string[];
            selectedMutualGroups?: string[][];
        }
    ): TemplateApplicationResult | null {
        const template = this.getById(templateId);
        
        if (!template) {
            return null;
        }
        
        // 核心技能始终激活
        const activatedCoreSkills = [...template.skillSets.core];
        
        // 可选技能：使用用户选择的或默认全选
        let activatedOptionalSkills: string[];
        if (options?.selectedOptionalSkills) {
            activatedOptionalSkills = options.selectedOptionalSkills.filter(
                skill => template.skillSets.optional.includes(skill)
            );
        } else {
            activatedOptionalSkills = [...template.skillSets.optional];
        }
        
        // 处理互斥组：默认选择每组第一个
        const selectedMutualGroups: string[][] = [];
        for (const mutualGroup of template.skillSets.mutual) {
            if (options?.selectedMutualGroups) {
                // 使用用户选择
                const userSelected = options.selectedMutualGroups.find(
                    g => g.every(skill => mutualGroup.includes(skill))
                );
                if (userSelected) {
                    selectedMutualGroups.push(userSelected);
                } else {
                    selectedMutualGroups.push([mutualGroup[0]]);
                }
            } else {
                // 默认选择每组第一个
                selectedMutualGroups.push([mutualGroup[0]]);
            }
        }
        
        // 更新使用统计
        this.updateUsage(templateId);
        
        return {
            templateId: template.id,
            activatedCoreSkills,
            activatedOptionalSkills: [
                ...activatedOptionalSkills,
                ...selectedMutualGroups.flat()
            ],
            recommendedAgents: template.agentIds || (template.agentId ? [template.agentId] : undefined),
            matchedTriggers: template.triggers?.keywords || [],
            confidence: 0.85
        };
    }
    
    // ============== 模板验证 ==============
    
    validateTemplate(template: Partial<SkillSetTemplate>): {
        valid: boolean;
        errors: string[];
        warnings: string[];
    } {
        const errors: string[] = [];
        const warnings: string[] = [];
        
        // 必填字段检查
        if (!template.id) errors.push('缺少模板 ID');
        if (!template.name) errors.push('缺少模板名称');
        if (!template.description) errors.push('缺少模板描述');
        if (!template.skillSets) errors.push('缺少技能集合定义');
        
        // 技能集合检查
        if (template.skillSets) {
            if (!template.skillSets.core || template.skillSets.core.length === 0) {
                warnings.push('核心技能列表为空，建议至少添加一个核心技能');
            }
            
            // 检查互斥组是否有重复技能
            const allMutualSkills = template.skillSets.mutual?.flat() || [];
            const uniqueSkills = new Set(allMutualSkills);
            if (allMutualSkills.length !== uniqueSkills.size) {
                errors.push('互斥技能组中存在重复的技能');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    // ============== 模板导出/导入 ==============
    
    exportToJSON(): string {
        const customTemplates = Array.from(this.templates.values())
            .filter(t => !t.isBuiltIn);
        
        return JSON.stringify(customTemplates, null, 2);
    }
    
    importFromJSON(jsonString: string): {
        success: boolean;
        imported: number;
        errors: string[];
    } {
        const errors: string[] = [];
        let imported = 0;
        
        try {
            const templates = JSON.parse(jsonString) as SkillSetTemplate[];
            
            for (const template of templates) {
                const validation = this.validateTemplate(template);
                
                if (!validation.valid) {
                    errors.push(`模板 ${template.id}: ${validation.errors.join(', ')}`);
                    continue;
                }
                
                this.register({
                    ...template,
                    isBuiltIn: false,
                    createdAt: Date.now()
                });
                imported++;
            }
        } catch (e) {
            errors.push(`JSON 解析失败: ${e}`);
        }
        
        return {
            success: errors.length === 0,
            imported,
            errors
        };
    }
}

// 导出单例
export const skillSetTemplateRegistry = new SkillSetTemplateRegistry();
export default skillSetTemplateRegistry;
