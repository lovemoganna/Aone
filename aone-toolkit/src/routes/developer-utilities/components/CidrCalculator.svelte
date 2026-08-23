<script lang="ts">
    import { Copy } from "lucide-svelte";

    let input = $state("192.168.1.42/24");
    let copied = $state("");

    function ipToNumber(ip: string): number | null {
        const parts = ip.split(".").map((part) => Number(part));
        if (
            parts.length !== 4 ||
            parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
        ) {
            return null;
        }

        return (
            ((parts[0] << 24) >>> 0) +
            ((parts[1] << 16) >>> 0) +
            ((parts[2] << 8) >>> 0) +
            parts[3]
        ) >>> 0;
    }

    function numberToIp(value: number): string {
        return [
            (value >>> 24) & 255,
            (value >>> 16) & 255,
            (value >>> 8) & 255,
            value & 255,
        ].join(".");
    }

    function formatCount(value: number): string {
        return new Intl.NumberFormat("en-US").format(value);
    }

    const result = $derived.by(() => {
        const normalized = input.trim();
        const match = normalized.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?:\/(\d{1,2}))?$/);
        if (!match) {
            return { error: "Use IPv4 CIDR format, for example 10.0.0.15/20." };
        }

        const ipNumber = ipToNumber(match[1]);
        const prefix = match[2] === undefined ? 24 : Number(match[2]);

        if (ipNumber === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
            return { error: "IPv4 octets must be 0-255 and prefix must be 0-32." };
        }

        const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
        const wildcard = (~mask) >>> 0;
        const network = (ipNumber & mask) >>> 0;
        const broadcast = (network | wildcard) >>> 0;
        const total = 2 ** (32 - prefix);
        const usable = prefix >= 31 ? total : Math.max(total - 2, 0);
        const firstHost = prefix >= 31 ? network : network + 1;
        const lastHost = prefix >= 31 ? broadcast : broadcast - 1;

        return {
            error: "",
            cidr: `${numberToIp(network)}/${prefix}`,
            inputIp: numberToIp(ipNumber),
            netmask: numberToIp(mask),
            wildcard: numberToIp(wildcard),
            network: numberToIp(network),
            broadcast: numberToIp(broadcast),
            firstHost: numberToIp(firstHost),
            lastHost: numberToIp(lastHost),
            total: formatCount(total),
            usable: formatCount(usable),
        };
    });

    async function copy(value: string, label: string) {
        await navigator.clipboard.writeText(value);
        copied = label;
        setTimeout(() => (copied = ""), 1400);
    }
</script>

<div class="space-y-6 w-full">
    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <label
            for="cidr-input"
            class="text-xs font-semibold uppercase tracking-wider text-slate-500"
        >
            IPv4 CIDR
        </label>
        <input
            id="cidr-input"
            bind:value={input}
            spellcheck="false"
            class="input text-sm w-full"
            placeholder="192.168.1.42/24"
        />
    </section>

    {#if result.error}
        <div class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
            {result.error}
        </div>
    {:else}
        <div class="grid gap-4 md:grid-cols-2">
            {#each [
                { label: "Normalized CIDR", value: result.cidr ?? "" },
                { label: "Input IP", value: result.inputIp ?? "" },
                { label: "Network", value: result.network ?? "" },
                { label: "Broadcast", value: result.broadcast ?? "" },
                { label: "First Host", value: result.firstHost ?? "" },
                { label: "Last Host", value: result.lastHost ?? "" },
                { label: "Netmask", value: result.netmask ?? "" },
                { label: "Wildcard", value: result.wildcard ?? "" },
                { label: "Total Addresses", value: result.total ?? "" },
                { label: "Usable Hosts", value: result.usable ?? "" },
            ] as row}
                <div class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {row.label}
                    </div>
                    <div class="flex items-center gap-2">
                        <code class="min-w-0 flex-1 truncate rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                            {row.value}
                        </code>
                        <button
                            class="btn btn-secondary text-sm shadow-sm"
                            title="Copy"
                            onclick={() => copy(row.value, row.label)}
                        >
                            <Copy size={16} />
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}

    {#if copied}
        <div class="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            Copied {copied}
        </div>
    {/if}
</div>
