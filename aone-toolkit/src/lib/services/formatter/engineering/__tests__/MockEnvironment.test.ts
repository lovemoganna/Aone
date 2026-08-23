import { describe, it, expect } from 'vitest';
import { MockEnvironment } from '../MockEnvironment';

describe('MockEnvironment', () => {
    it('should validate positive formatting results', () => {
        const original = 'SELECT * FROM users';
        const formatted = 'SELECT *\nFROM\n  users';

        const result = MockEnvironment.validate(original, formatted);
        expect(result.isValid).toBe(true);
        expect(result.errors.length).toBe(0);
    });

    it('should catch critical keyword loss', () => {
        const original = 'SELECT * FROM users WHERE id = 1';
        const formatted = 'SELECT * FROM users -- WHERE id = 1 (mangled)';

        const result = MockEnvironment.validate(original, formatted);
        expect(result.isValid).toBe(false);
        expect(result.errors[0]).toContain('Critical Keyword Loss');
    });

    it('should enforce dialect-specific rules (Postgres)', () => {
        const original = 'SELECT "name" FROM users';
        const formatted = 'SELECT `name` FROM users'; // MYSql style backticks added by mistake

        const result = MockEnvironment.validate(original, formatted, 'postgresql');
        expect(result.isValid).toBe(false);
        expect(result.errors[0]).toContain('Postgres Dialect Violation');
    });

    it('should issue warnings for significant code shrinkage', () => {
        const original = 'SELECT ' + 'a,'.repeat(100) + ' z FROM t';
        const formatted = 'SELECT z FROM t';

        const result = MockEnvironment.validate(original, formatted);
        expect(result.warnings.length).toBeGreaterThan(0);
    });
});
