<script lang="ts">
    import { page } from "$app/stores";
    import { base } from "$app/paths";
    import SettingsModal from "../multi-agent/components/SettingsModal.svelte";
    import {
        ArrowRight,
        Bot,
        GitBranch,
        Home,
        Puzzle,
        Settings,
        Users,
    } from "lucide-svelte";

    let { children } = $props();
    let settingsOpen = $state(false);

    const navItems = [
        {
            id: "launchpad",
            label: "Agents",
            shortLabel: "Agents",
            icon: Bot,
            href: "/agent-studio",
            eyebrow: "Start here",
            title: "Agent Launchpad",
            description: "Choose an existing Agent or assemble a new one from Personas and Skills.",
            nextAction: "Launch in Workbench",
            ctaLabel: "Assemble Agent",
            ctaHref: "/agent-studio",
        },
        {
            id: "personas",
            label: "Personas",
            shortLabel: "Personas",
            icon: Users,
            href: "/agent-studio/personas",
            eyebrow: "Resource library",
            title: "Persona Library",
            description: "Maintain reusable voices, roles, behavior rules, and default Skill preferences.",
            nextAction: "Return to Agents when the Persona is ready.",
            ctaLabel: "Assemble Agent",
            ctaHref: "/agent-studio",
        },
        {
            id: "skills",
            label: "Skills",
            shortLabel: "Skills",
            icon: Puzzle,
            href: "/agent-studio/skills",
            eyebrow: "Resource library",
            title: "Skill Library",
            description: "Maintain reusable capabilities that Agents can equip during assembly.",
            nextAction: "Return to Agents when the Skill set is ready.",
            ctaLabel: "Assemble Agent",
            ctaHref: "/agent-studio",
        },
        {
            id: "orchestration",
            label: "Squads",
            shortLabel: "Squads",
            icon: GitBranch,
            href: "/agent-studio/orchestration",
            eyebrow: "Team layer",
            title: "Squads & Workflows",
            description: "Combine multiple Agents only when a single Agent is not enough.",
            nextAction: "Run Squads or saved Workflows in Workbench.",
            ctaLabel: "Single Agent Launchpad",
            ctaHref: "/agent-studio",
        },
    ];

    let currentPath = $derived($page.url.pathname);
    let activeTab = $derived.by(() => {
        const path: string = currentPath.replace(base, "") || "/";
        if (path.startsWith("/agent-studio/personas")) return "personas";
        if (path.startsWith("/agent-studio/skills")) return "skills";
        if (path.startsWith("/agent-studio/orchestration")) return "orchestration";
        return "launchpad";
    });

    let activeItem = $derived(navItems.find((item) => item.id === activeTab) || navItems[0]);
</script>

<div class="h-full flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-950">
    <header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="flex min-h-14 items-center justify-between gap-4 py-2.5">
                <a href="{base}/agent-studio" class="flex min-w-0 items-center gap-2.5">
                    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                        <Bot class="h-4 w-4" />
                    </div>
                    <div class="min-w-0">
                        <span class="truncate text-base font-semibold text-slate-900 dark:text-white">Agent Studio</span>
                        <span class="hidden text-xs text-slate-400 sm:inline ml-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                            智能体拼装与编排工作坊
                        </span>
                    </div>
                </a>

                <div class="hidden items-center gap-2 md:flex">
                    <a
                        href="{base}/multi-agent"
                        class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                    >
                        进入工作台
                        <ArrowRight class="h-3.5 w-3.5" />
                    </a>
                    <button
                        onclick={() => (settingsOpen = true)}
                        class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                    >
                        <Settings class="h-3.5 w-3.5" />
                        服务商设置
                    </button>
                </div>
            </div>

            <!-- Segmented Modern Sub-nav -->
            <div class="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-1.5 pb-2">
                <!-- [问题3] 优化移动端横向滑动体验：添加 overscroll-x-contain 平滑滑动与触控边缘内边距适配 -->
                <nav class="flex gap-1 overflow-x-auto pb-0.5 overscroll-x-contain scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0" aria-label="Agent Studio sections">
                    {#each navItems as item}
                        {@const isActive = activeTab === item.id}
                        <a
                            href="{base}{item.href}"
                            class="group inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 {isActive
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-semibold shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900'}"
                            aria-current={isActive ? "page" : undefined}
                            title={item.description}
                        >
                            <item.icon class="h-3.5 w-3.5 {isActive ? '' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500'}" />
                            <span>{item.label}</span>
                        </a>
                    {/each}
                </nav>

                <div class="hidden text-xs text-slate-400 lg:block font-mono">
                    Agents &rarr; Personas &rarr; Skills &rarr; Squads
                </div>
            </div>
        </div>
    </header>

    <main class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex-1">
        {@render children()}
    </main>
</div>

<SettingsModal bind:open={settingsOpen} />
