<script lang="ts">
    import { 
        Search,
        Scale,
        Shield,
        Gem,
        RefreshCw,
        CheckSquare,
        Eye,
        Edit3,
        ArrowRight,
        GripVertical
    } from 'lucide-svelte';
    
    // Skill 类型配置
    const skillTypeConfig: Record<string, { 
        label: string; 
        icon: string; 
        color: string; 
        bgColor: string;
        borderColor: string;
    }> = {
        analysis: { 
            label: '分析型', 
            icon: '🔍', 
            color: '#3B82F6',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-200 dark:border-blue-800'
        },
        quantitative: { 
            label: '量化型', 
            icon: '⚖️', 
            color: '#14B8A6',
            bgColor: 'bg-teal-50 dark:bg-teal-900/20',
            borderColor: 'border-teal-200 dark:border-teal-800'
        },
        evaluation: { 
            label: '评估型', 
            icon: '🃏', 
            color: '#8B5CF6',
            bgColor: 'bg-violet-50 dark:bg-violet-900/20',
            borderColor: 'border-violet-200 dark:border-violet-800'
        },
        exploration: { 
            label: '探索型', 
            icon: '🔄', 
            color: '#EAB308',
            bgColor: 'bg-amber-50 dark:bg-amber-900/20',
            borderColor: 'border-amber-200 dark:border-amber-800'
        },
        generation: { 
            label: '生成型', 
            icon: '✅', 
            color: '#22C55E',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
            borderColor: 'border-green-200 dark:border-green-800'
        }
    };
    
    // Skill 数据
    export let skill: {
        id: string;
        name: string;
        description: string;
        oneLiner: string;
        type: string;
        io?: {
            input: string;
            output: string;
        };
        compatibleAgents?: string[];
        recommendedAgents?: string[];
        visual?: {
            color: string;
            icon: string;
        };
    };
    
    // 是否可拖拽
    export let draggable: boolean = true;
    
    // 是否选中
    export let selected: boolean = false;
    
    // 状态
    let isHovered = $state(false);
    
    // 获取类型配置
    $: typeConfig = skillTypeConfig[skill.type] || skillTypeConfig.generation;
    
    // 获取图标组件
    function getTypeIcon(type: string) {
        switch (type) {
            case 'analysis': return Search;
            case 'quantitative': return Scale;
            case 'evaluation': return Shield;
            case 'exploration': return RefreshCw;
            case 'generation': return CheckSquare;
            default: return Search;
        }
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
    class="relative group"
    onmouseenter={() => isHovered = true}
    onmouseleave={() => isHovered = false}
>
    <!-- 卡片主体 -->
    <div 
        class="p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer
        {selected ? 'ring-2 ring-offset-2' : ''}
        {isHovered ? 'shadow-lg -translate-y-0.5' : 'shadow-sm'}
        {typeConfig.bgColor} {typeConfig.borderColor}
        "
        style={selected ? `ring-color: ${typeConfig.color}` : ''}
    >
        <!-- 顶部：类型标签 + 图标 -->
        <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
                <span class="text-lg">{typeConfig.icon}</span>
                <span 
                    class="px-2 py-0.5 rounded-full text-xs font-medium"
                    style="background: {typeConfig.color}20; color: {typeConfig.color}"
                >
                    {typeConfig.label}
                </span>
            </div>
            
            {#if draggable}
                <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical class="w-4 h-4 text-slate-400 cursor-grab" />
                </div>
            {/if}
        </div>
        
        <!-- 名称 -->
        <h4 class="font-bold text-slate-900 dark:text-white text-base mb-1">
            {skill.name}
        </h4>
        
        <!-- 一句话说明 -->
        <p class="text-sm text-slate-600 dark:text-slate-300 mb-3">
            {skill.oneLiner}
        </p>
        
        <!-- 详细描述 -->
        <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
            {skill.description}
        </p>
        
        <!-- 输入输出格式 -->
        {#if skill.io}
            <div class="space-y-1.5 mb-3">
                <div class="flex items-start gap-1.5 text-xs">
                    <span class="text-slate-400">输入:</span>
                    <span class="text-slate-600 dark:text-slate-300 flex-1 line-clamp-1">{skill.io.input}</span>
                </div>
                <div class="flex items-start gap-1.5 text-xs">
                    <span class="text-slate-400">输出:</span>
                    <span class="text-slate-600 dark:text-slate-300 flex-1 line-clamp-1">{skill.io.output}</span>
                </div>
            </div>
        {/if}
        
        <!-- 适配 Agent -->
        <div class="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
            <div class="flex items-center gap-2">
                <span class="text-xs text-slate-500">适配:</span>
                {#if skill.recommendedAgents && skill.recommendedAgents.length > 0}
                    <span 
                        class="px-1.5 py-0.5 rounded text-xs font-medium"
                        style="background: {typeConfig.color}15; color: {typeConfig.color}"
                    >
                        推荐: {skill.recommendedAgents[0]}
                    </span>
                {:else if skill.compatibleAgents && skill.compatibleAgents.length > 0}
                    <span class="text-xs text-slate-400">
                        {skill.compatibleAgents.length}个Agent
                    </span>
                {/if}
            </div>
            
            <!-- 操作按钮 -->
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    class="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors"
                    title="预览输出"
                >
                    <Eye class="w-3.5 h-3.5 text-slate-500" />
                </button>
                <button 
                    class="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors"
                    title="编辑"
                >
                    <Edit3 class="w-3.5 h-3.5 text-slate-500" />
                </button>
            </div>
        </div>
        
        <!-- 选中状态 -->
        {#if selected}
            <div 
                class="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                style="background: {typeConfig.color}"
            >
                <CheckSquare class="w-3 h-3 text-white" />
            </div>
        {/if}
    </div>
    
    <!-- 拖拽时的悬浮效果 -->
    {#if isHovered && draggable}
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div class="px-3 py-1 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg whitespace-nowrap">
                拖拽到 Agent 卡上装备
            </div>
        </div>
    {/if}
</div>

<style>
    .line-clamp-1 {
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>
