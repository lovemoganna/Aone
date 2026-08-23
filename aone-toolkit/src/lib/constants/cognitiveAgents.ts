/**
 * cognitiveAgents.ts
 * 
 * Single Source of Truth for Cognitive Agent metadata, role descriptions,
 * visual styling, capabilities, squad presets, and phase resolution.
 */

export interface CognitiveAgentMeta {
    id: string;
    alias: string;
    name: string;
    role: string;
    roleTitle: string;
    description: string;
    icon: string;
    color: string;
    colorClasses: {
        bg: string;
        text: string;
        border: string;
        glow: string;
        bgSoft: string;
        borderSoft: string;
        borderLight: string;
        borderDark: string;
        bgLight: string;
        bgDark: string;
        gradient: string;
    };
    capabilities: string[];
    defaultPhase?: 'decompose' | 'analyze' | 'challenge' | 'converge' | 'deliver';
    topology: {
        inputSource: string;
        mission: string;
        deliverable: string;
        activeAction: string;
    };
}

export const COGNITIVE_AGENTS: Record<string, CognitiveAgentMeta> = {
    decomposer: {
        id: 'decomposer',
        alias: '拆局者',
        name: '拆局者 (Decomposer)',
        role: '结构化拆解与架构剖析',
        roleTitle: '结构拆解与架构',
        description: '按 MECE 原则将模糊混沌的困境拆解为互不重叠的问题树与因果拓扑。',
        icon: 'Search',
        color: '#FF6B35',
        colorClasses: {
            bg: 'bg-orange-500',
            text: 'text-orange-600 dark:text-orange-400',
            border: 'border-orange-200 dark:border-orange-800',
            glow: 'shadow-orange-500/20',
            bgSoft: 'bg-orange-50/60 dark:bg-orange-950/20',
            borderSoft: 'border-orange-200/80 dark:border-orange-900/50',
            borderLight: 'border-orange-200',
            borderDark: 'dark:border-orange-900/60',
            bgLight: 'bg-orange-50/70',
            bgDark: 'dark:bg-orange-950/30',
            gradient: 'from-orange-500 to-red-500',
        },
        capabilities: ['decompose', 'reframe', 'structure_analysis'],
        defaultPhase: 'decompose',
        topology: {
            inputSource: '用户原始任务诉求与历史上下文',
            mission: 'MECE 原取拆解核心问题边界与子命题',
            deliverable: 'MECE 逻辑结构树与关键假设',
            activeAction: '正在结构化拆解核心问题边界与逻辑层级...',
        },
    },
    calculator: {
        id: 'calculator',
        alias: '算账的',
        name: '算账的 (Calculator)',
        role: '量化权衡与边际精算',
        roleTitle: '量化精算与建模',
        description: '将各种选择转化为权重打分矩阵、隐性代价清单与 ROI 经济学账本。',
        icon: 'Scale',
        color: '#2EC4B6',
        colorClasses: {
            bg: 'bg-teal-500',
            text: 'text-teal-600 dark:text-teal-400',
            border: 'border-teal-200 dark:border-teal-800',
            glow: 'shadow-teal-500/20',
            bgSoft: 'bg-teal-50/60 dark:bg-teal-950/20',
            borderSoft: 'border-teal-200/80 dark:border-teal-900/50',
            borderLight: 'border-teal-200',
            borderDark: 'dark:border-teal-900/60',
            bgLight: 'bg-teal-50/70',
            bgDark: 'dark:bg-teal-950/30',
            gradient: 'from-teal-500 to-cyan-500',
        },
        capabilities: ['decision_matrix', 'resource_audit', 'roi_calculation'],
        defaultPhase: 'analyze',
        topology: {
            inputSource: '拆局者的结构树与候选方案列表',
            mission: '4D 收益-成本-风险量化建模与 ROI 精算',
            deliverable: '4D 决策量化矩阵与边际收益分析',
            activeAction: '正在量化投入产出比与隐性迁移成本...',
        },
    },
    pathfinder: {
        id: 'pathfinder',
        alias: '找路的',
        name: '找路的 (Pathfinder)',
        role: '破局探索与敏捷假设',
        roleTitle: '敏捷破局与创新',
        description: '打破非此即彼的僵局，寻找非线性突破路径与低成本 MVP 验证点。',
        icon: 'Compass',
        color: '#E8C547',
        colorClasses: {
            bg: 'bg-amber-500',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-200 dark:border-amber-800',
            glow: 'shadow-amber-500/20',
            bgSoft: 'bg-amber-50/60 dark:bg-amber-950/20',
            borderSoft: 'border-amber-200/80 dark:border-amber-900/50',
            borderLight: 'border-amber-200',
            borderDark: 'dark:border-amber-900/60',
            bgLight: 'bg-amber-50/70',
            bgDark: 'dark:bg-amber-950/30',
            gradient: 'from-amber-500 to-yellow-500',
        },
        capabilities: ['reframe', 'breakthrough_discovery', 'mvp_design'],
        topology: {
            inputSource: '核心瓶颈、约束条件与死局假象',
            mission: '破除思维定势，寻找非线性突破路径',
            deliverable: '非常规突破假设与低成本验证方案',
            activeAction: '正在寻找非常规破局路径与假设验证点...',
        },
    },
    stress_tester: {
        id: 'stress_tester',
        alias: '兜底的',
        name: '兜底的 (Stress Tester)',
        role: '审慎风控与极限界限',
        roleTitle: '极限风控与防御',
        description: '推演黑天鹅与系统崩溃链，设计刚性防御熔断阈值与后备底牌。',
        icon: 'ShieldAlert',
        color: '#E11D48',
        colorClasses: {
            bg: 'bg-rose-600',
            text: 'text-rose-600 dark:text-rose-400',
            border: 'border-rose-200 dark:border-rose-800',
            glow: 'shadow-rose-500/20',
            bgSoft: 'bg-rose-50/60 dark:bg-rose-950/20',
            borderSoft: 'border-rose-200/80 dark:border-rose-900/50',
            borderLight: 'border-rose-200',
            borderDark: 'dark:border-rose-900/60',
            bgLight: 'bg-rose-50/70',
            bgDark: 'dark:bg-rose-950/30',
            gradient: 'from-rose-500 to-purple-500',
        },
        capabilities: ['stress_test', 'falsification', 'risk_mitigation'],
        defaultPhase: 'challenge',
        topology: {
            inputSource: '候选推进路径与核心依赖假设',
            mission: '极限压力测试与黑天鹅崩塌链预警',
            deliverable: '高危漏洞台账与刚性止损熔断线',
            activeAction: '正在推演系统崩溃链与刚性防御底牌...',
        },
    },
    closer: {
        id: 'closer',
        alias: '收网的',
        name: '收网的 (Closer)',
        role: '敏捷交付与执行收网',
        roleTitle: '敏捷交付与收网',
        description: '将推演结论转化为具有量化验收标准（DoD）的 72h-7d 落地执行工单。',
        icon: 'CheckSquare',
        color: '#20BF55',
        colorClasses: {
            bg: 'bg-emerald-500',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-200 dark:border-emerald-800',
            glow: 'shadow-emerald-500/20',
            bgSoft: 'bg-emerald-50/60 dark:bg-emerald-950/20',
            borderSoft: 'border-emerald-200/80 dark:border-emerald-900/50',
            borderLight: 'border-emerald-200',
            borderDark: 'dark:border-emerald-900/60',
            bgLight: 'bg-emerald-50/70',
            bgDark: 'dark:bg-emerald-950/30',
            gradient: 'from-green-500 to-emerald-500',
        },
        capabilities: ['action_list', 'dod_generation', 'delivery_tracking'],
        defaultPhase: 'deliver',
        topology: {
            inputSource: '仲裁决断令与选定主干路线',
            mission: '将决断转化为 72h / 7d / 30d 可验收工单',
            deliverable: '带责任人与验收准则 (DoD) 的落地工单',
            activeAction: '正在生成 72h-7d-30d 落地工单与验收标准...',
        },
    },
    challenger: {
        id: 'challenger',
        alias: '辩驳官',
        name: '辩驳官 (Challenger)',
        role: '批判审查与证伪攻击',
        roleTitle: '极限证伪与辩驳',
        description: '专门刺破最脆弱的前提假设，高强度进行对抗挑刺与群体盲从审查。',
        icon: 'Swords',
        color: '#E11D48',
        colorClasses: {
            bg: 'bg-rose-500',
            text: 'text-rose-600 dark:text-rose-400',
            border: 'border-rose-200 dark:border-rose-800',
            glow: 'shadow-rose-500/20',
            bgSoft: 'bg-rose-50/60 dark:bg-rose-950/20',
            borderSoft: 'border-rose-200/80 dark:border-rose-900/50',
            borderLight: 'border-rose-200',
            borderDark: 'dark:border-rose-900/60',
            bgLight: 'bg-rose-50/70',
            bgDark: 'dark:bg-rose-950/30',
            gradient: 'from-rose-500 to-red-600',
        },
        capabilities: ['falsification', 'red_team_attack', 'premise_check'],
        topology: {
            inputSource: '对方阵营方案报告与核心立论',
            mission: '极限证伪攻击与群体盲从破除',
            deliverable: '反例刺破清单与逻辑死穴审查',
            activeAction: '正在发起极限证伪攻击与漏洞审查...',
        },
    },
    evidence_scout: {
        id: 'evidence_scout',
        alias: '求证者',
        name: '求证者 (Evidence Scout)',
        role: '客观基准与实证核验',
        roleTitle: '实证核验与基准',
        description: '调取行业基准数据、先例与统计概率，以客观事实锚定两难分歧。',
        icon: 'Search',
        color: '#0284C7',
        colorClasses: {
            bg: 'bg-sky-500',
            text: 'text-sky-600 dark:text-sky-400',
            border: 'border-sky-200 dark:border-sky-800',
            glow: 'shadow-sky-500/20',
            bgSoft: 'bg-sky-50/60 dark:bg-sky-950/20',
            borderSoft: 'border-sky-200/80 dark:border-sky-900/50',
            borderLight: 'border-sky-200',
            borderDark: 'dark:border-sky-900/60',
            bgLight: 'bg-sky-50/70',
            bgDark: 'dark:bg-sky-950/30',
            gradient: 'from-sky-500 to-blue-600',
        },
        capabilities: ['empirical_grounding', 'benchmark_lookup', 'conflict_extraction'],
        topology: {
            inputSource: '红蓝双方对峙分歧与两难焦点',
            mission: '调取行业基准指标与历史同类先例',
            deliverable: '客观基准锚点与事实校验报告',
            activeAction: '正在调取行业基准数据与先例验证...',
        },
    },
    synthesizer: {
        id: 'synthesizer',
        alias: '裁判官',
        name: '裁判官 (Synthesizer)',
        role: '冲突仲裁与终审决策令',
        roleTitle: '终审仲裁与决策',
        description: '在撕扯交锋中权衡取舍，宣布终审采纳路线并击毙伪方案。',
        icon: 'Crown',
        color: '#D97706',
        colorClasses: {
            bg: 'bg-amber-600',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-300 dark:border-amber-700',
            glow: 'shadow-amber-500/25',
            bgSoft: 'bg-amber-50/70 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-amber-950/40',
            borderSoft: 'border-amber-300 dark:border-amber-500/70',
            borderLight: 'border-amber-200',
            borderDark: 'dark:border-amber-900/60',
            bgLight: 'bg-amber-50/70',
            bgDark: 'dark:bg-amber-950/30',
            gradient: 'from-amber-500 to-orange-600',
        },
        capabilities: ['arbitration', 'verdict_synthesis', 'path_selection'],
        defaultPhase: 'converge',
        topology: {
            inputSource: '各方量化数据、漏洞审查与客观实证',
            mission: '高置信度终审裁决与伪路径击毙',
            deliverable: '具备法律级严密性的终审裁决令',
            activeAction: '正在权衡取舍并签署终审裁决令...',
        },
    },
    coordinator: {
        id: 'coordinator',
        alias: '调度中枢',
        name: '调度协调中枢 (Coordinator)',
        role: '意图解析与小队协同编排',
        roleTitle: '协同编排中枢',
        description: '解析用户诉求、识别决策场景并动态调度各认知专家。',
        icon: 'Bot',
        color: '#6366F1',
        colorClasses: {
            bg: 'bg-indigo-500',
            text: 'text-indigo-600 dark:text-indigo-400',
            border: 'border-indigo-200 dark:border-indigo-800',
            glow: 'shadow-indigo-500/20',
            bgSoft: 'bg-indigo-50/60 dark:bg-indigo-950/30',
            borderSoft: 'border-indigo-200/90 dark:border-indigo-800/60',
            borderLight: 'border-indigo-200',
            borderDark: 'dark:border-indigo-900/60',
            bgLight: 'bg-indigo-50/70',
            bgDark: 'dark:bg-indigo-950/30',
            gradient: 'from-indigo-500 to-purple-600',
        },
        capabilities: ['orchestration', 'intent_routing', 'strategy_planning'],
        topology: {
            inputSource: '用户自然语言输入',
            mission: '意图解构与跨专家工序规划',
            deliverable: '执行策略规划与门禁工序',
            activeAction: '正在解析任务意图并编排协同工序...',
        },
    },
    mentor_sage: {
        id: 'mentor_sage',
        alias: '智者导师',
        name: '智者导师 Agent',
        role: '全局指导与战略框架',
        roleTitle: '战略导师',
        description: '提供宏观视角、底层思维模型与长期战略启发。',
        icon: 'Sparkles',
        color: '#6366F1',
        colorClasses: {
            bg: 'bg-indigo-500',
            text: 'text-indigo-600 dark:text-indigo-400',
            border: 'border-indigo-200 dark:border-indigo-800',
            glow: 'shadow-indigo-500/20',
            bgSoft: 'bg-indigo-50/60 dark:bg-indigo-950/20',
            borderSoft: 'border-indigo-200/80 dark:border-indigo-900/50',
            borderLight: 'border-indigo-200',
            borderDark: 'dark:border-indigo-900/60',
            bgLight: 'bg-indigo-50/70',
            bgDark: 'dark:bg-indigo-950/30',
            gradient: 'from-indigo-500 to-blue-600',
        },
        capabilities: ['mentorship', 'strategic_framing'],
        topology: {
            inputSource: '复杂战略议题',
            mission: '建立战略思考模型',
            deliverable: '高维战略框架',
            activeAction: '正在构建高维战略框架...',
        },
    },
    analytic_expert: {
        id: 'analytic_expert',
        alias: '理性分析',
        name: '理性分析 Agent',
        role: '指标建模与归因分析',
        roleTitle: '数据分析专家',
        description: '提供严谨的数据因果建模与指标敏感度分析。',
        icon: 'Scale',
        color: '#0EA5E9',
        colorClasses: {
            bg: 'bg-sky-500',
            text: 'text-sky-600 dark:text-sky-400',
            border: 'border-sky-200 dark:border-sky-800',
            glow: 'shadow-sky-500/20',
            bgSoft: 'bg-sky-50/60 dark:bg-sky-950/20',
            borderSoft: 'border-sky-200/80 dark:border-sky-900/50',
            borderLight: 'border-sky-200',
            borderDark: 'dark:border-sky-900/60',
            bgLight: 'bg-sky-50/70',
            bgDark: 'dark:bg-indigo-950/30',
            gradient: 'from-sky-500 to-cyan-600',
        },
        capabilities: ['data_modeling', 'attribution'],
        topology: {
            inputSource: '业务数据与指标体系',
            mission: '归因推演与敏感度量化',
            deliverable: '数据因果推演报告',
            activeAction: '正在进行数据因果建模与敏感度分析...',
        },
    },
    action_coach: {
        id: 'action_coach',
        alias: '行动教练',
        name: '行动教练 Agent',
        role: '落地清单与敏捷执行',
        roleTitle: '执行教练',
        description: '拆解阻力因素，制定最小阻力执行步骤与督导反馈。',
        icon: 'CheckSquare',
        color: '#10B981',
        colorClasses: {
            bg: 'bg-emerald-500',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-200 dark:border-emerald-800',
            glow: 'shadow-emerald-500/20',
            bgSoft: 'bg-emerald-50/60 dark:bg-emerald-950/20',
            borderSoft: 'border-emerald-200/80 dark:border-emerald-900/50',
            borderLight: 'border-emerald-200',
            borderDark: 'dark:border-emerald-900/60',
            bgLight: 'bg-emerald-50/70',
            bgDark: 'dark:bg-emerald-950/30',
            gradient: 'from-emerald-500 to-teal-600',
        },
        capabilities: ['action_list', 'coaching'],
        topology: {
            inputSource: '行动目标与卡点',
            mission: '消除执行阻力',
            deliverable: '可立即执行动作清单',
            activeAction: '正在拆解落地行动阻力...',
        },
    },
};

// Aliases for built-in IDs
export const BUILTIN_AGENT_ALIASES: Record<string, string> = {
    builtin_mentor_agent: 'mentor_sage',
    builtin_analyst_agent: 'analytic_expert',
    builtin_coach_agent: 'action_coach',
};

// ─── Squad Presets ──────────────────────────────────────────────────────────

export interface SquadPreset {
    id: string;
    name: string;
    description: string;
    tag: string;
    agentIds: string[];
    orchestrationType: 'sequential' | 'parallel' | 'debate' | 'round_robin';
}

export const SQUAD_PRESETS: SquadPreset[] = [
    {
        id: 'preset_attack_breakthrough',
        name: '攻坚突击战队',
        description: '结构拆解 → 量化精算 → 破局假设 → 交付落地，适用于复杂技术重构与核心业务攻坚。',
        tag: '推荐 · 业务与架构重构',
        agentIds: ['decomposer', 'calculator', 'pathfinder', 'closer'],
        orchestrationType: 'sequential',
    },
    {
        id: 'preset_supreme_judgment',
        name: '重大决策审判战队',
        description: '量化精算 → 极限证伪 → 终审仲裁，适用于重大商业选型、资源倾斜与合规审查。',
        tag: '高风险 · 战略定夺',
        agentIds: ['calculator', 'challenger', 'synthesizer'],
        orchestrationType: 'debate',
    },
    {
        id: 'preset_agile_mvp',
        name: '敏捷破局战队',
        description: '结构拆解 → 破局试水 → 实证校准 → 落地收网，适用于新方向探索与低成本验证。',
        tag: '创新 · MVP 试水',
        agentIds: ['decomposer', 'pathfinder', 'evidence_scout', 'closer'],
        orchestrationType: 'sequential',
    },
    {
        id: 'preset_five_dimensional_roundtable',
        name: '五维经典认知圆桌',
        description: '拆局者 → 算账的 → 找路的 → 兜底的 → 收网的，覆盖认知到落地的经典闭环。',
        tag: '经典全流程闭环',
        agentIds: ['decomposer', 'calculator', 'pathfinder', 'stress_tester', 'closer'],
        orchestrationType: 'sequential',
    },
];

// ─── Phase Capability Map & Fallback Defaults ───────────────────────────────

export const PHASE_CAPABILITY_MAP: Record<string, string[]> = {
    decompose: ['decompose', 'reframe', 'structure_analysis', 'analysis'],
    analyze: ['decision_matrix', 'resource_audit', 'roi_calculation', 'data_modeling'],
    challenge: ['stress_test', 'falsification', 'risk_mitigation', 'red_team_attack', 'premise_check'],
    converge: ['arbitration', 'verdict_synthesis', 'path_selection', 'mentorship'],
    deliver: ['action_list', 'dod_generation', 'delivery_tracking', 'coaching'],
};

export const PHASE_DEFAULT_AGENTS: Record<string, string> = {
    decompose: 'decomposer',
    analyze: 'calculator',
    challenge: 'stress_tester',
    converge: 'synthesizer',
    deliver: 'closer',
};

// ─── Helper Functions ───────────────────────────────────────────────────────

export function getAgentMeta(id: string): CognitiveAgentMeta {
    const canonicalId = BUILTIN_AGENT_ALIASES[id] || id;
    if (COGNITIVE_AGENTS[canonicalId]) {
        return COGNITIVE_AGENTS[canonicalId];
    }
    // Fallback for custom agents
    return {
        id,
        alias: id,
        name: id,
        role: '专业认知专家',
        roleTitle: '领域专家',
        description: '自定义专业认知智能体。',
        icon: 'Bot',
        color: '#6366F1',
        colorClasses: {
            bg: 'bg-indigo-500',
            text: 'text-indigo-600 dark:text-indigo-400',
            border: 'border-indigo-200 dark:border-indigo-800',
            glow: 'shadow-indigo-500/20',
            bgSoft: 'bg-indigo-50/60 dark:bg-indigo-950/20',
            borderSoft: 'border-indigo-200/80 dark:border-indigo-900/50',
            borderLight: 'border-indigo-200',
            borderDark: 'dark:border-indigo-900/60',
            bgLight: 'bg-indigo-50/70',
            bgDark: 'dark:bg-indigo-950/30',
            gradient: 'from-indigo-500 to-purple-600',
        },
        capabilities: ['analysis', 'action_list'],
        topology: {
            inputSource: '上游阶段输出',
            mission: '执行专业领域分析与建议',
            deliverable: '结构化交付物',
            activeAction: '正在执行专业分析...',
        },
    };
}

export function getAgentAlias(id: string, fallback?: string): string {
    const meta = getAgentMeta(id);
    return meta?.alias || fallback || id;
}

export function getAgentDisplayName(id: string, fallback?: string): string {
    const meta = getAgentMeta(id);
    return meta?.name || fallback || id;
}

export function getAgentRole(id: string, fallback?: string): string {
    const meta = getAgentMeta(id);
    return meta?.role || fallback || '认知决策专家';
}

export function getAgentColor(id: string) {
    const meta = getAgentMeta(id);
    return meta.colorClasses;
}

/**
 * Dynamically resolves the best active agent for a collaboration phase.
 * 1. Checks if the default canonical agent for this phase is active.
 * 2. Checks if any active agent has a matching capability.
 * 3. Falls back to round-robin assignment from active agents.
 */
export function resolvePhaseAgent(
    phase: 'decompose' | 'analyze' | 'challenge' | 'converge' | 'deliver',
    activeAgentIds: string[],
    getAgentFn?: (id: string) => { capabilities?: string[]; skills?: string[]; [key: string]: any } | undefined
): string {
    if (!activeAgentIds || activeAgentIds.length === 0) {
        return PHASE_DEFAULT_AGENTS[phase] || 'decomposer';
    }

    const defaultAgent = PHASE_DEFAULT_AGENTS[phase];
    if (activeAgentIds.includes(defaultAgent)) {
        return defaultAgent;
    }

    // Special check for challenge phase (both stress_tester and challenger match)
    if (phase === 'challenge') {
        const matchingChallenger = activeAgentIds.find(id => id === 'challenger' || id === 'stress_tester');
        if (matchingChallenger) return matchingChallenger;
    }

    // Match by capability tag
    const requiredCaps = PHASE_CAPABILITY_MAP[phase] || [];
    for (const id of activeAgentIds) {
        const meta = getAgentMeta(id);
        const hasStaticMatch = meta.capabilities?.some(c => requiredCaps.includes(c));
        if (hasStaticMatch) return id;

        if (getAgentFn) {
            const dynamicAgent = getAgentFn(id);
            const dynamicCaps = dynamicAgent?.capabilities || dynamicAgent?.skills;
            if (dynamicCaps?.some((c: string) => requiredCaps.includes(c))) {
                return id;
            }
        }
    }

    // Positional fallback: map phase index to active agent
    const phaseOrder = ['decompose', 'analyze', 'challenge', 'converge', 'deliver'];
    const phaseIdx = phaseOrder.indexOf(phase);
    const assigned = activeAgentIds[phaseIdx % activeAgentIds.length];
    return assigned || defaultAgent;
}
