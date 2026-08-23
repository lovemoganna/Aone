export interface Tag {
    id: string;
    name: string;
    parentId: string | null;
    level: number;
}

export interface Collection {
    id: string;
    name: string;
    parentId?: string;
    description?: string;
    createdAt: number;
}

/**
 * 结构化变量定义。
 * 对应 prompt 正文中的 {{varName}} 占位符。
 */
export interface VariableDef {
    name: string;
    description: string;
    required: boolean;
    defaultValue?: string;
    exampleValue?: string;
    inputType: 'text' | 'textarea' | 'select' | 'number';
    options?: string[]; // 仅 select 类型使用
}

/**
 * 测试用例。
 */
export interface TestCase {
    id: string;
    label?: string;
    inputs: Record<string, string>;
    expectedOutput?: string;
    actualOutput?: string;
    passed?: boolean;
    score?: number; // 1-5 人工评分
    latencyMs?: number;
    tokens?: number;
    model?: string;
    testedAt?: number;
    note?: string;
}

/**
 * 版本快照（每次保存时创建）。
 */
export interface PromptVersion {
    versionId: string;
    promptId: string;
    versionNumber: string; // 如 v1.0 / v1.1
    content: string;
    timestamp: number;
    title: string;
    description?: string;
    changeNote?: string; // 修改说明
}

/**
 * 发布状态：
 * draft      — 草稿（未完成，不对外）
 * testing    — 测试中（有测试用例，待验收）
 * published  — 已发布（通过验收，可直接复用）
 * deprecated — 已废弃（不推荐使用）
 */
export type PromptStatus = 'draft' | 'testing' | 'published' | 'deprecated';

/**
 * 任务类型列表。
 */
export const TASK_TYPES = [
    '写作', '翻译', '总结', '分析', '编程',
    '需求重构', '客服回复', '数据处理',
    '风控审核', '图像生成', '自动化任务', '其他',
] as const;

/**
 * 常用目标模型。
 */
export const TARGET_MODELS = [
    'GPT-4o', 'GPT-4', 'GPT-3.5', 'Claude 3.5 Sonnet', 'Claude 3 Opus',
    'Gemini 1.5 Pro', 'Gemini 2.0 Flash', 'DeepSeek V3', 'Qwen-Max',
    '通用', '其他',
] as const;

/**
 * Prompt 主体。
 */
export interface Prompt {
    id: string;
    title: string;
    content: string;
    description: string;

    // 分类信息
    tags: string[];           // Tag IDs
    collectionId?: string;    // Collection ID
    scene?: string;           // 适用业务场景，如"客服""营销""代码审查"
    taskType?: string;        // 任务类型，从 TASK_TYPES 选择
    targetModel?: string;     // 目标模型，从 TARGET_MODELS 选择

    // 状态
    status?: PromptStatus;

    // 结构化字段
    variableDefs?: VariableDef[];  // 变量定义列表
    outputFormat?: string;         // 输出格式说明
    testCases?: TestCase[];        // 测试用例

    // 元数据
    favorite: boolean;
    createdAt: number;
    updatedAt: number;
    usageCount: number;
    archived?: boolean;
}

export type SortOption = 'updated' | 'created' | 'usage' | 'title';
export type ViewMode = 'grid' | 'compact';
