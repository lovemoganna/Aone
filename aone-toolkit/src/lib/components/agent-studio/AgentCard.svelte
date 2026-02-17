<script lang="ts">
    import type { ComponentType } from 'svelte';
    import { 
        Prism, 
        Scale, 
        Compass, 
        Parachute, 
        CheckSquare,
        Edit3,
        Eye,
        Copy,
        MoreVertical,
        Check,
        X,
        Zap
    } from 'lucide-svelte';
    
    // Agent 数据
    export let agent: {
        id: string;
        name: string;
        role: string;
        description?: string;
        traits?: string[];
        coreBelief?: string;
        openingLine?: string;
        visual?: {
            primaryColor: string;
            avatarShape: string;
            abilityTags: string[];
        };
        isActive?: boolean;
        isOnline?: boolean;
        isEditing?: boolean;
    };
    
    // 装备的技能
    export let equippedSkills: { id: string; name: string; icon?: string }[] = [];
    
    // 悬浮预览示例
    export let hoverPreview: { user: string; agent: string } | null = null;
    
    // 状态
    let isHovered = $state(false);
    let showActions = $state(false);
    let copied = $state(false);
    
    // 获取图标组件
    function getAvatarIcon(shape: string): ComponentType {
        switch (shape) {
            case 'prism': return Prism;
            case 'scale': return Scale;
            case 'compass': return Compass;
            case 'parachute': return Parachute;
            case 'checkbox': return CheckSquare;
            default: return Prism;
        }
    }
    
    // 状态颜色
    function getStatusColor(status: string): string {
        switch (status) {
            case 'online': return 'bg-emerald-500';
            case 'thinking': return 'bg-blue-500 animate-pulse';
            case 'editing': return 'bg-amber-500';
            default: return 'bg-slate-400';
        }
    }
    
    // 复制配置
    function copyConfig() {
        navigator.clipboard.writeText(JSON.stringify(agent, null, 2));
        copied = true;
        setTimeout(() => copied = false, 2000);
    }
    
    // 抽象图形 SVG 路径
    const avatarShapes = {
        prism: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><line x1="12" y1="22" x2="12" y2="15.5"/><polyline points="22 8.5 12 15.5 2 8.5"/></svg>`,
        scale: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13"/><circle cx="12" cy="12" r="3"/></svg>`,
        compass: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
        parachute: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 3 10-3-10-5z"/><path d="M2 7l10 3 10-3"/><path d="M2 10l10 3 10-3"/><path d="M12 12v10"/><path d="M6 22l6-4 6 4"/></svg>`,
        checkbox: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>`
    };
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
    class="relative group"
    onmouseenter={() => isHovered = true}
    onmouseleave={() => isHovered = false}
>
    <!-- 卡片主体 -->
    <div class="p-5 rounded-2xl border-2 transition-all duration-300 
        {agent.isActive || agent.isOnline 
            ? 'border-white dark:border-slate-700 shadow-lg' 
            : 'border-slate-200 dark:border-slate-700'}
        bg-white dark:bg-slate-800
        {isHovered ? 'shadow-xl -translate-y-1' : 'shadow-sm'}
    "
    style={agent.visual ? `--agent-color: ${agent.visual.primaryColor}` : '--agent-color: #6366F1'}
    >
        <!-- 顶部颜色条 -->
        <div 
            class="absolute top-0 left-0 right-0 h-1 rounded-t-xl transition-all duration-300"
            style="background: linear-gradient(90deg, {agent.visual?.primaryColor || '#6366F1'}, {agent.visual?.primaryColor || '#6366F1'}99)"
        ></div>
        
        <!-- 状态指示器 -->
        {#if agent.isOnline}
            <div class="absolute top-3 right-3">
                <span class="flex items-center gap-1.5 text-xs">
                    <span class="w-2 h-2 rounded-full {getStatusColor(agent.isEditing ? 'editing' : 'online')}"></span>
                    <span class="text-slate-500">{agent.isEditing ? '编辑中' : '在线'}</span>
                </span>
            </div>
        {/if}
        
        <!-- Agent 头像与基本信息 -->
        <div class="flex items-start gap-3 mb-4">
            <!-- 抽象图形头像 -->
            <div 
                class="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110"
                style="background: linear-gradient(135deg, {agent.visual?.primaryColor || '#6366F1'}, {agent.visual?.primaryColor || '#6366F1'}CC)"
            >
                {#if agent.visual?.avatarShape && avatarShapes[agent.visual.avatarShape as keyof typeof avatarShapes]}
                    {@html avatarShapes[agent.visual.avatarShape as keyof typeof avatarShapes]}
                {:else}
                    <span class="text-xl font-bold">{agent.name[0]}</span>
                {/if}
            </div>
            
            <div class="flex-1 min-w-0">
                <h3 class="font-bold text-slate-900 dark:text-white text-lg truncate">
                    {agent.name}
                </h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {agent.role}
                </p>
            </div>
        </div>
        
        <!-- 核心信念 -->
        {#if agent.coreBelief}
            <p class="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
                {agent.coreBelief}
            </p>
        {/if}
        
        <!-- 能力标签 -->
        {#if agent.visual?.abilityTags || agent.traits}
            <div class="flex flex-wrap gap-1.5 mb-4">
                {#each (agent.visual?.abilityTags || agent.traits || []).slice(0, 4) as tag}
                    <span 
                        class="px-2 py-0.5 rounded-full text-xs font-medium"
                        style="background: {agent.visual?.primaryColor || '#6366F1'}15; color: {agent.visual?.primaryColor || '#6366F1'}"
                    >
                        {tag}
                    </span>
                {/each}
            </div>
        {/if}
        
        <!-- 装备工具栏 -->
        <div class="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl mb-3">
            <div class="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <Zap class="w-3 h-3" />
                <span>已装备工具</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
                {#each equippedSkills as skill}
                    <span class="px-2 py-1 bg-white dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700">
                        {skill.icon || '🔧'} {skill.name}
                    </span>
                {/each}
                {#if equippedSkills.length === 0}
                    <span class="text-xs text-slate-400 italic">拖拽工具卡到此处装备</span>
                {/if}
            </div>
        </div>
        
        <!-- 开场白 -->
        {#if agent.openingLine}
            <div class="p-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <p class="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2">
                    "{agent.openingLine}"
                </p>
            </div>
        {/if}
        
        <!-- 操作按钮 -->
        <div class="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
            <div class="flex items-center gap-1">
                <button 
                    class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="编辑"
                >
                    <Edit3 class="w-4 h-4 text-slate-500" />
                </button>
                <button 
                    class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="预览对话"
                >
                    <Eye class="w-4 h-4 text-slate-500" />
                </button>
                <button 
                    class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="复制配置"
                    onclick={copyConfig}
                >
                    {#if copied}
                        <Check class="w-4 h-4 text-emerald-500" />
                    {:else}
                        <Copy class="w-4 h-4 text-slate-500" />
                    {/if}
                </button>
            </div>
            
            <!-- 启动按钮 -->
            <button 
                class="px-4 py-2 bg-gradient-to-r text-white rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:scale-105"
                style="background: linear-gradient(135deg, {agent.visual?.primaryColor || '#6366F1'}, {agent.visual?.primaryColor || '#6366F1'}CC)"
            >
                启动 Agent
            </button>
        </div>
    </div>
    
    <!-- 悬浮预览卡片 -->
    {#if isHovered && hoverPreview}
        <div 
            class="absolute left-full top-0 ml-4 w-80 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50"
            transition:fade={{ duration: 200 }}
        >
            <div class="text-xs text-slate-400 mb-2">预览示例</div>
            
            <!-- 用户消息 -->
            <div class="mb-2">
                <div class="flex items-start gap-2">
                    <div class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs">
                        👤
                    </div>
                    <div class="flex-1 p-2 bg-slate-100 dark:bg-slate-700 rounded-lg rounded-tl-none">
                        <p class="text-sm text-slate-700 dark:text-slate-300">{hoverPreview.user}</p>
                    </div>
                </div>
            </div>
            
            <!-- Agent 回应 -->
            <div>
                <div class="flex items-start gap-2">
                    <div 
                        class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                        style="background: {agent.visual?.primaryColor || '#6366F1'}"
                    >
                        {agent.name[0]}
                    </div>
                    <div class="flex-1 p-2 rounded-lg rounded-tl-none" 
                        style="background: {agent.visual?.primaryColor || '#6366F1'}15; border: 1px solid {agent.visual?.primaryColor || '#6366F1'}30"
                    >
                        <p class="text-sm text-slate-700 dark:text-slate-300">{hoverPreview.agent}</p>
                    </div>
                </div>
            </div>
            
            <!-- 箭头 -->
            <div class="absolute -left-2 top-6 w-4 h-4 bg-white dark:bg-slate-800 border-l-0 border-t-0 border-b border-r border-slate-200 dark:border-slate-700 transform rotate-45"></div>
        </div>
    {/if}
</div>

<style>
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    :global(.agent-card-prism svg),
    :global(.agent-card-scale svg),
    :global(.agent-card-compass svg),
    :global(.agent-card-parachute svg),
    :global(.agent-card-checkbox svg) {
        width: 24px;
        height: 24px;
    }
</style>
