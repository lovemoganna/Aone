<script lang="ts">
    import { Copy, Keyboard } from "lucide-svelte";

    type KeyInfo = {
        key: string;
        code: string;
        keyCode: number;
        which: number;
        location: number;
        altKey: boolean;
        ctrlKey: boolean;
        metaKey: boolean;
        shiftKey: boolean;
    };

    let keyInfo = $state<KeyInfo>({
        key: "A",
        code: "KeyA",
        keyCode: 65,
        which: 65,
        location: 0,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
    });
    let copied = $state("");

    function capture(event: KeyboardEvent) {
        event.preventDefault();
        keyInfo = {
            key: event.key,
            code: event.code,
            keyCode: event.keyCode,
            which: event.which,
            location: event.location,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey,
        };
    }

    async function copy(value: string, label: string) {
        await navigator.clipboard.writeText(value);
        copied = label;
        setTimeout(() => (copied = ""), 1400);
    }

    const rows = $derived([
        { label: "event.key", value: keyInfo.key },
        { label: "event.code", value: keyInfo.code },
        { label: "event.keyCode", value: String(keyInfo.keyCode) },
        { label: "event.which", value: String(keyInfo.which) },
        { label: "event.location", value: String(keyInfo.location) },
    ]);

    const modifiers = $derived([
        { label: "Alt", active: keyInfo.altKey },
        { label: "Ctrl", active: keyInfo.ctrlKey },
        { label: "Meta", active: keyInfo.metaKey },
        { label: "Shift", active: keyInfo.shiftKey },
    ]);
</script>

<div class="w-full flex justify-center items-start h-full">
    <div class="w-full max-w-5xl rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs">
        <div class="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
            <button
                type="button"
                class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/40 p-8 transition-all hover:border-slate-400 dark:hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
                onkeydown={capture}
            >
                <Keyboard class="mb-4 h-10 w-10 text-slate-400" />
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    点击此处并按下任意键
                </span>
                <span class="mt-4 max-w-full break-all font-mono text-5xl font-bold text-slate-900 dark:text-white">
                    {keyInfo.key === " " ? "Space" : keyInfo.key}
                </span>
                <span class="mt-2 font-mono text-xs text-slate-400">
                    {keyInfo.code}
                </span>
            </button>

            <section class="space-y-4">
                <div class="grid gap-3 sm:grid-cols-2">
                    {#each rows as row}
                        <div class="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 p-3 shadow-2xs">
                            <div class="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                {row.label}
                            </div>
                            <div class="flex items-center gap-2">
                                <code class="min-w-0 flex-1 truncate rounded bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-2.5 py-1 font-mono text-xs text-slate-800 dark:text-slate-100">
                                    {row.value}
                                </code>
                                <button
                                    class="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                                    title="复制"
                                    onclick={() => copy(row.value, row.label)}
                                >
                                    <Copy size={13} />
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>

                <div class="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 p-3.5">
                    <div class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        修饰键状态 (Modifiers)
                    </div>
                    <div class="flex flex-wrap gap-1.5">
                        {#each modifiers as mod}
                            <span
                                class="rounded-md px-2.5 py-1 text-xs font-mono font-medium {mod.active
                                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400'}"
                            >
                                {mod.label}
                            </span>
                        {/each}
                    </div>
                </div>

                {#if copied}
                    <div class="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 px-3.5 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        已复制 {copied}
                    </div>
                {/if}
            </section>
        </div>
    </div>
</div>
