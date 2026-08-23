<script lang="ts">
    import type { Message } from "$lib/stores/agentStore.svelte";
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import RichMessageContent from "./RichMessageContent.svelte";
    import ThoughtBubble from "./ThoughtBubble.svelte";
    import { AgentAvatar } from "$lib/components/ui";
    import {
        Code,
        Map as Sitemap,
        ShieldCheck,
        Bot,
        User,
        Info,
        FileCheck2,
        Scale,
        Compass,
        ShieldAlert,
        CheckSquare,
        ChevronDown,
        ChevronUp,
        Copy,
        Check,
        Quote,
        Target,
        Zap,
        Clock,
        Loader2,
        RotateCcw,
        FileText,
        Swords,
        Search,
        Crown,
        Sparkles
    } from "lucide-svelte";
    import type { ComponentType } from "svelte";

    let { message }: { message: Message } = $props();

    let showInstruction = $state(false);
    let copied = $state(false);

    const iconMap: Record<string, ComponentType> = {
        code: Code,
        sitemap: Sitemap,
        "shield-check": ShieldCheck,
        scale: Scale,
        compass: Compass,
        "shield-alert": ShieldAlert,
        "check-square": CheckSquare,
        swords: Swords,
        search: Search,
        crown: Crown,
        default: Bot,
    };

    import { AGENT_DISPLAY_MAP, SKILL_LABELS, getAgentDisplay, getAgentDisplayName } from "$lib/constants/agentConstants";

    const agentAliases = AGENT_DISPLAY_MAP;
    const skillLabels = SKILL_LABELS;

    function getAgent(id?: string) {
        if (!id) return null;
        return agentStore.getAgent(id);
    }

    function getIcon(name: string) {
        return iconMap[name] || iconMap.default;
    }

    async function handleCopy(e?: MouseEvent) {
        if (!message.content) return;
        try {
            if (e?.altKey || isUser || isSystem) {
                await navigator.clipboard.writeText(message.content);
            } else {
                const skillLabel = message.skillId ? (skillLabels[message.skillId] || message.skillId) : "综合推演";
                const header = `> **【${agentName}】** | 技能：${skillLabel}` + (message.instruction ? `\n> **协同指令**：${message.instruction}` : '') + '\n\n';
                await navigator.clipboard.writeText(header + message.content);
            }
            copied = true;
            setTimeout(() => { copied = false; }, 2000);
        } catch {
            // fallback
        }
    }

    function handleQuoteAndReply() {
        const snippet = message.content.slice(0, 120).replace(/\n+/g, ' ');
        const quoteText = `> [${agentName}]: "${snippet}..."\n\n针对上述分析：`;
        window.dispatchEvent(new CustomEvent("insert-chat-input", { detail: { text: quoteText } }));
    }

    let estimatedTokens = $derived.by(() => {
        if (!message.content) return 0;
        return Math.round(message.content.length * 1.3);
    });

    let throughputSpeed = $derived.by(() => {
        if (!message.durationMs || message.durationMs < 100) return null;
        const seconds = message.durationMs / 1000;
        return (estimatedTokens / seconds).toFixed(1);
    });

    let isError = $derived(
        message.content.includes("Failed:") ||
        message.content.includes("AI Call Failed") ||
        message.content.includes("UNCONFIGURED")
    );

    function handleRetryThisStep() {
        if (message.stepIndex !== undefined) {
            agentStore.retryStage("decompose");
        }
    }

    let agent = $derived(getAgent(message.agentId));
    let isUser = $derived(message.role === "user");
    let isThought = $derived(message.role === "thought");
    let isSystem = $derived(message.role === "system");
    let isCoordinator = $derived(message.agentId === "coordinator");
    let isSynthesizer = $derived(message.agentId === "synthesizer");
    let isFinal = $derived(message.agentId === "metaflow");
    let agentDisplay = $derived(message.agentId ? agentAliases[message.agentId] : null);
    let agentName = $derived(agentDisplay?.name || agent?.name || "System");
    let agentRole = $derived(agentDisplay?.role || agent?.role || "Workbench update");
    let agentAccent = $derived(agentDisplay?.color || "#6366F1");
</script>

<div
    id={`msg-${message.id}`}
    class="flex gap-3 sm:gap-4 p-3 sm:p-4 {isUser
        ? 'flex-row-reverse'
        : ''} group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all rounded-xl duration-150"
>
    <!-- Avatar -->
    <div class="shrink-0 pt-0.5">
        {#if isUser}
            <AgentAvatar agent="user" size="md" shape="rounded" glow={false} />
        {:else if isThought || isCoordinator}
            <AgentAvatar agent="coordinator" size="md" shape="rounded" status={message.isStreaming ? "thinking" : "idle"} glow={false} />
        {:else if isSystem}
            <div
                class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shadow-2xs border border-slate-200 dark:border-slate-750"
            >
                <Info class="w-4 h-4" />
            </div>
        {:else if isSynthesizer}
            <AgentAvatar agent="synthesizer" size="md" shape="rounded" status={message.isStreaming ? "speaking" : "idle"} glow={false} />
        {:else if isFinal}
            <AgentAvatar agent="closer" size="md" shape="rounded" status="speaking" glow={false} />
        {:else if agent}
            <AgentAvatar agent={agent.id} size="md" shape="rounded" status={message.isStreaming ? "speaking" : "idle"} glow={false} />
        {:else}
            <AgentAvatar agent="coordinator" size="md" shape="rounded" />
        {/if}
    </div>

    <!-- Content Area -->
    <div class="flex-1 max-w-3xl space-y-1.5 min-w-0">
        <!-- Message Header with Clean Metadata -->
        <div class="flex flex-wrap items-center gap-2 {isUser ? 'justify-end' : ''}">
            <span class="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                {#if isUser}
                    用户
                {:else if isThought}
                    协同推演与策略规划
                {:else if isSystem}
                    系统通知
                {:else if isSynthesizer}
                    {agentName} <span class="text-[10px] text-slate-400 font-normal font-mono">(决议汇总)</span>
                {:else}
                    {agentName}
                {/if}
            </span>

            {#if !isUser && !isSystem}
                <div class="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {#if message.stepIndex}
                        <span class="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                            Step {message.stepIndex}{#if message.totalSteps}/{message.totalSteps}{/if}
                        </span>
                    {/if}

                    {#if message.skillId}
                        <span>·</span>
                        <span>{skillLabels[message.skillId] || message.skillId}</span>
                    {/if}

                    {#if message.durationMs && message.durationMs >= 200}
                        <span>·</span>
                        <span>{(message.durationMs / 1000).toFixed(1)}s</span>
                    {/if}
                </div>
            {/if}

            <span class="text-[10px] text-slate-400 font-mono">
                {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                })}
            </span>

            <!-- Streaming Indicator -->
            {#if message.isStreaming}
                <span class="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    <Loader2 class="w-2.5 h-2.5 animate-spin" />
                    <span>推演生成中...</span>
                </span>
            {/if}
        </div>

        <!-- Collapsible Directive / Instruction Accordion -->
        {#if message.instruction && !isUser && !isSystem}
            <div class="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 overflow-hidden text-xs transition-all">
                <button
                    type="button"
                    onclick={() => (showInstruction = !showInstruction)}
                    class="w-full flex items-center justify-between px-2.5 py-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                >
                    <div class="flex items-center gap-1.5 truncate">
                        <Target class="w-3 h-3 text-slate-400 shrink-0" />
                        <span class="font-medium text-slate-600 dark:text-slate-300">工序指令:</span>
                        <span class="truncate text-slate-500">{message.instruction}</span>
                    </div>
                    {#if showInstruction || agentStore.globalExpandDirectives}
                        <ChevronUp class="w-3 h-3 shrink-0 text-slate-400 ml-2" />
                    {:else}
                        <ChevronDown class="w-3 h-3 shrink-0 text-slate-400 ml-2" />
                    {/if}
                </button>
                {#if showInstruction || agentStore.globalExpandDirectives}
                    <div class="px-2.5 pb-2 pt-1 text-slate-600 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-800/60 leading-relaxed bg-white/50 dark:bg-slate-900/30 font-sans">
                        {message.instruction}
                    </div>
                {/if}
            </div>
        {/if}

        <!-- Message Body -->
        {#if isThought}
            <ThoughtBubble content={message.content} />
        {:else}
            <div
                class="message-card-body max-w-full break-words min-w-0 relative rounded-xl transition-all overflow-hidden
                {isUser
                    ? 'bg-slate-100 dark:bg-slate-800 p-3.5 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                    : isSynthesizer
                      ? 'bg-slate-50 dark:bg-slate-850 p-4 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs'}"
            >
                <!-- Rich Markdown Content -->
                <RichMessageContent content={message.content} />

                <!-- Streaming cursor effect -->
                {#if message.isStreaming}
                    <span class="inline-block w-1.5 h-4 ml-1 align-middle bg-slate-500 animate-pulse"></span>
                {/if}
            </div>

            <!-- Footer Action Toolbar (Copy, Retry & Quote) -->
            {#if !isThought && message.content && !message.isStreaming}
                <div class="flex items-center justify-end gap-1.5 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {#if isError && message.stepIndex !== undefined}
                        <button
                            type="button"
                            onclick={handleRetryThisStep}
                            class="inline-flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                            title="单步重新执行"
                        >
                            <RotateCcw class="w-3 h-3" />
                            <span>重试此步</span>
                        </button>
                    {/if}

                    {#if !isUser && !isSystem && message.content}
                        <button
                            type="button"
                            onclick={handleQuoteAndReply}
                            class="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="引用此回答"
                        >
                            <Quote class="w-3 h-3" />
                            <span>引用</span>
                        </button>
                    {/if}

                    <button
                        type="button"
                        onclick={handleCopy}
                        class="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="复制内容"
                    >
                        {#if copied}
                            <Check class="w-3 h-3 text-emerald-500" />
                            <span class="text-emerald-600 dark:text-emerald-400">已复制</span>
                        {:else}
                            <Copy class="w-3 h-3" />
                            <span>复制</span>
                        {/if}
                    </button>
                </div>
            {/if}
        {/if}
    </div>
</div>
