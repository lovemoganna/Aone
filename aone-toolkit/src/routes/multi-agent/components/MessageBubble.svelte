<script lang="ts">
    import { marked } from "marked";
    import hljs from "highlight.js";
    import "highlight.js/styles/github-dark.css"; // or atomic-one-dark
    import type { Message } from "$lib/stores/agentStore.svelte";
    import { agentStore } from "$lib/stores/agentStore.svelte";
    import {
        Code,
        Map as Sitemap,
        ShieldCheck,
        Bot,
        User,
        // V2 Icons
        Scale,
        Compass,
        ShieldAlert,
        CheckSquare,
    } from "lucide-svelte";
    import type { ComponentType } from "svelte";
    import ThoughtBubble from "./ThoughtBubble.svelte";

    let { message }: { message: Message } = $props();

    // Configure marked with highlight.js
    marked.use({
        renderer: {
            code({ text, lang }: { text: string; lang?: string }) {
                const language =
                    lang && hljs.getLanguage(lang) ? lang : "plaintext";
                const highlighted = hljs.highlight(text, { language }).value;
                return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
            },
        },
    });

    const iconMap: Record<string, ComponentType> = {
        code: Code,
        sitemap: Sitemap,
        "shield-check": ShieldCheck,
        // V2 Agent Icons
        scale: Scale,
        compass: Compass,
        "shield-alert": ShieldAlert,
        "check-square": CheckSquare,
        default: Bot,
    };

    function getAgent(id?: string) {
        if (!id) return null;
        return agentStore.getAgent(id);
    }

    function getIcon(name: string) {
        return iconMap[name] || iconMap.default;
    }

    let agent = $derived(getAgent(message.agentId));
    let isUser = $derived(message.role === "user");
    let isThought = $derived(message.role === "thought");
    let htmlContent = $derived(marked.parse(message.content));
</script>

<div
    class="flex gap-4 p-4 {isUser
        ? 'flex-row-reverse'
        : ''} group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
>
    <!-- Avatar -->
    <div class="shrink-0">
        {#if isUser}
            <div
                class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500"
            >
                <User class="w-5 h-5" />
            </div>
        {:else if isThought}
            <div
                class="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600"
            >
                <Sitemap class="w-5 h-5" />
            </div>
        {:else if agent}
            {@const Icon = getIcon(agent.avatar)}
            <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-white {agent.color}"
            >
                <Icon class="w-5 h-5" />
            </div>
        {:else}
            <div
                class="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white"
            >
                <Bot class="w-5 h-5" />
            </div>
        {/if}
    </div>

    <!-- Content -->
    <div class="flex-1 max-w-3xl space-y-1 min-w-0">
        <div class="flex items-center gap-2 {isUser ? 'justify-end' : ''}">
            <span
                class="text-sm font-semibold text-slate-900 dark:text-slate-100"
            >
                {#if isUser}
                    You
                {:else if isThought}
                    Intelligence Strategy
                {:else}
                    {agent?.name || "System"}
                {/if}
            </span>
            {#if agent}
                <span
                    class="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded"
                >
                    {agent.role}
                </span>
            {/if}
            <span class="text-xs text-slate-400">
                {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                })}
            </span>
        </div>

        {#if isThought}
            <ThoughtBubble content={message.content} />
        {:else}
            <div
                class="prose prose-sm dark:prose-invert max-w-none break-words
                {isUser
                    ? 'bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg rounded-tr-none'
                    : agent
                      ? `bg-white dark:bg-slate-900 p-3 rounded-lg rounded-tl-none border border-${agent.color.replace('bg-', '')}/30 shadow-sm relative overflow-hidden`
                      : ''}
                [&_pre]:!bg-slate-900 [&_pre]:!p-4 [&_pre]:!rounded-lg [&_code]:!bg-transparent [&_code]:!p-0"
            >
                {#if agent && !isUser}
                    <div
                        class="absolute inset-y-0 left-0 w-1 {agent.color} opacity-40"
                    ></div>
                {/if}
                {@html htmlContent}
            </div>
        {/if}
    </div>
</div>
