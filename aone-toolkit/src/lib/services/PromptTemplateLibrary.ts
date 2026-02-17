/**
 * Prompt 模板库 (Prompt Template Library)
 * 管理和使用常用的 Prompt 模板
 */

import { browser } from '$app/environment';
import type { PromptTemplate } from '../agents/feature-enhancements';

const TEMPLATES_KEY = 'agent_studio_prompt_templates';

// 内置模板
const BUILT_IN_TEMPLATES: PromptTemplate[] = [
    {
        id: 'problem-analysis',
        name: '问题分析',
        description: '系统性地分析问题的各个方面',
        template: `请帮我分析以下问题，要求：
1. 问题的本质是什么？
2. 涉及的 stakeholders 有哪些？
3. 短期和长期影响分别是什么？
4. 可能的解决方案有哪些？

问题：{{problem}}`,
        variables: [
            { key: 'problem', description: '要分析的问题', default: '' }
        ],
        category: '分析',
        usageCount: 0
    },
    {
        id: 'decision-matrix',
        name: '决策矩阵',
        description: '构建多维度决策分析矩阵',
        template: `请帮我构建一个决策矩阵，对比以下选项：

选项：{{options}}

请从以下维度分析：
1. 成本
2. 收益
3. 风险
4. 可行性
5. 时间周期

每个维度用 1-10 分评估，并说明理由。`,
        variables: [
            { key: 'options', description: '要对比的选项，用逗号分隔', default: '选项A, 选项B' }
        ],
        category: '决策',
        usageCount: 0
    },
    {
        id: 'action-plan',
        name: '行动计划',
        description: '生成可执行的任务清单',
        template: `基于以下目标，请生成详细的行动计划：

目标：{{goal}}

请包含：
1. 具体的每日/每周任务
2. 优先级排序
3. 潜在障碍及应对方案
4. 成功指标

时间范围：{{timeline}}`,
        variables: [
            { key: 'goal', description: '要达成的目标', default: '' },
            { key: 'timeline', description: '时间范围', default: '一个月' }
        ],
        category: '执行',
        usageCount: 0
    },
    {
        id: 'risk-assessment',
        name: '风险评估',
        description: '全面评估潜在风险',
        template: `请帮我进行风险评估：

项目/决策：{{project}}

请分析：
1. 可能会出现什么问题？
2. 每个问题的严重程度（高/中/低）
3. 发生的概率
4. 预防措施
5. 应急预案`,
        variables: [
            { key: 'project', description: '要评估的项目或决策', default: '' }
        ],
        category: '风险',
        usageCount: 0
    },
    {
        id: 'learning-summary',
        name: '学习总结',
        description: '从经验中提取学习点',
        template: `请帮我总结这次经验：

经历：{{experience}}

请分析：
1. 什么做得好？
2. 什么可以改进？
3. 学到了什么关键教训？
4. 未来如何应用这些学习？`,
        variables: [
            { key: 'experience', description: '要总结的经历', default: '' }
        ],
        category: '反思',
        usageCount: 0
    }
];

export class PromptTemplateLibrary {
    private templates: Map<string, PromptTemplate> = new Map();

    constructor() {
        // 初始化内置模板
        for (const template of BUILT_IN_TEMPLATES) {
            this.templates.set(template.id, { ...template });
        }
        
        // 加载自定义模板
        if (browser) {
            this.loadFromStorage();
        }
    }

    /**
     * 获取所有模板
     */
    getAll(): PromptTemplate[] {
        return Array.from(this.templates.values())
            .sort((a, b) => b.usageCount - a.usageCount);
    }

    /**
     * 根据分类获取模板
     */
    getByCategory(category: string): PromptTemplate[] {
        return this.getAll().filter(t => t.category === category);
    }

    /**
     * 根据 ID 获取模板
     */
    getById(id: string): PromptTemplate | undefined {
        return this.templates.get(id);
    }

    /**
     * 填充模板变量
     */
    fillTemplate(id: string, variables: Record<string, string>): string {
        const template = this.templates.get(id);
        if (!template) throw new Error('Template not found');

        let result = template.template;
        for (const [key, value] of Object.entries(variables)) {
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || template.variables.find(v => v.key === key)?.default || '');
        }
        
        // 更新使用次数
        template.usageCount++;
        this.saveToStorage();
        
        return result;
    }

    /**
     * 搜索模板
     */
    search(query: string): PromptTemplate[] {
        const q = query.toLowerCase();
        return this.getAll().filter(t => 
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q)
        );
    }

    /**
     * 添加自定义模板
     */
    addTemplate(template: Omit<PromptTemplate, 'id' | 'usageCount'>): PromptTemplate {
        const id = `custom_${Date.now()}`;
        const newTemplate: PromptTemplate = {
            ...template,
            id,
            usageCount: 0
        };
        
        this.templates.set(id, newTemplate);
        this.saveToStorage();
        
        return newTemplate;
    }

    /**
     * 删除自定义模板
     */
    deleteTemplate(id: string): boolean {
        const template = this.templates.get(id);
        if (!template) return false;
        
        // 不允许删除内置模板
        if (!id.startsWith('custom_')) return false;
        
        const result = this.templates.delete(id);
        if (result) {
            this.saveToStorage();
        }
        return result;
    }

    /**
     * 获取所有分类
     */
    getCategories(): string[] {
        const categories = new Set(this.templates.values().map(t => t.category));
        return Array.from(categories);
    }

    /**
     * 从存储加载
     */
    private loadFromStorage(): void {
        try {
            const data = localStorage.getItem(TEMPLATES_KEY);
            if (data) {
                const customTemplates: PromptTemplate[] = JSON.parse(data);
                for (const template of customTemplates) {
                    if (!this.templates.has(template.id)) {
                        this.templates.set(template.id, template);
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load templates:', e);
        }
    }

    /**
     * 保存到存储
     */
    private saveToStorage(): void {
        try {
            const customTemplates = Array.from(this.templates.values())
                .filter(t => t.id.startsWith('custom_'));
            localStorage.setItem(TEMPLATES_KEY, JSON.stringify(customTemplates));
        } catch (e) {
            console.error('Failed to save templates:', e);
        }
    }
}

export const promptTemplateLibrary = new PromptTemplateLibrary();

export default PromptTemplateLibrary;
