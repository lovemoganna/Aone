import { AIBridge } from './AIBridge';
import { settingsStore } from '../stores/settingsStore.svelte';
import { toastStore } from '../stores/toastStore.svelte';

// Toast deduplicate flag: only warn once per app session that Ollama can't run on HTTPS.
let _httpsOllamaWarnedThisSession = false;

export type PipelineStage = 'idle' | 'intent' | 'scene' | 'strategy' | 'decompose' | 'prompt' | 'execute' | 'aggregate';

export interface PipelineStatus {
    stage: PipelineStage;
    label: string;
    description: string;
    progress: number;
}

export class MetaFlowService {
    private static STAGES: Record<PipelineStage, { label: string; desc: string; progress: number }> = {
        idle: { label: 'Idle', desc: 'Ready to start', progress: 0 },
        intent: { label: 'Intent Analysis', desc: 'Understanding your goal...', progress: 15 },
        scene: { label: 'Scene Mapping', desc: 'Identifying execution context...', progress: 30 },
        strategy: { label: 'Strategy Governance', desc: 'Synthesizing strategy...', progress: 40 },
        decompose: { label: 'Task Decomposition', desc: 'Breaking down requirements...', progress: 45 },
        prompt: { label: 'Strategy Design', desc: 'Designing agent instructions...', progress: 60 },
        execute: { label: 'Agent Execution', desc: 'Generating results...', progress: 85 },
        aggregate: { label: 'Result Synthesis', desc: 'Finalizing output...', progress: 100 }
    };

    static getStageInfo(stage: PipelineStage) {
        return this.STAGES[stage];
    }

    /**
     * Sanitizes control characters and common JSON flaws inside strings from AI responses.
     */
    static sanitizeJSONString(jsonStr: string): string {
        let result = '';
        let inString = false;
        let escaped = false;

        for (let i = 0; i < jsonStr.length; i++) {
            const char = jsonStr[i];
            const code = char.charCodeAt(0);

            if (!inString) {
                if (char === '"') {
                    inString = true;
                    result += char;
                } else {
                    result += char;
                }
            } else {
                if (escaped) {
                    escaped = false;
                    result += char;
                } else if (char === '\\') {
                    escaped = true;
                    result += char;
                } else if (char === '"') {
                    inString = false;
                    result += char;
                } else if (char === '\n') {
                    result += '\\n';
                } else if (char === '\r') {
                    result += '\\r';
                } else if (char === '\t') {
                    result += '\\t';
                } else if (code < 0x20) {
                    result += '\\u' + code.toString(16).padStart(4, '0');
                } else {
                    result += char;
                }
            }
        }

        // Strip trailing commas before closing braces/brackets
        return result.replace(/,\s*([}\]])/g, '$1');
    }

    /**
     * Extracts JSON from a string, handling potential Markdown blocks, surrounding text,
     * unescaped control characters in string literals, and trailing commas.
     */
    static extractJSON(text: string): any {
        if (!text || typeof text !== 'string') return {};

        try {
            // 1. Try to find content inside markdown code blocks
            const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
            const rawContent = (markdownMatch ? markdownMatch[1] : text).trim();

            // 2. Direct parse attempt
            try {
                return JSON.parse(rawContent);
            } catch {
                // Continue with extraction
            }

            // 3. Find boundaries for Object {...} or Array [...]
            const firstBrace = rawContent.indexOf('{');
            const lastBrace = rawContent.lastIndexOf('}');
            const firstBracket = rawContent.indexOf('[');
            const lastBracket = rawContent.lastIndexOf(']');

            let candidate = rawContent;

            const hasObject = firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace;
            const hasArray = firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket;

            if (hasObject && (!hasArray || firstBrace < firstBracket)) {
                candidate = rawContent.substring(firstBrace, lastBrace + 1);
            } else if (hasArray) {
                candidate = rawContent.substring(firstBracket, lastBracket + 1);
            }

            // 4. Try parsing extracted candidate
            try {
                return JSON.parse(candidate);
            } catch {
                // Continue with sanitized parse
            }

            // 5. Sanitize control characters and trailing commas
            const sanitized = this.sanitizeJSONString(candidate);
            return JSON.parse(sanitized);
        } catch (e) {
            // Last resort: try regex-based extraction of the largest braced/bracketed block with sanitation
            try {
                const retryMatch = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/);
                if (retryMatch) {
                    const sanitized = this.sanitizeJSONString(retryMatch[0]);
                    return JSON.parse(sanitized);
                }
            } catch (innerError) {
                console.warn('Final JSON parse retry failed:', innerError);
            }

            // Fallback: Check if text contains structured lines that can be mapped to a strategy
            const fallbackStrategy = this.fallbackTextToStrategy(text);
            if (fallbackStrategy && fallbackStrategy.length > 0) {
                return {
                    analysis: text.split('\n')[0] || '自然语言策略自动提取',
                    strategy: fallbackStrategy,
                    reasoning: '基于模型自然语言输出启发式提取'
                };
            }

            return {};
        }
    }

    /**
     * Heuristic fallback parser that turns natural language steps into structured strategy steps.
     */
    static fallbackTextToStrategy(text: string): Array<{ step: number; agent: string; skill?: string; instruction: string }> | null {
        if (!text || typeof text !== 'string') return null;

        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const steps: Array<{ step: number; agent: string; skill?: string; instruction: string }> = [];

        const agentAliasMap: Record<string, string> = {
            '拆局者': 'decomposer',
            'decomposer': 'decomposer',
            '算账的': 'calculator',
            'calculator': 'calculator',
            '探路者': 'pathfinder',
            'pathfinder': 'pathfinder',
            '泼冷水的': 'stress_tester',
            'stress_tester': 'stress_tester',
            '收网的': 'closer',
            'closer': 'closer'
        };

        const skillMap: Record<string, string> = {
            '拆解': 'decompose',
            '矩阵': 'decision_matrix',
            '决策': 'decision_matrix',
            '测试': 'stress_test',
            '风险': 'stress_test',
            '资源': 'resource_audit',
            '重构': 'reframe',
            '清单': 'action_list'
        };

        let stepCounter = 1;
        for (const line of lines) {
            // Match lines starting with digits (e.g., "1.", "1、", "步骤1", "- [拆局者]")
            const match = line.match(/^(?:(?:\d+[\.、\:\-\s]+)|(?:步骤\s*\d+[\:：\-\s]*)|(?:\-\s*\[?))([^\:：\-\—\s\n]+)[\:：\-\—\s]*(.*)$/);
            if (match) {
                const rawName = match[1].replace(/[\[\]\(\)]/g, '').trim();
                const rawInstruction = match[2].trim();

                let matchedAgent = 'closer';
                for (const [key, val] of Object.entries(agentAliasMap)) {
                    if (rawName.includes(key) || line.includes(key)) {
                        matchedAgent = val;
                        break;
                    }
                }

                let matchedSkill: string | undefined = undefined;
                for (const [sKey, sVal] of Object.entries(skillMap)) {
                    if (line.includes(sKey)) {
                        matchedSkill = sVal;
                        break;
                    }
                }

                if (rawInstruction.length > 0 || line.length > 5) {
                    steps.push({
                        step: stepCounter++,
                        agent: matchedAgent,
                        skill: matchedSkill,
                        instruction: rawInstruction || line
                    });
                }
            }
        }

        return steps.length > 0 ? steps : null;
    }

    /**
     * Call AI using the configured provider via AIBridge.
     * Falls back to mock if provider is not configured or network is unreachable.
     */
    static async callAI(prompt: string, onChunk?: (chunk: string) => void, signal?: AbortSignal, timeoutMs?: number): Promise<string> {
        let fullResponse = "";
        const effectiveTimeout = timeoutMs ?? (settingsStore.requestTimeout * 1000);

        // When unconfigured, use sandbox simulator for realistic streaming demo
        if (!settingsStore.isConfigured) {
            await this.simulateSandboxStream(
                prompt,
                (chunk) => {
                    fullResponse += chunk;
                    if (onChunk) onChunk(chunk);
                },
                () => { },
                signal
            );
            return fullResponse;
        }

        // Fast-fail for local providers (Ollama/localhost) on HTTPS:
        // Mixed-content / CORS will block the request anyway — skip the 60s wait and
        // go straight to the sandbox simulator so the user sees an immediate response.
        const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const currentProvider = settingsStore.provider;
        const baseUrl = settingsStore.customBaseUrl || '';
        const isLocalProvider = currentProvider === 'ollama' ||
            baseUrl.includes('localhost') ||
            baseUrl.includes('127.0.0.1') ||
            baseUrl.includes('::1');
        if (isHttps && isLocalProvider) {
            if (!_httpsOllamaWarnedThisSession) {
                _httpsOllamaWarnedThisSession = true;
                toastStore.warning('🔒 检测到本地 Ollama 配置，但当前处于 HTTPS 环境 — 浏览器安全策略阻止 HTTP 混合请求，已自动切换至沙盒推演引擎。如需真实大模型，请在右上角「⚙️」中配置云端 API Key（Groq / Gemini / DeepSeek 等）。');
            }
            await this.simulateSandboxStream(
                prompt,
                (chunk) => {
                    fullResponse += chunk;
                    if (onChunk) onChunk(chunk);
                },
                () => { },
                signal
            );
            return fullResponse;
        }

        await this.streamAI(
            prompt,
            (chunk) => {
                fullResponse += chunk;
                if (onChunk) onChunk(chunk);
            },
            () => { },
            signal,
            effectiveTimeout
        );
        return fullResponse;
    }

    /**
     * Stream AI response with dedicated callbacks and activity-aware timeout watchdog.
     */
    static async streamAI(
        prompt: string,
        onChunk: (chunk: string) => void,
        onComplete: () => void,
        signal?: AbortSignal,
        timeoutMs?: number
    ): Promise<void> {
        if (!settingsStore.isConfigured) {
            const unconfiguredMsg = this.getUnconfiguredNotice();
            onChunk(unconfiguredMsg);
            onComplete();
            return;
        }

        const effectiveTimeout = timeoutMs ?? (settingsStore.requestTimeout * 1000);
        const timeoutController = new AbortController();
        const startTime = Date.now();
        let lastActivity = Date.now();
        let streamHasStarted = false;
        let watchdogTimer: any = null;

        const maxTotalTimeout = Math.max(30000, effectiveTimeout);
        const idleChunkTimeout = Math.min(60000, maxTotalTimeout); // 60s without any token after stream starts

        const scheduleWatchdog = () => {
            if (watchdogTimer) clearTimeout(watchdogTimer);
            
            const totalElapsed = Date.now() - startTime;
            if (totalElapsed >= maxTotalTimeout) {
                timeoutController.abort(new Error(`AI 请求总耗时已超限 (${Math.round(maxTotalTimeout / 1000)}s)`));
                return;
            }

            const nextInterval = streamHasStarted ? idleChunkTimeout : (maxTotalTimeout - totalElapsed);
            watchdogTimer = setTimeout(() => {
                const timeSinceLast = Date.now() - lastActivity;
                if (streamHasStarted && timeSinceLast >= idleChunkTimeout) {
                    timeoutController.abort(new Error(`AI 流式输出卡顿中断 (超过 ${Math.round(idleChunkTimeout / 1000)}s 未收到新响应数据)`));
                } else if (Date.now() - startTime >= maxTotalTimeout) {
                    timeoutController.abort(new Error(`AI 请求响应超时 (等待超过 ${Math.round(maxTotalTimeout / 1000)}s)`));
                } else {
                    scheduleWatchdog();
                }
            }, Math.max(1000, Math.min(nextInterval, maxTotalTimeout - totalElapsed)));
        };

        scheduleWatchdog();

        // Merge external signal
        let activeSignal = timeoutController.signal;
        if (signal) {
            signal.addEventListener('abort', () => timeoutController.abort(signal.reason));
        }

        try {
            const options = settingsStore.getCallOptions({
                stream: true,
                onChunk: (chunk: string) => {
                    lastActivity = Date.now();
                    streamHasStarted = true;
                    scheduleWatchdog();
                    onChunk(chunk);
                },
                signal: activeSignal,
                timeoutMs: effectiveTimeout
            });
            await AIBridge.callAI(prompt, options);
            if (watchdogTimer) clearTimeout(watchdogTimer);
            onComplete();
        } catch (e: any) {
            if (watchdogTimer) clearTimeout(watchdogTimer);
            if (e.name === 'AbortError') {
                throw e;
            }
            // Timeout or any network failure → fall back to sandbox so the pipeline never freezes.
            // On GitHub Pages, Ollama always times out due to HTTPS/CORS restrictions.
            const isTimeout = e.message?.includes('超时') || e.message?.includes('Timeout') || e.message?.includes('timeout');
            if (isTimeout) {
                console.warn('AI request timed out, falling back to sandbox simulator:', e.message);
                toastStore.warning(`⏱️ 模型响应超时 — 检测到 Ollama 无法在 HTTPS 环境中访问。已无缝切换至沙盒推演引擎，演示仍可正常进行。如需真实大模型，请在右上角「⚙️」配置云端 API Key。`);
            } else {
                console.warn('Real AI call failed, gracefully falling back to sandbox simulator:', e.message);
                toastStore.warning(`⚠️ 模型连接失败 (${e.message?.slice(0, 45) || 'Failed to fetch'})，已无缝切换至沙盒推演引擎继续推演。可在右上角配置云端 API Key。`);
            }
            await this.simulateSandboxStream(prompt, onChunk, onComplete, signal);
        }
    }

    /**
     * Stage delay for rate-limit protection.
     */
    static async stageDelay(): Promise<void> {
        const delay = settingsStore.stageDelay * 1000;
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    /**
     * Realistic sandbox simulator for offline testing, demos, and visual pipeline verification.
     */
    static async simulateSandboxStream(
        prompt: string,
        onChunk: (chunk: string) => void,
        onComplete: () => void,
        signal?: AbortSignal
    ): Promise<void> {
        let mockResponse = "";
        if (prompt.includes("intentRecognition") || prompt.includes("意图") || prompt.includes("情绪")) {
            mockResponse = JSON.stringify({
                intent: "复杂目标拆解与决策权衡",
                emotion: "专注探索",
                keywords: ["规划", "落地", "方案"],
                urgency: "中高"
            });
        } else if (prompt.includes("sceneMapping") || prompt.includes("场景")) {
            mockResponse = JSON.stringify({
                scene: "多维权衡与行动清单场景",
                suggestedApproach: "拆解 ➔ 量化 ➔ 风控 ➔ 落地清单"
            });
        } else if (prompt.includes("strategy") || prompt.includes("Output JSON") || prompt.includes("Strategy Planning") || prompt.includes("总体策略")) {
            mockResponse = JSON.stringify({
                analysis: "针对您提出的复杂决策与业务诉求，需要从小队拆解、量化权衡、风险防范与落地执行四个维度展开协同。",
                strategy: [
                    { step: 1, agent: "decomposer", skill: "decompose", instruction: "将核心问题拆解为 3 个关键子命题与前提假设" },
                    { step: 2, agent: "calculator", skill: "decision_matrix", instruction: "建立多维度评分矩阵，对比不同方案的真实代价" },
                    { step: 3, agent: "stress_tester", skill: "stress_test", instruction: "针对最优方案进行极限压力测试与排雷" },
                    { step: 4, agent: "closer", skill: "action_list", instruction: "汇总推演结论并输出首周落地行动清单" }
                ],
                reasoning: "全能小队闭环：先拆解 -> 再算账 -> 后排雷 -> 最终收网"
            }, null, 2);
        } else if (prompt.includes("nextSpeakerSelection") || prompt.includes("nextAgentId")) {
            mockResponse = JSON.stringify({
                nextAgentId: "decomposer",
                skillId: "decompose",
                instruction: "继续深入拆解当前问题结构"
            });
        } else if (prompt.includes("1. 拆解建模") || prompt.includes("decompose") || prompt.includes("拆局者")) {
            mockResponse = `### 🔍 议题本质与核心瓶颈
核心症结在于复杂目标在落地过程中缺乏清晰的解耦架构与优先级分层，导致执行资源分散。

### 🌲 三维独立子问题树 (MECE)
1. **[维度一：主干架构与业务链路闭环]** (紧急度: 极高 | 可控度: 完全)
   - 依赖关系与破局抓手：优先固化最小可行链路 (MVP)，统一各模块契约协议。
2. **[维度二：资源消耗与时间/性能成本]** (紧急度: 高 | 可控度: 部分)
   - 依赖关系与衡量指标：精简单步交互开销，降低系统等待延迟至 300ms 以内。
3. **[维度三：边界异常与外部风险防线]** (紧急度: 高 | 可控度: 部分)
   - 边界约束与熔断底线：建立主动看门狗监控与离线自动保底机制。

### ⚖️ 关键决策分水岭
- **路线 A (激进突破)**：一步到位重构全链路，预期收益高但初期工期长；
- **路线 B (稳健演进)**：聚焦主轴增量迭代，步步为营且具备即时可用性。`;
        } else if (prompt.includes("2. 量化分析") || prompt.includes("decision_matrix") || prompt.includes("calculator") || prompt.includes("算账的")) {
            mockResponse = `### 📊 候选方案量化评估矩阵
| 方案路线 | 核心逻辑 | 预期 ROI 提效 | 实施周期与代价 | 风险系数 (1-10) | 推荐指数 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **路线 A: 激进重构** | 一步到位，全自动化矩阵 | 提效约 60% | 需约 2-3 周集中攻坚 | 7.5 | ★★★★☆ |
| **路线 B: 稳健演进 (推荐)** | 主链路优先，分步增量闭环 | 提效约 45% (首期即达) | 首期 2-4 天即可落地 | 2.2 | ★★★★★ |

### 💰 隐性代价与机会成本清单
1. **跨团队协作心智成本**：大拆大建会导致前期协同摩擦耗损 20% 以上的有效工时。
2. **技术债与回归返工代价**：缺乏测试保护的激进方案容易在边缘场景产生隐藏缺陷。

### 🎯 投入产出比最优解建议
建议采纳【路线 B: 稳健演进】：以最小试错成本实现高确定性交付，快速验证商业与工程闭环。`;
        } else if (prompt.includes("3. 极限证伪") || prompt.includes("stress_test") || prompt.includes("challenger") || prompt.includes("辩驳官") || prompt.includes("泼冷水的")) {
            mockResponse = `### ⚠️ 致命前提假设证伪清单
1. **脆弱假设 1**：假设外部网络与第三方服务始终 100% 保持稳定可用。
   - *证伪依据*：弱网、CORS 限制或服务端限流会导致未受保护的请求直接中断。
2. **脆弱假设 2**：假设用户均在完全理想的环境下进行操作。
   - *证伪依据*：现实中常存在未配置 API Key 或本地模型离线等边界情况。

### 💣 极端崩塌链推演 (Worst-Case Scenario)
- **崩塌路径**：网络调用失败 ➔ 异常未被平滑隔离 ➔ 协同工作流假死挂起 ➔ 用户体验归零。
- **最坏损失估算**：任务流失，信任度下降。

### 🛡️ 刚性止损线与防御熔断阈值
- **熔断指标**：单次 AI 请求若超过时限或发生网络中断，立刻触发自动熔断降级。
- **兜底后备底牌**：无缝激活沙盒仿真引擎，确保全流程推演在任何环境下 100% 顺畅完备。`;
        } else if (prompt.includes("4. 收敛仲裁") || prompt.includes("consensus_synthesis") || prompt.includes("synthesizer") || prompt.includes("裁判官")) {
            mockResponse = `### ⚖️ 终审裁决与路线选定
- **终审采纳路线**：【稳健增量演进 + 自动弹性降级保底】路线
- **置信度**：96%

### 🚫 明确否决项与淘汰路径
- **否决路径 1**：否决无降级保底的纯外部强依赖方案；
- **否决路径 2**：否决周期过长、无法快速自证价值的庞杂方案。

### 🧭 核心执行原则
1. 结论优先，拒绝空泛概念堆叠；
2. 架构具备自愈能力，遇到网络异常自动保底推进。`;
        } else if (prompt.includes("5. 落地交付") || prompt.includes("action_list") || prompt.includes("closer") || prompt.includes("收网的")) {
            mockResponse = `### 📋 落地交付行动清单 (Action List & WBS)
1. **阶段 1：核心主链路校验与环境就绪 (Day 1)**
   - [x] 梳理关键输入参数与契约规范
   - [ ] 完成第一阶段联调与状态流转
2. **阶段 2：韧性防护与异常熔断建设 (Day 2-3)**
   - [ ] 接入看门狗超时监控与错误降级链路
   - [ ] 验证弱网与断网环境下的自愈表现
3. **阶段 3：全景交付与持续度量 (Day 4)**
   - [ ] 执行全套功能验证与生产构建验证

### ✅ 验收标准 (Definition of Done)
- **指标 1**：端到端协同零异常挂起，任何网络扰动均能平滑自愈；
- **指标 2**：全流程交付清单颗粒度清晰，具备直接可执行性。`;
        } else if (prompt.includes("pathfinder") || prompt.includes("探路者") || prompt.includes("破局力")) {
            mockResponse = `### 🚀 探路者 · 创新破局方案路线
1. **核心破局杠杆点**：通过声明式自愈架构，将异常处理收敛到单点中枢。
2. **ROI 收益预估**：开发与调试摩擦降低 70%，系统端到端韧性提升至 99.9%。
3. **MVP 实施节奏**：Day 1 完成核心拦截器重构，Day 2 全面集成回归测试。`;
        } else if (prompt.includes("evidence_scout") || prompt.includes("求证者") || prompt.includes("Conflicts") || prompt.includes("conflicts")) {
            mockResponse = JSON.stringify([
                {
                    id: "c1",
                    topic: "激进大拆大建 vs 渐进稳健演进",
                    sideAView: "主张一次性重构全链路，最大化远期工程上限",
                    sideBView: "指出重构期间缺乏测试与过渡保护，极易引发生产事故",
                    tradeOff: "远期架构纯粹度与近期交付确定性的权衡",
                    severity: "high"
                },
                {
                    id: "c2",
                    topic: "强依赖外部大模型 vs 内置沙盒保底",
                    sideAView: "全面调用高阶云端模型以追求最强推演上限",
                    sideBView: "强调在断网、弱网与跨域限制下必须有即时可用沙盒保底",
                    tradeOff: "模型能力上限与系统高可用韧性的权衡",
                    severity: "critical"
                }
            ], null, 2);
        } else if (prompt.includes("unified_arbitration") || prompt.includes("最高裁决") || prompt.includes("Arbitration")) {
            mockResponse = JSON.stringify({
                summary: "裁定采纳【稳健渐进演进 + 双模沙盒弹性降级】复合方案",
                confidenceScore: 95,
                chosenPath: "主干渐进式自愈重构路线",
                tradeOffAnalysis: "主动放弃一次性颠覆式推倒重来，换取 100% 确定性零挂起的稳健交付体验",
                rejectedHypotheses: [
                    "假设外部网络和 API Key 始终可用且无延迟",
                    "假设全量重构不会引入二次逻辑断裂"
                ],
                actionSteps: [
                    "第一步：修复状态更新与 isStreaming 标记清除协议",
                    "第二步：强化沙盒仿真引擎的全流程无缝接管能力",
                    "第三步：验证断点恢复与多专家协同推演闭环"
                ]
            }, null, 2);
        } else {
            mockResponse = `【专家视角协同分析】\n\n针对当前议题，经过认知推演评估：\n1. **核心认知**：把模糊的诉求转化为可量化、可验证的明确目标；\n2. **关键动作**：优先打通最小闭环验证，避免过早过度设计；\n3. **推进策略**：以渐进式演进为主轴，并在关键节点建立安全防御边界。`;
        }

        const chunks = mockResponse.split(/(.{12})/g).filter(Boolean);
        for (const chunk of chunks) {
            if (signal?.aborted) return;
            onChunk(chunk);
            await new Promise(r => setTimeout(r, 18));
        }
        onComplete();
    }

    /**
     * Explicit notice when no provider is configured, refusing to disguise as fake AI intelligence.
     */
    static getUnconfiguredNotice(): string {
        return JSON.stringify({
            error: 'AI_PROVIDER_UNCONFIGURED',
            status: 'unconfigured',
            message: '[UNCONFIGURED] AI Provider is not configured. Please set your API Key in Settings to execute real reasoning.',
            configured: false
        });
    }
}

