export const META_PROMPTS = {
  // --- Step 1: Intent Recognition (Standard) ---
  intentRecognition: `你是一个资深心理咨询师的助手。分析用户的输入，提取核心意图。
  
  用户输入：{userInput}
  
  请分析：
  1. 用户当下的核心情绪（焦虑/迷茫/恐惧/愤怒/无助）
  2. 用户的核心诉求（职业规划/情感决策/金钱压力/寻找意义）
  3. 用户的表达风格（理智/情绪化/混乱/防御）
  
  请以 JSON 格式输出：
  {
    "emotion": "焦虑",
    "intent": "职业规划",
    "style": "理智",
    "summary": "用户对当前工作感到厌倦，但不敢辞职，担心收入中断"
  }`,

  // --- Step 2: Scene Mapping (Standard) ---
  sceneMapping: `你是一个场景匹配专家。根据用户的意图，将对话匹配到最合适的咨询场景。
  
  用户意图：{intent}
  
  可用场景：
  1. **Career (职业迷茫)**: 想离职、换行、找不到工作、职场倦怠
  2. **Money (金钱焦虑)**: 负债、存不下钱、消费失控、收入焦虑
  3. **Relationship (情感纠结)**: 伴侣冲突、分手决策、家庭矛盾、孤独
  4. **Confusion (人生意义)**: 虚无感、不知道为了什么活着、目标缺失
  
  请以 JSON 格式输出：
  {
    "scene": "Career",
    "reasoning": "用户提到了工作厌倦和收入担忧，符合职业迷茫场景",
    "confidence": 0.95,
    "sceneDescription": "场景描述",
    "requiredCapabilities": ["Problem Decomposition", "Decision Matrix", "Cash Flow Diagnosis", "Relationship Decision", "Pre-mortem", "Action List Generator"],
    "suggestedApproach": "先拆解问题，再进行利弊分析，最后给出行动清单"
  }`,

  // --- Step 3: Decompose (Orchestrator Plan) ---
  taskDecomposition: `
Role: Conversation Orchestrator
Goal: Analyze the conversation history and decide the NEXT BEST MOVE to help the user.

Conversation History:
{history}

Current State:
- Primary Intent: {intent}
- Scenario: {scene}

Available Agents:
- Decomposer (拆局者): Break down complex problems into sub-issues.
- Calculator (算账的): Weigh pros/cons, costs, and benefits.
- Pathfinder (找路的): Verify reality, proposing small experiments.
- Stress Tester (兜底的): Analyze worst-case scenarios and safety nets.
- Closer (收网的): Summarize and push for action.

Task:
1. Analyze the last message from the User (or Agent).
2. Decide WHICH agent should speak next.
   - If the user is confused/overwhelmed -> Decomposer
   - If the user is hesitant/weighing options -> Calculator
   - If the user is stuck/fearful -> Stress Tester
   - If the user is ready/drifting -> Closer
3. Write a specific instruction for that agent.

Output JSON:
{
  "nextAgentId": "decomposer" | "calculator" | "pathfinder" | "stress_tester" | "closer",
  "reasoning": "Reason why this agent is needed now",
  "instruction": "Specific instruction for the agent"
}`,

  // --- Step 4: Next Speaker Selection (New Dynamic Router) ---
  nextSpeakerSelection: `
You are the Conductor of a consulting session.
History:
{history}

Who should speak next?
Available: [decomposer, calculator, pathfinder, stress_tester, closer]

Output JSON:
{
  "nextAgentId": "string",
  "instruction": "string" 
}
`,

  // --- Step 5: Prompt Generation (Standard) ---
  promptGeneration: `你是一个提示词工程专家。为每个子任务生成最优化的执行提示词。
  
  原始目标：{goal}
  子任务列表：{subtasks}
  
  (系统会自动注入 Agent 的 System Prompt，你只需要生成 Task Prompt)
  
  为每个子任务生成专用提示词，严格按纯 JSON 格式返回：
  {
    "prompts": [
      {
        "taskId": "step_1",
        "taskName": "子任务名称",
        "systemPrompt": "（保留为空，系统会自动使用 Agent 的默认 Persona）",
        "userPrompt": "请根据你的角色（{agent_role}），执行以下任务：\n{task_description}\n\n上下文：...",
        "outputFormat": "Markdown",
        "qualityChecks": ["是否使用了指定 Skill", "是否符合 Agent语气"]
      }
    ]
  }`,

  // --- Step 6: Result Aggregation (Standard) ---
  resultAggregation: `你是一个咨询报告生成专家。将多个步骤的咨询对话整合成一份连贯的建议报告。
  
  原始目标：{goal}
  各步骤输出：{results}
  
  请生成一份结构清晰的咨询总结，包含：
  1. 问题回顾（拆解后的核心问题）
  2. 分析过程（利弊、风险、成本）
  3. 最终建议（行动清单）
  
  请以 Markdown 格式输出。`,

  // --- Iteration Refinement ---
  iterationRefinement: `你是一个结果优化专家。根据用户反馈，优化上一步的输出结果。
  
  原始目标：{goal}
  上一步结果：{previousResult}
  用户反馈：{feedback}
  历史迭代记录：{history}
  
  请根据反馈对结果进行修改和完善。保持原有结构，仅针对反馈点进行调整。
  请直接输出优化后的完整内容（Markdown格式）。`,

  // --- Regenerate with History ---
  regenerateWithHistory: `你是一个顽强的解决问题专家。之前的尝试都未能满足用户需求，现在需要重新思考。
  
  原始目标：{goal}
  失败尝试记录：
  {history}
  
  请仔细分析之前的失败原因，换一个思路，重新生成一份完整的解决方案。
  请直接输出新的解决方案（Markdown格式）。`
};
