import { describe, it, expect } from 'vitest';
import { SemanticGrouper } from '../SemanticGrouper';

describe('SemanticGrouper', () => {
    it('should group heavily wrapped pair parameters', () => {
        const sql = `
SELECT ST_Distance(
    POINT(
        lat,
        lng
    ),
    POINT(
        x,
        y
    )
)
        `;
        const result = SemanticGrouper.groupSemanticLines(sql);
        expect(result).toContain('POINT(lat, lng)');
        expect(result).toContain('POINT(x, y)');
    });

    it('should group wrapped BETWEEN ranges', () => {
        const sql = `
SELECT * FROM bounds
WHERE age BETWEEN
    10
    AND
    20
        `;
        const result = SemanticGrouper.groupSemanticLines(sql);
        expect(result).toContain('BETWEEN 10 AND 20');
    });

    it('should sort column lists alphabetically in SELECT clauses', () => {
        const sql = `
SELECT
    z_column,
    a_column,
    m_column
FROM table
        `;
        const result = SemanticGrouper.groupSemanticLines(sql);

        expect(result.toUpperCase()).toContain('A_COLUMN');
        expect(result.toUpperCase()).toContain('M_COLUMN');
        expect(result.toUpperCase()).toContain('Z_COLUMN');

        const aIdx = result.toUpperCase().indexOf('A_COLUMN');
        const mIdx = result.toUpperCase().indexOf('M_COLUMN');
        const zIdx = result.toUpperCase().indexOf('Z_COLUMN');

        expect(aIdx).toBeLessThan(mIdx);
        expect(mIdx).toBeLessThan(zIdx);
    });

    it('P2 Enhancement: JOIN Grouping - should insert empty lines between different join types', () => {
        const sql = `
SELECT *
FROM a
INNER JOIN b ON a.id = b.id
INNER JOIN c ON b.id = c.id
LEFT JOIN d ON c.id = d.id
LEFT JOIN e ON d.id = e.id
CROSS JOIN f
        `;
        const result = SemanticGrouper.groupSemanticLines(sql);

        // Should have an empty line before LEFT JOIN cluster and CROSS JOIN cluster
        const lines = result.split('\n').map(l => l.trim());

        // Find indices
        const innerIdx = lines.findIndex(l => l.includes('INNER JOIN c'));
        const gap1Idx = lines.findIndex((l, i) => l === '' && i > innerIdx);
        const leftIdx = lines.findIndex(l => l.includes('LEFT JOIN d'));

        expect(gap1Idx).toBeLessThan(leftIdx);
        expect(gap1Idx).toBeGreaterThan(innerIdx);
    });
});
