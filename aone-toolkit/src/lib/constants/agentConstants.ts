/**
 * agentConstants.ts
 * 
 * Unified agent display metadata, skill mappings, and color definitions.
 * Consolidates duplicated constants from +page.svelte, ChatArea.svelte,
 * MessageBubble.svelte, lobby/+page.svelte, roundtable/+page.svelte.
 */

// ─── Agent Display Info ─────────────────────────────────────────────────────

export interface AgentDisplayInfo {
    name: string;
    role: string;
    color: string;
    bgSoft: string;
    border: string;
}

export const AGENT_DISPLAY_MAP: Record<string, AgentDisplayInfo> = {
    decomposer: {
        name: "拆局者 (Decomposer)",
        role: "结构化拆解与架构剖析",
        color: "#FF6B35",
        bgSoft: "bg-orange-50/60 dark:bg-orange-950/20",
        border: "border-orange-200/80 dark:border-orange-900/50"
    },
    calculator: {
        name: "算账的 (Calculator)",
        role: "量化权衡与边际精算",
        color: "#2EC4B6",
        bgSoft: "bg-teal-50/60 dark:bg-teal-950/20",
        border: "border-teal-200/80 dark:border-teal-900/50"
    },
    pathfinder: {
        name: "找路的 (Pathfinder)",
        role: "破局探索与敏捷假设",
        color: "#E8C547",
        bgSoft: "bg-amber-50/60 dark:bg-amber-950/20",
        border: "border-amber-200/80 dark:border-amber-900/50"
    },
    stress_tester: {
        name: "兜底的 (Stress Tester)",
        role: "审慎风控与极限界限",
        color: "#E11D48",
        bgSoft: "bg-rose-50/60 dark:bg-rose-950/20",
        border: "border-rose-200/80 dark:border-rose-900/50"
    },
    closer: {
        name: "收网的 (Closer)",
        role: "敏捷交付与执行收网",
        color: "#20BF55",
        bgSoft: "bg-emerald-50/60 dark:bg-emerald-950/20",
        border: "border-emerald-200/80 dark:border-emerald-900/50"
    },
    challenger: {
        name: "辩驳官 (Challenger)",
        role: "批判审查与证伪攻击",
        color: "#E11D48",
        bgSoft: "bg-rose-50/60 dark:bg-rose-950/20",
        border: "border-rose-200/80 dark:border-rose-900/50"
    },
    evidence_scout: {
        name: "求证者 (Evidence Scout)",
        role: "客观基准与实证核验",
        color: "#0284C7",
        bgSoft: "bg-sky-50/60 dark:bg-sky-950/20",
        border: "border-sky-200/80 dark:border-sky-900/50"
    },
    synthesizer: {
        name: "裁判官 (Synthesizer)",
        role: "冲突仲裁与终审决策令",
        color: "#D97706",
        bgSoft: "bg-amber-50/70 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-amber-950/40",
        border: "border-amber-300 dark:border-amber-500/70"
    },
    mentor_sage: {
        name: "智者导师",
        role: "人生导师与战略框架",
        color: "#6366F1",
        bgSoft: "bg-indigo-50/60 dark:bg-indigo-950/20",
        border: "border-indigo-200/80 dark:border-indigo-900/50"
    },
    builtin_mentor_agent: {
        name: "智者导师 Agent",
        role: "全局指导与战略框架",
        color: "#6366F1",
        bgSoft: "bg-indigo-50/60 dark:bg-indigo-950/20",
        border: "border-indigo-200/80 dark:border-indigo-900/50"
    },
    analytic_expert: {
        name: "理性分析专家",
        role: "逻辑推演与数据决策",
        color: "#0EA5E9",
        bgSoft: "bg-sky-50/60 dark:bg-sky-950/20",
        border: "border-sky-200/80 dark:border-sky-900/50"
    },
    builtin_analyst_agent: {
        name: "理性分析 Agent",
        role: "指标建模与归因分析",
        color: "#0EA5E9",
        bgSoft: "bg-sky-50/60 dark:bg-sky-950/20",
        border: "border-sky-200/80 dark:border-sky-900/50"
    },
    creative_innovator: {
        name: "创意创新者",
        role: "破局灵感与思维发散",
        color: "#F59E0B",
        bgSoft: "bg-amber-50/60 dark:bg-amber-950/20",
        border: "border-amber-200/80 dark:border-amber-900/50"
    },
    action_coach: {
        name: "行动教练",
        role: "高效推进与执行督导",
        color: "#10B981",
        bgSoft: "bg-emerald-50/60 dark:bg-emerald-950/20",
        border: "border-emerald-200/80 dark:border-emerald-900/50"
    },
    builtin_coach_agent: {
        name: "行动教练 Agent",
        role: "落地清单与敏捷执行",
        color: "#10B981",
        bgSoft: "bg-emerald-50/60 dark:bg-emerald-950/20",
        border: "border-emerald-200/80 dark:border-emerald-900/50"
    },
    empathy_companion: {
        name: "共情陪伴者",
        role: "暖心倾听与情感支持",
        color: "#EC4899",
        bgSoft: "bg-pink-50/60 dark:bg-pink-950/20",
        border: "border-pink-200/80 dark:border-pink-900/50"
    },
    coordinator: {
        name: "调度协调中枢 (Coordinator)",
        role: "意图解析与小队协同编排",
        color: "#6366F1",
        bgSoft: "bg-indigo-50/60 dark:bg-indigo-950/30",
        border: "border-indigo-200/90 dark:border-indigo-800/60"
    },
    metaflow: {
        name: "元流程合成器",
        role: "方案综合与最终交付",
        color: "#6366F1",
        bgSoft: "bg-indigo-50/60 dark:bg-indigo-950/20",
        border: "border-indigo-200/80 dark:border-indigo-900/50"
    },
};

/**
 * Get the display name for an agent. Falls back to provided fallback or the agent ID.
 */
export function getAgentDisplayName(id: string, fallback?: string): string {
    return AGENT_DISPLAY_MAP[id]?.name ?? fallback ?? id;
}

/**
 * Get the full display info for an agent.
 */
export function getAgentDisplay(id: string): AgentDisplayInfo | null {
    return AGENT_DISPLAY_MAP[id] ?? null;
}

// ─── Skill Mappings ─────────────────────────────────────────────────────────

export const SKILL_LABELS: Record<string, string> = {
    intent: "意图识别",
    scene: "场景匹配",
    strategy: "策略规划",
    decompose: "结构化拆解",
    decision_matrix: "决策矩阵",
    stress_test: "压力测试",
    resource_audit: "资源盘点",
    reframe: "思维重构",
    action_list: "行动清单",
};

export const SKILL_ALIASES: Record<string, string> = {
    decompose: "任务拆解",
    decision_matrix: "决策矩阵",
    stress_test: "风险测试",
    resource_audit: "资源盘点",
    reframe: "问题重构",
    action_list: "行动清单",
};

export const AGENT_ALIASES: Record<string, string> = {
    decomposer: "拆局者",
    calculator: "算账的",
    pathfinder: "找路的",
    stress_tester: "兜底的",
    closer: "收网的",
    challenger: "辩驳官",
    evidence_scout: "求证者",
    synthesizer: "裁判官",
    coordinator: "调度中枢",
};

/**
 * Fallback skill mappings when agent definitions don't specify skillIds.
 */
export const FALLBACK_SKILL_MAP: Record<string, string[]> = {
    decomposer: ["decompose"],
    calculator: ["decision_matrix", "resource_audit"],
    pathfinder: ["reframe"],
    stress_tester: ["stress_test"],
    closer: ["action_list"],
};

export const SKILL_COLOR_MAP: Record<string, string> = {
    decompose: "text-orange-500",
    decision_matrix: "text-teal-500",
    stress_test: "text-rose-500",
    resource_audit: "text-sky-500",
    reframe: "text-amber-500",
    action_list: "text-emerald-500",
};

// ─── Collaboration Phases ───────────────────────────────────────────────────

export type CollaborationPhase = 
    | 'decompose'
    | 'analyze'
    | 'challenge'
    | 'converge'
    | 'deliver';

export interface PhaseDefinition {
    id: CollaborationPhase;
    label: string;
    description: string;
    icon: string;
    primaryAgentId: string;
    color: string;
}

export const COLLABORATION_PHASES: PhaseDefinition[] = [
    {
        id: 'decompose',
        label: '拆解建模',
        description: '将复杂问题拆解为独立子模块，建立因果拓扑',
        icon: '🔍',
        primaryAgentId: 'decomposer',
        color: '#FF6B35',
    },
    {
        id: 'analyze',
        label: '量化分析',
        description: '对各方案进行量化权衡与代价精算',
        icon: '📊',
        primaryAgentId: 'calculator',
        color: '#2EC4B6',
    },
    {
        id: 'challenge',
        label: '证伪攻击',
        description: '对核心假设进行极限证伪与红军审查',
        icon: '⚔️',
        primaryAgentId: 'stress_tester',
        color: '#E11D48',
    },
    {
        id: 'converge',
        label: '收敛仲裁',
        description: '综合各方论据进行终审裁决与路径选择',
        icon: '⚖️',
        primaryAgentId: 'synthesizer',
        color: '#D97706',
    },
    {
        id: 'deliver',
        label: '交付落地',
        description: '将决策转化为可执行的 72h-7d 落地工单',
        icon: '🚀',
        primaryAgentId: 'closer',
        color: '#20BF55',
    },
];

// ─── Joint Warfare Stages ───────────────────────────────────────────────────

export type WarfareStage =
    | 'idle'
    | 'parallel_analysis'
    | 'cross_review'
    | 'conflict_detection'
    | 'evidence_grounding'
    | 'unified_arbitration'
    | 'overtime'
    | 'completed';

export interface WarfareStageInfo {
    id: WarfareStage;
    label: string;
    description: string;
    progress: number;
}

export const WARFARE_STAGES: WarfareStageInfo[] = [
    { id: 'parallel_analysis', label: '并行分析', description: '双方小队独立输出方案与风控报告', progress: 20 },
    { id: 'cross_review', label: '交叉审查', description: '双方互相质检对方输出，寻找逻辑软肋', progress: 40 },
    { id: 'conflict_detection', label: '冲突提取', description: '提取核心分歧点与认知偏差', progress: 60 },
    { id: 'evidence_grounding', label: '证据求证', description: '补充行业基准数据与历史先例', progress: 75 },
    { id: 'unified_arbitration', label: '统一裁决', description: '裁判官综合各方论据给出终审决策', progress: 90 },
    { id: 'overtime', label: '加时赛', description: '用户要求追加对抗轮次深化辩论', progress: 85 },
    { id: 'completed', label: '完成', description: '对抗推演与裁决已完成', progress: 100 },
];

/**
 * 估算文本 Token 消耗量（精确区分 CJK 汉字与 Latin 字符）
 * CJK 汉字通常占用约 1.5 ~ 2 tokens，英文/标点平均约 0.3 ~ 0.5 tokens
 */
export function estimateTokenCount(text: string | null | undefined): number {
    if (!text) return 0;
    const cjkChars = (text.match(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/g) || []).length;
    const nonCjkChars = text.length - cjkChars;
    return Math.max(1, Math.ceil(cjkChars * 1.5 + nonCjkChars * 0.35));
}

