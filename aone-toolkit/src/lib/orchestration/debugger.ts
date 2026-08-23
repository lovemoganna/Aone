/**
 * 实时编排调试器
 * 提供编排执行过程的实时监控和调试能力
 */

import type { OrchestrationWorkflow, ExecutionContext } from './types';

// ============== 调试快照 ==============

export interface DebugSnapshot {
    // 时间戳
    timestamp: number;

    // 执行 ID
    executionId: string;

    // 全局状态
    globalState: {
        variables: Record<string, any>;
        activeNodes: string[];
        completedNodes: string[];
        pendingNodes: string[];
    };

    // 节点状态
    nodeStates: Record<string, NodeState>;

    // 消息流
    messages: DebugMessage[];
}

// ============== 节点状态 ==============

export interface NodeState {
    // 节点 ID
    nodeId: string;

    // 节点名称
    nodeName: string;

    // 节点类型
    nodeType: 'agent' | 'skill' | 'condition' | 'parallel';

    // 状态
    status: 'pending' | 'running' | 'completed' | 'error' | 'skipped';

    // 输入
    input?: any;

    // 输出
    output?: any;

    // 错误信息
    error?: string;

    // 持续时间
    duration?: number;

    // 开始时间
    startTime?: number;

    // 结束时间
    endTime?: number;
}

// ============== 调试消息 ==============

export interface DebugMessage {
    // 消息 ID
    id: string;

    // 源节点
    from: string;

    // 目标节点
    to: string;

    // 消息类型
    type: 'input' | 'output' | 'error' | 'control' | 'data';

    // 内容
    content: any;

    // 时间戳
    timestamp: number;
}

// ============== 诊断结果 ==============

export interface DiagnosisResult {
    // 问题类型
    problemType: 'node_error' | 'flow_error' | 'data_error' | 'timeout' | 'unknown';

    // 严重程度
    severity: 'error' | 'warning' | 'info';

    // 问题描述
    description: string;

    // 可能原因
    possibleCauses: string[];

    // 修复建议
    suggestions: string[];

    // 相关节点
    relatedNodes: string[];
}

// ============== 实时调试器 ==============

class OrchestrationDebugger {
    private snapshots: Map<string, DebugSnapshot[]> = new Map();
    private currentExecutionId: string | null = null;
    private listeners: Set<(snapshot: DebugSnapshot) => void> = new Set();

    // ============== 调试会话管理 ==============

    // 开始调试会话
    startDebugSession(executionId: string): void {
        this.currentExecutionId = executionId;
        this.snapshots.set(executionId, []);
    }

    // 结束调试会话
    endDebugSession(executionId: string): DebugSnapshot[] {
        const snapshots = this.snapshots.get(executionId) || [];
        this.snapshots.delete(executionId);

        if (this.currentExecutionId === executionId) {
            this.currentExecutionId = null;
        }

        return snapshots;
    }

    // 获取当前会话快照
    getSnapshots(executionId: string): DebugSnapshot[] {
        return this.snapshots.get(executionId) || [];
    }

    // ============== 快照捕获 ==============

    // 捕获快照
    captureSnapshot(
        executionId: string,
        globalState: DebugSnapshot['globalState'],
        nodeStates: DebugSnapshot['nodeStates']
    ): DebugSnapshot {
        const snapshot: DebugSnapshot = {
            timestamp: Date.now(),
            executionId,
            globalState,
            nodeStates,
            messages: []
        };

        // 存储快照
        const snapshots = this.snapshots.get(executionId) || [];
        snapshots.push(snapshot);
        this.snapshots.set(executionId, snapshots);

        // 通知监听器
        this.notifyListeners(snapshot);

        return snapshot;
    }

    // 记录节点开始
    recordNodeStart(
        executionId: string,
        nodeId: string,
        nodeName: string,
        nodeType: 'agent' | 'skill' | 'condition' | 'parallel',
        input?: any
    ): void {
        const snapshot = this.getOrCreateLatestSnapshot(executionId);

        snapshot.nodeStates[nodeId] = {
            nodeId,
            nodeName,
            nodeType,
            status: 'running',
            input,
            startTime: Date.now()
        };
    }

    // 记录节点完成
    recordNodeComplete(
        executionId: string,
        nodeId: string,
        output?: any
    ): void {
        const snapshot = this.getOrCreateLatestSnapshot(executionId);
        const nodeState = snapshot.nodeStates[nodeId];

        if (nodeState) {
            nodeState.status = 'completed';
            nodeState.output = output;
            nodeState.endTime = Date.now();
            nodeState.duration = nodeState.endTime - (nodeState.startTime || 0);

            // 更新全局状态
            snapshot.globalState.completedNodes.push(nodeId);
            snapshot.globalState.activeNodes = snapshot.globalState.activeNodes.filter(
                id => id !== nodeId
            );
        }
    }

    // 记录节点错误
    recordNodeError(
        executionId: string,
        nodeId: string,
        error: string
    ): void {
        const snapshot = this.getOrCreateLatestSnapshot(executionId);
        const nodeState = snapshot.nodeStates[nodeId];

        if (nodeState) {
            nodeState.status = 'error';
            nodeState.error = error;
            nodeState.endTime = Date.now();
            nodeState.duration = nodeState.endTime - (nodeState.startTime || 0);
        }
    }

    // 记录消息
    recordMessage(
        executionId: string,
        from: string,
        to: string,
        type: DebugMessage['type'],
        content: any
    ): void {
        const snapshot = this.getOrCreateLatestSnapshot(executionId);

        snapshot.messages.push({
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            from,
            to,
            type,
            content,
            timestamp: Date.now()
        });
    }

    // 获取或创建最新快照
    private getOrCreateLatestSnapshot(executionId: string): DebugSnapshot {
        let snapshots = this.snapshots.get(executionId);

        if (!snapshots || snapshots.length === 0) {
            snapshots = [];
            this.snapshots.set(executionId, snapshots);
        }

        let latest = snapshots[snapshots.length - 1];

        if (!latest || !latest.globalState) {
            latest = {
                timestamp: Date.now(),
                executionId,
                globalState: {
                    variables: {},
                    activeNodes: [],
                    completedNodes: [],
                    pendingNodes: []
                },
                nodeStates: {},
                messages: []
            };
            snapshots.push(latest);
        }

        return latest;
    }

    // ============== 实时监听 ==============

    // 添加监听器
    addListener(callback: (snapshot: DebugSnapshot) => void): () => void {
        this.listeners.add(callback);

        // 返回移除监听器的函数
        return () => {
            this.listeners.delete(callback);
        };
    }

    // 通知监听器
    private notifyListeners(snapshot: DebugSnapshot): void {
        for (const listener of this.listeners) {
            try {
                listener(snapshot);
            } catch (e) {
                console.error('Debug listener error:', e);
            }
        }
    }

    // ============== 问题诊断 ==============

    // 诊断问题
    diagnose(snapshot: DebugSnapshot): DiagnosisResult {
        // 1. 检查错误节点
        for (const [nodeId, nodeState] of Object.entries(snapshot.nodeStates)) {
            if (nodeState.status === 'error') {
                return this.diagnoseNodeError(nodeId, nodeState, snapshot);
            }
        }

        // 2. 检查卡住的节点
        const runningNodes = Object.values(snapshot.nodeStates).filter(
            n => n.status === 'running'
        );

        if (runningNodes.length > 0) {
            const now = Date.now();
            for (const node of runningNodes) {
                if (node.startTime && now - node.startTime > 60000) { // 超过1分钟
                    return {
                        problemType: 'timeout',
                        severity: 'warning',
                        description: `节点 "${node.nodeName}" 运行超过1分钟，可能存在性能问题`,
                        possibleCauses: [
                            'Agent 响应超时',
                            '网络延迟',
                            'Skill 执行时间过长'
                        ],
                        suggestions: [
                            '考虑增加超时时间',
                            '检查 Agent 状态',
                            '优化 Skill 执行逻辑'
                        ],
                        relatedNodes: [node.nodeId]
                    };
                }
            }
        }

        // 3. 检查数据流问题
        const pendingNodes = snapshot.globalState.pendingNodes;
        const completedNodes = snapshot.globalState.completedNodes;

        if (pendingNodes.length > 0 && completedNodes.length > 0) {
            // 检查是否有孤立节点
            const hasFlow = pendingNodes.some(pendingId =>
                completedNodes.some(completedId =>
                    this.isRelated(completedId, pendingId, snapshot)
                )
            );

            if (!hasFlow) {
                return {
                    problemType: 'flow_error',
                    severity: 'warning',
                    description: '工作流可能存在断点',
                    possibleCauses: [
                        '条件节点判断错误',
                        '并行节点未正确汇合',
                        '边连接配置错误'
                    ],
                    suggestions: [
                        '检查条件分支逻辑',
                        '验证并行节点的合并策略',
                        '查看节点连接配置'
                    ],
                    relatedNodes: [...pendingNodes, ...completedNodes]
                };
            }
        }

        return {
            problemType: 'unknown',
            severity: 'info',
            description: '未发现问题',
            possibleCauses: [],
            suggestions: [],
            relatedNodes: []
        };
    }

    // 诊断节点错误
    private diagnoseNodeError(
        nodeId: string,
        nodeState: NodeState,
        snapshot: DebugSnapshot
    ): DiagnosisResult {
        const error = nodeState.error || 'Unknown error';

        // 根据错误类型提供诊断
        const possibleCauses: string[] = [];
        const suggestions: string[] = [];

        if (error.includes('not found')) {
            possibleCauses.push('引用的资源不存在');
            suggestions.push('检查资源 ID 是否正确');
        } else if (error.includes('timeout')) {
            possibleCauses.push('执行超时');
            suggestions.push('增加超时时间或优化执行逻辑');
        } else if (error.includes('permission') || error.includes('auth')) {
            possibleCauses.push('权限或认证问题');
            suggestions.push('检查 API 密钥和权限配置');
        } else if (error.includes('memory')) {
            possibleCauses.push('内存不足');
            suggestions.push('优化数据处理逻辑，减少内存占用');
        } else {
            possibleCauses.push('未知错误');
            suggestions.push('查看详细错误信息');
        }

        // 检查输入数据
        if (!nodeState.input) {
            possibleCauses.push('节点输入为空');
            suggestions.push('检查上游节点的输出配置');
        }

        return {
            problemType: 'node_error',
            severity: 'error',
            description: `节点 "${nodeState.nodeName}" 执行失败: ${error}`,
            possibleCauses,
            suggestions,
            relatedNodes: [nodeId]
        };
    }

    // 判断节点是否相关
    private isRelated(nodeId1: string, nodeId2: string, snapshot: DebugSnapshot): boolean {
        // 简化实现：检查消息流
        return snapshot.messages.some(
            msg => (msg.from === nodeId1 && msg.to === nodeId2) ||
                (msg.from === nodeId2 && msg.to === nodeId1)
        );
    }

    // ============== 可视化数据导出 ==============

    // 导出时间线数据
    exportTimelineData(executionId: string): Array<{
        time: number;
        nodeId: string;
        nodeName: string;
        event: string;
        status: string;
    }> {
        const snapshots = this.snapshots.get(executionId) || [];
        const timeline: Array<any> = [];

        for (const snapshot of snapshots) {
            for (const [nodeId, nodeState] of Object.entries(snapshot.nodeStates)) {
                if (nodeState.startTime) {
                    timeline.push({
                        time: nodeState.startTime,
                        nodeId,
                        nodeName: nodeState.nodeName,
                        event: 'started',
                        status: 'running'
                    });
                }

                if (nodeState.endTime) {
                    timeline.push({
                        time: nodeState.endTime,
                        nodeId,
                        nodeName: nodeState.nodeName,
                        event: nodeState.error ? 'error' : 'completed',
                        status: nodeState.status
                    });
                }
            }
        }

        return timeline.sort((a, b) => a.time - b.time);
    }

    // 导出数据流数据（用于可视化）
    exportFlowData(executionId: string): {
        nodes: Array<{
            id: string;
            label: string;
            type: string;
            status: string;
        }>;
        links: Array<{
            source: string;
            target: string;
            type: string;
        }>;
    } {
        const snapshots = this.snapshots.get(executionId) || [];
        const latestSnapshot = snapshots[snapshots.length - 1];

        if (!latestSnapshot) {
            return { nodes: [], links: [] };
        }

        const nodes = Object.values(latestSnapshot.nodeStates).map(state => ({
            id: state.nodeId,
            label: state.nodeName,
            type: state.nodeType,
            status: state.status
        }));

        const links = latestSnapshot.messages.map(msg => ({
            source: msg.from,
            target: msg.to,
            type: msg.type
        }));

        return { nodes, links };
    }
}

// ============== 性能监控 ==============

export interface PerformanceMetric {
    nodeId: string;
    nodeName: string;
    duration: number;
    startTime: number;
    endTime?: number;
    memoryUsage?: number;
    status: 'running' | 'completed' | 'error' | 'timeout';
}

export interface PerformanceAlert {
    id: string;
    type: 'timeout' | 'error' | 'slow' | 'memory';
    severity: 'info' | 'warning' | 'critical';
    nodeId: string;
    message: string;
    timestamp: number;
    threshold?: number;
    actual?: number;
}

export interface AlertRule {
    id: string;
    type: 'timeout' | 'error_rate' | 'memory' | 'duration';
    threshold: number;
    enabled: boolean;
    severity: 'info' | 'warning' | 'critical';
}

// ============== 性能监控器 ==============

class PerformanceMonitor {
    private metrics: Map<string, PerformanceMetric[]> = new Map();
    private alerts: PerformanceAlert[] = [];
    private alertRules: AlertRule[] = [
        // 默认告警规则
        { id: 'default-timeout', type: 'timeout', threshold: 60000, enabled: true, severity: 'warning' },
        { id: 'default-duration', type: 'duration', threshold: 30000, enabled: true, severity: 'info' },
        { id: 'default-error', type: 'error_rate', threshold: 0.5, enabled: true, severity: 'critical' }
    ];
    private alertListeners: Set<(alert: PerformanceAlert) => void> = new Set();

    /**
     * 开始监控节点执行
     */
    startNodeMonitoring(executionId: string, nodeId: string, nodeName: string): void {
        const nodeMetrics = this.metrics.get(executionId) || [];

        nodeMetrics.push({
            nodeId,
            nodeName,
            duration: 0,
            startTime: Date.now(),
            status: 'running'
        });

        this.metrics.set(executionId, nodeMetrics);
    }

    /**
     * 结束节点执行
     */
    endNodeExecution(executionId: string, nodeId: string, status: 'completed' | 'error' | 'timeout', memoryUsage?: number): void {
        const nodeMetrics = this.metrics.get(executionId);
        if (!nodeMetrics) return;

        const metric = nodeMetrics.find(m => m.nodeId === nodeId && m.status === 'running');
        if (!metric) return;

        metric.endTime = Date.now();
        metric.duration = metric.endTime - metric.startTime;
        metric.status = status;
        metric.memoryUsage = memoryUsage;

        // 检查告警规则
        this.checkAlertRules(executionId, metric);
    }

    /**
     * 检查告警规则
     */
    private checkAlertRules(executionId: string, metric: PerformanceMetric): void {
        for (const rule of this.alertRules) {
            if (!rule.enabled) continue;

            let shouldAlert = false;
            let alertMessage = '';

            switch (rule.type) {
                case 'timeout':
                    if (metric.duration > rule.threshold) {
                        shouldAlert = true;
                        alertMessage = `Node execution timeout: ${metric.nodeName} took ${metric.duration}ms (threshold: ${rule.threshold}ms)`;
                    }
                    break;
                case 'duration':
                    if (metric.duration > rule.threshold) {
                        shouldAlert = true;
                        alertMessage = `Slow execution: ${metric.nodeName} took ${metric.duration}ms`;
                    }
                    break;
                case 'error_rate':
                    if (metric.status === 'error') {
                        shouldAlert = true;
                        alertMessage = `Node error: ${metric.nodeName} failed`;
                    }
                    break;
            }

            if (shouldAlert) {
                const alert: PerformanceAlert = {
                    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: rule.type as any,
                    severity: rule.severity,
                    nodeId: metric.nodeId,
                    message: alertMessage,
                    timestamp: Date.now(),
                    threshold: rule.threshold,
                    actual: metric.duration
                };

                this.alerts.push(alert);
                this.notifyAlertListeners(alert);
            }
        }
    }

    /**
     * 获取执行性能指标
     */
    getMetrics(executionId: string): PerformanceMetric[] {
        return this.metrics.get(executionId) || [];
    }

    /**
     * 获取告警列表
     */
    getAlerts(executionId?: string): PerformanceAlert[] {
        if (executionId) {
            return this.alerts.filter(a => this.metrics.has(executionId));
        }
        return [...this.alerts];
    }

    /**
     * 添加告警规则
     */
    addAlertRule(rule: AlertRule): void {
        this.alertRules.push(rule);
    }

    /**
     * 移除告警规则
     */
    removeAlertRule(ruleId: string): boolean {
        const index = this.alertRules.findIndex(r => r.id === ruleId);
        if (index !== -1) {
            this.alertRules.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * 获取告警规则
     */
    getAlertRules(): AlertRule[] {
        return [...this.alertRules];
    }

    /**
     * 清除执行指标
     */
    clearMetrics(executionId: string): void {
        this.metrics.delete(executionId);
    }

    /**
     * 清除告警
     */
    clearAlerts(): void {
        this.alerts = [];
    }

    /**
     * 添加告警监听器
     */
    addAlertListener(callback: (alert: PerformanceAlert) => void): () => void {
        this.alertListeners.add(callback);
        return () => this.alertListeners.delete(callback);
    }

    /**
     * 通知告警监听器
     */
    private notifyAlertListeners(alert: PerformanceAlert): void {
        for (const listener of this.alertListeners) {
            try {
                listener(alert);
            } catch (e) {
                console.error('Alert listener error:', e);
            }
        }
    }

    /**
     * 获取性能摘要
     */
    getPerformanceSummary(executionId: string): {
        totalNodes: number;
        completedNodes: number;
        failedNodes: number;
        totalDuration: number;
        averageDuration: number;
        maxDuration: number;
        alertCount: number;
    } {
        const nodeMetrics = this.metrics.get(executionId) || [];

        const completedNodes = nodeMetrics.filter(m => m.status === 'completed');
        const failedNodes = nodeMetrics.filter(m => m.status === 'error');

        const durations = nodeMetrics.map(m => m.duration).filter(d => d > 0);
        const totalDuration = durations.reduce((a, b) => a + b, 0);

        return {
            totalNodes: nodeMetrics.length,
            completedNodes: completedNodes.length,
            failedNodes: failedNodes.length,
            totalDuration,
            averageDuration: durations.length > 0 ? totalDuration / durations.length : 0,
            maxDuration: Math.max(...durations, 0),
            alertCount: this.alerts.length
        };
    }
}

// 导出性能监控器单例
export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;

// 导出单例
export const orchestrationDebugger = new OrchestrationDebugger();
