import { browser } from '$app/environment';

export interface SnippetVariable {
    name: string;
    defaultValue: string;
    description: string;
    required: boolean;
}

export interface Snippet {
    id: string;
    title: string;
    code: string;
    language: string;
    description: string;
    tags: string[];
    createdAt: number;
    updatedAt: number;
    isFavorite: boolean;
    scope: string; // 'global' | 'project' | 'private' | 'shared'
    usageScenario: string;
    variables: SnippetVariable[];
    usageCount: number;
    lastUsedAt?: number;
}

const DEFAULT_SNIPPETS: Snippet[] = [
    {
        id: "default-react-debounce",
        title: "useDebounce 自定义 React Hook",
        language: "typescript",
        description: "防抖 Hook，常用于搜索输入框等高频触发的操作，避免频繁请求后端 API。",
        usageScenario: "前端搜索框输入联想、表单校验、窗口调整大小（resize）监听等高频事件防抖。",
        tags: ["react", "hook", "utils"],
        scope: "global",
        isFavorite: true,
        createdAt: 1719500000000,
        updatedAt: 1719500000000,
        code: `import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * @param value 需要防抖的值
 * @param delay 防抖延迟时间（毫秒）
 */
export function useDebounce<T>(value: T, delay: number = $DELAY_MS$): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}`,
        variables: [
            {
                name: "DELAY_MS",
                defaultValue: "300",
                description: "触发防抖操作的延迟毫秒数",
                required: true
            }
        ],
        usageCount: 0
    },
    {
        id: "default-sql-pagination",
        title: "带分页与时间过滤的 SQL 查询",
        language: "sql",
        description: "带有 LIMIT/OFFSET 分页以及更新时间范围过滤的通用 SQL 数据查询片段。",
        usageScenario: "后台管理系统列表查询、日志流水拉取、按创建时间段导出报表等场景。",
        tags: ["database", "sql", "query"],
        scope: "project",
        isFavorite: false,
        createdAt: 1719500100000,
        updatedAt: 1719500100000,
        code: `SELECT 
    id, 
    title, 
    status, 
    created_at 
FROM 
    $TABLE_NAME$
WHERE 
    status = '$STATUS$' 
    AND created_at >= '$START_DATE$'
ORDER BY 
    created_at DESC
LIMIT $LIMIT$ OFFSET $OFFSET$;`,
        variables: [
            {
                name: "TABLE_NAME",
                defaultValue: "users",
                description: "要查询的数据表名称",
                required: true
            },
            {
                name: "STATUS",
                defaultValue: "active",
                description: "过滤的状态值 (e.g. active, pending, deleted)",
                required: false
            },
            {
                name: "START_DATE",
                defaultValue: "2026-01-01 00:00:00",
                description: "过滤的起始时间",
                required: false
            },
            {
                name: "LIMIT",
                defaultValue: "10",
                description: "单页最大返回数量",
                required: true
            },
            {
                name: "OFFSET",
                defaultValue: "0",
                description: "数据偏移量（通常为 (Page-1) * Limit）",
                required: true
            }
        ],
        usageCount: 0
    },
    {
        id: "default-css-centering",
        title: "CSS Flexbox 完美居中容器",
        language: "css",
        description: "使用 Flex 布局实现子元素水平、垂直方向完美居中，包含间距和轴向设置。",
        usageScenario: "登录卡片、弹窗对齐、空状态图标居中等需要元素上下左右居中的页面块。",
        tags: ["css", "layout", "flexbox"],
        scope: "global",
        isFavorite: false,
        createdAt: 1719500200000,
        updatedAt: 1719500200000,
        code: `.$CONTAINER_CLASS$ {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: $DIRECTION$;
    gap: $GAP_PX$px;
    min-height: $MIN_HEIGHT$;
    width: 100%;
    box-sizing: border-box;
}`,
        variables: [
            {
                name: "CONTAINER_CLASS",
                defaultValue: "flex-center-box",
                description: "居中容器的 CSS 类选择器名称",
                required: true
            },
            {
                name: "DIRECTION",
                defaultValue: "row",
                description: "子排列方向，常用值为 row 或 column",
                required: true
            },
            {
                name: "GAP_PX",
                defaultValue: "16",
                description: "子元素之间的物理间隔 (px)",
                required: false
            },
            {
                name: "MIN_HEIGHT",
                defaultValue: "100vh",
                description: "容器的最小高度 (e.g. 100vh, 100%, 400px)",
                required: false
            }
        ],
        usageCount: 0
    }
];

function createSnippetStore() {
    let snippets = $state<Snippet[]>([]);
    let isInitialized = false;

    if (browser) {
        const stored = localStorage.getItem('aone_snippets');
        let loadedSnippets: Snippet[] = [];
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    loadedSnippets = parsed.map((s: any) => ({
                        ...s,
                        createdAt: s.createdAt ?? s.updatedAt ?? Date.now(),
                        scope: s.scope ?? 'private',
                        usageScenario: s.usageScenario ?? '',
                        variables: s.variables ?? [],
                        usageCount: s.usageCount ?? 0,
                        lastUsedAt: s.lastUsedAt
                    }));
                }
            } catch (e) {
                console.error("Failed to parse snippets", e);
            }
        }
        
        if (loadedSnippets.length === 0) {
            snippets = [...DEFAULT_SNIPPETS];
        } else {
            snippets = loadedSnippets;
        }
        isInitialized = true;
    }

    $effect.root(() => {
        $effect(() => {
            if (browser && isInitialized) {
                localStorage.setItem('aone_snippets', JSON.stringify(snippets));
            }
        });
    });

    return {
        get snippets() { return snippets; },
        addSnippet(snippet: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt' | 'isFavorite' | 'usageCount' | 'lastUsedAt'>) {
            const now = Date.now();
            const newSnippet: Snippet = {
                ...snippet,
                id: crypto.randomUUID(),
                createdAt: now,
                updatedAt: now,
                isFavorite: false,
                usageCount: 0
            };
            snippets = [newSnippet, ...snippets];
            return newSnippet;
        },
        updateSnippet(id: string, updates: Partial<Snippet>) {
            snippets = snippets.map(s => s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s);
        },
        deleteSnippet(id: string) {
            snippets = snippets.filter(s => s.id !== id);
        },
        getSnippetById(id: string) {
            return snippets.find(s => s.id === id);
        },
        toggleFavorite(id: string) {
            snippets = snippets.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s);
        },
        incrementUsage(id: string) {
            snippets = snippets.map(s => s.id === id ? { 
                ...s, 
                usageCount: (s.usageCount ?? 0) + 1, 
                lastUsedAt: Date.now() 
            } : s);
        },
        importSnippets(importedList: Snippet[]) {
            const now = Date.now();
            const validated = importedList.map(s => ({
                ...s,
                id: crypto.randomUUID(), // Always assign new UUID to prevent ID collision
                createdAt: s.createdAt ?? now,
                updatedAt: now,
                isFavorite: !!s.isFavorite,
                scope: s.scope ?? 'private',
                usageScenario: s.usageScenario ?? '',
                variables: s.variables ?? [],
                usageCount: s.usageCount ?? 0,
                lastUsedAt: s.lastUsedAt
            }));
            snippets = [...validated, ...snippets];
            return validated.length;
        }
    };
}

export const snippetStore = createSnippetStore();
