/**
 * Semantic Grouping Lines (Feature 4)
 * Prevents line-wrap limits from breaking highly cohesive pairs or semantic groupings
 * such as coordinate pairs (x, y), ranges (start, end), or BETWEEN bounds.
 */
export class SemanticGrouper {
    /**
     * Collapses structurally cohesive but line-wrapped entities back onto a single line.
     * Often ran as a post-processing pass after the main formatter splits them.
     * @param sql The formatted SQL string
     */
    public static groupSemanticLines(sql: string): string {
        let processed = sql;

        // 1. Pair parameters (e.g. coordinates, intervals)
        // Matches pairs of short variables/numbers that were split over multiple lines
        // e.g. POINT(\n   lat,\n   lng\n) -> POINT(lat, lng)
        const pairRegex = /\(\s*([a-zA-Z0-9_.]{1,15})\s*,\s*([a-zA-Z0-9_.]{1,15})\s*\)/g;
        processed = processed.replace(pairRegex, '($1, $2)');

        // 2. BETWEEN ... AND ...
        // Formatter sometimes heavily wraps BETWEEN clauses if they exceed line width
        // Here we attempt to group simple scalar bounds back to a single line
        const betweenRegex = /\b(BETWEEN)\s+([a-zA-Z0-9_.'"-]+)\s+(AND)\s+([a-zA-Z0-9_.'"-]+)\b/gi;
        // The replace callback preserves the original casing of BETWEEN and AND
        processed = processed.replace(betweenRegex, (match, p1, p2, p3, p4) => {
            return `${p1} ${p2} ${p3} ${p4}`;
        });

        // 3. Alphabetical Sorting for SELECT/SET groups (P1 Enhancement)
        // This sorts simple column lists (e.g. "a, b, c") to improve maintainability.
        // It targets lists that are typically formatted one-per-line by sql-formatter.
        const lines = processed.split(/\r?\n/);
        let inSortableBlock = false;
        let sortBuffer: string[] = [];
        let startIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Detection: Start of a SELECT or SET block
            if (/\b(SELECT|SET)\b/i.test(line)) {
                inSortableBlock = true;
                continue;
            }

            // Detection: End of a block (next major keyword or semicolon)
            if (inSortableBlock && /\b(FROM|WHERE|GROUP|ORDER|LIMIT|INSERT|UPDATE|DELETE|WITH)\b|;/i.test(line)) {
                if (sortBuffer.length > 1) {
                    const sorted = sortBuffer.sort((a, b) => a.localeCompare(b));
                    lines.splice(startIndex, sortBuffer.length, ...sorted);
                    i = startIndex + sorted.length; // Adjust loop index
                }
                inSortableBlock = false;
                sortBuffer = [];
                startIndex = -1;
                continue;
            }

            // Collection: Logic for sortable lines (lines ending in commas or standalone columns)
            if (inSortableBlock) {
                // We only sort simple column lines (no complex subqueries)
                if (line && !line.includes('(') && !line.includes(')')) {
                    if (startIndex === -1) startIndex = i;
                    sortBuffer.push(lines[i]);
                } else {
                    // Break sorting if we hit complex logic
                    if (sortBuffer.length > 1) {
                        const sorted = sortBuffer.sort((a, b) => a.localeCompare(b));
                        lines.splice(startIndex, sortBuffer.length, ...sorted);
                        i = startIndex + sorted.length;
                    }
                    sortBuffer = [];
                    startIndex = -1;
                }
            }
        }

        // 4. JOIN Grouping Rule (P2 Enhancement)
        // Inserts empty lines between clusters of JOINs to clarify topology
        const processedLines: string[] = [];
        let lastJoinType = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim().toUpperCase();

            if (trimmedLine.includes('JOIN')) {
                let currentJoinType = 'INNER';
                if (trimmedLine.includes('LEFT')) currentJoinType = 'LEFT';
                else if (trimmedLine.includes('RIGHT')) currentJoinType = 'RIGHT';
                else if (trimmedLine.includes('CROSS')) currentJoinType = 'CROSS';
                else if (trimmedLine.includes('FULL')) currentJoinType = 'FULL';

                // If type changed and it's not the first JOIN, insert a hint line
                if (lastJoinType && currentJoinType !== lastJoinType) {
                    processedLines.push('');
                }
                lastJoinType = currentJoinType;
            } else if (trimmedLine && !trimmedLine.includes('ON') && !trimmedLine.startsWith('--')) {
                // Reset join tracking if we hit non-join/non-on lines
                lastJoinType = '';
            }

            processedLines.push(line);
        }

        return processedLines.join('\n');
    }
}
