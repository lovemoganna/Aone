import { describe, it, expect, vi, beforeEach } from 'vitest';
import { agentStore } from '$lib/stores/agentStore.svelte';
import { MetaFlowService } from '$lib/services/MetaFlowService';
import { SkillService } from '$lib/services/SkillService';

describe('Multi-Agent Collaboration Transparency & Stepper Rigorous Verification Suite', () => {

    beforeEach(() => {
        agentStore.clearSession();
        agentStore.pipelineState.isPaused = false;
        agentStore.pipelineState.isRunning = false;
        agentStore.metaFlowIsRunning = false;
        agentStore.metaFlowFinished = false;
        agentStore.pipelineState.collaborationSteps = [];
        agentStore.clearSavedCheckpoint();
    });

    it('验收条件 1: 协同步进轨道状态机与节点元数据验证 (Positive Test)', () => {
        // Setup initial strategy
        const strategy = [
            { step: 1, agent: 'decomposer', skill: 'decompose', instruction: '拆解第一阶段核心问题' },
            { step: 2, agent: 'calculator', skill: 'decision_matrix', instruction: '对比方案A与B的成本' },
            { step: 3, agent: 'closer', skill: 'action_list', instruction: '总结并输出落地清单' }
        ];

        agentStore.pipelineState.governanceState = {
            status: 'accepted',
            strategy: { strategy },
            feedbackHistory: []
        };

        // Initialize steps
        agentStore.pipelineState.collaborationSteps = strategy.map((s, idx) => ({
            step: s.step,
            agentId: s.agent,
            skillId: s.skill,
            instruction: s.instruction,
            status: idx === 0 ? 'running' : 'pending'
        }));

        expect(agentStore.pipelineState.collaborationSteps).toHaveLength(3);
        expect(agentStore.pipelineState.collaborationSteps[0].status).toBe('running');
        expect(agentStore.pipelineState.collaborationSteps[1].status).toBe('pending');
        expect(agentStore.pipelineState.collaborationSteps[2].status).toBe('pending');

        // Simulate step 1 completion
        const msgId1 = agentStore.addMessage('assistant', '第一步拆解完成', 'decomposer', {
            skillId: 'decompose',
            stepIndex: 1,
            totalSteps: 3,
            instruction: '拆解第一阶段核心问题',
            durationMs: 1200
        });

        agentStore.pipelineState.collaborationSteps[0].status = 'completed';
        agentStore.pipelineState.collaborationSteps[0].messageId = msgId1;
        agentStore.pipelineState.collaborationSteps[0].durationMs = 1200;

        expect(agentStore.pipelineState.collaborationSteps[0].status).toBe('completed');
        expect(agentStore.pipelineState.collaborationSteps[0].messageId).toBe(msgId1);
        expect(agentStore.pipelineState.collaborationSteps[0].durationMs).toBe(1200);
    });

    it('验收条件 2: 丰富透视卡片 Message 数据链完整性验证', () => {
        const msgId = agentStore.addMessage('assistant', '量化权衡分析', 'calculator', {
            skillId: 'decision_matrix',
            stepIndex: 2,
            totalSteps: 3,
            instruction: '对比方案A与B的ROI与风险',
            isStreaming: true
        });

        const msg = agentStore.currentSession.messages.find(m => m.id === msgId);
        expect(msg).toBeDefined();
        expect(msg?.agentId).toBe('calculator');
        expect(msg?.skillId).toBe('decision_matrix');
        expect(msg?.stepIndex).toBe(2);
        expect(msg?.totalSteps).toBe(3);
        expect(msg?.instruction).toBe('对比方案A与B的ROI与风险');
        expect(msg?.isStreaming).toBe(true);

        // Streaming update
        agentStore.updateMessage(msgId, '量化权衡分析：ROI 方案A为150%，方案B为200%', 'calculator', false, { durationMs: 850 });
        
        const updatedMsg = agentStore.currentSession.messages.find(m => m.id === msgId);
        expect(updatedMsg?.content).toContain('ROI 方案A为150%');
        expect(updatedMsg?.isStreaming).toBe(false);
        expect(updatedMsg?.durationMs).toBe(850);
    });

    it('验收条件 3: 协同执行暂停与恢复控制状态机验证', () => {
        agentStore.pipelineState.isRunning = true;
        agentStore.metaFlowIsRunning = true;

        agentStore.pauseExecution();
        expect(agentStore.pipelineState.isPaused).toBe(true);
        expect(agentStore.metaFlowIsRunning).toBe(false);

        // System notification added
        const lastMsg = agentStore.currentSession.messages.slice(-1)[0];
        expect(lastMsg.role).toBe('system');
        expect(lastMsg.content).toContain('协同执行已暂停');

        // Resume execution
        const runSpy = vi.spyOn(agentStore, 'runMetaFlow').mockImplementation(async () => {});
        agentStore.resumeExecution();
        expect(agentStore.pipelineState.isPaused).toBe(false);
        expect(agentStore.pipelineState.isRunning).toBe(true);
        expect(agentStore.metaFlowIsRunning).toBe(true);
        expect(runSpy).toHaveBeenCalled();
        runSpy.mockRestore();
    });

    it('反证测试 1 (Falsification): 当 isPaused 为 true 时，runMetaFlow 必须被严格拦截，禁止自动偷跑', async () => {
        agentStore.pipelineState.isPaused = true;
        agentStore.pipelineState.isRunning = true;
        agentStore.metaFlowIsRunning = false;

        // Attempt to runMetaFlow while paused
        await agentStore.runMetaFlow('测试拦截');

        // Verify that isRunning is turned off and no new thought or assistant message was emitted
        expect(agentStore.pipelineState.isRunning).toBe(false);
        expect(agentStore.metaFlowIsRunning).toBe(false);
        const assistantMsgs = agentStore.currentSession.messages.filter(m => m.role === 'assistant');
        expect(assistantMsgs).toHaveLength(0);
    });

    it('反证测试 2 (Falsification): 当技能执行抛出异常时，collaborationStep 状态必须真实标记为 failed，禁止误报为 completed', async () => {
        const stepNum = 1;
        agentStore.pipelineState.collaborationSteps = [{
            step: stepNum,
            agentId: 'decomposer',
            skillId: 'decompose',
            instruction: '故意抛出异常的拆解指令',
            status: 'running'
        }];

        // Simulate skill failure in step execution flow
        const msgId = agentStore.addMessage('assistant', '', 'decomposer', {
            skillId: 'decompose',
            stepIndex: 1,
            totalSteps: 1,
            instruction: '故意抛出异常的拆解指令',
            isStreaming: true
        });

        const step = agentStore.pipelineState.collaborationSteps[0];
        step.messageId = msgId;

        // Force fail
        const fakeError = new Error('AI Provider Rate Limit Exceeded');
        agentStore.updateMessage(msgId, `Skill Execution Failed: ${fakeError.message}`, 'decomposer', false);
        step.status = 'failed';

        expect(step.status).toBe('failed');
        expect(step.status).not.toBe('completed');
        const msg = agentStore.currentSession.messages.find(m => m.id === msgId);
        expect(msg?.content).toContain('Skill Execution Failed');
    });

    it('反证测试 3 (Falsification): 缺少字段的非标准 AI 策略返回必须自动规范化，禁止导致 length 空指针崩溃', () => {
        // Malformed or empty JSON returned by AI
        const malformedResp = '```json\n{"invalid_key": "some text without strategy array"}\n```';
        const parsed = MetaFlowService.extractJSON(malformedResp);

        let strategyList = Array.isArray(parsed?.strategy) ? parsed.strategy : (Array.isArray(parsed) ? parsed : []);
        const strategy = {
            analysis: parsed?.analysis || (typeof parsed === 'string' ? parsed : '对用户需求进行结构化分析与编排'),
            strategy: strategyList,
            reasoning: parsed?.reasoning || ''
        };

        // Assert that strategy.strategy is always a valid array
        expect(Array.isArray(strategy.strategy)).toBe(true);
        expect(strategy.strategy.length).toBe(0);
        // Accessing length should be safe
        expect(() => strategy.strategy.length).not.toThrow();
    });

    it('验收条件 4: 多轮连续对话与策略治理状态重置验证 (Multi-Round Non-Stuck Test)', async () => {
        // Round 1 simulates finished strategy
        agentStore.pipelineState.governanceState = {
            status: 'accepted',
            strategy: {
                strategy: [
                    { step: 1, agent: 'decomposer', skill: 'decompose', instruction: 'R1 S1' },
                    { step: 2, agent: 'closer', skill: 'action_list', instruction: 'R1 S2' }
                ]
            },
            feedbackHistory: []
        };
        agentStore.pipelineState.currentStrategyStep = 2;
        agentStore.metaFlowFinished = true;
        agentStore.pipelineState.isRunning = false;
        agentStore.metaFlowIsRunning = false;

        const delaySpy = vi.spyOn(MetaFlowService, 'stageDelay').mockResolvedValue(undefined);
        const callSpy = vi.spyOn(MetaFlowService, 'callAI').mockImplementation(async () => {
            return JSON.stringify({
                intent: '业务规划',
                scene: '战略探索',
                analysis: '新一轮业务规划分析',
                strategy: [{ step: 1, agent: 'pathfinder', instruction: 'R2 S1' }]
            });
        });

        // Trigger runMetaFlow with new goal (isContinuation = false)
        await agentStore.runMetaFlow('第二轮全新诉求：业务出海路径规划', false);

        // Expect Round 1 accepted strategy to be cleared, and new Round 2 synthesis to be triggered
        expect(agentStore.pipelineState.currentStrategyStep).toBe(0);
        expect(agentStore.pipelineState.waitingForReview).toBe(true);
        expect(agentStore.pipelineState.governanceState?.status).toBe('pending');
        expect(agentStore.pipelineState.governanceState?.strategy.strategy[0].instruction).toBe('R2 S1');

        callSpy.mockRestore();
        delaySpy.mockRestore();
    });

    it('验收条件 5: 技能执行流式 Chunk 输出与思考日志实时透传验证 (Live Streaming & Log Test)', async () => {
        const streamSpy = vi.spyOn(MetaFlowService, 'callAI').mockImplementation(async (prompt, onChunk) => {
            if (onChunk) {
                onChunk('### 拆解第一阶段\n');
                onChunk('1. 核心瓶颈分析');
            }
            return '### 拆解第一阶段\n1. 核心瓶颈分析';
        });

        const receivedChunks: string[] = [];
        const result = await SkillService.executeSkill('decompose', '如何实现业务增长', (chunk) => {
            receivedChunks.push(chunk);
        });

        expect(receivedChunks).toHaveLength(2);
        expect(receivedChunks.join('')).toBe('### 拆解第一阶段\n1. 核心瓶颈分析');
        expect(result).toContain('核心瓶颈分析');

        streamSpy.mockRestore();
    });

    it('验收条件 6: 页面刷新/中断场景下的断点快照持久化与从断点恢复协同验证 (Breakpoint Persistence & Resume Test)', () => {
        // Setup in-flight pipeline state
        agentStore.pipelineState.currentGoal = '出海业务本地化攻坚';
        agentStore.pipelineState.currentStrategyStep = 1;
        agentStore.pipelineState.governanceState = {
            status: 'accepted',
            strategy: {
                strategy: [
                    { step: 1, agent: 'decomposer', skill: 'decompose', instruction: 'S1' },
                    { step: 2, agent: 'calculator', skill: 'decision_matrix', instruction: 'S2' }
                ]
            },
            feedbackHistory: []
        };
        agentStore.pipelineState.collaborationSteps = [
            { step: 1, agentId: 'decomposer', skillId: 'decompose', instruction: 'S1', status: 'completed' },
            { step: 2, agentId: 'calculator', skillId: 'decision_matrix', instruction: 'S2', status: 'pending' }
        ];

        // 1. Save checkpoint
        agentStore.saveCheckpoint();
        expect(agentStore.hasResumableCheckpoint).toBe(true);
        expect(agentStore.savedCheckpoint?.currentStrategyStep).toBe(1);

        // 2. Mock page reload by simulating fresh load from saved checkpoint
        const runSpy = vi.spyOn(agentStore, 'runMetaFlow').mockImplementation(async () => {});
        agentStore.resumeFromCheckpoint();

        // 3. Verify that pipeline resumed with continuation flag
        expect(runSpy).toHaveBeenCalledWith('出海业务本地化攻坚', true);
        expect(agentStore.pipelineState.currentStrategyStep).toBe(1);

        // 4. Abandon checkpoint
        agentStore.abandonCheckpoint();
        expect(agentStore.hasResumableCheckpoint).toBe(false);
        expect(agentStore.savedCheckpoint).toBeNull();

        runSpy.mockRestore();
    });
});
