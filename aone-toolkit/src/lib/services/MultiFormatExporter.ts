/**
 * 多格式导出器 (Multi-Format Exporter)
 * 支持多种格式导出对话内容
 */

import type { Session, Message } from '$lib/stores/agentStore.svelte';
import { marked } from 'marked';

export type ExportFormat = 'markdown' | 'html' | 'pdf' | 'json' | 'yaml' | 'csv' | 'notion' | 'confluence';

interface ExportOptions {
    includeMetadata?: boolean;
    includeTimestamps?: boolean;
    includeAgentNames?: boolean;
    simplifyFormat?: boolean;
}

export class MultiFormatExporter {
    /**
     * 导出会话到指定格式
     */
    exportSession(session: Session, format: ExportFormat, options: ExportOptions = {}): string {
        const { 
            includeMetadata = true, 
            includeTimestamps = true,
            includeAgentNames = true,
            simplifyFormat = false 
        } = options;

        switch (format) {
            case 'markdown':
                return this.toMarkdown(session, includeMetadata, includeTimestamps, includeAgentNames);
            case 'html':
                return this.toHtml(session, includeMetadata, includeTimestamps, includeAgentNames);
            case 'json':
                return this.toJson(session, includeMetadata);
            case 'yaml':
                return this.toYaml(session);
            case 'csv':
                return this.toCsv(session, includeTimestamps, includeAgentNames);
            case 'notion':
                return this.toNotion(session);
            case 'confluence':
                return this.toConfluence(session);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    /**
     * 导出为 Markdown
     */
    private toMarkdown(session: Session, meta: boolean, timestamps: boolean, agents: boolean): string {
        let md = '';
        
        if (meta) {
            md += `# ${session.title}\n\n`;
            md += `**会话ID:** ${session.id}\n`;
            md += `**创建时间:** ${new Date(session.messages[0]?.timestamp || Date.now()).toLocaleString()}\n`;
            md += `**消息数:** ${session.messages.length}\n\n---\n\n`;
        }

        for (const msg of session.messages) {
            if (msg.role === 'user' || msg.role === 'assistant') {
                const role = msg.role === 'user' ? '👤 用户' : (agents && msg.agentId ? `🤖 ${msg.agentId}` : '🤖 AI');
                md += `## ${role}\n\n`;
                
                if (timestamps) {
                    md += `*${new Date(msg.timestamp).toLocaleString()}*\n\n`;
                }
                
                md += `${msg.content}\n\n---\n\n`;
            }
        }

        return md;
    }

    /**
     * 导出为 HTML
     */
    private toHtml(session: Session, meta: boolean, timestamps: boolean, agents: boolean): string {
        const title = session.title;
        const messages = session.messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(msg => {
                const role = msg.role === 'user' ? 'User' : (agents && msg.agentId ? msg.agentId : 'AI');
                const time = timestamps ? `<span class="timestamp">${new Date(msg.timestamp).toLocaleString()}</span>` : '';
                return `
        <div class="message ${msg.role}">
            <div class="role">${role}</div>
            ${time}
            <div class="content">${this.escapeHtml(msg.content)}</div>
        </div>`;
            }).join('\n');

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(title)}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
        h1 { color: #1a1a1a; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        .meta { color: #6b7280; font-size: 0.9em; margin-bottom: 30px; }
        .message { margin-bottom: 24px; padding: 16px; border-radius: 8px; }
        .message.user { background: #f3f4f6; }
        .message.assistant { background: #eef2ff; border-left: 4px solid #6366f1; }
        .role { font-weight: 600; margin-bottom: 8px; color: #374151; }
        .timestamp { font-size: 0.8em; color: #9ca3af; }
        .content { white-space: pre-wrap; }
    </style>
</head>
<body>
    <h1>${this.escapeHtml(title)}</h1>
    ${meta ? `<p class="meta">会话ID: ${session.id} | 消息数: ${session.messages.length}</p>` : ''}
    ${messages}
</body>
</html>`;
    }

    /**
     * 导出为 JSON
     */
    private toJson(session: Session, includeMeta: boolean): string {
        const data = includeMeta ? session : {
            messages: session.messages.map(m => ({
                role: m.role,
                content: m.content,
                agentId: m.agentId,
                timestamp: m.timestamp
            }))
        };
        return JSON.stringify(data, null, 2);
    }

    /**
     * 导出为 YAML
     */
    private toYaml(session: Session): string {
        let yaml = `title: "${session.title}"\n`;
        yaml += `id: "${session.id}"\n`;
        yaml += `messages:\n`;
        
        for (const msg of session.messages) {
            if (msg.role === 'user' || msg.role === 'assistant') {
                yaml += `  - role: ${msg.role}\n`;
                yaml += `    content: |-\n`;
                for (const line of msg.content.split('\n')) {
                    yaml += `      ${line}\n`;
                }
                if (msg.agentId) {
                    yaml += `    agentId: "${msg.agentId}"\n`;
                }
                yaml += `    timestamp: ${msg.timestamp}\n`;
            }
        }
        
        return yaml;
    }

    /**
     * 导出为 CSV
     */
    private toCsv(session: Session, timestamps: boolean, agents: boolean): string {
        const headers = ['Role', 'Content', ...(agents ? ['Agent'] : []), ...(timestamps ? ['Timestamp'] : [])];
        const rows = session.messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(msg => [
                msg.role,
                `"${msg.content.replace(/"/g, '""')}"`,
                ...(agents ? [msg.agentId || ''] : []),
                ...(timestamps ? [new Date(msg.timestamp).toISOString()] : [])
            ]);

        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    /**
     * 导出为 Notion 格式 (Markdown 变体)
     */
    private toNotion(session: Session): string {
        let md = `# ${session.title}\n\n`;
        
        for (const msg of session.messages) {
            if (msg.role === 'user' || msg.role === 'assistant') {
                const role = msg.role === 'user' ? '👤 用户' : `🤖 ${msg.agentId || 'AI'}`;
                md += `## ${role}\n\n${msg.content}\n\n`;
            }
        }
        
        return md;
    }

    /**
     * 导出为 Confluence 格式
     */
    private toConfluence(session: Session): string {
        let html = `<h1>${session.title}</h1>\n`;
        
        for (const msg of session.messages) {
            if (msg.role === 'user' || msg.role === 'assistant') {
                const role = msg.role === 'user' ? '用户' : msg.agentId || 'AI';
                html += `<h2>${role}</h2>\n`;
                html += `<p>${msg.content.replace(/\n/g, '</p><p>')}</p>\n`;
            }
        }
        
        return html;
    }

    /**
     * HTML 转义
     */
    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * 获取支持的格式列表
     */
    getSupportedFormats(): { id: ExportFormat; label: string; ext: string }[] {
        return [
            { id: 'markdown', label: 'Markdown', ext: '.md' },
            { id: 'html', label: 'HTML', ext: '.html' },
            { id: 'json', label: 'JSON', ext: '.json' },
            { id: 'yaml', label: 'YAML', ext: '.yaml' },
            { id: 'csv', label: 'CSV', ext: '.csv' },
            { id: 'notion', label: 'Notion', ext: '.md' },
            { id: 'confluence', label: 'Confluence', ext: '.html' }
        ];
    }
}

export const multiFormatExporter = new MultiFormatExporter();

export default MultiFormatExporter;
