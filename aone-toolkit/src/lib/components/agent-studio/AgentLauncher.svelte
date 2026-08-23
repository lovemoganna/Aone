<script lang="ts">
    import { fade, fly } from "svelte/transition";
    import { AlertTriangle, Bot, Rocket, ShieldCheck, User, Wrench, X } from "lucide-svelte";
    import { personaStore } from "$lib/persona";
    import { skillRegistry, type SkillDefinition } from "$lib/skills";
    import { settingsStore } from "$lib/stores/settingsStore.svelte";
    import AgentAvatar from "$lib/components/ui/AgentAvatar.svelte";
    import type { Agent } from "$lib/agents";

    interface Props {
        agent: Agent;
        onClose: () => void;
        onLaunch: () => void;
    }

    let { agent, onClose, onLaunch }: Props = $props();

    const agentAliases: Record<string, string> = {
        builtin_mentor_agent: "Mentor Agent",
        builtin_analyst_agent: "Analyst Agent",
        builtin_coach_agent: "Action Coach Agent",
    };

    let launchPersona = $derived(personaStore.getPersonaById(agent.personaId));
    let launchSkills = $derived(
        agent.skillIds
            .map((id) => skillRegistry.getById(id))
            .filter((s): s is SkillDefinition => Boolean(s)),
    );

    function displayAgentName(item: Agent) {
        return agentAliases[item.id] || item.name;
    }

    let displayName = $derived(displayAgentName(agent));
</script>

<div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    onclick={onClose}
    onkeydown={(event) => {
        if (event.key === "Escape") onClose();
    }}
    role="button"
    tabindex="0"
    aria-label="Close launch confirmation"
    transition:fade={{ duration: 160 }}
>
    <div
        class="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
        onclick={(event) => event.stopPropagation()}
        onkeydown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="launch-title"
        tabindex="-1"
        transition:fly={{ y: 18, duration: 220 }}
    >
        <div class="flex items-start justify-between border-b border-slate-200 p-6 dark:border-slate-800">
            <div class="flex items-start gap-4">
                <AgentAvatar {agent} size="lg" shape="rounded" />
                <div>
                    <h2 id="launch-title" class="text-lg font-bold text-slate-950 dark:text-white">
                        将 {displayName} 启动到工作台
                    </h2>
                    <p class="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        工作台将以此 Agent 作为当前启动上下文。在此处输入您的第一个任务以开始执行。
                    </p>
                </div>
            </div>
            <button
                onclick={onClose}
                class="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Close"
            >
                <X class="h-5 w-5" />
            </button>
        </div>

        <div class="space-y-3.5 p-6">
            <div class="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
                <div class="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <User class="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    角色人设来源
                </div>
                <div class="font-medium text-xs text-slate-900 dark:text-white">
                    {launchPersona?.name || "未链接角色"}
                </div>
                {#if launchPersona}
                    <p class="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {launchPersona.roleSetting}
                    </p>
                {/if}
            </div>

            <div class={settingsStore.isConfigured
                ? "rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                : "rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/20"}
            >
                <div class={settingsStore.isConfigured
                    ? "mb-1 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                    : "mb-1 flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300"}
                >
                    {#if settingsStore.isConfigured}
                        <ShieldCheck class="h-3.5 w-3.5" />
                        大模型服务商已连接
                    {:else}
                        <AlertTriangle class="h-3.5 w-3.5" />
                        模拟运行模式
                    {/if}
                </div>
                <p class="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {#if settingsStore.isConfigured}
                        {settingsStore.currentProvider?.name} / {settingsStore.selectedModel} 将负责运行此次工作台会话。
                    {:else}
                        后续界面将明确标识为模拟运行状态，直至配置连接了大模型服务商。
                    {/if}
                </p>
            </div>

            <div class="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
                <div class="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Wrench class="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    已加载技能 ({launchSkills.length})
                </div>
                {#if launchSkills.length > 0}
                    <div class="flex flex-wrap gap-1.5">
                        {#each launchSkills as skill}
                            <span class="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                {skill.name}
                            </span>
                        {/each}
                    </div>
                {:else}
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                        此 Agent 暂未配备任何技能。
                    </p>
                {/if}
            </div>
        </div>

        <div class="flex gap-2.5 border-t border-slate-200 p-4 dark:border-slate-800">
            <!-- // [问题3] 为返回与启动按钮补充 focus-visible 键盘焦点可见性支持 -->
            <button
                onclick={onClose}
                aria-label={`Back to Agent Studio without launching ${displayName}`}
                class="flex-1 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600"
            >
                返回工作坊
            </button>
            <button
                onclick={onLaunch}
                aria-label={`Confirm launch of ${displayName} in Workbench`}
                class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
                <Rocket class="h-3.5 w-3.5" />
                启动到工作台
            </button>
        </div>
    </div>
</div>
