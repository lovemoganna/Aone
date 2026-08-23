<script lang="ts">
    import { Copy, MonitorSmartphone } from "lucide-svelte";

    let userAgent = $state(
        typeof navigator !== "undefined"
            ? navigator.userAgent
            : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    let copied = $state("");

    function firstMatch(patterns: Array<[RegExp, string | ((match: RegExpMatchArray) => string)]>) {
        for (const [pattern, resolver] of patterns) {
            const match = userAgent.match(pattern);
            if (match) {
                return typeof resolver === "function" ? resolver(match) : resolver;
            }
        }
        return "Unknown";
    }

    const parsed = $derived.by(() => {
        const browser = firstMatch([
            [/Edg\/([\d.]+)/, (m) => `Microsoft Edge ${m[1]}`],
            [/OPR\/([\d.]+)/, (m) => `Opera ${m[1]}`],
            [/Chrome\/([\d.]+)/, (m) => `Chrome ${m[1]}`],
            [/Firefox\/([\d.]+)/, (m) => `Firefox ${m[1]}`],
            [/Version\/([\d.]+).*Safari\//, (m) => `Safari ${m[1]}`],
        ]);

        const engine = firstMatch([
            [/AppleWebKit\/([\d.]+)/, (m) => `WebKit ${m[1]}`],
            [/Gecko\/([\d.]+)/, (m) => `Gecko ${m[1]}`],
            [/Trident\/([\d.]+)/, (m) => `Trident ${m[1]}`],
        ]);

        const os = firstMatch([
            [/Windows NT 10\.0/, "Windows 10/11"],
            [/Windows NT 6\.3/, "Windows 8.1"],
            [/Windows NT 6\.1/, "Windows 7"],
            [/Mac OS X ([\d_]+)/, (m) => `macOS ${m[1].replace(/_/g, ".")}`],
            [/Android ([\d.]+)/, (m) => `Android ${m[1]}`],
            [/(iPhone|iPad).*OS ([\d_]+)/, (m) => `iOS ${m[2].replace(/_/g, ".")}`],
            [/Linux/, "Linux"],
        ]);

        const device = /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)
            ? /iPad|Tablet/i.test(userAgent)
                ? "Tablet"
                : "Mobile"
            : "Desktop";

        const architecture = firstMatch([
            [/Win64|x64|x86_64|amd64/i, "64-bit"],
            [/WOW64/i, "32-bit on 64-bit"],
            [/arm64|aarch64/i, "ARM 64-bit"],
            [/arm/i, "ARM"],
        ]);

        return { browser, engine, os, device, architecture };
    });

    async function copy(value: string, label: string) {
        await navigator.clipboard.writeText(value);
        copied = label;
        setTimeout(() => (copied = ""), 1400);
    }
</script>

<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
    <!-- Input Section -->
    <div class="flex flex-col gap-3 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
        <div class="flex justify-between items-center">
            <label
                for="ua-input"
                class="label-section"
            >
                User-Agent string
            </label>
            <button
                class="btn btn-secondary text-xs px-2 py-1 shadow-sm"
                onclick={() => copy(userAgent, "User-Agent")}
            >
                <Copy size={12} class="mr-1" />
                Copy raw string
            </button>
        </div>
        <textarea
            id="ua-input"
            bind:value={userAgent}
            spellcheck="false"
            class="textarea-editor flex-1"
        ></textarea>
    </div>

    <aside class="space-y-4">
        <div class="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
            <div class="mb-4 flex items-center gap-3">
                <div class="rounded-xl bg-slate-50 dark:bg-[#111113] border border-slate-200 dark:border-slate-800 p-2.5 text-slate-600 dark:text-slate-300">
                    <MonitorSmartphone size={20} />
                </div>
                <div>
                    <div class="font-semibold text-slate-900 dark:text-white">
                        Parsed Result
                    </div>
                    <div class="text-sm text-slate-500">
                        Local pattern-based detection
                    </div>
                </div>
            </div>

            <div class="divide-y divide-slate-100 dark:divide-slate-800">
                {#each [
                    ["Browser", parsed.browser],
                    ["Engine", parsed.engine],
                    ["Operating System", parsed.os],
                    ["Device Type", parsed.device],
                    ["Architecture", parsed.architecture],
                ] as row}
                    <div class="grid grid-cols-[130px_minmax(0,1fr)] gap-3 py-3">
                        <div class="text-sm font-medium text-slate-500">
                            {row[0]}
                        </div>
                        <button
                            class="btn btn-ghost text-sm"
                            onclick={() => copy(row[1], row[0])}
                            title="Copy"
                        >
                            {row[1]}
                        </button>
                    </div>
                {/each}
            </div>
        </div>

        {#if copied}
            <div class="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                Copied {copied}
            </div>
        {/if}
    </aside>
</div>
