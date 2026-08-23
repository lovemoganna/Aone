<script lang="ts">
    import type { Snippet } from "svelte";
    import type { ComponentType } from "svelte";

    interface Props {
        title: string;
        count?: number;
        icon?: ComponentType;
        action?: Snippet;
        class?: string;
    }

    let {
        title,
        count,
        icon: Icon,
        action,
        class: className = "",
    }: Props = $props();
</script>

<div class="flex items-center justify-between {className}">
    <div class="flex items-center gap-2">
        {#if Icon}
            <Icon size={14} class="text-slate-400" />
        {/if}
        <span class="label-section">
            {title}
            {#if count !== undefined}
                <span class="ml-1 text-slate-400 dark:text-slate-500">({count})</span>
            {/if}
        </span>
    </div>
    {#if action}
        {@render action()}
    {/if}
</div>
