import { format } from 'sql-formatter';
import type { FormatterOptions } from '../CodeFormatterService';
import { AliasInferencer } from '../AliasInferencer';

export class SanitizeExporter {
    /**
     * 脱敏精简排版导出面板 (Feature 14)
     * 用来拷贝丢进 Slack 或外部文档的干干净净的压缩态 SQL
     * 1. 去除所有注释
     * 2. 使用 alias inferencer 但不是去噪而是将所有长名字强制转换
     * 3. 紧凑型排版（没有双空行，没有多维列对齐）
     */
    public static exportSanitized(sql: string, options: FormatterOptions = {}): string {
        const dialect = options.dialect || 'sql';

        // 1. 暴力去除注释 (彻底抹杀一切业务涉密信息)
        let cleaned = sql.replace(/--.*$/gm, '');
        cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');

        // 2. 强制别名转换
        if (options.useAliasInference !== false) {
            cleaned = AliasInferencer.applyAliases(cleaned);
        }

        // 3. 基础但紧凑的排版
        try {
            cleaned = format(cleaned, {
                language: dialect,
                tabWidth: 2, // 更紧凑
                keywordCase: 'upper',
                linesBetweenQueries: 1, // 不要用2个换行，节省竖向空间
                logicalOperatorNewline: 'before',
            });
        } catch (e) {
            console.warn('Fallback sanitization formatting', e);
        }

        return cleaned;
    }
}
