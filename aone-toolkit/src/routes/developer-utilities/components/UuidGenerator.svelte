<script lang="ts">
    import { Button } from "$lib/components/ui";
    import { Copy, RefreshCw, Sparkles, Key, Check, Trash2, Download, Layers } from "lucide-svelte";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";

    let version = $state<"v4" | "v7" | "v1">("v4");
    let count = $state(5);
    let uppercase = $state(false);
    let removeHyphens = $state(false);
    let wrapInBraces = $state(false);
    let wrapInQuotes = $state(false);

    let uuids = $state<string[]>([]);
    let copiedIndex = $state<number | null>(null);

    // Cryptographically secure UUID v4
    function generateUUIDv4(): string {
        if (typeof crypto.randomUUID === "function") {
            return crypto.randomUUID();
        }
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (crypto.getRandomValues(new Uint8Array(1))[0] % 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    // UUID v7 (Timestamp-first, Unix Epoch millisecond ordered)
    function generateUUIDv7(): string {
        const now = Date.now();
        const hexTimestamp = now.toString(16).padStart(12, "0");
        const randomBytes = new Uint8Array(10);
        crypto.getRandomValues(randomBytes);
        const hexRandom = Array.from(randomBytes).map(b => b.toString(16).padStart(2, "0")).join("");

        // Format: 8-4-4-4-12
        const p1 = hexTimestamp.slice(0, 8);
        const p2 = hexTimestamp.slice(8, 12);
        const p3 = "7" + hexRandom.slice(0, 3);
        const p4 = ((parseInt(hexRandom.slice(3, 4), 16) & 0x3) | 0x8).toString(16) + hexRandom.slice(4, 7);
        const p5 = hexRandom.slice(7, 19);

        return `${p1}-${p2}-${p3}-${p4}-${p5}`;
    }

    function formatUUID(raw: string): string {
        let res = raw;
        if (removeHyphens) {
            res = res.replace(/-/g, "");
        }
        if (uppercase) {
            res = res.toUpperCase();
        } else {
            res = res.toLowerCase();
        }
        if (wrapInBraces) {
            res = `{${res}}`;
        }
        if (wrapInQuotes) {
            res = `"${res}"`;
        }
        return res;
    }

    function generate() {
        const safeCount = Math.min(Math.max(1, count), 100);
        const list: string[] = [];
        for (let i = 0; i < safeCount; i++) {
            const raw = version === "v7" ? generateUUIDv7() : generateUUIDv4();
            list.push(formatUUID(raw));
        }
        uuids = list;
    }

    $effect(() => {
        if (version || count || uppercase !== undefined || removeHyphens !== undefined || wrapInBraces !== undefined || wrapInQuotes !== undefined) {
            generate();
        }
    });

    function copySingle(val: string, index: number) {
        copyToClipboard(val, "UUID");
        copiedIndex = index;
        toastStore.success("已复制 UUID");
        setTimeout(() => {
            if (copiedIndex === index) copiedIndex = null;
        }, 1500);
    }

    function copyAll() {
        if (uuids.length === 0) return;
        copyToClipboard(uuids.join("\n"), "所有 UUID");
        toastStore.success(`已复制 ${uuids.length} 个 UUID`);
    }

    function downloadAsText() {
        if (uuids.length === 0) return;
        const blob = new Blob([uuids.join("\n")], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `uuids-${version}-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        toastStore.success("已导出为文本文件");
    }
</script>

<div class="h-full flex flex-col gap-2.5 min-h-0">
    <!-- Top Command Toolbar -->
    <div class="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-2xs">
        <div class="flex items-center gap-2">
            <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
                <Key size={13} class="text-sky-500" />
                UUID 唯一标识符生成器
            </span>
            <div class="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[11px]">
                <button
                    type="button"
                    class="px-2.5 py-1 rounded font-medium transition cursor-pointer {version === 'v4' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                    onclick={() => (version = "v4")}
                >
                    UUID v4 (标准随机)
                </button>
                <button
                    type="button"
                    class="px-2.5 py-1 rounded font-medium transition cursor-pointer {version === 'v7' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                    onclick={() => (version = "v7")}
                >
                    UUID v7 (时间有序)
                </button>
            </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
            <button
                type="button"
                class="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer shadow-2xs font-medium"
                onclick={copyAll}
                title="复制所有 UUID"
            >
                <Copy size={12} />
                <span>复制全部</span>
            </button>
            <button
                type="button"
                class="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer shadow-2xs font-medium"
                onclick={downloadAsText}
                title="导出为文本文件"
            >
                <Download size={12} />
                <span>导出</span>
            </button>
            <button
                type="button"
                class="px-2.5 py-1 text-xs rounded-md bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 transition flex items-center gap-1 cursor-pointer shadow-2xs font-semibold"
                onclick={generate}
                title="重新生成"
            >
                <RefreshCw size={12} />
                <span>重新生成</span>
            </button>
        </div>
    </div>

    <!-- Dual Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        <!-- Left: Options & Formatting (5 cols) -->
        <div class="lg:col-span-5 flex flex-col gap-2.5 min-h-0">
            <div class="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3.5 shadow-2xs shrink-0">
                <!-- Quantity Slider -->
                <div class="space-y-1.5">
                    <div class="flex justify-between items-center text-xs">
                        <label for="uuid-cnt-slider" class="font-bold text-slate-700 dark:text-slate-300">生成数量</label>
                        <span class="font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200/60 dark:border-sky-800/60 tabular-nums">
                            {count} 个
                        </span>
                    </div>
                    <input
                        id="uuid-cnt-slider"
                        type="range"
                        min="1"
                        max="50"
                        bind:value={count}
                        class="w-full accent-sky-600 cursor-pointer"
                    />
                    <div class="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>1</span>
                        <span>10</span>
                        <span>25</span>
                        <span>50</span>
                    </div>
                </div>

                <!-- Format Options -->
                <div class="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">输出格式修饰</span>

                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <label class="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer select-none">
                            <input type="checkbox" bind:checked={uppercase} class="rounded text-sky-600 focus:ring-0" />
                            <span class="font-medium text-slate-700 dark:text-slate-300">大写字母 (A-F)</span>
                        </label>

                        <label class="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer select-none">
                            <input type="checkbox" bind:checked={removeHyphens} class="rounded text-sky-600 focus:ring-0" />
                            <span class="font-medium text-slate-700 dark:text-slate-300">移除连字符 (-)</span>
                        </label>

                        <label class="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer select-none">
                            <input type="checkbox" bind:checked={wrapInBraces} class="rounded text-sky-600 focus:ring-0" />
                            <span class="font-medium text-slate-700 dark:text-slate-300">大括号包覆 {'{...}'}</span>
                        </label>

                        <label class="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer select-none">
                            <input type="checkbox" bind:checked={wrapInQuotes} class="rounded text-sky-600 focus:ring-0" />
                            <span class="font-medium text-slate-700 dark:text-slate-300">双引号包覆 "..."</span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Version Explanation Card -->
            <div class="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <div class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Layers size={13} class="text-sky-500" />
                    {#if version === 'v4'}
                        UUID v4：基于密码学安全伪随机数 (122 bits 熵)，全网碰撞概率趋近于 0。
                    {:else}
                        UUID v7：结合 Unix 毫秒时间戳与高熵随机数，天然支持数据库主键时间索引排序。
                    {/if}
                </div>
            </div>
        </div>

        <!-- Right: Generated UUID List (7 cols) -->
        <div class="lg:col-span-7 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
                <span class="font-bold text-slate-700 dark:text-slate-300">UUID 列表 ({uuids.length})</span>
                <span class="text-[10px] text-slate-400 font-mono">点击每行直接复制</span>
            </div>

            <!-- List -->
            <div class="flex-1 overflow-auto p-3 space-y-1.5 bg-slate-50/40 dark:bg-slate-950/40 min-h-0 custom-scrollbar divide-y divide-slate-100/60 dark:divide-slate-800/40">
                {#each uuids as uuid, i}
                    <div class="pt-1.5 first:pt-0 flex items-center justify-between gap-3 group">
                        <div class="flex items-center gap-2.5 min-w-0 flex-1">
                            <span class="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-mono flex items-center justify-center shrink-0">
                                {i + 1}
                            </span>
                            <span class="font-mono text-xs text-slate-800 dark:text-slate-100 tracking-wider break-all select-all font-medium">
                                {uuid}
                            </span>
                        </div>

                        <button
                            type="button"
                            onclick={() => copySingle(uuid, i)}
                            class="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs font-sans"
                            title="复制该 UUID"
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
            </div>
        </div>
    </div>
</div>
