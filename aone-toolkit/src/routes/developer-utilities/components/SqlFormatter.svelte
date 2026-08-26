<script lang="ts">
    import { Button, CodeBlock, CodeEditor } from "$lib/components/ui";
    import { Copy, Maximize2, Minimize2, Database, Sparkles, Trash2, ArrowRightLeft } from "lucide-svelte";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import HandoffDropdown from "$lib/components/ui/HandoffDropdown.svelte";

    let input = $state(`select u.id, u.username, count(o.id) as total_orders, sum(o.amount) as total_spent from users u left join orders o on u.id = o.user_id where u.status = 'active' and u.created_at >= '2026-01-01' group by u.id, u.username having count(o.id) > 5 order by total_spent desc limit 20;`);
    let output = $state("");
    let uppercaseKeywords = $state(true);

    const PRESETS = [
        {
            name: "复杂多表联查 (JOIN & AGG)",
            sql: `select u.id, u.username, count(o.id) as total_orders, sum(o.amount) as total_spent from users u left join orders o on u.id = o.user_id where u.status = 'active' and u.created_at >= '2026-01-01' group by u.id, u.username having count(o.id) > 5 order by total_spent desc limit 20;`
        },
        {
            name: "DDL 建表语句 (CREATE TABLE)",
            sql: `create table if not exists developer_logs (id bigserial primary key, user_id varchar(64) not null, action varchar(128) not null, payload jsonb, ip_address inet, created_at timestamp with time zone default current_timestamp); create index idx_logs_user_id on developer_logs (user_id);`
        },
        {
            name: "事务与条件更新 (UPDATE & CASE)",
            sql: `update accounts set balance = case when account_type = 'vip' then balance * 1.05 else balance * 1.02 end, updated_at = now() where status = 'active' and balance > 1000;`
        }
    ];

    const KEYWORDS = [
        "SELECT", "FROM", "WHERE", "AND", "OR", "GROUP BY", "ORDER BY", "LIMIT",
        "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE",
        "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "OUTER JOIN", "CROSS JOIN", "JOIN",
        "ON", "HAVING", "UNION ALL", "UNION",
        "CASE", "WHEN", "THEN", "ELSE", "END",
        "CREATE TABLE IF NOT EXISTS", "CREATE TABLE", "DROP TABLE", "ALTER TABLE",
        "CREATE INDEX", "PRIMARY KEY", "NOT NULL", "DEFAULT"
    ];

    function format() {
        if (!input.trim()) {
            output = "";
            return;
        }

        let formatted = input.replace(/\s+/g, " ");

        // Replace keywords with case choice
        KEYWORDS.forEach((kw) => {
            const regex = new RegExp(`\\b${kw}\\b`, "gi");
            const targetKw = uppercaseKeywords ? kw.toUpperCase() : kw.toLowerCase();
            formatted = formatted.replace(regex, targetKw);
        });

        // Add line breaks before top-level query blocks
        const breakKeywords = [
            "SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "HAVING", "LIMIT",
            "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "OUTER JOIN", "CROSS JOIN", "JOIN",
            "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE", "UNION ALL", "UNION",
            "CREATE TABLE IF NOT EXISTS", "CREATE TABLE", "ALTER TABLE", "CREATE INDEX"
        ];

        breakKeywords.forEach((kw) => {
            const regex = new RegExp(`\\s(${kw})\\s`, "gi");
            const targetKw = uppercaseKeywords ? kw.toUpperCase() : kw.toLowerCase();
            formatted = formatted.replace(regex, `\n${targetKw} `);
        });

        // Minor indentation for AND / OR inside WHERE
        formatted = formatted.replace(/\s(AND|OR)\s/gi, (match, p1) => {
            const kw = uppercaseKeywords ? p1.toUpperCase() : p1.toLowerCase();
            return `\n  ${kw} `;
        });

        formatted = formatted
            .replace(/\(\s*/g, "(\n  ")
            .replace(/\s*\)/g, "\n)");

        output = formatted.trim();
    }

    function minify() {
        if (!input.trim()) {
            output = "";
            return;
        }
        output = input.replace(/\s+/g, " ").trim();
        toastStore.info("已压缩 SQL 语句");
    }

    $effect(() => {
        if (input || uppercaseKeywords !== undefined) {
            format();
        }
    });

    function handleCopy() {
        if (!output) return;
        copyToClipboard(output, "格式化 SQL");
        toastStore.success("已复制格式化 SQL");
    }

    function clearAll() {
        input = "";
        output = "";
        toastStore.info("已清空 SQL 内容");
    }
</script>

<div class="h-full flex flex-col gap-2.5 min-h-0">
    <!-- Top Command Toolbar -->
    <div class="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-2xs">
        <div class="flex items-center gap-2 flex-wrap min-w-0">
            <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
                <Database size={13} class="text-sky-500" />
                SQL 格式化与美化
            </span>
            <span class="text-slate-300 dark:text-slate-700">|</span>
            <label class="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input type="checkbox" bind:checked={uppercaseKeywords} class="rounded text-sky-600 focus:ring-0" />
                <span>关键字大写 (SELECT/FROM)</span>
            </label>
            <span class="text-slate-300 dark:text-slate-700">|</span>
            <span class="text-slate-400 text-[11px] font-medium shrink-0 flex items-center gap-1">
                <Sparkles size={11} class="text-amber-500" /> 预设:
            </span>
            {#each PRESETS as p}
                <button
                    type="button"
                    class="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    onclick={() => { input = p.sql; toastStore.success(`已加载 ${p.name}`); }}
                >
                    {p.name.split(" ")[0]}
                </button>
            {/each}
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
            <button
                type="button"
                onclick={minify}
                class="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer shadow-2xs font-medium"
                title="单行压缩"
            >
                <Minimize2 size={11} /> 压缩
            </button>

            <HandoffDropdown
                sourceTool="SQL 格式化"
                dataType="sql"
                getData={() => output}
            />

            {#if output}
                <button
                    type="button"
                    onclick={handleCopy}
                    class="px-2.5 py-1 text-xs rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer shadow-2xs font-medium"
                >
                    <Copy size={11} /> 复制输出
                </button>
            {/if}

            <button
                type="button"
                class="px-2 py-1 text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition flex items-center gap-1 cursor-pointer"
                onclick={clearAll}
                title="清空内容"
            >
                <Trash2 size={12} />
                <span>清空</span>
            </button>
        </div>
    </div>

    <!-- Dual Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        <!-- Left: SQL Input (5 cols) -->
        <div class="lg:col-span-5 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
                <span class="font-bold text-slate-700 dark:text-slate-300">输入源 SQL 语句</span>
                {#if input}
                    <span class="text-[10px] text-slate-400 font-mono">{input.length} 字符</span>
                {/if}
            </div>

            <div class="flex-1 relative min-h-0 bg-white dark:bg-[#0A0A0A]">
                <CodeEditor
                    bind:value={input}
                    language="sql"
                    placeholder="在此输入或粘贴 SQL 查询语句..."
                />
            </div>
        </div>

        <!-- Right: Formatted SQL Output (7 cols) -->
        <div class="lg:col-span-7 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
                <span class="font-bold text-slate-700 dark:text-slate-300">格式化结果</span>
                {#if output}
                    <span class="text-[10px] text-slate-400 font-mono">{output.split('\n').length} 行</span>
                {/if}
            </div>

            <div class="flex-1 overflow-auto p-3 font-mono text-xs bg-slate-50/40 dark:bg-slate-950/40 min-h-0 custom-scrollbar">
                {#if output}
                    <CodeBlock
                        code={output}
                        language="sql"
                        showHeader={false}
                        wrapLines={true}
                        class="!my-0 border-0"
                    />
                {:else}
                    <div class="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic font-sans py-12 gap-2">
                        <Database size={24} class="text-slate-300 dark:text-slate-700" />
                        <span>在左侧输入 SQL 语句以查看格式化代码</span>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
