<script lang="ts">
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import { SKILL_DEFINITIONS } from "$lib/services/SkillService";
    import "lucide-svelte";
    import {
        Bot,
        Users,
        History,
        Upload,
        Download,
        Clock,
        Trash2,
        Plus,
        GripVertical,
        X,
        Wrench,
        Search,
        Scale,
        Shield,
        Gem,
        RefreshCw,
        CheckSquare,
        Info,
    } from "lucide-svelte";
    import type { ComponentType } from "svelte";
    import { fade, fly } from "svelte/transition";

    let { onexport = () => {} } = $props<{ onexport?: () => void }>();

    // Skill 图标映射
    const skillIconMap: Record<string, ComponentType> = {
        decompose: Search,
        decision_matrix: Scale,
        stress_test: Shield,
        resource_audit: Gem,
        reframe: RefreshCw,
        action_list: CheckSquare,
        default: Wrench,
    };

    // Skill 颜色映射
    const skillColorMap: Record<string, string> = {
        decompose: "from-blue-500 to-cyan-500",
        decision_matrix: "from-teal-500 to-emerald-500",
        stress_test: "from-violet-500 to-purple-500",
        resource_audit: "from-amber-500 to-orange-500",
        reframe: "from-yellow-500 to-amber-500",
        action_list: "from-green-500 to-emerald-500",
    };

    function getSkillIcon(id: string) {
        return skillIconMap[id] || skillIconMap.default;
    }

    // 装备状态：记录每个 Agent 装备了哪些 Skill
    let equippedSkills = $state<Record<string, string[]>>({
        decomposer: ["decompose"],
        calculator: ["decision_matrix", "resource_audit"],
        pathfinder: ["reframe"],
        stress_tester: ["stress_test"],
        closer: ["action_list"],
    });

    // 可用技能列表
    let availableSkills = Object.values(SKILL_DEFINITIONS);

    // 显示/隐藏技能面板
    let showSkillPanel = $state(false);
    // 当前正在装备的 Agent
    let activeSkillTarget = $state<string | null>(null);

    let agents = $derived(agentStore.agents);
    let activeIds = $derived(agentStore.currentSession.activeAgentIds);
    let historySessions = $derived(agentStore.sessionHistory);
    let pipelineState = $derived(agentStore.pipelineState);

    let activeAgents = $derived(agents.filter((a) => activeIds.includes(a.id)));

    function formatTimeAgo(ts: number): string {
        const diff = Date.now() - ts;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "刚刚";
        if (mins < 60) return `${mins}分钟前`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}小时前`;
        const days = Math.floor(hours / 24);
        return `${days}天前`;
    }

    // 装备 Skill 到 Agent
    function equipSkill(agentId: string, skillId: string) {
        if (!equippedSkills[agentId]) {
            equippedSkills[agentId] = [];
        }
        if (!equippedSkills[agentId].includes(skillId)) {
            equippedSkills[agentId] = [...equippedSkills[agentId], skillId];
        }
        showSkillPanel = false;
        activeSkillTarget = null;
    }

    // 从 Agent 移除 Skill
    function unequipSkill(agentId: string, skillId: string) {
        if (equippedSkills[agentId]) {
            equippedSkills[agentId] = equippedSkills[agentId].filter(s => s !== skillId);
        }
    }

    // 打开技能选择面板
    function openSkillPanel(agentId: string) {
        activeSkillTarget = agentId;
        showSkillPanel = true;
    }

    function handleImport() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,.yaml,.yml";
        input.onchange = (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    agentStore.importConfig(reader.result as string);
                } catch (err) {
                    console.error("Import failed:", err);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    function handleExportConfig(format: 'json' | 'yaml' = 'json') {
        let content: string;
        let mimeType: string;
        let extension: string;
        
        if (format === 'yaml') {
            content = agentStore.exportConfigAsYaml();
            mimeType = 'text/yaml';
            extension = 'yaml';
        } else {
            content = agentStore.exportConfig();
            mimeType = 'application/json';
            extension = 'json';
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `aone-agent-config-${Date.now()}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
    }
</script>

<!-- 技能选择面板 -->
{#if showSkillPanel}
    <div 
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        transition:fade
        onclick={() => { showSkillPanel = false; activeSkillTarget = null; }}
        role="dialog"
    >
        <div 
            class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            transition:fly={{ y: 20, duration: 200 }}
            onclick={(e) => e.stopPropagation()}
            role="document"
        >
            <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 class="font-semibold text-slate-900 dark:text-white">选择认知工具</h3>
                <button 
                    onclick={() => { showSkillPanel = false; activeSkillTarget = null; }}
                    class="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <X class="w-5 h-5 text-slate-500" />
                </button>
            </div>
            <div class="p-4 grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {#each availableSkills as skill}
                    {@const Icon = getSkillIcon(skill.id)}
                    {@const color = skillColorMap[skill.id]}
                    <button
                        onclick={() => activeSkillTarget && equipSkill(activeSkillTarget, skill.id)}
                        class="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-all group"
                    >
                        <div class="flex items-center gap-2 mb-2">
                            <div class="w-8 h-8 rounded-lg bg-gradient-to-br {color} flex items-center justify-center">
                                <Icon class="w-4 h-4 text-white" />
                            </div>
                            <span class="font-medium text-slate-900 dark:text-white text-sm">{skill.name}</span>
                        </div>
                        <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {skill.description}
                        </p>
                    </button>
                {/each}
            </div>
        </div>
    </div>
{/if}

<div
    class="w-72 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-900/50 h-full"
>
    <!-- Header -->
    <div
        class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between"
    >
        <div class="flex items-center gap-2">
            <Users class="w-4 h-4 text-violet-500" />
            <h2 class="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                思维兵器库
            </h2>
        </div>
        <!-- 切换思维模式按钮 -->
        <button 
            onclick={() => agentStore.isSquadManagerOpen = true}
            class="text-xs text-violet-500 hover:text-violet-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
            title="切换Agent"
        >
            <RefreshCw class="w-3 h-3" />
            切换
        </button>
    </div>

    <!-- Active Agents List -->
    <div class="flex-1 overflow-y-auto p-3 space-y-3">
        {#each activeAgents as agent (agent.id)}
            {@const isThinking = pipelineState.stage === "execute" && pipelineState.currentAgentId === agent.id}
            {@const agentEquippedSkills = equippedSkills[agent.id] || []}

            <div
                class="p-3 bg-white dark:bg-slate-800 rounded-xl border {isThinking
                    ? 'border-violet-500/50 ring-1 ring-violet-500/20'
                    : 'border-slate-200 dark:border-slate-700'} shadow-sm transition-all duration-300 relative overflow-hidden group"
            >
                {#if isThinking}
                    <div
                        class="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent animate-pulse"
                        transition:fade
                    ></div>
                {/if}

                <div class="relative flex items-start gap-3 mb-2">
                    <div class="w-10 h-10 rounded-xl {agent.color} flex items-center justify-center shrink-0 shadow-md">
                        <span class="text-white text-sm font-bold">{agent.name[0]}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-0.5">
                            <h3 class="font-semibold text-slate-900 dark:text-white text-sm truncate">
                                {agent.name}
                            </h3>
                            {#if isThinking}
                                <span class="flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 font-medium animate-pulse">
                                    <span class="w-1.5 h-1.5 rounded-full bg-violet-500 animate-ping"></span>
                                    发言中
                                </span>
                            {:else}
                                <span class="w-2 h-2 rounded-full bg-emerald-500" title="在线"></span>
                            {/if}
                        </div>
                        <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {agent.role}
                        </p>
                    </div>
                </div>

                <!-- 能力标签 -->
                {#if agent.traits}
                    <div class="flex flex-wrap gap-1 mb-2">
                        {#each agent.traits.slice(0, 4) as trait}
                            <span class="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[9px] text-slate-600 dark:text-slate-300">
                                {trait}
                            </span>
                        {/each}
                    </div>
                {/if}

                <!-- 已装备的技能 -->
                <div class="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <div class="flex items-center justify-between mb-1.5">
                        <span class="text-[9px] font-medium text-slate-400 uppercase tracking-wider">已装备工具</span>
                        <button 
                            onclick={() => openSkillPanel(agent.id)}
                            class="text-[9px] text-violet-500 hover:text-violet-600 flex items-center gap-0.5"
                        >
                            <Plus class="w-3 h-3" />
                            添加
                        </button>
                    </div>
                    <div class="flex flex-wrap gap-1">
                        {#each agentEquippedSkills as skillId}
                            {@const skill = SKILL_DEFINITIONS[skillId]}
                            {@const Icon = getSkillIcon(skillId)}
                            {#if skill}
                                <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r {skillColorMap[skillId]} bg-opacity-10 text-[10px] text-slate-700 dark:text-slate-300">
                                    <Icon class="w-3 h-3" />
                                    {skill.name}
                                    <button 
                                        onclick={() => unequipSkill(agent.id, skillId)}
                                        class="ml-0.5 hover:text-red-500"
                                    >
                                        <X class="w-2.5 h-2.5" />
                                    </button>
                                </span>
                            {/if}
                        {/each}
                        {#if agentEquippedSkills.length === 0}
                            <span class="text-[9px] text-slate-400 italic">拖拽工具卡到此处装备</span>
                        {/if}
                    </div>
                </div>
            </div>
        {/each}

        {#if activeAgents.length === 0}
            <div class="text-center py-10 text-slate-400 text-xs px-4">
                <Users class="w-8 h-8 mx-auto mb-2 opacity-20" />
                还没有选择专家伙伴
                <br />
                从入口页面选择一个思维模式
            </div>
        {/if}
    </div>

    <!-- History Section -->
    <div class="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col max-h-48">
        <div class="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <History class="w-3.5 h-3.5" />
                历史记录
            </span>
            <div class="flex gap-1">
                <button onclick={handleImport} class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1" title="导入配置">
                    <Upload class="w-3.5 h-3.5" />
                </button>
                <div class="relative group">
                    <button class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1" title="导出配置">
                        <Download class="w-3.5 h-3.5" />
                    </button>
                    <!-- 导出菜单 -->
                    <div class="absolute right-0 bottom-full mb-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <button onclick={() => handleExportConfig('json')} class="block w-full px-3 py-2 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-700 rounded-t-lg">
                            导出 JSON
                        </button>
                        <button onclick={() => handleExportConfig('yaml')} class="block w-full px-3 py-2 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-700 rounded-b-lg">
                            导出 YAML
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="overflow-y-auto p-2 space-y-1">
            {#each historySessions as item}
                <button
                    class="group flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors w-full text-left"
                    onclick={() => agentStore.loadHistoryItem(item)}
                >
                    <div class="w-1 h-full self-stretch rounded-full bg-slate-200 dark:bg-slate-700 group-hover:bg-violet-400 transition-colors"></div>
                    <div class="flex-1 min-w-0">
                        <div class="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                            {item.goal}
                        </div>
                        <div class="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock class="w-3 h-3" />
                            {formatTimeAgo(item.timestamp)}
                        </div>
                    </div>
                    <div
                        role="button"
                        tabindex="0"
                        class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all"
                        onclick={(e) => {
                            e.stopPropagation();
                            agentStore.deleteHistoryItem(item.id);
                        }}
                        onkeydown={(e) => e.key === "Enter" && agentStore.deleteHistoryItem(item.id)}
                    >
                        <Trash2 class="w-3.5 h-3.5" />
                    </div>
                </button>
            {/each}
            {#if historySessions.length === 0}
                <div class="text-center py-4 text-xs text-slate-400">
                    暂无历史记录
                </div>
            {/if}
        </div>
    </div>
</div>
