/**
 * 工作流依赖分析与优化模块
 * 用于分析节点间的依赖关系并优化执行顺序
 */

import type { OrchestrationWorkflow, OrchestrationNode, OrchestrationEdge } from './types';

// ============== 依赖关系 ==============

export interface NodeDependency {
    nodeId: string;
    dependsOn: string[];  // 当前节点依赖的节点
    dependedBy: string[]; // 依赖当前节点的节点
}

// ============== 可执行层 ==============

export interface ExecutableLayer {
    layer: number;
    nodeIds: string[];
    canParallel: boolean;
}

// ============== 依赖分析器 ==============

export class WorkflowDependencyAnalyzer {
    /**
     * 构建完整的依赖图
     */
    buildDependencyGraph(workflow: OrchestrationWorkflow): Map<string, NodeDependency> {
        const dependencies = new Map<string, NodeDependency>();
        const nodeIds = new Set(workflow.nodes.map(n => n.id));
        
        // 初始化所有节点
        for (const node of workflow.nodes) {
            dependencies.set(node.id, {
                nodeId: node.id,
                dependsOn: [],
                dependedBy: []
            });
        }
        
        // 分析边的依赖关系
        for (const edge of workflow.edges) {
            const source = dependencies.get(edge.source);
            const target = dependencies.get(edge.target);
            
            if (source && target) {
                // target 依赖于 source
                target.dependsOn.push(edge.source);
                // source 被 target 依赖
                source.dependedBy.push(edge.target);
            }
        }
        
        return dependencies;
    }
    
    /**
     * 拓扑排序 - 将节点分成多个可并行执行的层
     */
    topologicalSort(workflow: OrchestrationWorkflow): ExecutableLayer[] {
        const dependencies = this.buildDependencyGraph(workflow);
        const layers: ExecutableLayer[] = [];
        
        // 复制依赖状态
        const inDegree = new Map<string, number>();
        for (const [nodeId, dep] of dependencies) {
            inDegree.set(nodeId, dep.dependsOn.length);
        }
        
        let layerNum = 0;
        
        while (inDegree.size > 0) {
            // 找出所有入度为 0 的节点（没有依赖）
            const readyNodes: string[] = [];
            
            for (const [nodeId, degree] of inDegree) {
                if (degree === 0) {
                    readyNodes.push(nodeId);
                }
            }
            
            if (readyNodes.length === 0) {
                // 存在循环依赖，选择任意一个继续
                const remaining = Array.from(inDegree.keys());
                if (remaining.length === 0) break;
                
                console.warn('Circular dependency detected, breaking arbitrarily');
                readyNodes.push(remaining[0]);
            }
            
            // 当前层的节点可以并行执行
            layers.push({
                layer: layerNum,
                nodeIds: readyNodes,
                canParallel: readyNodes.length > 1
            });
            
            // 从依赖图中移除这些节点
            for (const nodeId of readyNodes) {
                inDegree.delete(nodeId);
                
                // 更新依赖当前节点的节点
                const dep = dependencies.get(nodeId);
                if (dep) {
                    for (const dependentId of dep.dependedBy) {
                        const currentDegree = inDegree.get(dependentId);
                        if (currentDegree !== undefined) {
                            inDegree.set(dependentId, currentDegree - 1);
                        }
                    }
                }
            }
            
            layerNum++;
        }
        
        return layers;
    }
    
    /**
     * 找出可以并行执行的节点组
     */
    findParallelGroups(workflow: OrchestrationWorkflow): string[][] {
        const layers = this.topologicalSort(workflow);
        
        return layers
            .filter(layer => layer.canParallel)
            .map(layer => layer.nodeIds);
    }
    
    /**
     * 计算关键路径（最长执行路径）
     */
    calculateCriticalPath(
        workflow: OrchestrationWorkflow,
        nodeDurations: Map<string, number>
    ): { path: string[]; totalDuration: number } {
        const layers = this.topologicalSort(workflow);
        
        // 计算每个节点的最早完成时间
        const earliestFinish = new Map<string, number>();
        const criticalPath = new Map<string, string | null>();
        
        for (const layer of layers) {
            for (const nodeId of layer.nodeIds) {
                const duration = nodeDurations.get(nodeId) || 1000; // 默认 1 秒
                
                // 获取依赖节点的最大完成时间
                const dependencies = this.buildDependencyGraph(workflow).get(nodeId);
                let maxPrevFinish = 0;
                
                if (dependencies && dependencies.dependsOn.length > 0) {
                    for (const depId of dependencies.dependsOn) {
                        const finish = earliestFinish.get(depId) || 0;
                        maxPrevFinish = Math.max(maxPrevFinish, finish);
                    }
                }
                
                earliestFinish.set(nodeId, maxPrevFinish + duration);
                
                // 记录前驱节点
                let prevNode: string | null = null;
                let maxPrevTime = 0;
                if (dependencies && dependencies.dependsOn.length > 0) {
                    for (const depId of dependencies.dependsOn) {
                        const finish = earliestFinish.get(depId) || 0;
                        if (finish > maxPrevTime) {
                            maxPrevTime = finish;
                            prevNode = depId;
                        }
                    }
                }
                criticalPath.set(nodeId, prevNode);
            }
        }
        
        // 找出关键路径
        let maxFinish = 0;
        let endNode: string | null = null;
        
        for (const [nodeId, finish] of earliestFinish) {
            if (finish > maxFinish) {
                maxFinish = finish;
                endNode = nodeId;
            }
        }
        
        // 回溯关键路径
        const path: string[] = [];
        let current: string | null = endNode;
        
        while (current) {
            path.unshift(current);
            current = criticalPath.get(current) || null;
        }
        
        return {
            path,
            totalDuration: maxFinish
        };
    }
    
    /**
     * 估算优化后的执行时间
     */
    estimateOptimizedDuration(
        workflow: OrchestrationWorkflow,
        nodeDurations: Map<string, number>
    ): number {
        const layers = this.topologicalSort(workflow);
        let totalTime = 0;
        
        for (const layer of layers) {
            // 取当前层中执行时间最长的节点
            let maxDuration = 0;
            for (const nodeId of layer.nodeIds) {
                maxDuration = Math.max(maxDuration, nodeDurations.get(nodeId) || 1000);
            }
            totalTime += maxDuration;
        }
        
        return totalTime;
    }
    
    /**
     * 计算时间节省
     */
    calculateTimeSavings(
        workflow: OrchestrationWorkflow,
        nodeDurations: Map<string, number>
    ): { original: number; optimized: number; savings: number; percentage: number } {
        // 原始时间（顺序执行）
        let original = 0;
        for (const duration of nodeDurations.values()) {
            original += duration;
        }
        
        // 优化后的时间
        const optimized = this.estimateOptimizedDuration(workflow, nodeDurations);
        
        const savings = original - optimized;
        const percentage = original > 0 ? (savings / original) * 100 : 0;
        
        return {
            original,
            optimized,
            savings,
            percentage
        };
    }
}

// 导出单例
export const workflowDependencyAnalyzer = new WorkflowDependencyAnalyzer();
export default workflowDependencyAnalyzer;
