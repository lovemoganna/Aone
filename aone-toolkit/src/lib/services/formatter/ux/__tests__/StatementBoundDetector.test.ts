import { describe, it, expect } from 'vitest';
import { StatementBoundDetector } from '../StatementBoundDetector';

describe('StatementBoundDetector', () => {
    it('should detect boundaries for a single statement', () => {
        const sql = 'SELECT * FROM users;';
        const bounds = StatementBoundDetector.detect(sql, 5); // inside SELECT
        expect(bounds.from).toBe(0);
        expect(sql.substring(bounds.from, bounds.to)).toBe('SELECT * FROM users;');
    });

    it('should detect the correct statement in a multi-statement script', () => {
        const sql = 'SELECT 1; SELECT 2; SELECT 3;';

        // Cursor on "SELECT 2"
        const offset = sql.indexOf('2');
        const bounds = StatementBoundDetector.detect(sql, offset);

        expect(sql.substring(bounds.from, bounds.to)).toBe('SELECT 2;');
    });

    it('should handle semicolons inside quotes', () => {
        const sql = "SELECT 'hello; world'; SELECT 2;";

        const offset = sql.indexOf('world');
        const bounds = StatementBoundDetector.detect(sql, offset);

        expect(sql.substring(bounds.from, bounds.to)).toBe("SELECT 'hello; world';");
    });

    it('should handle leading/trailing whitespace', () => {
        const sql = '   SELECT 1;   SELECT 2;   ';

        const offset = sql.indexOf('1');
        const bounds = StatementBoundDetector.detect(sql, offset);

        expect(sql.substring(bounds.from, bounds.to)).toBe('SELECT 1;');
    });
});
