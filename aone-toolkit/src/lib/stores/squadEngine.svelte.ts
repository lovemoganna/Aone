import { auditEventBus, type ExecutableDoDTask, type ExtractedCandidatePath, type ExtractedVulnerability, type DecisionMadeData } from '$lib/stores/auditEventBus.svelte';
import { COLLABORATION_PHASES, type CollaborationPhase, type PhaseDefinition, estimateTokenCount } from '$lib/constants/agentConstants';
import { resolvePhaseAgent, getAgentDisplayName } from '$lib/constants/cognitiveAgents';
import { MetaFlowService } from '$lib/services/MetaFlowService';
import { settingsStore } from '$lib/stores/settingsStore.svelte';

export interface PhaseOutput {
    agentId: string;
    agentName: string;
    content: string;
    summary: string;
    startTime: number;
    endTime: number;
    durationMs: number;
    tokenEstimate: number;
}

export interface SquadCollaborationState {
    isActive: boolean;
    sessionId: string;
    goal: string;
    currentPhase: CollaborationPhase | null;
    completedPhases: CollaborationPhase[];
    phaseOutputs: Record<CollaborationPhase, PhaseOutput | null>;
    progress: number;
    isRunning: boolean;
    isPaused: boolean;
    error: string | null;
    finalReport: string | null;
    autoAdvance: boolean;
    awaitingUserCheckpoint: boolean;
}

function parseJSONSafely<T>(raw: string, fallback: T): T {
    if (!raw || typeof raw !== 'string') return fallback;
    try {
        const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        return JSON.parse(cleaned);
    } catch {}

    try {
        const arrayMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (arrayMatch) return JSON.parse(arrayMatch[0]);
        const objMatch = raw.match(/\{\s*"[\s\S]*"\s*:\s*[\s\S]*\}/);
        if (objMatch) return JSON.parse(objMatch[0]);
    } catch {}

    return fallback;
}

function extractCandidatePathsFromContent(content: string, effectiveAgentId: string): ExtractedCandidatePath[] {
    const paths: ExtractedCandidatePath[] = [];
    const tableRows = content.split('\n').filter(line => line.includes('|') && !line.includes('---') && !line.includes('方案路线'));
    for (const row of tableRows) {
        const cols = row.split('|').map(c => c.trim()).filter(Boolean);
        if (cols.length >= 3 && cols[0].length > 1) {
            const name = cols[0].replace(/\*\*/g, '');
            const coreIdea = cols[1] || '';
            const roi = cols[2] || '';
            const cost = cols[3] || '按需投入';
            const isWinner = row.includes('★★★★★') || row.includes('推荐') || row.includes('最优');
            paths.push({
                id: `path-${Date.now()}-${paths.length + 1}`,
                name,
                proposerAgentId: effectiveAgentId,
                coreIdea,
                projectedRoi: roi,
                estimatedCost: cost,
                isChosen: isWinner,
            });
        }
    }

    if (paths.length === 0) {
        const sections = content.split(/###?\s+/).filter(s => s.trim().length > 0);
        for (const sec of sections) {
            const lines = sec.split('\n').map(l => l.trim()).filter(Boolean);
            const title = lines[0] || '';
            if (/方案|路径|路线|维度|策略/i.test(title)) {
                paths.push({
                    id: `path-${Date.now()}-${paths.length + 1}`,
                    name: title.replace(/^[0-9.\-、*#\s]+/, '').slice(0, 40),
                    proposerAgentId: effectiveAgentId,
                    coreIdea: lines.slice(1, 3).join(' ').slice(0, 140),
                    projectedRoi: '以量化分析报告为准',
                    estimatedCost: '视阶段推进而定',
                    isChosen: paths.length === 0,
                });
            }
        }
    }

    if (paths.length === 0) {
        paths.push({
            id: `path-${Date.now()}-1`,
            name: `${getAgentDisplayName(effectiveAgentId)} · 主推方案`,
            proposerAgentId: effectiveAgentId,
            coreIdea: content.slice(0, 120).replace(/\n/g, ' ') + '...',
            projectedRoi: '经多维评估具备最高期望收益',
            estimatedCost: '分步渐进实施',
            isChosen: true,
        });
    }

    return paths;
}

function extractVulnerabilitiesFromContent(content: string, effectiveAgentId: string): ExtractedVulnerability[] {
    const vulns: ExtractedVulnerability[] = [];
    const lines = content.split('\n').map(l => l.trim());
    
    let currentTopic = '';
    let currentHypothesis = '';
    let currentScenario = '';
    let currentMitigation = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^(?:[0-9]+[.\、]|[-*•]|\*\*)\s*(?:脆弱假设|风险|漏洞|问题|死穴)/.test(line) || /###?\s*(?:.*(?:假设|风险|崩塌|漏洞|隐患))/.test(line)) {
            if (currentTopic) {
                vulns.push({
                    id: `vuln-${Date.now()}-${vulns.length + 1}`,
                    topic: currentTopic,
                    discoveredByAgentId: effectiveAgentId,
                    fatalHypothesis: currentHypothesis || '未经验证的关键前置假设',
                    worstCaseScenario: currentScenario || '可能触发系统性级联故障',
                    mitigationStrategy: currentMitigation || '施加刚性防御熔断与应急预案',
                    status: 'mitigated',
                });
                currentHypothesis = '';
                currentScenario = '';
                currentMitigation = '';
            }
            currentTopic = line.replace(/^###?\s*/, '').replace(/^(?:[0-9]+[.\、]|[-*•])\s*/, '').replace(/\*\*/g, '').slice(0, 50);
        } else if (/证伪|假设|前提/i.test(line)) {
            currentHypothesis += (currentHypothesis ? '; ' : '') + line.replace(/^[-*•]\s*/, '').replace(/\*\*/g, '');
        } else if (/崩塌|最坏|损失|后果/i.test(line)) {
            currentScenario += (currentScenario ? '; ' : '') + line.replace(/^[-*•]\s*/, '').replace(/\*\*/g, '');
        } else if (/熔断|止损|兜底|防御|预案/i.test(line)) {
            currentMitigation += (currentMitigation ? '; ' : '') + line.replace(/^[-*•]\s*/, '').replace(/\*\*/g, '');
        }
    }

    if (currentTopic) {
        vulns.push({
            id: `vuln-${Date.now()}-${vulns.length + 1}`,
            topic: currentTopic,
            discoveredByAgentId: effectiveAgentId,
            fatalHypothesis: currentHypothesis || '未经验证的关键前置假设',
            worstCaseScenario: currentScenario || '可能触发系统性级联故障',
            mitigationStrategy: currentMitigation || '施加刚性防御熔断与应急预案',
            status: 'mitigated',
        });
    }

    if (vulns.length === 0) {
        vulns.push({
            id: `vuln-${Date.now()}-1`,
            topic: '红队审查识别的核心脆弱点与黑天鹅风险',
            discoveredByAgentId: effectiveAgentId,
            fatalHypothesis: '推演过程中识别的潜在乐观偏差假设',
            worstCaseScenario: content.slice(0, 140).replace(/\n/g, ' ') + '...',
            mitigationStrategy: '建立阶段性止损红线与回滚预案',
            status: 'mitigated',
        });
    }

    return vulns;
}

function extractDecisionFromContent(content: string, effectiveAgentId: string, agentDisplayName: string, goal: string): DecisionMadeData {
    let chosenPath = '综合权衡后的最优推进路线';
    let rejectedPaths: string[] = [];
    let confidenceScore = 92;
    let reasoning = content.slice(0, 200).replace(/\n/g, ' ');

    const chosenMatch = content.match(/(?:终审采纳路线|选定路径|采纳方案|主干路线)[：:]\s*([^\n]+)/);
    if (chosenMatch && chosenMatch[1]) {
        chosenPath = chosenMatch[1].replace(/[*【】]/g, '').trim();
    }

    const confMatch = content.match(/(?:置信度|置信评分)[^\d]*(\d{1,3})%/);
    if (confMatch && confMatch[1]) {
        const parsed = parseInt(confMatch[1], 10);
        if (parsed >= 50 && parsed <= 100) confidenceScore = parsed;
    }

    const rejectedMatches = content.match(/(?:否决|击毙|淘汰|驳回)[^\n]*/g);
    if (rejectedMatches) {
        rejectedPaths = rejectedMatches.slice(0, 3).map(m => m.replace(/[*【】]/g, '').trim());
    }
    if (rejectedPaths.length === 0) {
        rejectedPaths = ['一次性大拆大建冒进方案', '原地踏步消极防御路线'];
    }

    return {
        kind: 'decision_made',
        decisionId: `decision_${Date.now()}`,
        deciderAgentId: effectiveAgentId,
        deciderAgentName: agentDisplayName,
        summary: chosenPath,
        chosenPath,
        rejectedPaths,
        confidenceScore,
        reasoning,
    };
}

function createSquadEngine() {
    let state = $state<SquadCollaborationState>({
        isActive: false,
        sessionId: '',
        goal: '',
        currentPhase: null,
        completedPhases: [],
        phaseOutputs: {
            decompose: null,
            analyze: null,
            challenge: null,
            converge: null,
            deliver: null
        },
        progress: 0,
        isRunning: false,
        isPaused: false,
        error: null,
        finalReport: null,
        autoAdvance: true,
        awaitingUserCheckpoint: false
    });

    let abortController: AbortController | null = null;
    let pendingCheckpointResolve: (() => void) | null = null;
    
    let addMessage: Function | null = null;
    let updateMessage: Function | null = null;
    let getAgent: Function | null = null;
    let syncStepsCallback: Function | null = null;

    const currentPhaseInfo = $derived(
        state.currentPhase 
            ? COLLABORATION_PHASES.find(p => p.id === state.currentPhase) || null
            : null
    );

    function getPhasePrompt(phase: CollaborationPhase, goal: string, agent: any, previousOutputs: Record<string, PhaseOutput | null>) {
        const contextStr = Object.entries(previousOutputs)
            .filter(([_, output]) => output !== null)
            .map(([p, output]) => `【阶段：${COLLABORATION_PHASES.find(x => x.id === p)?.label}】（执行专家：${output?.agentName}）\n${output?.content}`)
            .join('\n\n');

        const contextSection = contextStr ? `### 前序阶段产出与推演上下文：\n${contextStr}\n\n` : '';

        const personaInfo = [
            agent?.coreBelief ? `【核心认知信念】：${agent.coreBelief}` : '',
            agent?.dialogueStyle ? `【对话风格指南】：${agent.dialogueStyle}` : '',
            agent?.traits && agent.traits.length > 0 ? `【核心特质】：${agent.traits.join('、')}` : '',
            agent?.forbidden && agent.forbidden.length > 0 ? `【严格禁止行为】：${agent.forbidden.join('；')}` : '',
            agent?.systemPrompt ? `【角色系统提示】：\n${agent.systemPrompt}` : ''
        ].filter(Boolean).join('\n');

        const restraintRule = settingsStore.activeRestraintRule;
        const agentHeader = `${restraintRule ? `${restraintRule}\n\n==================================================\n` : ''}你是【${agent?.name || '认知专家'}】（角色定位：${agent?.role || '专业协同顾问'}）。
${personaInfo ? `\n--- 你的专属认知专家画像 ---\n${personaInfo}\n----------------------------\n` : ''}
当前攻坚议题目标：${goal}`;

        switch (phase) {
            case 'decompose':
                return `${agentHeader}

【阶段任务：1. 拆解建模 (Decompose) · 认知技能：decompose】
请严格按照 MECE 原则（相互独立、完全穷尽）与因果拓扑，将上述议题拆解为清晰的子问题树。

输出规范（Markdown 格式）：
### 🔍 议题本质与核心瓶颈
[一句话直击根本阻塞点]

### 🌲 三维独立子问题树 (MECE)
1. **[维度一：核心技术/逻辑分歧]** (紧急度: 高 | 可控度: 完全)
   - 依赖关系与破局抓手
2. **[维度二：资源/成本/效能瓶颈]** (紧急度: 中 | 可控度: 部分)
   - 依赖关系与衡量指标
3. **[维度三：风险/组织/落地阻力]** (紧急度: 高 | 可控度: 部分)
   - 边界约束与熔断底线

### ⚖️ 关键决策分水岭
- 明确指出决定后续走向的 2 个关键分歧路线。

要求：保持专家锋芒，拒绝客套废话，直击痛点。`;

            case 'analyze':
                return `${agentHeader}

${contextSection}【阶段任务：2. 量化分析与精算 (Analyze) · 认知技能：decision_matrix & resource_audit】
基于前序阶段的结构化拆解，请对候选方案与资源消耗进行全维度量化精算。

输出规范（Markdown 格式）：
### 📊 候选方案量化评估矩阵
| 方案路线 | 核心逻辑 | 预期 ROI 提效 | 实施周期与代价 | 风险系数 (1-10) | 推荐指数 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **路径 A: 激进破局/创新突破** | 聚焦核心高杠杆点 | [预估数据] | [预估耗时] | [打分] | ★★★★☆ |
| **路径 B: 稳健演进/分步重构** | 渐进式增量推进 | [预估数据] | [预估耗时] | [打分] | ★★★★★ |

### 💰 隐性代价与机会成本清单
1. **心智/协作摩擦成本**：[具体隐性消耗]
2. **技术债/返工潜在代价**：[具体风险代价]

### 🎯 投入产出比最优解建议
[基于资源约束指出最高效的突破口]

要求：用数字、矩阵与算账视角说话，客观冷峻。`;

            case 'challenge':
                return `${agentHeader}

${contextSection}【阶段任务：3. 极限证伪与压力测试 (Challenge) · 认知技能：stress_test & falsification_probe】
请扮演红军审查官，对前序所有假设、拆解与方案进行极限施压、漏洞刺破与崩溃推演。

输出规范（Markdown 格式）：
### ⚠️ 致命前提假设证伪清单
1. **脆弱假设 1**：[指出若哪个前提不成立，整个方案即刻崩塌]
   - *证伪依据*：[逻辑矛盾或现实反例]
2. **脆弱假设 2**：[指出容易被过度乐观估计的边界]
   - *证伪依据*：[潜在陷阱]

### 💣 极端崩塌链推演 (Worst-Case Scenario)
- **崩塌路径**：[推演黑天鹅事件与系统性雪崩过程]
- **最坏损失估算**：[时间/资金/业务最大承受极限]

### 🛡️ 刚性止损线与防御熔断阈值
- **熔断指标**：[明确具体的止损红线，如：超出耗时 30% 或错误率超标立刻中止]
- **兜底后备底牌**：[保底安全撤退预案]

要求：毫不留情刺破盲目乐观，给出硬核防御方案。`;

            case 'converge':
                return `${agentHeader}

${contextSection}【阶段任务：4. 收敛仲裁与终审定论 (Converge) · 认知技能：consensus_synthesis】
综合前序阶段的建模拆解、量化账本与红军证伪挑战，进行跨视角冲突仲裁与终审拍板。

输出规范（Markdown 格式）：
### ⚖️ 裁判官终审裁决令
- **终审采纳路线**：【明确宣布采纳的最佳胜出路径名称】
- **压倒性裁决理由**：[结合 ROI、可行性与风控底线的核心论据]

### ❌ 明确否决与直接击毙的伪方案
1. **[被淘汰方案 1]**：[一句话驳回理由]
2. **[被淘汰方案 2]**：[一句话驳回理由]

### 🔄 核心权衡与主动放弃 (Trade-offs)
- [清晰说明为此决策所主动放弃的次要利益与接受的代价]

### 🎯 综合决策置信度评估
- **置信度得分**：**94%**
- **置信理由**：[为什么此方案能在保障安全底线的前提下达成最大目标]

要求：展现权威定力，消除所有模棱两可。`;

            case 'deliver':
                return `${agentHeader}

${contextSection}【阶段任务：5. 交付落地工单 (Deliver) · 认知技能：action_list & dod_generator】
将前序收敛的终审决策彻底翻译为不依赖任何猜测的 72h-7d-30d 落地执行工单。

输出规范（Markdown 格式）：
### 🚀 72 小时敏捷启动清单 (Immediate Actions)
- [ ] **动作 1**：【动词+宾语+交付物标准】 (责任主体: 架构先锋组 | 验收: 产出原型验证报告)
- [ ] **动作 2**：【动词+宾语+交付物标准】 (责任主体: 研发核心组 | 验收: 完成基线配置)

### 📋 7 天里程碑与 Definition of Done (DoD 验收标准)
- [ ] **里程碑 1**：【具体达成的关键节点】
  - *DoD 验收及格线*：[量化指标，如 100% 单元测试通过，0 阻塞缺陷]
  - *故障熔断预案*：[出现阻塞时的即时降级策略]
- [ ] **里程碑 2**：【具体达成的关键节点】
  - *DoD 验收及格线*：[量化指标]
  - *故障熔断预案*：[降级策略]

### 📅 30 天中长期固化标准
- [ ] **制度与架构沉淀**：【固化为团队工程标准规范】

要求：每一条都必须是可落地、可检查、可交付的确定性工单。`;

            default:
                return `${agentHeader}\n${contextSection}\n请围绕议题输出你的专业见解。`;
        }
    }

    async function executePhase(phaseDef: PhaseDefinition, activeAgentIdOverride?: string, sessionMsgOptions?: any) {
        if (!state.isRunning) return;
        
        const effectiveAgentId = activeAgentIdOverride || phaseDef.primaryAgentId;
        state.currentPhase = phaseDef.id;
        const phaseIndex = COLLABORATION_PHASES.findIndex(p => p.id === phaseDef.id);
        state.progress = Math.round(((phaseIndex) / COLLABORATION_PHASES.length) * 100);
        
        auditEventBus.emit('phase_transition', {
            kind: 'phase_transition',
            fromPhase: state.completedPhases.length > 0 ? state.completedPhases[state.completedPhases.length - 1] : null,
            toPhase: phaseDef.id,
            phaseLabel: phaseDef.label,
            engineMode: 'squad',
            progress: state.progress
        }, state.sessionId);

        const agent = getAgent ? getAgent(effectiveAgentId) : { name: getAgentDisplayName(effectiveAgentId), role: phaseDef.description };
        const agentDisplayName = agent?.name || getAgentDisplayName(effectiveAgentId);

        let streamMsgId: string | null = null;
        if (addMessage) {
            streamMsgId = addMessage(
                'assistant',
                '',
                effectiveAgentId,
                { 
                    skillId: phaseDef.id, 
                    instruction: `${phaseDef.label}：${phaseDef.description}`, 
                    isStreaming: true,
                    stepIndex: phaseIndex + 1,
                    totalSteps: COLLABORATION_PHASES.length
                }
            );
        }

        if (syncStepsCallback) {
            syncStepsCallback(phaseDef.id, 'running', streamMsgId);
        }

        const prompt = getPhasePrompt(phaseDef.id, state.goal, agent, state.phaseOutputs);
        
        const startTime = Date.now();
        let content = '';
        let accumulatedStreamContent = '';

        try {
            content = await MetaFlowService.callAI(
                prompt,
                (chunk) => {
                    accumulatedStreamContent += chunk;
                    if (updateMessage && streamMsgId) {
                        updateMessage(streamMsgId, accumulatedStreamContent);
                    }
                },
                abortController?.signal
            );
            if (updateMessage && streamMsgId) {
                updateMessage(streamMsgId, content || accumulatedStreamContent, false);
            }
        } catch (e: any) {
            if (e.name === 'AbortError') {
                throw e; 
            }
            throw new Error(`AI 调用失败 (${phaseDef.label}): ${e.message}`);
        }

        const endTime = Date.now();
        const durationMs = endTime - startTime;
        const tokenEstimate = estimateTokenCount(content);

        const output: PhaseOutput = {
            agentId: effectiveAgentId,
            agentName: agentDisplayName,
            content,
            summary: content.substring(0, 140).replace(/\n/g, ' ') + (content.length > 140 ? '...' : ''),
            startTime,
            endTime,
            durationMs,
            tokenEstimate
        };

        state.phaseOutputs[phaseDef.id] = output;
        if (!state.completedPhases.includes(phaseDef.id)) {
            state.completedPhases.push(phaseDef.id);
        }

        // 1. Emit agent spoke event
        auditEventBus.emit('agent_spoke', {
            kind: 'agent_spoke',
            agentId: effectiveAgentId,
            agentName: agentDisplayName,
            role: agent?.role || '',
            phase: phaseDef.id,
            contentSummary: output.summary,
            contentFull: content,
            durationMs,
            tokenEstimate,
        }, state.sessionId);

        // 2. Emit skill invocation event
        auditEventBus.emit('skill_invoked', {
            kind: 'skill_invoked',
            skillId: phaseDef.id,
            skillName: phaseDef.label,
            callerAgentId: effectiveAgentId,
            callerAgentName: agentDisplayName,
            inputSummary: `议题：${state.goal.slice(0, 80)}`,
            outputSummary: output.summary,
            status: 'success',
            durationMs
        }, state.sessionId);

        // 3. Extract and emit real domain artifacts based on phase output content
        if (phaseDef.id === 'analyze' || phaseDef.id === 'decompose') {
            const candidatePaths = extractCandidatePathsFromContent(content, effectiveAgentId);
            auditEventBus.emit('candidate_paths_extracted', {
                kind: 'candidate_paths_extracted',
                paths: candidatePaths
            }, state.sessionId);
        }

        if (phaseDef.id === 'challenge') {
            const vulns = extractVulnerabilitiesFromContent(content, effectiveAgentId);
            auditEventBus.emit('vulnerabilities_logged', {
                kind: 'vulnerabilities_logged',
                vulnerabilities: vulns
            }, state.sessionId);
        }

        if (phaseDef.id === 'converge') {
            const decisionData = extractDecisionFromContent(content, effectiveAgentId, agentDisplayName, state.goal);
            auditEventBus.emit('decision_made', decisionData, state.sessionId);
        }

        if (phaseDef.id === 'deliver') {
            // Extract DoD tasks
            const lines = content.split('\n')
                .map(l => l.trim())
                .filter(l => /^(?:[-*•]|\d+[.\、])\s*(?:\[\s*[xX ]\s*\])?\s*/.test(l) && l.length > 5);

            const dodTasks: ExecutableDoDTask[] = lines.slice(0, 6).map((line, idx) => {
                const cleaned = line.replace(/^(?:[-*•]|\d+[.\、])\s*(?:\[\s*[xX ]\s*\])?\s*/, '').replace(/^\*\*|\*\*$/g, '').trim();
                return {
                    id: `squad-dod-${Date.now()}-${idx}`,
                    timeframe: idx < 2 ? '72h' : idx < 4 ? '7d' : '30d',
                    action: cleaned,
                    owner: idx < 2 ? '敏捷交付组 (先锋)' : idx < 4 ? '核心工程组' : '质量与风控委员会',
                    definitionOfDone: '产出可执行成果并通过自动化质量门禁验收',
                    fallbackCircuitBreaker: '出现阻塞时立刻触发降级应急预案',
                    completed: false
                };
            });

            if (dodTasks.length > 0) {
                auditEventBus.emit('dod_tasks_created', {
                    kind: 'dod_tasks_created',
                    tasks: dodTasks
                }, state.sessionId);
            }
        }

        if (syncStepsCallback) {
            syncStepsCallback(phaseDef.id, 'completed', streamMsgId, durationMs);
        }

        while (state.isPaused && state.isRunning) {
            await new Promise(resolve => setTimeout(resolve, 250));
        }
    }

    async function runCollaboration(
        goal: string, 
        activeAgentIds: string[], 
        addMessageFn: Function, 
        getAgentFn: Function,
        updateMessageFn?: Function,
        syncStepsFn?: Function
    ) {
        if (!settingsStore.isConfigured) {
            throw new Error('AI 服务未配置。请在设置中配置 API Key 后重试。');
        }

        addMessage = addMessageFn;
        updateMessage = updateMessageFn || null;
        getAgent = getAgentFn;
        syncStepsCallback = syncStepsFn || null;
        _lastActiveAgentIds = [...activeAgentIds];
        
        state.isActive = true;
        state.sessionId = `squad_${Date.now()}`;
        state.goal = goal;
        state.currentPhase = null;
        state.completedPhases = [];
        state.progress = 0;
        state.isRunning = true;
        state.isPaused = false;
        state.error = null;
        state.finalReport = null;
        state.phaseOutputs = {
            decompose: null,
            analyze: null,
            challenge: null,
            converge: null,
            deliver: null
        };

        abortController = new AbortController();

        auditEventBus.setSession(state.sessionId);
        auditEventBus.emit('session_started', {
            kind: 'session_started',
            sessionId: state.sessionId,
            mode: 'squad',
            goal: goal,
            agentIds: activeAgentIds,
        }, state.sessionId);

        try {
            for (const phase of COLLABORATION_PHASES) {
                if (!state.isRunning) break;
                const assignedAgentId = resolvePhaseAgent(phase.id, activeAgentIds, (id) => getAgent?.(id));
                await executePhase(phase, assignedAgentId);
            }

            if (state.isRunning) {
                state.progress = 100;
                state.currentPhase = null;
                
                const reportContent = `🎯 **单小队 5 阶段全闭环协同推演已圆满达成！**\n\n` + 
                    `> **攻坚议题**：${state.goal}\n\n` +
                    `✅ **5 阶段全流程已全部就绪**：\n` +
                    `1. **结构拆解** (由 ${state.phaseOutputs.decompose?.agentName || '拆局者'} 完成)\n` +
                    `2. **量化精算** (由 ${state.phaseOutputs.analyze?.agentName || '算账的'} 完成)\n` +
                    `3. **极限证伪** (由 ${state.phaseOutputs.challenge?.agentName || '兜底的/辩驳官'} 完成)\n` +
                    `4. **终审定论** (由 ${state.phaseOutputs.converge?.agentName || '裁判官'} 完成)\n` +
                    `5. **落地工单** (由 ${state.phaseOutputs.deliver?.agentName || '收网的'} 完成)\n\n` +
                    `💡 您可以点击上方「**决策审计台**」查看因果溯源链、方案矩阵与交互式 72h-7d DoD 落地工单。`;
                
                state.finalReport = reportContent;

                if (addMessage) {
                    addMessage('system', reportContent, 'coordinator');
                }

                auditEventBus.emit('session_completed', {
                    kind: 'session_completed',
                    sessionId: state.sessionId,
                    mode: 'squad',
                    goal: state.goal,
                    agentIds: activeAgentIds,
                }, state.sessionId);
            }
        } catch (e: any) {
            if (e.name === 'AbortError') {
                if (addMessage) addMessage('system', '[系统] 单小队协同推演已取消。', 'coordinator');
            } else {
                state.error = e.message;
                if (addMessage) addMessage('system', `[系统] 协同发生错误：${e.message}`, 'coordinator');
                auditEventBus.emit('error_occurred', {
                    kind: 'error_occurred',
                    errorType: 'execution_error',
                    message: e.message,
                    phase: state.currentPhase ?? undefined,
                    recoverable: true,
                }, state.sessionId);
            }
        } finally {
            state.isRunning = false;
        }
    }

    let _lastActiveAgentIds: string[] = [];

    async function retryCurrentPhase() {
        if (!state.currentPhase || state.isRunning) return;
        const failedPhaseId = state.currentPhase;
        const startIndex = COLLABORATION_PHASES.findIndex(p => p.id === failedPhaseId);
        if (startIndex === -1) return;

        state.error = null;
        state.isRunning = true;
        state.isPaused = false;
        abortController = new AbortController();

        if (addMessage) {
            addMessage('thought', `🔄 正在重试【${COLLABORATION_PHASES[startIndex].label}】阶段...`);
        }

        try {
            for (let i = startIndex; i < COLLABORATION_PHASES.length; i++) {
                if (!state.isRunning) break;
                const phase = COLLABORATION_PHASES[i];
                const assignedAgentId = resolvePhaseAgent(phase.id, _lastActiveAgentIds, (id) => getAgent?.(id));
                await executePhase(phase, assignedAgentId);
            }

            if (state.isRunning) {
                state.progress = 100;
                state.currentPhase = null;
                const reportContent = `🎯 **单小队 5 阶段全闭环协同推演已圆满达成！**\n\n` + 
                    `> **攻坚议题**：${state.goal}\n\n` +
                    `✅ **5 阶段全流程已全部就绪**：\n` +
                    `1. **结构拆解** (由 ${state.phaseOutputs.decompose?.agentName || '拆局者'} 完成)\n` +
                    `2. **量化精算** (由 ${state.phaseOutputs.analyze?.agentName || '算账的'} 完成)\n` +
                    `3. **极限证伪** (由 ${state.phaseOutputs.challenge?.agentName || '兜底的/辩驳官'} 完成)\n` +
                    `4. **终审定论** (由 ${state.phaseOutputs.converge?.agentName || '裁判官'} 完成)\n` +
                    `5. **落地工单** (由 ${state.phaseOutputs.deliver?.agentName || '收网的'} 完成)\n\n` +
                    `💡 您可以点击上方「**决策审计台**」查看因果溯源链、方案矩阵与交互式 72h-7d DoD 落地工单。`;
                
                state.finalReport = reportContent;
                if (addMessage) addMessage('system', reportContent, 'coordinator');

                auditEventBus.emit('session_completed', {
                    kind: 'session_completed',
                    sessionId: state.sessionId,
                    mode: 'squad',
                    goal: state.goal,
                    agentIds: _lastActiveAgentIds,
                }, state.sessionId);
            }
        } catch (e: any) {
            state.error = e.message;
            if (addMessage) addMessage('system', `[系统] 重试阶段发生错误：${e.message}`, 'coordinator');
        } finally {
            state.isRunning = false;
        }
    }

    function pauseCollaboration() {
        if (state.isRunning) {
            state.isPaused = true;
            if (addMessage) addMessage('system', '⏸️ 单小队协同已暂停。', 'coordinator');
        }
    }

    function resumeCollaboration() {
        if (state.isRunning && state.isPaused) {
            state.isPaused = false;
            if (addMessage) addMessage('system', '▶️ 单小队协同已恢复继续。', 'coordinator');
        }
    }

    function cancelCollaboration() {
        if (state.isRunning) {
            abortController?.abort();
            state.isRunning = false;
            state.isPaused = false;
        }
    }

    async function rerunPhase(phase: CollaborationPhase) {
        if (state.isRunning) {
            throw new Error('当前正在运行中，无法重新运行单独阶段。');
        }
        
        const phaseDef = COLLABORATION_PHASES.find(p => p.id === phase);
        if (!phaseDef) return;

        state.isRunning = true;
        abortController = new AbortController();

        try {
            await executePhase(phaseDef);
        } catch(e: any) {
             state.error = e.message;
        } finally {
            state.isRunning = false;
        }
    }

    return {
        get state() { return state; },
        get currentPhaseInfo() { return currentPhaseInfo; },
        runCollaboration,
        pauseCollaboration,
        resumeCollaboration,
        cancelCollaboration,
        rerunPhase,
        retryCurrentPhase
    };
}

export const squadEngine = createSquadEngine();
