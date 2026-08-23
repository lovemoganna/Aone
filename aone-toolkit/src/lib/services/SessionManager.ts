/**
 * 会话管理服务 (Session Manager)
 * 负责会话的创建、存储、摘要和历史管理
 */

import { browser } from '$app/environment';
import type { Session, Message } from '$lib/stores/agentStore.svelte';

interface SessionSummary {
    id: string;
    title: string;
    overview: string;
    keyInsights: string[];
    actionItems: string[];
    agentsUsed: string[];
    createdAt: number;
}

const STORAGE_KEY = 'agent_studio_sessions';
const MAX_SESSIONS = 100;

export class SessionManager {
    private sessions: Map<string, Session> = new Map();

    constructor() {
        if (browser) {
            this.loadFromStorage();
        }
    }

    /**
     * 创建新会话
     */
    createSession(title: string = '新会话'): Session {
        const session: Session = {
            id: this.generateId(),
            title,
            messages: [],
            activeAgentIds: [],
            round: 0
        };
        this.sessions.set(session.id, session);
        this.saveToStorage();
        return session;
    }

    /**
     * 获取会话
     */
    getSession(id: string): Session | undefined {
        return this.sessions.get(id);
    }

    /**
     * 获取所有会话
     */
    getAllSessions(): Session[] {
        return Array.from(this.sessions.values())
            .sort((a, b) => {
                const aTime = a.messages[0]?.timestamp || 0;
                const bTime = b.messages[0]?.timestamp || 0;
                return bTime - aTime;
            });
    }

    /**
     * 添加消息到会话
     */
    addMessage(sessionId: string, message: Omit<Message, 'id' | 'timestamp'>): Message {
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error('Session not found');

        const fullMessage: Message = {
            ...message,
            id: this.generateId(),
            timestamp: Date.now()
        };

        session.messages.push(fullMessage);
        
        // 自动更新标题
        if (session.messages.length === 2 && session.title === '新会话') {
            const userMsg = session.messages.find(m => m.role === 'user');
            if (userMsg) {
                session.title = this.generateTitle(userMsg.content);
            }
        }

        this.saveToStorage();
        return fullMessage;
    }

    /**
     * 生成会话摘要
     */
    generateSummary(sessionId: string): SessionSummary {
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error('Session not found');

        const userMessages = session.messages.filter(m => m.role === 'user');
        const assistantMessages = session.messages.filter(m => m.role === 'assistant');

        // 提取关键洞察
        const keyInsights = this.extractKeyInsights(assistantMessages);
        
        // 提取行动项
        const actionItems = this.extractActionItems(assistantMessages);

        return {
            id: session.id,
            title: session.title,
            overview: this.generateOverview(userMessages, assistantMessages),
            keyInsights,
            actionItems,
            agentsUsed: [...new Set(session.messages.map(m => m.agentId).filter(Boolean))] as string[],
            createdAt: session.messages[0]?.timestamp || Date.now()
        };
    }

    /**
     * 提取关键洞察
     */
    private extractKeyInsights(messages: Message[]): string[] {
        const insights: string[] = [];
        
        for (const msg of messages) {
            // 查找包含"关键"、"重点"、"值得注意的是"等关键词的句子
            const lines = msg.content.split('\n');
            for (const line of lines) {
                if (line.includes('关键') || line.includes('重点') || line.includes('值得注意的是')) {
                    insights.push(line.trim());
                    if (insights.length >= 5) break;
                }
            }
            if (insights.length >= 5) break;
        }

        return insights;
    }

    /**
     * 提取行动项
     */
    private extractActionItems(messages: Message[]): string[] {
        const items: string[] = [];
        
        for (const msg of messages) {
            // 查找包含数字序号的行（常见于清单）
            const lines = msg.content.split('\n');
            for (const line of lines) {
                if (/^\d+[.、]/.test(line.trim())) {
                    items.push(line.trim());
                    if (items.length >= 5) break;
                }
            }
            if (items.length >= 5) break;
        }

        return items;
    }

    /**
     * 生成概述
     */
    private generateOverview(userMsgs: Message[], assistantMsgs: Message[]): string {
        if (userMsgs.length === 0) return '空白会话';
        
        const lastUserMsg = userMsgs[userMsgs.length - 1];
        const preview = lastUserMsg.content.slice(0, 50);
        
        return `关于「${preview}...」的讨论，共 ${assistantMsgs.length} 轮对话`;
    }

    /**
     * 删除会话
     */
    deleteSession(id: string): boolean {
        const result = this.sessions.delete(id);
        if (result) {
            this.saveToStorage();
        }
        return result;
    }

    /**
     * 搜索会话
     */
    search(query: string): Session[] {
        const q = query.toLowerCase();
        return this.getAllSessions().filter(session => {
            if (session.title.toLowerCase().includes(q)) return true;
            return session.messages.some(m => m.content.toLowerCase().includes(q));
        });
    }

    /**
     * 从存储加载
     */
    private loadFromStorage(): void {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                this.sessions = new Map(parsed);
            }
        } catch (e) {
            console.error('Failed to load sessions:', e);
        }
    }

    /**
     * 保存到存储
     */
    private saveToStorage(): void {
        try {
            // 限制保存的会话数量
            const sessionsArray = this.getAllSessions().slice(0, MAX_SESSIONS);
            this.sessions = new Map(sessionsArray.map(s => [s.id, s]));
            
            const data = JSON.stringify(Array.from(this.sessions.entries()));
            localStorage.setItem(STORAGE_KEY, data);
        } catch (e) {
            console.error('Failed to save sessions:', e);
        }
    }

    /**
     * 生成唯一ID
     */
    private generateId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 生成标题
     */
    private generateTitle(content: string): string {
        // 取前30个字符
        const truncated = content.slice(0, 30);
        return truncated + (content.length > 30 ? '...' : '');
    }
}

export const sessionManager = new SessionManager();

export default SessionManager;
