/**
 * Skill 模块 - 内置 Skill 定义
 * 6 种认知工具
 */

import type { SkillDefinition } from './types';

export const builtInSkills: SkillDefinition[] = [
    // ========== Skill 1: 拆问题 ==========
    {
        id: 'decompose',
        name: '拆问题',
        description: '把一个大而模糊的困境拆成多个小而具体的子问题，按紧急度和可控度排优先级',
        oneLiner: '把一团乱麻拆成编号的清单',

        type: 'analysis',

        io: {
            input: '用户的自然语言描述（任何领域）',
            output: '结构化的问题清单，每个问题标注类型、紧急度、可控度',
            format: 'Markdown 格式的编号列表'
        },

        trigger: {
            keywords: ['问题太多', '一团乱', '不知道从哪', '理不清', '说不清'],
            patterns: ['.*[一二三多]件.*事.*'],
            conditions: ['用户描述的问题里缠绕着两件以上的事']
        },

        steps: [
            { order: 1, description: '提取所有独立子问题', action: 'extract_subproblems' },
            { order: 2, description: '标注每个问题的类型', action: 'label_types', outputKey: 'types' },
            { order: 3, description: '评估紧急度和可控度', action: 'assess_urgency' },
            { order: 4, description: '按"紧急+可控"排序', action: 'prioritize' },
            { order: 5, description: '标注依赖关系', action: 'identify_dependencies' }
        ],

        outputTemplate: `
━━━ 问题拆解 ━━━

你面对的其实是 [N] 个独立问题：

① [问题描述]
   类型: [信息缺失/资源不足/情绪干扰/他人冲突/能力缺口] | 紧急: [高/中/低] | 可控: [完全/部分/不可]

② [问题描述]
   类型: ... | 紧急: ... | 可控: ...

优先级: ① → ② → ③
理由: [为什么这个顺序]

你觉得这个拆法对吗？
        `.trim(),

        exceptions: [
            { condition: '描述过于简短', response: '能再多说几句吗？比如最让你头疼的那一个点是什么？' },
            { condition: '只有一个问题', response: '好的，这个问题我们直接来分析。' },
            { condition: '超过7个子问题', response: '有点多，我们合并同类项，控制在5个以内。' }
        ],

        visual: {
            color: '#3B82F6',
            icon: '🔍',
            gradient: 'from-blue-500 to-cyan-500'
        },

        compatibleAgents: ['decomposer', 'calculator', 'pathfinder', 'stress_tester', 'closer'],
        recommendedAgents: ['decomposer'],

        tags: ['拆解', '分析', '分类', '优先级'],

        version: '2.0',
        isBuiltIn: true
    },

    // ========== Skill 2: 摆天平 ==========
    {
        id: 'decision_matrix',
        name: '摆天平',
        description: '把多个选项和多个关心维度列成矩阵，加权打分，看清真实偏好',
        oneLiner: '把纠结变成可比较的数字',

        type: 'quantitative',

        io: {
            input: '选项列表 + 用户在乎的因素',
            output: '加权决策矩阵表，显示各选项在各维度的得分和总分',
            format: 'Markdown 表格'
        },

        trigger: {
            keywords: ['犹豫', '选哪个', '利弊', '比较', '纠结'],
            patterns: ['.*A.*还是.*B.*'],
            conditions: ['用户在两个或更多选项间犹豫']
        },

        steps: [
            { order: 1, description: '列出所有选项（含"维持现状"）', action: 'list_options' },
            { order: 2, description: '引导列出评估维度', action: 'define_dimensions' },
            { order: 3, description: '分配权重（总和100%）', action: 'assign_weights' },
            { order: 4, description: '逐项打分（1-10）', action: 'score_options' },
            { order: 5, description: '计算加权总分', action: 'calculate_scores' },
            { order: 6, description: '分析真实偏好', action: 'analyze_preference' }
        ],

        outputTemplate: `
━━━ 决策天平 ━━━

| 维度（权重）  | 选项A   | 选项B   | 维持现状 |
|-------------|--------|--------|---------|
| [维度1]（X%）| N → X.X | N → X.X | N → X.X |
| [维度2]（X%）| N → X.X | N → X.X | N → X.X |
| 加权总分     | X.X    | X.X    | X.X     |

关键发现:
- 真正拉开差距的是 [维度]，说明你内心最在乎的是这个
- [选项A]和"不动"分数接近，但赢在不同地方

注意: 分数不是答案。
但如果你看到分数后心里有了倾向，那个倾向通常就是答案。
        `.trim(),

        exceptions: [
            { condition: '分数差极小', response: '这几个选项对你来说差别不大，真正的决定因素可能不在这张表里。' },
            { condition: '打分犹豫', response: '不用精确，凭直觉打就行，差1-2分不影响结论。' },
            { condition: '维度过多', response: '有点多，我们合并同类维度，控制在7个以内。' }
        ],

        visual: {
            color: '#14B8A6',
            icon: '⚖️',
            gradient: 'from-teal-500 to-emerald-500'
        },

        compatibleAgents: ['calculator', 'pathfinder', 'closer'],
        recommendedAgents: ['calculator'],

        tags: ['量化', '对比', '决策', '权重'],

        version: '2.0',
        isBuiltIn: true
    },

    // ========== Skill 3: 翻底牌 ==========
    {
        id: 'stress_test',
        name: '翻底牌',
        description: '对用户最恐惧的结果做一次完整推演——发生概率多大、发生了有多糟、你有什么牌可打',
        oneLiner: '把恐惧变成可评估的风险',

        type: 'evaluation',

        io: {
            input: '用户害怕的那个选择 + 具体恐惧',
            output: '推演结果，包含概率评估、损失分析、底牌盘点',
            format: 'Markdown 结构化报告'
        },

        trigger: {
            keywords: ['怕', '万一', '不敢', '担心', '焦虑', '恐惧'],
            patterns: ['万一.*怎么办', '如果.*失败'],
            conditions: ['用户因恐惧不敢决定/行动，或反复说"万一..."']
        },

        steps: [
            { order: 1, description: '具象化最坏结果', action: 'visualize_worst' },
            { order: 2, description: '评估真实发生概率', action: 'assess_probability' },
            { order: 3, description: '评估影响（损失、持续时间、可逆性）', action: 'assess_impact' },
            { order: 4, description: '盘点底牌（经济/能力/社会/退路）', action: 'inventory_resources' },
            { order: 5, description: '给出判断', action: 'make_judgment' }
        ],

        outputTemplate: `
━━━ 底牌推演 ━━━

你担心的: [用用户的话复述]

├─ 真实发生概率: [评估]
│  依据: [具体事实，不是安慰]
│
├─ 如果真发生了:
│  损失: [具体描述]
│  持续: [时间评估]
│  可逆吗: [是/部分/否] → [恢复路径]
│
├─ 你的底牌:
│  · [底牌1]
│  · [底牌2]
│  · [底牌3]
│
└─ 判断: [这个风险你扛得住 / 需要先做X再冒这个险 / 确实要慎重]

你真正需要盯着的风险可能不是这个，而是 [真实风险点]。
        `.trim(),

        exceptions: [
            { condition: '说不出怕什么', response: '想象你做了这个决定，三个月后最差的画面是什么？' },
            { condition: '最坏情况确实严重', response: '那我们来看怎么降低这个概率，或者有没有更安全的路径。' },
            { condition: '多重恐惧', response: '我们一个一个来，先说最让你担心的那一个。' }
        ],

        visual: {
            color: '#8B5CF6',
            icon: '🃏',
            gradient: 'from-violet-500 to-purple-500'
        },

        compatibleAgents: ['stress_tester', 'calculator', 'closer'],
        recommendedAgents: ['stress_tester'],

        tags: ['推演', '风险', '预案', '韧性'],

        version: '2.0',
        isBuiltIn: true
    },

    // ========== Skill 4: 算家底 ==========
    {
        id: 'resource_audit',
        name: '算家底',
        description: '盘清用户手里到底有什么资源——不只是钱，还有时间、技能、人脉、注意力',
        oneLiner: '看看你到底有多少家底',

        type: 'quantitative',

        io: {
            input: '用户对自身资源的描述（或上传的财务数据文件）',
            output: '五类资源清单，标注评估结果和隐藏资源',
            format: 'Markdown 结构化列表'
        },

        trigger: {
            keywords: ['没有资源', '我没钱', '能力不足', '没人脉', '时间不够'],
            patterns: ['我什么都没有', '资源不够'],
            conditions: ['用户说"我什么都没有"或需要评估可行性']
        },

        steps: [
            { order: 1, description: '盘点经济资源', action: 'check_financial', outputKey: 'financial' },
            { order: 2, description: '盘点时间资源', action: 'check_time', outputKey: 'time' },
            { order: 3, description: '盘点能力资源', action: 'check_skills', outputKey: 'skills' },
            { order: 4, description: '盘点人脉资源', action: 'check_network', outputKey: 'network' },
            { order: 5, description: '盘点注意力资源', action: 'check_attention', outputKey: 'attention' },
            { order: 6, description: '找出隐藏资源和漏洞', action: 'find_hidden' }
        ],

        outputTemplate: `
━━━ 家底盘点 ━━━

💰 经济: [评估 - 充足/够用/紧缺/无]
   [具体数据或描述]

⏰ 时间: [评估]
   [每天/每周可用时间]

🛠 能力: [评估]
   [已有技能清单，哪些可以马上变现]

🤝 人脉: [评估]
   [可以打的电话/可以发的消息]

⚡ 注意力: [评估]
   [当前最消耗你注意力的事是什么]

隐藏资源（你可能没想到的）:
· [具体指出]

资源漏洞（正在悄悄流失的）:
· [具体指出]

结论: 用你现有的资源做这件事，[可行/需要补X/暂时不可行]
        `.trim(),

        exceptions: [
            { condition: '用户坚持"什么都没有"', response: '我们逐项来想，你肯定有一些资源的。' },
            { condition: '财务数据不清楚', response: '大概数就行，我们只是做个估算。' }
        ],

        visual: {
            color: '#F59E0B',
            icon: '💎',
            gradient: 'from-amber-500 to-orange-500'
        },

        compatibleAgents: ['calculator', 'stress_tester', 'pathfinder'],
        recommendedAgents: ['calculator'],

        tags: ['资源', '盘点', '财务', '时间'],

        version: '2.0',
        isBuiltIn: true
    },

    // ========== Skill 5: 换框架 ==========
    {
        id: 'reframe',
        name: '换框架',
        description: '改变看问题的角度——把"死局"变成"没看到的活路"，把"二选一"变成"第三种可能"',
        oneLiner: '换个角度，世界大不同',

        type: 'exploration',

        io: {
            input: '用户认为的困局描述 + 已知约束条件',
            output: '新框架 + 新路径列表',
            format: 'Markdown 结构化分析'
        },

        trigger: {
            keywords: ['没有选择', '只能这样', '没办法', '死局', '无路可走'],
            patterns: ['要么.*要么.*', '只能.*了'],
            conditions: ['用户被困在二元对立里']
        },

        steps: [
            { order: 1, description: '识别隐含假设', action: 'identify_assumptions' },
            { order: 2, description: '检验假设真伪', action: 'test_assumptions' },
            { order: 3, description: '区分硬约束和软约束', action: 'distinguish_constraints' },
            { order: 4, description: '生成新路径', action: 'generate_paths' }
        ],

        outputTemplate: `
━━━ 换个框架看 ━━━

你的框架: "[用户看问题的方式]"

你的隐含假设:
· 假设1: [描述] → 检验: [真/假/存疑]
· 假设2: [描述] → 检验: [真/假/存疑]

硬约束（真的改不了的）:
· [列出]

软约束（你以为改不了但其实可以的）:
· [列出] → 绕过方式: [具体描述]

新框架: "[换个角度看这个问题]"

新路径:
① [路径描述] — 验证方式: [最小实验]
② [路径描述] — 验证方式: [最小实验]
③ [路径描述] — 验证方式: [最小实验]
        `.trim(),

        exceptions: [
            { condition: '用户坚持"没有别的路"', response: '有没有其他人面对过类似的情况但走了不同的路？' },
            { condition: '所有假设都经检验为真', response: '那我们来看在这些硬约束下，能做的最优解是什么。' }
        ],

        visual: {
            color: '#EAB308',
            icon: '🔄',
            gradient: 'from-yellow-500 to-amber-500'
        },

        compatibleAgents: ['pathfinder', 'decomposer', 'calculator'],
        recommendedAgents: ['pathfinder'],

        tags: ['重构', '假设', '可能性', '创新'],

        version: '2.0',
        isBuiltIn: true
    },

    // ========== Skill 6: 出清单 ==========
    {
        id: 'action_list',
        name: '出清单',
        description: '把所有分析结论转化为带时间节点的具体行动清单，每个动作都可验证',
        oneLiner: '把想法变成今天就能做的动作',

        type: 'generation',

        io: {
            input: '当前对话中产生的所有结论和建议',
            output: '分档行动清单（今天/这周/本月）',
            format: 'Markdown 任务列表'
        },

        trigger: {
            keywords: ['怎么办', '要做什么', '下一步', '行动', '开始'],
            conditions: ['对话接近尾声，或用户问"该怎么办"']
        },

        steps: [
            { order: 1, description: '提取所有可执行建议', action: 'extract_actions' },
            { order: 2, description: '过滤非动作项', action: 'filter_vague' },
            { order: 3, description: '标准化为"动词+对象+时间"格式', action: 'standardize' },
            { order: 4, description: '分档（今天/这周/本月）', action: 'categorize' },
            { order: 5, description: '标注第一个动作', action: 'mark_first' }
        ],

        outputTemplate: `
━━━ 行动清单 ━━━

🔴 今天（挑一件做就够了）:
⭐ 1. [具体动作]
      耗时: 约X分钟
      做完的标志: [可验证的结果]

🟡 这周:
2. [具体动作]
   耗时: 约X | 做完的标志: [...]
3. [具体动作]
   耗时: 约X | 做完的标志: [...]

🟢 这个月:
4. [具体动作]
   做完的标志: [...]

───────────
⭐ 从第1件开始。现在就可以做。
做完了回来告诉我们，我们推进下一步。
        `.trim(),

        exceptions: [
            { condition: '可执行建议不足', response: '根据我们聊的，你觉得最想先动哪一件？' },
            { condition: '用户说"都做不到"', response: '我们继续拆小，直到找出一个5分钟能做的动作。' },
            { condition: '用户说"这些我早想过了"', response: '想过和做过之间差一个动作，你最接近做的是哪一件？' }
        ],

        visual: {
            color: '#22C55E',
            icon: '✅',
            gradient: 'from-green-500 to-emerald-500'
        },

        compatibleAgents: ['closer', 'decomposer', 'calculator', 'pathfinder', 'stress_tester'],
        recommendedAgents: ['closer'],

        tags: ['行动', '清单', '执行', '时间管理'],

        version: '2.0',
        isBuiltIn: true
    }
];
