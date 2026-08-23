/**
 * Agent Store - 管理 Agent 的创建、编辑、删除和持久化
 * Agent = Persona + Skills 的组合
 */

import { writable, get } from 'svelte/store';

// 简单的 ID 生成器
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============== 类型定义 ==============

export interface AgentConfig {
    temperature: number;
    maxTokens?: number;
    model?: string;
}

export interface AgentVisual {
    avatarUrl?: string;
    primaryColor: string;
    icon?: string;
}

export interface Agent {
    id: string;
    name: string;
    description: string;

    // 组合关系
    personaId: string;
    skillIds: string[];

    // 配置
    config: AgentConfig;
    visual: AgentVisual;

    // 元数据
    version: string;
    author?: string;
    createdAt: number;
    updatedAt: number;
    isBuiltIn: boolean;
}

// Squad 成员
export interface SquadMember {
    agentId: string;
    role: 'leader' | 'expert' | 'observer' | 'coordinator';
    description?: string;
}

// Squad 定义
export interface Squad {
    id: string;
    name: string;
    description: string;
    members: SquadMember[];
    orchestrationType: 'sequential' | 'parallel' | 'debate' | 'round_robin';
    createdAt: number;
    updatedAt: number;
}

// ============== 默认值 ==============

const DEFAULT_AGENT_CONFIG: AgentConfig = {
    temperature: 0.7,
    maxTokens: 2048,
};

const DEFAULT_AGENT_VISUAL: AgentVisual = {
    primaryColor: '#8B5CF6',
    icon: '🤖',
};

// ============== 内置预设 Agent ==============

const BUILT_IN_AGENTS: Agent[] = [
    {
        id: 'decomposer',
        name: '拆局者 (Decomposer)',
        description: '首席结构化拆解与架构专家，将复杂问题拆解为编号清单与清晰逻辑层级。',
        personaId: 'mentor_sage',
        skillIds: ['decompose', 'reframe'],
        config: { ...DEFAULT_AGENT_CONFIG },
        visual: { primaryColor: '#FF6B35', icon: 'decomposer' },
        version: '2.0.0',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        isBuiltIn: true,
    },
    {
        id: 'calculator',
        name: '算账的 (Calculator)',
        description: '量化精算与决策矩阵专家，评估隐性成本、ROI 与边际投入产出比。',
        personaId: 'analytic_expert',
        skillIds: ['decision_matrix', 'resource_audit'],
        config: { ...DEFAULT_AGENT_CONFIG },
        visual: { primaryColor: '#2EC4B6', icon: 'calculator' },
        version: '2.0.0',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        isBuiltIn: true,
    },
    {
        id: 'pathfinder',
        name: '找路的 (Pathfinder)',
        description: '破局探索与敏捷假设验证专家，寻找非常规突破路径与低成本尝试。',
        personaId: 'creative_innovator',
        skillIds: ['reframe'],
        config: { ...DEFAULT_AGENT_CONFIG },
        visual: { primaryColor: '#E8C547', icon: 'pathfinder' },
        version: '2.0.0',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        isBuiltIn: true,
    },
    {
        id: 'stress_tester',
        name: '兜底的 (Stress Tester)',
        description: '审慎风控与极限压力推演卫士，识别致命假设盲区并构筑止损防线。',
        personaId: 'analytic_expert',
        skillIds: ['resource_audit'],
        config: { ...DEFAULT_AGENT_CONFIG },
        visual: { primaryColor: '#7B68EE', icon: 'stress_tester' },
        version: '2.0.0',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        isBuiltIn: true,
    },
    {
        id: 'closer',
        name: '收网的 (Closer)',
        description: '敏捷交付与执行落地指挥官，将所有共识收敛为清晰责任人与动作清单。',
        personaId: 'action_coach',
        skillIds: ['action_list'],
        config: { ...DEFAULT_AGENT_CONFIG },
        visual: { primaryColor: '#20BF55', icon: 'closer' },
        version: '2.0.0',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        isBuiltIn: true,
    },
    {
        id: 'challenger',
        name: '辩驳官 (Challenger)',
        description: '批判审查与证伪攻击专家，专击方案软肋、脆弱假设与群体盲思。',
        personaId: 'analytic_expert',
        skillIds: ['reframe', 'decision_matrix'],
        config: { ...DEFAULT_AGENT_CONFIG },
        visual: { primaryColor: '#E11D48', icon: 'challenger' },
        version: '2.0.0',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        isBuiltIn: true,
    },
    {
        id: 'evidence_scout',
        name: '求证者 (Evidence Scout)',
        description: '客观事实与行业基准核验专家，调取真实先例、失败率与数据锚点。',
        personaId: 'analytic_expert',
        skillIds: ['resource_audit'],
        config: { ...DEFAULT_AGENT_CONFIG },
        visual: { primaryColor: '#0284C7', icon: 'evidence_scout' },
        version: '2.0.0',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        isBuiltIn: true,
    },
    {
        id: 'synthesizer',
        name: '裁判官 (Synthesizer)',
        description: '跨小队冲突仲裁与终审综合大家，基于严密论据给出最高置信度决策令。',
        personaId: 'mentor_sage',
        skillIds: ['decision_matrix', 'action_list'],
        config: { ...DEFAULT_AGENT_CONFIG },
        visual: { primaryColor: '#D97706', icon: 'synthesizer' },
        version: '2.0.0',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        isBuiltIn: true,
    },
    {
        id: 'quality_inspector',
        name: '质检官 (Quality Inspector)',
        description: '质量门禁与逻辑一致性审查专家，负责交付物完整性、数据一致性与落地合规核验。',
        personaId: 'analytic_expert',
        skillIds: ['decision_matrix', 'resource_audit'],
        config: { ...DEFAULT_AGENT_CONFIG },
        visual: { primaryColor: '#0D9488', icon: 'quality_inspector' },
        version: '2.0.0',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        isBuiltIn: true,
    },
    {
        id: 'builtin_mentor_agent',
        name: '智者导师 Agent',
        description: '智者导师人格 + 重构技能',
        personaId: 'mentor_sage',
        skillIds: ['reframe', 'decompose'],
        config: { ...DEFAULT_AGENT_CONFIG },
        visual: { primaryColor: '#8B5CF6', icon: 'mentor_sage' },
        version: '1.0.0',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        isBuiltIn: true,
    },
    {
        id: 'builtin_analyst_agent',
        name: '理性分析 Agent',
        description: '理性分析专家人格 + 决策矩阵',
        personaId: 'analytic_expert',
        skillIds: ['decision_matrix', 'resource_audit'],
        config: { ...DEFAULT_AGENT_CONFIG },
        visual: { primaryColor: '#0EA5E9', icon: 'analytic_expert' },
        version: '1.0.0',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        isBuiltIn: true,
    },
    {
        id: 'builtin_coach_agent',
        name: '行动教练 Agent',
        description: '行动教练人格 + 行动清单',
        personaId: 'action_coach',
        skillIds: ['action_list'],
        config: { ...DEFAULT_AGENT_CONFIG },
        visual: { primaryColor: '#10B981', icon: 'action_coach' },
        version: '1.0.0',
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        isBuiltIn: true,
    },
];

// ============== Store ==============

function createAgentStore() {
    const STORAGE_KEY = 'aone_agents_v1';
    const SQUAD_STORAGE_KEY = 'aone_squads_v1';

    // 从 localStorage 加载
    function loadFromStorage<T>(key: string, defaultValue: T): T {
        if (typeof window === 'undefined') return defaultValue;
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch {
            return defaultValue;
        }
    }

    // 保存到 localStorage
    function saveToStorage<T>(key: string, value: T): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }

    // 初始化内置 Agent（首次加载或缺失时补充）
    function initializeBuiltIns(existing: Agent[]): Agent[] {
        const existingIds = new Set(existing.map(a => a.id));
        const missing = BUILT_IN_AGENTS.filter(a => !existingIds.has(a.id));
        return missing.length > 0 ? [...missing, ...existing] : existing;
    }

    // Agents store — 首次加载时自动补充内置 Agent
    const loadedAgents = loadFromStorage<Agent[]>(STORAGE_KEY, []);
    const agentsStore = writable<Agent[]>(initializeBuiltIns(loadedAgents));

    // Squads store
    const squadsStore = writable<Squad[]>(loadFromStorage(SQUAD_STORAGE_KEY, []));

    // 自动保存
    agentsStore.subscribe(value => saveToStorage(STORAGE_KEY, value));
    squadsStore.subscribe(value => saveToStorage(SQUAD_STORAGE_KEY, value));

    return {
        // ====== Agent 操作 ======

        // 获取所有 Agents
        getAll: (): Agent[] => get(agentsStore),

        // 根据 ID 获取 Agent
        getById: (id: string): Agent | undefined => {
            return get(agentsStore).find(a => a.id === id);
        },

        // 根据 PersonaId 获取 Agents
        getByPersonaId: (personaId: string): Agent[] => {
            return get(agentsStore).filter(a => a.personaId === personaId);
        },

        // 创建 Agent
        create: (data: {
            name: string;
            description: string;
            personaId: string;
            skillIds: string[];
            config?: Partial<AgentConfig>;
            visual?: Partial<AgentVisual>;
        }): Agent => {
            const now = Date.now();
            const agent: Agent = {
                id: generateId(),
                name: data.name,
                description: data.description,
                personaId: data.personaId,
                skillIds: data.skillIds,
                config: { ...DEFAULT_AGENT_CONFIG, ...data.config },
                visual: { ...DEFAULT_AGENT_VISUAL, ...data.visual },
                version: '1.0.0',
                createdAt: now,
                updatedAt: now,
                isBuiltIn: false,
            };

            agentsStore.update(agents => [...agents, agent]);
            return agent;
        },

        // 更新 Agent
        update: (id: string, updates: Partial<Omit<Agent, 'id' | 'createdAt'>>): boolean => {
            let found = false;
            agentsStore.update(agents =>
                agents.map(a => {
                    if (a.id === id) {
                        found = true;
                        return { ...a, ...updates, updatedAt: Date.now() };
                    }
                    return a;
                })
            );
            return found;
        },

        // 删除 Agent
        delete: (id: string): boolean => {
            const initialLength = get(agentsStore).length;
            agentsStore.update(agents => agents.filter(a => a.id !== id));
            return get(agentsStore).length < initialLength;
        },

        // 订阅 agents 变化
        subscribe: agentsStore.subscribe,

        // ====== Squad 操作 ======

        // 获取所有 Squads
        getAllSquads: (): Squad[] => get(squadsStore),

        // 创建 Squad
        createSquad: (data: {
            name: string;
            description: string;
            members: SquadMember[];
            orchestrationType: Squad['orchestrationType'];
        }): Squad => {
            const now = Date.now();
            const squad: Squad = {
                id: generateId(),
                name: data.name,
                description: data.description,
                members: data.members,
                orchestrationType: data.orchestrationType,
                createdAt: now,
                updatedAt: now,
            };

            squadsStore.update(squads => [...squads, squad]);
            return squad;
        },

        // 更新 Squad
        updateSquad: (id: string, updates: Partial<Omit<Squad, 'id' | 'createdAt'>>): boolean => {
            let found = false;
            squadsStore.update(squads =>
                squads.map(s => {
                    if (s.id === id) {
                        found = true;
                        return { ...s, ...updates, updatedAt: Date.now() };
                    }
                    return s;
                })
            );
            return found;
        },

        // 删除 Squad
        deleteSquad: (id: string): boolean => {
            const initialLength = get(squadsStore).length;
            squadsStore.update(squads => squads.filter(s => s.id !== id));
            return get(squadsStore).length < initialLength;
        },

        // 订阅 squads 变化
        subscribeSquads: squadsStore.subscribe,

        // ====== 工具方法 ======

        // 导出所有数据
        exportData: () => {
            return {
                agents: get(agentsStore),
                squads: get(squadsStore),
                exportedAt: Date.now(),
            };
        },

        // 导入数据
        importData: (data: { agents?: Agent[]; squads?: Squad[] }) => {
            if (data.agents) {
                agentsStore.set(data.agents);
            }
            if (data.squads) {
                squadsStore.set(data.squads);
            }
        },

        // 清空所有数据
        clearAll: () => {
            agentsStore.set([]);
            squadsStore.set([]);
        },
    };
}

export const agentStore = createAgentStore();
