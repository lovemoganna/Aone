/**
 * SafetyAssertion (结构化破损校验锁) - Feature 06
 * Ensures that formatting did not accidentally change the semantic meaning 
 * of the SQL (e.g., by checking if the sequence of tokens remains identical).
 */
export class SafetyAssertion {
    /**
     * Asserts that the formatted SQL is semantically equivalent to the original.
     * Currently uses a sophisticated token-counting and sequence check (P1 Upgrade).
     */
    public static assertSafe(original: string, formatted: string): boolean {
        // Step 1: Whitespace-agnostic comparison (P0 Baseline)
        const strip = (s: string) => s.replace(/\s+/g, '').toLowerCase();
        if (strip(original) === strip(formatted)) return true;

        // Step 2: Token sequence validation (P1 Enhancement)
        // We extract identifiers, literals, and operators, ignoring whitespace and comments.
        const tokensOriginal = this.tokenize(original);
        const tokensFormatted = this.tokenize(formatted);

        if (tokensOriginal.length !== tokensFormatted.length) {
            console.error(`Safety Violation: Token count mismatch (${tokensOriginal.length} vs ${tokensFormatted.length})`);
            return false;
        }

        for (let i = 0; i < tokensOriginal.length; i++) {
            if (tokensOriginal[i] !== tokensFormatted[i]) {
                console.error(`Safety Violation: Token mismatch at position ${i} ('${tokensOriginal[i]}' vs '${tokensFormatted[i]}')`);
                return false;
            }
        }

        return true;
    }

    /**
     * Simple tokenizer that extracts meaningful SQL atoms.
     */
    private static tokenize(sql: string): string[] {
        // This is a simplified tokenizer for safety checks.
        // It removes comments and then splits by non-alphanumeric characters while preserving strings.

        let sanitized = sql.replace(/--.*$/gm, '');
        sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, '');

        const tokens: string[] = [];
        const regex = /'(''|[^'])*'|"(""|[^"])*"|`[^`]*`|\d+\.\d+|\w+|[^\w\s]/g;
        let match;

        while ((match = regex.exec(sanitized)) !== null) {
            const t = match[0].toLowerCase();
            // We ignore whitespace (though the regex usually handles it by not matching it)
            if (t.trim()) tokens.push(t);
        }

        return tokens;
    }
}
