import { describe, it, expect } from 'vitest';
import { BypassProtector } from '../BypassProtector';

describe('BypassProtector', () => {
    it('Feature 10: Should isolate blocks between formatter:off and formatter:on', () => {
        const sql = `
SELECT id FROM users;
/* @formatter:off */
    SELECT       badly  
          formatted  
    FROM      here;
/* @formatter:on */
SELECT name FROM roles;`;

        const isolatedSql = BypassProtector.isolateProtectedBlocks(sql);

        // Assert the bad formatting is removed from the stream
        expect(isolatedSql).not.toContain('badly');
        expect(isolatedSql).toMatch(/__PROTECTED_[0-9a-f]+__/);

        // Assume formatting happens and spaces change
        const formattedIsolated = isolatedSql.replace(/SELECT name/g, 'SELECT\n  name');

        const restoredSql = BypassProtector.restoreProtectedBlocks(formattedIsolated);

        // Assert the original bad formatting is intact
        expect(restoredSql).toContain('    SELECT       badly');
        expect(restoredSql).toContain('SELECT\n  name FROM roles');
    });
});
