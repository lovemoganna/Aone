import { describe, it, expect, vi } from 'vitest';
import { FuzzyParser } from '../FuzzyParser';

describe('FuzzyParser', () => {
    it('should identify and format valid segments within broken text', () => {
        const brokenSql = `
            Some random text here
            SELECT * FROM users where id = 1
            More broken syntax >>> {{{{
            INSERT INTO logs (msg) VALUES ('test')
        `;

        // Mock formatter callback
        const mockFormatter = vi.fn((sql: string) => sql.toUpperCase());

        const { result } = FuzzyParser.salvageAndFormat(brokenSql, mockFormatter);

        expect(mockFormatter).toHaveBeenCalled();
        expect(result).toContain('SELECT');
        expect(result).toContain('INSERT');
        expect(result).toContain('Some random text');
        expect(result).toContain('{{{{');
    });

    it('should preserve whitespace between islands', () => {
        const brokenSql = 'SELECT 1; \n\n INVALID_CODE \n\n SELECT 2;';
        const mockFormatter = (sql: string) => sql.trim();
        const { result } = FuzzyParser.salvageAndFormat(brokenSql, mockFormatter);

        expect(result).toContain('\n\n INVALID_CODE \n\n');
    });

    it('should handle deeply nested brackets without truncating', () => {
        const nestedSql = "SELECT (SELECT (SELECT 1)) FROM dual; NEXT_SELECT 1";
        const mockFormatter = (sql: string) => sql;
        const { result } = FuzzyParser.salvageAndFormat(nestedSql, mockFormatter);

        // Should capture the entire first query despite nested parentheses
        expect(result).toContain("SELECT (SELECT (SELECT 1)) FROM dual;");
        expect(result).toContain("NEXT_SELECT 1");
    });
});

