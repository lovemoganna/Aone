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

<div class="space-y-6">
    <!-- Display -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
            class="bg-slate-900 text-white p-5 rounded-lg border border-slate-800 flex flex-col items-center justify-center gap-1.5 shadow-2xs"
        >
            <div
                class="text-xs font-semibold text-slate-400 uppercase tracking-wider"
            >
                八进制 (Octal)
            </div>
            <div
                class="text-3xl font-mono font-bold tracking-widest text-emerald-400"
            >
                {octal}
            </div>
        </div>
        <div
            class="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-lg flex flex-col items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-2xs"
        >
            <div
                class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
                符号表示 (Symbolic)
            </div>
            <div
                class="text-xl font-mono font-medium text-slate-800 dark:text-slate-200"
            >
                {symbolic}
            </div>
        </div>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        {#each categories as cat}
            <div
                class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-2xs"
            >
                <div
                    class="bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 text-center font-semibold text-xs text-slate-700 dark:text-slate-200"
                >
                    {cat.label === 'Owner' ? '所有者 (Owner)' : cat.label === 'Group' ? '所属组 (Group)' : '公共用户 (Public)'}
                </div>
                <div class="p-3 space-y-1.5">
                    {#each perms as perm, i}
                        <label
                            class="flex items-center gap-3 p-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group select-none border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        >
                            <input
                                type="checkbox"
                                bind:checked={cat.state[i]}
                                class="rounded border-slate-300 dark:border-slate-600 text-slate-900 focus:ring-slate-400 w-4 h-4 cursor-pointer"
                            />
                            <span
                                class="text-xs font-medium text-slate-700 dark:text-slate-300 font-mono"
                                >{perm}</span
                            >
                        </label>
                    {/each}
                </div>
            </div>
        {/each}
    </div>
</div>
