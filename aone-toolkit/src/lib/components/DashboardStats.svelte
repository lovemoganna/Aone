<script lang="ts">
    import { onMount } from "svelte";
    import { base } from "$app/paths";
    import {
        FileText,
        Table2,
        Code2,
        Clock,
        Sparkles,
        Bot,
        ShieldAlert,
        Database,
        Braces,
        Terminal,
        ArrowUpRight,
        Network,
        GitFork,
        HardDrive,
        RefreshCw,
        Layers,
        Cpu,
    } from "lucide-svelte";

    interface AssetStats {
        personas: number;
        skills: number;
        prompts: number;
        workflows: number;
        diagrams: number;
        storageUsed: string;
        storagePercent: number;
    }

    interface ActivityItem {
        tool: string;
        action: string;
        href: string;
        icon: any;
        badge: string;
    }

    let stats = $state<AssetStats>({
        personas: 6,
        skills: 8,
        prompts: 0,
        workflows: 0,
        diagrams: 0,
        storageUsed: "0 KB",
        storagePercent: 0,
    });

    let recentActivities = $state<ActivityItem[]>([]);

    onMount(() => {
        loadWorkspaceStats();
    });

    function formatBytes(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    export function loadWorkspaceStats() {
        if (typeof localStorage === "undefined") return;

        let personas = 6;
        let skills = 8;
        let prompts = 0;
        let workflows = 0;
        let diagrams = 0;

        try {
            const customPersonas = localStorage.getItem("custom_personas");
            const parsed = customPersonas ? JSON.parse(customPersonas) : [];
            personas += parsed?.length || 0;
        } catch (e) {}

        try {
            const customSkills = localStorage.getItem("custom_skills");
            const parsed = customSkills ? JSON.parse(customSkills) : [];
            skills += parsed?.length || 0;
        } catch (e) {}

        try {
            const wfData = localStorage.getItem("orchestration_workflows_v1");
            if (wfData) {
                const parsed = JSON.parse(wfData);
                workflows = parsed?.length || 0;
            }
        } catch (e) {}

        try {
            const promptData = localStorage.getItem("prompthub_data");
            if (promptData) {
                const parsed = JSON.parse(promptData);
                prompts = parsed.prompts?.length || 0;
            }
        } catch (e) {}

        try {
            const diagramData = localStorage.getItem("aone_diagram_snippets");
            if (diagramData) {
                const parsed = JSON.parse(diagramData);
                diagrams = parsed.length || 0;
            }
        } catch (e) {}

        let totalBytes = 0;
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    const val = localStorage.getItem(key) || "";
                    totalBytes += (key.length + val.length) * 2;
                }
            }
        } catch (e) {}

        const storageQuota = 5 * 1024 * 1024;
        const storagePercent = Math.min(100, Math.round((totalBytes / storageQuota) * 100));

        const activities: ActivityItem[] = [];

        if (localStorage.getItem("aone_multi_agent_state") || localStorage.getItem("multi_agent_history")) {
            activities.push({
                tool: "多 Agent",
                action: "最近会话记录",
                href: "/multi-agent",
                icon: Network,
                badge: "会话",
            });
        }

        if (workflows > 0 || localStorage.getItem("orchestration_edit_state")) {
            activities.push({
                tool: "编排流",
                action: `${workflows} 条流程草稿`,
                href: "/agent-studio",
                icon: Bot,
                badge: "编排",
            });
        }

        if (localStorage.getItem("aone_sql_code") || localStorage.getItem("sql_editor_content")) {
            activities.push({
                tool: "SQL 分析",
                action: "暂存查询脚本",
                href: "/sql-architect",
                icon: Database,
                badge: "草稿",
            });
        }

        if (localStorage.getItem("table_editor_data") || localStorage.getItem("aone_table_data")) {
            activities.push({
                tool: "表格清洗",
                action: "未导出工作表",
                href: "/table-editor",
                icon: Table2,
                badge: "暂存",
            });
        }

        if (localStorage.getItem("aone_diagram_code") || diagrams > 0) {
            activities.push({
                tool: "架构图",
                action: "PlantUML/Mermaid 代码",
                href: "/diagram-editor",
                icon: GitFork,
                badge: "草稿",
            });
        }

        if (localStorage.getItem("json_editor_content")) {
            activities.push({
                tool: "JSON",
                action: "已缓存结构载荷",
                href: "/json-editor",
                icon: Braces,
                badge: "缓存",
            });
        }

        stats = {
            personas,
            skills,
            prompts,
            workflows,
            diagrams,
            storageUsed: formatBytes(totalBytes),
            storagePercent,
        };

        recentActivities = activities;
    }

    function openStorageManager() {
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("open-storage-manager"));
        }
    }
</script>

<div class="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 px-4 py-3 shadow-2xs">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
        <!-- Asset Stats Overview -->
        <div class="flex flex-wrap items-center gap-3 sm:gap-4 text-slate-600 dark:text-slate-400">
            <span class="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
                <Cpu class="h-3.5 w-3.5 text-indigo-500" />
                <span>工作区状态:</span>
            </span>

            <span class="inline-flex items-center gap-1">
                <span>角色</span>
                <strong class="font-mono text-slate-900 dark:text-white">{stats.personas}</strong>
            </span>
            <span class="text-slate-300 dark:text-slate-700">·</span>
            <span class="inline-flex items-center gap-1">
                <span>技能</span>
                <strong class="font-mono text-slate-900 dark:text-white">{stats.skills}</strong>
            </span>
            <span class="text-slate-300 dark:text-slate-700">·</span>
            <span class="inline-flex items-center gap-1">
                <span>提示词</span>
                <strong class="font-mono text-slate-900 dark:text-white">{stats.prompts}</strong>
            </span>
            <span class="text-slate-300 dark:text-slate-700">·</span>
            <button
                type="button"
                onclick={openStorageManager}
                class="inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                title="打开存储管理"
            >
                <HardDrive class="h-3 w-3 text-slate-400" />
                <span>存储: <strong class="font-mono text-slate-800 dark:text-slate-200">{stats.storageUsed}</strong></span>
            </button>
        </div>

        <!-- Recent Draft Quick Resume -->
        {#if recentActivities.length > 0}
            <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-slate-400 text-[11px] shrink-0 flex items-center gap-1">
                    <Clock class="h-3 w-3" />
                    <span>恢复草稿:</span>
                </span>
                {#each recentActivities.slice(0, 4) as item}
                    {@const ItemIcon = item.icon}
                    <a
                        href="{base}{item.href}"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors text-[11px] font-medium border border-slate-200/60 dark:border-slate-700/60"
                        title="{item.tool}: {item.action}"
                    >
                        <ItemIcon class="h-3 w-3 text-slate-400" />
                        <span>{item.tool}</span>
                        <ArrowUpRight class="h-2.5 w-2.5 opacity-60" />
                    </a>
                {/each}
            </div>
        {/if}
    </div>
</div>


