import { describe, it, expect } from 'vitest';
import { SafetyAssertion } from '../SafetyAssertion';

describe('SafetyAssertion', () => {
    it('Feature 06: Should assert structural equivalence correctly', () => {
        const originalSql = `
SELECT 
    id,   name 
FROM 
    users -- targeting users
WHERE id = 1;`;

        const formattedSql = `
SELECT id, name
FROM users
WHERE
  id = 1;`;

        // Should return true because the structure and non-trivial tokens match
        expect(SafetyAssertion.assertSafe(originalSql, formattedSql)).toBe(true);
    });

    it('Feature 06: Should detect tampering', () => {
        const originalSql = `SELECT id, name FROM users WHERE id = 1;`;
        const tamperedSql = `SELECT id, name, age FROM users WHERE id = 1;`;

        // Should detect structural difference
        expect(SafetyAssertion.assertSafe(originalSql, tamperedSql)).toBe(false);
    });
});
