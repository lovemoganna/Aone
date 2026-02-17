<script lang="ts">
    import { page } from '$app/stores';
    import { 
        Bot, 
        Users, 
        Puzzle, 
        GitBranch, 
        MessageSquare,
        Settings,
        ChevronRight,
        Sparkles
    } from 'lucide-svelte';
    import { fade } from 'svelte/transition';
    import SettingsModal from '../multi-agent/components/SettingsModal.svelte';

    let settingsOpen = $state(false);

    // Navigation items
    const navItems = [
        { 
            id: 'lobby', 
            label: 'Agent 大厅', 
            icon: Bot, 
            href: '/agent-studio',
            description: '创建和管理多 Agent 会话'
        },
        { 
            id: 'personas', 
            label: '人格工坊', 
            icon: Users, 
            href: '/agent-studio/personas',
            description: '创建和管理抽象人格'
        },
        { 
            id: 'skills', 
            label: '技能池', 
            icon: Puzzle, 
            href: '/agent-studio/skills',
            description: '管理和扩展认知工具'
        },
        { 
            id: 'orchestration', 
            label: '编排中心', 
            icon: GitBranch, 
            href: '/agent-studio/orchestration',
            description: '组合人格与技能'
        }
    ];

    let currentPath = $derived($page.url.pathname);
    
    // Determine active tab based on path
    let activeTab = $derived.by(() => {
        const path = currentPath;
        if (path === '/agent-studio' || path === '/agent-studio/chat') return 'lobby';
        if (path.startsWith('/agent-studio/personas')) return 'personas';
        if (path.startsWith('/agent-studio/skills')) return 'skills';
        if (path.startsWith('/agent-studio/orchestration')) return 'orchestration';
        return 'lobby';
    });
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <!-- Logo & Title -->
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Bot class="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 class="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                            Agent Studio
                        </h1>
                        <p class="text-xs text-slate-500 dark:text-slate-400">多 Agent 协作系统</p>
                    </div>
                </div>
                
                <!-- Quick Stats & Settings -->
                <div class="hidden md:flex items-center gap-4">
                    <div class="flex items-center gap-6 text-sm">
                        <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Users class="w-4 h-4" />
                            <span>人格</span>
                        </div>
                        <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Puzzle class="w-4 h-4" />
                            <span>技能</span>
                        </div>
                        <div class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <GitBranch class="w-4 h-4" />
                            <span>编排</span>
                        </div>
                    </div>
                    <button 
                        onclick={() => settingsOpen = true}
                        class="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Settings class="w-4 h-4" />
                        Settings
                    </button>
                </div>
            </div>
            
            <!-- Tab Navigation -->
            <div class="flex items-center gap-1 pb-3 -mt-1">
                {#each navItems as item}
                    {@const isActive = activeTab === item.id}
                    <a 
                        href={item.href}
                        class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all {isActive 
                            ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}"
                    >
                        <item.icon class="w-4 h-4" />
                        {item.label}
                    </a>
                {/each}
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <slot />
    </main>
</div>

<SettingsModal bind:open={settingsOpen} />
