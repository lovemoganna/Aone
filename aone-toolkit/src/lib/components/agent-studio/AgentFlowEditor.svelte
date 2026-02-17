<script lang="ts">
    import { onMount } from 'svelte';
    import { Users, Wrench, Play, Save, Trash2, ArrowRight, Plus, X } from 'lucide-svelte';

    // 节点类型
    interface PersonaNodeData {
        label: string;
        personaId: string;
        personaName: string;
        color: string;
    }

    interface SkillNodeData {
        label: string;
        skillId: string;
        skillName: string;
        color: string;
    }

    interface FlowNode {
        id: string;
        type: 'persona' | 'skill';
        position: { x: number; y: number };
        data: PersonaNodeData | SkillNodeData;
    }

    interface FlowEdge {
        id: string;
        source: string;
        target: string;
    }

    // 状态
    let nodes = $state<FlowNode[]>([]);
    let edges = $state<FlowEdge[]>([]);
    let selectedNodeId = $state<string | null>(null);
    let isLoaded = $state(false);

    onMount(() => {
        // 初始化默认节点
        nodes = [
            {
                id: 'persona-1',
                type: 'persona',
                position: { x: 100, y: 150 },
                data: {
                    label: '人格节点',
                    personaId: '',
                    personaName: '选择人格',
                    color: '#8B5CF6'
                } as PersonaNodeData
            },
            {
                id: 'skill-1',
                type: 'skill',
                position: { x: 450, y: 150 },
                data: {
                    label: '技能节点',
                    skillId: '',
                    skillName: '选择技能',
                    color: '#14B8A6'
                } as SkillNodeData
            }
        ];
        
        edges = [
            {
                id: 'edge-1',
                source: 'persona-1',
                target: 'skill-1'
            }
        ];
        
        isLoaded = true;
    });

    // 添加人格节点
    function addPersonaNode() {
        const id = `persona-${Date.now()}`;
        const newNode: FlowNode = {
            id,
            type: 'persona',
            position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
            data: {
                label: '人格节点',
                personaId: '',
                personaName: '选择人格',
                color: '#8B5CF6'
            } as PersonaNodeData
        };
        nodes = [...nodes, newNode];
    }

    // 添加技能节点
    function addSkillNode() {
        const id = `skill-${Date.now()}`;
        const newNode: FlowNode = {
            id,
            type: 'skill',
            position: { x: 400 + Math.random() * 200, y: 100 + Math.random() * 200 },
            data: {
                label: '技能节点',
                skillId: '',
                skillName: '选择技能',
                color: '#14B8A6'
            } as SkillNodeData
        };
        nodes = [...nodes, newNode];
    }

    // 选择节点
    function selectNode(nodeId: string) {
        selectedNodeId = nodeId;
    }

    // 删除节点
    function deleteNode(nodeId: string) {
        nodes = nodes.filter(n => n.id !== nodeId);
        edges = edges.filter(e => e.source !== nodeId && e.target !== nodeId);
        if (selectedNodeId === nodeId) {
            selectedNodeId = null;
        }
    }

    // 获取选中节点
    let selectedNode = $derived(nodes.find(n => n.id === selectedNodeId));

    // 获取连接线坐标
    function getEdgePath(sourceNode: FlowNode, targetNode: FlowNode): string {
        const sx = sourceNode.position.x + 120;
        const sy = sourceNode.position.y + 30;
        const tx = targetNode.position.x;
        const ty = targetNode.position.y + 30;
        const mx = (sx + tx) / 2;
        return `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`;
    }
</script>

{#if !isLoaded}
    <div class="flex items-center justify-center h-full">
        <div class="text-slate-500">加载中...</div>
    </div>
{:else}
<div class="flex h-full">
    <!-- 左侧：节点库 -->
    <div class="w-64 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 flex flex-col">
        <h3 class="font-bold text-slate-900 dark:text-white mb-4">节点库</h3>
        
        <!-- 添加节点按钮 -->
        <button 
            onclick={addPersonaNode}
            class="w-full p-3 mb-3 rounded-lg border-2 border-dashed border-violet-300 dark:border-violet-700 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors flex items-center gap-2"
        >
            <Users class="w-5 h-5 text-violet-500" />
            <span class="text-sm font-medium text-violet-700 dark:text-violet-400">添加人格节点</span>
        </button>
        
        <button 
            onclick={addSkillNode}
            class="w-full p-3 mb-4 rounded-lg border-2 border-dashed border-teal-300 dark:border-teal-700 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors flex items-center gap-2"
        >
            <Wrench class="w-5 h-5 text-teal-500" />
            <span class="text-sm font-medium text-teal-700 dark:text-teal-400">添加技能节点</span>
        </button>

        <div class="flex-1">
            <p class="text-sm text-slate-500">提示：在画布上点击节点进行配置</p>
        </div>
    </div>

    <!-- 中间：流程画布 -->
    <div class="flex-1 bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
        <!-- 节点渲染 -->
        <div class="absolute inset-0">
            <!-- 边（连接线） -->
            <svg class="absolute inset-0 w-full h-full pointer-events-none">
                {#each edges as edge}
                    {@const sourceNode = nodes.find(n => n.id === edge.source)}
                    {@const targetNode = nodes.find(n => n.id === edge.target)}
                    {#if sourceNode && targetNode}
                        <path
                            d={getEdgePath(sourceNode, targetNode)}
                            fill="none"
                            stroke="#94a3b8"
                            stroke-width="2"
                            stroke-dasharray="5,5"
                            class="animate-pulse"
                        />
                    {/if}
                {/each}
            </svg>

            <!-- 节点 -->
            {#each nodes as node (node.id)}
                <button
                    onclick={() => selectNode(node.id)}
                    class="absolute cursor-move group"
                    style="left: {node.position.x}px; top: {node.position.y}px;"
                >
                    <div 
                        class="w-48 rounded-lg overflow-hidden shadow-lg transition-all {selectedNodeId === node.id ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}"
                    >
                        <!-- 节点头部 -->
                        <div 
                            class="px-3 py-2 flex items-center gap-2"
                            style="background: {node.type === 'persona' ? '#8B5CF6' : '#14B8A6'}"
                        >
                            {#if node.type === 'persona'}
                                <Users class="w-4 h-4 text-white" />
                            {:else}
                                <Wrench class="w-4 h-4 text-white" />
                            {/if}
                            <span class="text-white text-sm font-medium">
                                {node.type === 'persona' ? '人格' : '技能'}
                            </span>
                        </div>
                        
                        <!-- 节点内容 -->
                        <div class="bg-white dark:bg-slate-800 p-3">
                            <div class="text-sm font-medium text-slate-900 dark:text-white truncate">
                                {node.type === 'persona' 
                                    ? (node.data as PersonaNodeData).personaName 
                                    : (node.data as SkillNodeData).skillName}
                            </div>
                            <div class="text-xs text-slate-500 mt-1">
                                {node.type === 'persona' 
                                    ? ((node.data as PersonaNodeData).personaId ? '已配置' : '点击选择人格')
                                    : ((node.data as SkillNodeData).skillId ? '已配置' : '点击选择技能')}
                            </div>
                        </div>
                    </div>
                </button>
            {/each}
        </div>

        <!-- 工具栏 -->
        <div class="absolute top-4 right-4 flex gap-2">
            <button class="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg shadow text-sm flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700">
                <Save class="w-4 h-4" />
                保存
            </button>
            <button class="px-3 py-1.5 bg-indigo-600 text-white rounded-lg shadow text-sm flex items-center gap-1.5 hover:bg-indigo-500">
                <Play class="w-4 h-4" />
                运行
            </button>
        </div>
    </div>

    <!-- 右侧：属性面板 -->
    {#if selectedNode}
        <div class="w-72 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-slate-900 dark:text-white">节点配置</h3>
                <button 
                    onclick={() => selectedNodeId = null}
                    class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                >
                    <X class="w-4 h-4 text-slate-500" />
                </button>
            </div>

            {#if selectedNode.type === 'persona'}
                <div class="space-y-3">
                    <div>
                        <label class="text-sm font-medium text-slate-600 dark:text-slate-400">人格名称</label>
                        <input 
                            type="text"
                            class="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            placeholder="输入人格名称"
                            value={(selectedNode.data as PersonaNodeData).personaName}
                            oninput={(e) => {
                                const val = e.currentTarget.value;
                                nodes = nodes.map(n => {
                                    if (n.id === selectedNodeId && n.type === 'persona') {
                                        return {
                                            ...n,
                                            data: { ...n.data, personaName: val, personaId: val }
                                        };
                                    }
                                    return n;
                                });
                            }}
                        />
                    </div>
                </div>

            {:else if selectedNode.type === 'skill'}
                <div class="space-y-3">
                    <div>
                        <label class="text-sm font-medium text-slate-600 dark:text-slate-400">技能名称</label>
                        <input 
                            type="text"
                            class="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                            placeholder="输入技能名称"
                            value={(selectedNode.data as SkillNodeData).skillName}
                            oninput={(e) => {
                                const val = e.currentTarget.value;
                                nodes = nodes.map(n => {
                                    if (n.id === selectedNodeId && n.type === 'skill') {
                                        return {
                                            ...n,
                                            data: { ...n.data, skillName: val, skillId: val }
                                        };
                                    }
                                    return n;
                                });
                            }}
                        />
                    </div>
                </div>
            {/if}

            <!-- 删除按钮 -->
            <button 
                onclick={() => deleteNode(selectedNode!.id)}
                class="w-full mt-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
                <Trash2 class="w-4 h-4" />
                删除节点
            </button>
        </div>
    {:else}
        <div class="w-72 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <div class="text-center text-slate-500 py-8">
                <p>点击节点查看配置</p>
            </div>
        </div>
    {/if}
</div>
{/if}
