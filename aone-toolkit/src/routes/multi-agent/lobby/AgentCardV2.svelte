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

    // Stats Mapping
    // Image shows: Icon + Name + Bar + Time. We map to: Trait + Value + Description.
    // e.g. "Gemini Pro" -> "Rationality"

    function getTraitColor(val: number) {
        if (val >= 8) return "bg-violet-500";
        if (val >= 6) return "bg-blue-500";
        if (val >= 4) return "bg-emerald-500";
        return "bg-amber-500";
    }

    const traits = [
        {
            label: "Rationality",
            val: agent.personaConfig?.rationality || 5,
            color: "bg-blue-500",
            icon: Brain,
        },
        {
            label: "Creativity",
            val: agent.personaConfig?.creativity || 5,
            color: "bg-amber-500",
            icon: Zap,
        },
        {
            label: "Empathy",
            val: agent.personaConfig?.empathy || 5,
            color: "bg-rose-400",
            icon: Activity,
        },
    ];
</script>

<div
    class="group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 overflow-hidden
    {isSelected
        ? 'border-violet-500 shadow-xl shadow-violet-500/10 scale-[1.02]'
        : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg'}"
>
    <!-- Top Decoration (Gradient Line) -->
    <div
        class="h-1.5 w-full bg-gradient-to-r from-transparent via-{agent.color
            ? agent.color.replace('bg-', '')
            : 'violet-500'} to-transparent opacity-50"
    ></div>

    <!-- Header Section -->
    <div class="p-5 flex items-start justify-between">
        <div class="flex gap-3">
            <!-- Avatar -->
            <div
                class="w-12 h-12 rounded-xl {agent.color ||
                    'bg-slate-500'} flex items-center justify-center text-white shadow-lg shadow-{agent.color?.replace(
                    'bg-',
                    '',
                ) || 'slate'}-500/20 shrink-0"
            >
                <!-- We can use a Lucide Icon based on avatar string, but for now generic Brain or letter -->
                <span class="text-xl font-bold">{agent.name[0]}</span>
            </div>

            <!-- Info -->
            <div>
                <h3
                    class="font-bold text-slate-900 dark:text-white text-base leading-tight flex items-center gap-1.5"
                >
                    {agent.name}
                    {#if agent.id === "closer" || agent.id === "decomposer"}
                        <Crown class="w-3 h-3 text-amber-500 fill-amber-500" />
                    {/if}
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {agent.role}
                </p>
            </div>
        </div>

        <!-- Badge (Top Right) -->
        <div
            class="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1"
        >
            {#if isSelected}
                <span
                    class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
                ></span>
                <span
                    class="text-[10px] font-bold text-slate-600 dark:text-slate-300"
                    >Active</span
                >
            {:else}
                <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                <span class="text-[10px] font-medium text-slate-500">Idle</span>
            {/if}
        </div>
    </div>

    <!-- Body: Stats List -->
    <div class="flex-1 px-5 pb-4 space-y-3">
        <!-- Traits Progress Bars -->
        {#each traits as trait}
            <div class="flex items-center gap-3 group/stat">
                <div class="flex items-center gap-2 w-24 shrink-0">
                    <trait.icon
                        class="w-3.5 h-3.5 text-slate-400 group-hover/stat:text-violet-500 transition-colors"
                    />
                    <span
                        class="text-xs font-medium text-slate-600 dark:text-slate-300"
                        >{trait.label}</span
                    >
                </div>

                <!-- Bar Container -->
                <div
                    class="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative"
                >
                    <!-- Background Bar -->
                    <div
                        class="absolute inset-y-0 left-0 bg-slate-200 dark:bg-slate-700 w-full opacity-30"
                    ></div>
                    <!-- Active Bar -->
                    <div
                        class="absolute inset-y-0 left-0 rounded-full {trait.color}"
                        style="width: {trait.val * 10}%"
                    ></div>
                </div>

                <!-- Value Badge -->
                <div class="w-8 text-right">
                    <span
                        class="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded"
                    >
                        {trait.val}
                    </span>
                </div>
            </div>
        {/each}

        <!-- Description Tooltip/Text -->
        <div
            class="mt-4 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800"
        >
            <p
                class="text-[11px] text-slate-500 leading-relaxed line-clamp-2"
                title={agent.description}
            >
                {agent.description}
            </p>
        </div>
    </div>

    <!-- Footer: Actions -->
    <div
        class="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
    >
        <button
            onclick={onselect}
            class="flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all
            {isSelected
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 ring-1 ring-violet-500/20'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-violet-300 text-slate-600 dark:text-slate-300 shadow-sm'}"
        >
            {#if isSelected}
                <Check class="w-3.5 h-3.5" /> 已选择
            {:else}
                <Plus class="w-3.5 h-3.5" /> 选择使用
            {/if}
        </button>

        {#if ondelete}
            <button
                onclick={(e) => {
                    e.stopPropagation();
                    ondelete?.();
                }}
                class="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                title="删除"
            >
                <Trash2 class="w-4 h-4" />
            </button>
        {/if}
    </div>
</div>
