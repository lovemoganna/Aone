<script lang="ts">
    let { label, children } = $props<{
        label: string;
        children: any;
    }>();
</script>

<div
    class="space-y-1 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 p-1 rounded transition-colors group"
>
    <div class="flex justify-between items-center text-xs">
        <div
            class="text-slate-500 dark:text-slate-400 font-medium group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors text-[11px]"
        >
            {label}
        </div>
    </div>
    <div class="text-slate-700 dark:text-slate-300 text-xs">
        {@render children()}
    </div>
</div>
