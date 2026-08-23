<script lang="ts">
    import { Panel, Input, Button } from "$lib/components/ui";
    import { Copy, AlertCircle, CheckCircle, Clock, ShieldCheck, ShieldAlert, Key, Sparkles, User, Calendar, Shield, Info, Check } from "lucide-svelte";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";

    let token = $state("");
    let secretKey = $state("");
    let header = $state<Record<string, any> | null>(null);
    let payload = $state<Record<string, any> | null>(null);
    let signature = $state<string | null>(null);
    let error = $state<string | null>(null);
    let isSignatureValid = $state<boolean | null>(null);
    let isVerifying = $state(false);
    let activeInspectorTab = $state<"claims" | "payload" | "header">("claims");

    const PRESETS = [
        {
            name: "有效用户 Session (HS256)",
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoyNTI0NjA4MDAwfQ.dmt5F_hHq9P9d1sJ-6x8g5N9I3h6zJ9t7A5-Y3x8w0U",
            secret: "your-256-bit-secret"
        },
        {
            name: "已过期 Token",
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzk5OSIsInJvbGUiOiJ2aWV3ZXIiLCJpYXQiOjE2MDk0NTkyMDAsImV4cCI6MTYwOTQ2MjgwMH0.1A2B3C4D5E6F7G8H9I0J",
            secret: ""
        }
    ];

    let isValid = $derived(header !== null && payload !== null && !error);

    function base64UrlDecode(str: string): string {
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

    function decodeJwt(input: string) {
        error = null;
        header = null;
        payload = null;
        signature = null;
        isSignatureValid = null;

        if (!input.trim()) return;

        try {
            const parts = input.trim().split(".");
            if (parts.length !== 3) {
                throw new Error("JWT 格式无效：必须由三部分组成 (Header.Payload.Signature)");
            }

            const decodePart = (part: string) => {
                try {
                    const jsonStr = base64UrlDecode(part);
                    return JSON.parse(jsonStr);
                } catch {
                    throw new Error("Base64URL 解码失败，可能包含非法字符或不合法的 JSON");
                }
            };

            header = decodePart(parts[0]);
            payload = decodePart(parts[1]);
            signature = parts[2];
        } catch (e: any) {
            error = e.message;
        }
    }

    $effect(() => {
        decodeJwt(token);
    });

    // Verify HS256 (HMAC SHA-256) Signature using Web Crypto API
    async function verifySignature() {
        if (!token || !secretKey || !header) {
            toastStore.warning("请输入 Token 与用于验证的 Secret 密钥");
            return;
        }

        if (header.alg !== "HS256") {
            toastStore.error(`当前仅支持 HS256 本地验签，当前算法为 ${header.alg}`);
            return;
        }

        isVerifying = true;
        try {
            const parts = token.trim().split(".");
            const encoder = new TextEncoder();
            const data = encoder.encode(`${parts[0]}.${parts[1]}`);
            const keyData = encoder.encode(secretKey);

            const cryptoKey = await crypto.subtle.importKey(
                "raw",
                keyData,
                { name: "HMAC", hash: "SHA-256" },
                false,
                ["sign"]
            );

            const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, data);
            const signatureArray = Array.from(new Uint8Array(signatureBuffer));
            const base64Signature = btoa(String.fromCharCode.apply(null, signatureArray))
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=+$/, "");

            isSignatureValid = base64Signature === parts[2];
            if (isSignatureValid) {
                toastStore.success("签名验证成功：密钥匹配，数据完整！");
            } else {
                toastStore.error("签名验证失败：密钥错误或 Payload 已被篡改");
            }
        } catch (e: any) {
            toastStore.error("验签计算异常：" + e.message);
            isSignatureValid = false;
        } finally {
            isVerifying = false;
        }
    }

    function formatJson(obj: object | null): string {
        return obj ? JSON.stringify(obj, null, 2) : "";
    }

    function formatTimestamp(unixSeconds?: number): { text: string; isExpired?: boolean; timeAgo?: string } {
        if (!unixSeconds) return { text: "未指定" };
        const date = new Date(unixSeconds * 1000);
        const now = Date.now();
        const diffMs = date.getTime() - now;
        const isExpired = diffMs < 0;

        const absDiffSec = Math.abs(Math.round(diffMs / 1000));
        let timeAgo = "";
        if (absDiffSec < 60) timeAgo = `${absDiffSec} 秒${isExpired ? "前" : "后"}`;
        else if (absDiffSec < 3600) timeAgo = `${Math.floor(absDiffSec / 60)} 分钟${isExpired ? "前" : "后"}`;
        else if (absDiffSec < 86400) timeAgo = `${Math.floor(absDiffSec / 3600)} 小时${isExpired ? "前" : "后"}`;
        else timeAgo = `${Math.floor(absDiffSec / 86400)} 天${isExpired ? "前" : "后"}`;

        return {
            text: `${date.toLocaleString()} (${timeAgo})`,
            isExpired,
            timeAgo
        };
    }

    interface StandardClaim {
        key: string;
        name: string;
        value: any;
        formatted?: string;
    }

    let standardClaims = $derived.by<StandardClaim[]>(() => {
        if (!payload) return [];
        const claims: StandardClaim[] = [];

        const mapping: Record<string, string> = {
            sub: "主体标识 (Subject)",
            iss: "签发机构 (Issuer)",
            aud: "受众范围 (Audience)",
            exp: "过期时间 (Expires At)",
            nbf: "生效时间 (Not Before)",
            iat: "签发时间 (Issued At)",
            jti: "Token 唯一 ID (JWT ID)",
            name: "用户姓名 (Name)",
            email: "电子邮箱 (Email)",
            role: "业务角色 (Role)",
            roles: "角色列表 (Roles)",
            scope: "权限作用域 (Scope)"
        };

        for (const [k, v] of Object.entries(payload)) {
            let formatted: string | undefined;
            if (["exp", "iat", "nbf"].includes(k) && typeof v === "number") {
                formatted = formatTimestamp(v).text;
            }
            claims.push({
                key: k,
                name: mapping[k] || k,
                value: v,
                formatted
            });
        }
        return claims;
    });
</script>

<div class="h-full flex flex-col gap-2 min-h-0">
    <!-- Presets command bar -->
    <div class="h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-xs">
        <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-slate-400 text-[11px] font-medium">快捷示例:</span>
            {#each PRESETS as p}
                <button
                    type="button"
                    class="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                    onclick={() => { token = p.token; secretKey = p.secret; }}
                >
                    {p.name}
                </button>
            {/each}
        </div>

        {#if token}
            <div class="flex items-center gap-2 text-xs">
                {#if isValid}
                    <span class="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                        <CheckCircle size={12} /> 格式合法
                    </span>
                {:else if error}
                    <span class="text-rose-500 font-semibold flex items-center gap-1 text-[11px] max-w-[200px] truncate" title={error}>
                        <AlertCircle size={12} /> {error}
                    </span>
                {/if}
                <button
                    class="px-2 py-0.5 text-xs text-slate-400 hover:text-rose-600 rounded transition"
                    onclick={() => { token = ""; secretKey = ""; isSignatureValid = null; }}
                >
                    清空
                </button>
            </div>
        {/if}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-2 flex-1 min-h-0">
        <!-- Input & Verification Section -->
        <div class="flex flex-col gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 shadow-xs min-h-0">
            <div class="flex justify-between items-center text-xs px-1">
                <span class="font-bold text-slate-800 dark:text-slate-200">Encoded JWT 字符串</span>
                {#if token}
                    <span class="text-[10px] text-slate-400 font-mono">{token.length} 字符</span>
                {/if}
            </div>

            <textarea
                bind:value={token}
                class="flex-1 w-full p-2.5 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded resize-none focus:outline-none focus:ring-1 focus:ring-slate-400 dark:text-slate-200 leading-relaxed"
                placeholder="在此粘贴 JWT Token (形如 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
                spellcheck="false"
            ></textarea>

            <!-- Signature Verification Panel -->
            <div class="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded space-y-1.5 shrink-0">
                <div class="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span class="flex items-center gap-1.5"><Key size={12} class="text-slate-500" /> HMAC-SHA256 本地验签</span>
                    {#if isSignatureValid === true}
                        <span class="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                            <ShieldCheck size={12} /> 签名有效
                        </span>
                    {:else if isSignatureValid === false}
                        <span class="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                            <ShieldAlert size={12} /> 签名无效
                        </span>
                    {/if}
                </div>
                <div class="flex items-center gap-1.5">
                    <input
                        type="text"
                        bind:value={secretKey}
                        placeholder="输入 Secret 密钥 (用于校验 HMAC-SHA256 签名)"
                        class="flex-1 px-2.5 py-1 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-1 focus:ring-slate-400"
                    />
                    <button
                        type="button"
                        onclick={verifySignature}
                        disabled={!token || !secretKey || isVerifying}
                        class="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 rounded text-xs font-semibold transition shrink-0"
                    >
                        {isVerifying ? "计算中..." : "校验签名"}
                    </button>
                </div>
            </div>
        </div>

        <!-- Decoded Claims & Payload Section -->
        <div class="flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-xs min-h-0">
            <!-- Inspector Tabs -->
            <div class="h-8 px-2 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
                <div class="flex items-center gap-1">
                    <button
                        type="button"
                        class="px-2.5 py-0.5 rounded text-[11px] font-medium {activeInspectorTab === 'claims' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                        onclick={() => activeInspectorTab = 'claims'}
                    >
                        标准声明 (Claims)
                    </button>
                    <button
                        type="button"
                        class="px-2.5 py-0.5 rounded text-[11px] font-medium {activeInspectorTab === 'payload' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                        onclick={() => activeInspectorTab = 'payload'}
                    >
                        Payload JSON
                    </button>
                    <button
                        type="button"
                        class="px-2.5 py-0.5 rounded text-[11px] font-medium {activeInspectorTab === 'header' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                        onclick={() => activeInspectorTab = 'header'}
                    >
                        Header JSON
                    </button>
                </div>

                {#if payload}
                    <button
                        onclick={() => copyToClipboard(JSON.stringify(payload, null, 2), "Payload")}
                        class="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 text-[11px]"
                    >
                        <Copy size={11} /> 复制
                    </button>
                {/if}
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-auto p-3 font-mono text-xs bg-slate-50/30 dark:bg-slate-950/40 min-h-0">
                {#if payload && payload.exp}
                    {@const expInfo = formatTimestamp(payload.exp)}
                    <div class="p-2.5 mb-2.5 rounded-lg border {expInfo.isExpired ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50' : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'} text-xs flex items-center justify-between shrink-0 font-sans">
                        <div class="flex items-center gap-1.5">
                            <Clock size={14} class={expInfo.isExpired ? "text-rose-500" : "text-emerald-500"} />
                            <span class="font-bold {expInfo.isExpired ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}">
                                {expInfo.isExpired ? "Token 已过期" : "Token 尚在有效期内"}
                            </span>
                        </div>
                        <span class="font-mono text-slate-600 dark:text-slate-300 text-[10px]">{expInfo.text}</span>
                    </div>
                {/if}

                {#if activeInspectorTab === "claims"}
                    {#if standardClaims.length > 0}
                        <div class="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
                            <table class="w-full text-left text-xs border-collapse font-mono">
                                <thead>
                                    <tr class="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-sans">
                                        <th class="p-2 font-semibold">声明字段</th>
                                        <th class="p-2 font-semibold">语义说明</th>
                                        <th class="p-2 font-semibold">实际值</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                                    {#each standardClaims as c}
                                        <tr class="hover:bg-slate-50 dark:hover:bg-slate-950">
                                            <td class="p-2 text-slate-900 dark:text-white font-bold">{c.key}</td>
                                            <td class="p-2 font-sans text-slate-600 dark:text-slate-300">{c.name}</td>
                                            <td class="p-2 text-slate-800 dark:text-slate-200">
                                                {c.formatted ? c.formatted : typeof c.value === 'object' ? JSON.stringify(c.value) : String(c.value)}
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    {:else}
                        <div class="h-full flex items-center justify-center text-slate-400 text-xs italic font-sans">
                            请输入有效的 JWT 字符串
                        </div>
                    {/if}

                {:else if activeInspectorTab === "payload"}
                    <pre class="leading-relaxed text-slate-700 dark:text-slate-300">{formatJson(payload) || "无 Payload 数据"}</pre>

                {:else if activeInspectorTab === "header"}
                    <pre class="leading-relaxed text-rose-600 dark:text-rose-400">{formatJson(header) || "无 Header 数据"}</pre>
                {/if}
            </div>
        </div>
    </div>
</div>
