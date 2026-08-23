import { CodeFormatterService } from '../CodeFormatterService';
import type { FormatterOptions } from '../CodeFormatterService';

export class SelectionFormatter {
    /**
     * 局部差异选区的精准定界排版 (Feature 11)
     * 将高亮选区智能扩张到最近的合法 SQL 语句边界后再格式化，避免因选区断裂导致的 AST 解析崩溃。
     */
    public static expandAndFormatSelection(
        fullSql: string,
        selectionStart: number,
        selectionEnd: number,
        options: FormatterOptions = {}
    ): { formattedSql: string; startOffset: number; endOffset: number } {
        // 安全回退：如果没有任何选择，直接返回原 SQL
        if (selectionStart >= selectionEnd) {
            return { formattedSql: fullSql, startOffset: 0, endOffset: fullSql.length };
        }

        // 扩张逻辑：
        // 向上寻找最近的 SELECT, INSERT, UPDATE, DELETE 或者是分号 ;
        const startExpansion = this.findLogicalStartBoundary(fullSql, selectionStart);

        // 向下寻找最近的分号 ; 或者 EOF
        const endExpansion = this.findLogicalEndBoundary(fullSql, selectionEnd);

        // 我们提取出这块“扩张后包含完整上下文的子语句”
        const isolatedBlock = fullSql.substring(startExpansion, endExpansion);

        // 我们只对这块闭包逻辑进行重构
        const formattedBlock = CodeFormatterService.format(isolatedBlock, options).result;

        // 组装回去
        const newFullSql =
            fullSql.substring(0, startExpansion) +
            formattedBlock +
            fullSql.substring(endExpansion);

        return {
            formattedSql: newFullSql,
            startOffset: startExpansion,
            endOffset: startExpansion + formattedBlock.length
        };
    }

    private static findLogicalStartBoundary(sql: string, startIdx: number): number {
        // 从 startIdx 往前找分号
        const prevSemicolon = sql.lastIndexOf(';', startIdx);
        if (prevSemicolon !== -1) {
            // 返回分号后面的第一个非空字符的位置
            let idx = prevSemicolon + 1;
            while (idx < startIdx && /\s/.test(sql[idx])) {
                idx++;
            }
            return idx;
        }
        return 0; // 找不到分号，说明是文件开头
    }

    private static findLogicalEndBoundary(sql: string, endIdx: number): number {
        // 从 endIdx 往后找分号
        const nextSemicolon = sql.indexOf(';', endIdx);
        if (nextSemicolon !== -1) {
            return nextSemicolon + 1; // 包含这个分号
        }
        return sql.length; // 找不到说明是文件末尾
    }
}
