/**
 * 技能组合模板模块 - 类型定义
 * 用于预定义 Agent × Skills 的可配置组合
 */

import type { SkillDefinition } from '../skills/types';

// ============== 模板类型 ==============

export type SkillSetTemplateType = 
    | 'agent-specific'   // 特定 Agent 专用
    | 'cross-agent'       // 跨 Agent 组合
    | 'task-driven';      // 任务驱动型

// ============== 技能集合定义 ==============

export interface SkillSetGroup {
    // 核心技能（始终激活）
    core: string[];
    
    // 可选技能（按需激活）
    optional: string[];
    
    // 互斥技能组（每组只能选一个）
    mutual: string[][];
}

// ============== 触发条件 ==============

export interface SkillSetTrigger {
    // 关键词触发
    keywords?: string[];
    
    // 任务类型触发
    taskTypes?: string[];
    
    // 上下文模式
    contextPatterns?: string[];
}

// ============== 技能组合模板 ==============

export interface SkillSetTemplate {
    // 基础信息
    id: string;
    name: string;
    description: string;
    
    // 模板类型
    type: SkillSetTemplateType;
    
    // 适用 Agent（可选）
    agentId?: string;
    agentIds?: string[];
    
    // 技能集合定义
    skillSets: SkillSetGroup;
    
    // 触发条件
    triggers?: SkillSetTrigger;
    
    // 使用场景
    useCases?: string[];
    
    // 标签
    tags: string[];
    
    // 元数据
    version: string;
    author?: string;
    createdAt?: number;
    updatedAt?: number;
    isBuiltIn: boolean;
    
    // 统计
    usageCount: number;
    rating: number;
    successRate?: number;
}

// ============== 模板应用结果 ==============

export interface TemplateApplicationResult {
    templateId: string;
    
    // 激活的技能
    activatedCoreSkills: string[];
    activatedOptionalSkills: string[];
    
    // 推荐的 Agent
    recommendedAgents?: string[];
    
    // 触发原因
    matchedTriggers: string[];
    
    // 置信度
    confidence: number;
}

// ============== 预设模板 ==============

// 注意：skill IDs 需与 src/lib/skills/builtins.ts 和 .agent/skills/ 中的实际 ID 匹配
// 认知技能 (from builtins.ts): decompose, decision_matrix, stress_test, resource_audit, reframe, action_list
// Agent 技能 (from .agent/skills/): react-patterns, api-patterns, database-design, etc.

export const BUILT_IN_SKILL_SET_TEMPLATES: SkillSetTemplate[] = [
    // ========== 全栈 Web 开发 ==========
    {
        id: 'fullstack-web-dev',
        name: '全栈 Web 开发',
        description: '适用于 Web 应用开发的完整技能栈，覆盖前端、后端和测试',
        type: 'cross-agent',
        skillSets: {
            core: ['clean-code', 'lint-and-validate'],
            optional: [
                'react-patterns', 
                'nextjs-best-practices', 
                'tailwind-patterns',
                'api-patterns', 
                'nodejs-best-practices',
                'database-design',
                'prisma-expert',
                'testing-patterns',
                'webapp-testing'
            ],
            mutual: [
                ['testing-patterns', 'webapp-testing', 'tdd-workflow']
            ]
        },
        triggers: {
            taskTypes: ['web-app', 'fullstack', 'spa', 'website'],
            keywords: ['web', 'react', 'next.js', 'frontend', 'backend', 'fullstack', 'website', '页面', '组件']
        },
        useCases: ['创建 Web 应用', '开发 SPA', '全栈项目'],
        tags: ['web', 'fullstack', 'react', 'development'],
        version: '1.0.0',
        isBuiltIn: true,
        usageCount: 0,
        rating: 4.8
    },
    
    // ========== 安全审查 ==========
    {
        id: 'security-review',
        name: '安全审查',
        description: '安全相关的代码审查技能组合，覆盖漏洞扫描和红队战术',
        type: 'task-driven',
        skillSets: {
            core: ['vulnerability-scanner', 'red-team-tactics'],
            optional: ['clean-code', 'api-patterns', 'database-design'],
            mutual: []
        },
        triggers: {
            taskTypes: ['security-review', 'audit'],
            keywords: ['security', 'vulnerability', 'auth', 'password', 'token', 'jwt', 'login', '加密', '权限', '安全']
        },
        useCases: ['安全审计', '漏洞扫描', '认证审查'],
        tags: ['security', 'audit', 'vulnerability'],
        version: '1.0.0',
        isBuiltIn: true,
        usageCount: 0,
        rating: 4.9
    },
    
    // ========== API 开发 ==========
    {
        id: 'api-development',
        name: 'API 开发',
        description: 'REST/GraphQL API 设计和实现的专业技能组合',
        type: 'cross-agent',
        skillSets: {
            core: ['api-patterns', 'clean-code'],
            optional: [
                'nodejs-best-practices',
                'python-patterns',
                'nestjs-expert',
                'database-design',
                'prisma-expert',
                'testing-patterns'
            ],
            mutual: [
                ['nodejs-best-practices', 'python-patterns', 'nestjs-expert']
            ]
        },
        triggers: {
            taskTypes: ['api', 'backend', 'rest', 'graphql'],
            keywords: ['api', 'endpoint', 'route', 'rest', 'graphql', 'crud', '接口', '后端']
        },
        useCases: ['创建 API', '设计 RESTful', 'GraphQL 开发'],
        tags: ['api', 'backend', 'rest', 'graphql'],
        version: '1.0.0',
        isBuiltIn: true,
        usageCount: 0,
        rating: 4.7
    },
    
    // ========== 前端开发 ==========
    {
        id: 'frontend-development',
        name: '前端开发',
        description: '现代 Web 前端开发的完整技能栈',
        type: 'agent-specific',
        agentId: 'frontend-specialist',
        skillSets: {
            core: ['clean-code', 'lint-and-validate'],
            optional: [
                'react-patterns',
                'nextjs-best-practices',
                'tailwind-patterns',
                'frontend-design',
                'ui-ux-pro-max',
                'performance-profiling'
            ],
            mutual: [
                ['react-patterns', 'nextjs-best-practices']
            ]
        },
        triggers: {
            taskTypes: ['frontend', 'ui', 'component'],
            keywords: ['component', 'ui', 'react', 'vue', 'tailwind', 'css', '样式', '组件', '前端']
        },
        useCases: ['创建 UI 组件', '前端性能优化', '响应式设计'],
        tags: ['frontend', 'ui', 'react', 'component'],
        version: '1.0.0',
        isBuiltIn: true,
        usageCount: 0,
        rating: 4.8
    },
    
    // ========== 测试工程 ==========
    {
        id: 'testing-engineering',
        name: '测试工程',
        description: '全面的测试策略，包括单元测试、E2E 和测试驱动开发',
        type: 'task-driven',
        skillSets: {
            core: ['testing-patterns', 'clean-code'],
            optional: [
                'webapp-testing',
                'tdd-workflow',
                'code-review-checklist'
            ],
            mutual: []
        },
        triggers: {
            taskTypes: ['testing', 'test', 'e2e'],
            keywords: ['test', 'testing', 'unit', 'e2e', 'jest', 'vitest', 'playwright', 'coverage', '测试', '测试用例']
        },
        useCases: ['编写测试', 'E2E 测试', '测试覆盖率提升'],
        tags: ['testing', 'qa', 'e2e', 'tdd'],
        version: '1.0.0',
        isBuiltIn: true,
        usageCount: 0,
        rating: 4.6
    },
    
    // ========== 数据库设计 ==========
    {
        id: 'database-design',
        name: '数据库设计',
        description: '数据库架构、Schema 设计和性能优化技能组合',
        type: 'agent-specific',
        agentId: 'database-architect',
        skillSets: {
            core: ['database-design', 'prisma-expert'],
            optional: ['api-patterns', 'nodejs-best-practices', 'python-patterns'],
            mutual: []
        },
        triggers: {
            taskTypes: ['database', 'schema', 'migration'],
            keywords: ['database', 'schema', 'migration', 'sql', 'prisma', 'table', '数据库', '表结构']
        },
        useCases: ['数据库设计', 'Schema 规划', '数据库优化'],
        tags: ['database', 'schema', 'prisma', 'sql'],
        version: '1.0.0',
        isBuiltIn: true,
        usageCount: 0,
        rating: 4.7
    },
    
    // ========== 性能优化 ==========
    {
        id: 'performance-optimization',
        name: '性能优化',
        description: 'Web 应用性能分析和优化技能组合',
        type: 'task-driven',
        skillSets: {
            core: ['performance-profiling', 'clean-code'],
            optional: [
                'frontend-design',
                'api-patterns',
                'database-design'
            ],
            mutual: []
        },
        triggers: {
            taskTypes: ['performance', 'optimization'],
            keywords: ['performance', 'slow', 'optimize', 'speed', 'latency', 'bundle', '性能', '优化', '加载', '慢']
        },
        useCases: ['性能分析', '加载优化', 'Core Web Vitals'],
        tags: ['performance', 'optimization', 'web-vitals'],
        version: '1.0.0',
        isBuiltIn: true,
        usageCount: 0,
        rating: 4.5
    },
    
    // ========== DevOps 部署 ==========
    {
        id: 'devops-deployment',
        name: 'DevOps 部署',
        description: '容器化、CI/CD 和云部署的完整技能栈',
        type: 'agent-specific',
        agentId: 'devops-engineer',
        skillSets: {
            core: ['docker-expert', 'deployment-procedures'],
            optional: ['server-management', 'nodejs-best-practices'],
            mutual: []
        },
        triggers: {
            taskTypes: ['deployment', 'devops', 'docker'],
            keywords: ['deploy', 'docker', 'kubernetes', 'ci/cd', 'nginx', '部署', '容器']
        },
        useCases: ['应用部署', 'Docker 容器化', 'CI/CD 配置'],
        tags: ['devops', 'deployment', 'docker', 'ci-cd'],
        version: '1.0.0',
        isBuiltIn: true,
        usageCount: 0,
        rating: 4.6
    },
    
    // ========== 移动开发 ==========
    {
        id: 'mobile-development',
        name: '移动开发',
        description: 'React Native 和移动应用开发技能组合',
        type: 'agent-specific',
        agentId: 'mobile-developer',
        skillSets: {
            core: ['mobile-design', 'clean-code'],
            optional: ['react-patterns', 'api-patterns', 'testing-patterns'],
            mutual: []
        },
        triggers: {
            taskTypes: ['mobile', 'app', 'react-native'],
            keywords: ['mobile', 'react-native', 'ios', 'android', 'app', '应用', '移动']
        },
        useCases: ['移动应用开发', 'React Native', '跨平台开发'],
        tags: ['mobile', 'react-native', 'ios', 'android'],
        version: '1.0.0',
        isBuiltIn: true,
        usageCount: 0,
        rating: 4.7
    },
    
    // ========== SEO 优化 ==========
    {
        id: 'seo-optimization',
        name: 'SEO 优化',
        description: '搜索引擎优化和增长技能组合',
        type: 'task-driven',
        skillSets: {
            core: ['seo-fundamentals', 'geo-fundamentals'],
            optional: ['frontend-design', 'performance-profiling'],
            mutual: []
        },
        triggers: {
            taskTypes: ['seo', 'ranking'],
            keywords: ['seo', 'ranking', 'google', 'search', 'meta', '搜索引擎', '排名']
        },
        useCases: ['SEO 审计', '排名优化', 'Meta 标签优化'],
        tags: ['seo', 'ranking', 'growth'],
        version: '1.0.0',
        isBuiltIn: true,
        usageCount: 0,
        rating: 4.4
    },
    
    // ========== 认知问题解决（使用内置认知技能）==========
    {
        id: 'problem-solving',
        name: '问题解决',
        description: '使用认知技能解决复杂问题，包含拆解、分析和行动计划',
        type: 'task-driven',
        skillSets: {
            core: ['decompose', 'decision_matrix', 'action_list'],
            optional: ['reframe', 'stress_test', 'resource_audit'],
            mutual: []
        },
        triggers: {
            taskTypes: ['problem', 'analysis', 'decision'],
            keywords: ['问题', '分析', '决策', '解决', '怎么办', '如何做', '选择']
        },
        useCases: ['问题分析', '决策制定', '行动计划'],
        tags: ['problem-solving', 'analysis', 'decision'],
        version: '1.0.0',
        isBuiltIn: true,
        usageCount: 0,
        rating: 4.9
    },
    
    // ========== 创意激发 ==========
    {
        id: 'creative-thinking',
        name: '创意激发',
        description: '打破思维定式，激发创意和创新能力',
        type: 'task-driven',
        skillSets: {
            core: ['reframe', 'decompose'],
            optional: ['brainstorming', 'action_list'],
            mutual: []
        },
        triggers: {
            taskTypes: ['creative', 'innovation', 'idea'],
            keywords: ['创意', '创新', '想法', 'idea', '灵感', '突破', '新思路']
        },
        useCases: ['创意生成', '思维突破', '新观点'],
        tags: ['creative', 'innovation', 'brainstorm'],
        version: '1.0.0',
        isBuiltIn: true,
        usageCount: 0,
        rating: 4.7
    },
    
    // ========== 行动执行 ==========
    {
        id: 'action-execution',
        name: '行动执行',
        description: '将想法转化为具体可执行的行动',
        type: 'task-driven',
        skillSets: {
            core: ['action_list', 'resource_audit'],
            optional: ['decompose', 'decision_matrix'],
            mutual: []
        },
        triggers: {
            taskTypes: ['action', 'execution', 'plan'],
            keywords: ['行动', '执行', '做', '开始', '计划', 'todo', '任务']
        },
        useCases: ['行动计划', '任务分解', '执行落地'],
        tags: ['action', 'execution', 'productivity'],
        version: '1.0.0',
        isBuiltIn: true,
        usageCount: 0,
        rating: 4.8
    }
];

// ============== 模板注册表接口 ==============

export interface ISkillSetTemplateRegistry {
    getAll(): SkillSetTemplate[];
    getById(id: string): SkillSetTemplate | undefined;
    getByAgent(agentId: string): SkillSetTemplate[];
    getByType(type: SkillSetTemplateType): SkillSetTemplate[];
    getByKeyword(keyword: string): SkillSetTemplate[];
    register(template: SkillSetTemplate): void;
    unregister(id: string): boolean;
    updateUsage(id: string): void;
}
