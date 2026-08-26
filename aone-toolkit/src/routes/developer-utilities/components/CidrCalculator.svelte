<script lang="ts">
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import {
        Network,
        Copy,
        Sparkles,
        Check,
        AlertCircle,
        Search,
        Layers,
        Binary,
        Server
    } from "lucide-svelte";

    let input = $state("192.168.1.42/24");
    let testIp = $state("192.168.1.100");

    const PRESETS = [
        { name: "局域网 C 类 (/24)", cidr: "192.168.1.0/24" },
        { name: "企业网 B 类 (/16)", cidr: "172.16.0.0/16" },
        { name: "超大私网 A 类 (/8)", cidr: "10.0.0.0/8" },
        { name: "点对点子网 (/30)", cidr: "10.0.1.0/30" },
        { name: "主机单播 (/32)", cidr: "192.168.1.10/32" },
    ];

    function ipToNumber(ip: string): number | null {
        const parts = ip.trim().split(".").map(p => Number(p));
        if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255 || !Number.isInteger(p))) {
            return null;
        }
        return (
            ((parts[0] << 24) >>> 0) +
            ((parts[1] << 16) >>> 0) +
            ((parts[2] << 8) >>> 0) +
            parts[3]
        ) >>> 0;
    }

    function numberToIp(val: number): string {
        return [
            (val >>> 24) & 255,
            (val >>> 16) & 255,
            (val >>> 8) & 255,
            val & 255,
        ].join(".");
    }

    function toBinaryString(num: number): string[] {
        const full = (num >>> 0).toString(2).padStart(32, "0");
        return [
            full.slice(0, 8),
            full.slice(8, 16),
            full.slice(16, 24),
            full.slice(24, 32)
        ];
    }

    const result = $derived.by(() => {
        const normalized = input.trim();
        const match = normalized.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?:\/(\d{1,2}))?$/);
        if (!match) {
            return { error: "请输入有效的 IPv4 CIDR 格式，例如 192.168.1.0/24 或 10.0.0.1/16" };
        }

        const ipNumber = ipToNumber(match[1]);
        const prefix = match[2] === undefined ? 24 : Number(match[2]);

        if (ipNumber === null || isNaN(prefix) || prefix < 0 || prefix > 32) {
            return { error: "IPv4 每段需在 0-255 之间，子网掩码长度需在 0-32 之间" };
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
            prefix,
            cidr: `${numberToIp(network)}/${prefix}`,
            inputIp: numberToIp(ipNumber),
            netmask: numberToIp(mask),
            wildcard: numberToIp(wildcard),
            network: numberToIp(network),
            broadcast: numberToIp(broadcast),
            firstHost: numberToIp(firstHost),
            lastHost: numberToIp(lastHost),
            total: total.toLocaleString(),
            usable: usable.toLocaleString(),
            netmaskBin: toBinaryString(mask),
            networkNum: network,
            broadcastNum: broadcast
        };
    });

    let ipTestStatus = $derived.by(() => {
        if (!testIp.trim() || result.error || !result.networkNum) return null;
        const testNum = ipToNumber(testIp);
        if (testNum === null) {
            return { valid: false, inRange: false, msg: "测试 IP 格式无效" };
        }
        const inRange = testNum >= result.networkNum && testNum <= result.broadcastNum!;
        return {
            valid: true,
            inRange,
            msg: inRange ? `IP ${testIp} 属于当前 CIDR 网段` : `IP ${testIp} 不在当前网段内`
        };
    });

    function applyPreset(p: typeof PRESETS[0]) {
        input = p.cidr;
        toastStore.info(`已载入预设：${p.name}`);
    }

    function copyVal(val: string, label: string) {
        copyToClipboard(val, label);
        toastStore.success(`已复制 ${label}`);
    }
</script>

<div class="h-full flex flex-col gap-2.5 min-h-0">
    <!-- Top Command Toolbar -->
    <div class="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-2xs">
        <div class="flex items-center gap-2 flex-wrap min-w-0">
            <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
                <Network size={13} class="text-sky-500" />
                CIDR / IPv4 子网掩码计算器
            </span>
            <span class="text-slate-300 dark:text-slate-700">|</span>
            <span class="text-slate-400 text-[11px] font-medium shrink-0 flex items-center gap-1">
                <Sparkles size={11} class="text-amber-500" /> 预设:
            </span>
            {#each PRESETS as p}
                <button
                    type="button"
                    class="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    onclick={() => applyPreset(p)}
                >
                    {p.name}
                </button>
            {/each}
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
            {#if !result.error}
                <button
                    type="button"
                    class="px-2.5 py-1 text-xs rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition flex items-center gap-1 cursor-pointer shadow-2xs font-semibold"
                    onclick={() => copyVal(result.cidr ?? "", "标准 CIDR")}
                >
                    <Copy size={12} />
                    <span>复制 CIDR</span>
                </button>
            {/if}
        </div>
    </div>

    <!-- Dual Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        <!-- Left: Input & Bitmask Visualizer (5 cols) -->
        <div class="lg:col-span-5 flex flex-col gap-2.5 min-h-0">
            <!-- Input Card -->
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-2.5 shadow-2xs">
                <label for="cidr-input-box" class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Server size={13} class="text-sky-500" />
                    输入 CIDR 地址
                </label>
                <input
                    id="cidr-input-box"
                    type="text"
                    bind:value={input}
                    placeholder="192.168.1.0/24"
                    class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 font-mono text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    spellcheck="false"
                />

                {#if result.error}
                    <div class="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded border border-rose-200 dark:border-rose-900 flex items-center gap-1.5">
                        <AlertCircle size={13} class="shrink-0" />
                        <span>{result.error}</span>
                    </div>
                {/if}
            </div>

            <!-- Bitmask 32-bit Visual Map -->
            {#if !result.error && result.netmaskBin}
                <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-2.5 shadow-2xs">
                    <div class="flex items-center justify-between text-xs">
                        <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Binary size={13} class="text-indigo-500" />
                            32-bit 子网掩码位图
                        </span>
                        <span class="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                            /{result.prefix} 位前缀
                        </span>
                    </div>

                    <!-- Octet Blocks -->
                    <div class="grid grid-cols-4 gap-1.5 font-mono text-xs text-center">
                        {#each result.netmaskBin as oct, octIdx}
                            <div class="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                                <div class="text-[10px] text-slate-400 font-sans font-medium">第 {octIdx + 1} 字节</div>
                                <div class="font-bold text-[11px] text-slate-800 dark:text-slate-200 tracking-wider">
                                    {oct}
                                </div>
                            </div>
                        {/each}
                    </div>

                    <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-sky-500"></span> 网络位 (Network): {result.prefix} bits</span>
                        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-slate-400"></span> 主机位 (Host): {32 - (result.prefix ?? 0)} bits</span>
                    </div>
                </div>
            {/if}

            <!-- IP Range Membership Tester -->
            {#if !result.error}
                <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-2.5 shadow-2xs">
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Search size={13} class="text-emerald-500" />
                        IP 网段归属探测
                    </span>
                    <input
                        type="text"
                        bind:value={testIp}
                        placeholder="输入任意 IP 校验是否在此网段内..."
                        class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        spellcheck="false"
                    />

                    {#if ipTestStatus}
                        <div class="p-2 rounded text-xs font-medium flex items-center gap-1.5 {ipTestStatus.inRange ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'}">
                            {#if ipTestStatus.inRange}
                                <Check size={13} class="text-emerald-600" />
                            {:else}
                                <AlertCircle size={13} class="text-rose-600" />
                            {/if}
                            <span>{ipTestStatus.msg}</span>
                        </div>
                    {/if}
                </div>
            {/if}
        </div>

        <!-- Right: Structured Subnet Analysis Matrix (7 cols) -->
        <div class="lg:col-span-7 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
                <span class="font-bold text-slate-700 dark:text-slate-300">子网计算明细矩阵</span>
                <span class="text-[10px] text-slate-400 font-mono">IPv4 Subnet Breakdown</span>
            </div>

            <!-- Metrics Matrix -->
            <div class="flex-1 overflow-auto p-3.5 space-y-3 bg-slate-50/40 dark:bg-slate-950/40 min-h-0 custom-scrollbar">
                {#if result.error}
                    <div class="h-full flex items-center justify-center text-slate-400 text-xs italic">
                        请输入合法的 CIDR 表达式以展示计算矩阵
                    </div>
                {:else}
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <!-- Network Address -->
                        <div class="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
                            <div class="text-[11px] text-slate-400 font-medium">网络地址 (Network Address)</div>
                            <div class="flex items-center justify-between">
                                <span class="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{result.network}</span>
                                <button onclick={() => copyVal(result.network!, "网络地址")} class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5">
                                    <Copy size={12} />
                                </button>
                            </div>
                        </div>

                        <!-- Broadcast Address -->
                        <div class="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
                            <div class="text-[11px] text-slate-400 font-medium">广播地址 (Broadcast Address)</div>
                            <div class="flex items-center justify-between">
                                <span class="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{result.broadcast}</span>
                                <button onclick={() => copyVal(result.broadcast!, "广播地址")} class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5">
                                    <Copy size={12} />
                                </button>
                            </div>
                        </div>

                        <!-- First Usable Host -->
                        <div class="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
                            <div class="text-[11px] text-slate-400 font-medium">可用主机起始 (First Usable Host)</div>
                            <div class="flex items-center justify-between">
                                <span class="font-mono font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">{result.firstHost}</span>
                                <button onclick={() => copyVal(result.firstHost!, "可用起始 IP")} class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5">
                                    <Copy size={12} />
                                </button>
                            </div>
                        </div>

                        <!-- Last Usable Host -->
                        <div class="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
                            <div class="text-[11px] text-slate-400 font-medium">可用主机结束 (Last Usable Host)</div>
                            <div class="flex items-center justify-between">
                                <span class="font-mono font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">{result.lastHost}</span>
                                <button onclick={() => copyVal(result.lastHost!, "可用结束 IP")} class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5">
                                    <Copy size={12} />
                                </button>
                            </div>
                        </div>

                        <!-- Subnet Mask -->
                        <div class="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
                            <div class="text-[11px] text-slate-400 font-medium">子网掩码 (Subnet Mask)</div>
                            <div class="flex items-center justify-between">
                                <span class="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{result.netmask}</span>
                                <button onclick={() => copyVal(result.netmask!, "子网掩码")} class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5">
                                    <Copy size={12} />
                                </button>
                            </div>
                        </div>

                        <!-- Wildcard Mask -->
                        <div class="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
                            <div class="text-[11px] text-slate-400 font-medium">通配符掩码 (Wildcard Mask)</div>
                            <div class="flex items-center justify-between">
                                <span class="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{result.wildcard}</span>
                                <button onclick={() => copyVal(result.wildcard!, "通配符掩码")} class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5">
                                    <Copy size={12} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Capacity Summary Card -->
                    <div class="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-around text-center shadow-2xs">
                        <div>
                            <div class="text-[11px] text-slate-400 font-medium">IP 地址总数</div>
                            <div class="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                                {result.total}
                            </div>
                        </div>
                        <div class="w-px h-8 bg-slate-200 dark:border-slate-800"></div>
                        <div>
                            <div class="text-[11px] text-slate-400 font-medium">可用主机容量</div>
                            <div class="text-sm sm:text-base font-bold font-mono text-sky-600 dark:text-sky-400 mt-0.5">
                                {result.usable}
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

