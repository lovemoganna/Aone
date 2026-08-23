import { describe, it, expect } from 'vitest';
import { ErrorRecovery } from '../ErrorRecovery';

describe('ErrorRecovery', () => {
    it('Feature 07: Should extract broken trailing keywords and append missing quotes', () => {
        const brokenSql = `SELECT * FROM users WHE`;

        let salvagedUrl = ErrorRecovery.salvage(brokenSql);

        // Assert that the broken part 'WHE' is removed and replaced by UUID
        expect(salvagedUrl).not.toContain('WHE');
        expect(salvagedUrl).toContain('__BROKEN_');

        // Simulating formatting process not touching the commented UUID
        let formattedSql = salvagedUrl + '\n';

        let restoredSql = ErrorRecovery.rollbackSalvage(formattedSql);

        // The broken part should be restored
        expect(restoredSql).toContain('WHE');
    });

    it('Feature 07: Should append missing single quote', () => {
        const brokenSql = `SELECT * FROM users WHERE name = 'John`;

        let salvagedUrl = ErrorRecovery.salvage(brokenSql);
        expect(salvagedUrl).toContain("'John'"); // appended quote

        let restoredSql = ErrorRecovery.rollbackSalvage(salvagedUrl);
        expect(restoredSql).not.toContain("'John'");
        expect(restoredSql).toContain("'John"); // Restored back to unclosed state
    });
});
