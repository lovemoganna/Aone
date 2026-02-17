import { AIBridge } from './AIBridge';
import { settingsStore } from '../stores/settingsStore.svelte';

export type PipelineStage = 'idle' | 'intent' | 'scene' | 'strategy' | 'decompose' | 'prompt' | 'execute' | 'aggregate';

export interface PipelineStatus {
    stage: PipelineStage;
    label: string;
    description: string;
    progress: number;
}

export class MetaFlowService {
    private static STAGES: Record<PipelineStage, { label: string; desc: string; progress: number }> = {
        idle: { label: 'Idle', desc: 'Ready to start', progress: 0 },
        intent: { label: 'Intent Analysis', desc: 'Understanding your goal...', progress: 15 },
        scene: { label: 'Scene Mapping', desc: 'Identifying execution context...', progress: 30 },
        strategy: { label: 'Strategy Governance', desc: 'Synthesizing strategy...', progress: 40 },
        decompose: { label: 'Task Decomposition', desc: 'Breaking down requirements...', progress: 45 },
        prompt: { label: 'Strategy Design', desc: 'Designing agent instructions...', progress: 60 },
        execute: { label: 'Agent Execution', desc: 'Generating results...', progress: 85 },
        aggregate: { label: 'Result Synthesis', desc: 'Finalizing output...', progress: 100 }
    };

    static getStageInfo(stage: PipelineStage) {
        return this.STAGES[stage];
    }

    /**
     * Extracts JSON from a string, handling potential Markdown blocks or surrounding text.
     */
    static extractJSON(text: string): any {
        if (!text) return {};

        try {
            // 1. Try to find content inside triple backticks (markdown code blocks)
            const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
            const rawContent = markdownMatch ? markdownMatch[1].trim() : text.trim();

            // 2. Try to find the first '{' and the last '}'
            const startIdx = rawContent.indexOf('{');
            const endIdx = rawContent.lastIndexOf('}');

            if (startIdx === -1 || endIdx === -1) {
                // Not a JSON object, maybe it's just raw text or a direct parse attempt
                return JSON.parse(rawContent);
            }

            const jsonStr = rawContent.substring(startIdx, endIdx + 1);
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error('Failed to parse JSON from AI response', e);
            // Last resort: try regex-based extraction of the largest braced block
            try {
                const retryMatch = text.match(/\{[\s\S]*\}/);
                if (retryMatch) return JSON.parse(retryMatch[0]);
            } catch (innerError) {
                console.error('Final JSON parse retry failed:', innerError);
            }
            return {};
        }
    }

    /**
     * Call AI using the configured provider via AIBridge.
     * Falls back to mock if provider is not configured.
     */
    /**
     * Call AI using the configured provider via AIBridge.
     * Falls back to mock if provider is not configured.
     */
    static async callAI(prompt: string, onChunk?: (chunk: string) => void, signal?: AbortSignal): Promise<string> {
        let fullResponse = "";
        await this.streamAI(
            prompt,
            (chunk) => {
                fullResponse += chunk;
                if (onChunk) onChunk(chunk);
            },
            () => { },
            signal
        );
        return fullResponse;
    }

    /**
     * Stream AI response with dedicated callbacks.
     */
    static async streamAI(
        prompt: string,
        onChunk: (chunk: string) => void,
        onComplete: () => void,
        signal?: AbortSignal
    ): Promise<void> {
        // If not configured, use mock fallback
        if (!settingsStore.isConfigured) {
            const mock = await this.mockCallAI(prompt);
            onChunk(mock);
            onComplete();
            return;
        }

        try {
            const options = settingsStore.getCallOptions({
                stream: true,
                onChunk,
                signal
            });
            await AIBridge.callAI(prompt, options);
            onComplete();
        } catch (e: any) {
            console.error('AI stream failed:', e);
            if (e.name === 'AbortError') throw e;
            const mock = await this.mockCallAI(prompt);
            onChunk(mock); // Fallback content
            onComplete();
        }
    }

    /**
     * Stage delay for rate-limit protection.
     */
    static async stageDelay(): Promise<void> {
        const delay = settingsStore.stageDelay * 1000;
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    /**
     * Mock fallback when no provider is configured.
     */
    private static async mockCallAI(prompt: string): Promise<string> {
        await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 800));

        if (prompt.includes('意图识别') || prompt.includes('intentRecognition')) {
            const input = prompt.match(/用户输入：(.*)/)?.[1] || prompt.match(/User input: (.*)/)?.[1] || 'Project goal';
            return JSON.stringify({
                primaryIntent: `Build a comprehensive system for: ${input}`,
                secondaryIntents: ['Ensure architecture quality', 'Optimize performance'],
                entities: ['System', 'Architecture', 'Performance'],
                constraints: ['Clean code', 'Linear-style UI'],
                expectedOutput: 'Integrated Svelte application'
            });
        }

        if (prompt.includes('场景分类') || prompt.includes('sceneMapping')) {
            return JSON.stringify({
                primaryScene: 'code_generation',
                confidence: 0.98,
                sceneDescription: 'Complex code implementation and architectural planning.',
                requiredCapabilities: ['TypeScript', 'Svelte 5', 'UI Design'],
                suggestedApproach: 'Modular construction with separation of concerns.'
            });
        }

        if (prompt.includes('任务规划') || prompt.includes('taskDecomposition')) {
            return JSON.stringify({
                taskPlan: { overview: 'Phased implementation of the requested system.', totalSteps: 3 },
                subtasks: [
                    { id: 1, name: 'Core Logic', description: 'Implement services and stores.', inputRequired: 'Requirements', outputExpected: 'TS files' },
                    { id: 2, name: 'UI Components', description: 'Build Svelte components.', inputRequired: 'Design', outputExpected: 'Svelte files' },
                    { id: 3, name: 'Integration', description: 'Connect UI to core.', inputRequired: 'Done items', outputExpected: 'Functional app' }
                ],
                executionStrategy: 'Sequential execution with verification gates.'
            });
        }

        if (prompt.includes('提示词工程') || prompt.includes('promptGeneration')) {
            return JSON.stringify({
                prompts: [
                    {
                        taskId: 1, taskName: 'Core Logic',
                        systemPrompt: 'You are a backend architect. Focus on clean code.',
                        userPrompt: 'Implement the requested core logic.',
                        outputFormat: 'Markdown code block',
                        qualityChecks: ['Linting', 'Types']
                    }
                ]
            });
        }

        return `## ✅ Task Completed\n\nStrategic orchestration finished.\n\n1. **Intent**: Successfully parsed the goal.\n2. **Execution**: Multi-agent consensus reached.\n3. **Outcome**: Module foundation established.\n\n> Use feedback controls to iterate.`;
    }
}
