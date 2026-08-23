/**
 * StatementBoundDetector (Feature 8)
 * Identifies the logical boundaries (start and end indices)
 * of a SQL statement based on a cursor position.
 * Used for "Leave-Node" micro-transactions and surgical partial formatting.
 */
export class StatementBoundDetector {
    /**
     * Finds the start and end indices of the SQL statement containing the offset.
     */
    public static detect(sql: string, offset: number): { from: number; to: number } {
        if (offset < 0) offset = 0;
        if (offset > sql.length) offset = sql.length;

        // 1. Find Start: Previous semicolon or start of string
        let start = offset;
        while (start > 0) {
            if (sql[start - 1] === ';') {
                // Check if it's inside a string (naive check)
                if (!this.isInsideQuote(sql, start - 1)) break;
            }
            start--;
        }

        // Skip leading whitespace
        while (start < sql.length && /\s/.test(sql[start])) {
            start++;
        }

        // 2. Find End: Next semicolon or end of string
        let end = offset;
        while (end < sql.length) {
            if (sql[end] === ';') {
                if (!this.isInsideQuote(sql, end)) {
                    end++; // Include the semicolon
                    break;
                }
            }
            end++;
        }

        return { from: start, to: end };
    }

    /**
     * Naive check if a position is inside a single-quote or double-quote string.
     */
    private static isInsideQuote(sql: string, index: number): boolean {
        let insideSingle = false;
        let insideDouble = false;

        for (let i = 0; i < index; i++) {
            if (sql[i] === "'" && !insideDouble) {
                // Handle escaped quotes ''
                if (sql[i + 1] === "'") i++;
                else insideSingle = !insideSingle;
            } else if (sql[i] === '"' && !insideSingle) {
                insideDouble = !insideDouble;
            }
        }

        return insideSingle || insideDouble;
    }
}
