<script lang="ts">
    import { Panel, Input, Button, CodeBlock, CodeEditor } from "$lib/components/ui";
    import HandoffDropdown from "$lib/components/ui/HandoffDropdown.svelte";
    import {
        Copy,
        AlertCircle,
        CheckCircle2,
        Clock,
        ShieldCheck,
        ShieldAlert,
        Key,
        Sparkles,
        User,
        Calendar,
        Shield,
        Info,
        Check,
        Trash2,
        ArrowRightLeft,
        ExternalLink,
        Layers
    } from "lucide-svelte";
    import { copyToClipboard } from "$lib/utils/clipboard";
    import { toastStore } from "$lib/stores/toastStore.svelte";

    let token = $state("");
    let secretKey = $state("");
    let header = $state<Record<string, any> | null>(null);
    let payload = $state<Record<string, any> | null>(null);
    let signature = $state<string | null>(null);
    let rawParts = $state<{ header: string; payload: string; signature: string }>({
        header: "",
        payload: "",
        signature: ""
    });
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
            name: "管理员权限 Token",
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi0wMDEiLCJyb2xlcyI6WyJzdXBlcmFkbWluIiwic3lzdGVtIl0sImVtYWlsIjoiYWRtaW5AYW9uZS5kZXYiLCJpYXQiOjE2NzI1MzExMTAsImV4cCI6MjA4Mjc4ODAwMH0.sample_signature_hash_here",
            secret: "admin-secret-key"
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
        rawParts = { header: "", payload: "", signature: "" };
        isSignatureValid = null;

        const trimmed = input.trim();
        if (!trimmed) return;

        try {
            const parts = trimmed.split(".");
            if (parts.length !== 3) {
                throw new Error("JWT 格式无效：必须由三部分组成 (Header.Payload.Signature)");
            }

            rawParts = {
                header: parts[0],
                payload: parts[1],
                signature: parts[2]
            };

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

    function clearAll() {
        token = "";
        secretKey = "";
        isSignatureValid = null;
        toastStore.info("已清空 JWT 与密钥");
    }
</script>

<div class="h-full flex flex-col gap-2.5 min-h-0">
    <!-- Top Command & Presets Bar -->
    <div class="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between shrink-0 text-xs shadow-2xs">
        <div class="flex items-center gap-2 flex-wrap min-w-0">
            <span class="text-slate-400 text-[11px] font-medium shrink-0 flex items-center gap-1">
                <Sparkles size={12} class="text-amber-500" />
                预设样本:
            </span>
            {#each PRESETS as p}
                <button
                    type="button"
                    class="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    onclick={() => { token = p.token; secretKey = p.secret; toastStore.success(`已加载 ${p.name}`); }}
                >
                    {p.name}
                </button>
            {/each}
        </div>

        <div class="flex items-center gap-2 text-xs shrink-0">
            {#if token}
                {#if isValid}
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                        <CheckCircle2 size={12} /> 格式有效
                    </span>
                {:else if error}
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 max-w-[200px] truncate" title={error}>
                        <AlertCircle size={12} /> {error}
                    </span>
                {/if}

                {#if payload}
                    <HandoffDropdown
                        sourceTool="JWT Decoder (Payload)"
                        dataType="json"
                        getData={() => JSON.stringify(payload, null, 2)}
                    />
                {/if}

                <button
                    type="button"
                    class="px-2 py-1 text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition flex items-center gap-1 cursor-pointer"
                    onclick={clearAll}
                    title="清空当前输入"
                >
                    <Trash2 size={12} />
                    <span>清空</span>
                </button>
            {/if}
        </div>
    </div>

    <!-- Dual Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        <!-- Left: Input & Tri-Color Token Analysis (5 cols) -->
        <div class="lg:col-span-5 flex flex-col gap-2.5 min-h-0">
            <div class="flex-1 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-2xs min-h-0">
                <div class="flex justify-between items-center text-xs pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                    <span class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Shield size={13} class="text-sky-500" />
                        Encoded JWT 字符串
                    </span>
                    {#if token}
                        <span class="text-[10px] text-slate-400 font-mono tabular-nums">{token.length} 字符</span>
                    {/if}
                </div>

                <div class="flex-1 relative min-h-[140px] border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden bg-white dark:bg-[#0A0A0A]">
                    <CodeEditor
                        bind:value={token}
                        placeholder="在此粘贴 JWT Token (形如 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
                    />
                </div>

                <!-- Tri-Part Token Preview Badges -->
                {#if isValid && rawParts.header}
                    <div class="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] font-mono">
                        <div class="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider">三段结构分解:</div>
                        <div class="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 break-all leading-relaxed select-all">
                            <span class="text-rose-600 dark:text-rose-400 font-bold" title="Header (标头)">{rawParts.header}</span>
                            <span class="text-slate-400 font-bold">.</span>
                            <span class="text-sky-600 dark:text-sky-400 font-bold" title="Payload (负载)">{rawParts.payload}</span>
                            <span class="text-slate-400 font-bold">.</span>
                            <span class="text-emerald-600 dark:text-emerald-400 font-bold" title="Signature (签名)">{rawParts.signature}</span>
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Signature Verification Panel -->
            <div class="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 shadow-2xs shrink-0">
                <div class="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span class="flex items-center gap-1.5">
                        <Key size={13} class="text-amber-500" />
                        HMAC-SHA256 签名校验
                    </span>
                    {#if isSignatureValid === true}
                        <span class="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                            <ShieldCheck size={13} /> 签名有效
                        </span>
                    {:else if isSignatureValid === false}
                        <span class="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                            <ShieldAlert size={13} /> 签名不匹配
                        </span>
                    {/if}
                </div>
                <div class="flex items-center gap-2">
                    <input
                        type="text"
                        bind:value={secretKey}
                        placeholder="输入 Secret 密钥 (HS256 校验)"
                        class="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                    />
                    <button
                        type="button"
                        onclick={verifySignature}
                        disabled={!token || !secretKey || isVerifying}
                        class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 rounded-md text-xs font-semibold transition shrink-0 cursor-pointer shadow-2xs"
                    >
                        {isVerifying ? "计算中..." : "校验签名"}
                    </button>
                </div>
            </div>
        </div>

        <!-- Right: Decoded Inspector & Claims (7 cols) -->
        <div class="lg:col-span-7 flex flex-col border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs min-h-0">
            <!-- Inspector Tabs Bar -->
            <div class="h-9 px-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
                <div class="flex items-center gap-1">
                    <button
                        type="button"
                        class="px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer {activeInspectorTab === 'claims' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                        onclick={() => activeInspectorTab = 'claims'}
                    >
                        标准声明 (Claims)
                    </button>
                    <button
                        type="button"
                        class="px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer {activeInspectorTab === 'payload' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                        onclick={() => activeInspectorTab = 'payload'}
                    >
                        Payload JSON
                    </button>
                    <button
                        type="button"
                        class="px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer {activeInspectorTab === 'header' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}"
                        onclick={() => activeInspectorTab = 'header'}
                    >
                        Header JSON
                    </button>
                </div>

                {#if payload}
                    <button
                        type="button"
                        onclick={() => copyToClipboard(JSON.stringify(payload, null, 2), "Payload")}
                        class="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                        <Copy size={11} /> 复制 Payload
                    </button>
                {/if}
            </div>

            <!-- Content Area -->
            <div class="flex-1 overflow-auto p-3.5 font-mono text-xs bg-slate-50/40 dark:bg-slate-950/40 min-h-0 custom-scrollbar">
                {#if payload && payload.exp}
                    {@const expInfo = formatTimestamp(payload.exp)}
                    <div class="p-2.5 mb-3 rounded-lg border {expInfo.isExpired ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60' : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'} text-xs flex items-center justify-between shrink-0 font-sans">
                        <div class="flex items-center gap-2">
                            <Clock size={14} class={expInfo.isExpired ? "text-rose-500" : "text-emerald-500"} />
                            <span class="font-bold {expInfo.isExpired ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}">
                                {expInfo.isExpired ? "Token 已过期" : "Token 尚在有效期内"}
                            </span>
                        </div>
                        <span class="font-mono text-slate-600 dark:text-slate-300 text-[11px] font-medium">{expInfo.text}</span>
                    </div>
                {/if}

                {#if activeInspectorTab === "claims"}
                    {#if standardClaims.length > 0}
                        <div class="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                            <table class="w-full text-left text-xs border-collapse font-mono">
                                <thead>
                                    <tr class="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-sans text-[11px]">
                                        <th class="py-2 px-3 font-semibold w-28">声明字段</th>
                                        <th class="py-2 px-3 font-semibold w-44">语义说明</th>
                                        <th class="py-2 px-3 font-semibold">实际值</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                                    {#each standardClaims as c}
                                        <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            <td class="py-2 px-3 text-sky-600 dark:text-sky-400 font-bold">{c.key}</td>
                                            <td class="py-2 px-3 font-sans text-slate-600 dark:text-slate-400 text-[11px]">{c.name}</td>
                                            <td class="py-2 px-3 text-slate-900 dark:text-slate-100 font-mono text-[11px]">
                                                {c.formatted ? c.formatted : typeof c.value === 'object' ? JSON.stringify(c.value) : String(c.value)}
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    {:else}
                        <div class="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic font-sans py-12 gap-2">
                            <Shield size={24} class="text-slate-300 dark:text-slate-700" />
                            <span>在左侧粘贴 JWT 字符串或点击顶部预设示例以开始解析</span>
                        </div>
                    {/if}

                {:else if activeInspectorTab === "payload"}
                    <CodeBlock
                        code={formatJson(payload) || "{}"}
                        language="json"
                        showHeader={false}
                        wrapLines={true}
                        class="!my-0"
                    />

                {:else if activeInspectorTab === "header"}
                    <CodeBlock
                        code={formatJson(header) || "{}"}
                        language="json"
                        showHeader={false}
                        wrapLines={true}
                        class="!my-0"
                    />
                {/if}
            </div>
        </div>
    </div>
</div>
