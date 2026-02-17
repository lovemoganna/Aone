<script lang="ts">
    import { onMount } from "svelte";
    import {
        FileText,
        Table,
        Code,
        BrainCircuit,
        Clock,
        Activity,
    } from "lucide-svelte";

    let stats = $state({
        prompts: 0,
        collections: 0,
        snippets: 0,
        lastActive: "None",
    });

    let recentActivity = $state<
        {
            tool: string;
            action: string;
            time: string;
            icon: any;
            href: string;
            color: string;
        }[]
    >([]);

    onMount(() => {
        loadStats();
    });

    function loadStats() {
        if (typeof localStorage === "undefined") return;

        // Prompt Hub
        try {
            const promptData = localStorage.getItem("prompthub_data");
            if (promptData) {
                const parsed = JSON.parse(promptData);
                stats.prompts = parsed.prompts?.length || 0;
                stats.collections = parsed.collections?.length || 0;
            }
        } catch (e) {}

        // Diagram Snippets
        try {
            const diagramData = localStorage.getItem("aone_diagram_snippets");
            if (diagramData) {
                const parsed = JSON.parse(diagramData);
                stats.snippets = parsed.length || 0;
            }
        } catch (e) {}

        // Recent Activity (Synthetic for now, based on modification timestamps if available, or just existence)
        // In a real app we'd track a separate 'activity_log'.
        // For now, checks if content exists
        const activities = [];

        if (localStorage.getItem("yaml_editor_content")) {
            activities.push({
                tool: "YAML Editor",
                action: "Draft content available",
                time: "Recently",
                icon: FileText,
                href: "/yaml-editor",
                color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
            });
        }
        if (localStorage.getItem("table_editor_data")) {
            activities.push({
                tool: "Table Editor",
                action: "Spreadsheet data saved",
                time: "Recently",
                icon: Table,
                href: "/table-editor",
                color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
            });
        }
        if (localStorage.getItem("aone_diagram_code")) {
            activities.push({
                tool: "Diagram Editor",
                action: "Diagram draft saved",
                time: "Recently",
                icon: Code,
                href: "/diagram-editor",
                color: "text-purple-500 bg-purple-50 dark:bg-purple-900/20",
            });
        }

        recentActivity = activities;
    }
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <!-- Quick Stats -->
    <div
        class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
    >
        <div class="flex items-center gap-3 mb-4">
            <div
                class="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400"
            >
                <Activity size={20} />
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-white">
                Quick Stats
            </h3>
        </div>
        <div class="space-y-4">
            <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400 text-sm"
                    >Saved Prompts</span
                >
                <span class="font-bold text-gray-900 dark:text-white"
                    >{stats.prompts}</span
                >
            </div>
            <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400 text-sm"
                    >Collections</span
                >
                <span class="font-bold text-gray-900 dark:text-white"
                    >{stats.collections}</span
                >
            </div>
            <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-400 text-sm"
                    >Diagram Snippets</span
                >
                <span class="font-bold text-gray-900 dark:text-white"
                    >{stats.snippets}</span
                >
            </div>
        </div>
    </div>

    <!-- Recent Activity -->
    <div
        class="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
    >
        <div class="flex items-center gap-3 mb-4">
            <div
                class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400"
            >
                <Clock size={20} />
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-white">
                Recent Work
            </h3>
        </div>

        {#if recentActivity.length === 0}
            <div class="text-center py-8 text-gray-400 text-sm">
                No recent activity found. Start using tools!
            </div>
        {:else}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {#each recentActivity as activity}
                    <a
                        href={activity.href}
                        class="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                        <div class="p-2 rounded-lg {activity.color} shrink-0">
                            <activity.icon size={18} />
                        </div>
                        <div>
                            <h4
                                class="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors"
                            >
                                {activity.tool}
                            </h4>
                            <p
                                class="text-xs text-gray-500 dark:text-gray-400 mt-0.5"
                            >
                                {activity.action}
                            </p>
                        </div>
                    </a>
                {/each}
            </div>
        {/if}
    </div>
</div>
