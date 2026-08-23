import type { FormatterOptions } from '../CodeFormatterService';

// Feature 11: AST Fuzzy Degradation - Removed circular dependency by using callback
export type FormatterCallback = (sql: string, options?: FormatterOptions) => string;

export interface FuzzyResult {
    result: string;
    salvaged: boolean;
}

/**
 * FuzzyParser (AST Fuzzy Degradation) - Feature 11
 * Identifies structural "islands" of valid-looking SQL in a potentially
 * broken or incomplete document. Formats these islands individually
 * to provide a "salvaged" view of malformed code.
 */
export class FuzzyParser {
    /**
     * Attempts to find and format valid SQL blocks within a broken text.
     * Uses a manual scanner to ensure balanced brackets and prevent truncation.
     */
    public static salvageAndFormat(
        brokenSql: string,
        formatter: FormatterCallback,
        options: FormatterOptions = {}
    ): FuzzyResult {
        const startKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'WITH'];
        let result = '';
        let currentIndex = 0;
        let salvaged = false;

        while (currentIndex < brokenSql.length) {
            // Check for comments
            if (brokenSql.startsWith('--', currentIndex)) {
                const endOfLine = brokenSql.indexOf('\n', currentIndex);
                const commentEnd = endOfLine === -1 ? brokenSql.length : endOfLine + 1;
                result += brokenSql.substring(currentIndex, commentEnd);
                currentIndex = commentEnd;
                continue;
            }
            if (brokenSql.startsWith('/*', currentIndex)) {
                const commentEnd = brokenSql.indexOf('*/', currentIndex);
                const actualEnd = commentEnd === -1 ? brokenSql.length : commentEnd + 2;
                result += brokenSql.substring(currentIndex, actualEnd);
                currentIndex = actualEnd;
                continue;
            }

            // Check if we are at the start of a SQL "island"
            const remaining = brokenSql.substring(currentIndex);
            const match = startKeywords.find(k => new RegExp(`^\\b${k}\\b`, 'i').test(remaining));

            if (match) {
                const islandStart = currentIndex;
                let islandEnd = currentIndex;
                let bracketDepth = 0;
                let inString = false;
                let stringChar = '';

                // Scan forward to find the end of the island
                for (let i = currentIndex; i < brokenSql.length; i++) {
                    const char = brokenSql[i];

                    // Handle comments within island scanning
                    if (!inString && brokenSql.startsWith('--', i)) {
                        const eol = brokenSql.indexOf('\n', i);
                        i = eol === -1 ? brokenSql.length : eol;
                        islandEnd = i;
                        continue;
                    }

                    // String boundary handling
                    if ((char === "'" || char === '"' || char === '`') && (i === 0 || brokenSql[i - 1] !== '\\')) {
                        if (!inString) {
                            inString = true;
                            stringChar = char;
                        } else if (char === stringChar) {
                            inString = false;
                        }
                    }

                    if (!inString) {
                        if (char === '(') bracketDepth++;
                        if (char === ')') bracketDepth--;

                        // Break if we hit a semicolon at zero depth
                        if (char === ';' && bracketDepth <= 0) {
                            islandEnd = i + 1;
                            break;
                        }

                        // Break if we hit a NEW keyword at zero depth (unless it's the very start)
                        if (i > islandStart && bracketDepth <= 0) {
                            const lookAhead = brokenSql.substring(i);
                            if (startKeywords.some(k => new RegExp(`^\\b${k}\\b`, 'i').test(lookAhead))) {
                                islandEnd = i;
                                break;
                            }
                        }
                    }
                    islandEnd = i + 1;
                }

                const islandContent = brokenSql.substring(islandStart, islandEnd);
                try {
                    const formattedIsland = formatter(islandContent, {
                        ...options,
                        useAliasInference: false
                    });
                    result += formattedIsland;
                    salvaged = true; // We successfully "salvaged" an island
                } catch (e) {
                    result += islandContent;
                }
                currentIndex = islandEnd;
            } else {
                // Not a keyword start, move forward one character
                result += brokenSql[currentIndex];
                currentIndex++;
            }
        }

        return { result, salvaged };
    }
}
