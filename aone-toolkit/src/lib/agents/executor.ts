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
                // Mock 响应
                await this.delay(500 + Math.random() * 1000);
                return {
                    agentId: agent.id,
                    content: this.generateMockResponse(agent, context.userInput),
                    finishReason: 'completed'
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
                // Mock 流式响应
                const mockChunks = this.generateMockChunks(agent, context.userInput);
                for (const chunk of mockChunks) {
                    if (controller.signal.aborted) break;
                    await this.delay(100);
                    onChunk(chunk);
                    accumulated += chunk;
                }
                
                return {
                    agentId: agent.id,
                    content: accumulated,
                    finishReason: 'completed'
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
        let prompt = `ID: ${agent.id}
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

    private generateMockResponse(agent: AgentDefinition, userInput: string): string {
        const responses: Record<string, string> = {
            decomposer: `收到你的问题："${userInput}"

让我帮你拆解一下：

从你的描述中，我注意到这可能涉及几个方面：
1. 问题的核心是什么
2. 目前的阻碍在哪里
3. 你已经尝试过什么

能再多说一些具体的情况吗？比如最让你困扰的是哪一点？`,

            calculator: `收到你的问题："${userInput}"

让我们来算一笔账。

要做出好的决策，我们需要先明确：
1. 你目前有哪些选项？
2. 每个选项你最看重什么？（金钱、时间、风险、成长...）
3. 你愿意为每个选项付出什么代价？

说说你的具体情况，我们一起来量化分析。`,

            pathfinder: `收到你的问题："${userInput}"

我听到你觉得自己可能被困住了。

其实大多数时候，所谓的"没选择"只是因为我们只看到了眼前的一两条路。让我帮你找找看还有没有其他的可能性。

你愿意说说：
1. 你现在面临的选项是什么？
2. 你觉得最限制你的是什么？

我们一起想办法。`,

            stress_tester: `收到你的问题："${userInput}"

听起来你有些担心和顾虑。

让我们来推演一下你最害怕的情况。把你最担心的是什么说出来，我们看看：
1. 最坏的情况是什么？
2. 发生的概率有多大？
3. 你手里有什么牌可以打？

不用怕，我们只是分析。`,

            closer: `收到你的问题："${userInput}"

好的，我们今天就到这里。

根据我们聊的内容，你现在可以做的是：

🔴 今天（立刻做）：
1. [具体动作] - 约 X 分钟

🟡 这周：
2. [具体动作]

记住：想都是问题，做才是答案。现在就可以开始第一步。`
        };

        return responses[agent.id] || responses.decomposer;
    }

    private generateMockChunks(agent: AgentDefinition, userInput: string): string[] {
        const fullResponse = this.generateMockResponse(agent, userInput);
        // 简单分词
        return fullResponse.split(/(?=[，。！？])/);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export const agentExecutor = new AgentExecutor();
export default agentExecutor;
