// Feature 13: Streaming Fractal Formatter - Removed circular dependency by using callback
export type FormatterCallback = (sql: string, options?: any) => string;

/**
 * BlockStreamer (Streaming Fractal Formatter) - Feature 13
 * Breaks down massive SQL scripts into logical independent blocks 
 * (separated by semicolons) and formats them in sequence.
 * Prevents V8 heap exhaustion on giant files by avoiding single-string processing.
 */
export class BlockStreamer {
    /**
     * Formats a large SQL string by streaming it in blocks.
     * @param largeSql The massive SQL string
     * @param formatter The formatter callback
     * @param options Formatting options
     * @param chunkSize Goal size for intermediate buffers (not strict)
     */
    public static formatStream(
        largeSql: string,
        formatter: FormatterCallback,
        options: any = {},
        chunkSize: number = 1000 * 50 // 50KB default chunks
    ): string {
        if (largeSql.length < chunkSize * 2) {
            return formatter(largeSql, options);
        }

        const statements = this.splitIntoStatements(largeSql);
        let result = '';
        let currentBuffer = '';

        for (const stmt of statements) {
            currentBuffer += stmt;

            // If the buffer reaches the goal size, format it and append to result
            if (currentBuffer.length >= chunkSize) {
                result += formatter(currentBuffer, options);
                currentBuffer = '';
            }
        }

        // Final flush
        if (currentBuffer.length > 0) {
            result += formatter(currentBuffer, options);
        }

        return result;
    }

    /**
     * Splits a large SQL string into a list of statements, 
     * preserving the semicolons and trailing whitespace.
     * Uses a robust character scanner to handle quotes correctly.
     */
    private static splitIntoStatements(sql: string): string[] {
        const statements: string[] = [];
        let current = '';
        let inSingle = false;
        let inDouble = false;
        let inBacktick = false;

        for (let i = 0; i < sql.length; i++) {
            const char = sql[i];
            const next = sql[i + 1];

            if (char === "'" && !inDouble && !inBacktick) {
                if (next === "'") { // Escaped quote
                    current += "''";
                    i++;
                } else {
                    inSingle = !inSingle;
                    current += char;
                }
            } else if (char === '"' && !inSingle && !inBacktick) {
                inDouble = !inDouble;
                current += char;
            } else if (char === '`' && !inSingle && !inDouble) {
                inBacktick = !inBacktick;
                current += char;
            } else if (char === ';' && !inSingle && !inDouble && !inBacktick) {
                current += ';';
                statements.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        if (current.length > 0) {
            statements.push(current);
        }

        return statements;
    }
}
