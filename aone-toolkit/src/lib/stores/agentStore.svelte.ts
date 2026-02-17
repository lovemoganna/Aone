
import { MetaFlowService } from "../services/MetaFlowService";
import { SkillService } from "../services/SkillService";
import { AIBridge } from "../services/AIBridge";
import { settingsStore } from "../stores/settingsStore.svelte";
import { META_PROMPTS } from "$lib/constants/metaPrompts";
import { SURVIVAL_PROMPTS } from "$lib/constants/survivalPrompts";
import { get } from "svelte/store";

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
}

export interface Message {
    id: string;
    role: "user" | "assistant" | "system" | "thought";
    content: string;
    agentId?: string;
    timestamp: number;
    isStreaming?: boolean;
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
    goal: string;
    timestamp: number;
    status: 'completed' | 'failed' | 'cancelled';
    result?: string;
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
    error: string | null;
    currentAgentId?: string;
    stuckCounter: number;
    lastDecisionHash: string;
    currentStrategyStep?: number; // Track strategy execution progress
    governanceState?: {
        status: 'pending' | 'accepted' | 'iterating';
        strategy: any; // The synthesized plan
        feedbackHistory: string[];
    };
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
            avatar: 'sitemap',
            description: "把一团乱麻变成编了号的清单。所有复杂问题的本质，是多个简单问题缠绕在一起。",
            traits: ["拆解", "追问", "编号", "分类"],
            // V2.0 新字段
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
            avatar: 'scale',
            description: "把感觉变成数字，把纠结变成比较。人纠结是因为脑子里同时装着太多维度，转不过来。",
            traits: ["量化", "对比", "成本", "权衡"],
            // V2.0 新字段
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
            avatar: 'compass',
            description: "在看似死局里找到你没想到的第三条路。方向不明的时候，不需要想清楚，需要低成本地试一步。",
            traits: ["试探", "新路", "小实验", "破局"],
            // V2.0 新字段
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
            avatar: 'shield-alert',
            description: "把你最怕的事推演一遍。恐惧的力量90%来自模糊。一旦你看清最坏情况，恐惧就会缩小。",
            traits: ["推演", "底牌", "预案", "韧性"],
            // V2.0 新字段
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
            avatar: 'check-square',
            description: "所有想法如果不变成动作，就是在浪费时间。只给具体行动清单。",
            traits: ["收尾", "清单", "动作", "执行"],
            // V2.0 新字段
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
        }
    ];

    // V2: Fixed Arsenal + Custom Agents
    customAgents: Agent[] = [];

    get agents() {
        return [...this.presetAgents, ...this.customAgents];
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
    private MAX_RETRIES = 3;
    private RETRY_DELAY = 5000;

    // Debug state
    debugLogs = $state<DebugLog[]>([]);
    debugPanelOpen = $state(false);

    // Session history
    sessionHistory = $state<SessionHistoryItem[]>(this.loadSessionHistory());

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

    addDebugLog(type: DebugLog['type'], name: string, data: Partial<DebugLog>) {
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

    addMessage(role: Message["role"], content: string, agentId?: string): string {
        const id = crypto.randomUUID();
        this.currentSession.messages.push({
            id,
            role,
            content,
            agentId,
            timestamp: Date.now()
        });
        return id;
    }

    updateMessage(id: string, content?: string, agentId?: string, isStreaming?: boolean) {
        const msg = this.currentSession.messages.find(m => m.id === id);
        if (msg) {
            if (content !== undefined) msg.content = content;
            if (agentId !== undefined) msg.agentId = agentId;
            if (isStreaming !== undefined) msg.isStreaming = isStreaming;
        }
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
     * Send a single message to the configured AI (direct chat, not MetaFlow).
     */
    async sendMessage(text: string) {
        if (this.isThinking) return;
        this.isThinking = true;

        const activeAgents = this.getActiveAgents();
        if (activeAgents.length === 0) {
            this.addMessage("system", "No active agents selected. Please select agents from the sidebar.");
            this.isThinking = false;
            return;
        }

        const controller = new AbortController();
        this.abortController = controller;

        try {
            for (const agent of activeAgents) {
                if (controller.signal.aborted) break;

                if (settingsStore.isConfigured) {
                    // Real AI call with streaming
                    const msgId = this.addMessage("assistant", "", agent.id);
                    this.setMessageStreaming(msgId, true);
                    let accumulated = '';

                    const prompt = `${agent.systemPrompt} \n\nUser: ${text} `;
                    const options = settingsStore.getCallOptions({
                        stream: settingsStore.stream,
                        onChunk: (chunk: string) => {
                            accumulated += chunk;
                            this.updateMessage(msgId, accumulated);
                        },
                        signal: controller.signal
                    });

                    const result = await AIBridge.callAI(prompt, options);
                    if (!settingsStore.stream) {
                        this.updateMessage(msgId, result);
                    }
                    this.setMessageStreaming(msgId, false);
                } else {
                    // Mock fallback
                    await new Promise(r => setTimeout(r, 800 + Math.random() * 1000));
                    const response = `As a ** ${agent.role}**, I have analyzed your input: "${text}".\n\n ** Analysis:**\n - Perspective from ${agent.name} \n - Recommendation based on ${agent.role} expertise.\n\n > Configure an AI provider in Settings(⚙️) for real responses.`;
                    this.addMessage("assistant", response, agent.id);
                }
            }
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                this.addMessage("system", `Error: ${e.message} `);
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

    async runMetaFlow(goal: string) {
        if (this.metaFlowIsRunning) return;

        const controller = new AbortController();
        this.abortController = controller;
        if (this.pipelineState.isRunning) return;

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
        this.currentSession.round++;

        const crisisLevel2 = SURVIVAL_PROMPTS.crisis.keywords.level2.some(kw => goal.includes(kw));
        if (crisisLevel2) {
            this.addMessage('assistant', SURVIVAL_PROMPTS.crisis.responses.level2);
        }

        this.pipelineState.isRunning = true;
        this.pipelineState.currentGoal = goal;
        this.pipelineState.error = null;
        this.metaFlowIsRunning = true;
        this.metaFlowFinished = false;
        this.pipelineState.waitingForReview = false;

        // Only reset governance if we are starting fresh (not accepted strategy)
        if (this.pipelineState.governanceState?.status !== 'accepted') {
            this.pipelineState.governanceState = undefined;
        }

        try {
            // Stage 1: Intent
            this.setStage('intent');
            const historyContext = this.getConversationContext();
            const intentPrompt = META_PROMPTS.intentRecognition
                .replace('{userInput}', goal) // Corrected placeholder
                .replace('{history}', historyContext);
            const intentResp = await MetaFlowService.callAI(intentPrompt, undefined, controller.signal);
            const intent = MetaFlowService.extractJSON(intentResp);
            this.pipelineState.intent = intent;
            this.addMessage("thought", `** Intent Analysis **\nIntent: ${intent.intent} \nEmotion: ${intent.emotion}`, undefined);

            await MetaFlowService.stageDelay();

            // Stage 2: Scene
            this.setStage('scene');
            const scenePrompt = META_PROMPTS.sceneMapping.replace('{intent}', JSON.stringify(intent));
            const sceneResp = await MetaFlowService.callAI(scenePrompt, undefined, controller.signal);
            const scene = MetaFlowService.extractJSON(sceneResp);
            this.pipelineState.scene = scene;
            this.addMessage("thought", `** Scenario Match **\nScene: ${scene.scene} \nFocus: ${scene.suggestedApproach}`, undefined);

            await MetaFlowService.stageDelay();

            // Stage 2.5: Strategy Governance (Round 0)
            // If this is the START of a turn (not a resume), we synth strategy first.
            // We can check if we already have an accepted strategy for this goal.
            if (!this.pipelineState.governanceState || this.pipelineState.governanceState?.status !== 'accepted') {
                this.setStage('strategy');
                await this.synthesizeStrategy(goal, historyContext, intent);
                return; // PAUSE for Governance
            }

            // Stage 3: Router (Who speaks next?)
            this.setStage('decompose'); // Reusing 'decompose' stage ID for 'Router'

            let nextAgentId: string;
            let nextSkillId: string | undefined | null;
            let instruction: string;

            // --- DETERMINISTIC STRATEGY EXECUTION MODE ---
            if (this.pipelineState.governanceState?.status === 'accepted') {
                const strategy = this.pipelineState.governanceState.strategy.strategy;
                const stepIndex = this.pipelineState.currentStrategyStep || 0;

                if (stepIndex < strategy.length) {
                    // Execute next step from plan
                    const step = strategy[stepIndex];
                    nextAgentId = step.agent;
                    nextSkillId = step.skill;
                    instruction = step.instruction;

                    this.addMessage("thought", `** 策略执行 (步骤 ${stepIndex + 1}/${strategy.length}) **\n执行: ${step.agent} (${step.skill || '对话'})\n指令: ${instruction}`, undefined);

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
                    `Approved Strategy: ${JSON.stringify(this.pipelineState.governanceState.strategy.strategy)}` : "No strict plan.";

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
                const routerDecision = MetaFlowService.extractJSON(routerResp);

                // Initialize from router decision
                nextAgentId = routerDecision.nextAgentId;
                nextSkillId = routerDecision.skillId;
                instruction = routerDecision.instruction;

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

            // EXECUTION LOGIC: Skill vs. Chat
            const msgId = this.addMessage("assistant", "", nextAgentId);
            this.setMessageStreaming(msgId, true);

            // Force skill if stuck loop detected
            if (this.pipelineState.stuckCounter >= 1 && nextAgentId === 'closer') {
                nextSkillId = 'action_list';
            }

            if (nextSkillId && ['decompose', 'decision_matrix', 'stress_test', 'resource_audit', 'reframe', 'action_list'].includes(nextSkillId)) {
                // Execute Skill via SkillService
                try {
                    // Use SkillService (imported)
                    // REFRESH CONTEXT for Skill
                    const skillHistory = this.getConversationContext();
                    const skillResult = await SkillService.executeSkill(nextSkillId, skillHistory + `\nTarget: ${goal}`, controller.signal);

                    this.updateMessage(msgId, skillResult);
                } catch (e: any) {
                    this.updateMessage(msgId, `Skill Execution Failed: ${e.message}`);
                }
            } else {
                // Normal Chat Execution
                const agentSystemPrompt = selectedAgent?.systemPrompt || "You are a helpful assistant.";
                // REFRESH CONTEXT
                const freshHistory = this.getConversationContext();
                const agentPrompt = `${agentSystemPrompt}\n\nContext:\n${freshHistory}\n\nUser Goal: ${goal}\n\nInstruction: ${instruction}\n\nYour Turn:`;

                await MetaFlowService.streamAI(
                    agentPrompt,
                    (chunk) => {
                        const currentContent = this.currentSession.messages.find(m => m.id === msgId)?.content || "";
                        this.updateMessage(msgId, currentContent + chunk);
                    },
                    () => { },
                    controller.signal
                );
            }

            this.setMessageStreaming(msgId, false);
            this.metaFlowIsRunning = false;
            this.metaFlowFinished = true; // Temporary finish for this cycle

            this.abortController = null;
            this.setStage('idle');
            this.pipelineState.currentAgentId = undefined;

            // --- Recursive Loop Logic ---
            if (nextAgentId !== 'closer' && this.currentSession.round < 8) {
                setTimeout(() => {
                    if (this.pipelineState.isRunning) {
                        this.runMetaFlow(goal);
                    }
                }, 2000);
            } else {
                if (nextAgentId === 'closer') {
                    this.addMessage("system", "咨询循环结束。");
                }
            }

        } catch (e: any) {
            this.handleError(e);
        }
    }

    // --- Strategy Governance Methods ---

    async synthesizeStrategy(goal: string, history: string, intent: any) {
        const controller = new AbortController();
        this.abortController = controller;
        this.pipelineState.isRunning = true;
        this.metaFlowIsRunning = true;

        try {
            this.addMessage("thought", "** 协调者思考中 **\n正在制定总体策略...", undefined);

            // 1. Build context
            const availableAgents = this.agents;
            const roster = availableAgents.map(a => `- ${a.name}: ${a.role}`).join('\n');

            // 2. Prompt for Coordinator
            const strategyPrompt = `
你现在是【多智能体系统的协调者 (Coordinator)】。
你的任务是根据用户的目标和历史对话，制定这一轮的“总体策略 (Strategy)”。
你的输出将不再直接执行，而是先提交给用户审核 (Round 0 Governance)。

**上下文**:
User Goal: ${goal}
Intent Analysis: ${JSON.stringify(intent)}
Agent Roster:
${roster}

**可用思维工具 (Skills)**:
- decompose (结构化拆解)
- decision_matrix (决策矩阵)
- stress_test (压力测试)
- resource_audit (资源盘点)
- reframe (思维重构)
- action_list (行动清单)

**要求**:
1. 分析用户意图的深层需求。
2. 制定一个分步骤的对话策略 (Step-by-step Plan)。
3. 指定每个步骤最适合的智能体，以及是否需要由该智能体调用特定思维工具 (Skill)。
   - 例如：让 拆局者 用 decompose 工具。
   - 例如：让 算账的 用 decision_matrix 工具。
4. **必须使用中文输出**。

**输出格式 (JSON)**:
{
  "analysis": "对用户需求的深度分析...",
  "strategy": [
    { "step": 1, "agent": "decomposer", "skill": "decompose", "instruction": "对用户的问题进行结构化拆解..." },
    { "step": 2, "agent": "pathfinder", "skill": "reframe", "instruction": "引导用户发现新的可能性..." }
  ],
  "reasoning": "为什么这样安排..."
}
`;

            // 3. Call AI
            const resp = await MetaFlowService.callAI(strategyPrompt, undefined, controller.signal);
            const strategy = MetaFlowService.extractJSON(resp);

            // 4. Update State
            this.pipelineState.governanceState = {
                status: 'pending',
                strategy: strategy,
                feedbackHistory: []
            };

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

            // Resume pipeline
            this.runMetaFlow(this.pipelineState.currentGoal);
        } else if (action === 'regenerate') {
            // Clear and retry
            this.pipelineState.governanceState = undefined;
            const history = this.getConversationContext();
            // Re-infer intent or use cached? Let's use cached for speed if poss, but runMetaFlow re-runs it.
            // Simplest: just re-run runMetaFlow, it will hit the 'scene' then 'strategy' block again.
            this.runMetaFlow(this.pipelineState.currentGoal);
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
                const strategy = MetaFlowService.extractJSON(resp);

                this.pipelineState.governanceState.strategy = strategy;
                this.pipelineState.governanceState.status = 'pending'; // Back to pending for review
                this.metaFlowIsRunning = false;
                this.pipelineState.waitingForReview = true;

            } catch (e) { this.handleError(e); }
        }
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

    /** Resume pipeline from the last checkpoint. */
    resumeFromCheckpoint() {
        if (!this.checkpoint || this.metaFlowIsRunning) return;
        this.addMessage('system', `▶️ Resuming pipeline from checkpoint(stage: ${this.checkpoint.stage})...`);
        this.checkpoint.retryCount = 0;
        this.checkpoint.error = null;
        this.runMetaFlow(this.checkpoint.goal);
    }

    /** Abandon the current checkpoint and reset. */
    abandonCheckpoint() {
        this.checkpoint = null;
        this.addMessage('system', '🗑️ Checkpoint discarded.');
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
            localStorage.setItem('multiagent_history', JSON.stringify(this.sessionHistory));
        } catch { /* quota exceeded */ }
    }

    saveToHistory(status: SessionHistoryItem['status'] = 'completed') {
        if (!this.pipelineState.currentGoal) return;
        this.sessionHistory.unshift({
            id: crypto.randomUUID(),
            goal: this.pipelineState.currentGoal,
            timestamp: Date.now(),
            status,
            result: this.lastAggregatedResult?.substring(0, 500) || undefined,
        });
        // Keep max 50 entries
        if (this.sessionHistory.length > 50) {
            this.sessionHistory = this.sessionHistory.slice(0, 50);
        }
        this.persistSessionHistory();
    }

    loadHistoryItem(item: SessionHistoryItem) {
        this.clearSession();
        if (item.result) {
            this.addMessage('user', item.goal);
            this.addMessage('assistant', item.result, 'metaflow');
            this.metaFlowFinished = true;
            this.lastAggregatedResult = item.result;
            this.pipelineState.currentGoal = item.goal;
        }
    }

    deleteHistoryItem(id: string) {
        this.sessionHistory = this.sessionHistory.filter(h => h.id !== id);
        this.persistSessionHistory();
    }

    clearHistory() {
        this.sessionHistory = [];
        this.persistSessionHistory();
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
    }
}

export const agentStore = new AgentStore();
