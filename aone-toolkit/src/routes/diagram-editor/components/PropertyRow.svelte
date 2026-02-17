<script lang="ts">
    let { label, children } = $props<{
        label: string;
        children: any;
    }>();
</script>

<div
    class="space-y-1.5 hover:bg-gray-50 dark:hover:bg-indigo-900/10 p-1 rounded-lg transition-colors group"
>
    <div class="flex justify-between items-center text-xs">
        <label
            class="text-gray-500 dark:text-gray-400 font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
        >
            {label}
        </label>
    </div>
    <div class="text-gray-700 dark:text-gray-300">
        {@render children()}
    </div>
</div>
