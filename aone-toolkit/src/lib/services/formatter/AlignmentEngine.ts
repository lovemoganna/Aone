import { CodeFormatterService } from './CodeFormatterService';

export class AlignmentEngine {
    /**
     * 对齐 VALUES 块中的多列网格 (Feature 01)
     */
    public static alignGrid(sql: string): string {
        const valuesRegex = /VALUES\s*(\([\s\S]*?\)(?:\s*,\s*\([\s\S]*?\))*)/gi;

        return sql.replace(valuesRegex, (match, valuesContent) => {
            const rows = valuesContent.split(/\)\s*,\s*\(/).map((row: string) => {
                const cleaned = row.replace(/^\(|\)$/g, '');
                return this.splitRow(cleaned);
            });

            if (rows.length < 2) return match;

            const colCounts = rows.map((r: string[]) => r.length);
            const maxCols = Math.max(...colCounts);
            if (colCounts.some((c: number) => c !== maxCols && c > 0)) {
                return match;
            }

            const colWidths = new Array(maxCols).fill(0);
            rows.forEach((row: string[]) => {
                row.forEach((cell, i) => {
                    colWidths[i] = Math.max(colWidths[i], cell.trim().length);
                });
            });

            const MAX_CELL_WIDTH = 50;
            const finalWidths = colWidths.map(w => Math.min(w, MAX_CELL_WIDTH));

            const formattedRows = rows.map((row: string[]) => {
                const formattedCells = row.map((cell, i) => {
                    const trimmed = cell.trim();
                    if (i === row.length - 1) return trimmed;
                    return trimmed.padEnd(finalWidths[i]);
                });

                const lastIdx = formattedCells.length - 1;
                formattedCells[lastIdx] = formattedCells[lastIdx].trimEnd();

                return `    (${formattedCells.join(', ')}`;
            });

            return `VALUES\n${formattedRows.join('),\n')});`;
        });
    }

    private static splitRow(rowContent: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < rowContent.length; i++) {
            const char = rowContent[i];

            if (char === "'") {
                if (inQuotes && rowContent[i + 1] === "'") {
                    current += "''";
                    i++;
                    continue;
                }
                inQuotes = !inQuotes;
                current += char;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    /**
     * 深度折行，改进空格处理
     */
    public static breakDeepNesting(sql: string): string {
        let bracketDepth = 0;
        let result = '';
        const tokens = sql.split(/(\s+|\(|\))/);

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (!token) continue;

            const trimmedToken = token.trim();
            const upperToken = trimmedToken.toUpperCase();

            // 更新括号深度
            if (token === '(') bracketDepth++;
            if (token === ')') bracketDepth--;

            if ((upperToken === 'AND' || upperToken === 'OR') && bracketDepth === 0) {
                // 如果当前 token 是关键词且在顶级，强制断行
                result = result.trimEnd(); // 移除前面的空格
                result += '\n    ' + trimmedToken + ' ';
                // 跳过下一个空格 token (如果存在)
                if (tokens[i + 1] && tokens[i + 1].trim() === '') {
                    i++;
                }
            } else {
                result += token;
            }
        }
        return result;
    }

    /**
     * 对齐 CTE 定义 (Phase 2)
     */
    public static alignCTEs(sql: string): string {
        const cteRegex = /(\bWITH\b|,)\s+(\w+)\s+(AS\s*\()/gi;
        const matches: any[] = [];
        let match;

        while ((match = cteRegex.exec(sql)) !== null) {
            matches.push({
                full: match[0],
                keyword: match[1],
                name: match[2],
                asPart: match[3],
                index: match.index
            });
        }

        if (matches.length === 0) return sql;

        let maxRelOffset = 0;
        const processed = matches.map(m => {
            const prefix = m.full.substring(0, m.full.indexOf(m.asPart));
            const lastNewlineInPrefix = prefix.lastIndexOf('\n');
            let visualPrefix = "";

            if (lastNewlineInPrefix !== -1) {
                visualPrefix = prefix.substring(lastNewlineInPrefix + 1);
            } else {
                const lastNewlineInSql = sql.lastIndexOf('\n', m.index);
                visualPrefix = sql.substring(lastNewlineInSql + 1, m.index) + prefix;
            }

            const offset = visualPrefix.length;
            maxRelOffset = Math.max(maxRelOffset, offset);
            return { ...m, offset };
        });

        maxRelOffset = Math.min(maxRelOffset, 60);

        let result = sql;
        for (let i = processed.length - 1; i >= 0; i--) {
            const m = processed[i];
            const padding = ' '.repeat(Math.max(1, maxRelOffset - m.offset + 1));
            const prefix = m.full.substring(0, m.full.indexOf(m.asPart));
            const replacement = prefix + padding + 'AS (';

            result = result.substring(0, m.index) +
                replacement +
                result.substring(m.index + m.full.length);
        }

        return result;
    }

    /**
     * 对齐 CASE WHEN 语句 (Phase 4)
     */
    public static alignCase(sql: string): string {
        const caseRegex = /CASE\s+([\s\S]*?)\s+END/gi;

        return sql.replace(caseRegex, (fullMatch, content) => {
            const lines = content.split('\n');
            const whenEntries: { whenPart: string, thenPart: string, index: number }[] = [];

            lines.forEach((line: string, i: number) => {
                const trimmed = line.trim();
                const match = trimmed.match(/^(WHEN\s+[\s\S]*?)\s+(THEN\s+[\s\S]*)$/i);
                if (match) {
                    whenEntries.push({
                        whenPart: match[1],
                        thenPart: match[2],
                        index: i
                    });
                }
            });

            if (whenEntries.length < 2) return fullMatch;

            let maxWhenLen = 0;
            whenEntries.forEach(e => {
                maxWhenLen = Math.max(maxWhenLen, e.whenPart.length);
            });

            maxWhenLen = Math.min(maxWhenLen, 50);

            const newLines = [...lines];
            whenEntries.forEach(e => {
                const padding = ' '.repeat(Math.max(1, maxWhenLen - e.whenPart.length + 1));
                newLines[e.index] = '    ' + e.whenPart + padding + e.thenPart;
            });

            const cleanedLines = newLines.map(l => l.trimEnd()).filter(l => l.length > 0);
            return `CASE\n${cleanedLines.join('\n')}\n    END`;
        });
    }
}
