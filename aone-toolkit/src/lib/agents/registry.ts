/**
 * Agent 模块 - Agent 注册表
 * 负责 Agent 的注册、查询和管理
 */

import type { AgentDefinition, IAgentRegistry } from './types';
import { builtInAgents } from './builtins';

class AgentRegistry implements IAgentRegistry {
    private agents: Map<string, AgentDefinition> = new Map();
    private initialized = false;

    constructor() {
        this.initialize();
    }

    private initialize() {
        if (this.initialized) return;
        
        // 注册内置 Agent
        for (const agent of builtInAgents) {
            this.agents.set(agent.id, agent);
        }
        
        this.initialized = true;
    }

    getAll(): AgentDefinition[] {
        return Array.from(this.agents.values());
    }

    getById(id: string): AgentDefinition | undefined {
        return this.agents.get(id);
    }

    register(agent: AgentDefinition): void {
        if (this.agents.has(agent.id)) {
            throw new Error(`Agent with id "${agent.id}" already exists`);
        }
        
        // 验证必需字段
        if (!agent.id || !agent.name || !agent.coreBelief) {
            throw new Error('Agent must have id, name, and coreBelief');
        }
        
        this.agents.set(agent.id, {
            ...agent,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isBuiltIn: false
        });
    }

    unregister(id: string): boolean {
        const agent = this.agents.get(id);
        if (!agent) return false;
        
        if (agent.isBuiltIn) {
            throw new Error(`Cannot unregister built-in agent: ${id}`);
        }
        
        return this.agents.delete(id);
    }

    getByTags(tags: string[]): AgentDefinition[] {
        return Array.from(this.agents.values()).filter(agent => 
            tags.some(tag => agent.traits.tags.includes(tag))
        );
    }

    // 更新 Agent
    update(id: string, updates: Partial<AgentDefinition>): boolean {
        const agent = this.agents.get(id);
        if (!agent) return false;
        
        if (agent.isBuiltIn) {
            throw new Error(`Cannot update built-in agent: ${id}`);
        }
        
        this.agents.set(id, {
            ...agent,
            ...updates,
            updatedAt: Date.now()
        });
        
        return true;
    }

    // 导出所有 Agent 配置
    exportAll(): string {
        const customAgents = Array.from(this.agents.values())
            .filter(a => !a.isBuiltIn);
        
        return JSON.stringify(customAgents, null, 2);
    }

    // 批量导入 Agent
    importAgents(json: string): number {
        try {
            const agents = JSON.parse(json) as AgentDefinition[];
            let count = 0;
            
            for (const agent of agents) {
                if (!this.agents.has(agent.id)) {
                    this.register(agent);
                    count++;
                }
            }
            
            return count;
        } catch (e) {
            throw new Error(`Invalid agent config: ${(e as Error).message}`);
        }
    }
}

// 导出单例
export const agentRegistry = new AgentRegistry();
export default agentRegistry;
