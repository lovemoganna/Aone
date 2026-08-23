import { describe, it, expect } from 'vitest';
import { DialectProtector } from '../DialectProtector';

describe('DialectProtector', () => {
    it('Feature 16: Should protect PostgreSQL JSONB operators', () => {
        const sql = `SELECT config->>'theme' AS current_theme FROM settings;`;

        const protectedSql = DialectProtector.maskDialectOperators(sql, { dialect: 'postgresql' });

        // Ensure the operator is gone and replaced
        expect(protectedSql).not.toContain('->>');
        expect(protectedSql).toMatch(/__DIALECT_OP_[0-9a-f]+__/);

        // Assume formatting adds spaces
        const formattedProtected = protectedSql.replace('AS', '\n  AS');

        const restored = DialectProtector.restoreDialectOperators(formattedProtected);

        // The operator should be back untouched
        expect(restored).toContain("config->>'theme'");
    });

    it('Feature 16: Should do nothing for standard SQL', () => {
        const sql = `SELECT config->>'theme' AS current_theme FROM settings;`;

        const protectedSql = DialectProtector.maskDialectOperators(sql, { dialect: 'sql' });

        // Since dialect = sql, it ignores PG operators
        expect(protectedSql).toContain('->>');
    });
});
