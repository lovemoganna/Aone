<script lang="ts">
    import { Button, CodeEditor } from "$lib/components/ui";
    import { Copy, FileUp, CheckCircle2, XCircle, RefreshCw, Sparkles, Hash, Check, Trash2, ShieldCheck, ArrowRightLeft } from "lucide-svelte";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";

    // Lightweight pure-JS MD5 implementation for standard developer utility
    function md5(str: string): string {
        function safeAdd(x: number, y: number) {
            const lsw = (x & 0xffff) + (y & 0xffff);
            const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
            return (msw << 16) | (lsw & 0xffff);
        }
        function bitRotateLeft(num: number, cnt: number) {
            return (num << cnt) | (num >>> (32 - cnt));
        }
        function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
            return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
        }
        function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
            return md5cmn((b & c) | (~b & d), a, b, x, s, t);
        }
        function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
            return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
        }
        function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
            return md5cmn(b ^ c ^ d, a, b, x, s, t);
        }
        function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
            return md5cmn(c ^ (b | ~d), a, b, x, s, t);
        }
        function binlMD5(x: number[], len: number) {
            x[len >> 5] |= 0x80 << (len % 32);
            x[(((len + 64) >>> 9) << 4) + 14] = len;
            let a = 1732584193;
            let b = -271733879;
            let c = -1732584194;
            let d = 271733878;

            for (let i = 0; i < x.length; i += 16) {
                const olda = a;
                const oldb = b;
                const oldc = c;
                const oldd = d;

                a = md5ff(a, b, c, d, x[i], 7, -680876936);
                d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
                c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
                b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
                a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
                d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
                c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
                b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
                a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
                d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
                c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
                b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
                a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
                d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
                c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
                b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);

                a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
                d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
                c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
                b = md5gg(b, c, d, a, x[i], 20, -373897302);
                a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
                d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
                c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
                b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
                a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
                d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
                c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
                b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
                a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
                d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
                c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
                b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);

                a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
                d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
                c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
                b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
                a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
                d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
                c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
                b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
                a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
                d = md5hh(d, a, b, c, x[i], 11, -358537222);
                c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
                b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
                a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
                d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
                c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
                b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);

                a = md5ii(a, b, c, d, x[i], 6, -198630844);
                d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
                c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
                b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
                a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
                d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
                c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
                b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
                a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
                d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
                c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
                b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
                a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
                d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
                c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
                b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);

                a = safeAdd(a, olda);
                b = safeAdd(b, oldb);
                c = safeAdd(c, oldc);
                d = safeAdd(d, oldd);
            }
            return [a, b, c, d];
        }
        function rstr2binl(input: string) {
            const output: number[] = [];
            for (let i = 0; i < input.length * 8; i += 8) {
                output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << (i % 32);
            }
            return output;
        }
        function binl2hex(binarray: number[]) {
            const hexTab = "0123456789abcdef";
            let str = "";
            for (let i = 0; i < binarray.length * 4; i++) {
                str += hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0x0f) +
                       hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0x0f);
            }
            return str;
        }
        const utf8 = unescape(encodeURIComponent(str));
        return binl2hex(binlMD5(rstr2binl(utf8), utf8.length * 8));
    }

    // Web Crypto API for SHA Suite
    async function computeHash(
        source: string | File,
        algo: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512",
    ) {
        if (!source) return "";
        let buffer: BufferSource;

        if (source instanceof File) {
            buffer = await source.arrayBuffer();
        } else {
            buffer = new TextEncoder().encode(source);
        }

        const hashBuffer = await crypto.subtle.digest(algo, buffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    }

    let inputMode = $state<"text" | "file">("text");
    let inputText = $state("Hello Aone Toolkit 2026");
    let inputFile = $state<File | null>(null);
    let isUppercase = $state(false);
    let compareHash = $state("");
    let isCalculating = $state(false);
    let isDragging = $state(false);

    let hashes = $state<Record<string, string>>({
        "MD5": "",
        "SHA-1": "",
        "SHA-256": "",
        "SHA-384": "",
        "SHA-512": "",
    });

    async function calculate() {
        isCalculating = true;
        const source = inputMode === "text" ? inputText : inputFile;

        if (!source) {
            hashes = { "MD5": "", "SHA-1": "", "SHA-256": "", "SHA-384": "", "SHA-512": "" };
            isCalculating = false;
            return;
        }

        try {
            let md5Val = "";
            if (typeof source === "string") {
                md5Val = md5(source);
            } else {
                const text = await source.text();
                md5Val = md5(text);
            }

            const [h1, h256, h384, h512] = await Promise.all([
                computeHash(source, "SHA-1"),
                computeHash(source, "SHA-256"),
                computeHash(source, "SHA-384"),
                computeHash(source, "SHA-512"),
            ]);

            hashes = {
                "MD5": md5Val,
                "SHA-1": h1,
                "SHA-256": h256,
                "SHA-384": h384,
                "SHA-512": h512,
            };
        } catch (e) {
            console.error("Hash calculation failed", e);
        } finally {
            isCalculating = false;
        }
    }

    $effect(() => {
        if (inputMode === "text") calculate();
    });

    function handleFileSelect(e: Event) {
        const files = (e.target as HTMLInputElement).files;
        if (files && files[0]) {
            inputFile = files[0];
            calculate();
        }
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        isDragging = false;
        const files = e.dataTransfer?.files;
        if (files && files[0]) {
            inputFile = files[0];
            inputMode = "file";
            calculate();
        }
    }

    function formatDisplayHash(hash: string): string {
        if (!hash) return "";
        return isUppercase ? hash.toUpperCase() : hash.toLowerCase();
    }

    function copyHash(algo: string, text: string) {
        if (!text) return;
        const formatted = formatDisplayHash(text);
        copyToClipboard(formatted, `${algo} 哈希值`);
        toastStore.success(`已复制 ${algo}`);
    }

    function copyAllHashes() {
        const lines = Object.entries(hashes)
            .map(([algo, h]) => `${algo}: ${formatDisplayHash(h)}`)
            .join("\n");
        copyToClipboard(lines, "所有哈希结果");
        toastStore.success("已复制所有算法哈希值");
    }

    function clearAll() {
        inputText = "";
        inputFile = null;
        compareHash = "";
        hashes = { "MD5": "", "SHA-1": "", "SHA-256": "", "SHA-384": "", "SHA-512": "" };
        toastStore.info("已清空输入");
    }
</script>

<div class="h-full flex flex-col gap-2.5 min-h-0">
    <!-- Top Command Toolbar -->
    <div class="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-2xs">
        <div class="flex items-center gap-2">
            <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Hash size={13} class="text-indigo-500" />
                哈希校验器
            </span>
            <div class="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[11px]">
                <button
                    type="button"
                    class="px-2.5 py-1 rounded-md font-medium transition cursor-pointer {inputMode === 'text' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                    onclick={() => (inputMode = "text")}
                >
                    文本计算
                </button>
                <button
                    type="button"
                    class="px-2.5 py-1 rounded-md font-medium transition cursor-pointer {inputMode === 'file' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                    onclick={() => (inputMode = "file")}
                >
                    文件计算
                </button>
            </div>
            <label class="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer select-none ml-2">
                <input type="checkbox" bind:checked={isUppercase} class="rounded text-indigo-600 focus:ring-0 text-xs" />
                <span>大写字母</span>
            </label>
        </div>

        <div class="flex items-center gap-1.5">
            <button
                type="button"
                class="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition flex items-center gap-1 cursor-pointer shadow-2xs font-medium"
                onclick={copyAllHashes}
                title="复制所有算法计算结果"
            >
                <Copy size={12} />
                <span>复制全部</span>
            </button>
            <button
                type="button"
                class="px-2 py-1 text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition flex items-center gap-1 cursor-pointer"
                onclick={clearAll}
                title="清空内容"
            >
                <Trash2 size={12} />
                <span>清空</span>
            </button>
        </div>
    </div>

    <!-- Main Content Dual Pane -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        <!-- Left: Input & Live Verifier (5 cols) -->
        <div class="lg:col-span-5 flex flex-col gap-2.5 min-h-0">
            <!-- Input Area -->
            <div class="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-2xs min-h-0">
                <div class="flex justify-between items-center text-xs pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                    <span class="font-bold text-slate-800 dark:text-slate-200">
                        {inputMode === 'text' ? '待计算源文本' : '待计算本地文件'}
                    </span>
                    {#if inputMode === 'text' && inputText}
                        <span class="text-[10px] text-slate-400 font-mono">{inputText.length} 字符 · {new TextEncoder().encode(inputText).length} 字节</span>
                    {:else if inputMode === 'file' && inputFile}
                        <span class="text-[10px] text-slate-400 font-mono">{(inputFile.size / 1024).toFixed(2)} KB</span>
                    {/if}
                </div>

                {#if inputMode === "text"}
                    <div class="flex-1 relative min-h-[140px] border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden bg-white dark:bg-[#0A0A0A]">
                        <CodeEditor
                            bind:value={inputText}
                            placeholder="在此输入或粘贴需要计算哈希的文本内容..."
                        />
                    </div>
                {:else}
                    <label
                        class="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all min-h-[160px] {isDragging ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-900'}"
                        ondragover={(e) => { e.preventDefault(); isDragging = true; }}
                        ondragleave={() => (isDragging = false)}
                        ondrop={handleDrop}
                    >
                        {#if inputFile}
                            <div class="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-2 border border-indigo-200 dark:border-indigo-800">
                                <FileUp size={18} />
                            </div>
                            <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs">{inputFile.name}</p>
                            <p class="text-[11px] text-slate-400 mt-0.5">{(inputFile.size / 1024).toFixed(2)} KB · 点击重新选择</p>
                        {:else}
                            <FileUp size={24} class="mb-2 text-slate-400" />
                            <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">点击上传或将文件拖入此处</p>
                            <p class="text-[11px] text-slate-400 mt-0.5">浏览器本地极速运算，不上传任何服务器</p>
                        {/if}
                        <input type="file" class="hidden" onchange={handleFileSelect} />
                    </label>
                {/if}
            </div>

            <!-- Hash Verification Tool Panel -->
            <div class="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 shadow-2xs shrink-0">
                <div class="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span class="flex items-center gap-1.5">
                        <ShieldCheck size={13} class="text-emerald-500" />
                        哈希对比与校验 (Hash Matching)
                    </span>
                </div>
                <div class="flex items-center gap-2">
                    <input
                        type="text"
                        bind:value={compareHash}
                        placeholder="粘贴第三方提供的待比对哈希值..."
                        class="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    />
                </div>

                {#if compareHash.trim()}
                    {@const cleanCompare = compareHash.trim().toLowerCase()}
                    {@const matchAlgo = Object.entries(hashes).find(([_, h]) => h && h.toLowerCase() === cleanCompare)}
                    {#if matchAlgo}
                        <div class="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-md border border-emerald-200 dark:border-emerald-900/60 text-xs font-semibold">
                            <CheckCircle2 size={14} class="text-emerald-500 shrink-0" />
                            <span>比对完全一致：匹配 {matchAlgo[0]} 校验算法</span>
                        </div>
                    {:else}
                        <div class="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-md border border-rose-200 dark:border-rose-900/60 text-xs font-semibold">
                            <XCircle size={14} class="text-rose-500 shrink-0" />
                            <span>未匹配：该哈希与当前所有算法计算结果均不一致</span>
                        </div>
                    {/if}
                {/if}
            </div>
        </div>

        <!-- Right: Hashes Output Grid (7 cols) -->
        <div class="lg:col-span-7 flex flex-col gap-2.5 min-h-0 overflow-y-auto custom-scrollbar">
            {#each Object.entries(hashes) as [algo, hash]}
                {@const isMatched = compareHash && hash && compareHash.trim().toLowerCase() === hash.toLowerCase()}
                <div class="p-3 bg-white dark:bg-slate-900 border {isMatched ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-slate-200 dark:border-slate-800'} rounded-lg shadow-2xs transition-all">
                    <div class="flex justify-between items-center mb-1.5">
                        <div class="flex items-center gap-2">
                            <span class="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                                {algo}
                            </span>
                            {#if hash}
                                <span class="text-[10px] text-slate-400 font-mono">{hash.length * 4} bits · {hash.length} 字符</span>
                            {/if}
                            {#if isMatched}
                                <span class="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 size={11} /> 匹配命中
                                </span>
                            {/if}
                        </div>

                        <div class="flex items-center gap-1">
                            {#if isCalculating}
                                <span class="text-[10px] text-slate-400 animate-pulse flex items-center gap-1">
                                    <RefreshCw size={10} class="animate-spin" /> 计算中
                                </span>
                            {/if}
                            <button
                                type="button"
                                onclick={() => copyHash(algo, hash)}
                                disabled={!hash}
                                class="px-2 py-0.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition disabled:opacity-30 flex items-center gap-1 cursor-pointer font-sans"
                                title="复制 {algo} 哈希值"
                            >
                                <Copy size={11} />
                                <span class="text-[11px]">复制</span>
                            </button>
                        </div>
                    </div>

                    <div class="font-mono text-xs break-all p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 select-all leading-relaxed">
                        {hash ? formatDisplayHash(hash) : (isCalculating ? "计算中..." : "等待输入内容...")}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>
