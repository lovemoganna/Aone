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
     * Sanitizes control characters and common JSON flaws inside strings from AI responses.
     */
    static sanitizeJSONString(jsonStr: string): string {
        let result = '';
        let inString = false;
        let escaped = false;

        for (let i = 0; i < jsonStr.length; i++) {
            const char = jsonStr[i];
            const code = char.charCodeAt(0);

            if (!inString) {
                if (char === '"') {
                    inString = true;
                    result += char;
                } else {
                    result += char;
                }
            } else {
                if (escaped) {
                    escaped = false;
                    result += char;
                } else if (char === '\\') {
                    escaped = true;
                    result += char;
                } else if (char === '"') {
                    inString = false;
                    result += char;
                } else if (char === '\n') {
                    result += '\\n';
                } else if (char === '\r') {
                    result += '\\r';
                } else if (char === '\t') {
                    result += '\\t';
                } else if (code < 0x20) {
                    result += '\\u' + code.toString(16).padStart(4, '0');
                } else {
                    result += char;
                }
            }
        }

        // Strip trailing commas before closing braces/brackets
        return result.replace(/,\s*([}\]])/g, '$1');
    }

    /**
     * Extracts JSON from a string, handling potential Markdown blocks, surrounding text,
     * unescaped control characters in string literals, and trailing commas.
     */
    static extractJSON(text: string): any {
        if (!text || typeof text !== 'string') return {};

        try {
            // 1. Try to find content inside markdown code blocks
            const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
            const rawContent = (markdownMatch ? markdownMatch[1] : text).trim();

            // 2. Direct parse attempt
            try {
                return JSON.parse(rawContent);
            } catch {
                // Continue with extraction
            }

            // 3. Find boundaries for Object {...} or Array [...]
            const firstBrace = rawContent.indexOf('{');
            const lastBrace = rawContent.lastIndexOf('}');
            const firstBracket = rawContent.indexOf('[');
            const lastBracket = rawContent.lastIndexOf(']');

            let candidate = rawContent;

            const hasObject = firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace;
            const hasArray = firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket;

            if (hasObject && (!hasArray || firstBrace < firstBracket)) {
                candidate = rawContent.substring(firstBrace, lastBrace + 1);
            } else if (hasArray) {
                candidate = rawContent.substring(firstBracket, lastBracket + 1);
            }

            // 4. Try parsing extracted candidate
            try {
                return JSON.parse(candidate);
            } catch {
                // Continue with sanitized parse
            }

            // 5. Sanitize control characters and trailing commas
            const sanitized = this.sanitizeJSONString(candidate);
            return JSON.parse(sanitized);
        } catch (e) {
            // Last resort: try regex-based extraction of the largest braced/bracketed block with sanitation
            try {
                const retryMatch = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/);
                if (retryMatch) {
                    const sanitized = this.sanitizeJSONString(retryMatch[0]);
                    return JSON.parse(sanitized);
                }
            } catch (innerError) {
                console.warn('Final JSON parse retry failed:', innerError);
            }

            // Fallback: Check if text contains structured lines that can be mapped to a strategy
            const fallbackStrategy = this.fallbackTextToStrategy(text);
            if (fallbackStrategy && fallbackStrategy.length > 0) {
                return {
                    analysis: text.split('\n')[0] || '自然语言策略自动提取',
                    strategy: fallbackStrategy,
                    reasoning: '基于模型自然语言输出启发式提取'
                };
            }

            return {};
        }
    }

    /**
     * Heuristic fallback parser that turns natural language steps into structured strategy steps.
     */
    static fallbackTextToStrategy(text: string): Array<{ step: number; agent: string; skill?: string; instruction: string }> | null {
        if (!text || typeof text !== 'string') return null;

        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const steps: Array<{ step: number; agent: string; skill?: string; instruction: string }> = [];

        const agentAliasMap: Record<string, string> = {
            '拆局者': 'decomposer',
            'decomposer': 'decomposer',
            '算账的': 'calculator',
            'calculator': 'calculator',
            '探路者': 'pathfinder',
            'pathfinder': 'pathfinder',
            '泼冷水的': 'stress_tester',
            'stress_tester': 'stress_tester',
            '收网的': 'closer',
            'closer': 'closer'
        };

        const skillMap: Record<string, string> = {
            '拆解': 'decompose',
            '矩阵': 'decision_matrix',
            '决策': 'decision_matrix',
            '测试': 'stress_test',
            '风险': 'stress_test',
            '资源': 'resource_audit',
            '重构': 'reframe',
            '清单': 'action_list'
        };

        let stepCounter = 1;
        for (const line of lines) {
            // Match lines starting with digits (e.g., "1.", "1、", "步骤1", "- [拆局者]")
            const match = line.match(/^(?:(?:\d+[\.、\:\-\s]+)|(?:步骤\s*\d+[\:：\-\s]*)|(?:\-\s*\[?))([^\:：\-\—\s\n]+)[\:：\-\—\s]*(.*)$/);
            if (match) {
                const rawName = match[1].replace(/[\[\]\(\)]/g, '').trim();
                const rawInstruction = match[2].trim();

                let matchedAgent = 'closer';
                for (const [key, val] of Object.entries(agentAliasMap)) {
                    if (rawName.includes(key) || line.includes(key)) {
                        matchedAgent = val;
                        break;
                    }
                }

                let matchedSkill: string | undefined = undefined;
                for (const [sKey, sVal] of Object.entries(skillMap)) {
                    if (line.includes(sKey)) {
                        matchedSkill = sVal;
                        break;
                    }
                }

                if (rawInstruction.length > 0 || line.length > 5) {
                    steps.push({
                        step: stepCounter++,
                        agent: matchedAgent,
                        skill: matchedSkill,
                        instruction: rawInstruction || line
                    });
                }
            }
        }

        return steps.length > 0 ? steps : null;
    }

    /**
     * Call AI using the configured provider via AIBridge.
     * Falls back to mock if provider is not configured.
     */
    static async callAI(prompt: string, onChunk?: (chunk: string) => void, signal?: AbortSignal, timeoutMs = 60000): Promise<string> {
        let fullResponse = "";

        // When unconfigured, use sandbox simulator for realistic streaming demo
        if (!settingsStore.isConfigured) {
            await this.simulateSandboxStream(
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

        await this.streamAI(
            prompt,
            (chunk) => {
                fullResponse += chunk;
                if (onChunk) onChunk(chunk);
            },
            () => { },
            signal,
            timeoutMs
        );
        return fullResponse;
    }

    /**
     * Stream AI response with dedicated callbacks and timeout watchdog.
     */
    static async streamAI(
        prompt: string,
        onChunk: (chunk: string) => void,
        onComplete: () => void,
        signal?: AbortSignal,
        timeoutMs = 60000
    ): Promise<void> {
        if (!settingsStore.isConfigured) {
            const unconfiguredMsg = this.getUnconfiguredNotice();
            onChunk(unconfiguredMsg);
            onComplete();
            return;
        }

        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => {
            timeoutController.abort(new Error(`AI Request Timeout after ${timeoutMs / 1000}s`));
        }, timeoutMs);

        // Merge signal
        let activeSignal = timeoutController.signal;
        if (signal) {
            signal.addEventListener('abort', () => timeoutController.abort(signal.reason));
        }

        try {
            const options = settingsStore.getCallOptions({
                stream: true,
                onChunk,
                signal: activeSignal
            });
            await AIBridge.callAI(prompt, options);
            clearTimeout(timeoutId);
            onComplete();
        } catch (e: any) {
            clearTimeout(timeoutId);
            console.error('AI stream failed:', e);
            if (e.name === 'AbortError' || e.message?.includes('Timeout')) {
                const timeoutError = new Error(e.message?.includes('Timeout') ? e.message : 'AI request was aborted.');
                throw timeoutError;
            }
            const errorMsg = `[ERROR] AI Call Failed: ${e.message || 'Unknown network error'}. Please check model configuration.`;
            onChunk(errorMsg);
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
     * Realistic sandbox simulator for offline testing, demos, and visual pipeline verification.
     */
    static async simulateSandboxStream(
        prompt: string,
        onChunk: (chunk: string) => void,
        onComplete: () => void,
        signal?: AbortSignal
    ): Promise<void> {
        let mockResponse = "";
        if (prompt.includes("intentRecognition") || prompt.includes("意图") || prompt.includes("情绪")) {
            mockResponse = JSON.stringify({
                intent: "复杂目标拆解与决策权衡",
                emotion: "专注探索",
                keywords: ["规划", "落地", "方案"],
                urgency: "中高"
            });
        } else if (prompt.includes("sceneMapping") || prompt.includes("场景")) {
            mockResponse = JSON.stringify({
                scene: "多维权衡与行动清单场景",
                suggestedApproach: "拆解 ➔ 量化 ➔ 风控 ➔ 落地清单"
            });
        } else if (prompt.includes("strategy") || prompt.includes("Output JSON") || prompt.includes("Strategy Planning") || prompt.includes("总体策略")) {
            mockResponse = JSON.stringify({
                analysis: "针对您提出的复杂决策与业务诉求，需要从小队拆解、量化权衡、风险防范与落地执行四个维度展开协同。",
                strategy: [
                    { step: 1, agent: "decomposer", skill: "decompose", instruction: "将核心问题拆解为 3 个关键子命题与前提假设" },
                    { step: 2, agent: "calculator", skill: "decision_matrix", instruction: "建立多维度评分矩阵，对比不同方案的真实代价" },
                    { step: 3, agent: "stress_tester", skill: "stress_test", instruction: "针对最优方案进行极限压力测试与排雷" },
                    { step: 4, agent: "closer", skill: "action_list", instruction: "汇总推演结论并输出首周落地行动清单" }
                ],
                reasoning: "全能小队闭环：先拆解 -> 再算账 -> 后排雷 -> 最终收网"
            }, null, 2);
        } else if (prompt.includes("nextSpeakerSelection") || prompt.includes("nextAgentId")) {
            mockResponse = JSON.stringify({
                nextAgentId: "decomposer",
                skillId: "decompose",
                instruction: "继续深入拆解当前问题结构"
            });
        } else {
            mockResponse = `【实时协同推演结论】\n\n针对当前问题，经过深度推演分析：\n1. **核心认知**：把模糊的焦虑转化为可量化的具体指标；\n2. **关键行动**：优先锁定第一阶段的验证闭环，避免资源过度分散；\n3. **落地路径**：按照协同小队制定的清晰清单分步落地。`;
        }

        const chunks = mockResponse.split(/(.{12})/g).filter(Boolean);
        for (const chunk of chunks) {
            if (signal?.aborted) return;
            onChunk(chunk);
            await new Promise(r => setTimeout(r, 20));
        }
        onComplete();
    }

    /**
     * Explicit notice when no provider is configured, refusing to disguise as fake AI intelligence.
     */
    static getUnconfiguredNotice(): string {
        return JSON.stringify({
            error: 'AI_PROVIDER_UNCONFIGURED',
            status: 'unconfigured',
            message: '[UNCONFIGURED] AI Provider is not configured. Please set your API Key in Settings to execute real reasoning.',
            configured: false
        });
    }
}

