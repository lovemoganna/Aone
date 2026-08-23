<script lang="ts">
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";
    import { Copy, Trash2, ArrowRightLeft, Check, AlertCircle, Link } from "lucide-svelte";

    let input = $state("https://api.aone.dev/search?q=全栈开发&tags=svelte5,tailwind&sort=desc");
    let mode = $state<"encode" | "decode">("decode");

    let result = $derived.by(() => {
        if (!input) return { text: "", error: null };
        try {
            if (mode === "encode") {
                return { text: encodeURIComponent(input), error: null };
            } else {
                return { text: decodeURIComponent(input), error: null };
            }
        } catch (e: any) {
            return { text: "", error: "URL 解码失败：包含无效的百分号转义序列" };
        }
    });

    let urlParams = $derived.by(() => {
        try {
            const urlObj = new URL(input.startsWith("http") ? input : `http://localhost/${input.replace(/^\/+/, "")}`);
            const params: { key: string; value: string }[] = [];
            urlObj.searchParams.forEach((value, key) => {
                params.push({ key, value });
            });
            return {
                valid: true,
                origin: urlObj.origin === "http://localhost" && !input.startsWith("http") ? "" : urlObj.origin,
                pathname: urlObj.pathname,
                params
            };
        } catch {
            return { valid: false, origin: "", pathname: "", params: [] };
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
        copyToClipboard(result.text, "URL 结果");
        toastStore.success("已复制到剪贴板");
    }
</script>

<div class="h-full flex flex-col gap-2 min-h-0">
    <!-- Top Toolbar -->
    <div class="h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-xs">
        <div class="flex items-center gap-2">
            <span class="font-bold text-slate-800 dark:text-slate-200">URL 编解码与参数分析</span>
            <div class="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px]">
                <button
                    type="button"
                    class="px-2.5 py-0.5 rounded font-medium transition {mode === 'decode' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                    onclick={() => mode = "decode"}
                >
                    URL 解码 (Decode)
                </button>
                <button
                    type="button"
                    class="px-2.5 py-0.5 rounded font-medium transition {mode === 'encode' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                    onclick={() => mode = "encode"}
                >
                    URL 编码 (Encode)
                </button>
            </div>
        </div>

        <div class="flex items-center gap-1.5">
            <button
                type="button"
                class="px-2 py-1 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1"
                onclick={swapInputOutput}
                title="将输出作为输入并反转模式"
            >
                <ArrowRightLeft size={12} /> 翻转
            </button>
            <button
                type="button"
                class="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 transition"
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
                <span>{mode === "encode" ? "输入源文本 / 原始 URL" : "输入含有 % 转义的 URL"}</span>
                <span class="text-[10px] text-slate-400 font-mono">{input.length} 字符</span>
            </div>
            <textarea
                bind:value={input}
                class="flex-1 w-full p-2.5 font-mono text-xs bg-transparent resize-none focus:outline-none dark:text-slate-200 leading-relaxed"
                placeholder="在此粘贴 URL 或文本..."
                spellcheck="false"
            ></textarea>
        </div>

        <!-- Output & Query Parameters Breakdown -->
        <div class="flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs min-h-0">
            <div class="h-8 px-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                <span>{mode === "encode" ? "编码后 URL" : "解码后 URL"}</span>
                <button
                    onclick={copyResult}
                    disabled={!result.text}
                    class="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:underline flex items-center gap-1 disabled:opacity-40"
                >
                    <Copy size={10} /> 复制输出
                </button>
            </div>
            <div class="flex-1 p-2.5 flex flex-col gap-2 overflow-auto font-mono text-xs bg-slate-50/30 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 min-h-0">
                {#if result.error}
                    <div class="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                        <AlertCircle size={14} class="shrink-0" />
                        <span>{result.error}</span>
                    </div>
                {:else if result.text}
                    <div class="p-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs break-all select-all">
                        {result.text}
                    </div>

                    {#if urlParams.params.length > 0}
                        <div class="border border-slate-200 dark:border-slate-800 rounded overflow-hidden mt-1 font-sans">
                            <div class="p-1.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                <Link size={12} class="text-slate-500" /> 查询参数解析 (Query Parameters - {urlParams.params.length})
                            </div>
                            <table class="w-full text-left text-xs border-collapse font-mono">
                                <thead>
                                    <tr class="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-sans text-[11px]">
                                        <th class="p-1.5 font-semibold">Key 参数名</th>
                                        <th class="p-1.5 font-semibold">Value 参数值</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60 text-[11px]">
                                    {#each urlParams.params as p}
                                        <tr class="hover:bg-slate-50 dark:hover:bg-slate-950">
                                            <td class="p-1.5 text-slate-900 dark:text-white font-bold">{p.key}</td>
                                            <td class="p-1.5 text-slate-800 dark:text-slate-200 break-all">{p.value}</td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    {/if}
                {:else}
                    <div class="h-full flex items-center justify-center text-slate-400 text-xs italic">
                        在左侧输入以生成结果
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
