import type { FormatterOptions } from '../CodeFormatterService';

/**
 * Heuristic Dialect Miner (Feature 2)
 * Analyzes active file contents to implicitly deduce formatting rules
 * for legacy projects without formal style configurations.
 * Prevents mass whitespace and casing git-diff blowups.
 */
export class ProjectStyleMiner {
    /**
     * Mine optimal formatter options heuristically from a sample of file contents.
     * @param samples Array of file content strings to analyze
     */
    public static mineStyles(samples: string[]): FormatterOptions {
        if (!samples || samples.length === 0) {
            return {};
        }

        const stats = {
            indent2: 0,
            indent4: 0,
            keywordUpper: 0,
            keywordLower: 0,
            commaLeading: 0,
            commaTrailing: 0,
        };

        const sqlKeywordRegex = /\b(select|from|where|insert|update|delete|join)\b/ig;

        for (const content of samples) {
            const lines = content.split(/\r?\n/);

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // 1. Indentation Mining (remains unchanged but trimmed for logic)
                const rawLine = lines[i];
                const indentMatch = rawLine.match(/^(\s+)/);
                if (indentMatch) {
                    const spaces = indentMatch[1].length;
                    if (spaces % 4 === 0) stats.indent4++;
                    else if (spaces % 2 === 0) stats.indent2++;
                }

                // 2. Keyword Case Mining
                let keywordMatch;
                sqlKeywordRegex.lastIndex = 0;
                while ((keywordMatch = sqlKeywordRegex.exec(line)) !== null) {
                    const word = keywordMatch[0];
                    if (word === word.toUpperCase()) stats.keywordUpper++;
                    else if (word === word.toLowerCase()) stats.keywordLower++;
                }

                // 3. Comma Style Mining (P0 Enhancement)
                if (line.startsWith(',')) {
                    stats.commaLeading++;
                } else if (line.endsWith(',')) {
                    stats.commaTrailing++;
                }
            }
        }

        const options: any = {}; // Use any temporarily to avoid strict type mismatch if needed

        // Decide Indentation
        if (stats.indent4 >= stats.indent2 && stats.indent4 > 0) options.tabWidth = 4;
        else if (stats.indent2 > stats.indent4) options.tabWidth = 2;

        // Decide Keyword Case
        if (stats.keywordUpper >= stats.keywordLower && stats.keywordUpper > 0) options.keywordCase = 'upper';
        else if (stats.keywordLower > stats.keywordUpper) options.keywordCase = 'lower';

        // Decide Comma Style
        if (stats.commaLeading > stats.commaTrailing) options.commaPosition = 'leading';
        else if (stats.commaTrailing > stats.commaLeading) options.commaPosition = 'trailing';

        return options;
    }
}
