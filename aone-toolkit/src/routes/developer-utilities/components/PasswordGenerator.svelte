<script lang="ts">
    import { Button } from "$lib/components/ui";
    import { Copy, RefreshCw, Check, Sparkles, Key, ShieldCheck, ShieldAlert, Trash2, Eye, EyeOff } from "lucide-svelte";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";

    let length = $state(20);
    let count = $state(5);
    let useUpper = $state(true);
    let useLower = $state(true);
    let useNumbers = $state(true);
    let useSymbols = $state(true);
    let excludeAmbiguous = $state(false);
    let maskPasswords = $state(false);

    let passwords = $state<string[]>([]);
    let copiedIndex = $state<number | null>(null);

    const CHARSETS = {
        upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        lower: "abcdefghijklmnopqrstuvwxyz",
        numbers: "0123456789",
        symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
        ambiguous: "0O1lI|`'\"~"
    };

    const PRESETS = [
        { name: "超强系统密码 (32位)", len: 32, u: true, l: true, n: true, s: true, amb: false },
        { name: "日常安全密码 (16位)", len: 16, u: true, l: true, n: true, s: true, amb: false },
        { name: "无易混淆字符 (24位)", len: 24, u: true, l: true, n: true, s: true, amb: true },
        { name: "纯数字 PIN (6位)", len: 6, u: false, l: false, n: true, s: false, amb: false },
    ];

    function getActiveCharset(): string {
        let pool = "";
        if (useUpper) pool += CHARSETS.upper;
        if (useLower) pool += CHARSETS.lower;
        if (useNumbers) pool += CHARSETS.numbers;
        if (useSymbols) pool += CHARSETS.symbols;

        if (excludeAmbiguous) {
            const ambSet = new Set(CHARSETS.ambiguous.split(""));
            pool = pool.split("").filter(c => !ambSet.has(c)).join("");
        }

        return pool;
    }

    function generateSingle(charset: string, len: number): string {
        if (!charset) return "";
        const bytes = new Uint32Array(len);
        crypto.getRandomValues(bytes);
        let str = "";
        for (let i = 0; i < len; i++) {
            str += charset[bytes[i] % charset.length];
        }
        return str;
    }

    function generate() {
        const pool = getActiveCharset();
        if (!pool) {
            passwords = [];
            return;
        }

        const safeCount = Math.min(Math.max(1, count), 20);
        const list: string[] = [];
        for (let i = 0; i < safeCount; i++) {
            list.push(generateSingle(pool, length));
        }
        passwords = list;
    }

    $effect(() => {
        // Trigger regen whenever parameters change
        if (length || count || useUpper !== undefined || useLower !== undefined || useNumbers !== undefined || useSymbols !== undefined || excludeAmbiguous !== undefined) {
            generate();
        }
    });

    let entropy = $derived.by(() => {
        const pool = getActiveCharset();
        if (!pool || length === 0) return 0;
        return Math.round(length * Math.log2(pool.length));
    });

    let strengthTier = $derived.by(() => {
        if (entropy >= 120) return { label: "极致军事级", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500" };
        if (entropy >= 80) return { label: "非常强", color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500" };
        if (entropy >= 50) return { label: "中等强度", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500" };
        return { label: "偏弱", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500" };
    });

    function copySingle(pwd: string, index: number) {
        if (!pwd) return;
        copyToClipboard(pwd, "密码");
        copiedIndex = index;
        toastStore.success("密码已复制到剪贴板");
        setTimeout(() => {
            if (copiedIndex === index) copiedIndex = null;
        }, 1500);
    }

    function copyAll() {
        if (passwords.length === 0) return;
        copyToClipboard(passwords.join("\n"), "所有密码");
        toastStore.success(`已复制全部 ${passwords.length} 条密码`);
    }

    function applyPreset(p: typeof PRESETS[0]) {
        length = p.len;
        useUpper = p.u;
        useLower = p.l;
        useNumbers = p.n;
        useSymbols = p.s;
        excludeAmbiguous = p.amb;
        toastStore.success(`已应用预设：${p.name}`);
    }
</script>

<div class="h-full flex flex-col gap-2.5 min-h-0">
    <!-- Top Command Toolbar -->
    <div class="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-2xs">
        <div class="flex items-center gap-2 flex-wrap min-w-0">
            <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
                <Key size={13} class="text-amber-500" />
                密码生成器
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
                class="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer shadow-2xs font-medium"
                onclick={copyAll}
                title="复制所有生成的密码"
            >
                <Copy size={12} />
                <span>复制全部</span>
            </button>
            <button
                type="button"
                class="px-2.5 py-1 text-xs rounded-md bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 transition flex items-center gap-1 cursor-pointer shadow-2xs font-semibold"
                onclick={generate}
                title="重新随机生成"
            >
                <RefreshCw size={12} />
                <span>刷新</span>
            </button>
        </div>
    </div>

    <!-- Dual Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        <!-- Left: Rule & Entropy Controls (5 cols) -->
        <div class="lg:col-span-5 flex flex-col gap-2.5 min-h-0">
            <!-- Strength & Entropy Meter Panel -->
            <div class="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2.5 shadow-2xs shrink-0">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <ShieldCheck size={14} class="text-emerald-500" />
                        密码熵值与安全性评估
                    </span>
                    <span class="text-[11px] font-bold font-mono {strengthTier.color}">
                        {strengthTier.label} ({entropy} bits)
                    </span>
                </div>

                <!-- Progress Bar -->
                <div class="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                        class="h-full {strengthTier.bg} transition-all duration-300 rounded-full"
                        style="width: {Math.min(100, (entropy / 128) * 100)}%;"
                    ></div>
                </div>

                <div class="text-[11px] text-slate-400 flex items-center justify-between font-mono">
                    <span>字符集大小: {getActiveCharset().length} 字符</span>
                    <span>碰撞破解难度: 2^{entropy}</span>
                </div>
            </div>

            <!-- Parameters Configuration Area -->
            <div class="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-2xs min-h-0 space-y-3.5 overflow-y-auto custom-scrollbar">
                <!-- Length Slider -->
                <div class="space-y-1.5">
                    <div class="flex justify-between items-center text-xs">
                        <label for="pwd-len-slider" class="font-bold text-slate-700 dark:text-slate-300">密码长度</label>
                        <span class="font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200/60 dark:border-sky-800/60 tabular-nums">
                            {length} 字符
                        </span>
                    </div>
                    <input
                        id="pwd-len-slider"
                        type="range"
                        min="6"
                        max="64"
                        bind:value={length}
                        class="w-full accent-sky-600 cursor-pointer"
                    />
                    <div class="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>6</span>
                        <span>16</span>
                        <span>32</span>
                        <span>48</span>
                        <span>64</span>
                    </div>
                </div>

                <!-- Quantity Slider -->
                <div class="space-y-1.5">
                    <div class="flex justify-between items-center text-xs">
                        <label for="pwd-cnt-slider" class="font-bold text-slate-700 dark:text-slate-300">批量生成数量</label>
                        <span class="font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded tabular-nums">
                            {count} 条
                        </span>
                    </div>
                    <input
                        id="pwd-cnt-slider"
                        type="range"
                        min="1"
                        max="20"
                        bind:value={count}
                        class="w-full accent-slate-700 dark:accent-slate-300 cursor-pointer"
                    />
                </div>

                <!-- Character Set Checkboxes -->
                <div class="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">字符集构成选项</span>

                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <label class="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer select-none">
                            <input type="checkbox" bind:checked={useUpper} class="rounded text-sky-600 focus:ring-0" />
                            <span class="font-medium text-slate-700 dark:text-slate-300">大写字母 (A-Z)</span>
                        </label>

                        <label class="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer select-none">
                            <input type="checkbox" bind:checked={useLower} class="rounded text-sky-600 focus:ring-0" />
                            <span class="font-medium text-slate-700 dark:text-slate-300">小写字母 (a-z)</span>
                        </label>

                        <label class="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer select-none">
                            <input type="checkbox" bind:checked={useNumbers} class="rounded text-sky-600 focus:ring-0" />
                            <span class="font-medium text-slate-700 dark:text-slate-300">数字 (0-9)</span>
                        </label>

                        <label class="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer select-none">
                            <input type="checkbox" bind:checked={useSymbols} class="rounded text-sky-600 focus:ring-0" />
                            <span class="font-medium text-slate-700 dark:text-slate-300">特殊符号 (!@#$)</span>
                        </label>
                    </div>

                    <label class="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer select-none text-xs">
                        <input type="checkbox" bind:checked={excludeAmbiguous} class="rounded text-amber-600 focus:ring-0" />
                        <div class="flex-1">
                            <span class="font-medium text-slate-700 dark:text-slate-300">排除易混淆字符</span>
                            <span class="text-[10px] text-slate-400 ml-1 font-mono">(0, O, 1, l, I, |)</span>
                        </div>
                    </label>
                </div>
            </div>
        </div>

        <!-- Right: Generated Passwords List (7 cols) -->
        <div class="lg:col-span-7 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
                <span class="font-bold text-slate-700 dark:text-slate-300">生成结果列表 ({passwords.length})</span>

                <button
                    type="button"
                    onclick={() => maskPasswords = !maskPasswords}
                    class="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                    {#if maskPasswords}
                        <Eye size={12} /> 显示明文
                    {:else}
                        <EyeOff size={12} /> 隐藏脱敏
                    {/if}
                </button>
            </div>

            <!-- List of Passwords -->
            <div class="flex-1 overflow-auto p-3 space-y-2 bg-slate-50/40 dark:bg-slate-950/40 min-h-0 custom-scrollbar divide-y divide-slate-100/60 dark:divide-slate-800/40">
                {#each passwords as pwd, i}
                    <div class="pt-2 first:pt-0 flex items-center justify-between gap-3 group">
                        <div class="flex items-center gap-2.5 min-w-0 flex-1">
                            <span class="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-mono flex items-center justify-center shrink-0">
                                {i + 1}
                            </span>
                            <div class="font-mono text-xs text-slate-800 dark:text-slate-100 tracking-wider break-all select-all font-medium">
                                {#if maskPasswords}
                                    {"•".repeat(pwd.length)}
                                {:else}
                                    {pwd}
                                {/if}
                            </div>
                        </div>

                        <button
                            type="button"
                            onclick={() => copySingle(pwd, i)}
                            class="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs font-sans"
                            title="复制该密码"
                        >
                            {#if copiedIndex === i}
                                <Check size={11} class="text-emerald-500" />
                                <span class="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">已复制</span>
                            {:else}
                                <Copy size={11} class="text-slate-400" />
                                <span class="text-[11px]">复制</span>
                            {/if}
                        </button>
                    </div>
                {/each}

                {#if passwords.length === 0}
                    <div class="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic font-sans py-12 gap-2">
                        <Key size={24} class="text-slate-300 dark:text-slate-700" />
                        <span>请在左侧至少勾选一种字符类型</span>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
