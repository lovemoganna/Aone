<script lang="ts">
    import { Button, CodeBlock, CodeEditor } from "$lib/components/ui";
    import { Copy, AlertCircle, Sparkles, Shield, Key, Check, Trash2, CheckCircle2 } from "lucide-svelte";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";

    let message = $state("The quick brown fox jumps over the lazy dog");
    let secret = $state("secret-key-12345");
    let algo = $state<"SHA-256" | "SHA-512" | "SHA-384" | "SHA-1">("SHA-256");
    let outputFormat = $state<"hex" | "base64">("hex");
    let output = $state("");
    let error = $state<string | null>(null);
    let isCalculating = $state(false);

    const PRESETS = [
        {
            name: "Webhook Payload 签名",
            msg: '{"event":"payment_success","amount":99.00,"currency":"USD"}',
            secret: "whsec_live_9a8b7c6d5e4f3a2b1c",
            algo: "SHA-256" as const
        },
        {
            name: "标准 API 请求验签",
            msg: "GET\n/v1/orders\n2026-08-26T12:00:00Z",
            secret: "api_secret_key_888",
            algo: "SHA-256" as const
        }
    ];

    async function generateHMAC() {
        error = null;
        if (!message || !secret) {
            output = "";
            return;
        }

        isCalculating = true;
        try {
            const encoder = new TextEncoder();
            const keyData = encoder.encode(secret);
            const msgData = encoder.encode(message);

            const cryptoKey = await crypto.subtle.importKey(
                "raw",
                keyData,
                { name: "HMAC", hash: algo },
                false,
                ["sign"],
            );

            const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
            const bytes = new Uint8Array(signature);

            if (outputFormat === "hex") {
                output = Array.from(bytes)
                    .map((b) => b.toString(16).padStart(2, "0"))
                    .join("");
            } else {
                let binary = "";
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                output = btoa(binary);
            }
        } catch (e: any) {
            error = e.message;
            output = "";
        } finally {
            isCalculating = false;
        }
    }

    $effect(() => {
        if (message || secret || algo || outputFormat) {
            generateHMAC();
        }
    });

    function handleCopy() {
        if (!output) return;
        copyToClipboard(output, "HMAC 签名");
        toastStore.success(`已复制 ${algo} 签名 (${outputFormat.toUpperCase()})`);
    }

    function clearAll() {
        message = "";
        secret = "";
        output = "";
        toastStore.info("已清空输入与密钥");
    }
</script>

<div class="h-full flex flex-col gap-2.5 min-h-0">
    <!-- Top Command Toolbar -->
    <div class="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-2xs">
        <div class="flex items-center gap-2 flex-wrap min-w-0">
            <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shrink-0">
                <Shield size={13} class="text-sky-500" />
                HMAC 消息签名
            </span>
            <span class="text-slate-300 dark:text-slate-700">|</span>
            <span class="text-slate-400 text-[11px] font-medium shrink-0 flex items-center gap-1">
                <Sparkles size={11} class="text-amber-500" /> 预设:
            </span>
            {#each PRESETS as p}
                <button
                    type="button"
                    class="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    onclick={() => { message = p.msg; secret = p.secret; algo = p.algo; toastStore.success(`已加载 ${p.name}`); }}
                >
                    {p.name}
                </button>
            {/each}
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
            {#if output}
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                    <CheckCircle2 size={11} /> 签名生成成功
                </span>
            {/if}
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

    <!-- Dual Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        <!-- Left: Input & Secret Configuration (5 cols) -->
        <div class="lg:col-span-5 flex flex-col gap-2.5 min-h-0">
            <!-- Message Input Area -->
            <div class="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-2xs min-h-0">
                <div class="flex justify-between items-center text-xs pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                    <span class="font-bold text-slate-800 dark:text-slate-200">待签名消息 (Payload / Message)</span>
                    {#if message}
                        <span class="text-[10px] text-slate-400 font-mono">{message.length} 字符</span>
                    {/if}
                </div>

                <div class="flex-1 relative min-h-[140px] border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden bg-white dark:bg-[#0A0A0A]">
                    <CodeEditor
                        bind:value={message}
                        language="json"
                        placeholder="在此输入需要签名的消息或 JSON 负载..."
                    />
                </div>
            </div>

            <!-- Algorithm & Secret Config -->
            <div class="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2.5 shadow-2xs shrink-0">
                <div class="space-y-1">
                    <label for="hmac-secret-inp" class="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Key size={12} class="text-amber-500" />
                        签名密钥 (Secret Key)
                    </label>
                    <input
                        id="hmac-secret-inp"
                        type="text"
                        bind:value={secret}
                        placeholder="输入签名密钥字符串..."
                        class="w-full px-2.5 py-1.5 text-xs font-mono rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20"
                    />
                </div>

                <div class="grid grid-cols-2 gap-2">
                    <div class="space-y-1">
                        <label for="hmac-algo-sel" class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">哈希算法</label>
                        <select
                            id="hmac-algo-sel"
                            bind:value={algo}
                            class="w-full px-2.5 py-1.5 text-xs font-mono rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500 cursor-pointer"
                        >
                            <option value="SHA-256">HMAC-SHA256 (推荐)</option>
                            <option value="SHA-512">HMAC-SHA512</option>
                            <option value="SHA-384">HMAC-SHA384</option>
                            <option value="SHA-1">HMAC-SHA1 (旧标准)</option>
                        </select>
                    </div>

                    <div class="space-y-1">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">输出编码</span>
                        <div class="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[11px] h-8 items-center">
                            <button
                                type="button"
                                class="flex-1 py-1 rounded font-medium transition cursor-pointer {outputFormat === 'hex' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                                onclick={() => (outputFormat = "hex")}
                            >
                                HEX (16进制)
                            </button>
                            <button
                                type="button"
                                class="flex-1 py-1 rounded font-medium transition cursor-pointer {outputFormat === 'base64' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                                onclick={() => (outputFormat = "base64")}
                            >
                                Base64
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right: Signature Output & Verification Details (7 cols) -->
        <div class="lg:col-span-7 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-700 dark:text-slate-300">生成的 HMAC 签名结果</span>
                    {#if output}
                        <span class="text-[10px] text-slate-400 font-mono font-medium">({algo} · {outputFormat.toUpperCase()})</span>
                    {/if}
                </div>

                {#if output}
                    <button
                        type="button"
                        onclick={handleCopy}
                        class="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1 text-[11px] font-medium cursor-pointer shadow-2xs"
                    >
                        <Copy size={11} /> 复制签名
                    </button>
                {/if}
            </div>

            <div class="flex-1 overflow-auto p-3.5 font-mono text-xs bg-slate-50/40 dark:bg-slate-950/40 min-h-0 flex flex-col gap-3 custom-scrollbar">
                {#if error}
                    <div class="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-lg text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle size={14} class="text-rose-500 shrink-0" />
                        <span>签名计算失败: {error}</span>
                    </div>
                {/if}

                {#if output}
                    <div class="flex-1 flex flex-col gap-2 min-h-0">
                        <div class="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs font-mono text-xs break-all select-all leading-relaxed text-slate-800 dark:text-slate-200">
                            {output}
                        </div>

                        <!-- Verification Header Tip -->
                        <div class="p-3 rounded-lg bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/50 font-sans text-xs text-slate-600 dark:text-slate-300 space-y-1">
                            <div class="font-bold text-sky-900 dark:text-sky-300 flex items-center gap-1.5 text-[11px]">
                                💡 HTTP Header 常见集成格式:
                            </div>
                            <CodeBlock
                                code={`X-Signature: ${algo.toLowerCase()}=${output}`}
                                language="bash"
                                showHeader={false}
                                wrapLines={true}
                                class="!my-0 border-0"
                            />
                        </div>
                    </div>
                {:else}
                    <div class="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic font-sans py-12 gap-2">
                        <Shield size={24} class="text-slate-300 dark:text-slate-700" />
                        <span>在左侧输入消息与密钥以生成 HMAC 签名</span>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
