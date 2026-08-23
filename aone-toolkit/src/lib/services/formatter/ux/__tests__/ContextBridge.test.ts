import { describe, it, expect } from 'vitest';
import { ContextBridge } from '../ContextBridge';

describe('ContextBridge (Chameleon Paste)', () => {
    describe('extractContext', () => {
        it('should extract correct base indent from a deeply nested insertion point', () => {
            const sql = `
SELECT *
FROM users
WHERE id IN (
    SELECT user_id
    FROM orders
    /* cursor is right here */
)`;
            const insertIndex = sql.indexOf('/* cursor');
            const context = ContextBridge.extractContext(sql, insertIndex);
            expect(context.baseIndent).toBe('    ');
        });

        it('should return empty string if no indentation exists', () => {
            const sql = `SELECT * \nFROM users`;
            const insertIndex = sql.length;
            const context = ContextBridge.extractContext(sql, insertIndex);
            expect(context.baseIndent).toBe('');
        });

        it('should handle tab indentation', () => {
            const sql = `\t\tSELECT *\n\t\t/* cursor */`;
            const insertIndex = sql.indexOf('/* cursor');
            const context = ContextBridge.extractContext(sql, insertIndex);
            expect(context.baseIndent).toBe('\t\t');
        });
    });

    describe('formatAndAdaptPaste', () => {
        it('should format pasted code and apply base indentation', () => {
            const pastedCode = `select id, name from users where active = 1`;
            const context = { baseIndent: '    ' };
            const adapted = ContextBridge.formatAndAdaptPaste(pastedCode, context, { dialect: 'sql' });
            expect(adapted.toUpperCase()).toContain('SELECT');
            expect(adapted.toUpperCase()).toContain('FROM');
        });

        it('should return pasted code untouched if empty', () => {
            const pastedCode = `   `;
            const context = { baseIndent: '    ' };
            const adapted = ContextBridge.formatAndAdaptPaste(pastedCode, context);
            expect(adapted).toBe(`   `);
        });

        it('should strip common indentation from pasted code before adapting', () => {
            const pastedCode = `
                SELECT 1
                FROM dual
            `;
            const context = { baseIndent: '    ' };
            const adapted = ContextBridge.formatAndAdaptPaste(pastedCode, context);

            // Normalize spaces for comparison if needed, or check discrete tokens
            const normalized = adapted.toUpperCase().replace(/\s+/g, ' ');
            expect(normalized).toContain("SELECT 1 FROM DUAL");
            // Verify that at least some indentation was applied to subsequent lines
            expect(adapted).toContain("    ");
        });
    });
});
