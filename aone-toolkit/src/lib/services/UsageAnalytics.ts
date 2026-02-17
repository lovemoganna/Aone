/**
 * 使用统计服务 (Usage Analytics)
 * 追踪和分析用户使用行为
 */

import { browser } from '$app/environment';
import type { UsageStats } from '../agents/feature-enhancements';

const STATS_KEY = 'agent_studio_usage_stats';

interface DailyStats {
    date: string;
    sessions: number;
    messages: number;
    agentUsage: Record<string, number>;
    skillUsage: Record<string, number>;
}

export class UsageAnalytics {
    private dailyStats: Map<string, DailyStats> = new Map();
    private currentDate: string;

    constructor() {
        this.currentDate = this.getDateString(new Date());
        if (browser) {
            this.loadFromStorage();
        }
    }

    /**
     * 记录一次会话开始
     */
    recordSessionStart(): void {
        this.ensureTodayExists();
        const today = this.dailyStats.get(this.currentDate)!;
        today.sessions++;
        this.saveToStorage();
    }

    /**
     * 记录一条消息
     */
    recordMessage(agentId?: string, skillId?: string): void {
        this.ensureTodayExists();
        const today = this.dailyStats.get(this.currentDate)!;
        today.messages++;
        
        if (agentId) {
            today.agentUsage[agentId] = (today.agentUsage[agentId] || 0) + 1;
        }
        
        if (skillId) {
            today.skillUsage[skillId] = (today.skillUsage[skillId] || 0) + 1;
        }
        
        this.saveToStorage();
    }

    /**
     * 获取统计概览
     */
    getStats(): UsageStats {
        const sessions = this.getAllTime('sessions');
        const messages = this.getAllTime('messages');
        const agentUsage = this.aggregateAgentUsage();
        const skillUsage = this.aggregateSkillUsage();
        
        // 计算平均会话长度
        const avgLength = sessions > 0 ? Math.round(messages / sessions) : 0;
        
        // 计算高峰使用时段
        const peakHours = this.calculatePeakHours();

        return {
            totalSessions: sessions,
            totalMessages: messages,
            agentUsageCount: agentUsage,
            skillUsageCount: skillUsage,
            averageSessionLength: avgLength,
            peakUsageHours: peakHours
        };
    }

    /**
     * 获取过去N天的统计
     */
    getStatsForDays(days: number): DailyStats[] {
        const result: DailyStats[] = [];
        const now = new Date();
        
        for (let i = 0; i < days; i++) {
            const date = this.getDateString(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
            const stats = this.dailyStats.get(date);
            if (stats) {
                result.push(stats);
            } else {
                result.push({
                    date,
                    sessions: 0,
                    messages: 0,
                    agentUsage: {},
                    skillUsage: {}
                });
            }
        }
        
        return result.reverse();
    }

    /**
     * 获取 Agent 使用排行
     */
    getAgentRanking(): { agentId: string; count: number; percentage: number }[] {
        const agentUsage = this.aggregateAgentUsage();
        const total = Object.values(agentUsage).reduce((a, b) => a + b, 0);
        
        return Object.entries(agentUsage)
            .map(([agentId, count]) => ({
                agentId,
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0
            }))
            .sort((a, b) => b.count - a.count);
    }

    /**
     * 清除所有统计数据
     */
    clearStats(): void {
        this.dailyStats.clear();
        this.saveToStorage();
    }

    /**
     * 确保当天统计存在
     */
    private ensureTodayExists(): void {
        if (!this.dailyStats.has(this.currentDate)) {
            this.dailyStats.set(this.currentDate, {
                date: this.currentDate,
                sessions: 0,
                messages: 0,
                agentUsage: {},
                skillUsage: {}
            });
        }
    }

    /**
     * 聚合所有时间的统计数据
     */
    private getAllTime(field: 'sessions' | 'messages'): number {
        let total = 0;
        for (const stats of this.dailyStats.values()) {
            total += stats[field];
        }
        return total;
    }

    /**
     * 聚合 Agent 使用统计
     */
    private aggregateAgentUsage(): Record<string, number> {
        const result: Record<string, number> = {};
        
        for (const stats of this.dailyStats.values()) {
            for (const [agentId, count] of Object.entries(stats.agentUsage)) {
                result[agentId] = (result[agentId] || 0) + count;
            }
        }
        
        return result;
    }

    /**
     * 聚合 Skill 使用统计
     */
    private aggregateSkillUsage(): Record<string, number> {
        const result: Record<string, number> = {};
        
        for (const stats of this.dailyStats.values()) {
            for (const [skillId, count] of Object.entries(stats.skillUsage)) {
                result[skillId] = (result[skillId] || 0) + count;
            }
        }
        
        return result;
    }

    /**
     * 计算高峰使用时段（简化版：基于当前小时）
     */
    private calculatePeakHours(): number[] {
        // 简化实现：返回常见的高峰时段
        return [9, 10, 14, 15, 20, 21];
    }

    /**
     * 获取日期字符串
     */
    private getDateString(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    /**
     * 从存储加载
     */
    private loadFromStorage(): void {
        try {
            const data = localStorage.getItem(STATS_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                this.dailyStats = new Map(parsed);
            }
        } catch (e) {
            console.error('Failed to load usage stats:', e);
        }
    }

    /**
     * 保存到存储
     */
    private saveToStorage(): void {
        try {
            const data = JSON.stringify(Array.from(this.dailyStats.entries()));
            localStorage.setItem(STATS_KEY, data);
        } catch (e) {
            console.error('Failed to save usage stats:', e);
        }
    }
}

export const usageAnalytics = new UsageAnalytics();

export default UsageAnalytics;
