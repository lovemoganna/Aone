import { MetaFlowService } from "./MetaFlowService";

export interface Skill {
    id: string;
    name: string;
    description: string;
    icon: string; // Emoji or icon name
    inputPrompt: (context: string) => string;
}

export const SKILL_DEFINITIONS: Record<string, Skill> = {
    // Skill 1: 拆问题 (Decompose)
    decompose: {
        id: "decompose",
        name: "拆问题",
        description: "把模糊的困境拆解为独立子问题，按紧急/可控排序。",
        icon: "🔍",
        inputPrompt: (context) => `
**任务**: 执行【问题拆解】(Decompose)
**输入**: "${context}"

**要求**:
1. 提取所有独立子问题。
2. 标注每个问题的类型 (信息/资源/情绪/冲突/能力)。
3. 评估紧急度和可控度。
4. 按“紧急且可控”优先排序。
5. 标注依赖关系。

**输出格式 (Markdown)**:
━━━ 问题拆解 ━━━

你面对的其实是 [N] 个独立问题：

① [问题描述]
   类型: [类型] | 紧急: [高/中/低] | 可控: [全/半/无]
   [简短分析]

② [问题描述]
   类型: [类型] | 紧急: [高/中/低] | 可控: [全/半/无]
   [简短分析]

③ ...

优先级: ① → ②
理由: [排序理由]

你觉得这个拆法对吗？
`
    },

    // Skill 2: 摆天平 (Decision Matrix)
    decision_matrix: {
        id: "decision_matrix",
        name: "摆天平",
        description: "多维度量化评估选项，看清真实偏好。",
        icon: "⚖️",
        inputPrompt: (context) => `
**任务**: 执行【决策矩阵】(Decision Matrix)
**输入**: "${context}"

**要求**:
1. 识别并列出所有选项 (必须包含"维持现状"作为基准)。
2. 引导列出评估维度 (如经济/时间/风险/成长/关系/自由度)。
3. 分配权重 (总和100%)。
4. 逐选项逐维度打分 (1-10)。
5. 计算加权总分。

**输出格式 (Markdown)**:
━━━ 决策天平 ━━━

| 维度 (权重) | 选项A | 选项B | 维持现状 |
|---|---|---|---|
| [维度1] (X%) | N → X.X | N → X.X | N → X.X |
| [维度2] (X%) | N → X.X | N → X.X | N → X.X |
| ... | ... | ... | ... |
| **加权总分** | **X.X** | **X.X** | **X.X** |

关键发现:
- 真正拉开差距的是 [维度]，说明你内心最在乎的是这个
- [选项A]和"维持现状"分数接近，但赢在不同地方...

注意: 分数不是答案。
但如果你看到分数后心里有了倾向，那个倾向通常就是答案。
`
    },

    // Skill 3: 翻底牌 (Stress Test)
    stress_test: {
        id: "stress_test",
        name: "翻底牌",
        description: "推演最坏情况，盘点兜底资源。",
        icon: "🃏",
        inputPrompt: (context) => `
**任务**: 执行【压力测试】(Pre-mortem)
**输入**: "${context}" (恐惧点)

**要求**:
1. 具象化最坏结果。
2. 评估真实发生概率 (依据事实)。
3. 评估后果 (损失、持续时间、可逆性)。
4. 盘点底牌 (经济/能力/社会/退路)。
5. 给出判断 (风险可控 / 需要预案 / 风险过大)。

**输出格式 (Markdown)**:
━━━ 底牌推演 ━━━

你担心的: [描述]

├─ 真实概率: [X%] (依据: ...)
├─ 如果发生: 
│  损失: [描述]
│  持续: [时间]
│  可逆吗: [是/部分/否] → [恢复路径]
│
├─ 你的底牌:
│  · [底牌1]
│  · [底牌2]
│  · [底牌3]
│
└─ 判断: [结论]

你真正需要盯着的风险可能不是这个，而是 [真实风险点]。
`
    },

    // Skill 4: 算家底 (Resource Audit)
    resource_audit: {
        id: "resource_audit",
        name: "算家底",
        description: "盘点现有资源 (金钱/时间/技能/人脉/注意力)。",
        icon: "💎",
        inputPrompt: (context) => `
**任务**: 执行【资源盘点】(Resource Audit)
**输入**: "${context}"

**要求**:
1. 盘点五类资源: 经济、时间、能力、人脉、注意力。
2. 评价每类资源 (充足/够用/紧缺/无)。
3. 找出"隐藏资源"和"资源漏洞"。
4. (如涉及财务)做现金流诊断。

**输出格式 (Markdown)**:
━━━ 家底盘点 ━━━
💰 经济: [评估]
   [描述]
⏰ 时间: [评估]
   [描述]
🛠 能力: [评估]
   [描述]
🤝 人脉: [评估]
   [描述]
⚡ 注意力: [评估]
   [描述]

隐藏资源 (你可能没想到的):
· [指出]

资源漏洞 (正在悄悄流失的):
· [指出]

结论: 用你现有的资源做这件事，[可行/需要补X/暂时不可行]
`
    },

    // Skill 5: 换框架 (Reframe)
    reframe: {
        id: "reframe",
        name: "换框架",
        description: "打破隐含假设，找到第三条路。",
        icon: "🔄",
        inputPrompt: (context) => `
**任务**: 执行【换框架】(Reframe)
**输入**: "${context}" (困局)

**要求**:
1. 识别隐含假设。
2. 检验假设真伪。
3. 区分硬约束和软约束。
4. 提出新框架和新路径。

**输出格式 (Markdown)**:
━━━ 换个角度 ━━━
原框架: "[用户观点]"

隐含假设:
· 假设1: [描述] → 检验: [真/假/存疑]
· 假设2: [描述] → 检验: [真/假/存疑]

硬约束 (真的改不了的):
· [列出]

软约束 (你以为改不了但其实可以的):
· [列出] → 绕过方式: [描述]

新框架: "[新观点]"

新路径:
① [路径描述] — 验证方式: [最小实验]
② [路径描述] — 验证方式: [最小实验]
`
    },

    // Skill 6: 出清单 (Action List)
    action_list: {
        id: "action_list",
        name: "出清单",
        description: "生成可执行、可验证的这类动作清单。",
        icon: "✅",
        inputPrompt: (context) => `
**任务**: 执行【行动清单】(Action List)
**输入**: "${context}" (结论)

**要求**:
1. 提取所有建议。
2. 转化为"动词+对象+时间"格式。
3. 分为今天/这周/本月。
4. 禁用模糊词(思考/了解)，必须是具体动作。

**输出格式 (Markdown)**:
━━━ 行动清单 ━━━

🔴 今天 (立刻做):
1. [动作] (耗时: X分钟, 标志: ...)

🟡 这周:
2. [动作]

🟢 本月:
3. [动作]
`
    }
};

export class SkillService {
    /**
     * Execute a specific skill using the AI.
     */
    static async executeSkill(
        skillId: string,
        context: string,
        signal?: AbortSignal
    ): Promise<string> {
        const skill = SKILL_DEFINITIONS[skillId];
        if (!skill) throw new Error(`Skill ${skillId} not found`);

        const prompt = skill.inputPrompt(context);

        // Call AI directly. Using a generic system prompt for the Tool Executor.
        const systemPrompt = "你是一个认知思维工具引擎。请严格按照 Prompt 的要求执行任务，输出结构化的 Markdown 结果。不要闲聊，直接输出内容。";

        // We combine system and user prompt for the call
        const fullPrompt = `${systemPrompt}\n\n${prompt}`;

        return await MetaFlowService.callAI(fullPrompt, undefined, signal);
    }
}
