<script lang="ts">
    import {
        Brain,
        Zap,
        Activity,
        Check,
        Plus,
        Trash2,
        Crown,
    } from "lucide-svelte";
    import { fade } from "svelte/transition";
    import type { Agent } from "$lib/stores/agentStore.svelte";
    import { AgentAvatar } from "$lib/components/ui";

    // Props
    let {
        agent,
        isSelected = false,
        onselect,
        ondelete,
    } = $props<{
        agent: Agent;
        isSelected?: boolean;
        onselect?: () => void;
        ondelete?: () => void;
    }>();

    const traits = $derived([
        {
            label: "理性逻辑",
            val: agent.personaConfig?.rationality || 5,
            color: "bg-blue-500",
            icon: Brain,
        },
        {
            label: "破局创造",
            val: agent.personaConfig?.creativity || 5,
            color: "bg-amber-500",
            icon: Zap,
        },
        {
            label: "同理共情",
            val: agent.personaConfig?.empathy || 5,
            color: "bg-rose-400",
            icon: Activity,
        },
    ]);
</script>

<div
    class="group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 overflow-hidden
    {isSelected
        ? 'border-indigo-500 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/20'
        : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'}"
>
    <!-- Top Decoration (Gradient Line) -->
    <div
        class="h-1 w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-40"
    ></div>

    <!-- Header Section -->
    <div class="p-4 flex items-start justify-between">
        <div class="flex gap-3 min-w-0">
            <!-- 3D Avatar -->
            <AgentAvatar {agent} size="md" shape="rounded" interactive={true} glow={isSelected} status={isSelected ? "online" : "idle"} />

            <!-- Info -->
            <div class="min-w-0">
                <h3
                    class="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-tight flex items-center gap-1.5 truncate"
                >
                    {agent.name}
                    {#if agent.id === "closer" || agent.id === "decomposer"}
                        <Crown class="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                    {/if}
                </h3>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {agent.role}
                </p>
            </div>
        </div>

        <!-- Badge (Top Right) -->
        <div
            class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1 shrink-0"
        >
            {#if isSelected}
                <span
                    class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
                ></span>
                <span
                    class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400"
                    >已在岗</span
                >
            {:else}
                <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                <span class="text-[10px] font-medium text-slate-500 dark:text-slate-400">待命</span>
            {/if}
        </div>
    </div>

    <!-- Body: Stats List -->
    <div class="flex-1 px-4 pb-3 space-y-2.5">
        <!-- Traits Progress Bars -->
        {#each traits as trait}
            <div class="flex items-center gap-2 group/stat text-xs">
                <div class="flex items-center gap-1.5 w-20 shrink-0 text-slate-500 dark:text-slate-400 text-[11px]">
                    <trait.icon
                        class="w-3 h-3 text-slate-400 group-hover/stat:text-indigo-500 transition-colors"
                    />
                    <span>{trait.label}</span>
                </div>

                <!-- Bar Container -->
                <div
                    class="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative"
                >
                    <div
                        class="absolute inset-y-0 left-0 rounded-full {trait.color}"
                        style="width: {trait.val * 10}%"
                    ></div>
                </div>

                <!-- Value -->
                <span
                    class="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 w-6 text-right"
                >
                    {trait.val * 10}%
                </span>
            </div>
        {/each}

        <!-- Description (Public Bio) -->
        <p
            class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 leading-relaxed"
        >
            {agent.description ||
                "暂无该智能体人设的详细配置描述。"}
        </p>
    </div>

    <!-- Footer: Actions -->
    <div
        class="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-850/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto"
    >
        <div class="flex items-center gap-1">
            <!-- Traits Badges -->
            {#if agent.traits && agent.traits.length > 0}
                {#each agent.traits.slice(0, 2) as tag}
                    <span
                        class="px-1.5 py-0.2 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded"
                    >
                        #{tag}
                    </span>
                {/each}
            {/if}
        </div>

        <div class="flex items-center gap-1.5">
            <!-- Select/Toggle Button -->
            <button
                onclick={onselect}
                class="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer active:scale-95
                {isSelected
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'}"
            >
                {#if isSelected}
                    <Check class="w-3.5 h-3.5" />
                    <span>已选定</span>
                {:else}
                    <Plus class="w-3.5 h-3.5" />
                    <span>选择</span>
                {/if}
            </button>

            <!-- Custom Delete Button -->
            {#if !agent.isPreset && ondelete}
                <button
                    onclick={ondelete}
                    class="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                    title="删除自定义 Agent"
                    aria-label="删除自定义 Agent"
                >
                    <Trash2 class="w-3.5 h-3.5" />
                </button>
            {/if}
        </div>
    </div>
</div>
