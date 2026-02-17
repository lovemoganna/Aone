<script lang="ts">
    import { 
        FileText, 
        FileJson, 
        FileImage, 
        File, 
        Table, 
        Eye, 
        Download, 
        Trash2, 
        CheckCircle,
        Loader2,
        AlertCircle
    } from 'lucide-svelte';
    
    // 文件类型
    type FileCategory = 'config' | 'data' | 'text' | 'image' | 'unknown';
    
    // 文件信息
    export let file: {
        name: string;
        size: number;
        type: string;
        content?: string;
    };
    
    // 解析结果
    export let parsedData: any = null;
    export let parseError: string | null = null;
    export let parseStatus: 'idle' | 'parsing' | 'success' | 'error' = 'idle';
    
    // 文件分类
    let category: FileCategory = $derived.by(() => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        
        if (['yaml', 'yml', 'json'].includes(ext || '')) return 'config';
        if (['csv', 'xlsx'].includes(ext || '')) return 'data';
        if (['txt', 'md', 'log'].includes(ext || '')) return 'text';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
        return 'unknown';
    });
    
    // 图标和颜色
    let iconConfig = $derived.by(() => {
        switch (category) {
            case 'config':
                return { icon: FileJson, color: '#3B82F6', label: '配置文件' };
            case 'data':
                return { icon: Table, color: '#22C55E', label: '数据文件' };
            case 'text':
                return { icon: FileText, color: '#6B7280', label: '文本文件' };
            case 'image':
                return { icon: FileImage, color: '#EC4899', label: '图片文件' };
            default:
                return { icon: File, color: '#9CA3AF', label: '未知文件' };
        }
    });
    
    // 格式化大小
    function formatSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    
    // 预览内容
    let previewContent = $derived.by(() => {
        if (!file.content) return null;
        
        if (category === 'config') {
            try {
                const data = JSON.parse(file.content);
                return JSON.stringify(data, null, 2).slice(0, 500);
            } catch {
                return file.content.slice(0, 500);
            }
        }
        
        if (category === 'text') {
            return file.content.slice(0, 500);
        }
        
        return null;
    });
    
    // 解析状态图标
    function getStatusIcon() {
        switch (parseStatus) {
            case 'parsing': return Loader2;
            case 'success': return CheckCircle;
            case 'error': return AlertCircle;
            default: return File;
        }
    }
    
    // 操作
    export let onPreview: (() => void) | undefined = undefined;
    export let onDownload: (() => void) | undefined = undefined;
    export let onDelete: (() => void) | undefined = undefined;
    export let onImport: (() => void) | undefined = undefined;
</script>

<div class="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
    <!-- 头部 -->
    <div class="flex items-start justify-between mb-3">
        <div class="flex items-center gap-3">
            <div 
                class="w-10 h-10 rounded-lg flex items-center justify-center"
                style="background: {iconConfig.color}20"
            >
                <svelte:component this={iconConfig.icon} class="w-5 h-5" style="color: {iconConfig.color}" />
            </div>
            <div>
                <h4 class="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    {file.name}
                    {#if parseStatus === 'parsing'}
                        <Loader2 class="w-4 h-4 animate-spin text-blue-500" />
                    {:else if parseStatus === 'success'}
                        <CheckCircle class="w-4 h-4 text-green-500" />
                    {:else if parseStatus === 'error'}
                        <AlertCircle class="w-4 h-4 text-red-500" />
                    {/if}
                </h4>
                <p class="text-xs text-slate-500">
                    {formatSize(file.size)} · {iconConfig.label}
                </p>
            </div>
        </div>
        
        <button 
            onclick={() => onDelete?.()}
            class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="删除"
        >
            <Trash2 class="w-4 h-4 text-slate-400" />
        </button>
    </div>
    
    <!-- 识别信息 -->
    {#if parsedData}
        <div class="mb-3 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div class="text-xs text-slate-500 mb-1">识别为:</div>
            <div class="text-sm font-medium text-slate-700 dark:text-slate-300">
                {iconConfig.label}
                {#if parsedData.name}
                    - {parsedData.name}
                {/if}
            </div>
            {#if parsedData.agentCount || parsedData.skillCount}
                <div class="text-xs text-slate-500 mt-1">
                    包含: 
                    {#if parsedData.agentCount}
                        {parsedData.agentCount}个Agent
                    {/if}
                    {#if parsedData.agentCount && parsedData.skillCount}
                        ,
                    {/if}
                    {#if parsedData.skillCount}
                        {parsedData.skillCount}个Skill
                    {/if}
                </div>
            {/if}
        </div>
    {/if}
    
    <!-- 解析错误 -->
    {#if parseError}
        <div class="mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p class="text-xs text-red-600 dark:text-red-400">{parseError}</p>
        </div>
    {/if}
    
    <!-- 预览内容 -->
    {#if previewContent}
        <div class="mb-3">
            <div class="text-xs text-slate-500 mb-1">预览:</div>
            <pre class="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs text-slate-600 dark:text-slate-400 overflow-x-auto max-h-32">{previewContent}</pre>
            {#if file.content.length > 500}
                <p class="text-xs text-slate-400 mt-1">...共 {file.content.length} 字符</p>
            {/if}
        </div>
    {/if}
    
    <!-- 字段完整度 (仅配置文件) -->
    {#if category === 'config' && parsedData}
        <div class="mb-3">
            <div class="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>字段完整度:</span>
                <span class="font-medium">
                    {#if parsedData.fields}
                        {Object.keys(parsedData.fields).length}/12
                    {:else}
                        -
                    {/if}
                </span>
            </div>
            <div class="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                    class="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                    style="width: {parsedData.fields ? Math.min(100, (Object.keys(parsedData.fields).length / 12) * 100) : 0}%"
                ></div>
            </div>
        </div>
    {/if}
    
    <!-- 操作按钮 -->
    <div class="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
        <button 
            onclick={() => onPreview?.()}
            class="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
        >
            <Eye class="w-4 h-4" />
            预览全部
        </button>
        
        <button 
            onclick={() => onImport?.()}
            class="flex-1 px-3 py-2 text-sm bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
            <CheckCircle class="w-4 h-4" />
            导入为卡片
        </button>
    </div>
</div>
