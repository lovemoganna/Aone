/**
 * 统一能力中心 Store
 * 整合 Agent、Skill 和编排系统的统一状态管理
 */

import { agentExecutor, agentRegistry, type AgentDefinition } from '../agents';
import { skillExecutor, skillRegistry, type SkillDefinition } from '../skills';
import { BUILT_IN_SCENARIOS, type ScenarioPackage } from '../orchestration';

export interface CapabilityConfig {
    agentIds: string[];
    skillIds: string[];
    workflowId?: string;
    scenarioId?: string;
}

export interface CapabilityState {
    // Agent 状态
    agents: AgentDefinition[];
    activeAgentIds: string[];
    
    // Skill 状态
    skills: SkillDefinition[];
    equippedSkills: Record<string, string[]>; // agentId -> skillIds
    
    // 编排状态
    currentScenario?: ScenarioPackage;
    executionResults: Record<string, any>;
    
    // UI 状态
    selectedAgentId?: string;
    selectedSkillId?: string;
    isExecuting: boolean;
}

class CapabilityStore {
    state = $state<CapabilityState>({
        agents: [],
        activeAgentIds: [],
        skills: [],
        equippedSkills: {},
        executionResults: {},
        isExecuting: false
    });

    constructor() {
        this.initialize();
    }

    private initialize() {
        // 加载内置 Agent
        this.state.agents = agentRegistry.getAll();
        
        // 设置默认 Agent
        this.state.activeAgentIds = this.state.agents
            .filter(a => a.isBuiltIn)
            .map(a => a.id);
        
        // 加载内置 Skill
        this.state.skills = skillRegistry.getAll();
        
        // 设置默认 Skill 装备
        for (const agent of this.state.agents) {
            this.state.equippedSkills[agent.id] = agent.defaultSkills || [];
        }
    }

    // ========== Agent 操作 ==========
    
    getAgent(id: string): AgentDefinition | undefined {
        return agentRegistry.getById(id);
    }

    getActiveAgents(): AgentDefinition[] {
        return this.state.agents.filter(a => 
            this.state.activeAgentIds.includes(a.id)
        );
    }

    toggleAgent(id: string) {
        const index = this.state.activeAgentIds.indexOf(id);
        if (index >= 0) {
            this.state.activeAgentIds = this.state.activeAgentIds.filter(aid => aid !== id);
        } else {
            this.state.activeAgentIds = [...this.state.activeAgentIds, id];
        }
    }

    setActiveAgents(ids: string[]) {
        this.state.activeAgentIds = ids;
    }

    // ========== Skill 操作 ==========
    
    getSkill(id: string): SkillDefinition | undefined {
        return skillRegistry.getById(id);
    }

    getSkillsForAgent(agentId: string): SkillDefinition[] {
        return skillRegistry.getByAgent(agentId);
    }

    getEquippedSkills(agentId: string): SkillDefinition[] {
        const skillIds = this.state.equippedSkills[agentId] || [];
        return skillIds.map(id => skillRegistry.getById(id)).filter(Boolean) as SkillDefinition[];
    }

    equipSkill(agentId: string, skillId: string) {
        if (!this.state.equippedSkills[agentId]) {
            this.state.equippedSkills[agentId] = [];
        }
        
        if (!this.state.equippedSkills[agentId].includes(skillId)) {
            this.state.equippedSkills[agentId] = [
                ...this.state.equippedSkills[agentId],
                skillId
            ];
        }
    }

    unequipSkill(agentId: string, skillId: string) {
        if (this.state.equippedSkills[agentId]) {
            this.state.equippedSkills[agentId] = 
                this.state.equippedSkills[agentId].filter(id => id !== skillId);
        }
    }

    // ========== 场景包操作 ==========
    
    getScenarios(): ScenarioPackage[] {
        return BUILT_IN_SCENARIOS;
    }

    applyScenario(scenarioId: string) {
        const scenario = BUILT_IN_SCENARIOS.find(s => s.id === scenarioId);
        if (!scenario) return false;
        
        this.state.currentScenario = scenario;
        
        // 应用推荐的 Agent 配置
        this.state.activeAgentIds = scenario.recommendedAgents;
        
        // 清除旧的 Skill 装备
        this.state.equippedSkills = {};
        
        // 应用推荐的 Skill 配置
        for (const agentId of scenario.recommendedAgents) {
            // 找到兼容的推荐 Skill
            const recommendedSkills = scenario.recommendedSkills.filter(skillId => {
                const skill = skillRegistry.getById(skillId);
                return skill?.compatibleAgents.includes(agentId);
            });
            
            this.state.equippedSkills[agentId] = recommendedSkills;
        }
        
        return true;
    }

    // ========== 编排执行 ==========
    
    async executeWithWorkflow(workflowId: string, userInput: string): Promise<any> {
        // TODO: 从存储的工作流中获取
        this.state.isExecuting = true;
        
        try {
            // 这里是一个简化的执行示例
            const results = await this.executeAgentChain(userInput);
            this.state.executionResults['last'] = results;
            return results;
        } finally {
            this.state.isExecuting = false;
        }
    }

    // 简化的 Agent 链式执行
    private async executeAgentChain(userInput: string): Promise<any[]> {
        const results: any[] = [];
        
        for (const agentId of this.state.activeAgentIds) {
            const agent = this.getAgent(agentId);
            if (!agent) continue;
            
            // 检查是否需要先执行 Skill
            const equippedSkills = this.getEquippedSkills(agentId);
            
            if (equippedSkills.length > 0) {
                // 先执行 Skill
                for (const skill of equippedSkills) {
                    const skillResult = await skillExecutor.execute({
                        skillId: skill.id,
                        userInput,
                        conversationHistory: results.map(r => r.content).join('\n')
                    });
                    
                    results.push({
                        type: 'skill',
                        skillId: skill.id,
                        content: skillResult.output
                    });
                    
                    // 将 Skill 输出作为 Agent 输入
                    userInput = skillResult.output;
                }
            }
            
            // 再执行 Agent
            const agentResult = await agentExecutor.execute({
                agentId,
                sessionId: crypto.randomUUID(),
                userInput,
                history: []
            });
            
            results.push({
                type: 'agent',
                agentId,
                content: agentResult.content
            });
            
            userInput = agentResult.content;
        }
        
        return results;
    }

    // ========== 配置导入/导出 ==========
    
    exportConfig(): string {
        return JSON.stringify({
            activeAgentIds: this.state.activeAgentIds,
            equippedSkills: this.state.equippedSkills,
            scenarioId: this.state.currentScenario?.id
        }, null, 2);
    }

    importConfig(json: string) {
        try {
            const config = JSON.parse(json);
            
            if (config.activeAgentIds) {
                this.state.activeAgentIds = config.activeAgentIds;
            }
            
            if (config.equippedSkills) {
                this.state.equippedSkills = config.equippedSkills;
            }
            
            if (config.scenarioId) {
                this.applyScenario(config.scenarioId);
            }
        } catch (e) {
            console.error('Config import failed:', e);
        }
    }

    // ========== UI 状态 ==========
    
    selectAgent(id: string | undefined) {
        this.state.selectedAgentId = id;
    }

    selectSkill(id: string | undefined) {
        this.state.selectedSkillId = id;
    }

    reset() {
        this.initialize();
        this.state.currentScenario = undefined;
        this.state.executionResults = {};
    }
}

export const capabilityStore = new CapabilityStore();
export default capabilityStore;
