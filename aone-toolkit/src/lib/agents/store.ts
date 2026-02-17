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
    
    // Agents store
    const agentsStore = writable<Agent[]>(loadFromStorage(STORAGE_KEY, []));
    
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
