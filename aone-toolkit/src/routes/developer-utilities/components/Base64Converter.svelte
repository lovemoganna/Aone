<script lang="ts">
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import { Copy, Trash2, ArrowRightLeft, Check, AlertCircle } from "lucide-svelte";
    import { CodeBlock, CodeEditor } from "$lib/components/ui";

    let input = $state("Hello 世界！Aone Toolkit 2026");
    let mode = $state<"encode" | "decode">("encode");
    let urlSafe = $state(false);

    function utf8ToBase64(str: string, isUrlSafe = false): string {
        const bytes = new TextEncoder().encode(str);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        let base64 = btoa(binary);
        if (isUrlSafe) {
            base64 = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        }
        return base64;
    }

    function base64ToUtf8(str: string): string {
        let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) {
            base64 += "=";
        }
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new TextDecoder("utf-8").decode(bytes);
    }

    let result = $derived.by(() => {
        if (!input) return { text: "", error: null };
        try {
            if (mode === "encode") {
                return { text: utf8ToBase64(input, urlSafe), error: null };
            } else {
                return { text: base64ToUtf8(input), error: null };
            }
        } catch (e: any) {
            return { text: "", error: "Base64 解码失败：输入包含非法字符或非标准格式" };
        }
    });

    function swapInputOutput() {
        if (result.text && !result.error) {
            input = result.text;
            mode = mode === "encode" ? "decode" : "encode";
            toastStore.success("已切换模式并置入结果");
        }
    }

    function copyResult() {
        if (!result.text) return;
        copyToClipboard(result.text, "Base64 结果");
        toastStore.success("已复制到剪贴板");
    }
</script>

<div class="h-full flex flex-col gap-2.5 min-h-0">
    <!-- Top Toolbar -->
    <div class="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-2xs">
        <div class="flex items-center gap-2">
            <span class="font-bold text-slate-800 dark:text-slate-200">Base64 转换器</span>
            <div class="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px]">
                <button
                    type="button"
                    class="px-2.5 py-0.5 rounded font-medium transition cursor-pointer {mode === 'encode' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                    onclick={() => mode = "encode"}
                >
                    文本 → Base64 (Encode)
                </button>
                <button
                    type="button"
                    class="px-2.5 py-0.5 rounded font-medium transition cursor-pointer {mode === 'decode' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                    onclick={() => mode = "decode"}
                >
                    Base64 → 文本 (Decode)
                </button>
            </div>
            {#if mode === "encode"}
                <label class="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer select-none ml-2">
                    <input type="checkbox" bind:checked={urlSafe} class="rounded text-sky-600 text-xs" />
                    <span>URL-Safe 模式 (- / _)</span>
                </label>
            {/if}
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
            <button
                type="button"
                class="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer shadow-2xs"
                onclick={swapInputOutput}
                title="将输出作为输入并反转模式"
            >
                <ArrowRightLeft size={12} /> 翻转输入输出
            </button>
            <button
                type="button"
                class="p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                onclick={() => input = ""}
                title="清空"
            >
                <Trash2 size={13} />
            </button>
        </div>
    </div>

    <!-- 2-Column Split Workspace -->
    <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 min-h-0">
        <!-- Input -->
        <div class="flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs min-h-0">
            <div class="h-8 px-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                <span>{mode === "encode" ? "输入源文本 (UTF-8)" : "输入 Base64 编码字符串"}</span>
                <span class="text-[10px] text-slate-400 font-mono">{input.length} 字符</span>
            </div>
            <div class="flex-1 relative min-h-0 bg-white dark:bg-[#0A0A0A]">
                <CodeEditor
                    bind:value={input}
                    placeholder={mode === "encode" ? "在此输入或粘贴需要编码为 Base64 的文本..." : "在此输入 Base64 字符串..."}
                />
            </div>
        </div>

        <!-- Output -->
        <div class="flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs min-h-0">
            <div class="h-8 px-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                <span>{mode === "encode" ? "Base64 输出结果" : "解码文本输出"}</span>
                <button
                    onclick={copyResult}
                    disabled={!result.text}
                    class="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:underline flex items-center gap-1 disabled:opacity-40"
                >
                    <Copy size={10} /> 复制输出
                </button>
            </div>
            <div class="flex-1 p-2.5 overflow-auto font-mono text-xs bg-slate-50/30 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 min-h-0">
                {#if result.error}
                    <div class="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                        <AlertCircle size={14} class="shrink-0" />
                        <span>{result.error}</span>
                    </div>
                {:else if result.text}
                    <CodeBlock
                        code={result.text}
                        language="plaintext"
                        showHeader={false}
                        wrapLines={true}
                        class="!my-0 flex-1 border-0"
                    />
                {:else}
                    <div class="h-full flex items-center justify-center text-slate-400 text-xs italic">
                        在左侧输入以生成结果
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
