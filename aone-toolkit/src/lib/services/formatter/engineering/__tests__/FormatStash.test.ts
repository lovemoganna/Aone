import { describe, it, expect } from 'vitest';
import { FormatStash } from '../FormatStash';

describe('FormatStash', () => {
    it('should stash and restore a specific range', () => {
        const sql = 'SELECT * FROM users WHERE status = 1';
        // Stash "users" which is at 14 to 19
        const range = { from: 14, to: 19 };
        const stashed = FormatStash.stashRanges(sql, [range]);

        expect(stashed).toContain('__STASHED_');
        expect(stashed).not.toContain('users');

        const restored = FormatStash.restoreStashes(stashed);
        expect(restored).toBe(sql);
    });

    it('should handle multiple ranges correctly by sorting them', () => {
        const sql = 'SELECT col1, col2, col3 FROM table';
        const ranges = [
            { from: 7, to: 11 },  // col1
            { from: 13, to: 17 }, // col2
            { from: 19, to: 23 }  // col3
        ];

        const stashed = FormatStash.stashRanges(sql, ranges);
        const restored = FormatStash.restoreStashes(stashed);

        expect(restored).toBe(sql);
    });

    it('should not break text if no ranges provided', () => {
        const sql = 'SELECT 1';
        expect(FormatStash.stashRanges(sql, [])).toBe(sql);
    });
});
