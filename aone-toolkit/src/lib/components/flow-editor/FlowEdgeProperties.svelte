<script lang="ts">
    import { X, Trash2, Copy, Edit3 } from 'lucide-svelte';
    import { slide } from 'svelte/transition';
    import type { FlowEdge, EdgeType, EdgeStyle, ArrowStyle } from './types';

    let {
        edge = $bindable(),
        isOpen = $bindable(false),
        onDelete = () => {},
        onCopy = () => {},
    } = $props<{
        edge?: FlowEdge;
        isOpen?: boolean;
        onDelete?: (edgeId: string) => void;
        onCopy?: (edgeId: string) => void;
    }>();

    // Local state for editing
    let label = $state(edge?.label || '');
    let edgeType = $state<EdgeType>(edge?.type || 'bezier');
    let edgeStyle = $state<EdgeStyle>(edge?.style || 'solid');
    let strokeWidth = $state(edge?.strokeWidth || 2);
    let strokeColor = $state(edge?.strokeColor || '#64748b');
    let arrowStyle = $state<ArrowStyle>(edge?.arrowStyle || 'arrow');
    let bidirectional = $state(edge?.bidirectional || false);
    let virtual = $state(edge?.virtual || false);
    let comment = $state(edge?.comment || '');

    // Sync with edge prop when it changes
    $effect(() => {
        if (edge) {
            label = edge.label || '';
            edgeType = edge.type || 'bezier';
            edgeStyle = edge.style || 'solid';
            strokeWidth = edge.strokeWidth || 2;
            strokeColor = edge.strokeColor || '#64748b';
            arrowStyle = edge.arrowStyle || 'arrow';
            bidirectional = edge.bidirectional || false;
            virtual = edge.virtual || false;
            comment = edge.comment || '';
        }
    });

    // Apply changes back to edge
    function applyChanges() {
        if (!edge) return;
        edge.label = label;
        edge.type = edgeType;
        edge.style = edgeStyle;
        edge.strokeWidth = strokeWidth;
        edge.strokeColor = strokeColor;
        edge.arrowStyle = arrowStyle;
        edge.bidirectional = bidirectional;
        edge.virtual = virtual;
        edge.comment = comment;
    }

    // Watch for changes and apply
    $effect(() => {
        // Trigger apply when any property changes
        const _ = [label, edgeType, edgeStyle, strokeWidth, strokeColor, arrowStyle, bidirectional, virtual, comment];
        applyChanges();
    });
</script>

{#if isOpen && edge}
    <div
        class="fixed left-4 top-20 w-72 max-h-[60vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden z-50"
        transition:slide={{ duration: 200 }}
    >
        <!-- Header -->
        <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <div class="flex items-center gap-2">
                <Edit3 class="w-4 h-4 text-blue-500" />
                <span class="font-semibold text-sm text-slate-900 dark:text-white">
                    连接线属性
                </span>
            </div>
            <button
                onclick={() => isOpen = false}
                class="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
            >
                <X class="w-4 h-4 text-slate-400" />
            </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
            <!-- Label -->
            <div>
                <label for="edge-label" class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    标签文本
                </label>
                <input
                    id="edge-label"
                    type="text"
                    bind:value={label}
                    placeholder="输入连接线标签"
                    class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <!-- Edge Type -->
            <div>
                <label for="edge-type" class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    连接线类型
                </label>
                <select
                    id="edge-type"
                    bind:value={edgeType}
                    class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="bezier">贝塞尔曲线</option>
                    <option value="step">阶梯线</option>
                    <option value="straight">直线</option>
                </select>
            </div>

            <!-- Edge Style -->
            <div>
                <label for="edge-style" class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    线条样式
                </label>
                <select
                    id="edge-style"
                    bind:value={edgeStyle}
                    class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="solid">实线</option>
                    <option value="dashed">虚线</option>
                    <option value="dotted">点线</option>
                </select>
            </div>

            <!-- Stroke Width -->
            <div>
                <label for="edge-stroke-width" class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    线条粗细: {strokeWidth}px
                </label>
                <input
                    id="edge-stroke-width"
                    type="range"
                    min="1"
                    max="6"
                    bind:value={strokeWidth}
                    class="w-full"
                />
            </div>

            <!-- Stroke Color -->
            <div>
                <label for="edge-stroke-color" class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    线条颜色
                </label>
                <div class="flex gap-2 items-center">
                    <input
                        id="edge-stroke-color"
                        type="color"
                        bind:value={strokeColor}
                        class="w-10 h-10 rounded cursor-pointer border border-slate-200 dark:border-slate-700"
                    />
                    <input
                        aria-label="线条颜色十六进制值"
                        type="text"
                        bind:value={strokeColor}
                        class="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                </div>
            </div>

            <!-- Arrow Style -->
            <div>
                <label for="edge-arrow-style" class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    箭头样式
                </label>
                <select
                    id="edge-arrow-style"
                    bind:value={arrowStyle}
                    class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="arrow">箭头</option>
                    <option value="diamond">菱形</option>
                    <option value="circle">圆形</option>
                    <option value="none">无</option>
                </select>
            </div>

            <!-- Bidirectional -->
            <div class="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="bidirectional"
                    bind:checked={bidirectional}
                    class="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                />
                <label for="bidirectional" class="text-sm text-slate-700 dark:text-slate-300">
                    双向连接
                </label>
            </div>

            <!-- Virtual Connection -->
            <div class="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="virtual"
                    bind:checked={virtual}
                    class="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                />
                <label for="virtual" class="text-sm text-slate-700 dark:text-slate-300">
                    虚拟连接（不显示线条）
                </label>
            </div>

            <!-- Comment -->
            <div>
                <label for="edge-comment" class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    备注说明
                </label>
                <textarea
                    id="edge-comment"
                    bind:value={comment}
                    placeholder="添加连接线备注..."
                    rows="3"
                    class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
            </div>
        </div>

        <!-- Actions -->
        <div class="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-2">
            <button
                onclick={() => onCopy(edge.id)}
                class="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
                <Copy class="w-4 h-4" />
                复制
            </button>
            <button
                onclick={() => {
                    onDelete(edge.id);
                    isOpen = false;
                }}
                class="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
                <Trash2 class="w-4 h-4" />
                删除
            </button>
        </div>
    </div>
{/if}
