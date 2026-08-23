import { describe, it, expect } from 'vitest';
import { DiffStats } from '../DiffStats';

describe('DiffStats', () => {
    it('should correctly calculate intensity for whitespace changes', () => {
        const original = 'SELECT * FROM users';
        const formatted = 'SELECT * \nFROM users';

        const stats = DiffStats.calculateIntensity(original, formatted);

        expect(stats.whitespaceOnly).toBe(true);
        expect(stats.additions).toBeGreaterThanOrEqual(1);
        expect(stats.deletions).toBeGreaterThanOrEqual(0);
        expect(stats.intensityScore).toBeGreaterThan(0);
    });

    it('should detect non-whitespace changes', () => {
        const original = 'SELECT * FROM users';
        const formatted = 'SELECT * FROM members';

        const stats = DiffStats.calculateIntensity(original, formatted);

        expect(stats.whitespaceOnly).toBe(false);
    });

    it('should return 0 score for identical strings', () => {
        const sql = 'SELECT 1';
        const stats = DiffStats.calculateIntensity(sql, sql);
        expect(stats.intensityScore).toBe(0);
        expect(stats.additions).toBe(0);
    });

    it('should generate change distribution segments', () => {
        const original = '1234567890';
        const formatted = '123_4567890'; // Add '_' at index 3

        const segments = 10;
        const distribution = DiffStats.getChangeDistribution(original, formatted, segments);

        expect(distribution.length).toBe(segments);
        // The addition happens at roughly 3/10 segment
        expect(distribution[3]).toBeGreaterThan(0);
        // Other segments should be 0
        const totalChanges = distribution.reduce((a, b) => a + b, 0);
        expect(totalChanges).toBe(1);
    });
});
