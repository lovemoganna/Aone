<script lang="ts">
    import { Panel, Button } from "$lib/components/ui";
    import {
        Database,
        Sparkles,
        Copy,
        Play,
        Table as TableIcon,
    } from "lucide-svelte";

    let sql = $state(
        "SELECT u.name, o.order_date\nFROM users u\nJOIN orders o ON u.id = o.user_id\nWHERE o.status = 'completed'\nORDER BY o.order_date DESC;",
    );
    let analysis = $state<string | null>(null);

    function analyzeSQL() {
        // Simplified heuristic analysis
        if (!sql.toLowerCase().includes("join")) {
            analysis =
                "💡 Tip: Consider using JOIN instead of subqueries for better performance in most DBs.";
        } else if (sql.toLowerCase().includes("*")) {
            analysis =
                "⚠️ Warning: Avoid using SELECT *. Specify column names to reduce I/O and network overhead.";
        } else if (
            !sql.toLowerCase().includes("limit") &&
            sql.toLowerCase().includes("select")
        ) {
            analysis =
                "ℹ️ Hint: Add a LIMIT clause to prevent large result sets from slowing down the application.";
        } else {
            analysis =
                "✅ Heuristic checks passed. Queries with JOINs should ensure indexed columns are used in ON clauses.";
        }
    }

    function extractTables() {
        const tableMatches = sql.matchAll(/FROM\s+(\w+)|JOIN\s+(\w+)/gi);
        return [...new Set([...tableMatches].map((m) => m[1] || m[2]))];
    }

    let tables = $derived(extractTables());
</script>

<svelte:head>
    <title>SQL Architect - Aone Toolkit</title>
</svelte:head>

<div class="h-[calc(100vh-3rem)] p-4 flex flex-col space-y-4">
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        <Panel class="flex flex-col min-h-0">
            {#snippet header()}
                <div class="flex items-center justify-between w-full">
                    <div class="flex items-center gap-2">
                        <div
                            class="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border"
                        >
                            <Database size={16} />
                        </div>
                        <h2
                            class="font-semibold text-slate-900 dark:text-white"
                        >
                            Query Editor
                        </h2>
                    </div>
                    <Button size="sm" onclick={analyzeSQL}>
                        <Sparkles size={14} class="mr-2" /> Analyze
                    </Button>
                </div>
            {/snippet}

            <textarea
                bind:value={sql}
                class="flex-1 p-6 font-mono text-sm bg-transparent resize-none focus:outline-none dark:text-slate-300 leading-relaxed"
                spellcheck="false"
            ></textarea>
        </Panel>

        <Panel class="flex flex-col min-h-0">
            {#snippet header()}
                <div class="flex items-center justify-between w-full">
                    <div class="flex items-center gap-2">
                        <div
                            class="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border"
                        >
                            <TableIcon size={16} />
                        </div>
                        <h2
                            class="font-semibold text-slate-900 dark:text-white"
                        >
                            Analysis & Schema
                        </h2>
                    </div>
                </div>
            {/snippet}

            <div class="flex-1 overflow-y-auto p-6 space-y-8">
                {#if analysis}
                    <section class="space-y-2">
                        <div
                            class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                        >
                            Optimized Advice
                        </div>
                        <div
                            class="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-2xl text-sm leading-relaxed text-indigo-700 dark:text-indigo-300"
                        >
                            {analysis}
                        </div>
                    </section>
                {/if}

                <section class="space-y-4">
                    <div
                        class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                    >
                        Inferred Entities ({tables.length})
                    </div>
                    <div class="grid grid-cols-1 gap-2">
                        {#each tables as table}
                            <div
                                class="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-sm"
                            >
                                <div
                                    class="w-2 h-2 rounded-full bg-emerald-500"
                                ></div>
                                <span class="font-mono text-sm font-bold"
                                    >{table}</span
                                >
                                <span class="text-[10px] text-slate-400 ml-auto"
                                    >TABLE</span
                                >
                            </div>
                        {/each}
                    </div>
                </section>

                <section
                    class="pt-6 border-t border-slate-100 dark:border-slate-800"
                >
                    <div
                        class="p-4 bg-slate-900/5 dark:bg-black/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center"
                    >
                        <p class="text-xs text-slate-400">
                            AI Schema visualization coming soon...
                        </p>
                    </div>
                </section>
            </div>
        </Panel>
    </div>
</div>
