import { CodeFormatterService, type FormatterOptions } from '../CodeFormatterService';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * MockEnvironment (Environment Emulator Validation) - Feature 15
 * Emulates specific database behaviors or client environments to
 * validate that formatting (especially destructive ones like Aliasing)
 * hasn't altered the semantic validity of the SQL.
 */
export class MockEnvironment {
    /**
     * Validates formatted SQL against a set of dialect-specific rules.
     */
    public static validate(original: string, formatted: string, dialect: string = 'sql'): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // 1. Basic length check (Sanity)
        if (formatted.length < original.length * 0.5) {
            warnings.push('Significant code loss detected. Formatted output is < 50% of the original.');
        }

        // 2. Keyword preservation check
        const originalKeywords = this.extractKeywords(original);
        const formattedKeywords = this.extractKeywords(formatted);

        for (const kw of originalKeywords) {
            if (!formattedKeywords.has(kw)) {
                errors.push(`Critical Keyword Loss: '${kw}' was removed or mangled during formatting.`);
            }
        }

        // 3. Dialect specific checks
        if (dialect === 'postgresql') {
            // Postgres specific validation (e.g. check for backticks which PG doesn't use for identifiers)
            if (formatted.includes('`')) {
                errors.push('Postgres Dialect Violation: Backticks found in identifiers.');
            }
        } else if (dialect === 'mysql') {
            // MySQL specific check
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    private static extractKeywords(sql: string): Set<string> {
        // Strip comments to avoid false positives (e.g. keywords in comments)
        const sqlWithoutComments = sql
            .replace(/\/\*[\s\S]*?\*\/|--.*$|#.*$/gm, ' ')
            .replace(/\s+/g, ' ');

        // Simple extraction of major SQL keywords for semantic safety
        const keywordRegex = /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|GROUP BY|ORDER BY|UNION|HAVING|LIMIT)\b/gi;
        const matches = sqlWithoutComments.match(keywordRegex) || [];
        return new Set(matches.map(m => m.toUpperCase()));
    }
}
