import type { FormatterOptions } from '../CodeFormatterService';

export class ZeroConfigSniffer {
    /**
     * 零配置“风格嗅探推断” (Feature 15)
     * 通过对待格式化的源码进行统计学抽样，反向推导出它所使用的缩进和大小写风格。
     */
    public static sniff(sql: string): Partial<FormatterOptions> & { tabWidth?: number; keywordCase?: 'upper' | 'lower' } {
        const lines = sql.split('\n');

        let spaceIndentedCount = 0;
        let tabIndentedCount = 0;
        let spaceLengths: number[] = [];

        let upperCaseKeywordCount = 0;
        let lowerCaseKeywordCount = 0;

        const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'INSERT', 'UPDATE', 'DELETE', 'JOIN'];

        for (const line of lines) {
            // 嗅探缩进 (制表符 vs 空格)
            const leadingWhitespaceMatch = line.match(/^(\s+)/);
            if (leadingWhitespaceMatch) {
                const ws = leadingWhitespaceMatch[1];
                if (ws.includes('\t')) {
                    tabIndentedCount++;
                } else if (ws.includes(' ')) {
                    spaceIndentedCount++;
                    spaceLengths.push(ws.length);
                }
            }

            // 嗅探关键字大小写
            const words = line.trim().split(/\s+/);
            if (words.length > 0) {
                const firstWord = words[0];
                const upper = firstWord.toUpperCase();

                if (keywords.includes(upper)) {
                    if (firstWord === upper) {
                        upperCaseKeywordCount++;
                    } else if (firstWord === firstWord.toLowerCase()) {
                        lowerCaseKeywordCount++;
                    }
                }
            }
        }

        const sniffedOptions: any = {};

        // 判定缩进字符和大小
        if (tabIndentedCount > spaceIndentedCount) {
            sniffedOptions.tabWidth = 4; // usually tabs represent 4 spaces
        } else if (spaceLengths.length > 0) {
            // 简单统计学：取出现最多的非0公约数或者直接取最常见的缩进长度
            // 此处简化为取最常出现的头部空格数
            const counts = spaceLengths.reduce((acc, val) => {
                acc[val] = (acc[val] || 0) + 1;
                return acc;
            }, {} as Record<number, number>);

            let mostFrequent = 4;
            let maxCount = 0;
            for (const [len, count] of Object.entries(counts)) {
                if (count > maxCount && parseInt(len) > 0) {
                    maxCount = count;
                    mostFrequent = parseInt(len);
                }
            }
            // 常见团队规范是2或4
            if (mostFrequent % 2 === 0) {
                sniffedOptions.tabWidth = mostFrequent > 4 ? 4 : mostFrequent;
            } else {
                sniffedOptions.tabWidth = 4; // fallback
            }
        }

        // 判定大小写
        if (upperCaseKeywordCount >= lowerCaseKeywordCount) {
            sniffedOptions.keywordCase = 'upper';
        } else {
            sniffedOptions.keywordCase = 'lower';
        }

        // 3. 嗅探 SQL 方言 (P1 Enhancement & Phase 2 DuckDB)
        const dialectScores = {
            mysql: 0,
            postgresql: 0,
            tsql: 0,
            sqlite: 0,
            duckdb: 0
        };

        // Heuristics
        const upperSql = sql.toUpperCase();
        if (upperSql.includes('LIMIT')) dialectScores.mysql += 2;
        if (upperSql.includes('TOP')) dialectScores.tsql += 5;
        if (sql.includes('::')) {
            dialectScores.postgresql += 5;
            dialectScores.duckdb += 5;
        }
        if (upperSql.includes('SERIAL')) dialectScores.postgresql += 2;
        if (upperSql.includes('AUTO_INCREMENT')) dialectScores.mysql += 5;
        if (upperSql.includes('NOLOCK')) dialectScores.tsql += 5;

        // DuckDB Specifics
        if (upperSql.includes('EXCLUDE') && upperSql.includes('SELECT *')) dialectScores.duckdb += 10;
        if (upperSql.includes('REPLACE') && upperSql.includes('SELECT *')) dialectScores.duckdb += 10;
        if (upperSql.includes('PIVOT') || upperSql.includes('UNPIVOT')) dialectScores.duckdb += 5;
        if (upperSql.includes('INSTALL') && upperSql.includes('LOAD')) dialectScores.duckdb += 8;

        let bestDialect: keyof typeof dialectScores = 'mysql';
        let maxScore = -1;
        for (const [dialect, score] of Object.entries(dialectScores)) {
            if (score > maxScore) {
                maxScore = score;
                bestDialect = dialect as any;
            }
        }

        if (maxScore > 0) {
            sniffedOptions.dialect = bestDialect;
        }

        return sniffedOptions;
    }
}
