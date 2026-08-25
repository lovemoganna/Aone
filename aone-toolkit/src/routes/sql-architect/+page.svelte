<script lang="ts">
    import { Panel, Button, EmptyState, CodeEditor } from "$lib/components/ui";
    import ToolWorkspace from "$lib/components/layout/ToolWorkspace.svelte";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { onMount } from "svelte";
    import { format } from "sql-formatter";
    import { dataBridge } from "$lib/stores/dataBridge";
    import HandoffDropdown from "$lib/components/ui/HandoffDropdown.svelte";
    import {
        AlertTriangle,
        CheckCircle2,
        ClipboardCopy,
        Code2,
        Database,
        Info,
        Sparkles,
        Table as TableIcon,
        Trash2,
        BookOpen,
        Layers,
        Network,
        ArrowRight,
        History,
        Star,
        Download,
        RefreshCw,
        FileText,
        Check,
        Loader2,
        X,
    } from "lucide-svelte";


    type Severity = "warning" | "info" | "success";

    interface Finding {
        severity: Severity;
        title: string;
        body: string;
        type?: string;
    }

    interface InferredTable {
        name: string;
        columns: Set<string>;
        primaryKeys: Set<string>;
        foreignKeys: { col: string; refTable: string; refCol: string }[];
        indexes: string[];
    }

    interface HistoryItem {
        id: string;
        sql: string;
        timestamp: number;
        dialect: string;
        title: string;
        favorite?: boolean;
    }

    let sql = $state(
        "SELECT\n    u.name,\n    o.order_date\nFROM\n    users u\n    JOIN orders o ON u.id = o.user_id\nWHERE\n    o.status = 'completed'\nORDER BY\n    o.order_date DESC;",
    );
    let dialect = $state("mysql"); // 'mysql' | 'postgres' | 'sqlite' | 'duckdb' | 'ansi'
    let findings = $state<Finding[]>([]);
    let analyzed = $state(false);
    let queryKind = $state("SELECT review");
    let isAnalyzing = $state(false);
    let activeTab = $state("diagnostics"); // 'diagnostics' | 'ddl' | 'relations'

    let inferredTables = $state<InferredTable[]>([]);
    let generatedDDL = $state("");
    let lastAnalyzedSql = $state("");
    let isDirty = $derived(analyzed && sql.trim() !== lastAnalyzedSql.trim());
    let history = $state<HistoryItem[]>([]);

    const severityIcon = {
        warning: AlertTriangle,
        info: Info,
        success: CheckCircle2,
    };

    const severityClasses = {
        warning:
            "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200",
        info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200",
        success:
            "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200",
    };

    const examples = [
        {
            title: "多表关联与查询优化 (MySQL)",
            dialect: "mysql",
            sql: `SELECT u.id, u.username, u.email, o.amount, o.created_at, p.product_name\nFROM users u\nJOIN orders o ON u.id = o.user_id\nJOIN order_items oi ON o.id = oi.order_id\nJOIN products p ON oi.product_id = p.id\nWHERE u.status = 'active'\n  AND o.status = 'completed'\n  AND o.amount > 100\n  AND p.product_name LIKE 'Phone%'\nORDER BY o.created_at DESC;`
        },
        {
            title: "文件直查与排除列 (DuckDB)",
            dialect: "duckdb",
            sql: `SELECT * EXCLUDE (status, updated_at)\nFROM 's3://bucket/orders.parquet' o\nJOIN users u ON o.user_id = u.id\nWHERE o.amount > 150\n  AND u.status = 'active'\nORDER BY o.created_at DESC\nLIMIT 20;`
        },
        {
            title: "性能风险与 Select * (MySQL)",
            dialect: "mysql",
            sql: `SELECT *\nFROM users u\nJOIN orders o ON u.id = o.user_id\nWHERE YEAR(o.created_at) = 2026\n  AND o.status = 'completed'\n  AND u.username LIKE '%admin%'\nORDER BY o.amount DESC;`
        },
        {
            title: "双引号与语法校验 (PostgreSQL)",
            dialect: "postgres",
            sql: `SELECT id, username, email\nFROM users u\nWHERE u.status = "active"\n  AND u.email = 'admin@example.com'\n  AND u.id = u.id\nHAVING count(*) > 5;`
        }
    ];

    onMount(() => {
        const saved = localStorage.getItem("sql_architect_history");
        if (saved) {
            try {
                history = JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }

        const handoff = dataBridge.consume("/sql-architect");
        if (handoff && handoff.payload) {
            sql = handoff.payload;
        }

        // Auto-format and analyze immediately on mount
        formatSQL();
        analyzeSQL();
        lastAnalyzedSql = sql;
    });


    function saveToHistory() {
        if (!sql.trim()) return;
        
        const existingIdx = history.findIndex(item => item.sql.trim() === sql.trim() && item.dialect === dialect);
        if (existingIdx !== -1) {
            const item = history[existingIdx];
            history.splice(existingIdx, 1);
            history.unshift(item);
        } else {
            const title = sql.trim().split('\n')[0].substring(0, 30) + (sql.trim().length > 30 ? "..." : "");
            history.unshift({
                id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
                sql: sql,
                dialect: dialect,
                timestamp: Date.now(),
                title: title,
                favorite: false
            });
        }
        
        const favorites = history.filter(item => item.favorite);
        const nonFavorites = history.filter(item => !item.favorite).slice(0, 10);
        history = [...favorites, ...nonFavorites];
        
        localStorage.setItem("sql_architect_history", JSON.stringify(history));
    }

    function toggleFavorite(id: string) {
        history = history.map(item => {
            if (item.id === id) {
                return { ...item, favorite: !item.favorite };
            }
            return item;
        });
        localStorage.setItem("sql_architect_history", JSON.stringify(history));
    }

    function deleteHistoryItem(id: string) {
        history = history.filter(item => item.id !== id);
        localStorage.setItem("sql_architect_history", JSON.stringify(history));
    }

    function loadHistoryItem(item: HistoryItem) {
        sql = item.sql;
        dialect = item.dialect;
        formatSQL();
        analyzeSQL();
        lastAnalyzedSql = sql;
    }

    function formatSQL() {
        if (!sql.trim()) return;
        try {
            const languageMap: Record<string, string> = {
                mysql: 'mysql',
                postgres: 'postgresql',
                sqlite: 'sqlite',
                duckdb: 'duckdb',
                ansi: 'sql'
            };
            sql = format(sql, {
                language: (languageMap[dialect] || 'mysql') as any,
                tabWidth: 4,
                keywordCase: 'upper'
            });
        } catch (e) {
            console.error("Failed to format using sql-formatter, falling back to basic formatter", e);
            let formatted = sql.trim();
            const keywords = [
                'SELECT', 'FROM', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 
                'ON', 'WHERE', 'AND', 'OR', 'GROUP BY', 'HAVING', 'ORDER BY', 
                'LIMIT', 'WITH', 'UNION', 'VALUES'
            ];
            keywords.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                formatted = formatted.replace(regex, keyword);
            });

            const primaryClauses = ['SELECT', 'FROM', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'JOIN', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'WITH'];
            primaryClauses.forEach(clause => {
                const regex = new RegExp(`\\b${clause}\\b`, 'g');
                formatted = formatted.replace(regex, `\n${clause}`);
            });

            let lines = formatted.split('\n').map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
            
            for (let i = 1; i < lines.length; i++) {
                const lineUpper = lines[i].toUpperCase();
                const isPrimary = primaryClauses.some(clause => lineUpper.startsWith(clause));
                if (!isPrimary) {
                    lines[i] = '  ' + lines[i];
                }
            }
            
            sql = lines.join('\n');
        }
    }

    function stripSqlComments(value: string) {
        return value
            .replace(/\/\*[\s\S]*?\*\//g, " ")
            .replace(/--.*$/gm, " ")
            .trim();
    }

    function getStatements(value: string) {
        return value
            .split(";")
            .map((statement) => statement.trim())
            .filter(Boolean);
    }

    function hasBalancedQuotes(value: string) {
        const singleQuotes = (value.match(/(?<!')'(?!')/g) || []).length;
        const doubleQuotes = (value.match(/(?<!")"(?!")/g) || []).length;
        return singleQuotes % 2 === 0 && doubleQuotes % 2 === 0;
    }

    async function handleAnalyze() {
        if (!sql.trim()) return;
        isAnalyzing = true;
        formatSQL();
        await new Promise((r) => setTimeout(r, 200));
        analyzeSQL();
        lastAnalyzedSql = sql;
        saveToHistory();
        isAnalyzing = false;
    }

    function clearAll() {
        sql = "";
        findings = [];
        analyzed = false;
        queryKind = "SELECT review";
        inferredTables = [];
        generatedDDL = "";
        activeTab = "diagnostics";
        lastAnalyzedSql = "";
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.ctrlKey && e.key === "Enter") {
            e.preventDefault();
            handleAnalyze();
        }
    }

    function copyFindings() {
        const text = findings.map((f) => `[${f.severity.toUpperCase()}] ${f.title}: ${f.body}`).join("\n");
        copyToClipboard(text, "Findings");
    }

    function copyDDL() {
        copyToClipboard(generatedDDL, "Generated DDL");
    }

    function applyQuickFix(type: string) {
        if (type === "missing_limit") {
            let trimmed = sql.trim();
            if (trimmed.endsWith(";")) {
                trimmed = trimmed.slice(0, -1);
            }
            if (!/limit\s+\d+/i.test(trimmed)) {
                sql = trimmed + "\nLIMIT 100;";
            }
            analyzeSQL();
            lastAnalyzedSql = sql;
        } else if (type === "select_all") {
            let newSql = sql;
            const selectStarRegex = /\bselect\s+\*\b/i;
            const selectAliasStarRegex = /\bselect\s+([a-zA-Z_]\w*)\.\*\b/i;
            
            if (selectStarRegex.test(sql)) {
                const allCols: string[] = [];
                inferredTables.forEach(t => {
                    t.columns.forEach(c => allCols.push(`${t.name}.${c}`));
                });
                if (allCols.length > 0) {
                    newSql = sql.replace(selectStarRegex, `SELECT ${allCols.join(', ')}`);
                }
            } else {
                const match = sql.match(selectAliasStarRegex);
                if (match) {
                    const alias = match[1];
                    const cleaned = stripSqlComments(sql);
                    const tableRefRegex = /\b(?:from|join)\s+(?:'([^']+)'|"([^"]+)"|([a-zA-Z_][\w."]*))(?:\s+(?:as\s+)?([a-zA-Z_][\w]*))?/gi;
                    let m;
                    let tableName = "";
                    while ((m = tableRefRegex.exec(cleaned)) !== null) {
                        const tName = m[1] || m[2] || m[3];
                        const tAlias = m[4] || tName;
                        if (tAlias.toLowerCase() === alias.toLowerCase()) {
                            tableName = tName.split('.').pop() || tName;
                            if (tableName.includes('/') || tableName.includes('\\') || tableName.includes('.')) {
                                const parts = tableName.split(/[/\\]/);
                                const filename = parts[parts.length - 1];
                                tableName = filename.split('.')[0] || filename;
                            }
                            break;
                        }
                    }
                    const table = inferredTables.find(t => t.name === tableName);
                    if (table && table.columns.size > 0) {
                        const cols = Array.from(table.columns).map(c => `${alias}.${c}`);
                        newSql = sql.replace(selectAliasStarRegex, `SELECT ${cols.join(', ')}`);
                    }
                }
            }
            sql = newSql;
            analyzeSQL();
            lastAnalyzedSql = sql;
        } else if (type === "like_prefix") {
            sql = sql.replace(/(like\s+['"])%(.*?['"])/gi, "$1$2");
            analyzeSQL();
            lastAnalyzedSql = sql;
        } else if (type === "redundant_self_compare") {
            let cleaned = sql;
            cleaned = cleaned.replace(/\s+and\s+([a-zA-Z_]\w*\.[a-zA-Z_]\w*)\s*=\s*\1\b/gi, "");
            cleaned = cleaned.replace(/\bwhere\s+([a-zA-Z_]\w*\.[a-zA-Z_]\w*)\s*=\s*\1\s+and\b/gi, "WHERE");
            cleaned = cleaned.replace(/\bwhere\s+([a-zA-Z_]\w*\.[a-zA-Z_]\w*)\s*=\s*\1\b/gi, "");
            sql = cleaned;
            analyzeSQL();
            lastAnalyzedSql = sql;
        } else if (type === "pg_double_quotes") {
            sql = sql.replace(/=\s*"([^"]*)"/g, "='$1'");
            analyzeSQL();
            lastAnalyzedSql = sql;
        } else if (type === "mysql_ilike") {
            sql = sql.replace(/\bilike\b/gi, "LIKE");
            analyzeSQL();
            lastAnalyzedSql = sql;
        }
    }

    function exportMarkdown() {
        const dateStr = new Date().toISOString().split('T')[0];
        const content = [
            `# SQL 架构分析报告 - ${dateStr}`,
            `\n## 原始 SQL 查询 (${dialect.toUpperCase()})\n`,
            `\`\`\`sql\n${sql}\n\`\`\``,
            `\n## 诊断报告\n`,
            findings.map((f, i) => `${i + 1}. **[${f.severity === 'warning' ? '警告' : f.severity === 'info' ? '建议' : '成功'}] ${f.title}**\n   ${f.body}`).join('\n\n'),
            `\n## 推导数据表及字段\n`,
            inferredTables.map(t => {
                const cols = Array.from(t.columns).map(c => `  - ${c}${t.primaryKeys.has(c) ? ' (PK)' : ''}`).join('\n');
                const fks = t.foreignKeys.map(fk => `  - FK: ${fk.col} -> ${fk.refTable}.${fk.refCol}`).join('\n');
                return `### 表: ${t.name}\n${cols}\n${fks}`;
            }).join('\n\n'),
            `\n## 逆向生成的 DDL\n`,
            `\`\`\`sql\n${generatedDDL}\n\`\`\``
        ].join('\n');

        const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `sql-analysis-report-${dateStr}.md`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function exportJSON() {
        const dateStr = new Date().toISOString().split('T')[0];
        const data = {
            date: dateStr,
            dialect,
            sql,
            findings,
            inferredTables: inferredTables.map(t => ({
                name: t.name,
                columns: Array.from(t.columns),
                primaryKeys: Array.from(t.primaryKeys),
                foreignKeys: t.foreignKeys,
                indexes: t.indexes
            })),
            generatedDDL
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `sql-analysis-report-${dateStr}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function inferSchemaAndDDL(sqlText: string) {
        const cleaned = stripSqlComments(sqlText);
        const nextTables: Record<string, InferredTable> = {};
        const aliasMap: Record<string, string> = {};
        
        // Match table names, single/double quoted paths, and schema formats
        const tableRefRegex = /\b(?:from|join)\s+(?:'([^']+)'|"([^"]+)"|([a-zA-Z_][\w."]*))(?:\s+(?:as\s+)?([a-zA-Z_][\w]*))?/gi;
        let match;
        while ((match = tableRefRegex.exec(cleaned)) !== null) {
            const tableName = match[1] || match[2] || match[3];
            const alias = match[4] || tableName;
            let baseTableName = tableName.split('.').pop() || tableName;
            
            // Clean paths (like parquet/csv file links in DuckDB)
            if (baseTableName.includes('/') || baseTableName.includes('\\') || baseTableName.includes('.')) {
                const parts = baseTableName.split(/[/\\]/);
                const filename = parts[parts.length - 1];
                baseTableName = filename.split('.')[0] || filename;
            }
            
            aliasMap[alias.toLowerCase()] = baseTableName;
            
            if (!nextTables[baseTableName]) {
                nextTables[baseTableName] = {
                    name: baseTableName,
                    columns: new Set(),
                    primaryKeys: new Set(),
                    foreignKeys: [],
                    indexes: []
                };
            }
        }

        const colRefRegex = /\b([a-zA-Z_][\w]*)\.([a-zA-Z_][\w]*)\b/g;
        while ((match = colRefRegex.exec(cleaned)) !== null) {
            const prefix = match[1].toLowerCase();
            const colName = match[2];
            const resolvedTable = aliasMap[prefix];
            if (resolvedTable && nextTables[resolvedTable]) {
                nextTables[resolvedTable].columns.add(colName);
                if (colName.toLowerCase() === 'id') {
                    nextTables[resolvedTable].primaryKeys.add(colName);
                }
            }
        }

        const joinRegex = /\b([a-zA-Z_][\w]*)\.([a-zA-Z_][\w]*)\s*=\s*([a-zA-Z_][\w]*)\.([a-zA-Z_][\w]*)\b/gi;
        while ((match = joinRegex.exec(cleaned)) !== null) {
            const alias1 = match[1].toLowerCase();
            const col1 = match[2];
            const alias2 = match[3].toLowerCase();
            const col2 = match[4];

            const table1 = aliasMap[alias1];
            const table2 = aliasMap[alias2];

            if (table1 && table2 && table1 !== table2) {
                if (col1.toLowerCase() === 'id' && col2.toLowerCase().endsWith('id')) {
                    nextTables[table2].foreignKeys.push({
                        col: col2,
                        refTable: table1,
                        refCol: col1
                    });
                    nextTables[table2].columns.add(col2);
                    nextTables[table1].columns.add(col1);
                    nextTables[table1].primaryKeys.add(col1);
                } else if (col2.toLowerCase() === 'id' && col1.toLowerCase().endsWith('id')) {
                    nextTables[table1].foreignKeys.push({
                        col: col1,
                        refTable: table2,
                        refCol: col2
                    });
                    nextTables[table1].columns.add(col1);
                    nextTables[table2].columns.add(col2);
                    nextTables[table2].primaryKeys.add(col2);
                }
            }
        }

        const whereRegex = /\b([a-zA-Z_][\w]*)\.([a-zA-Z_][\w]*)\s*(?:=|in|like|>=|<=|>|<)\b/gi;
        const whereCols: Record<string, Set<string>> = {};
        while ((match = whereRegex.exec(cleaned)) !== null) {
            const alias = match[1].toLowerCase();
            const col = match[2];
            const resolvedTable = aliasMap[alias];
            if (resolvedTable) {
                if (!whereCols[resolvedTable]) whereCols[resolvedTable] = new Set();
                whereCols[resolvedTable].add(col);
                if (nextTables[resolvedTable]) {
                    nextTables[resolvedTable].columns.add(col);
                }
            }
        }

        Object.values(nextTables).forEach(table => {
            table.foreignKeys.forEach(fk => {
                table.indexes.push(`CREATE INDEX idx_${table.name}_${fk.col} ON ${table.name}(${fk.col});`);
            });

            if (whereCols[table.name]) {
                whereCols[table.name].forEach(col => {
                    if (col.toLowerCase() === 'id') return;
                    const indexName = `idx_${table.name}_${col}`;
                    const hasFk = table.foreignKeys.some(fk => fk.col === col);
                    if (!hasFk) {
                        table.indexes.push(`CREATE INDEX ${indexName} ON ${table.name}(${col});`);
                    }
                });
            }
        });

        let ddlStatements: string[] = [];
        Object.values(nextTables).forEach(table => {
            let colsDdl: string[] = [];
            const columnsArray = Array.from(table.columns);
            
            columnsArray.forEach(col => {
                const isPk = table.primaryKeys.has(col);
                let colType = "VARCHAR(255)";
                if (col.toLowerCase() === 'id') colType = "INT";
                else if (col.toLowerCase().endsWith('id')) colType = "INT";
                else if (col.toLowerCase().endsWith('_date') || col.toLowerCase().endsWith('_at') || col.toLowerCase() === 'date' || col.toLowerCase() === 'time') {
                    colType = "TIMESTAMP";
                } else if (col.toLowerCase() === 'status' || col.toLowerCase() === 'state') {
                    colType = "VARCHAR(50)";
                } else if (col.toLowerCase() === 'amount' || col.toLowerCase() === 'price' || col.toLowerCase() === 'balance') {
                    colType = "DECIMAL(10, 2)";
                } else if (col.toLowerCase() === 'age' || col.toLowerCase() === 'count') {
                    colType = "INT";
                }

                let line = `    ${col} ${colType}`;
                if (isPk) {
                    line += " PRIMARY KEY";
                }
                colsDdl.push(line);
            });

            table.foreignKeys.forEach(fk => {
                colsDdl.push(`    FOREIGN KEY (${fk.col}) REFERENCES ${fk.refTable}(${fk.refCol})`);
            });

            let tableDdl = `CREATE TABLE ${table.name} (\n${colsDdl.join(',\n')}\n);`;
            ddlStatements.push(tableDdl);
            if (table.indexes.length > 0) {
                ddlStatements.push(table.indexes.join('\n'));
            }
        });

        return {
            tables: Object.values(nextTables),
            ddl: ddlStatements.join('\n\n')
        };
    }

    function analyzeSQL() {
        const cleaned = stripSqlComments(sql);
        const normalized = cleaned.toLowerCase();
        const nextFindings: Finding[] = [];

        if (!cleaned) {
            findings = [
                {
                    severity: "warning",
                    title: "空查询",
                    body: "在运行 analysis 前，请先输入 SQL 语句。",
                },
            ];
            analyzed = true;
            return;
        }

        if (!hasBalancedQuotes(cleaned)) {
            findings = [
                {
                    severity: "warning",
                    title: "SQL 格式错误",
                    body: "查询存在未闭合的引号。在信任静态审查结果之前请修正语法错误。",
                },
            ];
            analyzed = true;
            return;
        }

        const statements = getStatements(cleaned);
        if (statements.length > 1) {
            findings = [
                {
                    severity: "warning",
                    title: "不支持多条语句",
                    body: "一次只能审查一条只读的 SELECT 语句。请在分析前拆分脚本。",
                },
            ];
            analyzed = true;
            return;
        }

        if (
            /\b(insert|update|delete|drop|alter|truncate|create|merge|grant|revoke|call|execute)\b/i.test(
                cleaned,
            )
        ) {
            findings = [
                {
                    severity: "warning",
                    title: "不支持或不安全的语句",
                    body: "此工具仅审查只读 SELECT 查询。修改数据、DDL、权限和存储过程语句已被拦截。",
                },
            ];
            analyzed = true;
            return;
        }

        if (!/^\s*(select|with)\b/i.test(cleaned)) {
            findings = [
                {
                    severity: "warning",
                    title: "仅支持 SELECT 查询",
                    body: "请粘贴 SELECT 查询，或以 SELECT 结尾的 WITH 查询。其他 SQL 类型超出了本分析器的范围。",
                },
            ];
            analyzed = true;
            return;
        }

        queryKind = /^\s*with\b/i.test(cleaned) ? "WITH/SELECT 审查" : "SELECT 审查";

        // SELECT * Check (dialect aware: DuckDB allows SELECT * EXCLUDE / REPLACE)
        const isSelectStar = /\bselect\s+\*\b/i.test(cleaned);
        const isSelectStarExclude = /\bselect\s+\*\s+(exclude|replace)\b/i.test(cleaned);
        
        if (isSelectStar && !isSelectStarExclude) {
            nextFindings.push({
                severity: "warning",
                title: "避免使用 SELECT *",
                body: "尽量仅选择所需的列。使用 SELECT * 会增加 I/O 开销与网络带宽消耗，且容易在表结构发生改变时引起代码耦合问题。",
                type: "select_all"
            });
        }

        if (normalized.includes("select") && !/\blimit\b|\btop\s+\d+|\boffset\b/i.test(cleaned)) {
            nextFindings.push({
                severity: "info",
                title: "建议加入行数限制 (LIMIT)",
                body: "面向 UI 的查询或探索性查询应显式加入 LIMIT / TOP 限制，以防返回包含海量数据的查询结果集，导致数据库内存瞬时升高。",
                type: "missing_limit"
            });
        }

        if (/\border\s+by\b/i.test(cleaned) && !/\blimit\b|\btop\s+\d+|\boffset\b/i.test(cleaned)) {
            nextFindings.push({
                severity: "info",
                title: "ORDER BY 缺少 LIMIT 限制",
                body: "全表排序（File Sort）开销极大，特别是对大表而言。建议结合 LIMIT/OFFSET 进行分页排序，确保查询能够利用索引局部有序性快速返回。",
                type: "missing_limit"
            });
        }

        if (/\blike\s+['"]%.*?['"]/i.test(cleaned)) {
            nextFindings.push({
                severity: "warning",
                title: "避免使用前缀模糊查询 (LIKE '%abc')",
                body: "百分号位于最左侧的前缀模糊查询会导致列上的 B-Tree 索引失效，从而触发全表扫描。可考虑改用前缀匹配 (LIKE 'abc%')，或在海量文本场景下搭建全文索引 (Full-Text Search)。",
                type: "like_prefix"
            });
        }

        if (/\b(lower|upper|year|month|day|date|substr|substring|coalesce)\s*\(\s*[a-zA-Z_][\w]*\.[a-zA-Z_][\w]*\s*\)/i.test(cleaned)) {
            nextFindings.push({
                severity: "warning",
                title: "避免在过滤条件中对列使用函数",
                body: "在 WHERE 过滤中，如果将索引列包裹在函数内 (如 YEAR(o.created_at) = 2026)，会导致数据库无法直接检索索引树。建议重写为区间条件 (o.created_at >= '2026-01-01' AND o.created_at < '2027-01-01')。",
                type: "function_in_where"
            });
        }

        if (/(?:!=|<>)/.test(cleaned)) {
            nextFindings.push({
                severity: "info",
                title: "不等号过滤 (!= 或 <>) 索引失效风险",
                body: "不等式条件判定通常无法高效使用索引范围扫描 (Index Range Scan)。如果此类判定所排除的数据比例较少，数据库会倾向于直接全表扫描。请检查执行计划。",
            });
        }

        if (/\bhaving\b/i.test(cleaned) && !/\bgroup\s+by\b/i.test(cleaned)) {
            nextFindings.push({
                severity: "warning",
                title: "检测到 HAVING 缺少 GROUP BY",
                body: "HAVING 应当配合 GROUP BY 进行聚合后过滤。如果在没有分组的情况下过滤，可能导致非预期的全表聚合。若只需要过滤单行记录，请改用 WHERE 条件以提早收敛数据规模。",
            });
        }

        const redundantMatch = cleaned.match(/\b([a-zA-Z_][\w]*\.[a-zA-Z_][\w]*)\s*=\s*\1\b/i);
        if (redundantMatch) {
            nextFindings.push({
                severity: "warning",
                title: "存在冗余列自我比较",
                body: `检测到无意义的过滤条件 \`${redundantMatch[0]}\`。请核实该字段是否为手误造成的冗余，这在动态拼装 SQL 或联表过滤时尤为常见。`,
                type: "redundant_self_compare"
            });
        }

        if (/\bjoin\b/i.test(cleaned)) {
            nextFindings.push({
                severity: "info",
                title: "验证多表关联索引",
                body: "多表 JOIN 时，请务必保证 ON 子句对应的关联键在两张表中均建有索引（主键、外键或联合索引），这是避免大表嵌套循环关联引起阻塞的基石。",
            });
        }

        if (dialect === "postgres" && /=\s*"([^"]*)"/gi.test(cleaned)) {
            nextFindings.push({
                severity: "warning",
                title: "PostgreSQL 双引号字符串警告",
                body: "PostgreSQL 中双引号用于标识符（如列名、表名），字符串字面量（值）必须使用单引号。使用双引号可能会被数据库解析为未知的列名而报错。",
                type: "pg_double_quotes"
            });
        }

        if (dialect === "mysql" && /\bilike\b/i.test(cleaned)) {
            nextFindings.push({
                severity: "warning",
                title: "MySQL 不支持 ILIKE",
                body: "MySQL 原生不支持 ILIKE 关键字。MySQL 默认的 LIKE 判定是不区分大小写的，如果需要区分大小写，请改用 LIKE BINARY，或者在其他方言中使用 LIKE。",
                type: "mysql_ilike"
            });
        }

        // DuckDB Specific check
        if (dialect === "duckdb" && /\b\d+\s*\/\s*\d+\b/.test(cleaned)) {
            nextFindings.push({
                severity: "info",
                title: "DuckDB 除法类型精度提示",
                body: "在 DuckDB 中，整数除法符 `/` 默认会返回浮点数 (Double) 精度。如果您希望执行整除截断，建议使用整除操作符 `//`。",
            });
        }

        if (nextFindings.length === 0) {
            nextFindings.push({
                severity: "success",
                title: "基础静态审查通过",
                body: "轻量级语法与索引敏感度检查已通过。在实际生产投产前，建议进一步配合真实表环境执行 EXPLAIN 检查执行计划。",
            });
        }

        findings = nextFindings;
        
        const schema = inferSchemaAndDDL(sql);
        inferredTables = schema.tables;
        generatedDDL = schema.ddl;

        analyzed = true;
    }

    let tables = $derived(inferredTables.map((t) => t.name));
</script>

<svelte:head>
    <title>SQL 查询工作台 - Aone 工具箱</title>
</svelte:head>

<ToolWorkspace class="w-full h-full" enableResize={false} resizeKey="aone-sql-architect-workspace">
    {#snippet header()}
        <div class="flex items-center gap-3 flex-1">
            <div
                class="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
            >
                <Database size={14} />
            </div>
            <div>
                <h1 class="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                    SQL 架构与静态分析
                </h1>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    SQL 语法校验、性能反模式诊断与 DDL / 关系图谱逆向生成
                </p>
            </div>
        </div>
    {/snippet}

    <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-full w-full">
        <!-- Left: SQL input workspace -->
        <div class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shadow-2xs overflow-hidden">
            <div class="py-2.5 px-4 flex flex-wrap gap-2 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 shrink-0">
                <div class="flex items-center gap-2">
                    <Code2 size={13} class="text-slate-500" />
                    <h2 class="font-semibold text-xs text-slate-800 dark:text-slate-200">
                        查询编辑器
                    </h2>
                </div>
                <div class="flex items-center gap-1.5">
                    <HandoffDropdown
                        sourceTool="SQL 分析器"
                        dataType="sql"
                        getData={() => generatedDDL || sql}
                    />
                    <!-- Dialect Selector -->
                    <select 
                        bind:value={dialect}
                        class="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:border-slate-400 cursor-pointer"
                        title="数据库方言选择"
                    >
                        <option value="mysql">MySQL</option>
                        <option value="postgres">PostgreSQL</option>
                        <option value="sqlite">SQLite</option>
                        <option value="duckdb">DuckDB</option>
                        <option value="ansi">ANSI SQL</option>
                    </select>

                    <!-- SQL formatting -->
                    <button 
                        onclick={formatSQL}
                        disabled={!sql}
                        class="px-2.5 py-1 text-xs bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                        title="一键格式化 SQL"
                    >
                        <Code2 size={12} />
                        <span>格式化</span>
                    </button>
                    
                    <!-- Clear -->
                    <button 
                        onclick={clearAll}
                        class="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                        title="清空 SQL"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            <!-- CodeMirror CodeEditor -->
            <div class="flex-1 min-h-0 relative border-b border-slate-200 dark:border-slate-800">
                <CodeEditor
                    bind:value={sql}
                    language="sql"
                    placeholder="在此输入 SELECT 或 WITH 查询... (Ctrl+Enter 开始分析)"
                />
            </div>
            
            <!-- Editor footer / Action Bar -->
            <div class="flex items-center justify-between py-2 bg-slate-50/50 dark:bg-slate-900/30 px-3 shrink-0 border-b border-slate-100 dark:border-slate-800/40">
                <span class="text-[11px] text-slate-400 dark:text-slate-500 font-mono">快捷键: Ctrl+Enter 运行分析</span>
                
                <div class="flex items-center gap-2">
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onclick={() => copyToClipboard(sql, 'SQL')}
                        disabled={!sql}
                    >
                        <ClipboardCopy size={13} class="mr-1" /> 复制 SQL
                    </Button>
                    <button
                        onclick={handleAnalyze}
                        disabled={isAnalyzing || !sql.trim()}
                        class="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 font-medium text-xs shadow-2xs active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        {#if isAnalyzing}
                            <Loader2 size={13} class="animate-spin" />
                            <span>诊断中...</span>
                        {:else}
                            <Sparkles size={13} />
                            <span>静态诊断与推导</span>
                        {/if}
                    </button>
                </div>
            </div>

            <!-- History and Favorites -->
            <div class="border-t border-slate-200 dark:border-slate-800 pt-2.5 px-3 pb-2.5 shrink-0 bg-slate-50/30 dark:bg-slate-950/20">
                <div class="flex items-center justify-between mb-1.5">
                    <h3 class="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <History size={12} class="text-slate-400" />
                        <span>最近分析 ({history.length})</span>
                    </h3>
                    {#if history.length > 0}
                        <button 
                            onclick={() => { history = []; localStorage.removeItem("sql_architect_history"); }}
                            class="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                        >
                            <Trash2 size={10} />
                            清空
                        </button>
                    {/if}
                </div>

                {#if history.length === 0}
                    <p class="text-[11px] text-slate-400 dark:text-slate-500 py-1">暂无历史，点击“诊断”后将自动记录。</p>
                {:else}
                    <div class="max-h-[100px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {#each history as item}
                            <div class="flex items-center justify-between p-1.5 bg-white dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-200/80 dark:border-slate-700/60 text-xs transition-colors group">
                                <button 
                                    onclick={() => loadHistoryItem(item)}
                                    class="flex-1 text-left font-mono truncate mr-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                                    title={item.sql}
                                >
                                    <span class="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] rounded font-sans uppercase mr-1.5">{item.dialect}</span>
                                    {item.title}
                                </button>
                                <div class="flex items-center gap-1 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onclick={() => toggleFavorite(item.id)}
                                        class="p-1 rounded text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                        title={item.favorite ? "取消收藏" : "加入收藏"}
                                    >
                                        <Star size={11} fill={item.favorite ? "currentColor" : "none"} class={item.favorite ? "text-amber-500" : ""} />
                                    </button>
                                    <button 
                                        onclick={() => deleteHistoryItem(item.id)}
                                        class="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                        title="删除此记录"
                                    >
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        <!-- Right: Diagnostic report & Schema Architect tabs -->
        <div class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shadow-2xs overflow-hidden">
            <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-2 shrink-0">
                <div class="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                    <button
                        class="px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer {activeTab === 'diagnostics' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}"
                        onclick={() => activeTab = 'diagnostics'}
                    >
                        诊断报告
                    </button>
                    <button
                        class="px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer {activeTab === 'ddl' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}"
                        onclick={() => activeTab = 'ddl'}
                    >
                        逆向 DDL
                    </button>
                    <button
                        class="px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer {activeTab === 'relations' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}"
                        onclick={() => activeTab = 'relations'}
                    >
                        关系图谱 {#if analyzed && inferredTables.length > 0}({inferredTables.length}){/if}
                    </button>
                </div>
                
                <div class="flex items-center gap-1 pr-1 shrink-0">
                    {#if analyzed}
                        <button 
                            onclick={exportMarkdown}
                            class="px-2 py-1 text-[11px] bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                            title="导出为 Markdown 报告"
                        >
                            <Download size={11} />
                            <span>Markdown</span>
                        </button>
                        <button 
                            onclick={exportJSON}
                            class="px-2 py-1 text-[11px] bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                            title="导出为 JSON 数据"
                        >
                            <Download size={11} />
                            <span>JSON</span>
                        </button>
                    {/if}
                </div>
            </div>

            <!-- SQL Dirty check banner -->
            {#if isDirty}
                <div class="px-3.5 py-1.5 bg-amber-50/80 dark:bg-amber-950/20 border-b border-amber-200/60 dark:border-amber-900/50 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 shrink-0 font-mono">
                    <div class="flex items-center gap-1.5">
                        <AlertTriangle size={12} class="text-amber-500" />
                        <span>检测到 SQL 已修改，诊断报告及 DDL 已过期。</span>
                    </div>
                    <button 
                        onclick={handleAnalyze}
                        class="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-medium transition-colors flex items-center gap-1 shadow-2xs cursor-pointer font-sans"
                    >
                        <RefreshCw size={10} />
                        重新分析
                    </button>
                </div>
            {/if}

            <div class="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-slate-900 rounded-b-lg flex flex-col custom-scrollbar">
                {#if isAnalyzing}
                    <div class="p-8 flex flex-col items-center justify-center space-y-3 h-64 animate-pulse my-auto">
                        <div class="w-8 h-8 rounded-full border-2 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100 animate-spin"></div>
                        <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">正在扫描 SQL 结构与性能风险...</p>
                    </div>
                {:else if !analyzed}
                    <!-- Initial State with guide -->
                    <div class="p-6 space-y-5">
                        <div class="text-center py-2">
                            <div class="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto mb-2.5">
                                <Sparkles size={20} />
                            </div>
                            <h3 class="text-xs font-semibold text-slate-800 dark:text-slate-200">运行 SQL 静态分析与设计</h3>
                            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                                在左侧编写或粘贴 SQL 查询，点击“分析”获取性能诊断及逆向建表 DDL。
                            </p>
                        </div>
                        
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div class="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-1.5">
                                <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    <AlertTriangle size={13} class="text-amber-500" />
                                    <span>性能诊断与反模式识别</span>
                                </div>
                                <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                    自动匹配 SELECT *、LIMIT 缺失、前缀模糊、函数包裹列等 10+ 类经典反模式。
                                </p>
                            </div>
                            <div class="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-1.5">
                                <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    <Database size={13} class="text-slate-500" />
                                    <span>逆向 DDL 与推荐索引</span>
                                </div>
                                <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                    提取 SQL 中涉及的表与字段，推测字段数据类型，提供建表 DDL 及索引建议。
                                </p>
                            </div>
                        </div>
                        
                        <div class="pt-1">
                            <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">快速载入示例</div>
                            <div class="flex flex-wrap gap-2">
                                {#each examples as ex}
                                    <button 
                                        onclick={() => { sql = ex.sql; dialect = ex.dialect; handleAnalyze(); }}
                                        class="px-2.5 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <BookOpen size={11} class="text-slate-400" />
                                        <span>{ex.title}</span>
                                    </button>
                                {/each}
                            </div>
                        </div>
                    </div>
                {:else if activeTab === 'diagnostics'}
                    <div class="p-5 space-y-5 flex-1">
                        <section class="space-y-3">
                            <div class="flex items-center justify-between">
                                <div class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    诊断结果 ({findings.length})
                                </div>
                                {#if findings.length > 0}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onclick={copyFindings}
                                        title="复制所有诊断结果"
                                        class="h-7 w-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        <ClipboardCopy size={13} />
                                    </Button>
                                {/if}
                            </div>

                            <div class="space-y-2.5">
                                {#each findings as finding}
                                    {@const Icon = severityIcon[finding.severity]}
                                    <div
                                        class="rounded-lg border p-3.5 text-xs shadow-2xs {severityClasses[finding.severity]}"
                                    >
                                        <div class="flex items-start gap-2.5">
                                            <div class="p-1 rounded bg-white/60 dark:bg-black/20 shrink-0 mt-0.5">
                                                <Icon size={14} />
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <div class="flex items-center gap-2 flex-wrap">
                                                    <span class="font-semibold text-xs">
                                                        {finding.title}
                                                    </span>
                                                    {#if finding.severity === 'warning'}
                                                        <span class="text-[9px] px-1.5 py-0.2 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded font-semibold uppercase">风险</span>
                                                    {:else if finding.severity === 'info'}
                                                        <span class="text-[9px] px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded font-semibold uppercase">建议</span>
                                                    {:else}
                                                        <span class="text-[9px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded font-semibold uppercase">通过</span>
                                                    {/if}
                                                </div>
                                                <p class="mt-1 text-xs leading-relaxed opacity-90">
                                                    {finding.body}
                                                </p>
                                                
                                                {#if finding.type}
                                                    <div class="mt-2.5 flex items-center justify-between border-t border-slate-900/5 dark:border-white/5 pt-2">
                                                        <span class="text-[10px] text-slate-400 dark:text-slate-500 font-mono">缺陷类型: {finding.type}</span>
                                                        <button 
                                                            onclick={() => applyQuickFix(finding.type!)}
                                                            class="px-2 py-0.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-medium flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                                                        >
                                                            <Sparkles size={10} />
                                                            <span>一键优化</span>
                                                        </button>
                                                    </div>
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </section>

                        <section class="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <div class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                涉及物理数据表 ({tables.length})
                            </div>
                            {#if tables.length > 0}
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {#each tables as table}
                                        <div
                                            class="flex items-center gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/80 dark:border-slate-800"
                                        >
                                            <div
                                                class="w-1.5 h-1.5 rounded-full bg-emerald-500"
                                            ></div>
                                            <span class="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200"
                                                >{table}</span
                                            >
                                            <span class="badge badge-slate ml-auto text-[9px]">物理表</span>
                                        </div>
                                    {/each}
                                </div>
                            {:else}
                                <EmptyState
                                    icon={Database}
                                    title="未检测到数据表"
                                    description="FROM 和 JOIN 关联的数据表将在此处显示"
                                    compact={true}
                                    variant="muted"
                                />
                            {/if}
                        </section>
                    </div>
                {:else if activeTab === 'ddl'}
                    <!-- DDL Generator Output code view -->
                    <div class="p-5 h-full flex flex-col flex-1 min-h-0 space-y-3">
                        <div class="flex items-center justify-between shrink-0">
                            <div>
                                <h3 class="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                    生成的建表与索引 DDL
                                </h3>
                                <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                    自动推导主键、外键以及适合关联查询的过滤列索引
                                </p>
                            </div>
                            <Button size="sm" variant="secondary" onclick={copyDDL}>
                                <ClipboardCopy size={12} class="mr-1.5" /> 复制 DDL
                            </Button>
                        </div>
                        <div class="flex-1 min-h-[300px] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden relative">
                            <CodeEditor
                                bind:value={generatedDDL}
                                language="sql"
                                readOnly={true}
                            />
                        </div>
                    </div>
                {:else if activeTab === 'relations'}
                    <!-- Relations visual cards view -->
                    <div class="p-5 space-y-4 flex-1">
                        <div>
                            <h3 class="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Layers size={13} class="text-slate-500" />
                                物理表与引用架构图谱
                            </h3>
                            <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                展示自动抽取的元数据物理结构和被发现的索引键配置
                            </p>
                        </div>

                        <div class="grid grid-cols-1 gap-4">
                            {#each inferredTables as table}
                                <div class="border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-800/30 p-4 space-y-3 shadow-2xs">
                                    <!-- Table Header -->
                                    <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                                        <span class="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                            <TableIcon size={13} class="text-slate-400" />
                                            {table.name}
                                        </span>
                                        <span class="text-[10px] font-medium px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md">
                                            实体表
                                        </span>
                                    </div>

                                    <!-- Inferred columns lists -->
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono">
                                        {#each Array.from(table.columns) as col}
                                            {@const isPk = table.primaryKeys.has(col)}
                                            <div class="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/40">
                                                <span class="text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                                    {#if isPk}
                                                        <span class="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-1 py-0.5 rounded font-sans font-bold leading-none">PK</span>
                                                    {:else}
                                                        <span class="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1 py-0.5 rounded font-sans font-medium leading-none">COL</span>
                                                    {/if}
                                                    {col}
                                                </span>
                                                <span class="text-slate-400 dark:text-slate-500 text-[10px]">
                                                    {col.toLowerCase() === 'id' || col.toLowerCase().endsWith('id') ? 'INT' : col.toLowerCase().endsWith('_date') || col.toLowerCase().endsWith('_at') ? 'TIMESTAMP' : 'VARCHAR(255)'}
                                                </span>
                                            </div>
                                        {/each}
                                    </div>

                                    <!-- Foreign Key relations indicator -->
                                    {#if table.foreignKeys.length > 0}
                                        <div class="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                                            <div class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                                <Network size={11} />
                                                外键关系
                                            </div>
                                            {#each table.foreignKeys as fk}
                                                <div class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                                                    <span class="font-bold">{fk.col}</span>
                                                    <ArrowRight size={11} class="text-slate-400 shrink-0" />
                                                    <span class="text-slate-800 dark:text-slate-200 font-bold">{fk.refTable}({fk.refCol})</span>
                                                </div>
                                            {/each}
                                        </div>
                                    {/if}

                                    <!-- Table recommended indexes list -->
                                    {#if table.indexes.length > 0}
                                        <div class="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                                            <div class="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                推荐优化索引
                                            </div>
                                            <div class="space-y-1">
                                                {#each table.indexes as idx}
                                                    <div class="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2 group/index">
                                                        <span class="truncate select-all">{idx}</span>
                                                        <button 
                                                            onclick={() => copyToClipboard(idx, '索引 SQL')}
                                                            class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 opacity-80 group-hover/index:opacity-100 transition-opacity shrink-0 cursor-pointer"
                                                            title="复制创建索引语句"
                                                        >
                                                            <ClipboardCopy size={11} />
                                                        </button>
                                                    </div>
                                                {/each}
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</ToolWorkspace>
