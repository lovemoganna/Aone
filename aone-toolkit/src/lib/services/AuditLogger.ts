/**
 * 审计日志服务 (Audit Logger)
 * 记录所有操作以满足合规要求
 */

import { browser } from '$app/environment';
import type { AuditLog } from '../agents/feature-enhancements';

const AUDIT_KEY = 'agent_studio_audit_log';
const MAX_LOGS = 1000;

export class AuditLogger {
    private logs: AuditLog[] = [];

    constructor() {
        if (browser) {
            this.loadFromStorage();
        }
    }

    /**
     * 记录操作
     */
    log(action: string, details: Record<string, any> = {}): AuditLog {
        const entry: AuditLog = {
            id: this.generateId(),
            action,
            userId: this.getCurrentUserId(),
            timestamp: Date.now(),
            details
        };

        this.logs.unshift(entry);
        
        // 限制日志数量
        if (this.logs.length > MAX_LOGS) {
            this.logs = this.logs.slice(0, MAX_LOGS);
        }
        
        this.saveToStorage();
        
        return entry;
    }

    /**
     * 获取所有日志
     */
    getAll(): AuditLog[] {
        return [...this.logs];
    }

    /**
     * 获取指定时间范围的日志
     */
    getByTimeRange(startTime: number, endTime: number): AuditLog[] {
        return this.logs.filter(log => 
            log.timestamp >= startTime && log.timestamp <= endTime
        );
    }

    /**
     * 获取指定操作的日志
     */
    getByAction(action: string): AuditLog[] {
        return this.logs.filter(log => log.action === action);
    }

    /**
     * 搜索日志
     */
    search(query: string): AuditLog[] {
        const q = query.toLowerCase();
        return this.logs.filter(log => 
            log.action.toLowerCase().includes(q) ||
            JSON.stringify(log.details).toLowerCase().includes(q)
        );
    }

    /**
     * 获取最近的日志
     */
    getRecent(count: number): AuditLog[] {
        return this.logs.slice(0, count);
    }

    /**
     * 导出日志
     */
    export(format: 'json' | 'csv' = 'json'): string {
        if (format === 'csv') {
            const headers = ['ID', 'Action', 'User', 'Timestamp', 'Details'];
            const rows = this.logs.map(log => [
                log.id,
                log.action,
                log.userId,
                new Date(log.timestamp).toISOString(),
                JSON.stringify(log.details)
            ]);
            return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        }
        return JSON.stringify(this.logs, null, 2);
    }

    /**
     * 清除日志
     */
    clear(): void {
        this.logs = [];
        this.saveToStorage();
    }

    /**
     * 获取当前用户ID（简化实现）
     */
    private getCurrentUserId(): string {
        return 'user_local';
    }

    /**
     * 从存储加载
     */
    private loadFromStorage(): void {
        try {
            const data = localStorage.getItem(AUDIT_KEY);
            if (data) {
                this.logs = JSON.parse(data);
            }
        } catch (e) {
            console.error('Failed to load audit logs:', e);
        }
    }

    /**
     * 保存到存储
     */
    private saveToStorage(): void {
        try {
            localStorage.setItem(AUDIT_KEY, JSON.stringify(this.logs));
        } catch (e) {
            console.error('Failed to save audit logs:', e);
        }
    }

    /**
     * 生成唯一ID
     */
    private generateId(): string {
        return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

export const auditLogger = new AuditLogger();

export default AuditLogger;
