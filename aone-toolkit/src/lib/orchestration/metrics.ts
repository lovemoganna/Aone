/**
 * 编排效果指标收集器
 * 量化评估编排效果，提供优化建议
 */

import { browser } from '$app/environment';
import type { OrchestrationSession } from './execution-state';
import { executionStateManager } from './execution-state';
import { agentRegistry } from '../agents/registry';
import { skillRegistry } from '../skills';

// ============== 编排指标 ==============

export interface OrchestrationMetrics {
    // 会话级指标
    sessionMetrics: {
        totalSessions: number;
        completedSessions: number;
        failedSessions: number;
        pausedSessions: number;
        successRate: number;
        averageDuration: number;
        totalDuration: number;
    };
    
    // Agent 调用指标
    agentMetrics: Record<string, {
        invocationCount: number;
        successCount: number;
        failureCount: number;
        averageDuration: number;
        totalDuration: number;
    }>;
    
    // Skill 使用指标
    skillMetrics: Record<string, {
        usageCount: number;
        activationCount: number;
        effectivenessScore: number;
    }>;
    
    // 组合指标
    comboMetrics: Record<string, {
        agentIds: string[];
        skillIds: string[];
        usageCount: number;
        successRate: number;
        averageDuration: number;
    }>;
    
    // 时间范围
    dateRange: {
        start: number;
        end: number;
    };
}

// ============== 优化建议 ==============

export interface OptimizationSuggestion {
    // 建议类型
    type: 'agent' | 'skill' | 'workflow' | 'general';
    
    // 严重程度
    severity: 'info' | 'warning' | 'critical';
    
    // 标题
    title: string;
    
    // 描述
    description: string;
    
    // 具体建议
    recommendation: string;
    
    // 相关 ID
    relatedId?: string;
}

// ============== 指标收集器 ==============

class MetricsCollector {
    private storageKey = 'orchestration_metrics';
    private dailyMetrics: Map<string, DailyMetric> = new Map();
    
    constructor() {
        if (browser) {
            this.loadFromStorage();
        }
    }
    
    // 从 localStorage 加载
    private loadFromStorage(): void {
        if (!browser) return;
        
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const metrics = JSON.parse(data);
                this.dailyMetrics = new Map(Object.entries(metrics));
            }
        } catch (e) {
            console.error('Failed to load metrics from storage:', e);
        }
    }
    
    // 保存到 localStorage
    private saveToStorage(): void {
        if (!browser) return;
        
        try {
            const data = Object.fromEntries(this.dailyMetrics);
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save metrics to storage:', e);
        }
    }
    
    // 获取今日日期键
    private getTodayKey(): string {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
    
    // ============== 指标收集 ==============
    
    // 从会话收集指标
    collectFromSession(session: OrchestrationSession): void {
        const todayKey = this.getTodayKey();
        
        let dailyMetric = this.dailyMetrics.get(todayKey);
        if (!dailyMetric) {
            dailyMetric = this.createDailyMetric();
            this.dailyMetrics.set(todayKey, dailyMetric);
        }
        
        // 更新会话指标
        dailyMetric.sessionCount++;
        
        if (session.status === 'completed') {
            dailyMetric.completedCount++;
        } else if (session.status === 'failed') {
            dailyMetric.failedCount++;
        } else if (session.status === 'paused') {
            dailyMetric.pausedCount++;
        }
        
        // 从轨迹收集 Agent 和 Skill 指标
        for (const step of session.trajectory) {
            if (step.agentId) {
                const agentMetric = dailyMetric.agentMetrics.get(step.agentId) || {
                    invocationCount: 0,
                    successCount: 0,
                    failureCount: 0,
                    totalDuration: 0
                };
                
                agentMetric.invocationCount++;
                if (step.duration) {
                    agentMetric.totalDuration += step.duration;
                }
                if (step.error) {
                    agentMetric.failureCount++;
                } else {
                    agentMetric.successCount++;
                }
                
                dailyMetric.agentMetrics.set(step.agentId, agentMetric);
            }
            
            if (step.skillId) {
                const skillMetric = dailyMetric.skillMetrics.get(step.skillId) || {
                    usageCount: 0,
                    activationCount: 0
                };
                
                skillMetric.usageCount++;
                dailyMetric.skillMetrics.set(step.skillId, skillMetric);
            }
        }
        
        this.saveToStorage();
    }
    
    // 创建每日指标
    private createDailyMetric(): DailyMetric {
        return {
            date: this.getTodayKey(),
            sessionCount: 0,
            completedCount: 0,
            failedCount: 0,
            pausedCount: 0,
            agentMetrics: new Map(),
            skillMetrics: new Map()
        };
    }
    
    // ============== 指标计算 ==============
    
    // 获取完整指标
    getMetrics(dateRange?: { start: number; end: number }): OrchestrationMetrics {
        const sessions = executionStateManager.getAllSessions();
        
        // 过滤日期范围
        let filteredSessions = sessions;
        if (dateRange) {
            filteredSessions = sessions.filter(
                s => s.createdAt >= dateRange.start && s.createdAt <= dateRange.end
            );
        }
        
        // 计算会话指标
        const completed = filteredSessions.filter(s => s.status === 'completed').length;
        const failed = filteredSessions.filter(s => s.status === 'failed').length;
        
        const durations = filteredSessions
            .filter(s => s.result?.completedAt && s.createdAt)
            .map(s => s.result!.completedAt - s.createdAt);
        
        const averageDuration = durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0;
        
        // 计算 Agent 指标
        const agentMetrics: Record<string, any> = {};
        for (const session of filteredSessions) {
            for (const step of session.trajectory) {
                if (step.agentId) {
                    if (!agentMetrics[step.agentId]) {
                        agentMetrics[step.agentId] = {
                            invocationCount: 0,
                            successCount: 0,
                            failureCount: 0,
                            totalDuration: 0
                        };
                    }
                    
                    agentMetrics[step.agentId].invocationCount++;
                    if (step.duration) {
                        agentMetrics[step.agentId].totalDuration += step.duration;
                    }
                    if (step.error) {
                        agentMetrics[step.agentId].failureCount++;
                    } else {
                        agentMetrics[step.agentId].successCount++;
                    }
                }
            }
        }
        
        // 计算 Skill 指标
        const skillMetrics: Record<string, any> = {};
        for (const session of filteredSessions) {
            for (const step of session.trajectory) {
                if (step.skillId) {
                    if (!skillMetrics[step.skillId]) {
                        skillMetrics[step.skillId] = {
                            usageCount: 0,
                            activationCount: 0
                        };
                    }
                    
                    skillMetrics[step.skillId].usageCount++;
                }
            }
        }
        
        return {
            sessionMetrics: {
                totalSessions: filteredSessions.length,
                completedSessions: completed,
                failedSessions: failed,
                pausedSessions: filteredSessions.filter(s => s.status === 'paused').length,
                successRate: filteredSessions.length > 0 ? completed / filteredSessions.length : 0,
                averageDuration,
                totalDuration: durations.reduce((a, b) => a + b, 0)
            },
            agentMetrics,
            skillMetrics,
            comboMetrics: {},
            dateRange: dateRange || {
                start: Math.min(...filteredSessions.map(s => s.createdAt)),
                end: Math.max(...filteredSessions.map(s => s.createdAt))
            }
        };
    }
    
    // ============== 优化建议生成 ==============
    
    // 生成优化建议
    generateSuggestions(): OptimizationSuggestion[] {
        const suggestions: OptimizationSuggestion[] = [];
        const metrics = this.getMetrics();
        
        // 1. 检查低成功率的 Agent
        for (const [agentId, metric] of Object.entries(metrics.agentMetrics)) {
            const successRate = metric.successCount / metric.invocationCount;
            
            if (successRate < 0.5 && metric.invocationCount >= 3) {
                suggestions.push({
                    type: 'agent',
                    severity: 'warning',
                    title: `Agent "${agentId}" 成功率较低`,
                    description: `该 Agent 被调用 ${metric.invocationCount} 次，但成功率仅为 ${(successRate * 100).toFixed(0)}%`,
                    recommendation: '考虑检查该 Agent 的配置或替换为其他 Agent',
                    relatedId: agentId
                });
            }
        }
        
        // 2. 检查高频使用但低效的 Skills
        for (const [skillId, metric] of Object.entries(metrics.skillMetrics)) {
            if (metric.usageCount > 10) {
                const skill = skillRegistry.getById(skillId);
                suggestions.push({
                    type: 'skill',
                    severity: 'info',
                    title: `Skill "${skill?.name || skillId}" 使用频繁`,
                    description: `该 Skill 被使用了 ${metric.usageCount} 次`,
                    recommendation: '考虑将其加入模板以提高复用率',
                    relatedId: skillId
                });
            }
        }
        
        // 3. 检查会话完成率
        if (metrics.sessionMetrics.totalSessions > 0) {
            const completionRate = metrics.sessionMetrics.completedSessions / metrics.sessionMetrics.totalSessions;
            
            if (completionRate < 0.5) {
                suggestions.push({
                    type: 'general',
                    severity: 'critical',
                    title: '会话完成率较低',
                    description: `总共 ${metrics.sessionMetrics.totalSessions} 个会话，只有 ${metrics.sessionMetrics.completedSessions} 个成功完成`,
                    recommendation: '建议简化工作流或提供更多引导'
                });
            }
        }
        
        // 4. 检查未使用的 Agents
        const usedAgents = new Set(Object.keys(metrics.agentMetrics));
        const allAgents = agentRegistry.getAll();
        
        for (const agent of allAgents) {
            if (!usedAgents.has(agent.id)) {
                suggestions.push({
                    type: 'agent',
                    severity: 'info',
                    title: `Agent "${agent.name}" 未被使用`,
                    description: `该 Agent 存在但从未在编排中使用过`,
                    recommendation: '可以在相关场景中尝试使用该 Agent',
                    relatedId: agent.id
                });
            }
        }
        
        return suggestions;
    }
    
    // ============== 排行榜数据 ==============
    
    // 获取 Agent 使用排行
    getAgentLeaderboard(limit: number = 10): Array<{
        agent: { id: string; name: string };
        invocationCount: number;
        successRate: number;
        averageDuration: number;
    }> {
        const metrics = this.getMetrics();
        
        return Object.entries(metrics.agentMetrics)
            .map(([agentId, metric]) => ({
                agent: {
                    id: agentId,
                    name: agentRegistry.getById(agentId)?.name || agentId
                },
                invocationCount: metric.invocationCount,
                successRate: metric.invocationCount > 0 ? metric.successCount / metric.invocationCount : 0,
                averageDuration: metric.invocationCount > 0 ? metric.totalDuration / metric.invocationCount : 0
            }))
            .sort((a, b) => b.invocationCount - a.invocationCount)
            .slice(0, limit);
    }
    
    // 获取 Skill 使用排行
    getSkillLeaderboard(limit: number = 10): Array<{
        skill: { id: string; name: string };
        usageCount: number;
    }> {
        const metrics = this.getMetrics();
        
        return Object.entries(metrics.skillMetrics)
            .map(([skillId, metric]) => ({
                skill: {
                    id: skillId,
                    name: skillRegistry.getById(skillId)?.name || skillId
                },
                usageCount: metric.usageCount
            }))
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, limit);
    }
    
    // ============== 导出 ==============
    
    // 导出指标报告
    exportReport(): string {
        const metrics = this.getMetrics();
        const suggestions = this.generateSuggestions();
        
        return JSON.stringify({
            metrics,
            suggestions,
            exportedAt: Date.now()
        }, null, 2);
    }
    
    // 清空指标
    clearMetrics(): void {
        this.dailyMetrics.clear();
        this.saveToStorage();
    }
}

// ============== Daily Metric 类型 ==============

interface DailyMetric {
    date: string;
    sessionCount: number;
    completedCount: number;
    failedCount: number;
    pausedCount: number;
    agentMetrics: Map<string, {
        invocationCount: number;
        successCount: number;
        failureCount: number;
        totalDuration: number;
    }>;
    skillMetrics: Map<string, {
        usageCount: number;
        activationCount: number;
    }>;
}

// 导出单例
export const metricsCollector = new MetricsCollector();
export default metricsCollector;
