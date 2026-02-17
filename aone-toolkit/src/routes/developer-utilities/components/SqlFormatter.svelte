<script lang="ts">
    import { Button } from "$lib/components/ui";
    import { Copy, Maximize2, Minimize2 } from "lucide-svelte";

    let input = $state("");
    let output = $state("");

    function format() {
        // ... (Same logic, re-pasting for safety)
        const keywords = [
            "SELECT",
            "FROM",
            "WHERE",
            "AND",
            "OR",
            "GROUP BY",
            "ORDER BY",
            "LIMIT",
            "INSERT INTO",
            "VALUES",
            "UPDATE",
            "SET",
            "DELETE",
            "LEFT JOIN",
            "RIGHT JOIN",
            "INNER JOIN",
            "OUTER JOIN",
            "ON",
            "HAVING",
            "UNION",
            "CASE",
            "WHEN",
            "THEN",
            "ELSE",
            "END",
            "CREATE TABLE",
            "DROP TABLE",
            "ALTER TABLE",
        ];

        let formatted = input;
        formatted = formatted.replace(/\s+/g, " ");
        keywords.forEach((kw) => {
            const regex = new RegExp(`\\b${kw}\\b`, "gi");
            formatted = formatted.replace(regex, kw);
        });
        keywords.forEach((kw) => {
            const regex = new RegExp(`\\s(${kw})\\s`, "g");
            formatted = formatted.replace(regex, `\n$1 `);
        });
        formatted = formatted
            .replace(/\(\s*/g, "(\n  ")
            .replace(/\s*\)/g, "\n)");
        output = formatted.trim();
    }

    function minify() {
        output = input.replace(/\s+/g, " ").trim();
    }
</script>

<div class="h-full flex flex-col gap-4">
    <div class="flex-1 flex flex-col gap-2">
        <label
            for="sql-input"
            class="text-sm font-semibold text-slate-700 dark:text-slate-300"
        >
            SQL Query
        </label>
        <textarea
            id="sql-input"
            bind:value={input}
            class="flex-1 min-h-[200px] p-4 font-mono text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none resize-none focus:ring-2 focus:ring-primary-500/20 transition-all placeholder:text-slate-400"
            placeholder="SELECT * FROM users WHERE id = 1"
        ></textarea>
    </div>

    <div class="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onclick={minify} class="gap-2">
            <Minimize2 size={16} /> Minify
        </Button>
        <Button size="sm" onclick={format} class="gap-2">
            <Maximize2 size={16} /> Format
        </Button>
    </div>

    <div class="flex-1 flex flex-col gap-2 relative">
        <div class="flex justify-between items-center">
            <label
                for="sql-result"
                class="text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
                Result
            </label>
            {#if output}
                <div class="absolute top-0 right-0 z-10">
                    <Button
                        variant="ghost"
                        size="sm"
                        onclick={() => navigator.clipboard.writeText(output)}
                    >
                        <Copy size={14} class="mr-1" /> Copy
                    </Button>
                </div>
            {/if}
        </div>
        <textarea
            id="sql-result"
            value={output}
            readonly
            class="flex-1 min-h-[200px] p-4 font-mono text-sm bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none resize-none text-slate-700 dark:text-slate-300"
            placeholder="Formatted SQL will appear here..."
        ></textarea>
    </div>
</div>
