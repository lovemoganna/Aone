<script lang="ts">
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import {
        Keyboard,
        Copy,
        Sparkles,
        Trash2,
        Radio,
        Code2,
        Check,
        Layers
    } from "lucide-svelte";
    import { CodeBlock } from "$lib/components/ui";

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
        key: "Enter",
        code: "Enter",
        keyCode: 13,
        which: 13,
        location: 0,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
    });

    let isGlobalListening = $state(true);

    const PRESETS = [
        { name: "Enter 回车", key: "Enter", code: "Enter", keyCode: 13 },
        { name: "Escape 退出", key: "Escape", code: "Escape", keyCode: 27 },
        { name: "Tab 制表", key: "Tab", code: "Tab", keyCode: 9 },
        { name: "Space 空格", key: " ", code: "Space", keyCode: 32 },
        { name: "Backspace", key: "Backspace", code: "Backspace", keyCode: 8 },
        { name: "ArrowUp 上", key: "ArrowUp", code: "ArrowUp", keyCode: 38 }
    ];

    function capture(event: KeyboardEvent) {
        // Prevent default only if inside active capture box or specific keys to avoid unwanted browser action
        if (event.key === "Tab" || event.key === " " || event.key.startsWith("Arrow")) {
            event.preventDefault();
        }

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

    function handleGlobalKeyDown(e: KeyboardEvent) {
        if (!isGlobalListening) return;
        // Don't intercept if user is typing in an input or textarea
        const target = e.target as HTMLElement;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
        capture(e);
    }

    function applyPreset(p: typeof PRESETS[0]) {
        keyInfo = {
            key: p.key,
            code: p.code,
            keyCode: p.keyCode,
            which: p.keyCode,
            location: 0,
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            shiftKey: false
        };
        toastStore.info(`已载入按键：${p.name}`);
    }

    function copyVal(val: string, label: string) {
        copyToClipboard(val, label);
        toastStore.success(`已复制 ${label}`);
    }

    const snippet = $derived.by(() => {
        let condition = `event.key === "${keyInfo.key}"`;
        if (keyInfo.ctrlKey) condition = `event.ctrlKey && ` + condition;
        if (keyInfo.metaKey) condition = `event.metaKey && ` + condition;
        if (keyInfo.altKey) condition = `event.altKey && ` + condition;
        if (keyInfo.shiftKey) condition = `event.shiftKey && ` + condition;
        return `if (${condition}) {\n  // 处理按键逻辑\n  event.preventDefault();\n}`;
    });
</script>

<svelte:window onkeydown={handleGlobalKeyDown} />

<div class="h-full flex flex-col gap-2.5 min-h-0">
    <!-- Top Command Toolbar -->
    <div class="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-2xs">
        <div class="flex items-center gap-2 flex-wrap min-w-0">
            <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
                <Keyboard size={13} class="text-sky-500" />
                键盘按键与 KeyCode 侦测器
            </span>
            <span class="text-slate-300 dark:text-slate-700">|</span>
            <label class="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input type="checkbox" bind:checked={isGlobalListening} class="rounded text-sky-600 focus:ring-0" />
                <span>全局按键捕获</span>
            </label>
            <span class="text-slate-300 dark:text-slate-700">|</span>
            <span class="text-slate-400 text-[11px] font-medium shrink-0 flex items-center gap-1">
                <Sparkles size={11} class="text-amber-500" /> 预设按键:
            </span>
            {#each PRESETS as p}
                <button
                    type="button"
                    class="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    onclick={() => applyPreset(p)}
                >
                    {p.name.split(" ")[0]}
                </button>
            {/each}
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
            <button
                type="button"
                class="px-2.5 py-1 text-xs rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition flex items-center gap-1 cursor-pointer shadow-2xs font-semibold"
                onclick={() => copyVal(String(keyInfo.keyCode), "KeyCode 数值")}
            >
                <Copy size={12} />
                <span>复制 KeyCode</span>
            </button>
        </div>
    </div>

    <!-- Dual Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        <!-- Left: Interactive Press Zone & Modifiers (5 cols) -->
        <div class="lg:col-span-5 flex flex-col gap-2.5 min-h-0">
            <!-- Big Key Card -->
            <button
                type="button"
                tabindex="0"
                onkeydown={capture}
                class="flex-1 bg-white dark:bg-slate-900 border-2 border-dashed border-sky-400/60 dark:border-sky-700/60 rounded-lg p-6 flex flex-col items-center justify-center relative group shadow-2xs hover:border-sky-500 dark:hover:border-sky-400 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
                <div class="text-slate-400 text-xs font-semibold tracking-wider uppercase mb-2 flex items-center gap-1.5">
                    <Radio size={14} class="text-emerald-500 animate-pulse" />
                    请按下任意物理按键
                </div>

                <div class="font-mono text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight my-2 drop-shadow-sm">
                    {keyInfo.key === " " ? "Space" : keyInfo.key}
                </div>

                <div class="font-mono text-xs text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/80 px-3 py-1 rounded-full font-bold mt-2">
                    {keyInfo.code}
                </div>
            </button>

            <!-- Modifiers Badge Card -->
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-2.5 shadow-2xs shrink-0">
                <div class="text-xs font-bold text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-100 dark:border-slate-800">
                    修饰键实时激活状态 (Modifiers)
                </div>

                <div class="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                    <div class="p-2 rounded-md border font-bold transition {keyInfo.ctrlKey ? 'bg-sky-500 text-white border-sky-600 shadow-2xs' : 'bg-slate-50 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800'}">
                        Control
                    </div>
                    <div class="p-2 rounded-md border font-bold transition {keyInfo.shiftKey ? 'bg-sky-500 text-white border-sky-600 shadow-2xs' : 'bg-slate-50 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800'}">
                        Shift
                    </div>
                    <div class="p-2 rounded-md border font-bold transition {keyInfo.altKey ? 'bg-sky-500 text-white border-sky-600 shadow-2xs' : 'bg-slate-50 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800'}">
                        Alt / Option
                    </div>
                    <div class="p-2 rounded-md border font-bold transition {keyInfo.metaKey ? 'bg-sky-500 text-white border-sky-600 shadow-2xs' : 'bg-slate-50 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800'}">
                        Meta / Win
                    </div>
                </div>
            </div>
        </div>

        <!-- Right: Event Parameters & JS Code Snippet (7 cols) -->
        <div class="lg:col-span-7 flex flex-col gap-2.5 min-h-0">
            <!-- Properties Grid -->
            <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-3 shadow-2xs shrink-0">
                <div class="text-xs font-bold text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-100 dark:border-slate-800">
                    KeyboardEvent 对象属性明细
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs font-mono">
                    {#each [
                        { label: "event.key", val: keyInfo.key, desc: "标准键值标识" },
                        { label: "event.code", val: keyInfo.code, desc: "物理按键代码" },
                        { label: "event.keyCode", val: String(keyInfo.keyCode), desc: "传统数值编号 (已弃用)" },
                        { label: "event.which", val: String(keyInfo.which), desc: "兼容性键码" },
                        { label: "event.location", val: String(keyInfo.location), desc: "键盘物理位置 (0=标准, 1=左, 2=右, 3=小键盘)" },
                        { label: "event.repeat", val: "false", desc: "长按重复标志" }
                    ] as prop}
                        <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2">
                            <div class="min-w-0">
                                <div class="text-[10px] text-slate-400 font-sans">{prop.label}</div>
                                <div class="text-xs font-bold text-slate-900 dark:text-white truncate">{prop.val}</div>
                            </div>
                            <button
                                type="button"
                                onclick={() => copyVal(prop.val, prop.label)}
                                class="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                                title="复制"
                            >
                                <Copy size={11} />
                            </button>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- JavaScript Code Snippet Card -->
            <div class="flex-1 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
                <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span class="flex items-center gap-1.5">
                        <Code2 size={13} class="text-sky-500" />
                        事件监听判定代码模板 (JS / TS)
                    </span>
                    <button
                        type="button"
                        onclick={() => copyVal(snippet, "JS 监听代码")}
                        class="px-2 py-0.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 font-medium cursor-pointer"
                    >
                        <Copy size={10} />
                        <span>复制代码</span>
                    </button>
                </div>
                <div class="p-3 bg-slate-50/40 dark:bg-slate-950/40 font-mono text-xs flex-1 overflow-auto custom-scrollbar">
                    <CodeBlock
                        code={snippet}
                        language="javascript"
                        showHeader={false}
                        wrapLines={true}
                        class="!my-0 border-0"
                    />
                </div>
            </div>
        </div>
    </div>
</div>

