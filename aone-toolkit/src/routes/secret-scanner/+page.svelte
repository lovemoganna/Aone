<script lang="ts">
    import { Panel, Button } from "$lib/components/ui";
    import {
        ShieldAlert,
        ShieldCheck,
        Search,
        Trash2,
        Eye,
        EyeOff,
    } from "lucide-svelte";

    let input = $state("");
    let showSecrets = $state(false);

    const PATTERNS = [
        {
            name: "AWS Access Key",
            regex: /AKIA[0-9A-Z]{16}/g,
            severity: "high",
        },
        {
            name: "AWS Secret Key",
            regex: /[0-9a-zA-Z]{40}/g,
            severity: "high",
            manual: true,
        }, // High false positive, usually checked with context
        {
            name: "GitHub Token",
            regex: /gh[pous]_[a-zA-Z0-9]{36,255}/g,
            severity: "high",
        },
        {
            name: "Private Key",
            regex: /-----BEGIN [A-Z ]+ PRIVATE KEY-----/g,
            severity: "critical",
        },
        {
            name: "Google API Key",
            regex: /AIza[0-9A-Za-z-_]{35}/g,
            severity: "medium",
        },
        {
            name: "Slack Webhook",
            regex: /https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[A-Z0-9]+/g,
            severity: "high",
        },
        {
            name: "Stripe API Key",
            regex: /[rk]s_live_[0-9a-zA-Z]{24}/g,
            severity: "critical",
        },
    ];

    let findings = $derived.by(() => {
        if (!input) return [];
        const results: any[] = [];
        PATTERNS.forEach((p) => {
            const matches = input.matchAll(p.regex);
            for (const match of matches) {
                results.push({
                    name: p.name,
                    value: match[0],
                    pos: match.index,
                    severity: p.severity,
                });
            }
        });
        return results;
    });

    function mask(text: string) {
        if (showSecrets) return text;
        return text.substring(0, 4) + "****" + text.substring(text.length - 4);
    }
</script>

<svelte:head>
    <title>Secret Scanner - Aone Toolkit</title>
</svelte:head>

<div class="h-[calc(100vh-3rem)] p-4 flex flex-col space-y-4">
    <Panel class="flex-1 flex flex-col min-h-0">
        {#snippet header()}
            <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-2">
                    <div
                        class="w-7 h-7 rounded-lg {findings.length > 0
                            ? 'bg-red-100 text-red-600'
                            : 'bg-emerald-100 text-emerald-600'} flex items-center justify-center border"
                    >
                        {#if findings.length > 0}
                            <ShieldAlert size={16} />
                        {:else}
                            <ShieldCheck size={16} />
                        {/if}
                    </div>
                    <h2 class="font-semibold text-slate-900 dark:text-white">
                        Secret Scanner
                    </h2>
                </div>
                <div class="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onclick={() => (showSecrets = !showSecrets)}
                    >
                        {#if showSecrets}<EyeOff size={14} />{:else}<Eye
                                size={14}
                            />{/if}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onclick={() => (input = "")}
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>
            </div>
        {/snippet}

        <div
            class="flex-1 grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800"
        >
            <div class="flex flex-col p-6 space-y-4">
                <div
                    class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                >
                    Paste Text to Scan
                </div>
                <textarea
                    bind:value={input}
                    class="flex-1 p-4 font-mono text-xs bg-slate-50 dark:bg-black/20 border-none rounded-2xl resize-none focus:outline-none dark:text-slate-300"
                    placeholder="Paste logs, code, or config files here..."
                ></textarea>
            </div>

            <div
                class="flex flex-col p-6 space-y-4 bg-slate-50/30 dark:bg-black/10 overflow-y-auto"
            >
                <div
                    class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                >
                    Detection Results ({findings.length})
                </div>

                {#if findings.length > 0}
                    <div class="space-y-3">
                        {#each findings as finding}
                            <div
                                class="p-4 bg-white dark:bg-slate-800 rounded-xl border-l-4 {finding.severity ===
                                    'critical' || finding.severity === 'high'
                                    ? 'border-l-red-500'
                                    : 'border-l-amber-500'} shadow-sm"
                            >
                                <div
                                    class="flex justify-between items-start mb-1"
                                >
                                    <h3
                                        class="text-xs font-bold uppercase {finding.severity ===
                                            'critical' ||
                                        finding.severity === 'high'
                                            ? 'text-red-600'
                                            : 'text-amber-600'}"
                                    >
                                        {finding.name}
                                    </h3>
                                    <span
                                        class="text-[9px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500"
                                        >POS: {finding.pos}</span
                                    >
                                </div>
                                <code
                                    class="text-sm font-mono break-all text-slate-700 dark:text-slate-300"
                                    >{mask(finding.value)}</code
                                >
                            </div>
                        {/each}
                    </div>
                {:else if input}
                    <div
                        class="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-50"
                    >
                        <ShieldCheck size={48} class="text-emerald-500" />
                        <p class="text-sm font-medium">No secrets detected</p>
                        <p class="text-xs max-w-[200px]">
                            Keep in mind that pattern matching may not find
                            everything. Always use environment variables!
                        </p>
                    </div>
                {:else}
                    <div
                        class="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-20"
                    >
                        <Search size={48} />
                        <p class="text-sm">Scan results will appear here</p>
                    </div>
                {/if}
            </div>
        </div>
    </Panel>
</div>
