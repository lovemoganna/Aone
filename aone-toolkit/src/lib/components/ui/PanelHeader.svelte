<script lang="ts">
    import type { Snippet } from "svelte";
    import type { ComponentType } from "svelte";

    interface Props {
        icon?: ComponentType;
        iconColor?: string;
        title: string;
        badge?: string;
        actions?: Snippet;
        class?: string;
    }

    let {
        icon: Icon,
        iconColor = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
        title,
        badge = "",
        actions,
        class: className = "",
    }: Props = $props();
</script>

<div class="flex items-center justify-between w-full px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111113] z-10 {className}">
    <div class="flex items-center gap-3">
        {#if Icon}
            <div
                class="w-8 h-8 rounded-md flex items-center justify-center border shadow-sm {iconColor}"
            >
                <Icon size={16} />
            </div>
        {/if}
        <h2 class="font-semibold text-slate-900 dark:text-white">
            {title}
        </h2>
        {#if badge}
            <span class="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded-md">
                {badge}
            </span>
        {/if}
    </div>
    {#if actions}
        <div class="flex items-center gap-2">
            {@render actions()}
        </div>
    {/if}
</div>
