export interface Tool {
    name: string;
    description: string;
    href: string;
    icon: string;
    color: string;
}

export const tools: Tool[] = [
    {
        name: "YAML Editor",
        description:
            "Edit and validate YAML files with syntax highlighting and real-time error detection.",
        href: "/yaml-editor",
        icon: "yaml",
        color: "from-amber-500 to-orange-500",
    },
    {
        name: "Table Editor",
        description:
            "Create and edit tabular data with spreadsheet-like interface and export options.",
        href: "/table-editor",
        icon: "table",
        color: "from-emerald-500 to-teal-500",
    },
    {
        name: "JSON Editor",
        description:
            "JSON editor with tree view, formatting, validation, and schema support.",
        href: "/json-editor",
        icon: "json",
        color: "from-blue-500 to-cyan-500",
    },

    {
        name: "Diagram Editor", // Adding this explicitly if it differs, or maybe merging
        description: "Advanced diagram editor supporting PlantUML and Graphviz.",
        href: "/diagram-editor",
        icon: "diagram",
        color: "from-violet-500 to-purple-500"
    },
    {
        name: "Prompt Hub",
        description:
            "Manage and organize AI prompts with templates and version control.",
        href: "/prompt-hub",
        icon: "prompt",
        color: "from-rose-500 to-red-500",
    },
    {
        name: "Agent Studio",
        description:
            "创建、管理和编排 Agent 人格与技能，构建多 Agent 协作系统",
        href: "/agent-studio",
        icon: "agent",
        color: "from-indigo-500 to-violet-500",
    },
    {
        name: "Diff Viewer",
        description: "Compare text, code, or JSON side-by-side or inline.",
        href: "/diff-viewer",
        icon: "diff",
        color: "from-gray-500 to-slate-500",
    },
    {
        name: "Regex Tester",
        description: "Test and debug regular expressions in real-time.",
        href: "/regex-tester",
        icon: "regex",
        color: "from-pink-500 to-rose-500",
    },
    {
        name: "Mock Data Generator",
        description:
            "Generate large amounts of realistic test data for tables and databases.",
        href: "/mock-generator",
        icon: "table",
        color: "from-amber-600 to-orange-600",
    },
    {
        name: "Code Formatter",
        description:
            "Beautify and minify code for multiple languages including JSON, HTML, CSS, and SQL.",
        href: "/code-formatter",
        icon: "json",
        color: "from-sky-500 to-blue-600",
    },
    {
        name: "API Response Viewer",
        description:
            "Analyze and explore complex API JSON responses with tree view and JSONPath querying.",
        href: "/api-viewer",
        icon: "json",
        color: "from-emerald-500 to-green-600",
    },
    {
        name: "Snippet Manager",
        description:
            "Organize and manage your frequently used code fragments and templates.",
        href: "/snippets",
        icon: "prompt",
        color: "from-indigo-500 to-purple-600",
    },
    {
        name: "SVG Studio",
        description:
            "Optimize SVGs and generate Svelte/React component code.",
        href: "/svg-studio",
        icon: "diagram",
        color: "from-orange-500 to-amber-600",
    },
    {
        name: "CSS Design Lab",
        description:
            "Visual generator for Glassmorphism, Shadows, and modern CSS effects.",
        href: "/css-lab",
        icon: "agent",
        color: "from-pink-500 to-indigo-500",
    },
    {
        name: "Curl Converter",
        description:
            "Convert Curl commands to Fetch, Axios, Python, or Go code.",
        href: "/curl-converter",
        icon: "yaml",
        color: "from-slate-600 to-slate-800",
    },
    {
        name: "Secret Scanner",
        description:
            "Scan text for leaked API keys, tokens, and sensitive information.",
        href: "/secret-scanner",
        icon: "regex",
        color: "from-red-500 to-rose-600",
    },
    {
        name: "SQL Architect",
        description:
            "Analyze SQL queries and visualize inferred database schemas.",
        href: "/sql-architect",
        icon: "table",
        color: "from-blue-600 to-indigo-700",
    },
    {
        name: "API Spec Explorer",
        description:
            "Browse and analyze OpenAPI/Swagger specifications offline.",
        href: "/api-spec",
        icon: "json",
        color: "from-emerald-600 to-teal-500",
    },
    {
        name: "Data Insights",
        description:
            "Generate instant Bar and Line charts from JSON or CSV data.",
        href: "/charts",
        icon: "diagram",
        color: "from-blue-400 to-cyan-500",
    },
    {
        name: "Developer Utils",
        description:
            "Essential collection of developer tools including JWT Decoder, Base64 Converter, and more.",
        href: "/developer-utilities",
        icon: "agent", // Using agent icon as fallback for 'toolbox', or reuse another suitable one
        color: "from-teal-500 to-emerald-600",
    },
];
