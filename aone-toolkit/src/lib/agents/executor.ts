/**
 * Agent 模块 - Agent 执行器
 * 负责 Agent 的实际执行和 AI 调用
 */

import type { 
    AgentDefinition, 
    AgentExecutionContext, 
    AgentResponse,
    IAgentExecutor 
} from './types';
import { agentRegistry } from './registry';
import { settingsStore } from '$lib/stores/settingsStore.svelte';
import { AIBridge } from '$lib/services/AIBridge';

class AgentExecutor implements IAgentExecutor {
    private activeExecutions: Map<string, AbortController> = new Map();

    async execute(context: AgentExecutionContext): Promise<AgentResponse> {
        const agent = agentRegistry.getById(context.agentId);
        if (!agent) {
            throw new Error(`Agent not found: ${context.agentId}`);
        }

        const controller = new AbortController();
        this.activeExecutions.set(context.sessionId, controller);

        try {
            const systemPrompt = this.buildSystemPrompt(agent, context);
            const userPrompt = this.buildUserPrompt(context);

            const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

            if (!settingsStore.isConfigured) {
                return {
                    agentId: agent.id,
                    content: `[UNCONFIGURED] AI Provider is not configured for Agent ${agent.name} (${agent.id}). Please configure API Key to enable active LLM reasoning.`,
                    finishReason: 'unconfigured'
                };
            }

            const options = settingsStore.getCallOptions({
                signal: controller.signal
            });

            const result = await AIBridge.callAI(fullPrompt, options);

            return {
                agentId: agent.id,
                content: result,
                finishReason: 'completed'
            };

        } catch (error: any) {
            if (error.name === 'AbortError') {
                return {
                    agentId: agent.id,
                    content: '',
                    finishReason: 'cancelled'
                };
            }
            
            throw error;

        } finally {
            this.activeExecutions.delete(context.sessionId);
        }
    }

    async streamExecute(
        context: AgentExecutionContext, 
        onChunk: (chunk: string) => void
    ): Promise<AgentResponse> {
        const agent = agentRegistry.getById(context.agentId);
        if (!agent) {
            throw new Error(`Agent not found: ${context.agentId}`);
        }

        const controller = new AbortController();
        this.activeExecutions.set(context.sessionId, controller);

        try {
            const systemPrompt = this.buildSystemPrompt(agent, context);
            const userPrompt = this.buildUserPrompt(context);

            const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
            let accumulated = '';

            if (!settingsStore.isConfigured) {
                const unconfiguredMsg = `[UNCONFIGURED] AI Provider is not configured for Agent ${agent.name} (${agent.id}). Please configure API Key to enable active LLM reasoning.`;
                onChunk(unconfiguredMsg);
                return {
                    agentId: agent.id,
                    content: unconfiguredMsg,
                    finishReason: 'unconfigured'
                };
            }

            const options = settingsStore.getCallOptions({
                stream: true,
                onChunk: (chunk: string) => {
                    accumulated += chunk;
                    onChunk(chunk);
                },
                signal: controller.signal
            });

            const result = await AIBridge.callAI(fullPrompt, options);

            return {
                agentId: agent.id,
                content: result || accumulated,
                finishReason: 'completed'
            };

        } catch (error: any) {
            if (error.name === 'AbortError') {
                return {
                    agentId: agent.id,
                    content: '',
                    finishReason: 'cancelled'
                };
            }
            throw error;
        } finally {
            this.activeExecutions.delete(context.sessionId);
        }
    }

    cancel(executionId: string): void {
        const controller = this.activeExecutions.get(executionId);
        if (controller) {
            controller.abort();
            this.activeExecutions.delete(executionId);
        }
    }

    private buildSystemPrompt(agent: AgentDefinition, context: AgentExecutionContext): string {
        const restraintRule = settingsStore.activeRestraintRule;
        let prompt = `${restraintRule ? `${restraintRule}\n\n==================================================\n` : ''}ID: ${agent.id}
名称: ${agent.name}
思维模式: ${agent.perspective}
一句话: "${agent.oneLiner}"

核心认知框架:
${agent.coreBelief}

对话风格:
${agent.dialogueStyle}

`;

        if (agent.forbidden.length > 0) {
            prompt += `禁止行为:
${agent.forbidden.map(f => `- ${f}`).join('\n')}
`;
        }

        // 添加历史上下文
        if (context.history.length > 0) {
            prompt += `
对话历史:
${context.history.map(m => `${m.role === 'user' ? '用户' : agent.name}: ${m.content}`).join('\n')}
`;
        }

        return prompt;
    }

    private buildUserPrompt(context: AgentExecutionContext): string {
        return `用户输入: ${context.userInput}

请根据你的思维模式和认知框架，帮助用户分析和解决问题。`;
    }
}

export const agentExecutor = new AgentExecutor();
export default agentExecutor;

