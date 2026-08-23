import { describe, it, expect } from 'vitest';
import { SelectionFormatter } from '../SelectionFormatter';

// 暴露内部私有方法用于测试边界寻找逻辑
// ts-ignore for accessing private static methods in tests
const expander: any = SelectionFormatter;

describe('SelectionFormatter', () => {
    const fullSql = `SELECT a FROM table_a;
SELECT b 
FROM table_b
WHERE b = 1;

SELECT c FROM table_c;`;

    it('Feature 11: Should find correct logical boundaries for isolated selection format', () => {
        // Assume user highlighted 'FROM table_b'
        const startIdx = fullSql.indexOf('FROM table_b');

        // Find logical start boundary (Should be the S in 'SELECT b')
        const boundaryStart = expander.findLogicalStartBoundary(fullSql, startIdx);
        const expectedStart = fullSql.indexOf('SELECT b');
        expect(boundaryStart).toBe(expectedStart);

        // Find logical end boundary (Should be after 'b = 1;')
        const boundaryEnd = expander.findLogicalEndBoundary(fullSql, startIdx);
        const expectedEnd = fullSql.indexOf('WHERE b = 1;') + 12; // Length of 'WHERE b = 1;'
        expect(boundaryEnd).toBe(expectedEnd);
    });

    it('Feature 11: Should format only the selected logical block without syntax errors', () => {
        // Highlighting 'FROM table_b'
        const startIdx = fullSql.indexOf('FROM table_b');
        const endIdx = startIdx + 12; // 'FROM table_b'.length

        const result = SelectionFormatter.expandAndFormatSelection(fullSql, startIdx, endIdx);

        // Assert the surrounding statements stay untouched (and unformatted)
        expect(result.formattedSql).toContain('SELECT a FROM table_a;');
        expect(result.formattedSql).toContain('SELECT c FROM table_c;');

        // Assert the middle block was correctly formatted
        expect(result.formattedSql).toContain('SELECT\n    b\nFROM\n    table_b\nWHERE\n    b = 1;');
    });
});
