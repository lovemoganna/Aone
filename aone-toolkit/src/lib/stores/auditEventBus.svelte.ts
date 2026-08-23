/**
 * auditEventBus.svelte.ts
 * 
 * Unified audit event bus for real-time structured event capture.
 * Provides high-density observability for Single Squad, Joint Warfare, and Decision Audit Console.
 * 
 * All engines (squadEngine, warfareEngine, metaFlow) emit events through this bus.
 * The DecisionAuditConsole subscribes and renders from this structured reactive data.
 */

// ─── Core Interfaces ────────────────────────────────────────────────────────

export interface ExecutableDoDTask {
    id: string;
    timeframe: '72h' | '7d' | '30d';
    action: string;
    owner: string;
    definitionOfDone: string;
    fallbackCircuitBreaker: string;
    completed: boolean;
}

export interface ExtractedCandidatePath {
    id: string;
    name: string;
    proposerAgentId: string;
    coreIdea: string;
    projectedRoi: string;
    estimatedCost: string;
    isChosen: boolean;
}

export interface ExtractedVulnerability {
    id: string;
    topic: string;
    discoveredByAgentId: string;
    fatalHypothesis: string;
    worstCaseScenario: string;
    mitigationStrategy: string;
    status: 'open' | 'mitigated' | 'rejected' | 'identified';
}

export interface ExtractedEvidenceItem {
    id: string;
    category: 'metric' | 'case_study' | 'benchmark' | 'counter_example';
    title: string;
    fact: string;
    source: string;
    confidence: number;
    agentId: string;
}

export interface ExtractedInterAgentComm {
    id: string;
    sourceAgentId: string;
    sourceAgentName: string;
    targetAgentId: string;
    targetAgentName: string;
    type: 'handoff' | 'critique' | 'evidence_request' | 'synthesis' | 'dependence' | 'evidence_query';
    summary: string;
    dependsOnMessageId?: string;
    timestamp: number;
}

export interface ExtractedToolInvocation {
    id: string;
    toolName: string;
    category: string;
    callerAgentId: string;
    callerAgentName: string;
    inputSummary: string;
    outputSummary: string;
    durationMs: number;
    status: 'success' | 'failed' | 'running';
    timestamp: number;
}

export interface DecisionTraceStage {
    id: string;
    title: string;
    stageIndex: number;
    agentId: string;
    agentName: string;
    status: 'completed' | 'current' | 'pending';
    coreInsight: string;
    evidenceQuote: string;
    tradeoffSummary: string;
    timestamp: number;
}

// ─── Event Types ────────────────────────────────────────────────────────────

export type AuditEventType =
    | 'phase_transition'
    | 'agent_spoke'
    | 'skill_invoked'
    | 'conflict_detected'
    | 'decision_made'
    | 'evidence_added'
    | 'candidate_paths_extracted'
    | 'vulnerabilities_logged'
    | 'dod_tasks_created'
    | 'dod_task_toggled'
    | 'inter_agent_comm'
    | 'user_intervention'
    | 'error_occurred'
    | 'session_started'
    | 'session_completed';

export interface AuditEvent {
    id: string;
    type: AuditEventType;
    timestamp: number;
    sessionId: string;
    data: AuditEventData;
}

export type AuditEventData =
    | PhaseTransitionData
    | AgentSpokeData
    | SkillInvokedData
    | ConflictDetectedData
    | DecisionMadeData
    | EvidenceAddedData
    | CandidatePathsData
    | VulnerabilitiesData
    | DoDTasksData
    | DoDTaskToggledData
    | InterAgentCommData
    | UserInterventionData
    | ErrorOccurredData
    | SessionLifecycleData;

export interface PhaseTransitionData {
    kind: 'phase_transition';
    fromPhase: string | null;
    toPhase: string;
    phaseLabel: string;
    engineMode: 'squad' | 'warfare' | 'meta';
    progress: number;
}

export interface AgentSpokeData {
    kind: 'agent_spoke';
    agentId: string;
    agentName: string;
    role: string;
    phase: string;
    contentSummary: string;
    contentFull: string;
    durationMs: number;
    tokenEstimate: number;
}

export interface SkillInvokedData {
    kind: 'skill_invoked';
    skillId: string;
    skillName: string;
    callerAgentId: string;
    callerAgentName: string;
    inputSummary: string;
    outputSummary: string;
    status: 'success' | 'error';
    durationMs: number;
}

export interface ConflictDetectedData {
    kind: 'conflict_detected';
    conflictId: string;
    topic: string;
    sideAView: string;
    sideBView: string;
    tradeOff: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface DecisionMadeData {
    kind: 'decision_made';
    decisionId: string;
    deciderAgentId: string;
    deciderAgentName: string;
    summary: string;
    chosenPath: string;
    rejectedPaths: string[];
    confidenceScore: number;
    reasoning: string;
}

export interface EvidenceAddedData {
    kind: 'evidence_added';
    evidenceId: string;
    fact: string;
    benchmark: string;
    source: string;
    impact: string;
    addedByAgentId: string;
}

export interface CandidatePathsData {
    kind: 'candidate_paths_extracted';
    paths: ExtractedCandidatePath[];
}

export interface VulnerabilitiesData {
    kind: 'vulnerabilities_logged';
    vulnerabilities: ExtractedVulnerability[];
}

export interface DoDTasksData {
    kind: 'dod_tasks_created';
    tasks: ExecutableDoDTask[];
}

export interface DoDTaskToggledData {
    kind: 'dod_task_toggled';
    taskId: string;
    completed: boolean;
}

export interface InterAgentCommData {
    kind: 'inter_agent_comm';
    sourceAgentId: string;
    sourceAgentName: string;
    targetAgentId: string;
    targetAgentName: string;
    type: 'handoff' | 'critique' | 'synthesis' | 'evidence_query';
    summary: string;
}

export interface UserInterventionData {
    kind: 'user_intervention';
    interventionType: 'question' | 'correction' | 'constraint' | 'overtime_request';
    content: string;
    targetAgentId?: string;
    targetPhase?: string;
}

export interface ErrorOccurredData {
    kind: 'error_occurred';
    errorType: string;
    message: string;
    agentId?: string;
    phase?: string;
    recoverable: boolean;
}

export interface SessionLifecycleData {
    kind: 'session_started' | 'session_completed';
    sessionId: string;
    mode: 'squad' | 'warfare' | 'meta';
    goal: string;
    agentIds: string[];
    totalDurationMs?: number;
    totalTokenEstimate?: number;
}

// ─── Telemetry Summary ──────────────────────────────────────────────────────

export interface AuditTelemetry {
    totalEvents: number;
    totalAgentSpoken: number;
    totalSkillInvocations: number;
    totalConflicts: number;
    totalDecisions: number;
    totalEvidence: number;
    totalUserInterventions: number;
    totalErrors: number;
    totalTokenEstimate: number;
    totalDurationMs: number;
    averageConfidenceScore: number;
}

// ─── Event Bus Implementation ───────────────────────────────────────────────

type AuditEventListener = (event: AuditEvent) => void;

let eventCounter = 0;

function generateEventId(): string {
    return `audit-${Date.now()}-${++eventCounter}`;
}

function createAuditEventBus() {
    const DOD_STORAGE_KEY = 'aone_dod_task_states';

    function loadDoDStates(): Record<string, boolean> {
        if (typeof localStorage === 'undefined') return {};
        try {
            const raw = localStorage.getItem(DOD_STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch { return {}; }
    }

    function persistDoDStates(states: Record<string, boolean>) {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(DOD_STORAGE_KEY, JSON.stringify(states));
        } catch { /* quota exceeded — non-critical */ }
    }

    let events = $state<AuditEvent[]>([]);
    let currentSessionId = $state<string | null>(null);
    let dodTaskStates = $state<Record<string, boolean>>(loadDoDStates());
    const listeners = new Set<AuditEventListener>();

    // ─── Derived Telemetry ──────────────────────────────────────────────

    function calculateTelemetry(sessionEvents: AuditEvent[]): AuditTelemetry {
        let totalTokens = 0;
        let totalDuration = 0;
        let confidenceSum = 0;
        let confidenceCount = 0;
        let agentSpoken = 0;
        let skillInvocations = 0;
        let conflicts = 0;
        let decisions = 0;
        let evidence = 0;
        let userInterventions = 0;
        let errors = 0;

        for (const event of sessionEvents) {
            const kind = event.data?.kind || event.type;
            switch (kind) {
                case 'agent_spoke':
                    agentSpoken++;
                    totalTokens += (event.data as AgentSpokeData).tokenEstimate || 0;
                    totalDuration += (event.data as AgentSpokeData).durationMs || 0;
                    break;
                case 'skill_invoked':
                    skillInvocations++;
                    totalDuration += (event.data as SkillInvokedData).durationMs || 0;
                    break;
                case 'conflict_detected':
                    conflicts++;
                    break;
                case 'decision_made': {
                    decisions++;
                    const score = (event.data as DecisionMadeData).confidenceScore;
                    if (typeof score === 'number' && !isNaN(score) && score > 0) {
                        confidenceSum += score;
                        confidenceCount++;
                    }
                    break;
                }
                case 'evidence_added':
                    evidence++;
                    break;
                case 'user_intervention':
                    userInterventions++;
                    break;
                case 'error_occurred':
                    errors++;
                    break;
            }
        }

        return {
            totalEvents: sessionEvents.length,
            totalAgentSpoken: agentSpoken,
            totalSkillInvocations: skillInvocations,
            totalConflicts: conflicts,
            totalDecisions: decisions,
            totalEvidence: evidence,
            totalUserInterventions: userInterventions,
            totalErrors: errors,
            totalTokenEstimate: totalTokens,
            totalDurationMs: totalDuration,
            averageConfidenceScore: confidenceCount > 0 ? Math.round(confidenceSum / confidenceCount) : 0,
        };
    }

    const telemetry = $derived.by((): AuditTelemetry => {
        const sessionEvents = currentSessionId
            ? events.filter(e => e.sessionId === currentSessionId)
            : events;
        return calculateTelemetry(sessionEvents);
    });

    // ─── Filtered Views ─────────────────────────────────────────────────

    const phaseTimeline = $derived(
        events
            .filter(e => (!currentSessionId || e.sessionId === currentSessionId) && e.data.kind === 'phase_transition')
            .map(e => e.data as PhaseTransitionData)
    );

    const agentActivities = $derived(
        events
            .filter(e => (!currentSessionId || e.sessionId === currentSessionId) && e.data.kind === 'agent_spoke')
            .map(e => ({ ...e.data as AgentSpokeData, timestamp: e.timestamp, id: e.id }))
    );

    const skillLogs = $derived(
        events
            .filter(e => (!currentSessionId || e.sessionId === currentSessionId) && e.data.kind === 'skill_invoked')
            .map(e => ({ ...e.data as SkillInvokedData, timestamp: e.timestamp, id: e.id }))
    );

    const conflictList = $derived(
        events
            .filter(e => (!currentSessionId || e.sessionId === currentSessionId) && e.data.kind === 'conflict_detected')
            .map(e => e.data as ConflictDetectedData)
    );

    const decisionList = $derived(
        events
            .filter(e => (!currentSessionId || e.sessionId === currentSessionId) && e.data.kind === 'decision_made')
            .map(e => ({ ...e.data as DecisionMadeData, timestamp: e.timestamp, id: e.id }))
    );

    const evidenceList = $derived(
        events
            .filter(e => (!currentSessionId || e.sessionId === currentSessionId) && e.data.kind === 'evidence_added')
            .map(e => e.data as EvidenceAddedData)
    );

    const interventionList = $derived(
        events
            .filter(e => (!currentSessionId || e.sessionId === currentSessionId) && e.data.kind === 'user_intervention')
            .map(e => ({ ...e.data as UserInterventionData, timestamp: e.timestamp, id: e.id }))
    );

    const errorList = $derived(
        events
            .filter(e => (!currentSessionId || e.sessionId === currentSessionId) && e.data.kind === 'error_occurred')
            .map(e => ({ ...e.data as ErrorOccurredData, timestamp: e.timestamp, id: e.id }))
    );

    // ─── Structured Candidate Paths View ────────────────────────────────

    const candidatePaths = $derived.by((): ExtractedCandidatePath[] => {
        const sessionEvents = currentSessionId ? events.filter(e => e.sessionId === currentSessionId) : events;
        const pathsMap = new Map<string, ExtractedCandidatePath>();

        for (const event of sessionEvents) {
            if (event.data.kind === 'candidate_paths_extracted') {
                for (const p of event.data.paths) {
                    pathsMap.set(p.id, p);
                }
            }
        }
        return Array.from(pathsMap.values());
    });

    // ─── Structured Vulnerabilities View ────────────────────────────────

    const vulnerabilities = $derived.by((): ExtractedVulnerability[] => {
        const sessionEvents = currentSessionId ? events.filter(e => e.sessionId === currentSessionId) : events;
        const vulnMap = new Map<string, ExtractedVulnerability>();

        for (const event of sessionEvents) {
            if (event.data.kind === 'vulnerabilities_logged') {
                for (const v of event.data.vulnerabilities) {
                    vulnMap.set(v.id, v);
                }
            }
        }
        return Array.from(vulnMap.values());
    });

    // ─── Structured DoD Tasks View ──────────────────────────────────────

    const dodTasks = $derived.by((): ExecutableDoDTask[] => {
        const sessionEvents = currentSessionId ? events.filter(e => e.sessionId === currentSessionId) : events;
        const taskMap = new Map<string, ExecutableDoDTask>();

        for (const event of sessionEvents) {
            if (event.data.kind === 'dod_tasks_created') {
                for (const t of event.data.tasks) {
                    const isCompleted = dodTaskStates[t.id] ?? t.completed;
                    taskMap.set(t.id, { ...t, completed: isCompleted });
                }
            }
        }
        return Array.from(taskMap.values());
    });

    // ─── Inter-Agent Communications View ────────────────────────────────

    const interAgentComms = $derived.by((): ExtractedInterAgentComm[] => {
        const sessionEvents = currentSessionId ? events.filter(e => e.sessionId === currentSessionId) : events;
        const comms: ExtractedInterAgentComm[] = [];

        for (const event of sessionEvents) {
            if (event.data.kind === 'inter_agent_comm') {
                comms.push({
                    id: event.id,
                    sourceAgentId: event.data.sourceAgentId,
                    sourceAgentName: event.data.sourceAgentName,
                    targetAgentId: event.data.targetAgentId,
                    targetAgentName: event.data.targetAgentName,
                    type: event.data.type,
                    summary: event.data.summary,
                    timestamp: event.timestamp,
                });
            }
        }
        return comms;
    });

    // ─── Causal Chain (Decision Trace) ──────────────────────────────────

    const causalChain = $derived.by(() => {
        const sessionEvents = currentSessionId ? events.filter(e => e.sessionId === currentSessionId) : events;
        const chain: Array<{
            id: string;
            timestamp: number;
            type: AuditEventType;
            agentId: string;
            agentName: string;
            phase: string;
            summary: string;
            detail: string;
        }> = [];

        for (const event of sessionEvents) {
            const d = event.data;
            switch (d.kind) {
                case 'phase_transition':
                    chain.push({
                        id: event.id,
                        timestamp: event.timestamp,
                        type: event.type,
                        agentId: '',
                        agentName: '协同调度中枢',
                        phase: d.toPhase,
                        summary: `阶段演进 → ${d.phaseLabel}`,
                        detail: `从 ${d.fromPhase ?? '初始'} 进入 ${d.toPhase}`,
                    });
                    break;
                case 'agent_spoke':
                    chain.push({
                        id: event.id,
                        timestamp: event.timestamp,
                        type: event.type,
                        agentId: d.agentId,
                        agentName: d.agentName,
                        phase: d.phase,
                        summary: d.contentSummary,
                        detail: d.contentFull,
                    });
                    break;
                case 'decision_made':
                    chain.push({
                        id: event.id,
                        timestamp: event.timestamp,
                        type: event.type,
                        agentId: d.deciderAgentId,
                        agentName: d.deciderAgentName,
                        phase: '仲裁决断',
                        summary: `终审决断: ${d.summary}`,
                        detail: d.reasoning,
                    });
                    break;
                case 'conflict_detected':
                    chain.push({
                        id: event.id,
                        timestamp: event.timestamp,
                        type: event.type,
                        agentId: 'evidence_scout',
                        agentName: '求证者',
                        phase: '焦点萃取',
                        summary: `两难焦点: ${d.topic}`,
                        detail: `${d.sideAView} vs ${d.sideBView} (权衡: ${d.tradeOff})`,
                    });
                    break;
                case 'evidence_added':
                    chain.push({
                        id: event.id,
                        timestamp: event.timestamp,
                        type: event.type,
                        agentId: d.addedByAgentId,
                        agentName: '求证者',
                        phase: '基准校准',
                        summary: `行业实证: ${d.source}`,
                        detail: `${d.fact} (指导: ${d.impact})`,
                    });
                    break;
                case 'user_intervention':
                    chain.push({
                        id: event.id,
                        timestamp: event.timestamp,
                        type: event.type,
                        agentId: '',
                        agentName: '用户专家',
                        phase: d.targetPhase ?? '',
                        summary: `指令介入: ${d.interventionType}`,
                        detail: d.content,
                    });
                    break;
            }
        }

        return chain;
    });

    return {
        // ─── State Accessors ────────────────────────────────────────────
        get events() { return events; },
        get currentSessionId() { return currentSessionId; },
        get telemetry() { 
            const sessionEvents = currentSessionId ? events.filter(e => e.sessionId === currentSessionId) : events;
            return calculateTelemetry(sessionEvents);
        },
        get phaseTimeline() { 
            const sessionEvents = currentSessionId ? events.filter(e => e.sessionId === currentSessionId) : events;
            return sessionEvents.filter(e => e.data.kind === 'phase_transition').map(e => e.data as PhaseTransitionData);
        },
        get agentActivities() { 
            const sessionEvents = currentSessionId ? events.filter(e => e.sessionId === currentSessionId) : events;
            return sessionEvents.filter(e => e.data.kind === 'agent_spoke').map(e => ({ ...e.data as AgentSpokeData, timestamp: e.timestamp, id: e.id }));
        },
        get skillLogs() { 
            const sessionEvents = currentSessionId ? events.filter(e => e.sessionId === currentSessionId) : events;
            return sessionEvents.filter(e => e.data.kind === 'skill_invoked').map(e => ({ ...e.data as SkillInvokedData, timestamp: e.timestamp, id: e.id }));
        },
        get conflictList() { 
            const sessionEvents = currentSessionId ? events.filter(e => e.sessionId === currentSessionId) : events;
            return sessionEvents.filter(e => e.data.kind === 'conflict_detected').map(e => e.data as ConflictDetectedData);
        },
        get decisionList() { 
            const sessionEvents = currentSessionId ? events.filter(e => e.sessionId === currentSessionId) : events;
            return sessionEvents.filter(e => e.data.kind === 'decision_made').map(e => ({ ...e.data as DecisionMadeData, timestamp: e.timestamp, id: e.id }));
        },
        get evidenceList() { 
            const sessionEvents = currentSessionId ? events.filter(e => e.sessionId === currentSessionId) : events;
            return sessionEvents.filter(e => e.data.kind === 'evidence_added').map(e => e.data as EvidenceAddedData);
        },
        get interventionList() { 
            const sessionEvents = currentSessionId ? events.filter(e => e.sessionId === currentSessionId) : events;
            return sessionEvents.filter(e => e.data.kind === 'user_intervention').map(e => ({ ...e.data as UserInterventionData, timestamp: e.timestamp, id: e.id }));
        },
        get errorList() { 
            const sessionEvents = currentSessionId ? events.filter(e => e.sessionId === currentSessionId) : events;
            return sessionEvents.filter(e => e.data.kind === 'error_occurred').map(e => ({ ...e.data as ErrorOccurredData, timestamp: e.timestamp, id: e.id }));
        },
        get causalChain() { 
            const sessionEvents = currentSessionId ? events.filter(e => e.sessionId === currentSessionId) : events;
            const chain: Array<{
                id: string;
                timestamp: number;
                type: AuditEventType;
                agentId: string;
                agentName: string;
                phase: string;
                summary: string;
                detail: string;
            }> = [];

            for (const event of sessionEvents) {
                const d = event.data;
                switch (d.kind) {
                    case 'phase_transition':
                        chain.push({
                            id: event.id,
                            timestamp: event.timestamp,
                            type: event.type,
                            agentId: '',
                            agentName: '协同调度中枢',
                            phase: d.toPhase,
                            summary: `阶段演进 → ${d.phaseLabel}`,
                            detail: `从 ${d.fromPhase ?? '初始'} 进入 ${d.toPhase}`,
                        });
                        break;
                    case 'agent_spoke':
                        chain.push({
                            id: event.id,
                            timestamp: event.timestamp,
                            type: event.type,
                            agentId: d.agentId,
                            agentName: d.agentName,
                            phase: d.phase,
                            summary: d.contentSummary,
                            detail: d.contentFull,
                        });
                        break;
                    case 'decision_made':
                        chain.push({
                            id: event.id,
                            timestamp: event.timestamp,
                            type: event.type,
                            agentId: d.deciderAgentId,
                            agentName: d.deciderAgentName,
                            phase: '仲裁决断',
                            summary: `终审决断: ${d.summary}`,
                            detail: d.reasoning,
                        });
                        break;
                    case 'conflict_detected':
                        chain.push({
                            id: event.id,
                            timestamp: event.timestamp,
                            type: event.type,
                            agentId: 'evidence_scout',
                            agentName: '求证者',
                            phase: '焦点萃取',
                            summary: `两难焦点: ${d.topic}`,
                            detail: `${d.sideAView} vs ${d.sideBView} (权衡: ${d.tradeOff})`,
                        });
                        break;
                    case 'evidence_added':
                        chain.push({
                            id: event.id,
                            timestamp: event.timestamp,
                            type: event.type,
                            agentId: d.addedByAgentId,
                            agentName: '求证者',
                            phase: '基准校准',
                            summary: `行业实证: ${d.source}`,
                            detail: `${d.fact} (指导: ${d.impact})`,
                        });
                        break;
                    case 'user_intervention':
                        chain.push({
                            id: event.id,
                            timestamp: event.timestamp,
                            type: event.type,
                            agentId: '',
                            agentName: '用户专家',
                            phase: d.targetPhase ?? '',
                            summary: `指令介入: ${d.interventionType}`,
                            detail: d.content,
                        });
                        break;
                }
            }

            return chain;
        },
        get candidatePaths() { 
            const sessionEvents = currentSessionId ? events.filter(e => e.sessionId === currentSessionId) : events;
            const pathsMap = new Map<string, ExtractedCandidatePath>();
            for (const event of sessionEvents) {
                if (event.data.kind === 'candidate_paths_extracted') {
                    for (const p of event.data.paths) {
                        pathsMap.set(p.id, p);
                    }
                }
            }
            return Array.from(pathsMap.values());
        },
        get vulnerabilities() { 
            const sessionEvents = currentSessionId ? events.filter(e => e.sessionId === currentSessionId) : events;
            const vulnMap = new Map<string, ExtractedVulnerability>();
            for (const event of sessionEvents) {
                if (event.data.kind === 'vulnerabilities_logged') {
                    for (const v of event.data.vulnerabilities) {
                        vulnMap.set(v.id, v);
                    }
                }
            }
            return Array.from(vulnMap.values());
        },
        get dodTasks() { 
            const sessionEvents = currentSessionId ? events.filter(e => e.sessionId === currentSessionId) : events;
            const taskMap = new Map<string, ExecutableDoDTask>();
            for (const event of sessionEvents) {
                if (event.data.kind === 'dod_tasks_created') {
                    for (const t of event.data.tasks) {
                        const isCompleted = dodTaskStates[t.id] ?? t.completed;
                        taskMap.set(t.id, { ...t, completed: isCompleted });
                    }
                }
            }
            return Array.from(taskMap.values());
        },
        get interAgentComms() { return interAgentComms; },

        // ─── Session Management ─────────────────────────────────────────
        setSession(sessionId: string) {
            currentSessionId = sessionId;
        },

        toggleDoDTask(taskId: string, completed?: boolean) {
            const current = dodTaskStates[taskId] ?? false;
            const next = completed !== undefined ? completed : !current;
            dodTaskStates[taskId] = next;
            persistDoDStates(dodTaskStates);
            this.emit('dod_task_toggled', {
                kind: 'dod_task_toggled',
                taskId,
                completed: next
            });
        },

        // ─── Event Emission ─────────────────────────────────────────────
        emit(type: AuditEventType, data: AuditEventData, sessionId?: string) {
            const event: AuditEvent = {
                id: generateEventId(),
                type,
                timestamp: Date.now(),
                sessionId: sessionId ?? currentSessionId ?? 'unknown',
                data,
            };
            events = [...events, event];
            for (const listener of listeners) {
                try { listener(event); } catch { /* non-blocking */ }
            }
            return event.id;
        },

        // ─── Subscription ───────────────────────────────────────────────
        subscribe(listener: AuditEventListener): () => void {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },

        // ─── Utilities ──────────────────────────────────────────────────
        getEventsForSession(sessionId: string): AuditEvent[] {
            return events.filter(e => e.sessionId === sessionId);
        },

        getEventsByType(type: AuditEventType): AuditEvent[] {
            const sid = currentSessionId;
            return sid
                ? events.filter(e => e.sessionId === sid && e.type === type)
                : [];
        },

        clearSession(sessionId: string) {
            events = events.filter(e => e.sessionId !== sessionId);
        },

        clearAll() {
            events = [];
            dodTaskStates = {};
            currentSessionId = null;
        },

        /**
         * Load events from IndexedDB (called on init)
         */
        loadEvents(loaded: AuditEvent[]) {
            events = loaded;
        },

        /**
         * Export current session events for persistence or download.
         */
        exportSessionEvents(sessionId?: string): AuditEvent[] {
            const sid = sessionId ?? currentSessionId;
            return sid ? events.filter(e => e.sessionId === sid) : [];
        },
    };
}

export const auditEventBus = createAuditEventBus();
