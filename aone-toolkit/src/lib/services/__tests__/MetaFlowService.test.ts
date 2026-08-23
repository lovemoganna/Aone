import { describe, it, expect } from 'vitest';
import { MetaFlowService } from '../MetaFlowService';
import { agentExecutor } from '$lib/agents/executor';
import { settingsStore } from '$lib/stores/settingsStore.svelte';

describe('MetaFlowService & AgentExecutor Evidence Enforcement Tests', () => {

    it('should refuse to generate pseudo-mock intent JSON when AI provider is unconfigured', async () => {
        // Unconfigure settingsStore by clearing model selection
        settingsStore.setModel('');
        expect(settingsStore.isConfigured).toBe(false);

        let output = '';
        await MetaFlowService.streamAI(
            '用户输入：测试意图识别',
            (chunk) => { output += chunk; },
            () => {}
        );

        const parsed = JSON.parse(output);
        // Expect explicit unconfigured error notice, NOT fake intent JSON with confidence scores
        expect(parsed.error).toBe('AI_PROVIDER_UNCONFIGURED');
        expect(parsed.status).toBe('unconfigured');
        expect(parsed.configured).toBe(false);
        expect(parsed.message).toContain('[UNCONFIGURED]');
        expect(output).not.toContain('confidence": 0.98');
        expect(output).not.toContain('primaryIntent": "Build a comprehensive system');
    });

    it('should return unconfigured status in AgentExecutor when unconfigured instead of static persona template', async () => {
        settingsStore.setModel('');
        expect(settingsStore.isConfigured).toBe(false);

        const response = await agentExecutor.execute({
            agentId: 'decomposer',
            userInput: '半导体光刻胶厚度均匀性 (wafer_yield, exposure_dose) 分析',
            history: [],
            sessionId: 'test-session-1'
        });

        expect(response.finishReason).toBe('unconfigured');
        expect(response.content).toContain('[UNCONFIGURED]');
        expect(response.content).not.toContain('收到你的问题');
        expect(response.content).not.toContain('让我帮你拆解一下');
    });

    it('should handle JSON extraction safely without hiding parse failures or using fallback hardcoded regex', () => {
        const rawJson = '```json\n{"wafer_yield": 98.5, "exposure_dose": "25mJ/cm2"}\n```';
        const parsed = MetaFlowService.extractJSON(rawJson);
        
        expect(parsed).toEqual({ wafer_yield: 98.5, exposure_dose: "25mJ/cm2" });

        const invalidJson = 'Not a json response';
        const invalidParsed = MetaFlowService.extractJSON(invalidJson);
        expect(invalidParsed).toEqual({});
    });

    it('should successfully parse JSON containing raw unescaped control characters (newlines, tabs) inside string literals', () => {
        // Simulating the exact error: "Bad control character in string literal in JSON"
        const rawWithControlChars = `\`\`\`json
{
  "analysis": "Line 1 of analysis
Line 2 of analysis with	tabs",
  "strategy": [
    {
      "step": 1,
      "agent": "decomposer",
      "instruction": "Step 1:
Do structural decomposition"
    }
  ],
  "reasoning": "Reasoning line 1
Reasoning line 2",
}
\`\`\``;

        const parsed = MetaFlowService.extractJSON(rawWithControlChars);
        expect(parsed).toBeDefined();
        expect(parsed.analysis).toContain('Line 1 of analysis\nLine 2 of analysis');
        expect(parsed.strategy).toHaveLength(1);
        expect(parsed.strategy[0].agent).toBe('decomposer');
        expect(parsed.strategy[0].instruction).toContain('Step 1:\nDo structural decomposition');
    });

    it('should parse JSON arrays inside markdown blocks with trailing commas', () => {
        const arrayJson = `\`\`\`json
[
  { "id": 1, "name": "test1", },
  { "id": 2, "name": "test2", },
]
\`\`\``;
        const parsed = MetaFlowService.extractJSON(arrayJson);
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed).toHaveLength(2);
        expect(parsed[0].name).toBe('test1');
    });
});
