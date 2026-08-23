<script lang="ts">
    import { fade } from 'svelte/transition';
    import { Upload, FileText, FileJson, FileImage, X } from 'lucide-svelte';
    import type { Snippet } from 'svelte';
    
    // 支持的文件类型
    interface FileTypeConfig {
        type: string;
        icon: typeof FileText;
        color: string;
        accept: string[];
    }
    
    const fileTypes: FileTypeConfig[] = [
        { type: 'yaml', icon: FileJson, color: '#3B82F6', accept: ['.yaml', '.yml'] },
        { type: 'json', icon: FileJson, color: '#8B5CF6', accept: ['.json'] },
        { type: 'csv', icon: FileText, color: '#22C55E', accept: ['.csv'] },
        { type: 'text', icon: FileText, color: '#6B7280', accept: ['.txt', '.md'] },
        { type: 'image', icon: FileImage, color: '#EC4899', accept: ['.jpg', '.jpeg', '.png', '.gif', '.webp'] }
    ];
    
    // 状态
    let isDragging = $state(false);
    let dragCounter = $state(0);
    let isValid = $state(true);
    let files = $state<File[]>([]);
    
    // 事件处理
    function handleDragEnter(e: DragEvent) {
        e.preventDefault();
        dragCounter++;
        isDragging = true;
        
        // 检测文件类型
        if (e.dataTransfer?.types.includes('Files')) {
            isValid = true;
        }
    }
    
    function handleDragLeave(e: DragEvent) {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
            isDragging = false;
        }
    }
    
    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'copy';
        }
    }
    
    function handleDrop(e: DragEvent) {
        e.preventDefault();
        isDragging = false;
        dragCounter = 0;
        
        const droppedFiles = e.dataTransfer?.files;
        if (droppedFiles && droppedFiles.length > 0) {
            processFiles(Array.from(droppedFiles));
        }
    }
    
    // 处理文件
    function processFiles(fileList: File[]) {
        const validFiles: File[] = [];
        
        for (const file of fileList) {
            const ext = '.' + file.name.split('.').pop()?.toLowerCase();
            const config = fileTypes.find(t => t.accept.includes(ext));
            
            if (config) {
                validFiles.push(file);
            } else {
                isValid = false;
            }
        }
        
        if (validFiles.length > 0) {
            files = [...files, ...validFiles];
            // 触发文件处理事件
            handleFilesProcessed(validFiles);
        }
    }
    
    // 文件处理回调
    let { children, onFilesProcessed = undefined } = $props<{
        children?: Snippet;
        onFilesProcessed?: (files: File[]) => void;
    }>();
    
    function handleFilesProcessed(fileList: File[]) {
        if (onFilesProcessed) {
            onFilesProcessed(fileList);
        }
    }
    
    // 移除文件
    function removeFile(index: number) {
        files = files.filter((_, i) => i !== index);
    }
    
    // 获取文件图标
    function getFileConfig(file: File) {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        return fileTypes.find(t => t.accept.includes(ext)) || fileTypes[4];
    }
    
    // 格式化文件大小
    function formatSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
    class="relative"
    ondragenter={handleDragEnter}
    ondragleave={handleDragLeave}
    ondragover={handleDragOver}
    ondrop={handleDrop}
>
    <!-- 插槽内容 -->
    {@render children?.()}
    
    <!-- 全屏拖拽遮罩 -->
    {#if isDragging}
        <div 
            class="fixed inset-0 z-50 flex items-center justify-center p-8"
            transition:fade={{ duration: 150 }}
        >
            <!-- 毛玻璃背景 -->
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md"></div>
            
            <!-- 拖拽区域 -->
            <div 
                class="relative w-full max-w-lg p-12 rounded-3xl border-4 border-dashed transition-all duration-300
                {isValid 
                    ? 'border-white/50 bg-white/10 animate-pulse' 
                    : 'border-red-500 bg-red-500/20'}"
            >
                {#if isValid}
                    <!-- 呼吸光晕 -->
                    <div class="absolute inset-0 rounded-2xl animate-ping opacity-20">
                        <div class="w-full h-full rounded-2xl border-4 border-white"></div>
                    </div>
                    
                    <div class="flex flex-col items-center text-white">
                        <div class="w-20 h-20 mb-6 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
                            <Upload class="w-10 h-10" />
                        </div>
                        <h3 class="text-2xl font-bold mb-2">松开即可导入</h3>
                        <p class="text-white/70 text-center">
                            支持 YAML、JSON、CSV、TXT、MD、图片文件
                        </p>
                    </div>
                {:else}
                    <div class="flex flex-col items-center text-red-400">
                        <div class="w-20 h-20 mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                            <X class="w-10 h-10" />
                        </div>
                        <h3 class="text-2xl font-bold mb-2">不支持该格式</h3>
                        <p class="text-red-300 text-center">
                            请上传 YAML、JSON、CSV、TXT、MD 或图片文件
                        </p>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
    
    <!-- 已上传文件列表 -->
    {#if files.length > 0}
        <div class="mt-4 space-y-2">
            {#each files as file, index}
                {@const config = getFileConfig(file)}
                {@const FileTypeIcon = config.icon}
                <div 
                    class="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                    <div 
                        class="w-10 h-10 rounded-lg flex items-center justify-center"
                        style="background: {config.color}20"
                    >
                        <FileTypeIcon class="w-5 h-5" style="color: {config.color}" />
                    </div>
                    
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {file.name}
                        </p>
                        <p class="text-xs text-slate-500">
                            {formatSize(file.size)}
                        </p>
                    </div>
                    
                    <button 
                        onclick={() => removeFile(index)}
                        class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Remove file"
                        aria-label={`Remove ${file.name}`}
                    >
                        <X class="w-4 h-4 text-slate-400" />
                    </button>
                </div>
            {/each}
        </div>
    {/if}
</div>

