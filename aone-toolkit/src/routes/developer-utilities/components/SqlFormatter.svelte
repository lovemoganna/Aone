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

<div class="h-full flex flex-col gap-6">
    <div class="flex-1 flex flex-col gap-3 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
        <div class="flex justify-between items-center">
            <label
                for="sql-input"
                class="label-section"
            >
                SQL Query
            </label>
            <span class="text-[11px] text-slate-400 font-mono">{input.length} chars</span>
        </div>
        <textarea
            id="sql-input"
            bind:value={input}
            class="textarea-editor flex-1"
            placeholder="SELECT * FROM users WHERE id = 1"
        ></textarea>
    </div>

    <div class="flex justify-end gap-2 shrink-0">
        <Button variant="secondary" size="sm" onclick={minify} class="btn btn-ghost text-sm">
            <Minimize2 size={16} /> Minify
        </Button>
        <Button size="sm" onclick={format} class="btn btn-ghost text-sm">
            <Maximize2 size={16} /> Format
        </Button>
    </div>

    <div class="flex-1 flex flex-col gap-3 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm relative">
        <div class="flex justify-between items-center">
            <label
                for="sql-result"
                class="label-section"
            >
                Result
            </label>
            <span class="text-[11px] text-slate-400 font-mono">{output.length} chars</span>
        </div>
        <div class="relative flex-1 min-h-[350px]">
            <textarea
                id="sql-result"
                value={output}
                readonly
                class="textarea-editor w-full"
                placeholder="Formatted SQL will appear here..."
            ></textarea>
            {#if output}
                <div class="absolute top-3 right-3">
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
    </div>
</div>
