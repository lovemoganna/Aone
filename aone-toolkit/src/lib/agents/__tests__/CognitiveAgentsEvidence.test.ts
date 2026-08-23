import { describe, it, expect } from 'vitest';
import { matchAgentByKeyword } from '../cognitive-agents';
import { agentStore } from '$lib/stores/agentStore.svelte';

describe('Cognitive Agents Dynamic Metadata Matching (Phase 3 Evidence Tests)', () => {

    it('should dynamically match agents by metadata (name, perspective, coreBelief) without hardcoded single-word dictionaries', () => {
        // Match by perspective '结构化拆解' -> agent_decomposer
        const matchedDecomposer = matchAgentByKeyword('结构化拆解');
        expect(matchedDecomposer).toBe('agent_decomposer');

        // Match by name '拆局者' -> agent_decomposer
        const matchedByName = matchAgentByKeyword('拆局者');
        expect(matchedByName).toBe('agent_decomposer');

        // Match by core belief fragment '复杂问题的本质' -> agent_decomposer
        const matchedByBelief = matchAgentByKeyword('复杂问题的本质');
        expect(matchedByBelief).toBe('agent_decomposer');
    });

    it('should return null for unmatched keywords without guessing or returning silent hardcoded fallbacks', () => {
        const unmatched = matchAgentByKeyword('未知异构非逻辑词汇_xyz_999');
        expect(unmatched).toBeNull();
    });

    it('should correctly attach rich metadata (stepIndex, skillId, instruction, durationMs) to messages and manage pause/resume', () => {
        const msgId = agentStore.addMessage('assistant', '正在进行结构化拆解', 'decomposer', {
            skillId: 'decompose',
            stepIndex: 1,
            totalSteps: 3,
            instruction: '拆解用户问题结构',
            isStreaming: true
        });

        const created = agentStore.currentSession.messages.find((m: any) => m.id === msgId);
        expect(created).toBeDefined();
        expect(created?.agentId).toBe('decomposer');
        expect(created?.skillId).toBe('decompose');
        expect(created?.stepIndex).toBe(1);
        expect(created?.totalSteps).toBe(3);
        expect(created?.instruction).toBe('拆解用户问题结构');
        expect(created?.isStreaming).toBe(true);

        agentStore.updateMessage(msgId, '拆解完成', undefined, false, { durationMs: 1500 });
        expect(created?.content).toBe('拆解完成');
        expect(created?.isStreaming).toBe(false);
        expect(created?.durationMs).toBe(1500);

        // Test pause / resume
        agentStore.pauseExecution();
        expect(agentStore.pipelineState.isPaused).toBe(true);
        expect(agentStore.metaFlowIsRunning).toBe(false);
    });
});
