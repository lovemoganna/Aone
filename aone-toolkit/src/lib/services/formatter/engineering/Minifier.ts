/**
 * Minifier (Token-Safe SQL Minifier) - Feature P2 Enhancement
 * Compresses SQL by removing all non-essential whitespace while
 * ensuring strings, identifiers, and comments (if preserved) are safe.
 */
export class Minifier {
    /**
     * Minifies SQL code using a token-safe approach.
     */
    public static minify(sql: string): string {
        const tokens = this.tokenize(sql);
        let result = '';
        let lastToken = '';

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            // If the current token and last token both start/end with word characters,
            // we need at least one space to separate them.
            if (this.needsSpace(lastToken, token)) {
                result += ' ';
            }

            result += token;
            lastToken = token;
        }

        return result.trim();
    }

    private static needsSpace(last: string, current: string): boolean {
        if (!last || !current) return false;

        // Keywords/Identifiers need spaces between them
        const wordRegex = /^\w+$/;
        if (wordRegex.test(last) && wordRegex.test(current)) return true;

        // Specific cases like '-' followed by '-' (would become '--' comment)
        if (last === '-' && current === '-') return true;
        if (last === '/' && current === '*') return true;

        return false;
    }

    private static tokenize(sql: string): string[] {
        // Strip comments first as usually minification implies no comments
        let sanitized = sql.replace(/--.*$/gm, '');
        sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, '');

        const tokens: string[] = [];
        // Match strings, numbers, identifiers, or single operators
        const regex = /'(''|[^'])*'|"(""|[^"])*"|`[^`]*`|\d+\.\d+|\w+|[^\w\s]/g;
        let match;

        while ((match = regex.exec(sanitized)) !== null) {
            tokens.push(match[0]);
        }

        return tokens;
    }
}
