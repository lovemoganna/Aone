export interface Tool {
    name: string;
    description: string;
    href: string;
    icon: string;
    category: string;
    badge?: string;
    keywords: string[];
}

export interface ToolGroup {
    title: string;
    description: string;
    items: string[];
}

export const tools: Tool[] = [
    {
        name: "Agent 工作坊",
        description: "配置 Agent 角色 (Persona)、技能 (Skill)、团队协同与可复用工作流编排。",
        href: "/agent-studio",
        icon: "agent",
        category: "AI 智能中心",
        badge: "Core",
        keywords: ["agent", "persona", "skill", "prompt", "orchestration", "编排", "角色", "工作坊"],
    },
    {
        name: "多 Agent 工作台",
        description: "在统一执行界面中调度即时任务、预设团队研讨、协作会话及工作流运行。",
        href: "/multi-agent",
        icon: "multi-agent",
        category: "AI 智能中心",
        badge: "Studio",
        keywords: ["multi-agent", "chat", "roundtable", "工作台", "执行", "协同", "圆桌"],
    },
    {
        name: "提示词中心",
        description: "管理、检索与版本化可复用 Prompt 模板、变量集与即时指令库。",
        href: "/prompt-hub",
        icon: "prompt",
        category: "AI 智能中心",
        badge: "Assets",
        keywords: ["prompt", "template", "hub", "提示词", "指令", "模板库"],
    },
    {
        name: "JSON 编辑器",
        description: "结构化格式化、语法校验、JSONPath 查询、键值排序与类型推导。",
        href: "/json-editor",
        icon: "json",
        category: "数据与架构工作台",
        keywords: ["json", "format", "validate", "jsonpath", "格式化", "校验"],
    },
    {
        name: "表格编辑器",
        description: "轻量数据表格解析、批量清洗、单元格公式、CSV/Excel 格式双向互转与导出。",
        href: "/table-editor",
        icon: "table",
        category: "数据与架构工作台",
        keywords: ["table", "csv", "excel", "sheet", "表格", "数据清洗", "导出"],
    },
    {
        name: "架构图编辑器",
        description: "基于 PlantUML / Graphviz 代码快速绘制系统架构、时序图并导出矢量图。",
        href: "/diagram-editor",
        icon: "diagram",
        category: "数据与架构工作台",
        keywords: ["diagram", "mermaid", "uml", "flowchart", "架构图", "时序图", "流程图"],
    },
    {
        name: "SQL 查询分析器",
        description: "SQL 语法格式化、表依赖推断、执行计划风险提示与索引优化建议。",
        href: "/sql-architect",
        icon: "sql",
        category: "数据与架构工作台",
        keywords: ["sql", "query", "database", "explain", "数据库", "查询分析", "优化"],
    },
    {
        name: "开发者工具箱",
        description: "集合 Base64、JWT 解码、Hash 散列、时间戳、正则、SVG、CSS 等 30+ 款微工具的聚合调试中心。",
        href: "/developer-utilities",
        icon: "utilities",
        category: "开发者聚合工作台",
        badge: "30+ Tools",
        keywords: ["utilities", "base64", "jwt", "hash", "timestamp", "常用工具", "转码", "全能工具箱"],
    },
    {
        name: "代码段管理器",
        description: "本地分类管理常用代码片段、脚手架模版与开发交接规范模板。",
        href: "/snippets",
        icon: "snippets",
        category: "开发者聚合工作台",
        keywords: ["snippets", "code", "template", "代码段", "常用模版"],
    },
    {
        name: "YAML 编辑器",
        description: "多文档 YAML 编辑、语法校验、JSON/YAML 互相转换与配置审查。",
        href: "/developer-utilities#yaml-editor",
        icon: "yaml",
        category: "开发者聚合工作台",
        keywords: ["yaml", "yml", "convert", "配置", "转换", "校验"],
    },
    {
        name: "API 响应查看器",
        description: "分层树形解析 HTTP 响应、状态码诊断、响应头分析与 TypeScript 类型生成。",
        href: "/developer-utilities#api-viewer",
        icon: "api-viewer",
        category: "开发者聚合工作台",
        keywords: ["api", "http", "response", "json", "接口", "响应", "类型生成"],
    },
    {
        name: "API 规范浏览器",
        description: "离线解析 OpenAPI / Swagger 规范，快速检索端点契约、入参定义与模式结构。",
        href: "/developer-utilities#api-spec",
        icon: "api-spec",
        category: "开发者聚合工作台",
        keywords: ["openapi", "swagger", "api", "spec", "接口文档", "规范"],
    },
    {
        name: "模拟数据生成器",
        description: "预设企业级 Schema 模板，快速生成海量真实结构化 Mock 数据与 SQL 填充脚本。",
        href: "/developer-utilities#mock-generator",
        icon: "mock",
        category: "开发者聚合工作台",
        keywords: ["mock", "fake", "data", "schema", "测试数据", "生成器"],
    },
    {
        name: "数据洞察图表",
        description: "将 JSON / CSV 结构化数据秒级渲染为柱状图、折线图、饼图与热力分布图。",
        href: "/developer-utilities#charts",
        icon: "charts",
        category: "开发者聚合工作台",
        keywords: ["charts", "visualize", "bar", "line", "图表", "可视化", "数据分析"],
    },
    {
        name: "代码格式化器",
        description: "多语言代码安全美化、压缩规范化与语言感知的语法诊断。",
        href: "/developer-utilities#code-formatter",
        icon: "formatter",
        category: "开发者聚合工作台",
        keywords: ["formatter", "prettier", "minify", "code", "代码美化", "格式化"],
    },
    {
        name: "差异对比器",
        description: "双栏/单栏并排对比代码、文本、JSON 变更，支持行内差异高亮与补丁导出。",
        href: "/developer-utilities#diff",
        icon: "diff",
        category: "开发者聚合工作台",
        keywords: ["diff", "compare", "patch", "差异", "对比", "版本对比"],
    },
    {
        name: "敏感信息扫描器",
        description: "毫秒级扫描文本与代码中的 API Key、Token、私钥等凭据泄漏并提供安全脱敏。",
        href: "/developer-utilities#secret-scan",
        icon: "secret",
        category: "开发者聚合工作台",
        badge: "Security",
        keywords: ["secret", "security", "token", "key", "safe", "安全", "密钥扫描", "脱敏"],
    },
    {
        name: "Curl 转换器",
        description: "将 cURL 命令行请求一键转换为 Fetch、Axios、Python Requests 或 Go 代码。",
        href: "/developer-utilities#curl",
        icon: "curl",
        category: "开发者聚合工作台",
        keywords: ["curl", "fetch", "axios", "python", "http", "代码转换"],
    },
    {
        name: "正则测试器",
        description: "正则表达式实时可视化匹配、捕获组分析、替换预览与常用规则备忘录。",
        href: "/developer-utilities#regex",
        icon: "regex",
        category: "开发者聚合工作台",
        keywords: ["regex", "regexp", "match", "pattern", "正则表达式", "匹配"],
    },
    {
        name: "SVG 工作室",
        description: "SVG 矢量图标清洗、代码压缩、路径精简以及转换为 Svelte / React 组件。",
        href: "/developer-utilities#svg-studio",
        icon: "svg",
        category: "开发者聚合工作台",
        keywords: ["svg", "icon", "vector", "optimize", "图标", "矢量图", "组件转换"],
    },
    {
        name: "CSS 设计实验室",
        description: "视觉化调节现代 CSS 阴影分层、磨砂玻璃、渐变网格与弹性动效参数。",
        href: "/developer-utilities#css-lab",
        icon: "css",
        category: "开发者聚合工作台",
        keywords: ["css", "shadow", "glass", "gradient", "样式生成", "阴影", "调色板"],
    },
    {
        name: "代码解释器",
        description: "本地多语言运行沙盒，基于 DuckDB WASM 与 Pyodide 支持 SQL、Python 及 JS 极速执行与数据分析。",
        href: "/code-interpreter",
        icon: "interpreter",
        category: "数据与架构工作台",
        badge: "WASM",
        keywords: ["interpreter", "sandbox", "duckdb", "sql", "python", "javascript", "code", "runner", "解释器", "沙盒", "代码运行", "执行"],
    },
];

export const toolGroups: ToolGroup[] = [
    {
        title: "AI 智能中心",
        description: "设计上下文、执行协同任务并沉淀高价值 AI 生产力资产。",
        items: ["/agent-studio", "/multi-agent", "/prompt-hub"],
    },
    {
        title: "数据与架构工作台",
        description: "结构化数据清洗、多维表格编辑、架构图绘制与 SQL 深度分析。",
        items: [
            "/code-interpreter",
            "/json-editor",
            "/table-editor",
            "/diagram-editor",
            "/sql-architect",
        ],
    },
    {
        title: "开发者聚合工作台",
        description: "全能开发者工具箱、代码段管理与 30+ 常用研发调试助手。",
        items: [
            "/developer-utilities",
            "/snippets",
        ],
    },
];

