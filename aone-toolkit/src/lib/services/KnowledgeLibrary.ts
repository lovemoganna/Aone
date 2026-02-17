/**
 * 知识收藏库 (Knowledge Library)
 * 管理和沉淀有价值的对话内容
 */

import { browser } from '$app/environment';
import type { KnowledgeItem } from '../agents/feature-enhancements';

const KNOWLEDGE_KEY = 'agent_studio_knowledge';

export class KnowledgeLibrary {
    private items: Map<string, KnowledgeItem> = new Map();

    constructor() {
        if (browser) {
            this.loadFromStorage();
        }
    }

    /**
     * 收藏内容
     */
    add(content: string, source: string, tags: string[] = [], summary?: string): KnowledgeItem {
        const item: KnowledgeItem = {
            id: this.generateId(),
            content,
            source,
            tags,
            summary,
            createdAt: Date.now()
        };
        
        this.items.set(item.id, item);
        this.saveToStorage();
        
        return item;
    }

    /**
     * 获取所有收藏
     */
    getAll(): KnowledgeItem[] {
        return Array.from(this.items.values())
            .sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * 根据标签获取收藏
     */
    getByTag(tag: string): KnowledgeItem[] {
        return this.getAll().filter(item => 
            item.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
        );
    }

    /**
     * 搜索收藏
     */
    search(query: string): KnowledgeItem[] {
        const q = query.toLowerCase();
        return this.getAll().filter(item => 
            item.content.toLowerCase().includes(q) ||
            item.summary?.toLowerCase().includes(q) ||
            item.tags.some(t => t.toLowerCase().includes(q))
        );
    }

    /**
     * 更新标签
     */
    updateTags(id: string, tags: string[]): boolean {
        const item = this.items.get(id);
        if (!item) return false;
        
        item.tags = tags;
        this.saveToStorage();
        return true;
    }

    /**
     * 删除收藏
     */
    delete(id: string): boolean {
        const result = this.items.delete(id);
        if (result) {
            this.saveToStorage();
        }
        return result;
    }

    /**
     * 获取所有标签
     */
    getAllTags(): { tag: string; count: number }[] {
        const tagCounts = new Map<string, number>();
        
        for (const item of this.items.values()) {
            for (const tag of item.tags) {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            }
        }
        
        return Array.from(tagCounts.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count);
    }

    /**
     * 从会话批量导入
     */
    importFromSession(messages: { content: string; agentId?: string }[]): number {
        let count = 0;
        
        for (const msg of messages) {
            if (msg.agentId && msg.content.length > 50) {
                this.add(
                    msg.content,
                    `会话记录 - ${msg.agentId}`,
                    ['imported', msg.agentId],
                    msg.content.slice(0, 100)
                );
                count++;
            }
        }
        
        return count;
    }

    /**
     * 导出所有收藏
     */
    export(): KnowledgeItem[] {
        return this.getAll();
    }

    /**
     * 导入收藏
     */
    import(items: KnowledgeItem[]): number {
        let count = 0;
        
        for (const item of items) {
            if (!this.items.has(item.id)) {
                this.items.set(item.id, item);
                count++;
            }
        }
        
        if (count > 0) {
            this.saveToStorage();
        }
        
        return count;
    }

    /**
     * 从存储加载
     */
    private loadFromStorage(): void {
        try {
            const data = localStorage.getItem(KNOWLEDGE_KEY);
            if (data) {
                const items: KnowledgeItem[] = JSON.parse(data);
                this.items = new Map(items.map(i => [i.id, i]));
            }
        } catch (e) {
            console.error('Failed to load knowledge:', e);
        }
    }

    /**
     * 保存到存储
     */
    private saveToStorage(): void {
        try {
            const data = JSON.stringify(Array.from(this.items.values()));
            localStorage.setItem(KNOWLEDGE_KEY, data);
        } catch (e) {
            console.error('Failed to save knowledge:', e);
        }
    }

    /**
     * 生成唯一ID
     */
    private generateId(): string {
        return `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

export const knowledgeLibrary = new KnowledgeLibrary();

export default KnowledgeLibrary;
