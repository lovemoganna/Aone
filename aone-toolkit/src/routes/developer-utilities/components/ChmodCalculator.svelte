<script lang="ts">
    import { Check } from "lucide-svelte";

    // State for permissions
    // [Read, Write, Execute]
    let owner = $state([true, true, true]); // 7
    let group = $state([true, false, true]); // 5
    let public_ = $state([true, false, true]); // 5

    function calcDigit(p: boolean[]) {
        return (p[0] ? 4 : 0) + (p[1] ? 2 : 0) + (p[2] ? 1 : 0);
    }

    let octal = $derived(
        `${calcDigit(owner)}${calcDigit(group)}${calcDigit(public_)}`,
    );

    let symbolic = $derived.by(() => {
        const char = (p: boolean[]) =>
            `${p[0] ? "r" : "-"}${p[1] ? "w" : "-"}${p[2] ? "x" : "-"}`;
        return `-${char(owner)}${char(group)}${char(public_)}`;
    });

    const categories = [
        { label: "Owner", state: owner },
        { label: "Group", state: group },
        { label: "Public", state: public_ },
    ];

    const perms = ["Read (4)", "Write (2)", "Execute (1)"];
</script>

<div class="space-y-8">
    <!-- Display -->
    <div class="flex gap-4">
        <div
            class="flex-1 bg-slate-900 text-white p-6 rounded-xl flex flex-col items-center justify-center gap-2"
        >
            <div
                class="text-xs font-bold text-slate-400 uppercase tracking-widest"
            >
                Octal
            </div>
            <div
                class="text-4xl font-mono font-bold tracking-widest text-primary-400"
            >
                {octal}
            </div>
        </div>
        <div
            class="flex-1 bg-slate-100 dark:bg-slate-800 p-6 rounded-xl flex flex-col items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
        >
            <div
                class="text-xs font-bold text-slate-500 uppercase tracking-widest"
            >
                Symbolic
            </div>
            <div
                class="text-2xl font-mono font-medium text-slate-700 dark:text-slate-300"
            >
                {symbolic}
            </div>
        </div>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {#each categories as cat}
            <div
                class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
            >
                <div
                    class="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-center font-bold text-slate-700 dark:text-slate-200"
                >
                    {cat.label}
                </div>
                <div class="p-4 space-y-2">
                    {#each perms as perm, i}
                        <label
                            class="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group select-none"
                        >
                            <div
                                class="relative w-5 h-5 flex items-center justify-center border-2 rounded-md transition-colors
                                {cat.state[i]
                                    ? 'bg-primary-500 border-primary-500'
                                    : 'border-slate-300 dark:border-slate-600 group-hover:border-primary-400'}"
                            >
                                {#if cat.state[i]}
                                    <Check size={14} class="text-white" />
                                {/if}
                            </div>
                            <input
                                type="checkbox"
                                bind:checked={cat.state[i]}
                                class="hidden"
                            />
                            <span
                                class="text-sm font-medium text-slate-600 dark:text-slate-300"
                                >{perm}</span
                            >
                        </label>
                    {/each}
                </div>
            </div>
        {/each}
    </div>
</div>
