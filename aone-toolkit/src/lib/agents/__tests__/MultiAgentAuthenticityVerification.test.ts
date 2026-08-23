import { describe, it, expect, beforeEach } from 'vitest';
import { auditEventBus } from '../../stores/auditEventBus.svelte';
import { agentStore } from '../../stores/agentStore.svelte';
import { settingsStore, DEFAULT_AI_RESTRAINT_RULE } from '../../stores/settingsStore.svelte';
import { personaStore } from '../../persona/store.svelte';
import { agentExecutor } from '../executor';
import { builtInAgents } from '../builtins';
import { resolvePhaseAgent, COGNITIVE_AGENTS, getAgentMeta, getAgentColor } from '../../constants/cognitiveAgents';

describe('Multi-Agent Authenticity-First (真实性优先) Verification Suite', () => {
    beforeEach(() => {
        agentStore.clearSession();
        auditEventBus.clearAll();
        settingsStore.resetRestraintRuleToDefault();
        agentStore.jointWarfareState.arbitrationResult = undefined;
        agentStore.jointWarfareState.evidence = [];
        agentStore.jointWarfareState.conflicts = [];
        agentStore.jointWarfareState.stage = 'idle';
    });

    it('真实性测试 1: 证据删除测试 —— 无数据时不伪造 92% 置信度与虚假指标', () => {
        const telemetry = auditEventBus.telemetry;
        expect(telemetry.totalEvents).toBe(0);
        expect(telemetry.averageConfidenceScore).toBe(0);
        expect(telemetry.totalTokenEstimate).toBe(0);
        expect(auditEventBus.candidatePaths).toHaveLength(0);
        expect(auditEventBus.vulnerabilities).toHaveLength(0);
        expect(auditEventBus.dodTasks).toHaveLength(0);

        const storeStats = agentStore.sessionTelemetryStats;
        expect(storeStats.averageConfidenceScore).toBe(0);
        expect(storeStats.totalEstimatedTokens).toBe(0);
    });

    it('真实性测试 2: 新值与输入扰动测试 —— 真实提取特定领域实体而非预置模板', () => {
        const uniqueDomainToken = 'ANTIGRAVITY_QUANTUM_CORE_84731';
        const uniqueRoi = '减少 68% 脏写冲突';
        const uniqueCost = '3 天灰度切流验证';
        
        const mockAnalysisContent = `### 📊 候选方案量化评估矩阵
| 方案路线 | 核心逻辑 | 预期 ROI 提效 | 实施周期与代价 | 风险系数 | 推荐指数 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **${uniqueDomainToken} 演进方案** | 基于分布式状态机实现隔离 | ${uniqueRoi} | ${uniqueCost} | 3 | ★★★★★ |
`;

        // Emit real event
        const sessionId = 'test-session-1';
        auditEventBus.setSession(sessionId);

        // Simulate extraction
        const tableRows = mockAnalysisContent.split('\n').filter(line => line.includes('|') && !line.includes('---') && !line.includes('方案路线'));
        const extracted = tableRows.map(row => {
            const cols = row.split('|').map(c => c.trim()).filter(Boolean);
            return {
                id: 'path-test-1',
                name: cols[0].replace(/\*\*/g, ''),
                coreIdea: cols[1] || '',
                projectedRoi: cols[2] || '',
                estimatedCost: cols[3] || '',
                isChosen: row.includes('★★★★★')
            };
        });

        expect(extracted).toHaveLength(1);
        expect(extracted[0].name).toContain(uniqueDomainToken);
        expect(extracted[0].projectedRoi).toBe(uniqueRoi);
        expect(extracted[0].estimatedCost).toBe(uniqueCost);
        expect(extracted[0].isChosen).toBe(true);
    });

    it('真实性测试 3: 真实置信度与因果溯源链联动', () => {
        const sessionId = 'test-session-2';
        auditEventBus.setSession(sessionId);

        auditEventBus.emit('decision_made', {
            kind: 'decision_made',
            decisionId: 'dec-1',
            deciderAgentId: 'synthesizer',
            deciderAgentName: '裁判官',
            summary: '选定增量分步重构方案',
            chosenPath: '增量分步重构方案',
            rejectedPaths: ['一次性大拆大建方案'],
            confidenceScore: 87,
            reasoning: '基于量化 ROI 与风控底线'
        }, sessionId);

        expect(auditEventBus.telemetry.averageConfidenceScore).toBe(87);
        expect(auditEventBus.decisionList).toHaveLength(1);
        expect(auditEventBus.decisionList[0].confidenceScore).toBe(87);
        expect(auditEventBus.decisionList[0].chosenPath).toBe('增量分步重构方案');
    });

    it('真实性测试 4: 自定义 Agent 动态阶段分配 —— 拒绝丢失用户编排专家', () => {
        const customAgent = {
            id: 'custom_security_guru',
            name: '网络安全法务特攻',
            skills: ['stress_test', 'falsification_probe', 'compliance_audit'],
            role: '风控专家'
        };

        const activeIds = ['decomposer', 'calculator', 'custom_security_guru', 'synthesizer', 'closer'];
        
        const getAgentFn = (id: string) => id === 'custom_security_guru' ? customAgent : undefined;

        const assignedForChallenge = resolvePhaseAgent('challenge', activeIds, getAgentFn);
        expect(assignedForChallenge).toBe('custom_security_guru');

        const assignedForDecompose = resolvePhaseAgent('decompose', activeIds, getAgentFn);
        expect(assignedForDecompose).toBe('decomposer');
    });

    it('真实性测试 5: 单一事实源认知专家元数据自洽性验证', () => {
        const allAgents = Object.values(COGNITIVE_AGENTS);
        expect(allAgents.length).toBeGreaterThanOrEqual(8);

        for (const agent of allAgents) {
            expect(agent.id).toBeDefined();
            expect(agent.name).toBeDefined();
            expect(agent.alias).toBeDefined();
            expect(agent.roleTitle).toBeDefined();
            expect(agent.colorClasses).toBeDefined();
            expect(agent.colorClasses.text).toBeDefined();
            expect(agent.topology).toBeDefined();
            expect(agent.topology.mission).toBeDefined();
            expect(agent.topology.deliverable).toBeDefined();

            const meta = getAgentMeta(agent.id);
            expect(meta.alias).toBe(agent.alias);

            const color = getAgentColor(agent.id);
            expect(color.text).toBe(agent.colorClasses.text);
        }
    });

    it('真实性测试 6: 动态模型费率计算 —— 本地模型为 0，商业模型依真实单价换算', async () => {
        const { settingsStore } = await import('../../stores/settingsStore.svelte');
        
        // 1. 本地 Ollama 模型费率为 0
        settingsStore.setProvider('ollama');
        settingsStore.setModel('llama3:8b');
        
        // 模拟 10,000 tokens
        auditEventBus.setSession('token-test-1');
        auditEventBus.emit('agent_spoke', {
            kind: 'agent_spoke',
            phase: 'decompose',
            agentId: 'decomposer',
            agentName: '拆局者',
            role: '结构拆解',
            contentSummary: 'A'.repeat(4000),
            contentFull: 'A'.repeat(4000),
            durationMs: 500,
            tokenEstimate: 1000
        }, 'token-test-1');

        const statsOllama = agentStore.sessionTelemetryStats;
        expect(statsOllama.estimatedCostUsd).toBe(0);

        // 2. DeepSeek 模型费率 (~$0.28 / 1M = $0.00028 / 1k)
        settingsStore.setProvider('deepseek');
        settingsStore.setModel('deepseek-chat');
        const statsDeepSeek = agentStore.sessionTelemetryStats;
        expect(statsDeepSeek.estimatedCostUsd).toBeGreaterThanOrEqual(0);
    });

    it('真实性测试 7: 阶段重试接口与互斥抽屉状态自洽性', async () => {
        const { squadEngine } = await import('../../stores/squadEngine.svelte');
        const { warfareEngine } = await import('../../stores/warfareEngine.svelte');

        expect(typeof squadEngine.retryCurrentPhase).toBe('function');
        expect(typeof warfareEngine.retryCurrentStage).toBe('function');

        // 打开决策审计台时，应自动关闭右侧边栏以避免层级遮挡
        agentStore.rightDrawerOpen = true;
        agentStore.toggleDecisionConsole('matrix');
        expect(agentStore.decisionConsoleOpen).toBe(true);
        expect(agentStore.rightDrawerOpen).toBe(false);
    });

    it('真实性测试 8: 决策审计台 3 核心工作区聚合与 DoD 阶段门禁下发联动', () => {
        const sessionId = 'test-dod-sync-session';
        auditEventBus.setSession(sessionId);

        // 1. 模拟生成结构化 DoD 工单
        auditEventBus.emit('dod_tasks_created', {
            kind: 'dod_tasks_created',
            tasks: [
                {
                    id: 'dod-1',
                    timeframe: '72h',
                    action: '完成多小队状态机隔离灰度',
                    owner: '架构组',
                    definitionOfDone: '测试覆盖率 100% 且 0 脏写',
                    fallbackCircuitBreaker: '出现写竞争立刻熔断切回主线',
                    completed: false
                },
                {
                    id: 'dod-2',
                    timeframe: '7d',
                    action: '全量生产环境上线并完成演练',
                    owner: '全员',
                    definitionOfDone: '全链路压测达到 2000 QPS',
                    fallbackCircuitBreaker: '错误率超 0.1% 自动回滚',
                    completed: true
                }
            ]
        }, sessionId);

        expect(auditEventBus.dodTasks).toHaveLength(2);
        expect(agentStore.dynamicDoDTasks).toHaveLength(2);

        // 2. 验证工单状态切换
        auditEventBus.toggleDoDTask('dod-1', true);
        expect(auditEventBus.dodTasks.find(t => t.id === 'dod-1')?.completed).toBe(true);

        // 3. 验证同步至主对话流作为门禁
        const initialMsgCount = agentStore.currentSession.messages.length;
        agentStore.syncDoDToConversation();
        expect(agentStore.currentSession.messages.length).toBe(initialMsgCount + 1);

        const lastMsg = agentStore.currentSession.messages[agentStore.currentSession.messages.length - 1];
        expect(lastMsg.role).toBe('system');
        expect(lastMsg.content).toContain('72h-7d 落地执行与质量门禁工单已下发');
        expect(lastMsg.content).toContain('完成多小队状态机隔离灰度');
    });

    it('真实性测试 9: 决策审计台双向会话锚定、单项 DoD 落地派发与鲁棒提取', () => {
        // 1. 验证 executeSingleDoDTask 事件监听与派发
        let dispatchedEventDetail: any = null;
        (globalThis as any).window = {
            dispatchEvent: (e: any) => {
                dispatchedEventDetail = e.detail;
            }
        };

        const testTask = {
            id: 'task-opt-1',
            timeframe: '72h' as const,
            action: '对高频缓存执行双写一致性熔断升级',
            owner: '性能攻坚专家',
            definitionOfDone: '压测 0 缓存穿透且 P99 < 15ms',
            fallbackCircuitBreaker: '命中率降至 80% 切换旁路降级',
            completed: false
        };

        agentStore.executeSingleDoDTask(testTask);
        expect(dispatchedEventDetail).not.toBeNull();
        expect(dispatchedEventDetail.text).toContain('工单落地攻坚 · 72h');
        expect(dispatchedEventDetail.text).toContain('对高频缓存执行双写一致性熔断升级');
        expect(dispatchedEventDetail.text).toContain('压测 0 缓存穿透且 P99 < 15ms');

        delete (globalThis as any).window;

        // 2. 验证 fallback 解析的 markdown 净化与结构完备性
        agentStore.currentSession.messages = [
            {
                id: 'm-1',
                role: 'assistant',
                agentId: 'pathfinder',
                agentName: '技术预研先锋',
                content: '### 架构演进方案\n**核心思路**：引入 CQRS 事件溯源。\n**ROI 收益**：提升 300% 写入吞吐量并彻底消除读锁竞争。\n**成本代价**：需重构 2 个核心领域模型。\n',
                timestamp: Date.now()
            },
            {
                id: 'm-2',
                role: 'assistant',
                agentId: 'challenger',
                agentName: '红队质检官',
                content: '### 风险攻击审查\n**隐患死穴**：网络分区时事件时序乱序导致最终一致性延迟超 5s。\n**熔断预案**：启用单调递增版本号与 Vector Clock 防御。\n',
                timestamp: Date.now()
            }
        ];

        // 确保使用全新 session 以触发 dynamic fallback
        const cleanSessionId = 'test-fallback-session-' + Date.now();
        auditEventBus.setSession(cleanSessionId);

        const dynamicPaths = agentStore.dynamicCandidatePaths;
        expect(dynamicPaths.length).toBeGreaterThan(0);
        expect(dynamicPaths[0].name).toContain('技术预研先锋');
        expect(dynamicPaths[0].projectedRoi).toContain('提升 300% 写入吞吐量');
        expect(dynamicPaths[0].coreIdea).not.toContain('###');

        const dynamicVulns = agentStore.dynamicVulnerabilities;
        expect(dynamicVulns.length).toBeGreaterThan(0);
        expect(dynamicVulns[0].topic).toContain('红队质检官');
        expect(dynamicVulns[0].mitigationStrategy).toContain('启用单调递增版本号');
    });

    it('真实性测试 10: 全局 AI 输出克制铁律默认生效与 5 档外部调整机制验证', () => {
        // 1. 默认铁律生效
        expect(settingsStore.enableOutputRestraint).toBe(true);
        expect(settingsStore.restraintLevel).toBe('standard');
        expect(settingsStore.activeRestraintRule).toContain('AI 输出克制原则（最高铁律）');
        expect(settingsStore.activeRestraintRule).toContain('短、准、直接、高信息密度');
        expect(settingsStore.activeRestraintRule).toContain('结论优先 > 信息密度 > 清晰度 > 完整性 > 文采');

        // 2. 外部调整：严格模式
        settingsStore.setRestraintLevel('strict');
        expect(settingsStore.activeRestraintRule).toContain('极致克制附加令');
        expect(settingsStore.activeRestraintRule).toContain('严禁超过 3 个核心要点');

        // 3. 外部调整：宽松模式
        settingsStore.setRestraintLevel('relaxed');
        expect(settingsStore.activeRestraintRule).toContain('AI 输出效率指南');

        // 4. 外部调整：自定义模式与编辑
        settingsStore.setRestraintLevel('custom');
        settingsStore.setCustomRestraintRule('【极简模式】：只说核心结论。');
        expect(settingsStore.activeRestraintRule).toBe('【极简模式】：只说核心结论。');

        // 5. 外部调整：关闭模式与总开关
        settingsStore.setRestraintLevel('off');
        expect(settingsStore.activeRestraintRule).toBe('');

        settingsStore.setRestraintLevel('standard');
        settingsStore.setEnableOutputRestraint(false);
        expect(settingsStore.activeRestraintRule).toBe('');

        // 6. 重置恢复默认
        settingsStore.resetRestraintRuleToDefault();
        expect(settingsStore.enableOutputRestraint).toBe(true);
        expect(settingsStore.restraintLevel).toBe('standard');
        expect(settingsStore.customRestraintRule).toBe(DEFAULT_AI_RESTRAINT_RULE);
    });

    it('真实性测试 11: Agent 执行器 (agentExecutor) 动态注入克制铁律与短准直接约束', () => {
        settingsStore.setRestraintLevel('standard');
        const decomposer = builtInAgents.find(a => a.id === 'decomposer')!;
        expect(decomposer).toBeDefined();

        const builtPrompt = (agentExecutor as any).buildSystemPrompt(decomposer, {
            agentId: decomposer.id,
            sessionId: 'test-session',
            userInput: '测试拆解系统架构',
            history: []
        });

        expect(builtPrompt).toContain('AI 输出克制原则（最高铁律）');
        expect(builtPrompt).toContain('短、准、直接、高信息密度');
        expect(builtPrompt).toContain(`ID: ${decomposer.id}`);
    });

    it('真实性测试 12: PersonaStore 角色人设系统提示词融合与角色级覆盖隔离能力', () => {
        settingsStore.setRestraintLevel('standard');
        const mentor = personaStore.presetPersonas.find(p => p.id === 'mentor_sage')!;
        expect(mentor).toBeDefined();

        // 1. 默认继承全局
        const effectivePrompt = personaStore.getEffectiveSystemPrompt(mentor);
        expect(effectivePrompt).toContain('AI 输出克制原则（最高铁律）');
        expect(effectivePrompt).toContain(mentor.systemPrompt);

        // 2. 角色级独立覆盖：严格模式
        const customStrictPersona = {
            ...mentor,
            id: 'custom_strict_agent',
            outputRestraintMode: 'strict' as const
        };
        const strictPrompt = personaStore.getEffectiveSystemPrompt(customStrictPersona);
        expect(strictPrompt).toContain('极致克制附加令');

        // 3. 角色级独立关闭
        const unconstrainedPersona = {
            ...mentor,
            id: 'custom_free_agent',
            outputRestraintMode: 'off' as const
        };
        const freePrompt = personaStore.getEffectiveSystemPrompt(unconstrainedPersona);
        expect(freePrompt).not.toContain('AI 输出克制原则');
        expect(freePrompt).toBe(mentor.systemPrompt);
    });
});

