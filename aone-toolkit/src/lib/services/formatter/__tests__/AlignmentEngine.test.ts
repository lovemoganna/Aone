import { describe, it, expect } from 'vitest';
import { AlignmentEngine } from '../AlignmentEngine';
import { CodeFormatterService } from '../CodeFormatterService';

describe('AlignmentEngine', () => {
    it('Feature 01: Multi-Axis Columnar Alignment - should align VALUES', () => {
        const sql = `INSERT INTO users (id, name, city)
VALUES (1, 'Alice', 'New York'),
       (2, 'Bob', 'London'),
       (3, 'Charlie', 'San Francisco');`;
        const result = AlignmentEngine.alignGrid(sql);
        expect(result).toContain("'Alice'  , 'New York'");
        expect(result).toContain("'Bob'    , 'London'");
        expect(result).toContain("'Charlie', 'San Francisco'");
    });

    it('Feature 02: Deep Nesting Breaking - should break AND/OR', () => {
        const sql = `SELECT * FROM tbl WHERE a=1 AND b=2 OR c=3;`;
        const result = AlignmentEngine.breakDeepNesting(sql);
        expect(result).toContain('\n    AND b=2');
        expect(result).toContain('\n    OR c=3');
    });

    it('Feature 03: Alignment Sparsity Check - should skip alignment if too sparse', () => {
        const sql = `INSERT INTO users (id, name) VALUES (1, 'Alice'), (2, 'very_long_name_that_should_not_trigger_alignment_across_all_rows_if_it_makes_it_too_sparse');`;
        const result = AlignmentEngine.alignGrid(sql);
        // Should not contain excessive padding
        expect(result).not.toContain('Alice' + ' '.repeat(50));
    });

    it('P0 Regression: Escaped quotes in VALUES', () => {
        const sql = `INSERT INTO users (name, city)
VALUES
    ('O''Reilly', 'Dublin'),
    ('Li', 'Beijing');`;
        const result = AlignmentEngine.alignGrid(sql);
        expect(result).toContain("'O''Reilly', 'Dublin'");
    });

    it('P1 Regression: Bracket awareness - should not break AND/OR inside functions', () => {
        const sql = `SELECT * FROM tbl WHERE some_func(a, b AND c) OR d = 1`;
        const result = AlignmentEngine.breakDeepNesting(sql);
        // AND should be kept on the same line because it's inside some_func
        expect(result).not.toContain('\n    AND c');
        // OR should be broken because it's at depth 0
        expect(result).toContain('\n    OR d = 1');
    });

    it('Phase 2: CTE Global Alignment', () => {
        const sql = `WITH cte1 AS (SELECT 1),
    longer_cte_name AS (SELECT 2)
    SELECT * FROM cte1;`;
        const result = AlignmentEngine.alignCTEs(sql);
        // Both 'AS (' should align based on the longest name
        expect(result).toContain('cte1            AS (');
        expect(result).toContain('longer_cte_name  AS (');
    });

    it('Phase 2: DuckDB EXCLUDE/REPLACE Protection', () => {
        const sql = `SELECT * EXCLUDE (secret_col) FROM users;`;
        const result = CodeFormatterService.format(sql, { dialect: 'sql' });
        expect(result.result).toContain('EXCLUDE (secret_col)');
    });

    it('Phase 4: CASE WHEN Alignment', () => {
        const sql = `SELECT CASE
    WHEN a = 1 THEN 'one'
    WHEN longer_condition = 2 THEN 'two'
END FROM tbl;`;
        const result = AlignmentEngine.alignCase(sql);
        expect(result).toContain("WHEN a = 1" + " ".repeat(16) + "THEN 'one'");
        expect(result).toContain("WHEN longer_condition = 2 THEN 'two'");
    });
});
