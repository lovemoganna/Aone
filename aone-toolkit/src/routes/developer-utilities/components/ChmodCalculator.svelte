<script lang="ts">
    import { Check, Copy, Shield, Sparkles, Terminal, AlertTriangle } from "lucide-svelte";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";

    // State for permissions: [Read, Write, Execute]
    let owner = $state([true, true, true]); // 7
    let group = $state([true, false, true]); // 5
    let public_ = $state([true, false, true]); // 5
    let filename = $state("script.sh");
    let isRecursive = $state(false);

    function calcDigit(p: boolean[]) {
        return (p[0] ? 4 : 0) + (p[1] ? 2 : 0) + (p[2] ? 1 : 0);
    }

    let octal = $derived(`${calcDigit(owner)}${calcDigit(group)}${calcDigit(public_)}`);

    let symbolic = $derived.by(() => {
        const char = (p: boolean[]) => `${p[0] ? "r" : "-"}${p[1] ? "w" : "-"}${p[2] ? "x" : "-"}`;
        return `-${char(owner)}${char(group)}${char(public_)}`;
    });

    let chmodCmd = $derived(`chmod ${isRecursive ? "-R " : ""}${octal} ${filename}`);

    const PRESETS = [
        { name: "755 (目录/脚本)", oct: "755", o: [true, true, true], g: [true, false, true], p: [true, false, true], desc: "所有者读写执行，组与公共只读执行" },
        { name: "644 (常规文本)", oct: "644", o: [true, true, false], g: [true, false, false], p: [true, false, false], desc: "所有者读写，组与公共只读" },
        { name: "700 (私有脚本)", oct: "700", o: [true, true, true], g: [false, false, false], p: [false, false, false], desc: "仅所有者可读写执行，其余完全隔离" },
        { name: "600 (密钥/凭证)", oct: "600", o: [true, true, false], g: [false, false, false], p: [false, false, false], desc: "如 ~/.ssh/id_rsa，严禁组与公共访问" },
        { name: "400 (只读私钥)", oct: "400", o: [true, false, false], g: [false, false, false], p: [false, false, false], desc: "不可修改，绝对只读" },
        { name: "777 (全权限·慎用)", oct: "777", o: [true, true, true], g: [true, true, true], p: [true, true, true], desc: "所有人均可读写执行，存在极高安全风险" },
    ];

    function applyPreset(p: typeof PRESETS[0]) {
        owner = [...p.o];
        group = [...p.g];
        public_ = [...p.p];
        toastStore.success(`已应用预设：${p.name}`);
    }

    function handleCopy(cmd: string, label: string) {
        copyToClipboard(cmd, label);
        toastStore.success(`已复制 ${label}: ${cmd}`);
    }
</script>

<div class="h-full flex flex-col gap-2.5 min-h-0">
    <!-- Top Command Toolbar -->
    <div class="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-2xs">
        <div class="flex items-center gap-2 flex-wrap min-w-0">
            <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
                <Shield size={13} class="text-sky-500" />
                Linux 文件权限 (Chmod) 计算器
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
            <button
                type="button"
                onclick={() => handleCopy(chmodCmd, "Chmod 命令")}
                class="px-2.5 py-1 text-xs rounded-md bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 transition flex items-center gap-1 shadow-2xs font-semibold cursor-pointer"
            >
                <Copy size={11} /> 复制命令
            </button>
        </div>
    </div>

    <!-- Dual Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        <!-- Left: Interactive Checkboxes Grid (7 cols) -->
        <div class="lg:col-span-7 flex flex-col gap-2.5 min-h-0">
            <!-- 3 Columns Checkboxes -->
            <div class="grid grid-cols-3 gap-2.5 shrink-0">
                {#each [
                    { label: "所有者 (Owner · u)", state: owner, digit: calcDigit(owner) },
                    { label: "所属组 (Group · g)", state: group, digit: calcDigit(group) },
                    { label: "公共其他 (Others · o)", state: public_, digit: calcDigit(public_) },
                ] as cat}
                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-2xs">
                        <div class="bg-slate-50 dark:bg-slate-800/60 px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between font-semibold text-xs text-slate-700 dark:text-slate-200">
                            <span>{cat.label}</span>
                            <span class="font-mono font-bold text-sky-600 dark:text-sky-400">{cat.digit}</span>
                        </div>
                        <div class="p-2.5 space-y-1.5">
                            {#each [
                                { label: "读取权限 (Read · 4)", idx: 0 },
                                { label: "写入权限 (Write · 2)", idx: 1 },
                                { label: "执行权限 (Execute · 1)", idx: 2 },
                            ] as p}
                                <label class="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition select-none">
                                    <input
                                        type="checkbox"
                                        bind:checked={cat.state[p.idx]}
                                        class="rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5 cursor-pointer"
                                    />
                                    <span class="text-xs font-medium text-slate-700 dark:text-slate-300 font-mono">{p.label}</span>
                                </label>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>

            <!-- Terminal Command Composer -->
            <div class="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2.5 shadow-2xs flex-1 min-h-0 flex flex-col justify-between">
                <div class="space-y-2">
                    <span class="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Terminal size={12} class="text-sky-500" />
                        生成 Linux 命令
                    </span>

                    <div class="flex items-center gap-2">
                        <input
                            type="text"
                            bind:value={filename}
                            class="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md font-mono text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
                            placeholder="目标文件名或路径 (如 /var/www/html)"
                        />
                        <label class="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 select-none cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                bind:checked={isRecursive}
                                class="rounded border-slate-300 dark:border-slate-600 text-sky-600"
                            />
                            <span>递归 (-R)</span>
                        </label>
                    </div>
                </div>

                <div class="p-3 rounded-lg bg-slate-900 text-white font-mono text-xs flex items-center justify-between shadow-inner">
                    <span class="text-sky-400 select-all">$ {chmodCmd}</span>
                    <button
                        type="button"
                        onclick={() => handleCopy(chmodCmd, "命令")}
                        class="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
                        title="复制"
                    >
                        <Copy size={12} />
                    </button>
                </div>
            </div>
        </div>

        <!-- Right: Status Cards & Description (5 cols) -->
        <div class="lg:col-span-5 flex flex-col gap-2.5 min-h-0">
            <!-- Octal & Symbolic Big HUD -->
            <div class="grid grid-cols-2 gap-2.5 shrink-0">
                <div class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs flex flex-col items-center justify-center space-y-1 text-center">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">八进制代码 (OCTAL)</span>
                    <div class="font-mono text-3xl font-bold tracking-widest text-sky-600 dark:text-sky-400 select-all">{octal}</div>
                </div>
                <div class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs flex flex-col items-center justify-center space-y-1 text-center">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">符号表达 (SYMBOLIC)</span>
                    <div class="font-mono text-xl font-bold tracking-wider text-slate-800 dark:text-slate-200 select-all">{symbolic}</div>
                </div>
            </div>

            <!-- Security Warning if 777 -->
            {#if octal === "777"}
                <div class="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                    <AlertTriangle size={15} class="text-rose-500 shrink-0 mt-0.5" />
                    <div>
                        <div class="font-bold">安全告警：777 存在严重安全风险</div>
                        <div class="text-[11px] opacity-90 mt-0.5">任何系统用户均可覆写或执行该文件，请勿在生产环境中使用。</div>
                    </div>
                </div>
            {/if}

            <!-- Quick Presets Reference List -->
            <div class="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 shadow-2xs flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <span class="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">权限字典速查</span>
                <div class="space-y-1.5 text-xs">
                    {#each PRESETS as p}
                        <button
                            type="button"
                            onclick={() => applyPreset(p)}
                            class="w-full text-left p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center justify-between cursor-pointer group"
                        >
                            <div>
                                <span class="font-mono font-bold text-sky-600 dark:text-sky-400 mr-2">{p.oct}</span>
                                <span class="text-slate-700 dark:text-slate-200 font-medium">{p.name}</span>
                                <p class="text-[10px] text-slate-400 mt-0.5">{p.desc}</p>
                            </div>
                        </button>
                    {/each}
                </div>
            </div>
        </div>
    </div>
</div>
