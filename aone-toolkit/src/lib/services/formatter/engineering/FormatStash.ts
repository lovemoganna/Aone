import { v4 as uuidv4 } from 'uuid';

export interface StashedRange {
    from: number;
    to: number;
    content: string;
}

/**
 * FormatStash (Invisible Format Stash) - Feature 7
 * Allows developers to "freeze" specific code ranges by index.
 * These ranges will be replaced by UUID placeholders during 
 * formatting and restored exactly as they were afterwards.
 */
export class FormatStash {
    private static stashes = new Map<string, string>();

    /**
     * Stashes specific ranges from the original SQL text.
     * @param sql The original SQL text
     * @param ranges The ranges to be stashed
     * @returns The SQL text with placeholders
     */
    public static stashRanges(sql: string, ranges: { from: number; to: number }[]): string {
        // Sort ranges in descending order to prevent index shifting during replacement
        const sortedRanges = [...ranges].sort((a, b) => b.from - a.from);

        let processedSql = sql;

        for (const range of sortedRanges) {
            const content = sql.substring(range.from, range.to);
            const uuid = `__STASHED_${uuidv4().replace(/-/g, '')}__`;

            this.stashes.set(uuid, content);

            processedSql =
                processedSql.substring(0, range.from) +
                uuid +
                processedSql.substring(range.to);
        }

        return processedSql;
    }

    /**
     * Restores all stashed ranges in the formatted SQL.
     */
    public static restoreStashes(sql: string): string {
        let restoredSql = sql;

        // Iterate over stashes and replace placeholders back with original content
        this.stashes.forEach((content, uuid) => {
            restoredSql = restoredSql.replace(uuid, content);
        });

        // Clear for next use
        this.stashes.clear();

        return restoredSql;
    }
}
