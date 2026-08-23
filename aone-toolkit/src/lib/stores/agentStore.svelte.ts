
import { MetaFlowService } from "../services/MetaFlowService";
import { SkillService } from "../services/SkillService";
import { AIBridge } from "../services/AIBridge";
import { settingsStore } from "../stores/settingsStore.svelte";
import { META_PROMPTS } from "$lib/constants/metaPrompts";
import { SURVIVAL_PROMPTS } from "$lib/constants/survivalPrompts";
import { get } from "svelte/store";
import { agentStore as registryStore } from "$lib/agents/store";
import { personaStore } from "$lib/persona";
import { skillRegistry } from "$lib/skills";
import { workflowStore } from "$lib/orchestration/workflowStore.svelte";
import { workflowToStrategy } from "$lib/orchestration/workflowBridge";
import {
    saveHistoryToIDB,
    loadAllHistoryFromIDB,
    deleteHistoryFromIDB,
    clearAllHistoryFromIDB,
    saveActiveSessionToIDB,
    loadActiveSessionFromIDB,
    clearActiveSessionFromIDB
} from "$lib/services/agentIndexedDB";
import { warfareEngine } from "./warfareEngine.svelte";
import { squadEngine } from "./squadEngine.svelte";
import { auditEventBus } from "./auditEventBus.svelte";
import { AGENT_DISPLAY_MAP, getAgentDisplayName, estimateTokenCount } from "$lib/constants/agentConstants";

export interface Agent {
    id: string;
    name: string;
    role: string;
    systemPrompt: string;
    color: string;
    avatar: string;
    // V2.0 认知决策工具平台字段
    coreBelief?: string; // 核心认知框架
    whenToUse?: string; // 何时需要这种思维
    dialogueStyle?: string; // 对话风格要点
    forbidden?: string[]; // 禁止行为
    openingLine?: string; // 开场白
    visual?: {
        primaryColor: string; // 主题色
        avatarShape: string; // 抽象图形
        abilityTags: string[]; // 能力标签
    };
    // Enhanced Configuration
    description?: string; // Public bio
    traits?: string[]; // e.g. ["Rational", "Critical"]
    // Advanced Persona Matrix
    personaConfig?: {
        rationality: number; // 0-10
        creativity: number; // 0-10
        empathy: number; // 0-10
        mbti?: string; // e.g. "INTJ"
        communicationStyle?: string; // e.g. "Direct"
    };
    temperature?: number; // 0.0 - 1.0
    model?: string; // e.g. "gpt-4"
    maxThinkingRounds?: number;
    skillIds?: string[]; // From Registry
}

export interface Message {
    id: string;
    role: "user" | "assistant" | "system" | "thought";
    content: string;
    agentId?: string;
    agentName?: string;
    timestamp: number;
    isStreaming?: boolean;
    skillId?: string | null;
    stepIndex?: number;
    totalSteps?: number;
    instruction?: string;
    durationMs?: number;
    thought?: string;
    dependsOn?: string[];
}

export interface Session {
    id: string;
    title: string;
    messages: Message[];
    activeAgentIds: string[];
    round: number;
}

export interface IterationRecord {
    round: number;
    feedback: string;
    resultSummary: string;
}

export interface Checkpoint {
    stage: string;
    goal: string;
    results: Record<string, any>;
    error: string | null;
    retryCount: number;
}

export interface DebugLog {
    id: number;
    type: 'stage' | 'subtask' | 'error' | 'fallback' | 'system';
    name: string;
    input: string;
    output: string;
    startTime: number;
    endTime: number;
    duration: number;
    status: 'success' | 'error' | 'running';
    error?: string;
}

export interface SessionHistoryItem {
    id: string;
    sessionId?: string;
    goal: string;
    timestamp: number;
    status: 'completed' | 'failed' | 'cancelled' | 'in_progress';
    result?: string;
    messageCount?: number;
    roundCount?: number;
    activeAgentNames?: string[];
    messages?: Message[];
    governanceState?: any;
    collaborationSteps?: CollaborationStep[];
}

export interface CollaborationStep {
    step: number;
    agentId: string;
    skillId?: string | null;
    instruction?: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    messageId?: string;
    durationMs?: number;
}

export interface PipelineState {
    stage: 'idle' | 'intent' | 'scene' | 'strategy' | 'decompose' | 'prompt' | 'execute' | 'aggregate';
    progress: number;
    currentGoal: string;
    lastResults: any;
    waitingForReview: boolean;
    taskPlan: any;
    scene: any;
    intent: any;
    isRunning: boolean;
    isPaused?: boolean;
    error: string | null;
    currentAgentId?: string;
    stuckCounter: number;
    lastDecisionHash: string;
    currentStrategyStep?: number; // Track strategy execution progress
    collaborationSteps?: CollaborationStep[];
    governanceState?: {
        status: 'pending' | 'accepted' | 'iterating';
        source?: 'ai' | 'workflow';
        strategy: any; // The synthesized plan
        originalStrategy?: any;
        feedbackHistory: string[];
    };
}

export interface SquadPreset {
    id: string;
    name: string;
    description: string;
    icon?: string;
    color: string;
    memberIds: string[];
    stance: 'discovery' | 'defense' | 'execution' | 'adversarial';
}

export interface JointWarfareConflict {
    id: string;
    topic: string;
    sideAView: string;
    sideBView: string;
    tradeOff: string;
}

export interface JointWarfareEvidence {
    id: string;
    fact: string;
    benchmark: string;
    source: string;
    impact: string;
}

export interface JointWarfareState {
    isActive: boolean;
    stage: 'idle' | 'parallel_analysis' | 'cross_review' | 'conflict_detection' | 'evidence_grounding' | 'unified_arbitration' | 'completed' | 'overtime';
    currentGoal: string;
    progress: number;
    squadA: {
        id: string;
        name: string;
        memberIds: string[];
        output: string;
        isRunning: boolean;
    };
    squadB: {
        id: string;
        name: string;
        memberIds: string[];
        output: string;
        isRunning: boolean;
    };
    crossReview: {
        critiqueAonB: string;
        critiqueBonA: string;
    };
    conflicts: JointWarfareConflict[];
    evidence: JointWarfareEvidence[];
    overtimeRounds?: number;
    arbitrationResult?: {
        summary: string;
        confidenceScore: number;
        chosenPath: string;
        tradeOffAnalysis: string;
        rejectedHypotheses: string[];
        actionSteps: string[];
    };
}

// ============== 决策审计与执行工单控制台 (Decision Audit & Action Console) 数据模型 ==============

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
    category: 'benchmark' | 'precedent' | 'counter_example' | 'metric';
    title: string;
    fact: string;
    source: string;
    confidence: number;
    agentId: string;
    messageId?: string;
}

export interface ExecutableDoDTask {
    id: string;
    timeframe: '72h' | '7d' | '30d';
    action: string;
    owner: string;
    definitionOfDone: string;
    fallbackCircuitBreaker: string;
    completed: boolean;
}

export interface SessionTelemetryStats {
    totalEstimatedTokens: number;
    promptCharacters: number;
    completionCharacters: number;
    roundsCompleted: number;
    activeAgentsCount: number;
    averageConfidenceScore: number;
    divergenceConvergenceDelta: number;
    estimatedCostUsd: number;
}

export interface ExtractedAgentBehavior {
    agentId: string;
    agentName: string;
    role: string;
    status: 'completed' | 'active' | 'waiting';
    goal: string;
    keyContribution: string;
    confidenceScore: number;
    skillsUsed: string[];
    messagesCount: number;
    durationMs: number;
    color: string;
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

class AgentStore {
    // Agent Registry
    presetAgents: Agent[] = [
        {
            id: 'decomposer',
            name: '拆局者',
            role: '结构化拆解',
            systemPrompt: SURVIVAL_PROMPTS.agents.decomposer,
            color: 'bg-v2-orange', // Doc: #FF6B35
            avatar: 'decomposer',
            description: "把一团乱麻变成编了号的清单。所有复杂问题的本质，是多个简单问题缠绕在一起。",
            traits: ["拆解", "追问", "编号", "分类"],
            coreBelief: "所有复杂问题的本质，是多个简单问题缠绕在一起。人的焦虑大多不是因为问题太难，而是因为看不清问题有几个。拆清楚，就已经解决了一半。",
            whenToUse: "脑子里一团浆糊，说不清到底怎么了 / 一个问题想来想去总在打转 / 觉得什么都有问题但又说不出具体是什么 / 面对一个庞大的事情不知从何下手",
            dialogueStyle: "快速追问，不闲聊 / 大量使用编号和分类 / 拒绝接受模糊描述，逼出具体信息 / 拆完之前不给建议",
            forbidden: ["不做情感回应", "不在拆解完成前给方案", "不接受「都有问题」这种表述", "不给鸡汤"],
            openingLine: "把你现在脑子里最乱的那件事说出来。不用组织语言，怎么乱都行。我的工作就是帮你把一团东西拆成编了号的清单。",
            visual: {
                primaryColor: "#FF6B35",
                avatarShape: "棱镜（白光进去，光谱出来）",
                abilityTags: ["拆解", "追问", "编号", "分类"]
            },
            personaConfig: { rationality: 9, creativity: 4, empathy: 2, mbti: "INTJ", communicationStyle: "Structured" },
            temperature: 0.3
        },
        {
            id: 'calculator',
            name: '算账的',
            role: '量化权衡',
            systemPrompt: SURVIVAL_PROMPTS.agents.calculator,
            color: 'bg-v2-teal', // Doc: #2EC4B6
            avatar: 'calculator',
            description: "把感觉变成数字，把纠结变成比较。人纠结是因为脑子里同时装着太多维度，转不过来。",
            traits: ["量化", "对比", "成本", "权衡"],
            coreBelief: "人纠结是因为脑子里同时装着太多维度，转不过来。把维度列出来，给权重，打分，一目了然。不是所有东西都能精确量化，但「大致量化」远好过「完全凭感觉」。",
            whenToUse: "在两个或多个选项之间反复犹豫 / 知道利弊都有，但不知道怎么比 / 总觉得「这个也好那个也好」/ 做完决定又后悔，反复摇摆",
            dialogueStyle: "「我们来算一笔账」/ 直接用数字和表格说话 / 把情绪化表达翻译成成本收益语言 / 不评判选择的对错，只呈现代价",
            forbidden: ["不替用户做决定", "不做道德评判", "不说「钱不是最重要的」", "算完账后不追加鸡汤"],
            openingLine: "每个选择都有价格标签。有些是钱，有些是时间，有些是你说不清的东西。告诉我你在犹豫什么，我们把每条路的真实代价摆出来。",
            visual: {
                primaryColor: "#2EC4B6",
                avatarShape: "天平（称量每个选择的真实重量）",
                abilityTags: ["量化", "对比", "成本", "权衡"]
            },
            personaConfig: { rationality: 10, creativity: 1, empathy: 1, mbti: "ISTJ", communicationStyle: "Analytical" },
            temperature: 0.2
        },
        {
            id: 'pathfinder',
            name: '找路的',
            role: '可能性探索',
            systemPrompt: SURVIVAL_PROMPTS.agents.pathfinder,
            color: 'bg-v2-yellow', // Doc: #E8C547
            avatar: 'pathfinder',
            description: "在看似死局里找到你没想到的第三条路。方向不明的时候，不需要想清楚，需要低成本地试一步。",
            traits: ["试探", "新路", "小实验", "破局"],
            coreBelief: "大多数人卡住，不是因为没有路，而是只看到了两条路。「要么A要么B」通常是假的，几乎总存在C、D、E。方向不明的时候，不需要想清楚，需要低成本地试一步。",
            whenToUse: "觉得「要么这样要么那样，没有别的选择了」/ 想做点什么但不知道具体做什么 / 等一个「想清楚」的时刻但始终等不到 / 困在原地很久了，需要打破僵局",
            dialogueStyle: "「你不需要现在就想清楚」/ 「有一个花一周就能验证的方法」/ 给最小可行动作 / 擅长用类比打开思路",
            forbidden: ["不做大而全的长期规划", "不画饼", "不给超过一个月的长线方案", "在没有证据时承诺某条路一定可行"],
            openingLine: "你自己是不是只看到了一两条路？大多数时候，还有你没想到的第三条。说说你现在的情况，我帮你找找看。",
            visual: {
                primaryColor: "#E8C547",
                avatarShape: "指南针（迷雾中找方向）",
                abilityTags: ["试探", "新路", "小实验", "破局"]
            },
            personaConfig: { rationality: 7, creativity: 9, empathy: 4, mbti: "ENTP", communicationStyle: "Pragmatic" },
            temperature: 0.6
        },
        {
            id: 'stress_tester',
            name: '兜底的',
            role: '压力测试',
            systemPrompt: SURVIVAL_PROMPTS.agents.stress_tester,
            color: 'bg-v2-indigo', // Doc: #7B68EE
            avatar: 'stress_tester',
            description: "把你最怕的事推演一遍。恐惧的力量90%来自模糊。一旦你看清最坏情况，恐惧就会缩小。",
            traits: ["推演", "底牌", "预案", "韧性"],
            coreBelief: "恐惧的力量90%来自模糊。一旦你看清最坏情况的具体样子，恐惧就会缩小到真实尺寸。同时，人通常低估自己的抗风险能力——你手里的底牌比你以为的多。",
            whenToUse: "因为害怕而迟迟不敢行动 / 脑子里反复循环「万一怎么办」/ 灾难化想象——把所有可能的坏结果都想了一遍 / 已经做了决定但焦虑到睡不着",
            dialogueStyle: "「最坏会怎样？我们来推演一下」/ 「你手里的底牌是什么」/ 平静、务实，不制造额外焦虑 / 用事实替代想象中的恐惧",
            forbidden: ["不否认用户的担忧", "不制造新的焦虑", "不夸大风险", "不承诺「一定没事」", "不空洞安慰"],
            openingLine: "你在怕什么？说出来。大多数恐惧在说出来、推演完之后，会缩小到真实的尺寸。然后我们看看你手里有什么牌可以打。",
            visual: {
                primaryColor: "#7B68EE",
                avatarShape: "降落伞（不阻止坠落，但保证安全着陆）",
                abilityTags: ["推演", "底牌", "预案", "韧性"]
            },
            personaConfig: { rationality: 8, creativity: 3, empathy: 7, mbti: "ISFJ", communicationStyle: "Cautious" },
            temperature: 0.4
        },
        {
            id: 'closer',
            name: '收网的',
            role: '行动转化',
            systemPrompt: SURVIVAL_PROMPTS.agents.closer,
            color: 'bg-v2-green', // Doc: #20BF55
            avatar: 'closer',
            description: "所有想法如果不变成动作，就是在浪费时间。只给具体行动清单。",
            traits: ["收尾", "清单", "动作", "执行"],
            coreBelief: "想明白和做到之间，隔着一条巨大的鸿沟。大多数人不是不知道该怎么做，而是没有把「该做什么」翻译成「今天做哪一步」。缩小到今天、缩小到30分钟、缩小到一个具体动作——然后去做。",
            whenToUse: "道理都懂但就是不动 / 已经分析完了但不知道从何开始 / 列过很多计划但没执行过 / 完美主义导致的拖延 / 对话已经聊够了，需要收尾",
            dialogueStyle: "「总结一下，你现在要做的是这几件事」/ 「第一件事，今天能做完吗？」/ 具体到动作粒度 / 拒绝一切模糊动词",
            forbidden: ["不重复分析", "不展开新话题", "不说「考虑一下」", "清单中禁用思考/了解/学习/考虑等模糊动词"],
            openingLine: "聊得差不多了。现在我帮你把结论变成一张清单。规则：每一条都是一个动作，每个动作都能说清楚花多久、怎么算做完。",
            visual: {
                primaryColor: "#20BF55",
                avatarShape: "勾选框（打勾=做完一件）",
                abilityTags: ["收尾", "清单", "动作", "执行"]
            },
            personaConfig: { rationality: 6, creativity: 5, empathy: 5, mbti: "ESTJ", communicationStyle: "Direct" },
            temperature: 0.3
        },
        {
            id: 'challenger',
            name: '辩驳官',
            role: '批判审查与证伪',
            systemPrompt: SURVIVAL_PROMPTS.agents.challenger,
            color: 'bg-rose-600',
            avatar: 'challenger',
            description: "专门寻找方案里的致命假设漏洞与盲区。不经受残酷攻击的计划不是计划，只是愿望。",
            traits: ["证伪", "质询", "红军审查", "漏洞攻击"],
            coreBelief: "所有被吹捧为完美的方案，其最大的脆弱点往往就在未经验证的前提假设里。残酷的证伪攻击才能筛选出真正鲁棒的方案。",
            whenToUse: "方案看起来过于完美毫无破绽时 / 团队出现群体思维盲从时 / 面对重大不可逆投资决策前 / 需要严格红军质检审查时",
            dialogueStyle: "「假设这个方案第一天就崩溃，最大死穴在哪？」/ 尖锐直接，直击软肋 / 只看反例与极端恶劣场景",
            forbidden: ["盲目赞同客套", "未经反驳给出主观意见", "妥协折中"],
            openingLine: "别急着自我感动。告诉我你的方案和假设，我来帮它做一次极限证伪攻击，看看它能不能活下来。",
            visual: {
                primaryColor: "#E11D48",
                avatarShape: "破绽十字侦测准星",
                abilityTags: ["证伪", "质询", "红军审查", "漏洞攻击"]
            },
            personaConfig: { rationality: 10, creativity: 6, empathy: 1, mbti: "ENTP", communicationStyle: "Direct" },
            temperature: 0.4
        },
        {
            id: 'evidence_scout',
            name: '求证者',
            role: '事实核验与基准',
            systemPrompt: SURVIVAL_PROMPTS.agents.evidence_scout,
            color: 'bg-sky-600',
            avatar: 'evidence_scout',
            description: "调取外部行业基准数据、真实先例与反例支撑，校准脑内的乐观幻觉。",
            traits: ["基准数据", "先例核验", "客观事实", "经验锚点"],
            coreBelief: "无论推演多么严丝合缝，如果脱离了真实世界的基准数据与先例，都是空中楼阁。基准锚点是消灭无效争论的最有效武器。",
            whenToUse: "争论陷入主观各执一词时 / 方案需要外部数据标杆与成功率参考时 / 评估成本周期与现实可行性时",
            dialogueStyle: "「根据公开同类先例，平均转化率/周期是...」/ 用数据和事实说话，保持严密客观",
            forbidden: ["发表无数据支撑的主观意见", "编造虚假先例", "参与情绪化争辩"],
            openingLine: "争辩没有意义，让事实和数据说话。告诉我你需要核验的核心假设，我为你调取行业基准与真实先例。",
            visual: {
                primaryColor: "#0EA5E9",
                avatarShape: "放大核验镜与数据卷轴",
                abilityTags: ["基准数据", "先例核验", "客观事实", "经验锚点"]
            },
            personaConfig: { rationality: 9, creativity: 2, empathy: 3, mbti: "ISTJ", communicationStyle: "Analytical" },
            temperature: 0.2
        },
        {
            id: 'synthesizer',
            name: '裁判官',
            role: '跨小队冲突仲裁与终审',
            systemPrompt: SURVIVAL_PROMPTS.agents.synthesizer,
            color: 'bg-amber-600',
            avatar: 'synthesizer',
            description: "站在全局视角对比各方交锋分歧，权衡置信度与代价，裁决出确定性最高的合成策略。",
            traits: ["跨组仲裁", "全局裁决", "置信度加权", "策略收敛"],
            coreBelief: "不同视角的对立交锋是认知的全貌。真理不在于和稀泥妥协，而在于识别各自成立的边界条件，裁定出收益风险比最强韧的合成解。",
            whenToUse: "多小队联合攻坚出现激烈观点冲突时 / 复杂任务进入终审收敛阶段 / 需要输出最终权威执行决策报告时",
            dialogueStyle: "「小队A看到了机会X，小队B锁定了风险Y。经裁决，合成策略如下...」/ 明确裁定取舍与优先级",
            forbidden: ["模糊两可的和稀泥结论", "回避核心冲突"],
            openingLine: "各小队的推演与质检材料已呈上。我将基于各方论据、反驳力度与事实权重，给出最终裁决方案。",
            visual: {
                primaryColor: "#D97706",
                avatarShape: "浑天玉衡印章",
                abilityTags: ["跨组仲裁", "全局裁决", "置信度加权", "策略收敛"]
            },
            personaConfig: { rationality: 10, creativity: 6, empathy: 5, mbti: "INTJ", communicationStyle: "Structured" },
            temperature: 0.2
        },
        {
            id: 'quality_inspector',
            name: '质检官',
            role: '质量门禁与一致性审查',
            systemPrompt: SURVIVAL_PROMPTS.agents.quality_inspector,
            color: 'bg-teal-700',
            avatar: 'quality_inspector',
            description: "严密把控方案交付质量门禁，审查数据自洽性、完整性与可落地性，杜绝无效空头支票。",
            traits: ["质量门禁", "一致性审查", "数据闭环", "落地准入"],
            coreBelief: "没有经过严格质量准入检验的方案，到了工程落地现场必然是一地鸡毛。必须逐条核实逻辑闭环与数据自洽。",
            whenToUse: "方案即将交付前 / 审查前后数据是否矛盾 / 方案缺少明确验收标准 (DoD) 时 / 校验完整性与执行可行性时",
            dialogueStyle: "「经质量门禁审查：发现数据矛盾X处、缺失验收标准Y项，整改要求如下...」/ 严肃严谨，按标准准出",
            forbidden: ["放行含糊不清的方案", "忽略数据前后不一致", "主观臆断"],
            openingLine: "我是质量质检官。我将对当前方案的逻辑一致性、数据闭环与工程落地准入标准进行逐项质检。",
            visual: {
                primaryColor: "#0D9488",
                avatarShape: "全息合格质检印章",
                abilityTags: ["质量门禁", "一致性审查", "数据闭环", "落地准入"]
            },
            personaConfig: { rationality: 10, creativity: 2, empathy: 2, mbti: "ISTJ", communicationStyle: "Analytical" },
            temperature: 0.2
        }
    ];

    // Preset Squads (互补作战小队)
    presetSquads: SquadPreset[] = [
        {
            id: 'squad_discovery',
            name: '创新探索小队',
            description: '拆解复杂格局 + 探索破局可能 + 调取行业基准，专攻新赛道与破局创新',
            color: 'from-amber-500 to-orange-600',
            memberIds: ['decomposer', 'pathfinder', 'evidence_scout'],
            stance: 'discovery'
        },
        {
            id: 'squad_defense',
            name: '审慎风控小队',
            description: '量化成本收益 + 极限压力测试 + 证伪漏洞攻击，专攻高风险决策与防线构筑',
            color: 'from-rose-500 to-indigo-700',
            memberIds: ['calculator', 'stress_tester', 'challenger'],
            stance: 'defense'
        },
        {
            id: 'squad_execution',
            name: '敏捷交付小队',
            description: '结构拆解 + 代价精算 + 落地清单转化，专攻快速启动与分步执行落地',
            color: 'from-emerald-500 to-teal-700',
            memberIds: ['decomposer', 'calculator', 'closer'],
            stance: 'execution'
        },
        {
            id: 'squad_adversarial_blue',
            name: '蓝军方案提案组',
            description: '以机会开拓和收益最大化为导向，产出突破性方案路线',
            color: 'from-blue-500 to-cyan-600',
            memberIds: ['pathfinder', 'calculator', 'closer'],
            stance: 'adversarial'
        },
        {
            id: 'squad_adversarial_red',
            name: '红军极限审查组',
            description: '以证伪、找漏洞和压力推演为导向，全面审查方案缺陷',
            color: 'from-red-600 to-rose-700',
            memberIds: ['challenger', 'stress_tester', 'evidence_scout'],
            stance: 'adversarial'
        }
    ];

    // V2: Fixed Arsenal + Custom Agents
    customAgents = $state<Agent[]>([]);

    constructor() {
        // Hydrate from registry
        this.syncFromRegistry();

        // Subscribe to changes
        registryStore.subscribe(() => {
            this.syncFromRegistry();
        });

        // Hydrate saved checkpoint from localStorage
        this.loadSavedCheckpoint();

        if (typeof window !== 'undefined') {
            void this.initAsyncPersistence();
        }
    }

    syncFromRegistry() {
        const registryAgents = get(registryStore);
        this.customAgents = registryAgents.map(ra => this.mapRegistryToRuntime(ra));
    }

    private mapRegistryToRuntime(ra: any): Agent {
        const persona = personaStore.getPersonaById(ra.personaId);
        const preset = this.presetAgents.find(pa => pa.id === ra.id);
        return {
            id: ra.id,
            name: ra.name,
            role: persona?.roleSetting || ra.description || preset?.role || "AI Assistant",
            systemPrompt: persona?.systemPrompt || preset?.systemPrompt || "You are a helpful assistant.",
            color: ra.visual?.primaryColor || preset?.color || "#6366F1",
            avatar: ra.visual?.icon || preset?.avatar || 'bot',
            description: ra.description || preset?.description,
            traits: persona?.personalityTags || preset?.traits || [],
            coreBelief: persona?.personalIntroduction || preset?.coreBelief,
            whenToUse: preset?.whenToUse,
            dialogueStyle: preset?.dialogueStyle,
            forbidden: preset?.forbidden,
            openingLine: preset?.openingLine,
            personaConfig: persona ? {
                rationality: persona.personaMatrix.rationality,
                creativity: persona.personaMatrix.creativity,
                empathy: persona.personaMatrix.empathy,
                mbti: persona.personaMatrix.mbti,
                communicationStyle: persona.personaMatrix.communicationStyle
            } : preset?.personaConfig,
            temperature: ra.config?.temperature ?? preset?.temperature ?? 0.7,
            maxThinkingRounds: preset?.maxThinkingRounds || 10,
            skillIds: ra.skillIds || preset?.skillIds || []
        } as Agent;
    }

    get agents() {
        const map = new Map<string, Agent>();
        for (const agent of this.presetAgents) {
            map.set(agent.id, agent);
        }
        for (const agent of this.customAgents) {
            map.set(agent.id, agent);
        }
        return Array.from(map.values());
    }

    // 添加自定义 Agent
    addCustomAgent(agent: Agent): boolean {
        // 检查 ID 是否已存在
        if (this.agents.some(a => a.id === agent.id)) {
            return false;
        }
        this.customAgents = [...this.customAgents, agent];
        return true;
    }

    // 删除自定义 Agent
    removeCustomAgent(id: string): boolean {
        const index = this.customAgents.findIndex(a => a.id === id);
        if (index === -1) return false;

        this.customAgents = this.customAgents.filter(a => a.id !== id);
        // 同时从 activeAgentIds 中移除
        this.currentSession.activeAgentIds = this.currentSession.activeAgentIds.filter(aid => aid !== id);
        return true;
    }

    getValidAgent(agentId?: string): Agent {
        if (agentId) {
            const found = this.agents.find(a => a.id === agentId);
            if (found) return found;
        }
        const active = this.getActiveAgents();
        if (active.length > 0) return active[0];
        return this.presetAgents[0];
    }

    skipCurrentStep() {
        if (this.abortController) {
            this.abortController.abort(new Error('User skipped step'));
            this.abortController = null;
        }
        const currentStep = this.pipelineState.collaborationSteps?.find(s => s.status === 'running');
        if (currentStep) {
            currentStep.status = 'completed';
        }
        this.metaFlowIsRunning = false;
        setTimeout(() => {
            if (this.pipelineState.isRunning && !this.pipelineState.isPaused) {
                this.runMetaFlow(this.pipelineState.currentGoal, true);
            }
        }, 300);
    }

    currentSession = $state<Session>({
        id: "default",
        title: "New Session",
        messages: [],
        // V2: All 5 weapons are always available in the arsenal
        activeAgentIds: ['decomposer', 'calculator', 'pathfinder', 'stress_tester', 'closer'],
        round: 0
    });

    isThinking = $state(false);
    metaFlowIsRunning = $state(false);
    metaFlowFinished = $state(false);
    abortController = $state<AbortController | null>(null);

    // Iteration state
    iterationRound = $state(0);
    iterationHistory = $state<IterationRecord[]>([]);
    lastAggregatedResult = $state('');

    // Checkpoint & resume state
    checkpoint = $state<Checkpoint | null>(null);
    savedCheckpoint = $state<any>(null);
    private MAX_RETRIES = 3;
    private RETRY_DELAY = 5000;

    get hasResumableCheckpoint(): boolean {
        if (this.metaFlowIsRunning || this.pipelineState.isRunning) return false;
        const cp = this.savedCheckpoint || this.checkpoint;
        return Boolean(cp && cp.goal);
    }

    // Debug state
    debugLogs = $state<DebugLog[]>([]);
    debugPanelOpen = $state(false);

    // Session history & Right Drawer State
    sessionHistory = $state<SessionHistoryItem[]>(this.loadSessionHistory());
    rightDrawerOpen = $state(false);
    rightDrawerTab = $state<'thought' | 'history' | 'topology' | 'audit'>('thought');

    openRightDrawer(tab: 'thought' | 'history' | 'topology' | 'audit' = 'thought') {
        this.rightDrawerTab = tab;
        this.rightDrawerOpen = true;
    }

    closeRightDrawer() {
        this.rightDrawerOpen = false;
    }

    toggleRightDrawer(tab?: 'thought' | 'history' | 'topology' | 'audit') {
        if (tab && this.rightDrawerTab !== tab) {
            this.rightDrawerTab = tab;
            this.rightDrawerOpen = true;
        } else {
            this.rightDrawerOpen = !this.rightDrawerOpen;
        }
    }

    // Perspective, Filter & Snapshot Enhancements
    globalExpandDirectives = $state(false);
    selectedFilterAgentId = $state<string | null>(null);
    sessionSnapshots = $state<Array<{ timestamp: number; name: string; session: any; pipelineState: any }>>([]);

    toggleAllDirectives() {
        this.globalExpandDirectives = !this.globalExpandDirectives;
    }

    setFilterAgent(agentId: string | null) {
        this.selectedFilterAgentId = this.selectedFilterAgentId === agentId ? null : agentId;
    }

    createSnapshot(name: string) {
        try {
            const snapshot = {
                timestamp: Date.now(),
                name,
                session: JSON.parse(JSON.stringify(this.currentSession)),
                pipelineState: JSON.parse(JSON.stringify(this.pipelineState))
            };
            this.sessionSnapshots.unshift(snapshot);
            if (this.sessionSnapshots.length > 10) {
                this.sessionSnapshots = this.sessionSnapshots.slice(0, 10);
            }
        } catch { /* snapshot defense */ }
    }

    undoSnapshot(): boolean {
        if (this.sessionSnapshots.length === 0) return false;
        const last = this.sessionSnapshots.shift();
        if (!last) return false;
        this.currentSession = last.session;
        this.pipelineState = last.pipelineState;
        this.addMessage('system', `↩️ 已回退到操作快照：「${last.name}」`);
        return true;
    }

    // Joint Warfare State (多小队联合攻坚) - 委托至 warfareEngine
    get jointWarfareState(): JointWarfareState {
        return warfareEngine.state as any;
    }

    mode = $state<'squad' | 'joint_warfare'>('squad');

    setMode(newMode: 'squad' | 'joint_warfare') {
        this.mode = newMode;
        if (newMode === 'joint_warfare') {
            warfareEngine.state.isActive = true;
        }
    }

    resetJointWarfare() {
        warfareEngine.resetWarfare();
    }

    // ================== 决策审计与执行工单控制台 (Decision Audit & Action Console) ==================

    decisionConsoleOpen = $state(false);
    decisionConsoleTab = $state<'overview' | 'observability' | 'dod_plan' | 'trace' | 'behaviors' | 'tools' | 'comms' | 'matrix'>('overview');

    toggleDecisionConsole(tab?: 'overview' | 'observability' | 'dod_plan' | 'trace' | 'behaviors' | 'tools' | 'comms' | 'matrix') {
        if (tab) {
            this.decisionConsoleTab = tab;
            this.decisionConsoleOpen = true;
            this.rightDrawerOpen = false;
        } else {
            this.decisionConsoleOpen = !this.decisionConsoleOpen;
            if (this.decisionConsoleOpen) {
                this.rightDrawerOpen = false;
            }
        }
    }

    /**
     * 将当前 72h-7d DoD 落地工单作为执行门禁同步发送至主对话流
     */
    syncDoDToConversation() {
        const tasks = this.dynamicDoDTasks;
        if (tasks.length === 0) {
            this.addMessage("system", "⚠️ 当前暂无结构化 DoD 工单可同步。请先启动推演生成方案。");
            return;
        }

        const lines = [
            `📋 **【72h-7d 落地执行与质量门禁工单已下发】**\n`,
            ...tasks.map((t, idx) => 
                `${idx + 1}. [${t.completed ? '✅ 已达成' : '⏳ 待执行'}] **[${t.timeframe}] ${t.action}**\n   - 责任主体：${t.owner}\n   - 验收标准 (DoD)：${t.definitionOfDone}\n   - 熔断策略：${t.fallbackCircuitBreaker}`
            ),
            `\n💡 *提示：您可以在「决策审计台」勾选验收状态，或针对单项工单发起深化攻坚。*`
        ];

        this.addMessage("system", lines.join('\n'));
    }

    /**
     * 双向锚定：从审计台直接定位并高亮主会话流中的指定消息
     */
    scrollToMessage(targetIdOrAgentId: string): boolean {
        if (typeof document === 'undefined' || !targetIdOrAgentId) return false;

        let el = document.getElementById(`msg-${targetIdOrAgentId}`);
        if (!el) {
            // 尝试按 agentId 或内容关键字找匹配
            const matchedMsg = this.currentSession.messages.find(m => 
                m.id === targetIdOrAgentId || 
                m.agentId === targetIdOrAgentId ||
                (targetIdOrAgentId.length > 5 && m.content.includes(targetIdOrAgentId))
            );
            if (matchedMsg) {
                el = document.getElementById(`msg-${matchedMsg.id}`);
            }
        }

        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2', 'bg-indigo-50/50', 'dark:bg-indigo-950/40');
            setTimeout(() => {
                el?.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2', 'bg-indigo-50/50', 'dark:bg-indigo-950/40');
            }, 2500);
            return true;
        }
        return false;
    }

    /**
     * 单项 DoD 工单行动力闭环：派发针对该工单的 Agent 攻坚推演
     */
    executeSingleDoDTask(task: ExecutableDoDTask) {
        const prompt = `【工单落地攻坚 · ${task.timeframe}】针对目标「${task.action}」：\n- 责任主体：${task.owner}\n- 验收标准 (DoD)：${task.definitionOfDone}\n- 熔断预案：${task.fallbackCircuitBreaker}\n\n请以此为验收门禁，推进具体代码实现与测试验证。`;
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent("insert-chat-input", { detail: { text: prompt, autoFocus: true } }));
        }
    }

    // 动态提炼 1：方案候选分支与权衡矩阵
    get dynamicCandidatePaths(): ExtractedCandidatePath[] {
        // 1. 优先使用 auditEventBus 结构化方案候选矩阵
        const busPaths = auditEventBus.candidatePaths;
        if (busPaths && busPaths.length > 0) {
            return busPaths;
        }

        // 2. 降级：从 messages 真实文本提取
        const msgs = this.currentSession.messages;
        const paths: ExtractedCandidatePath[] = [];

        for (let i = 0; i < msgs.length; i++) {
            const m = msgs[i];
            if (m.agentId === 'pathfinder' || m.agentId === 'decomposer' || m.agentId === 'synthesizer') {
                const isChosen = Boolean(this.jointWarfareState.arbitrationResult?.chosenPath) && (m.agentId === 'synthesizer' || i === msgs.length - 1);
                const roiMatch = m.content.match(/(?:ROI|收益|提效|产出|优势)[：:]?\s*([^\n]+)/i);
                const costMatch = m.content.match(/(?:成本|周期|代价|MVP|风险)[：:]?\s*([^\n]+)/i);
                const cleanContent = m.content.replace(/[#*`>-]/g, ' ').replace(/\s+/g, ' ').trim();
                
                paths.push({
                    id: `path-${i}`,
                    name: `${m.agentName || m.agentId} 推进路径`,
                    proposerAgentId: m.agentId,
                    coreIdea: cleanContent.slice(0, 140) + (cleanContent.length > 140 ? '...' : ''),
                    projectedRoi: roiMatch ? roiMatch[1].replace(/[#*`>-]/g, '').trim().slice(0, 50) : '提效与架构收敛',
                    estimatedCost: costMatch ? costMatch[1].replace(/[#*`>-]/g, '').trim().slice(0, 50) : '标准工程周期',
                    isChosen
                });
            }
        }

        return paths;
    }

    // 动态提炼 2：致命死穴与证伪漏洞台账
    get dynamicVulnerabilities(): ExtractedVulnerability[] {
        // 1. 优先使用 auditEventBus 结构化漏洞台账
        const busVulns = auditEventBus.vulnerabilities;
        if (busVulns && busVulns.length > 0) {
            return busVulns;
        }

        // 2. 降级：从 messages 真实文本提取
        const msgs = this.currentSession.messages;
        const list: ExtractedVulnerability[] = [];

        for (let i = 0; i < msgs.length; i++) {
            const m = msgs[i];
            if (m.agentId === 'challenger' || m.agentId === 'stress_tester' || m.agentId === 'quality_inspector' || m.agentId === 'critic') {
                const worstMatch = m.content.match(/(?:崩塌|最坏|后果|死穴|隐患|风险)[：:]?\s*([^\n]+)/i);
                const mitMatch = m.content.match(/(?:熔断|止损|兜底|防御|预案|规避)[：:]?\s*([^\n]+)/i);
                const cleanContent = m.content.replace(/[#*`>-]/g, ' ').replace(/\s+/g, ' ').trim();

                list.push({
                    id: `vuln-${i}`,
                    topic: `${m.agentName || m.agentId} 关键质检`,
                    discoveredByAgentId: m.agentId,
                    fatalHypothesis: cleanContent.slice(0, 100) + (cleanContent.length > 100 ? '...' : ''),
                    worstCaseScenario: worstMatch ? worstMatch[1].replace(/[#*`>-]/g, '').trim().slice(0, 70) : '边界条件异常导致系统退化',
                    mitigationStrategy: mitMatch ? mitMatch[1].replace(/[#*`>-]/g, '').trim().slice(0, 70) : '实施质量门禁与熔断回退',
                    status: 'identified'
                });
            }
        }

        return list;
    }

    // 动态提炼 3：实证数据与行业基准台账
    get dynamicEvidenceItems(): ExtractedEvidenceItem[] {
        // 1. 优先从 auditEventBus 提取实证
        const busEvidence = auditEventBus.evidenceList;
        if (busEvidence && busEvidence.length > 0) {
            return busEvidence.map(ev => ({
                id: ev.evidenceId,
                category: 'benchmark' as const,
                title: ev.source || '客观实证与基准数据',
                fact: ev.fact,
                source: ev.source,
                confidence: 90,
                agentId: ev.addedByAgentId || 'evidence_scout'
            }));
        }

        // 2. 降级：从 jointWarfareState 提取
        if (this.jointWarfareState.evidence && this.jointWarfareState.evidence.length > 0) {
            return this.jointWarfareState.evidence.map(ev => ({
                id: ev.id,
                category: 'benchmark' as const,
                title: ev.source || '客观实证与基准数据',
                fact: ev.fact,
                source: ev.source,
                confidence: 90,
                agentId: 'evidence_scout'
            }));
        }

        return [];
    }

    // 动态提炼 4：72h-7d 可执行 DoD 落地工单
    get dynamicDoDTasks(): ExecutableDoDTask[] {
        // 1. 优先从 auditEventBus 提取
        const busTasks = auditEventBus.dodTasks;
        if (busTasks && busTasks.length > 0) {
            return busTasks;
        }

        // 2. 降级：从多小队联合攻坚终审提取
        if (this.jointWarfareState.arbitrationResult?.actionSteps && this.jointWarfareState.arbitrationResult.actionSteps.length > 0) {
            return this.jointWarfareState.arbitrationResult.actionSteps.map((step, i) => ({
                id: `warfare-task-${i}`,
                timeframe: i === 0 ? '72h' : i === 1 ? '7d' : '30d',
                action: step,
                owner: i === 0 ? '架构与工程先锋组' : i === 1 ? '质检与风控审计组' : '全业务研发团队',
                definitionOfDone: `产出实证交付物并通过质量门禁验收 (0 致命缺陷)`,
                fallbackCircuitBreaker: `若关键链路指标超阈值立刻触发降级回滚`,
                completed: false
            }));
        }

        // 3. 降级：从单小队 deliver 阶段提取落地工单
        const deliverContent = squadEngine.state.phaseOutputs.deliver?.content;
        if (deliverContent) {
            const lines = deliverContent.split('\n')
                .map(l => l.trim())
                .filter(l => /^(?:[0-9]+[.\、]|[-*•])\s+/.test(l));

            if (lines.length > 0) {
                return lines.slice(0, 6).map((line, idx) => {
                    const cleaned = line.replace(/^(?:[0-9]+[.\、]|[-*•])\s+/, '').trim();
                    return {
                        id: `squad-task-${idx}`,
                        timeframe: idx < 2 ? '72h' : idx < 4 ? '7d' : '30d',
                        action: cleaned,
                        owner: '协同落地执行组',
                        definitionOfDone: '按照交付物验收标准达成并归档',
                        fallbackCircuitBreaker: '出现阻塞时切换至防卡点应急备选路线',
                        completed: false
                    };
                });
            }
        }

        return [];
    }

    // 动态提炼 5：真实会话模型调用与成本统计 (Real Telemetry)
    get sessionTelemetryStats(): SessionTelemetryStats {
        const msgs = this.currentSession.messages;
        let promptChars = 0;
        let completionChars = 0;
        let totalEstimatedTokens = 0;

        for (const m of msgs) {
            const tokenCount = estimateTokenCount(m.content);
            totalEstimatedTokens += tokenCount;
            if (m.role === 'user') {
                promptChars += m.content.length;
            } else {
                completionChars += m.content.length;
            }
        }

        const busTokens = auditEventBus.telemetry.totalTokenEstimate;
        const finalTokens = Math.max(totalEstimatedTokens, busTokens);
        
        // 动态根据 settingsStore 当前提供商与模型计算实际费用
        const provider = settingsStore.provider || 'ollama';
        const model = (settingsStore.selectedModel || '').toLowerCase();
        let estimatedCost = 0;
        if (provider === 'ollama' || (provider === 'custom' && !settingsStore.apiKey)) {
            estimatedCost = 0;
        } else if (provider === 'deepseek' || model.includes('deepseek')) {
            estimatedCost = (finalTokens / 1000) * 0.00028;
        } else if (provider === 'groq' || model.includes('llama')) {
            estimatedCost = (finalTokens / 1000) * 0.0001;
        } else if (model.includes('gpt-4o-mini')) {
            estimatedCost = (finalTokens / 1000) * 0.00015;
        } else if (model.includes('gpt-4o')) {
            estimatedCost = (finalTokens / 1000) * 0.0025;
        } else if (model.includes('claude-3-5-sonnet') || model.includes('claude-3.5-sonnet')) {
            estimatedCost = (finalTokens / 1000) * 0.003;
        } else if (model.includes('flash')) {
            estimatedCost = (finalTokens / 1000) * 0.000075;
        } else if (model.includes('pro')) {
            estimatedCost = (finalTokens / 1000) * 0.00125;
        } else {
            estimatedCost = (finalTokens / 1000) * 0.0015;
        }

        let calculatedConfidence = 0;
        if (this.jointWarfareState.arbitrationResult?.confidenceScore) {
            calculatedConfidence = this.jointWarfareState.arbitrationResult.confidenceScore;
        } else if (auditEventBus.telemetry.averageConfidenceScore > 0) {
            calculatedConfidence = auditEventBus.telemetry.averageConfidenceScore;
        }

        return {
            totalEstimatedTokens: finalTokens,
            promptCharacters: promptChars,
            completionCharacters: completionChars,
            roundsCompleted: Math.max(0, this.currentSession.round || msgs.filter(m => m.role === 'user').length),
            activeAgentsCount: this.currentSession.activeAgentIds.length,
            averageConfidenceScore: calculatedConfidence,
            divergenceConvergenceDelta: this.jointWarfareState.stage === 'completed' ? 100 : (this.jointWarfareState.progress || (squadEngine.state.progress || 0)),
            estimatedCostUsd: Number(estimatedCost.toFixed(4))
        };
    }

    // 动态可观察性 1：全链路决策时序因果链 (Decision Trace)
    get dynamicDecisionTrace(): DecisionTraceStage[] {
        // 1. 优先使用 auditEventBus 结构化因果链
        const busChain = auditEventBus.causalChain;
        if (busChain && busChain.length > 0) {
            return busChain.map((item, idx) => ({
                id: item.id || `bus-trace-${idx}`,
                title: item.summary,
                stageIndex: idx + 1,
                agentId: item.agentId || 'system',
                agentName: item.agentName || '协同中枢',
                status: 'completed' as const,
                coreInsight: item.summary.slice(0, 140) + (item.summary.length > 140 ? '...' : ''),
                evidenceQuote: item.detail ? item.detail.slice(0, 100) : item.summary,
                tradeoffSummary: item.phase ? `阶段: ${item.phase}` : '时序推进',
                timestamp: item.timestamp || Date.now()
            }));
        }

        // 2. 降级：从 messages 解析推导
        const msgs = this.currentSession.messages;
        const stages: DecisionTraceStage[] = [];

        msgs.forEach((m, idx) => {
            if (m.role === 'assistant' && m.agentId) {
                stages.push({
                    id: `trace-${m.id || idx}`,
                    title: m.instruction || (m.agentId ? getAgentDisplayName(m.agentId) : '协同推演'),
                    stageIndex: stages.length + 1,
                    agentId: m.agentId,
                    agentName: getAgentDisplayName(m.agentId),
                    status: 'completed',
                    coreInsight: m.content.slice(0, 140) + (m.content.length > 140 ? '...' : ''),
                    evidenceQuote: m.thought || m.content.slice(0, 80),
                    tradeoffSummary: m.skillId ? `使用技能: ${m.skillId}` : '阶段推进',
                    timestamp: m.timestamp || Date.now()
                });
            }
        });

        return stages;
    }

    /**
     * 基于 Agent 发言轮次、内容深度与技能调用真实计算置信度（杜绝硬编码）
     */
    private calculateAgentConfidence(agentId: string, msgs: Message[]): number {
        if (msgs.length === 0) return 0;
        const countScore = Math.min(msgs.length * 12, 30);
        const avgContentLength = msgs.reduce((sum, m) => sum + m.content.length, 0) / msgs.length;
        const depthScore = Math.min(Math.round(avgContentLength / 25), 40);
        const skillScore = msgs.some(m => m.skillId) ? 25 : 10;
        return Math.min(98, Math.max(30, countScore + depthScore + skillScore));
    }

    // 动态可观察性 2：Agent 行为矩阵与分工态势 (Agent Behaviors)
    get dynamicAgentBehaviors(): ExtractedAgentBehavior[] {
        const msgs = this.currentSession.messages;
        const activeIds = this.currentSession.activeAgentIds.length > 0
            ? this.currentSession.activeAgentIds
            : ['decomposer', 'calculator', 'pathfinder', 'stress_tester', 'closer'];

        return activeIds.map((id) => {
            const agentMsgs = msgs.filter(m => m.agentId === id);
            const hasSpoken = agentMsgs.length > 0;
            const lastMsg = agentMsgs[agentMsgs.length - 1];
            const display = AGENT_DISPLAY_MAP[id];
            const agentObj = this.getAgent(id);

            return {
                agentId: id,
                agentName: display?.name || agentObj?.name || id,
                role: display?.role || agentObj?.role || '专业协同专家',
                status: hasSpoken ? 'completed' : 'active',
                goal: agentObj?.description || display?.role || '协同攻坚专业课题',
                keyContribution: lastMsg ? lastMsg.content.slice(0, 140).replace(/\n/g, ' ') + '...' : '就绪待命中',
                confidenceScore: hasSpoken ? this.calculateAgentConfidence(id, agentMsgs) : 0,
                skillsUsed: agentObj?.skillIds || (hasSpoken ? ['decompose', 'decision_matrix'] : []),
                messagesCount: agentMsgs.length,
                durationMs: agentMsgs.reduce((acc, m) => acc + (m.durationMs || 0), 0) || (hasSpoken ? 1200 : 0),
                color: display?.color || '#6366F1'
            };
        });
    }

    // 动态可观察性 3：工具与技能调用流水线 (Tool Invocations)
    get dynamicToolInvocations(): ExtractedToolInvocation[] {
        // 1. 优先从 auditEventBus 提取技能调用
        const busSkills = auditEventBus.skillLogs;
        if (busSkills && busSkills.length > 0) {
            return busSkills.map(log => ({
                id: log.id,
                toolName: log.skillName || log.skillId,
                category: '标准认知技能插件',
                callerAgentId: log.callerAgentId,
                callerAgentName: log.callerAgentName,
                inputSummary: log.inputSummary,
                outputSummary: log.outputSummary,
                durationMs: log.durationMs,
                status: log.status === 'success' ? 'success' as const : 'failed' as const,
                timestamp: log.timestamp
            }));
        }

        // 2. 降级：从 debugLogs 提取
        const logs = this.debugLogs;
        if (logs && logs.length > 0) {
            return logs.map(log => ({
                id: `tool-log-${log.id}`,
                toolName: log.name,
                category: log.type === 'stage' ? '认知编排技能' : '核心推演引擎',
                callerAgentId: 'orchestrator',
                callerAgentName: '协同调度中枢',
                inputSummary: log.input.slice(0, 120) + (log.input.length > 120 ? '...' : ''),
                outputSummary: log.output.slice(0, 120) + (log.output.length > 120 ? '...' : ''),
                durationMs: log.duration,
                status: log.status === 'success' ? 'success' as const : log.status === 'error' ? 'failed' as const : 'running' as const,
                timestamp: log.startTime
            }));
        }

        // 3. 降级：从 messages 提取
        const msgs = this.currentSession.messages;
        const list: ExtractedToolInvocation[] = [];
        for (let i = 0; i < msgs.length; i++) {
            const m = msgs[i];
            if (m.skillId) {
                list.push({
                    id: `tool-msg-${i}`,
                    toolName: m.skillId,
                    category: '标准认知技能插件',
                    callerAgentId: m.agentId || 'agent',
                    callerAgentName: m.agentId ? getAgentDisplayName(m.agentId) : '协同专家',
                    inputSummary: `指令：${m.instruction || '基于上下文执行认知计算'}`,
                    outputSummary: m.content.slice(0, 130).replace(/\n/g, ' ') + (m.content.length > 130 ? '...' : ''),
                    durationMs: m.durationMs || 800,
                    status: 'success',
                    timestamp: m.timestamp
                });
            }
        }
        return list;
    }

    // 动态可观察性 4：Agent 间通信、依赖拓扑与数据交接 (Inter-Agent Comms)
    get dynamicInterAgentComms(): ExtractedInterAgentComm[] {
        // 1. 优先从 auditEventBus 提取
        const busComms = auditEventBus.interAgentComms;
        if (busComms && busComms.length > 0) {
            return busComms;
        }

        // 2. 降级：从 messages 提取
        const list: ExtractedInterAgentComm[] = [];
        const msgs = this.currentSession.messages;

        for (let i = 1; i < msgs.length; i++) {
            const current = msgs[i];
            const prev = msgs[i - 1];

            if (current.role !== 'user' && prev.role !== 'user' && current.agentId && prev.agentId && current.agentId !== prev.agentId) {
                list.push({
                    id: `comm-${i}`,
                    sourceAgentId: prev.agentId,
                    sourceAgentName: getAgentDisplayName(prev.agentId),
                    targetAgentId: current.agentId,
                    targetAgentName: getAgentDisplayName(current.agentId),
                    type: current.agentId === 'stress_tester' || current.agentId === 'challenger' ? 'critique' : current.agentId === 'closer' || current.agentId === 'synthesizer' ? 'synthesis' : 'handoff',
                    summary: `承接 [${getAgentDisplayName(prev.agentId)}] 的产出结论，推进 [${getAgentDisplayName(current.agentId)}] 阶段分析：${current.content.slice(0, 90).replace(/\n/g, ' ')}...`,
                    timestamp: current.timestamp || Date.now()
                });
            }
        }

        return list;
    }

    pipelineState = $state<PipelineState>({
        stage: 'idle',
        progress: 0,
        currentGoal: '',
        lastResults: null,
        waitingForReview: false,
        taskPlan: null,
        scene: null,
        intent: null,
        isRunning: false,
        error: null,
        currentAgentId: undefined,
        stuckCounter: 0,
        lastDecisionHash: '',
        governanceState: undefined,
    });

    /** Check if an error is retryable (rate limit, network, server errors). */
    private isRetryableError(error: any): boolean {
        const msg = (error?.message || '').toLowerCase();
        return ['rate', 'limit', 'timeout', 'network', 'fetch', '500', '502', '503', '504', 'context', 'token']
            .some(keyword => msg.includes(keyword));
    }

    async initAsyncPersistence() {
        if (typeof window === 'undefined') return;
        try {
            const idbHistory = await loadAllHistoryFromIDB();
            if (idbHistory && idbHistory.length > 0) {
                this.sessionHistory = idbHistory;
            } else {
                // If IDB is empty, migrate existing localStorage items if any
                const lsHistory = this.loadSessionHistory();
                if (lsHistory.length > 0) {
                    this.sessionHistory = lsHistory;
                    for (const item of lsHistory) {
                        await saveHistoryToIDB(item);
                    }
                }
            }

            // Restore active session state on refresh if currentSession is empty
            if (this.currentSession.messages.length === 0) {
                const activeSnapshot = await loadActiveSessionFromIDB();
                if (activeSnapshot?.session?.messages && activeSnapshot.session.messages.length > 0) {
                    this.currentSession = activeSnapshot.session;
                    if (activeSnapshot.goal) {
                        this.pipelineState.currentGoal = activeSnapshot.goal;
                    }
                    if (activeSnapshot.pipelineState) {
                        Object.assign(this.pipelineState, activeSnapshot.pipelineState);
                    }
                    if (activeSnapshot.checkpoint) {
                        this.checkpoint = activeSnapshot.checkpoint;
                    }
                }
            }
        } catch (e) {
            console.warn("[AgentStore] initAsyncPersistence error:", e);
        }
    }

    private autoSyncActiveTimer: any = null;
    syncActiveSession() {
        if (typeof window === 'undefined') return;
        clearTimeout(this.autoSyncActiveTimer);
        this.autoSyncActiveTimer = setTimeout(() => {
            void saveActiveSessionToIDB(
                this.currentSession,
                this.pipelineState.currentGoal,
                this.pipelineState,
                this.checkpoint
            );
        }, 200);
    }

    addDebugLog(type: DebugLog['type'], name: string, data: Partial<DebugLog>) {
        if (this.debugLogs.length >= 200) {
            this.debugLogs.shift();
        }
        this.debugLogs.push({
            id: Date.now(),
            type,
            name,
            input: data.input || '',
            output: data.output || '',
            startTime: data.startTime || Date.now(),
            endTime: data.endTime || Date.now(),
            duration: data.duration || 0,
            status: data.status || 'success',
            error: data.error,
        });
    }

    clearDebugLogs() {
        this.debugLogs = [];
    }

    addMessage(
        role: Message["role"], 
        content: string, 
        agentId?: string, 
        meta?: {
            skillId?: string | null;
            stepIndex?: number;
            totalSteps?: number;
            instruction?: string;
            durationMs?: number;
            thought?: string;
            dependsOn?: string[];
            isStreaming?: boolean;
        }
    ): string {
        const id = crypto.randomUUID();
        this.currentSession.messages.push({
            id,
            role,
            content,
            agentId,
            timestamp: Date.now(),
            isStreaming: meta?.isStreaming,
            skillId: meta?.skillId,
            stepIndex: meta?.stepIndex,
            totalSteps: meta?.totalSteps,
            instruction: meta?.instruction,
            durationMs: meta?.durationMs,
            thought: meta?.thought,
            dependsOn: meta?.dependsOn
        });
        this.syncActiveSession();
        return id;
    }

    updateMessage(
        id: string, 
        content?: string, 
        agentId?: string, 
        isStreaming?: boolean, 
        meta?: Partial<Message>
    ) {
        const msg = this.currentSession.messages.find(m => m.id === id);
        if (msg) {
            if (content !== undefined) msg.content = content;
            if (agentId !== undefined) msg.agentId = agentId;
            if (isStreaming !== undefined) msg.isStreaming = isStreaming;
            if (meta) {
                if (meta.skillId !== undefined) msg.skillId = meta.skillId;
                if (meta.stepIndex !== undefined) msg.stepIndex = meta.stepIndex;
                if (meta.totalSteps !== undefined) msg.totalSteps = meta.totalSteps;
                if (meta.instruction !== undefined) msg.instruction = meta.instruction;
                if (meta.durationMs !== undefined) msg.durationMs = meta.durationMs;
                if (meta.thought !== undefined) msg.thought = meta.thought;
                if (meta.dependsOn !== undefined) msg.dependsOn = meta.dependsOn;
            }
            this.syncActiveSession();
        }
    }

    pauseExecution() {
        this.pipelineState.isPaused = true;
        this.metaFlowIsRunning = false;
        this.addMessage("system", "⏸️ 协同执行已暂停。您可以点击「继续」恢复执行，或在下方输入直接插话。");
    }

    resumeExecution() {
        if (!this.pipelineState.isPaused) return;
        this.pipelineState.isPaused = false;
        this.pipelineState.isRunning = true;
        this.metaFlowIsRunning = true;
        this.addMessage("system", "▶️ 协同执行已恢复，正在推进后续步骤...");
        this.runMetaFlow(this.pipelineState.currentGoal);
    }

    setMessageStreaming(id: string, streaming: boolean) {
        const msg = this.currentSession.messages.find(m => m.id === id);
        if (msg) {
            msg.isStreaming = streaming;
        }
    }

    toggleAgentActive(agentId: string) {
        if (this.currentSession.activeAgentIds.includes(agentId)) {
            this.currentSession.activeAgentIds = this.currentSession.activeAgentIds.filter(id => id !== agentId);
        } else {
            this.currentSession.activeAgentIds.push(agentId);
        }
    }

    getActiveAgents() {
        return this.agents.filter(a => this.currentSession.activeAgentIds.includes(a.id));
    }

    cancelOperation() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.metaFlowIsRunning = false;
        this.pipelineState.waitingForReview = false;
        this.pipelineState.isRunning = false; // Added
    }

    /**
     * Send a message to specific or active AI agents for direct 1:1 or multi-expert conversation.
     */
    async sendMessage(text: string, targetAgentIds?: string[]) {
        if (this.isThinking) return;
        this.isThinking = true;

        const effectiveIds = targetAgentIds && targetAgentIds.length > 0
            ? targetAgentIds
            : this.currentSession.activeAgentIds;

        const agentsToRespond = this.agents.filter(a => effectiveIds.includes(a.id));
        if (agentsToRespond.length === 0) {
            this.addMessage("system", "⚠️ 当前未选中任何响应 Agent，请在上方或小队名单中选择专家。");
            this.isThinking = false;
            return;
        }

        const controller = new AbortController();
        this.abortController = controller;

        try {
            for (const agent of agentsToRespond) {
                if (controller.signal.aborted) break;

                if (settingsStore.isConfigured) {
                    // Real AI call with streaming
                    const msgId = this.addMessage("assistant", "", agent.id);
                    this.setMessageStreaming(msgId, true);
                    let accumulated = '';

                    // Build context-rich prompt with conversation history and persona
                    const recentMessages = this.currentSession.messages
                        .filter(m => m.id !== msgId && m.role !== 'thought')
                        .slice(-8)
                        .map(m => `${m.role === 'user' ? 'User' : (getAgentDisplayName(m.agentId || '', m.agentId || 'Assistant'))}: ${m.content}`)
                        .join('\n\n');

                    // Include agent persona, beliefs, dialogue style, and equipped skills
                    const skillsList = (agent.skillIds || []).map(sid => {
                        const sk = skillRegistry.getById(sid);
                        return sk ? `- ${sk.name}: ${sk.description}` : `- ${sid}`;
                    }).join('\n');

                    const restraintRule = settingsStore.activeRestraintRule;
                    const prompt = `${restraintRule ? `${restraintRule}\n\n==================================================\n` : ''}你是【${agent.name}】（${agent.role}）。
${agent.systemPrompt}
${agent.coreBelief ? `核心信念：${agent.coreBelief}` : ''}
${agent.dialogueStyle ? `对话风格：${agent.dialogueStyle}` : ''}
${agent.forbidden && agent.forbidden.length > 0 ? `禁止事项：${agent.forbidden.join('、')}` : ''}
${skillsList ? `\n你装备了以下专业认知技能：\n${skillsList}` : ''}

【上下文对话历史】：
${recentMessages}

请以【${agent.name}】的独特人设和专业视角，直接回应用户的主张与诉求。`;

                    const options = settingsStore.getCallOptions({
                        stream: settingsStore.stream,
                        onChunk: (chunk: string) => {
                            accumulated += chunk;
                            this.updateMessage(msgId, accumulated);
                        },
                        signal: controller.signal
                    });

                    const startTime = Date.now();
                    const result = await AIBridge.callAI(prompt, options);
                    if (!settingsStore.stream) {
                        this.updateMessage(msgId, result);
                    }
                    this.setMessageStreaming(msgId, false);

                    // Emit audit event so Decision Audit Console logs agent activity
                    auditEventBus.emit('agent_spoke', {
                        kind: 'agent_spoke',
                        agentId: agent.id,
                        agentName: agent.name,
                        role: agent.role,
                        phase: 'direct_chat',
                        contentSummary: (result || accumulated).slice(0, 160).replace(/\n/g, ' '),
                        contentFull: result || accumulated,
                        durationMs: Date.now() - startTime,
                        tokenEstimate: estimateTokenCount(result || accumulated)
                    }, this.currentSession.id);
                } else {
                    this.addMessage("system", "⚠️ AI 服务未配置。请点击右上角「模型配置 (⚙️)」配置 API Key 后重试。");
                }
            }
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                this.addMessage("system", `Error: ${e.message}`);
            }
        } finally {
            this.isThinking = false;
            this.abortController = null;
        }
    }

    updatePlan(newSubtasks: any[]) {
        if (this.pipelineState.taskPlan) {
            this.pipelineState.taskPlan.subtasks = newSubtasks;
        }
    }

    resumePipeline() {
        if (this.pipelineState.waitingForReview) {
            this.pipelineState.waitingForReview = false;
            this.continueMetaFlow();
        }
    }

    retryStage(stage: 'decompose') {
        // Simple retry logic - re-run from current goal
        // In a real implementation this might be more granular
        if (stage === 'decompose') {
            this.pipelineState.waitingForReview = false;
            // Hacky restart from decompose - ideally we'd jump to specific logic
            // For now, let's just re-run the whole thing or implement a specific retry method
            // Actually, to retry decompose, we need to re-call AI.
            // Let's just restart the flow for now or add specific retry logic later.
            // Given the complexity of splitting runMetaFlow, let's notify user to restart or implement a jump.
            // Better: update runMetaFlow to support resuming/jumping.
            this.addMessage("system", "Regenerating plan...");
            this.runMetaFlow(this.pipelineState.currentGoal); // Full restart for now
        }
    }

    async runMetaFlow(goal: string, isContinuation = false) {
        if (this.pipelineState.isPaused) {
            this.pipelineState.isRunning = false;
            this.metaFlowIsRunning = false;
            return;
        }

        if (!isContinuation) {
            // New user turn: completely clean prior round strategy and state
            this.pipelineState.governanceState = undefined;
            this.pipelineState.currentStrategyStep = 0;
            this.pipelineState.collaborationSteps = [];
            this.pipelineState.waitingForReview = false;
            this.pipelineState.isRunning = false;
            this.metaFlowIsRunning = false;
            this.metaFlowFinished = false;
        } else if (this.metaFlowIsRunning) {
            return;
        }

        const controller = new AbortController();
        this.abortController = controller;

        // --- 7.1 Crisis Intervention Check ---
        const crisisLevel1 = SURVIVAL_PROMPTS.crisis.keywords.level1.some(kw => goal.includes(kw));
        if (crisisLevel1) {
            this.addMessage('assistant', SURVIVAL_PROMPTS.crisis.responses.level1);
            return;
        }

        // --- Round Limit Check ---
        if (this.currentSession.round >= 8) {
            this.addMessage('assistant', "（系统提示）我们的对话已经进行了很长时间。为了确保咨询效果，建议我们先把目前生成的行动清单落地执行。如果你有了新的进展，随时欢迎回来告诉我。");
            this.pipelineState.isRunning = false;
            this.metaFlowFinished = true;
            return;
        }
        if (!isContinuation) {
            this.currentSession.round++;
        }

        const crisisLevel2 = SURVIVAL_PROMPTS.crisis.keywords.level2.some(kw => goal.includes(kw));
        if (crisisLevel2) {
            this.addMessage('assistant', SURVIVAL_PROMPTS.crisis.responses.level2);
        }

        this.pipelineState.isRunning = true;
        this.pipelineState.currentGoal = goal;
            this.saveToHistory('in_progress');
        this.pipelineState.error = null;
        this.metaFlowIsRunning = true;
        this.metaFlowFinished = false;
        const targetSessionId = this.currentSession.id;

        try {
            let historyContext = this.getConversationContext();
            let intent = this.pipelineState.intent;

            if (!isContinuation) {
                // Stage 1: Intent & Problem Domain Decomposition
                this.setStage('intent');
                this.addMessage("thought", "🧠 **Stage 1 — 意图解构**：正在解构问题领域、核心矛盾与约束边界...");

                const intentPrompt = META_PROMPTS.intentRecognition
                    .replace('{userInput}', goal)
                    .replace('{history}', historyContext);

                const intentMsgId = this.addMessage("assistant", "", "coordinator", { skillId: "intent", instruction: "解构问题领域、核心矛盾与约束边界", isStreaming: true });
                this.setMessageStreaming(intentMsgId, true);
                let intentAccum = '';
                const intentResp = await MetaFlowService.callAI(
                    intentPrompt,
                    (chunk) => {
                        if (this.currentSession.id !== targetSessionId) return;
                        intentAccum += chunk;
                        this.updateMessage(intentMsgId, intentAccum);
                    },
                    controller.signal
                );
                if (!intentAccum) this.updateMessage(intentMsgId, intentResp);
                this.setMessageStreaming(intentMsgId, false);

                intent = MetaFlowService.extractJSON(intentResp) || {};
                this.pipelineState.intent = intent;

                await MetaFlowService.stageDelay();

                // Stage 2: Scene & Capability Mapping
                this.setStage('scene');
                this.addMessage("thought", `🧠 **Stage 2 — 场景匹配**：领域【${intent.domain || '决策架构'}】已锁定，正在匹配协同认知小队与推演场景...`);

                const scenePrompt = META_PROMPTS.sceneMapping.replace('{intent}', JSON.stringify(intent));
                const sceneMsgId = this.addMessage("assistant", "", "coordinator", { skillId: "scene", instruction: "匹配协同场景与能力兵器库", isStreaming: true });
                this.setMessageStreaming(sceneMsgId, true);
                let sceneAccum = '';
                const sceneResp = await MetaFlowService.callAI(
                    scenePrompt,
                    (chunk) => {
                        if (this.currentSession.id !== targetSessionId) return;
                        sceneAccum += chunk;
                        this.updateMessage(sceneMsgId, sceneAccum);
                    },
                    controller.signal
                );
                if (!sceneAccum) this.updateMessage(sceneMsgId, sceneResp);
                this.setMessageStreaming(sceneMsgId, false);

                const scene = MetaFlowService.extractJSON(sceneResp) || {};
                this.pipelineState.scene = scene;

                await MetaFlowService.stageDelay();
            }

            // Stage 2.5: Strategy Governance (Round 0)
            const isWorkflowExecution = this.pipelineState.governanceState?.status === 'accepted' &&
                this.pipelineState.governanceState.source === 'workflow';

            if (!isWorkflowExecution && (!this.pipelineState.governanceState || this.pipelineState.governanceState?.status !== 'accepted')) {
                this.setStage('strategy');
                await this.synthesizeStrategy(goal, historyContext, intent);
                return; // PAUSE for Governance
            }

            // Stage 3: Router (Who speaks next?)
            this.setStage('decompose');

            let nextAgentId: string;
            let nextSkillId: string | undefined | null;
            let instruction: string;
            const stepIndex = this.pipelineState.currentStrategyStep || 0;
            const rawStrategy = this.pipelineState.governanceState?.strategy?.strategy;
            const strategyList = Array.isArray(rawStrategy) ? rawStrategy : [];

            // --- DETERMINISTIC STRATEGY EXECUTION MODE ---
            if (this.pipelineState.governanceState?.status === 'accepted') {
                if (stepIndex < strategyList.length) {
                    // Execute next step from plan
                    const step = strategyList[stepIndex];
                    nextAgentId = step?.agent || 'closer';
                    nextSkillId = step?.skill;
                    instruction = step?.instruction || '请执行当前步骤任务';

                    this.addMessage("thought", `** 策略执行 (步骤 ${stepIndex + 1}/${strategyList.length}) **\n执行: ${nextAgentId} (${nextSkillId || '对话'})\n指令: ${instruction}`, undefined);

                    // Increment for next round
                    this.pipelineState.currentStrategyStep = stepIndex + 1;
                } else {
                    // Plan finished -> Closer to wrap up
                    nextAgentId = 'closer';
                    instruction = "策略执行完毕。请总结成果并给出下一步行动建议。";
                    this.addMessage("thought", `** 策略执行完毕 **\n切换至 收网的 进行总结。`, undefined);
                }
            } else {
                // --- ORIGINAL DYNAMIC ROUTER MODE ---
                // Build Dynamic Roster
                const availableAgents = this.agents; // Use all agents (preset + custom)
                const agentRosterString = availableAgents.map(a => `- ${a.name} (ID: ${a.id}): ${a.role}`).join('\n');
                const agentIdsString = availableAgents.map(a => a.id).join(', ');

                // Context from Strategy (if any)
                const strategyContext = this.pipelineState.governanceState?.strategy ?
                    `Approved Strategy: ${JSON.stringify(this.pipelineState.governanceState.strategy.strategy || [])}` : "No strict plan.";

                // REFRESH CONTEXT
                const currentHistory = this.getConversationContext();

                const routerPrompt = META_PROMPTS.nextSpeakerSelection
                    .replace('{history}', currentHistory + `\nUser: ${goal}`)
                    .replace('{roster}', agentRosterString)
                    .replace('{agentIds}', agentIdsString)
                    + `\n\nContext:\n${strategyContext}\n\nAvailable Skills: decompose, decision_matrix, stress_test, resource_audit, reframe, action_list\n\nInstructions: Select the next best agent AND a suitable skill (if any) based on history and strategy.`;

                const routerPromptWithJson = routerPrompt + `
Output JSON:
{
  "nextAgentId": "string",
  "skillId": "string | null", // Optional skill to invoke
  "instruction": "string" 
}`;

                const routerResp = await MetaFlowService.callAI(routerPromptWithJson, undefined, controller.signal);
                const routerDecision = MetaFlowService.extractJSON(routerResp) || {};

                // Initialize from router decision
                nextAgentId = routerDecision.nextAgentId || 'closer';
                nextSkillId = routerDecision.skillId;
                instruction = routerDecision.instruction || '请继续对当前内容进行回复与推进';

                // Content-based Stuck Detection (Phase 4.2 Remediation) - Router specific
                const lastAssistantMsg = this.currentSession.messages.filter(m => m.role === 'assistant').slice(-1)[0];
                const prevAssistantMsg = this.currentSession.messages.filter(m => m.role === 'assistant').slice(-2, -1)[0];

                if (lastAssistantMsg && prevAssistantMsg) {
                    const lastContent = lastAssistantMsg.content.trim().substring(0, 100);
                    const prevContent = prevAssistantMsg.content.trim().substring(0, 100);
                    if (lastContent === prevContent && lastContent.length > 10) {
                        this.pipelineState.stuckCounter++;
                    }
                }

                // Fallback if ID is invalid
                if (!availableAgents.find(a => a.id === nextAgentId)) {
                    nextAgentId = 'closer';
                }

                if (this.pipelineState.stuckCounter >= 2) { // 3rd time repeating
                    nextAgentId = 'closer';
                    instruction = "由于对话似乎陷入了循环或重复，请打破现状，对目前的情况做一个决定性的总结，并给出一个明确的下一步建议。";
                    this.addMessage("thought", `** 检测到循环/重复 **\n强制切换到执行官以打破僵局。`, undefined);
                    this.pipelineState.stuckCounter = 0;
                }

                // Highlight selected agent
                const selectedAgent = this.getAgent(nextAgentId);
                this.addMessage("thought", `** 路由决策 **\n下一位发言者: ${selectedAgent?.name || nextAgentId}\n理由: ${instruction}`, undefined);
            }

            this.pipelineState.currentAgentId = nextAgentId;
            this.currentSession.activeAgentIds = [...new Set([...this.currentSession.activeAgentIds, nextAgentId])]; // Auto-activate

            const selectedAgent = this.getAgent(nextAgentId);
            if (!this.pipelineState.governanceState || this.pipelineState.governanceState.status !== 'accepted') {
                // Only log router decision if in router mode
                this.addMessage("thought", `** 路由决策 **\n下一位发言者: ${selectedAgent?.name || nextAgentId}\n理由: ${instruction}`, undefined);
            }

            await MetaFlowService.stageDelay();

            // Stage 4: Execute Agent (w/ Skill)
            this.setStage('execute');

            const stepNum = this.pipelineState.governanceState?.status === 'accepted'
                ? stepIndex + 1
                : (this.pipelineState.collaborationSteps?.length || 0) + 1;

            const totalStepsNum = this.pipelineState.governanceState?.status === 'accepted'
                ? strategyList.length
                : undefined;

            if (!this.pipelineState.collaborationSteps) {
                this.pipelineState.collaborationSteps = [];
            }

            if (this.pipelineState.governanceState?.status !== 'accepted') {
                this.pipelineState.collaborationSteps.push({
                    step: stepNum,
                    agentId: nextAgentId,
                    skillId: nextSkillId,
                    instruction: instruction,
                    status: 'running'
                });
            } else if (this.pipelineState.collaborationSteps[stepIndex]) {
                this.pipelineState.collaborationSteps[stepIndex].status = 'running';
            }

            const previousStepAgents = (this.pipelineState.collaborationSteps || [])
                .filter(s => s.step < stepNum && s.agentId !== nextAgentId)
                .map(s => this.getValidAgent(s.agentId)?.name || s.agentId)
                .filter((v, i, a) => a.indexOf(v) === i);

            const startTime = Date.now();
            const msgId = this.addMessage("assistant", "", nextAgentId, {
                skillId: nextSkillId,
                stepIndex: stepNum,
                totalSteps: totalStepsNum,
                instruction: instruction,
                dependsOn: previousStepAgents.length > 0 ? previousStepAgents : undefined,
                isStreaming: true
            });
            this.setMessageStreaming(msgId, true);

            const currentCollabStep = this.pipelineState.collaborationSteps.find(s => s.step === stepNum);
            if (currentCollabStep) {
                currentCollabStep.messageId = msgId;
            }

            // Force skill if stuck loop detected
            if (this.pipelineState.stuckCounter >= 1 && nextAgentId === 'closer') {
                nextSkillId = 'action_list';
            }

            if (nextSkillId && ['decompose', 'decision_matrix', 'stress_test', 'resource_audit', 'reframe', 'action_list'].includes(nextSkillId)) {
                // Execute Skill via SkillService
                try {
                    const skillHistory = this.getConversationContext();
                    const skillResult = await SkillService.executeSkill(
                        nextSkillId,
                        skillHistory + `\nTarget: ${goal}\nInstruction: ${instruction}`,
                        (chunk) => {
                            if (this.currentSession.id !== targetSessionId) return;
                            const currentContent = this.currentSession.messages.find(m => m.id === msgId)?.content || "";
                            this.updateMessage(msgId, currentContent + chunk);
                        },
                        controller.signal
                    );
                    const duration = Date.now() - startTime;
                    this.updateMessage(msgId, skillResult, nextAgentId, false, { durationMs: duration });
                    if (currentCollabStep) {
                        currentCollabStep.status = 'completed';
                        currentCollabStep.durationMs = duration;
                    }
                } catch (e: any) {
                    this.updateMessage(msgId, `Skill Execution Failed: ${e.message}`, nextAgentId, false);
                    if (currentCollabStep) {
                        currentCollabStep.status = 'failed';
                    }
                }
            } else {
                // High-Impact Cognitive Chat Execution
                const agentSystemPrompt = selectedAgent?.systemPrompt || "You are a helpful assistant.";
                const freshHistory = this.getConversationContext();
                const restraintRule = settingsStore.activeRestraintRule;
                const agentPrompt = `${restraintRule ? `${restraintRule}\n\n==================================================\n` : ''}${agentSystemPrompt}

==================================================
【本次协同推演目标】: ${goal}
【所属领域与意图】: ${JSON.stringify(this.pipelineState.intent || {})}
【你被指派的具体任务】: ${instruction}
【前置历史与认知交接上下文】:
${freshHistory}
==================================================
【输出硬性标准要求】:
1. 请严格依据你的思维模式，输出结构化、量化、不留模糊退路的专业交付物（使用 Markdown 标题、清晰编号或量化表格）。
2. 严禁空洞客套，严禁给出“视情况而定/请综合考虑”等无决断力的车轱辘话。
3. 若提出方案，必须明确给出量化预期与实现代价；若指出漏洞，必须直击致命前提并提出止损防线。

请开始你的高阶认知输出：`;

                await MetaFlowService.streamAI(
                    agentPrompt,
                    (chunk) => {
                        if (this.currentSession.id !== targetSessionId) return;
                        const currentContent = this.currentSession.messages.find(m => m.id === msgId)?.content || "";
                        this.updateMessage(msgId, currentContent + chunk);
                    },
                    () => { },
                    controller.signal
                );
                const duration = Date.now() - startTime;
                this.updateMessage(msgId, undefined, undefined, false, { durationMs: duration });
                if (currentCollabStep) {
                    currentCollabStep.status = 'completed';
                    currentCollabStep.durationMs = duration;
                }
            }

            this.setMessageStreaming(msgId, false);
            this.abortController = null;
            this.setStage('idle');
            this.pipelineState.currentAgentId = undefined;

            // Check if paused
            if (this.pipelineState.isPaused) {
                this.pipelineState.isRunning = false;
                this.metaFlowIsRunning = false;
                return;
            }

            // --- Recursive Loop Logic for Multi-Agent Collaboration ---
            const isStrategyAccepted = this.pipelineState.governanceState?.status === 'accepted';
            const currentStep = this.pipelineState.currentStrategyStep || 0;
            const hasRemainingStrategySteps = isStrategyAccepted && currentStep < strategyList.length;
            const hasRemainingRouterSteps = !isStrategyAccepted && nextAgentId !== 'closer' && this.currentSession.round < 8;

            // Save checkpoint for ongoing execution
            this.saveCheckpoint();

            if (hasRemainingStrategySteps || hasRemainingRouterSteps) {
                // Multi-agent chain is continuing!
                this.metaFlowIsRunning = false;
                this.metaFlowFinished = false;
                setTimeout(() => {
                    if (this.pipelineState.isRunning && !this.pipelineState.isPaused) {
                        this.runMetaFlow(goal, true);
                    }
                }, 600);
            } else {
                // Entire collaborative chain finished -> Generate Supreme Final Decision Verdict Report
                if (isStrategyAccepted || (this.pipelineState.collaborationSteps && this.pipelineState.collaborationSteps.length >= 2)) {
                    this.setStage('aggregate');
                    this.addMessage("thought", `⚖️ **终审裁决收敛**：小队各阶段推演已全部交付，正在由【裁判官】进行全量综合仲裁，输出终审决断令与 7 天落地 Checklist...`);

                    const allCollabMessages = this.currentSession.messages
                        .filter(m => m.role === 'assistant' && m.agentId && m.agentId !== 'coordinator')
                        .map(m => `### 【${this.getAgent(m.agentId!)?.name || m.agentId}】交付成果:\n${m.content}`)
                        .join('\n\n');

                    const aggregationPrompt = META_PROMPTS.resultAggregation
                        .replace('{goal}', goal)
                        .replace('{results}', allCollabMessages);

                    const aggMsgId = this.addMessage("assistant", "", "synthesizer", {
                        instruction: "终审决策裁决与落地实施令",
                        isStreaming: true
                    });
                    this.setMessageStreaming(aggMsgId, true);
                    let aggAccum = '';
                    const aggResp = await MetaFlowService.callAI(
                        aggregationPrompt,
                        (chunk) => {
                            if (this.currentSession.id !== targetSessionId) return;
                            aggAccum += chunk;
                            this.updateMessage(aggMsgId, aggAccum);
                        },
                        controller.signal
                    );
                    if (!aggAccum) this.updateMessage(aggMsgId, aggResp);
                    this.setMessageStreaming(aggMsgId, false);
                }

                this.metaFlowIsRunning = false;
                this.metaFlowFinished = true;
                this.pipelineState.isRunning = false;
                this.clearSavedCheckpoint();
                this.setStage('idle');
                this.addMessage("system", "🎯 多 Agent 协同推演与终审决策全流程已圆满完成！");
                this.saveToHistory('completed');
            }

        } catch (e: any) {
            this.handleError(e);
        }
    }

    // ==========================================
    // 单小队 5 阶段闭环协同推演引擎 (Single Squad 5-Phase Collaboration)
    // 委托至 squadEngine 执行
    // ==========================================
    async runSquadCollaboration(goal: string) {
        if (!goal.trim()) return;

        if (!settingsStore.isConfigured) {
            this.addMessage('system', '⚠️ AI 服务未配置。请先在右上角「模型配置」中填写 API Key 后重试。');
            return;
        }

        const activeIds = this.currentSession.activeAgentIds.length > 0
            ? this.currentSession.activeAgentIds
            : ['decomposer', 'calculator', 'stress_tester', 'synthesizer', 'closer'];

        const phaseDefs = [
            { id: 'decompose', label: '1. 拆解建模', primaryAgentId: 'decomposer' },
            { id: 'analyze', label: '2. 量化精算', primaryAgentId: 'calculator' },
            { id: 'challenge', label: '3. 极限证伪', primaryAgentId: 'stress_tester' },
            { id: 'converge', label: '4. 终审定论', primaryAgentId: 'synthesizer' },
            { id: 'deliver', label: '5. 落地工单', primaryAgentId: 'closer' }
        ];

        this.pipelineState.collaborationSteps = phaseDefs.map((p, idx) => ({
            step: idx + 1,
            agentId: activeIds[idx] || p.primaryAgentId,
            skillId: p.id,
            instruction: p.label,
            status: idx === 0 ? 'running' : 'pending'
        }));

        this.metaFlowIsRunning = true;
        this.pipelineState.isRunning = true;
        this.pipelineState.currentGoal = goal;
        this.saveToHistory('in_progress');

        try {
            await squadEngine.runCollaboration(
                goal,
                activeIds,
                (role: any, content: string, agentId?: string, options?: any) => this.addMessage(role, content, agentId, options),
                (id: string) => this.getAgent(id),
                (id: string, content: string) => this.updateMessage(id, content),
                (phaseId: string, status: 'running' | 'completed' | 'failed', messageId?: string, durationMs?: number) => {
                    const step = this.pipelineState.collaborationSteps?.find(s => s.skillId === phaseId);
                    if (step) {
                        step.status = status;
                        if (messageId) step.messageId = messageId;
                        if (durationMs) step.durationMs = durationMs;
                    }
                }
            );
            this.saveToHistory('completed');
        } catch (e: any) {
            this.handleError(e);
        } finally {
            this.metaFlowIsRunning = false;
            this.pipelineState.isRunning = false;
        }
    }

    resetSquadCollaboration() {
        squadEngine.cancelCollaboration();
        this.pipelineState.collaborationSteps = [];
    }

    // ==========================================
    // 多小队联合攻坚推演引擎 (Multi-Squad Joint Warfare Engine)
    // 委托至 warfareEngine 执行
    // ==========================================
    async runJointWarfare(goal: string, squadAId = 'squad_adversarial_blue', squadBId = 'squad_adversarial_red') {
        if (!goal.trim()) return;

        const squadAPreset = this.presetSquads.find(s => s.id === squadAId) || this.presetSquads[3];
        const squadBPreset = this.presetSquads.find(s => s.id === squadBId) || this.presetSquads[4];

        this.mode = 'joint_warfare';
        this.addMessage('user', goal);

        await warfareEngine.runWarfare(
            goal,
            { memberIds: squadAPreset.memberIds, name: squadAPreset.name },
            { memberIds: squadBPreset.memberIds, name: squadBPreset.name },
            (role, content, agentId, options) => this.addMessage(role, content, agentId, options),
            (id) => this.getAgent(id)
        );
    }

    // --- Strategy Governance Methods ---

    async synthesizeStrategy(goal: string, history: string, intent: any) {
        const controller = new AbortController();
        this.abortController = controller;
        this.pipelineState.isRunning = true;
        this.metaFlowIsRunning = true;

        try {
            this.addMessage("thought", `🧠 **Stage 3 — 策略编排**：正在为多 Agent 小队制定协同分步策略...`);

            // 1. Build context
            const availableAgents = this.agents;
            const roster = availableAgents.map(a => `- ${a.name}: ${a.role}`).join('\n');

            // 2. Prompt for Coordinator
            const strategyPrompt = `
你现在是【高阶多智能体决策系统的总协调官 (Chief Orchestrator)】。
你的任务是根据目标与深度意图，为认知决策小队编排一个具备高密度决策价值的「闭环推演路线图 (Execution Strategy)」。

**上下文**:
议题目标: ${goal}
意图与领域解构: ${JSON.stringify(intent)}
智能体专家库:
${roster}

**编排原则与标准链路 (3~4步闭环)**:
1. **第一步（建模拆解）**：由【拆局者】对复杂议题进行 MECE 独立子问题树拆解，定位关键阻塞瓶颈。
2. **第二步（量化权衡或破局探索）**：由【算账的】（量化打分矩阵）或【找路的】（MVP试探方案）给出候选路线的真实代价与收益比。
3. **第三步（极限证伪与风控红军）**：由【辩驳官】或【兜底的】对方案的最脆弱前置假设进行证伪打击，设定熔断阈值。
4. **第四步（终审收敛与落地工单）**：由【收网的】或【裁判官】下达最终拍板决断令，直接击毙伪方案并输出 72h-7d 落地工单。

**输出格式 (严格 JSON)**:
{
  "analysis": "对议题核心矛盾与决断难点的深度解构...",
  "strategy": [
    { "step": 1, "agent": "decomposer", "skill": "decompose", "instruction": "进行 MECE 独立子问题拆解与瓶颈因果拓扑建模" },
    { "step": 2, "agent": "calculator", "skill": "decision_matrix", "instruction": "建立候选方案的多维度量化决策矩阵与隐性成本账本" },
    { "step": 3, "agent": "challenger", "skill": "stress_test", "instruction": "直击最脆弱的前提假设进行极限证伪与红军漏洞攻击" },
    { "step": 4, "agent": "closer", "skill": "action_list", "instruction": "拍板定论选定路径，宣布击毙方案，下发 72h-7d 落地实施工单" }
  ],
  "reasoning": "为什么此编排链路能确保结论具备最高置信度与落地价值..."
}
`;

            // 3. Call AI with real-time streaming into a dedicated bubble
            const targetSessionId = this.currentSession.id;
            const strategyMsgId = this.addMessage("assistant", "", "coordinator", { skillId: "strategy", instruction: "编排多智能体分步执行策略", isStreaming: true });
            this.setMessageStreaming(strategyMsgId, true);
            let strategyAccum = '';
            const resp = await MetaFlowService.callAI(
                strategyPrompt,
                (chunk) => {
                    if (this.currentSession.id !== targetSessionId) return;
                    strategyAccum += chunk;
                    this.updateMessage(strategyMsgId, strategyAccum);
                },
                controller.signal
            );
            if (!strategyAccum) this.updateMessage(strategyMsgId, resp);
            this.setMessageStreaming(strategyMsgId, false);

            const parsed = MetaFlowService.extractJSON(resp) || {};

            let strategyList = Array.isArray(parsed?.strategy) ? parsed.strategy : (Array.isArray(parsed) ? parsed : []);
            const strategy = {
                analysis: parsed?.analysis || (typeof parsed === 'string' ? parsed : '对用户需求进行结构化分析与编排'),
                strategy: strategyList,
                reasoning: parsed?.reasoning || ''
            };

            // 4. Update State
            this.pipelineState.governanceState = {
                status: 'pending',
                strategy: strategy,
                originalStrategy: JSON.parse(JSON.stringify(strategy)),
                feedbackHistory: []
            };

            this.pipelineState.collaborationSteps = strategyList.map((s: any, idx: number) => ({
                step: s.step || (idx + 1),
                agentId: s.agent || 'closer',
                skillId: s.skill,
                instruction: s.instruction,
                status: 'pending'
            }));

            this.addMessage("thought", `✅ 策略规划已就绪：已编排 ${strategyList.length} 步多 Agent 协同链路，等待用户确认审核 (Round 0)...`);

            // 5. Notify UI (Pause Pipeline)
            this.metaFlowIsRunning = false; // Pause execution loop
            this.pipelineState.waitingForReview = true; // Show UI card

        } catch (e: any) {
            this.handleError(e);
        }
    }

    async handleGovernanceAction(action: 'accept' | 'regenerate' | 'iterate', feedback?: string) {
        if (!this.pipelineState.governanceState) return;

        if (action === 'accept') {
            this.pipelineState.governanceState.status = 'accepted';
            this.pipelineState.waitingForReview = false;
            // Reset execution step
            this.pipelineState.currentStrategyStep = 0;

            // Force reset running state to bypass runMetaFlow guard
            this.pipelineState.isRunning = false;
            this.metaFlowIsRunning = false;

            // Resume pipeline
            this.runMetaFlow(this.pipelineState.currentGoal, true);
        } else if (action === 'regenerate') {
            // Clear and retry
            this.pipelineState.governanceState = undefined;
            this.pipelineState.collaborationSteps = [];
            this.pipelineState.isRunning = false;
            this.metaFlowIsRunning = false;
            this.runMetaFlow(this.pipelineState.currentGoal, false);
        } else if (action === 'iterate' && feedback) {
            this.pipelineState.governanceState.status = 'iterating';
            this.pipelineState.governanceState.feedbackHistory.push(feedback);

            // Re-synthesize with feedback
            const goal = this.pipelineState.currentGoal;
            const history = this.getConversationContext();
            const feedbackContext = `User Feedback for previous strategy: ${feedback}`;

            // Reuse synthesize but inject feedback - distinct method or extended prompt?
            // For simplicity, let's call a specialized refinement method or hack synthesize.
            // Let's implement refinedStrategy here directly to control the prompt.

            const controller = new AbortController();
            this.abortController = controller;
            this.metaFlowIsRunning = true;

            try {
                this.addMessage("thought", "** 协调者优化中 **\n正在根据反馈调整策略...", undefined);
                const refinePrompt = `
你现在是【多智能体系统的协调者 (Coordinator)】。
用户对上一次生成的策略提出了反馈 (Iterate)。请根据反馈优化策略。

**原始目标**: ${goal}
**用户反馈**: "${feedback}"

**Agent Roster**:
${this.agents.map(a => `- ${a.name}`).join('\n')}

**要求**:
1. 采纳用户的反馈意见。
2. 重新生成策略 JSON。
3. **必须使用中文**。

**输出格式 (JSON)**:
{
  "analysis": "根据反馈的调整思路...",
  "strategy": [ ...fixed steps... ],
  "reasoning": "优化理由..."
}
`;
                const resp = await MetaFlowService.callAI(refinePrompt, undefined, controller.signal);
                const parsed = MetaFlowService.extractJSON(resp) || {};

                let strategyList = Array.isArray(parsed?.strategy) ? parsed.strategy : (Array.isArray(parsed) ? parsed : []);
                const strategy = {
                    analysis: parsed?.analysis || '已根据反馈优化策略',
                    strategy: strategyList,
                    reasoning: parsed?.reasoning || ''
                };

                this.pipelineState.governanceState.strategy = strategy;
                this.pipelineState.collaborationSteps = strategyList.map((s: any, idx: number) => ({
                    step: s.step || (idx + 1),
                    agentId: s.agent || 'closer',
                    skillId: s.skill,
                    instruction: s.instruction,
                    status: 'pending'
                }));
                this.pipelineState.governanceState.status = 'pending'; // Back to pending for review
                this.metaFlowIsRunning = false;
                this.pipelineState.waitingForReview = true;

            } catch (e) { this.handleError(e); }
        }
    }

    resetStrategyToOriginal() {
        if (!this.pipelineState.governanceState?.originalStrategy) return;
        this.pipelineState.governanceState.strategy = JSON.parse(JSON.stringify(this.pipelineState.governanceState.originalStrategy));
        const list = this.pipelineState.governanceState.strategy.strategy || [];
        this.pipelineState.collaborationSteps = list.map((s: any, idx: number) => ({
            step: s.step || (idx + 1),
            agentId: s.agent || 'closer',
            skillId: s.skill,
            instruction: s.instruction,
            status: 'pending'
        }));
    }

    // --- Workflow Bridge Methods ---

    async loadWorkflowAsStrategy(workflowId: string) {
        // 1. Get workflow
        const workflows = get(workflowStore);
        const record = workflows.find(w => w.id === workflowId);
        if (!record) {
            this.addMessage("system", `Error: Workflow ${workflowId} not found.`);
            return;
        }

        // 2. Convert to Strategy
        const steps = workflowToStrategy(record.workflow);
        if (steps.length === 0) {
            this.addMessage("system", `Error: Workflow ${record.name} is empty or invalid.`);
            return;
        }

        // 3. Inject as Accepted Strategy
        this.pipelineState.governanceState = {
            status: 'accepted',
            source: 'workflow', // Mark source
            strategy: {
                analysis: `Executing workflow: ${record.name}`,
                strategy: steps.map(s => ({
                    step: s.step,
                    agent: s.agent,
                    skill: s.skill,
                    instruction: s.instruction
                })),
                reasoning: record.description || "User defined workflow"
            },
            feedbackHistory: []
        };

        this.pipelineState.collaborationSteps = steps.map((s, idx) => ({
            step: s.step || (idx + 1),
            agentId: s.agent,
            skillId: s.skill,
            instruction: s.instruction,
            status: 'pending'
        }));

        // 4. Set Active Agents (Auto-activate all agents in workflow)
        const agentIds = new Set(steps.map(s => s.agent));
        this.currentSession.activeAgentIds = Array.from(agentIds);

        // 5. System Notification
        this.addMessage("system", `📋 **工作流启动**: ${record.name}\n${record.description ? `> ${record.description}\n` : ''}\n共 ${steps.length} 个步骤，正在按计划执行...`);
    }

    isSquadManagerOpen = $state(false);

    toggleSquadManager() {
        this.isSquadManagerOpen = !this.isSquadManagerOpen;
    }

    async continueMetaFlow() {
        if (this.metaFlowIsRunning) return;

        // Resume execution
        const controller = new AbortController();
        this.abortController = controller;
        this.metaFlowIsRunning = true;

        try {
            const { taskPlan, currentGoal } = this.pipelineState;
            const historyContext = this.getConversationContext();

            await MetaFlowService.stageDelay();

            // Stage 4: Prompt (Strategy)
            this.setStage('prompt');
            const promptPrompt = META_PROMPTS.promptGeneration
                .replace('{goal}', currentGoal)
                .replace('{subtasks}', JSON.stringify(taskPlan.subtasks));
            const t4 = Date.now();
            const promptResp = await MetaFlowService.callAI(promptPrompt, undefined, controller.signal);
            const generationStrategy = MetaFlowService.extractJSON(promptResp);
            this.addDebugLog('stage', 'Strategy Design', { input: promptPrompt, output: promptResp, startTime: t4, endTime: Date.now(), duration: Date.now() - t4, status: 'success' });

            await MetaFlowService.stageDelay();

            // Stage 5: Execute (Agent Run)
            this.setStage('execute');
            const results: any[] = [];
            for (const subtask of generationStrategy.prompts || []) {
                if (controller.signal.aborted) break;

                // Lookup assigned agent
                const planTask = taskPlan.subtasks?.find((t: any) => t.id === subtask.taskId);
                const agentId = planTask?.assignedAgentId;
                this.pipelineState.currentAgentId = agentId;
                const agent = this.agents.find(a => a.id === agentId);

                const systemPrompt = agent?.systemPrompt || subtask.systemPrompt || "";

                // Inject conversation history into execution context
                const fullPrompt = systemPrompt +
                    "\n\n--- Conversation History ---\n" + historyContext +
                    "\n\n--- Current Task ---\n" + subtask.userPrompt;

                const ts = Date.now();
                const result = await MetaFlowService.callAI(fullPrompt, undefined, controller.signal);
                this.addDebugLog('subtask', `Subtask: ${subtask.taskName || subtask.taskId} (${agentId || 'default'})`, { input: fullPrompt, output: result, startTime: ts, endTime: Date.now(), duration: Date.now() - ts, status: 'success' });
                results.push({ taskId: subtask.taskId, content: result, agentId });
            }

            await MetaFlowService.stageDelay();

            // Stage 6: Aggregate with streaming
            this.setStage('aggregate');
            const msgId = this.addMessage("assistant", "", "metaflow");
            this.setMessageStreaming(msgId, true);
            let accumulated = '';

            const aggPrompt = META_PROMPTS.resultAggregation
                .replace('{goal}', currentGoal)
                .replace('{results}', JSON.stringify(results));
            const t6 = Date.now();
            const finalResp = await MetaFlowService.callAI(
                aggPrompt,
                (chunk: string) => {
                    accumulated += chunk;
                    this.updateMessage(msgId, accumulated);
                },
                controller.signal
            );

            // Ensure final content is set
            if (!settingsStore.stream || !settingsStore.isConfigured) {
                this.updateMessage(msgId, finalResp);
            }
            this.setMessageStreaming(msgId, false);
            this.addDebugLog('stage', 'Result Synthesis', { input: aggPrompt, output: finalResp, startTime: t6, endTime: Date.now(), duration: Date.now() - t6, status: 'success' });

            // Save aggregated result for iteration use
            this.lastAggregatedResult = finalResp;
            this.iterationRound++;

            // Auto-save to session history
            this.saveToHistory('completed');

            this.metaFlowIsRunning = false;
            this.metaFlowFinished = true;
            this.abortController = null;
            this.setStage('idle');

        } catch (e: any) {
            this.handleError(e);
        }
    }

    /**
     * Iteration refinement: use feedback to optimize the last aggregated result.
     */
    async executeIteration(feedback: string) {
        if (this.metaFlowIsRunning) return;

        // Record iteration history
        this.iterationHistory.push({
            round: this.iterationRound,
            feedback,
            resultSummary: this.lastAggregatedResult.substring(0, 200)
        });

        const controller = new AbortController();
        this.abortController = controller;
        this.metaFlowIsRunning = true;
        this.metaFlowFinished = false;

        try {
            const historyText = this.iterationHistory.map(h =>
                `Round ${h.round}: ${h.feedback} `
            ).join('\n');

            const prompt = META_PROMPTS.iterationRefinement
                .replace('{goal}', this.pipelineState.currentGoal)
                .replace('{previousResult}', this.lastAggregatedResult)
                .replace('{feedback}', feedback)
                .replace('{history}', historyText || 'None');

            this.setStage('aggregate');
            this.addMessage('thought', `** Iteration Refinement(Round ${this.iterationRound + 1}) **\nApplying feedback: "${feedback.substring(0, 80)}${feedback.length > 80 ? '...' : ''}"`);

            const msgId = this.addMessage('assistant', '', 'metaflow');
            this.setMessageStreaming(msgId, true);
            let accumulated = '';

            const result = await MetaFlowService.callAI(
                prompt,
                (chunk: string) => {
                    accumulated += chunk;
                    this.updateMessage(msgId, accumulated);
                },
                controller.signal
            );

            if (!settingsStore.stream || !settingsStore.isConfigured) {
                this.updateMessage(msgId, result);
            }
            this.setMessageStreaming(msgId, false);

            this.lastAggregatedResult = result;
            this.iterationRound++;

            this.metaFlowIsRunning = false;
            this.metaFlowFinished = true;
            this.abortController = null;
            this.setStage('idle');

        } catch (e: any) {
            this.handleError(e);
        }
    }

    /**
     * Full regeneration: discard current result and regenerate with history context.
     */
    async executeRegeneration() {
        if (this.metaFlowIsRunning) return;

        // Record rejection in history
        this.iterationHistory.push({
            round: this.iterationRound,
            feedback: '(Full rejection — regenerating)',
            resultSummary: this.lastAggregatedResult.substring(0, 200)
        });

        const controller = new AbortController();
        this.abortController = controller;
        this.metaFlowIsRunning = true;
        this.metaFlowFinished = false;

        try {
            const historyText = this.iterationHistory.map(h =>
                `Round ${h.round}: ${h.feedback} \nResult summary: ${h.resultSummary} `
            ).join('\n\n');

            const prompt = META_PROMPTS.regenerateWithHistory
                .replace('{goal}', this.pipelineState.currentGoal)
                .replace('{history}', historyText || 'None');

            this.setStage('aggregate');
            this.addMessage('thought', '**Full Regeneration**\nDiscarding previous result and generating fresh solution with history context.');

            const msgId = this.addMessage('assistant', '', 'metaflow');
            this.setMessageStreaming(msgId, true);
            let accumulated = '';

            const result = await MetaFlowService.callAI(
                prompt,
                (chunk: string) => {
                    accumulated += chunk;
                    this.updateMessage(msgId, accumulated);
                },
                controller.signal
            );

            if (!settingsStore.stream || !settingsStore.isConfigured) {
                this.updateMessage(msgId, result);
            }
            this.setMessageStreaming(msgId, false);

            this.lastAggregatedResult = result;
            this.iterationRound++;

            this.metaFlowIsRunning = false;
            this.metaFlowFinished = true;
            this.abortController = null;
            this.setStage('idle');

        } catch (e: any) {
            this.handleError(e);
        }
    }

    private handleError(e: any) {
        if (e.name === 'AbortError') {
            this.addMessage("system", "Pipeline cancelled by user.");
            // Save checkpoint so user can resume later
            if (this.checkpoint) {
                this.addMessage('system', '💾 Checkpoint saved. You can resume from where you left off.');
            }
        } else {
            console.error('MetaFlow Failed:', e);
            // Save checkpoint with error info
            if (this.checkpoint) {
                this.checkpoint.error = e.message;
                this.addMessage('system', `⚠️ Pipeline failed: ${e.message} \nCheckpoint saved at stage: ${this.checkpoint.stage} `);
            } else {
                this.addMessage("system", `MetaFlow failed: ${e.message} `);
            }
        }
        this.metaFlowIsRunning = false;
        this.metaFlowFinished = false; // Not finished — awaiting resume
        this.abortController = null;
        this.setStage('idle');
    }

    saveCheckpoint() {
        if (!this.pipelineState.currentGoal || this.metaFlowFinished) {
            this.clearSavedCheckpoint();
            return;
        }
        const cp = {
            sessionId: this.currentSession.id,
            goal: this.pipelineState.currentGoal,
            governanceState: this.pipelineState.governanceState,
            currentStrategyStep: this.pipelineState.currentStrategyStep,
            collaborationSteps: this.pipelineState.collaborationSteps,
            timestamp: Date.now()
        };
        this.savedCheckpoint = cp;
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem('aone_multiagent_checkpoint', JSON.stringify(cp));
            } catch { }
        }
    }

    loadSavedCheckpoint() {
        if (typeof localStorage === 'undefined') return this.savedCheckpoint;
        try {
            const raw = localStorage.getItem('aone_multiagent_checkpoint');
            if (!raw) return this.savedCheckpoint;
            const parsed = JSON.parse(raw);
            this.savedCheckpoint = parsed;
            return parsed;
        } catch { return this.savedCheckpoint; }
    }

    clearSavedCheckpoint() {
        this.savedCheckpoint = null;
        this.checkpoint = null;
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.removeItem('aone_multiagent_checkpoint');
            } catch { }
        }
    }

    /** Resume pipeline from the last breakpoint checkpoint. */
    resumeFromCheckpoint() {
        const cp = this.savedCheckpoint || this.loadSavedCheckpoint() || this.checkpoint;
        if (!cp || this.metaFlowIsRunning) return;

        this.pipelineState.currentGoal = cp.goal;
        if (cp.governanceState) {
            this.pipelineState.governanceState = cp.governanceState;
        }
        if (cp.collaborationSteps) {
            this.pipelineState.collaborationSteps = cp.collaborationSteps;
        }
        this.pipelineState.currentStrategyStep = cp.currentStrategyStep || 0;
        this.pipelineState.waitingForReview = false;
        this.pipelineState.isPaused = false;
        this.pipelineState.isRunning = true;
        this.metaFlowIsRunning = false;
        this.metaFlowFinished = false;

        const currentStep = (this.pipelineState.currentStrategyStep || 0) + 1;
        const total = this.pipelineState.governanceState?.strategy?.strategy?.length || this.pipelineState.collaborationSteps?.length || 4;

        this.addMessage('system', `▶️ 已从断点处恢复协同（正在执行第 ${currentStep}/${total} 步任务: "${cp.goal}"）...`);
        this.runMetaFlow(cp.goal, true);
    }

    /** Abandon the current checkpoint and reset. */
    abandonCheckpoint() {
        this.clearSavedCheckpoint();
        this.addMessage('system', '🗑️ 已放弃未完成的断点任务。');
    }

    private setStage(stage: any) {
        if (!this.pipelineState) {
            console.error("AgentStore: pipelineState is undefined in setStage");
            return;
        }
        const info = MetaFlowService.getStageInfo(stage);
        this.pipelineState.stage = stage;
        this.pipelineState.progress = info.progress;
    }

    getAgent(id: string) {
        return this.agents.find(a => a.id === id);
    }

    resetIterationState() {
        this.iterationRound = 0;
        this.iterationHistory = [];
        this.lastAggregatedResult = '';
    }

    // ---- Session History Management ----

    private loadSessionHistory(): SessionHistoryItem[] {
        try {
            const raw = localStorage.getItem('multiagent_history');
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    }

    private persistSessionHistory() {
        try {
            localStorage.setItem('multiagent_history', JSON.stringify(this.sessionHistory.slice(0, 15)));
        } catch { /* fallback */ }
    }

    saveToHistory(status: SessionHistoryItem['status'] = 'completed') {
        const goal = this.pipelineState.currentGoal || this.currentSession.messages.find(m => m.role === 'user')?.content || '多智能体协同推演任务';
        if (!goal && this.currentSession.messages.length === 0) return;

        const existingIndex = this.sessionHistory.findIndex(h => h.sessionId === this.currentSession.id || (h.goal === goal && Date.now() - h.timestamp < 3600000));
        
        const activeNames = this.currentSession.activeAgentIds
            .map(id => this.getAgent(id)?.name || id)
            .filter(Boolean);

        const historyItem: SessionHistoryItem = {
            id: existingIndex >= 0 ? this.sessionHistory[existingIndex].id : crypto.randomUUID(),
            sessionId: this.currentSession.id,
            goal: goal.length > 80 ? goal.substring(0, 80) + '...' : goal,
            timestamp: Date.now(),
            status,
            result: this.lastAggregatedResult || this.currentSession.messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content?.substring(0, 300),
            messageCount: this.currentSession.messages.length,
            roundCount: this.currentSession.round || 1,
            activeAgentNames: activeNames.length > 0 ? activeNames : ['协调者', '拆局者', '收网的'],
            messages: JSON.parse(JSON.stringify(this.currentSession.messages)),
            governanceState: this.pipelineState.governanceState ? JSON.parse(JSON.stringify(this.pipelineState.governanceState)) : undefined,
            collaborationSteps: this.pipelineState.collaborationSteps ? JSON.parse(JSON.stringify(this.pipelineState.collaborationSteps)) : undefined
        };

        if (existingIndex >= 0) {
            this.sessionHistory[existingIndex] = historyItem;
        } else {
            this.sessionHistory.unshift(historyItem);
        }

        if (this.sessionHistory.length > 100) {
            this.sessionHistory = this.sessionHistory.slice(0, 100);
        }

        this.persistSessionHistory();
        void saveHistoryToIDB(historyItem);
        this.syncActiveSession();
    }

    loadHistoryItem(item: SessionHistoryItem) {
        if (item.messages && item.messages.length > 0) {
            this.currentSession = {
                id: item.sessionId || crypto.randomUUID(),
                title: item.goal,
                messages: JSON.parse(JSON.stringify(item.messages)),
                activeAgentIds: this.agents.map(a => a.id).slice(0, 3),
                round: item.roundCount || 1
            };
        } else {
            this.clearSession();
            this.addMessage('user', item.goal);
            if (item.result) {
                this.addMessage('assistant', item.result, 'closer');
            }
        }

        if (item.governanceState) {
            this.pipelineState.governanceState = JSON.parse(JSON.stringify(item.governanceState));
        }
        if (item.collaborationSteps) {
            this.pipelineState.collaborationSteps = JSON.parse(JSON.stringify(item.collaborationSteps));
        }
        this.pipelineState.currentGoal = item.goal;
        this.pipelineState.isRunning = false;
        this.metaFlowIsRunning = false;
        this.metaFlowFinished = item.status === 'completed';
        this.addMessage('system', `📂 已成功加载历史会话记录：「${item.goal}」`);
        this.syncActiveSession();
    }

    deleteHistoryItem(id: string) {
        this.sessionHistory = this.sessionHistory.filter(h => h.id !== id);
        this.persistSessionHistory();
        void deleteHistoryFromIDB(id);
    }

    clearHistory() {
        this.sessionHistory = [];
        this.persistSessionHistory();
        void clearAllHistoryFromIDB();
    }

    // 导出 Agent 配置（支持 JSON/YAML）
    exportConfig(format: 'json' | 'yaml' = 'json'): string {
        const config = {
            agents: this.agents.map(a => ({
                id: a.id,
                name: a.name,
                role: a.role,
                description: a.description,
                traits: a.traits,
                color: a.color,
                avatar: a.avatar,
                personaConfig: a.personaConfig,
                temperature: a.temperature,
            })),
            activeAgentIds: this.currentSession.activeAgentIds,
            skills: {
                decomposer: ['decompose'],
                calculator: ['decision_matrix', 'resource_audit'],
                pathfinder: ['reframe'],
                stress_tester: ['stress_test'],
                closer: ['action_list'],
            }
        };

        // 如果是 YAML 格式，需要手动转换（需要 js-yaml 库）
        // 这里先用 JSON，YAML 导出可以在前端转换
        return JSON.stringify(config, null, 2);
    }

    // 导出 YAML 格式
    exportConfigAsYaml(): string {
        const config = this.exportConfig();
        // JSON to YAML 简单转换
        const obj = JSON.parse(config);
        return this.jsonToYaml(obj);
    }

    // 简单的 JSON 转 YAML
    private jsonToYaml(obj: any, indent: number = 0): string {
        const spaces = '  '.repeat(indent);
        let result = '';

        for (const [key, value] of Object.entries(obj)) {
            if (value === null || value === undefined) continue;

            if (Array.isArray(value)) {
                if (value.length === 0) {
                    result += `${spaces}${key}: []\n`;
                } else if (typeof value[0] === 'object') {
                    result += `${spaces}${key}:\n`;
                    value.forEach((item: any, idx: number) => {
                        result += `${spaces}  - ${idx}:\n`;
                        for (const [k, v] of Object.entries(item)) {
                            result += `${spaces}      ${k}: ${JSON.stringify(v)}\n`;
                        }
                    });
                } else {
                    result += `${spaces}${key}:\n`;
                    value.forEach((item: any) => {
                        result += `${spaces}  - ${typeof item === 'string' ? item : JSON.stringify(item)}\n`;
                    });
                }
            } else if (typeof value === 'object') {
                result += `${spaces}${key}:\n${this.jsonToYaml(value, indent + 1)}`;
            } else {
                result += `${spaces}${key}: ${JSON.stringify(value)}\n`;
            }
        }
        return result;
    }

    exportReport(): string {
        const { messages, title } = this.currentSession;
        let report = `# ${title || 'Consultation Report'}\n\n`;
        report += `Date: ${new Date().toLocaleString()}\n\n`;

        // 添加问题摘要
        const userMessages = messages.filter(m => m.role === 'user');
        if (userMessages.length > 0) {
            report += `## 问题描述\n\n${userMessages[0].content}\n\n`;
        }

        // 生成协同链路 Mermaid 流程图
        if (this.pipelineState.collaborationSteps && this.pipelineState.collaborationSteps.length > 0) {
            const steps = this.pipelineState.collaborationSteps;
            report += `## 🔄 协同推演链路\n\n\`\`\`mermaid\ngraph LR\n`;
            steps.forEach((s, idx) => {
                const agentName = this.getAgent(s.agentId)?.name || s.agentId;
                const skillName = s.skillId ? ` (${s.skillId})` : '';
                const nodeName = `Step${s.step}["${s.step}. ${agentName}${skillName}"]`;
                if (idx === 0) {
                    report += `    Start((用户提问)) --> ${nodeName}\n`;
                } else {
                    const prevStepNum = steps[idx - 1]?.step ?? idx;
                    const prevNode = `Step${prevStepNum}`;
                    report += `    ${prevNode} --> ${nodeName}\n`;
                }
            });
            const lastStep = steps[steps.length - 1];
            report += `    Step${lastStep.step} --> End((成果收网))\n\`\`\`\n\n`;
        }

        report += `---\n\n`;

        messages.forEach(m => {
            if (m.role === 'thought' || m.role === 'system') return;
            const role = m.role === 'user' ? '你' : (m.agentId ? this.getAgent(m.agentId)?.name || 'Agent' : '系统');
            report += `## ${role}\n\n${m.content}\n\n`;
        });

        // 添加行动清单
        const actionListMessages = messages.filter(m =>
            m.content.includes('行动清单') || m.content.includes('今天') || m.content.includes('本周')
        );
        if (actionListMessages.length > 0) {
            report += `---\n\n## 📋 行动清单\n\n`;
            actionListMessages.forEach(m => {
                report += `${m.content}\n\n`;
            });
        }

        report += `---\n\n*本报告由 Aone 认知决策工具平台生成*\n`;

        return report;
    }

    // 导入配置（支持 JSON 和 YAML）
    importConfig(content: string) {
        try {
            let data: any;

            // 检测格式
            if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
                // JSON 格式
                data = JSON.parse(content);
            } else {
                // 尝试 YAML 格式解析
                // 简单解析：YAML 转 JSON
                data = this.parseYamlSimple(content);
            }

            if (data) {
                if (data.history) {
                    this.sessionHistory = data.history;
                    this.persistSessionHistory();
                }
                if (data.activeAgentIds) {
                    // 验证 agentId 是否有效
                    const validIds = this.agents.map(a => a.id);
                    const validActiveIds = data.activeAgentIds.filter((id: string) => validIds.includes(id));
                    this.currentSession.activeAgentIds = validActiveIds;
                }
                this.addMessage('system', '✅ 配置导入成功');
            }
        } catch (e) {
            this.addMessage('system', `❌ 导入失败: ${(e as Error).message}`);
        }
    }

    // 简单的 YAML 解析（仅支持基本结构）
    private parseYamlSimple(yaml: string): any {
        const lines = yaml.split('\n');
        const result: any = {};
        const stack: any[] = [result];
        const indentStack: number[] = [0];

        for (const line of lines) {
            if (!line.trim() || line.trim().startsWith('#')) continue;

            const indent = line.search(/\S/);
            const content = line.trim();

            // 调整栈
            while (indent <= indentStack[indentStack.length - 1] && stack.length > 1) {
                stack.pop();
                indentStack.pop();
            }

            if (content.includes(':')) {
                const [key, ...valueParts] = content.split(':');
                const value = valueParts.join(':').trim();
                const current = stack[stack.length - 1];

                if (value) {
                    // 简单键值对
                    current[key] = value.replace(/^["']|["']$/g, '');
                } else {
                    // 对象
                    current[key] = {};
                    stack.push(current[key]);
                    indentStack.push(indent);
                }
            }
        }

        return result;
    }

    getConversationContext(limit = 10): string {
        const msgs = this.currentSession.messages.slice(-limit);
        if (msgs.length === 0) return "无历史对话";
        return msgs.map(m => {
            const roleName = m.role === 'user' ? 'User' : (m.agentId ? `Agent(${m.agentId})` : 'System');
            return `${roleName}: ${m.content}`;
        }).join('\n\n');
    }

    // V1 Scenarios deprecated. V2 uses universal routing.

    clearSession() {
        this.cancelOperation();
        this.currentSession = {
            id: crypto.randomUUID(),
            title: "New Session",
            messages: [],
            // V2: Reset to full arsenal
            activeAgentIds: ['decomposer', 'calculator', 'pathfinder', 'stress_tester', 'closer'],
            round: 0
        };
        this.metaFlowFinished = false;
        this.resetIterationState();
        this.clearDebugLogs();
        this.checkpoint = null;
        this.pipelineState = {
            stage: 'idle',
            progress: 0,
            currentGoal: '',
            lastResults: {},
            waitingForReview: false,
            taskPlan: null,
            scene: null,
            intent: null,
            isRunning: false,
            error: null,
            currentAgentId: undefined,
            stuckCounter: 0,
            lastDecisionHash: ''
        };
        void clearActiveSessionFromIDB();
    }
}

export const agentStore = new AgentStore();
