/**
 * warfareEngine.svelte.ts
 *
 * Multi-Squad Joint Warfare (Adversarial Debate) Engine.
 * Orchestrates structured adversarial debate between two squads with
 * persona injection, robust JSON parsing, user intervention checkpoints,
 * cumulative overtime rounds, and supreme arbitration.
 */

import { auditEventBus, type ExecutableDoDTask, type ExtractedCandidatePath, type ExtractedVulnerability } from '$lib/stores/auditEventBus.svelte';
import { WARFARE_STAGES, type WarfareStage, getAgentDisplayName, estimateTokenCount } from '$lib/constants/agentConstants';
import { MetaFlowService } from '$lib/services/MetaFlowService';
import { AIBridge } from '$lib/services/AIBridge';
import { settingsStore } from '$lib/stores/settingsStore.svelte';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface WarfareSquad {
    id: string;
    name: string;
    memberIds: string[];
    stance: 'offensive' | 'defensive';
    output: string;
    isRunning: boolean;
}

export interface WarfareConflict {
    id: string;
    topic: string;
    sideAView: string;
    sideBView: string;
    tradeOff: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface WarfareEvidence {
    id: string;
    fact: string;
    benchmark: string;
    source: string;
    impact: string;
}

export interface ArbitrationResult {
    summary: string;
    confidenceScore: number;
    chosenPath: string;
    tradeOffAnalysis: string;
    rejectedHypotheses: string[];
    actionSteps: string[];
}

export interface WarfareState {
    isActive: boolean;
    sessionId: string;
    goal: string;
    stage: WarfareStage | 'idle';
    progress: number;
    squadA: WarfareSquad;
    squadB: WarfareSquad;
    crossReview: {
        critiqueAonB: string;
        critiqueBonA: string;
    };
    conflicts: WarfareConflict[];
    evidence: WarfareEvidence[];
    arbitrationResult: ArbitrationResult | null;
    overtimeRounds: number;
    isRunning: boolean;
    isPaused: boolean;
    awaitingUserInput: boolean;
    error: string | null;
}

// ─── Callback Types ─────────────────────────────────────────────────────────

type AddMessageFn = (role: 'user' | 'assistant' | 'system' | 'thought', content: string, agentId?: string, options?: any) => string;
type GetAgentFn = (id: string) => any;

// ─── Engine ─────────────────────────────────────────────────────────────────

function createWarfareEngine() {
    let state = $state<WarfareState>({
        isActive: false,
        sessionId: '',
        goal: '',
        stage: 'idle',
        progress: 0,
        squadA: { id: 'squad_A', name: '蓝军方案提案组', memberIds: ['pathfinder', 'calculator', 'closer'], stance: 'offensive', output: '', isRunning: false },
        squadB: { id: 'squad_B', name: '红军极限审查组', memberIds: ['challenger', 'stress_tester', 'evidence_scout'], stance: 'defensive', output: '', isRunning: false },
        crossReview: { critiqueAonB: '', critiqueBonA: '' },
        conflicts: [],
        evidence: [],
        arbitrationResult: null,
        overtimeRounds: 0,
        isRunning: false,
        isPaused: false,
        awaitingUserInput: false,
        error: null,
    });

    let abortController: AbortController | null = null;
    let pendingResolveFn: ((action: 'continue' | 'overtime' | 'cancel') => void) | null = null;
    let pendingInterventions: Array<{ type: string; content: string }> = [];
    let _addMessageFn: AddMessageFn | null = null;
    let _getAgentFn: GetAgentFn | null = null;

    // ─── Helpers ────────────────────────────────────────────────────────

    function transitionStage(toStage: WarfareStage, fromStage?: string) {
        const stageInfo = WARFARE_STAGES.find(s => s.id === toStage);
        state.stage = toStage;
        state.progress = stageInfo?.progress ?? 0;

        auditEventBus.emit('phase_transition', {
            kind: 'phase_transition',
            fromPhase: fromStage ?? null,
            toPhase: toStage,
            phaseLabel: stageInfo?.label ?? toStage,
            engineMode: 'warfare',
            progress: state.progress,
        }, state.sessionId);
    }

    function emitAgentSpoke(agentId: string, content: string, phase: string, startTime: number) {
        const elapsed = Date.now() - startTime;
        auditEventBus.emit('agent_spoke', {
            kind: 'agent_spoke',
            agentId,
            agentName: getAgentDisplayName(agentId, agentId),
            role: state.squadA.memberIds.includes(agentId) ? '蓝军攻坚' : '红军风控',
            phase,
            contentSummary: content.slice(0, 160).replace(/\n/g, ' '),
            contentFull: content,
            durationMs: elapsed,
            tokenEstimate: estimateTokenCount(content),
        }, state.sessionId);
    }

    async function callAI(prompt: string, signal?: AbortSignal): Promise<string> {
        if (!settingsStore.isConfigured) {
            throw new Error('AI 服务未配置。请在设置中配置 API Key 后重试。');
        }
        try {
            const options = settingsStore.getCallOptions({ signal });
            return await AIBridge.callAI(prompt, options);
        } catch (err: any) {
            if (err.name === 'AbortError') throw err;
            throw new Error(`AI 调用失败: ${err?.message || '请检查 API 配置或网络连接'}`);
        }
    }

    async function callAIStreaming(prompt: string, onChunk: (accumulated: string) => void, signal?: AbortSignal): Promise<string> {
        if (!settingsStore.isConfigured) {
            throw new Error('AI 服务未配置。请在设置中配置 API Key 后重试。');
        }
        try {
            let accumulated = '';
            const result = await MetaFlowService.callAI(
                prompt,
                (chunk) => {
                    accumulated += chunk;
                    onChunk(accumulated);
                },
                signal
            );
            return result || accumulated;
        } catch (err: any) {
            if (err.name === 'AbortError') throw err;
            throw new Error(`AI 调用失败: ${err?.message || '请检查 API 配置或网络连接'}`);
        }
    }

    /**
     * 强化级 JSON 解析器：支持 Markdown 代码块剥离、正则匹配提取、常见语法自愈与类型安全兜底
     */
    function parseJSON<T>(raw: string, fallback: T): T {
        if (!raw || typeof raw !== 'string') return fallback;

        // Tier 1: Clean standard markdown wrappers
        let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        try {
            return JSON.parse(cleaned);
        } catch {}

        // Tier 2: Extract first balanced JSON array or object
        try {
            const arrayMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (arrayMatch) return JSON.parse(arrayMatch[0]);

            const objectMatch = raw.match(/\{\s*"[\s\S]*"\s*:\s*[\s\S]*\}/);
            if (objectMatch) return JSON.parse(objectMatch[0]);
        } catch {}

        // Tier 3: Repair common JSON syntax errors (trailing commas, single quotes)
        try {
            const repaired = cleaned
                .replace(/,\s*([\]}])/g, '$1')
                .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');
            return JSON.parse(repaired);
        } catch {}

        return fallback;
    }

    /**
     * 构建包含小队成员专属认知特质的专家组 Prompt
     */
    function buildSquadPersonaPrompt(squad: WarfareSquad, stance: 'offensive' | 'defensive'): string {
        const restraintRule = settingsStore.activeRestraintRule;
        const prefix = restraintRule ? `${restraintRule}\n\n==================================================\n` : '';
        const memberDescriptions = squad.memberIds
            .map(id => {
                const agent = _getAgentFn ? _getAgentFn(id) : null;
                const name = agent?.name || getAgentDisplayName(id);
                const role = agent?.role || '';
                const belief = agent?.coreBelief ? ` (核心信念: ${agent.coreBelief.slice(0, 80)})` : '';
                return `• ${name}【${role}】${belief}`;
            })
            .join('\n');

        if (stance === 'offensive') {
            return `${prefix}你是【${squad.name}】（蓝军主攻创新与破局开拓小队）。
你调集了以下认知专家团队协同攻坚：
${memberDescriptions}

团队定位与原则：
- 积极进取、敢于打破常规，寻找非显而易见的高杠杆突破路径
- 坚持用增量收益与量化价值说话，给出最小可行落地步骤（MVP）
- 拒绝平庸与空泛口号，提供具体、结构化、具备操作性的方案`;
        } else {
            return `${prefix}你是【${squad.name}】（红军极限审查与风险防御小队）。
你调集了以下认知专家团队协同审查：
${memberDescriptions}

团队定位与原则：
- 极度审慎、敏锐洞察，专门刺破方案中最脆弱的前置假设
- 推演黑天鹅极端风险、雪崩连锁反应以及致命漏洞
- 坚决守住生存底线，为方案设定刚性止损阈值与兜底防线`;
        }
    }

    async function waitForUserIntervention(): Promise<'continue' | 'overtime' | 'cancel'> {
        state.awaitingUserInput = true;
        state.isPaused = true;
        return new Promise((resolve) => {
            pendingResolveFn = resolve;
        });
    }

    // ─── Public Methods ─────────────────────────────────────────────────

    function resetWarfare() {
        if (abortController) { abortController.abort(); abortController = null; }
        if (pendingResolveFn) { pendingResolveFn('cancel'); pendingResolveFn = null; }

        state.isActive = false;
        state.sessionId = '';
        state.goal = '';
        state.stage = 'idle';
        state.progress = 0;
        state.squadA = { ...state.squadA, output: '', isRunning: false };
        state.squadB = { ...state.squadB, output: '', isRunning: false };
        state.crossReview = { critiqueAonB: '', critiqueBonA: '' };
        state.conflicts = [];
        state.evidence = [];
        state.arbitrationResult = null;
        state.overtimeRounds = 0;
        state.isRunning = false;
        state.isPaused = false;
        state.awaitingUserInput = false;
        state.error = null;
        pendingInterventions = [];
    }

    function cancelWarfare() {
        if (abortController) abortController.abort();
        state.error = '用户已取消对抗推演。';
        state.isRunning = false;
        state.isPaused = false;
        state.awaitingUserInput = false;

        auditEventBus.emit('error_occurred', {
            kind: 'error_occurred',
            errorType: 'cancelled',
            message: '用户取消了多小队对抗推演',
            recoverable: false,
        }, state.sessionId);

        if (pendingResolveFn) { pendingResolveFn('cancel'); pendingResolveFn = null; }
    }

    function continueToNextStage() {
        if (pendingResolveFn) {
            const fn = pendingResolveFn;
            pendingResolveFn = null;
            state.awaitingUserInput = false;
            state.isPaused = false;
            fn('continue');
        }
    }

    async function requestOvertime(additionalContext?: string) {
        if (!state.isActive || !state.awaitingUserInput) return;
        state.overtimeRounds++;

        if (additionalContext && _addMessageFn) {
            _addMessageFn('user', `⏱️ 【加时赛第 ${state.overtimeRounds} 轮追加指令】：${additionalContext}`);
            auditEventBus.emit('user_intervention', {
                kind: 'user_intervention',
                interventionType: 'overtime_request',
                content: additionalContext,
            }, state.sessionId);
        }

        if (pendingResolveFn) {
            const fn = pendingResolveFn;
            pendingResolveFn = null;
            state.awaitingUserInput = false;
            state.isPaused = false;
            fn('overtime');
        }
    }

    async function injectUserIntervention(content: string, type: 'question' | 'correction' | 'constraint') {
        if (!state.isActive) return;
        if (_addMessageFn) {
            _addMessageFn('user', `⚡ 【阶段专家干预 (${type})】：${content}`);
        }
        auditEventBus.emit('user_intervention', {
            kind: 'user_intervention',
            interventionType: type,
            content,
        }, state.sessionId);
        pendingInterventions.push({ type, content });
    }

    function updateSquadComposition(side: 'A' | 'B', memberIds: string[], name?: string) {
        const squad = side === 'A' ? state.squadA : state.squadB;
        squad.memberIds = [...memberIds];
        if (name) squad.name = name;
    }

    // ─── Main Execution ─────────────────────────────────────────────────

    async function runWarfare(
        goal: string,
        squadAConfig: { memberIds: string[]; name?: string },
        squadBConfig: { memberIds: string[]; name?: string },
        addMessageFn: AddMessageFn,
        getAgentFn: GetAgentFn,
    ) {
        resetWarfare();
        state.isActive = true;
        state.sessionId = `warfare_${Date.now()}`;
        state.goal = goal;
        state.isRunning = true;

        updateSquadComposition('A', squadAConfig.memberIds, squadAConfig.name ?? '蓝军方案提案组');
        updateSquadComposition('B', squadBConfig.memberIds, squadBConfig.name ?? '红军极限审查组');

        _addMessageFn = addMessageFn;
        _getAgentFn = getAgentFn;
        _lastGoal = goal;
        _lastSquadAConfig = squadAConfig;
        _lastSquadBConfig = squadBConfig;
        abortController = new AbortController();

        auditEventBus.setSession(state.sessionId);
        auditEventBus.emit('session_started', {
            kind: 'session_started',
            sessionId: state.sessionId,
            mode: 'warfare',
            goal,
            agentIds: [...state.squadA.memberIds, ...state.squadB.memberIds],
        }, state.sessionId);

        try {
            // ─── Stage 1: Parallel Analysis (双线并行独立建模) ────────────
            const prevStage = state.stage;
            transitionStage('parallel_analysis', prevStage);

            addMessageFn('thought', `⚔️ **多小队联合攻坚启动**：已调集【${state.squadA.name}】与【${state.squadB.name}】双线展开独立推演...`);

            const promptA = `${buildSquadPersonaPrompt(state.squadA, 'offensive')}

针对攻坚议题："${goal}"
请输出一份具备高度破局力的完整方案：
1. **核心破局假设与关键策略**（定位最具杠杆效应的切入点）
2. **收益模型与量化 ROI 预估**（预估时间/成本/产出比）
3. **最小可行落地里程碑 (MVP)**（分步执行节奏）`;

            const promptB = `${buildSquadPersonaPrompt(state.squadB, 'defensive')}

针对攻坚议题："${goal}"
请输出一份极具杀伤力的风控审查与极限推演报告：
1. **致命前置假设清查**（指出最容易被忽视的高危漏洞）
2. **最坏情况崩塌链推演**（推演系统性失效与连锁反应）
3. **不可逾越的止损红线与兜底策略**（设置刚性熔断阀）`;

            state.squadA.isRunning = true;
            state.squadB.isRunning = true;

            const startA = Date.now();
            const startB = Date.now();

            const [resA, resB] = await Promise.all([
                callAIStreaming(promptA, (acc) => { state.squadA.output = acc; }, abortController.signal)
                    .finally(() => { state.squadA.isRunning = false; }),
                callAIStreaming(promptB, (acc) => { state.squadB.output = acc; }, abortController.signal)
                    .finally(() => { state.squadB.isRunning = false; }),
            ]);

            state.squadA.output = resA;
            state.squadB.output = resB;

            addMessageFn('assistant', `### 🟦 【${state.squadA.name}】破局方案\n\n${resA}`, state.squadA.memberIds[0]);
            addMessageFn('assistant', `### 🟥 【${state.squadB.name}】风控审查报告\n\n${resB}`, state.squadB.memberIds[0]);

            emitAgentSpoke(state.squadA.memberIds[0] ?? 'squad_A', resA, 'parallel_analysis', startA);
            emitAgentSpoke(state.squadB.memberIds[0] ?? 'squad_B', resB, 'parallel_analysis', startB);

            // Register candidate paths & vulnerabilities into auditEventBus dynamically
            const aName = state.squadA.name;
            const bName = state.squadB.name;
            const aFirstLine = resA.split('\n').find(l => l.trim().length > 5 && !l.startsWith('#')) || resA.slice(0, 100);
            const bFirstLine = resB.split('\n').find(l => l.trim().length > 5 && !l.startsWith('#')) || resB.slice(0, 100);

            const aRoiMatch = resA.match(/(?:ROI|收益|提效|回报)[^\n]*/i);
            const aCostMatch = resA.match(/(?:成本|耗时|周期|代价|MVP)[^\n]*/i);
            const bRiskMatch = resB.match(/(?:熔断|止损|红线|底线|兜底)[^\n]*/i);

            const warCandidatePaths: ExtractedCandidatePath[] = [
                {
                    id: `war-path-${Date.now()}-blue`,
                    name: `${aName} · 破局开拓方案`,
                    proposerAgentId: state.squadA.memberIds[0] || 'pathfinder',
                    coreIdea: aFirstLine.replace(/[*#]/g, '').trim().slice(0, 140),
                    projectedRoi: aRoiMatch ? aRoiMatch[0].replace(/[*#]/g, '').trim().slice(0, 60) : '追求增量突破与高杠杆产出',
                    estimatedCost: aCostMatch ? aCostMatch[0].replace(/[*#]/g, '').trim().slice(0, 60) : '轻量 MVP 试水',
                    isChosen: false
                },
                {
                    id: `war-path-${Date.now()}-red`,
                    name: `${bName} · 审慎风控防线`,
                    proposerAgentId: state.squadB.memberIds[0] || 'stress_tester',
                    coreIdea: bFirstLine.replace(/[*#]/g, '').trim().slice(0, 140),
                    projectedRoi: '守住生存底线，消除致命崩溃隐患',
                    estimatedCost: bRiskMatch ? bRiskMatch[0].replace(/[*#]/g, '').trim().slice(0, 60) : '具备刚性熔断红线',
                    isChosen: false
                }
            ];
            auditEventBus.emit('candidate_paths_extracted', {
                kind: 'candidate_paths_extracted',
                paths: warCandidatePaths
            }, state.sessionId);

            // Extract vulnerabilities from red team report (resB)
            const extractedVulnLines = resB.split('\n')
                .map(l => l.trim())
                .filter(l => /^(?:[-*•]|\d+[.\、])\s*(?:\*\*)?(?:假设|死穴|漏洞|风险|高危)/.test(l) || /###?\s*(?:.*(?:假设|风险|死穴))/.test(l));

            const warVulns: ExtractedVulnerability[] = [];
            if (extractedVulnLines.length > 0) {
                extractedVulnLines.slice(0, 4).forEach((line, idx) => {
                    const cleanTopic = line.replace(/^(?:[-*•]|\d+[.\、]|###?)\s*/, '').replace(/\*\*/g, '').trim();
                    warVulns.push({
                        id: `war-vuln-${Date.now()}-${idx + 1}`,
                        topic: cleanTopic.slice(0, 60),
                        discoveredByAgentId: state.squadB.memberIds[0] || 'challenger',
                        fatalHypothesis: '红队审查识别出的高危脆弱前置假设',
                        worstCaseScenario: resB.slice(0, 120).replace(/\n/g, ' ') + '...',
                        mitigationStrategy: bRiskMatch ? bRiskMatch[0].replace(/[*#]/g, '').trim().slice(0, 80) : '设定阶段性止损阀与备份安全路径',
                        status: 'identified'
                    });
                });
            } else {
                warVulns.push({
                    id: `war-vuln-${Date.now()}-1`,
                    topic: `${bName} 审查指出的核心脆弱假设与逻辑死穴`,
                    discoveredByAgentId: state.squadB.memberIds[0] || 'challenger',
                    fatalHypothesis: '假设外部资源支持到位且无不可控边界阻力',
                    worstCaseScenario: resB.slice(0, 120).replace(/\n/g, ' ') + '...',
                    mitigationStrategy: '设定阶段性止损阀与备份安全路径',
                    status: 'identified'
                });
            }

            auditEventBus.emit('vulnerabilities_logged', {
                kind: 'vulnerabilities_logged',
                vulnerabilities: warVulns
            }, state.sessionId);

            // ─── Loop: Cross Review → Conflict → Evidence (支持累积加时赛) ─
            let proceedToArbitration = false;
            while (!proceedToArbitration) {
                // ─── Stage 2: Cross Review (相互质检与证伪对抗) ───────────
                transitionStage('cross_review', state.stage);
                addMessageFn('thought', `🔍 **交叉质检**：双方小队互换方案，直击逻辑死穴与认知盲区...`);

                state.crossReview = { critiqueAonB: '', critiqueBonA: '' };
                state.squadA.isRunning = true;
                state.squadB.isRunning = true;

                const crossStart = Date.now();

                const interventionContext = pendingInterventions.length > 0
                    ? `\n\n【用户阶段干预指令】：\n${pendingInterventions.map(i => `[${i.type}] ${i.content}`).join('\n')}`
                    : '';
                const historyContextBonA = (state.overtimeRounds > 0 
                    ? `\n\n【前序加时赛辩驳要点】：\n${state.crossReview.critiqueBonA}`
                    : '') + interventionContext;
                const historyContextAonB = (state.overtimeRounds > 0 
                    ? `\n\n【前序加时赛抗辩要点】：\n${state.crossReview.critiqueAonB}`
                    : '') + interventionContext;
                pendingInterventions = [];

                const crossPromptBonA = `你是【${state.squadB.name}】审查官。
针对蓝军小队的方案：
"""
${state.squadA.output}
"""${historyContextBonA}

请直击其最脆弱的 2~3 个假设盲区与致命死穴，进行高强度证伪质询。`;

                const crossPromptAonB = `你是【${state.squadA.name}】主攻团队。
针对红军小队的质询与风控报告：
"""
${state.squadB.output}
"""${historyContextAonB}

请指出红军推演中是否存在过度保守、忽视关键增量机遇或错把小概率事件当必然的偏差，并给出强有力的抗辩论据。`;

                const [critiqueBonA, critiqueAonB] = await Promise.all([
                    callAIStreaming(crossPromptBonA, (acc) => { state.crossReview.critiqueBonA = acc; }, abortController!.signal)
                        .finally(() => { state.squadB.isRunning = false; }),
                    callAIStreaming(crossPromptAonB, (acc) => { state.crossReview.critiqueAonB = acc; }, abortController!.signal)
                        .finally(() => { state.squadA.isRunning = false; }),
                ]);

                state.crossReview.critiqueBonA = critiqueBonA;
                state.crossReview.critiqueAonB = critiqueAonB;

                addMessageFn('assistant', `### ⚔️ 红军对蓝军方案的证伪攻击：\n\n${critiqueBonA}`, state.squadB.memberIds[0] || 'challenger');
                addMessageFn('assistant', `### 🛡️ 蓝军对红军质询的抗辩与反驳：\n\n${critiqueAonB}`, state.squadA.memberIds[0] || 'pathfinder');

                emitAgentSpoke(state.squadB.memberIds[0] || 'challenger', critiqueBonA, 'cross_review', crossStart);
                emitAgentSpoke(state.squadA.memberIds[0] || 'pathfinder', critiqueAonB, 'cross_review', crossStart);

                auditEventBus.emit('inter_agent_comm', {
                    kind: 'inter_agent_comm',
                    sourceAgentId: state.squadB.memberIds[0] || 'challenger',
                    sourceAgentName: `${state.squadB.name}`,
                    targetAgentId: state.squadA.memberIds[0] || 'pathfinder',
                    targetAgentName: `${state.squadA.name}`,
                    type: 'critique',
                    summary: `红军发起证伪打击：${critiqueBonA.slice(0, 100).replace(/\n/g, ' ')}...`
                }, state.sessionId);

                // 🛑 核心检查点 1：交叉审查完成后暂停，用户可输入纠偏指令或申请加时赛
                let action = await waitForUserIntervention();
                if (action === 'cancel') return;
                if (action === 'overtime') {
                    transitionStage('overtime', 'cross_review');
                    addMessageFn('thought', `⏱️ **加时赛第 ${state.overtimeRounds} 轮**：正在基于新约束深化交锋...`);
                    // 累积上下文至输出，保持辩论深度递增
                    state.squadA.output += `\n\n---\n**【加时赛第 ${state.overtimeRounds} 轮 · 蓝军补充论据】**\n${critiqueAonB.slice(0, 500)}`;
                    state.squadB.output += `\n\n---\n**【加时赛第 ${state.overtimeRounds} 轮 · 红军补充质询】**\n${critiqueBonA.slice(0, 500)}`;
                    continue;
                }

                // ─── Stage 3: Conflict Detection (定位核心分歧焦点) ───────
                transitionStage('conflict_detection', 'cross_review');
                addMessageFn('thought', `🔬 **分歧收敛**：求证者正在从交锋中萃取核心矛盾与权衡本质...`);

                const conflictPrompt = `你现在是【求证者 (Evidence Scout)】。
针对两组小队的方案与辩驳交锋：
攻坚议题：${goal}
蓝军方案：${state.squadA.output}
红军攻击：${critiqueBonA}
蓝军抗辩：${critiqueAonB}

请提炼出 2~4 个最具决定性的核心关键分歧点 (Conflicts)。
请严格以 JSON 数组格式输出（绝不要使用 Markdown 包装）：
[
  {
    "id": "c1",
    "topic": "分歧焦点名称",
    "sideAView": "蓝军观点核心",
    "sideBView": "红军观点核心",
    "tradeOff": "关键权衡利弊本质",
    "severity": "high"
  }
]`;

                const conflictRaw = await callAI(conflictPrompt, abortController!.signal);
                let parsedConflicts = parseJSON<WarfareConflict[]>(conflictRaw, []);

                if (parsedConflicts.length === 0) {
                    // Extract from markdown sections if LLM responded with bullet points
                    const conflictLines = conflictRaw.split('\n')
                        .map(l => l.trim())
                        .filter(l => /^(?:[-*•]|\d+[.\、])\s*/.test(l) && l.length > 5);

                    if (conflictLines.length > 0) {
                        parsedConflicts = conflictLines.slice(0, 3).map((line, idx) => {
                            const topic = line.replace(/^(?:[-*•]|\d+[.\、])\s*/, '').replace(/\*\*/g, '').slice(0, 50);
                            return {
                                id: `c-${Date.now()}-${idx + 1}`,
                                topic,
                                sideAView: state.squadA.output.slice(0, 100).replace(/\n/g, ' ') + '...',
                                sideBView: critiqueBonA.slice(0, 100).replace(/\n/g, ' ') + '...',
                                tradeOff: topic,
                                severity: 'high' as const
                            };
                        });
                    } else {
                        parsedConflicts = [
                            {
                                id: `c-${Date.now()}-1`,
                                topic: '攻坚推进路径与风控约束之间的核心权衡',
                                sideAView: state.squadA.output.slice(0, 100).replace(/\n/g, ' ') + '...',
                                sideBView: critiqueBonA.slice(0, 100).replace(/\n/g, ' ') + '...',
                                tradeOff: '兼顾推进速度与系统边界稳定性',
                                severity: 'high' as const
                            }
                        ];
                    }
                }
                state.conflicts = parsedConflicts;

                for (const conflict of state.conflicts) {
                    auditEventBus.emit('conflict_detected', {
                        kind: 'conflict_detected',
                        conflictId: conflict.id,
                        topic: conflict.topic,
                        sideAView: conflict.sideAView,
                        sideBView: conflict.sideBView,
                        tradeOff: conflict.tradeOff,
                        severity: conflict.severity,
                    }, state.sessionId);
                }

                addMessageFn('assistant', `### 🔬 核心分歧焦点提取\n\n萃取出 **${state.conflicts.length}** 个核心矛盾点：\n${state.conflicts.map(c => `- **${c.topic}**（${c.severity.toUpperCase()}）：${c.tradeOff}`).join('\n')}`, 'evidence_scout');

                // ─── Stage 4: Evidence Grounding (行业基准与实证求证) ────
                transitionStage('evidence_grounding', 'conflict_detection');
                addMessageFn('thought', `📊 **实证校准**：求证者正在为核心分歧点调取客观数据规律与行业先例...`);

                const evidencePrompt = `你现在是【求证者 (Evidence Scout)】。
针对以下核心分歧点：
${JSON.stringify(state.conflicts, null, 2)}

请为每个分歧点提供客观行业基准指标、概率分布与历史经验先例。
请严格以 JSON 数组格式输出（绝不要使用 Markdown 包装）：
[
  {
    "id": "e1",
    "fact": "客观事实/数据规律/行业常识",
    "benchmark": "行业基准指标或统计概率",
    "source": "历史经验/公开先例/行业法则",
    "impact": "对本次决策的校准指导"
  }
]`;

                const evidenceRaw = await callAI(evidencePrompt, abortController!.signal);
                let parsedEvidence = parseJSON<WarfareEvidence[]>(evidenceRaw, []);

                if (parsedEvidence.length === 0) {
                    const evLines = evidenceRaw.split('\n')
                        .map(l => l.trim())
                        .filter(l => /^(?:[-*•]|\d+[.\、])\s*/.test(l) && l.length > 5);

                    if (evLines.length > 0) {
                        parsedEvidence = evLines.slice(0, 3).map((line, idx) => {
                            const cleaned = line.replace(/^(?:[-*•]|\d+[.\、])\s*/, '').replace(/\*\*/g, '').trim();
                            return {
                                id: `e-${Date.now()}-${idx + 1}`,
                                fact: cleaned.slice(0, 140),
                                benchmark: '依据前序专家论证与行业基准',
                                source: '求证者实证分析',
                                impact: '为终审决策提供客观事实约束'
                            };
                        });
                    } else {
                        parsedEvidence = [
                            {
                                id: `e-${Date.now()}-1`,
                                fact: evidenceRaw.slice(0, 140).replace(/\n/g, ' ') || '基于当前议题背景调取的实证约束',
                                benchmark: '行业通用工程经验',
                                source: '求证者分析',
                                impact: '指导终审裁判官明确裁决边界'
                            }
                        ];
                    }
                }
                state.evidence = parsedEvidence;

                for (const ev of state.evidence) {
                    auditEventBus.emit('evidence_added', {
                        kind: 'evidence_added',
                        evidenceId: ev.id,
                        fact: ev.fact,
                        benchmark: ev.benchmark,
                        source: ev.source,
                        impact: ev.impact,
                        addedByAgentId: 'evidence_scout',
                    }, state.sessionId);
                }

                addMessageFn('assistant', `### 📊 客观证据与行业基准校准\n\n调取了 **${state.evidence.length}** 条基准锚点：\n${state.evidence.map(e => `- **${e.source}**：${e.fact} *(校准指导: ${e.impact})*`).join('\n')}`, 'evidence_scout');

                // 🛑 核心检查点 2：在完成冲突提炼与实证校准后暂停，供用户做最终审阅
                action = await waitForUserIntervention();
                if (action === 'cancel') return;
                if (action === 'overtime') {
                    transitionStage('overtime', 'evidence_grounding');
                    continue;
                }

                proceedToArbitration = true;
            }

            // ─── Stage 5: Unified Arbitration (终审裁判令) ──────────────
            transitionStage('unified_arbitration', state.stage);
            addMessageFn('thought', `⚖️ **终审裁决**：裁判官正在结合攻守交锋论据与实证锚点，签发终审裁决令...`);

            const arbiterPrompt = `你现在是【终审裁判官 (Supreme Unified Arbiter)】。
议题：${goal}
蓝军破局方案：${state.squadA.output}
红军证伪攻击：${state.crossReview.critiqueBonA}
蓝军反驳抗辩：${state.crossReview.critiqueAonB}
核心分歧焦点：${JSON.stringify(state.conflicts)}
客观基准证据：${JSON.stringify(state.evidence)}

请依据各方论据的严密性、证伪力度与事实基准，给出具备绝对拍板力与确定性的最终裁决报告。

请严格以 JSON 格式输出（绝不要使用 Markdown 包装）：
{
  "summary": "完整终审裁决书（Markdown 格式，包含：1. 终审定论；2. 关键权衡理由；3. 宣告击毙的伪方案；4. 72h-7d 落地军令状）",
  "confidenceScore": 94,
  "chosenPath": "选定胜出路径名称",
  "tradeOffAnalysis": "核心权衡取舍分析",
  "rejectedHypotheses": ["明确否决的高危假设1", "明确否决的伪方案2"],
  "actionSteps": ["72h 敏捷启动动作1", "7d 验收里程碑2", "防御熔断红线3"]
}`;

            const arbitrationRaw = await callAI(arbiterPrompt, abortController!.signal);
            let arbitrationResult = parseJSON<ArbitrationResult | null>(arbitrationRaw, null);

            if (!arbitrationResult || !arbitrationResult.summary) {
                // Dynamically extract fields from arbitrationRaw
                const chosenMatch = arbitrationRaw.match(/(?:终审采纳路线|选定路径|采纳方案|主干路线|胜出方案)[：:]\s*([^\n]+)/i);
                const confMatch = arbitrationRaw.match(/(?:置信度|置信评分)[^\d]*(\d{1,3})%/i);
                const tradeMatch = arbitrationRaw.match(/(?:权衡|放弃|代价|Trade-offs?)[：:]\s*([^\n]+)/i);
                const rejMatches = arbitrationRaw.match(/(?:否决|击毙|淘汰|驳回)[^\n]*/g);
                const stepMatches = arbitrationRaw.split('\n')
                    .map(l => l.trim())
                    .filter(l => /^(?:[-*•]|\d+[.\、])\s*(?:\[\s*[xX ]\s*\])?\s*/.test(l) && l.length > 5);

                arbitrationResult = {
                    summary: arbitrationRaw || '### ⚖️ 裁判官终审裁决令\n详见裁判官推演全文。',
                    confidenceScore: confMatch && parseInt(confMatch[1], 10) >= 50 && parseInt(confMatch[1], 10) <= 100 ? parseInt(confMatch[1], 10) : 90,
                    chosenPath: chosenMatch ? chosenMatch[1].replace(/[*【】]/g, '').trim() : '综合权衡后的最优决选方案',
                    tradeOffAnalysis: tradeMatch ? tradeMatch[1].replace(/[*【】]/g, '').trim() : '依据各方推演权衡确立',
                    rejectedHypotheses: rejMatches ? rejMatches.slice(0, 3).map(m => m.replace(/[*【】]/g, '').trim()) : [],
                    actionSteps: stepMatches.length > 0 ? stepMatches.slice(0, 5).map(l => l.replace(/^(?:[-*•]|\d+[.\、])\s*(?:\[\s*[xX ]\s*\])?\s*/, '').replace(/\*\*/g, '').trim()) : []
                };
            }

            state.arbitrationResult = arbitrationResult;

            auditEventBus.emit('decision_made', {
                kind: 'decision_made',
                decisionId: `decision_${Date.now()}`,
                deciderAgentId: 'synthesizer',
                deciderAgentName: getAgentDisplayName('synthesizer'),
                summary: arbitrationResult.chosenPath,
                chosenPath: arbitrationResult.chosenPath,
                rejectedPaths: arbitrationResult.rejectedHypotheses,
                confidenceScore: arbitrationResult.confidenceScore,
                reasoning: arbitrationResult.tradeOffAnalysis,
            }, state.sessionId);

            // Register final DoD tasks to auditEventBus
            if (arbitrationResult.actionSteps && arbitrationResult.actionSteps.length > 0) {
                const dodTasks: ExecutableDoDTask[] = arbitrationResult.actionSteps.map((step, idx) => ({
                    id: `warfare-dod-${Date.now()}-${idx}`,
                    timeframe: idx === 0 ? '72h' : idx === 1 ? '7d' : '30d',
                    action: step,
                    owner: idx === 0 ? '架构与工程先锋组' : idx === 1 ? '质检与风控审计组' : '全业务研发团队',
                    definitionOfDone: '产出实证交付物并通过质量门禁验收 (0 致命缺陷)',
                    fallbackCircuitBreaker: '若关键链路指标超阈值立刻触发降级回滚',
                    completed: false
                }));
                auditEventBus.emit('dod_tasks_created', {
                    kind: 'dod_tasks_created',
                    tasks: dodTasks
                }, state.sessionId);
            }

            addMessageFn('assistant', `### ⚖️ 【裁判官终审裁决令】\n\n${arbitrationResult.summary}`, 'synthesizer');

            transitionStage('completed', 'unified_arbitration');
            state.isRunning = false;

            auditEventBus.emit('session_completed', {
                kind: 'session_completed',
                sessionId: state.sessionId,
                mode: 'warfare',
                goal,
                agentIds: [...state.squadA.memberIds, ...state.squadB.memberIds],
            }, state.sessionId);

            addMessageFn('system', `🏁 多小队联合攻坚推演与终审裁决已圆满达成！（共经历 ${state.overtimeRounds} 轮加时辩论，综合置信度 ${arbitrationResult.confidenceScore}%）\n\n💡 您可以点击右上角「**决策审计台**」查看因果链路与 72h-7d DoD 落地工单。`);

        } catch (e: any) {
            state.error = e.message;
            state.isRunning = false;
            state.isPaused = false;
            state.awaitingUserInput = false;

            auditEventBus.emit('error_occurred', {
                kind: 'error_occurred',
                errorType: e.name ?? 'unknown',
                message: e.message,
                recoverable: e.name !== 'AbortError',
            }, state.sessionId);

            if (_addMessageFn) {
                _addMessageFn('system', `❌ 对抗推演出错: ${e.message}`);
            }
        }
    }

    let _lastGoal = '';
    let _lastSquadAConfig: { memberIds: string[]; name?: string } = { memberIds: [] };
    let _lastSquadBConfig: { memberIds: string[]; name?: string } = { memberIds: [] };

    async function retryCurrentStage() {
        if (!state.isActive || state.isRunning) return;
        if (!_lastGoal || !_addMessageFn || !_getAgentFn) return;

        state.error = null;
        state.isRunning = true;
        abortController = new AbortController();

        if (_addMessageFn) {
            _addMessageFn('thought', `🔄 正在重试多小队【${state.stage}】阶段推演...`);
        }

        try {
            await runWarfare(_lastGoal, _lastSquadAConfig, _lastSquadBConfig, _addMessageFn, _getAgentFn);
        } catch (e: any) {
            state.error = e.message;
            state.isRunning = false;
        }
    }

    // ─── Return ─────────────────────────────────────────────────────────

    return {
        get state() { return state; },
        runWarfare,
        continueToNextStage,
        requestOvertime,
        injectUserIntervention,
        cancelWarfare,
        resetWarfare,
        updateSquadComposition,
        retryCurrentStage,
    };
}

export const warfareEngine = createWarfareEngine();
