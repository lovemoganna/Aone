import { describe, it, expect, vi } from 'vitest';
import { BlockStreamer } from '../BlockStreamer';

describe('BlockStreamer', () => {
    it('should split large SQL into chunks and format them separately', () => {
        // Create a string that would normally be one large statement
        const sql = 'SELECT 1; SELECT 2; SELECT 3;';

        // Mock formatter callback
        const mockFormatter = vi.fn((sql: string) => sql);

        // Set a very small chunk size to trigger streaming
        const result = BlockStreamer.formatStream(sql, mockFormatter, {}, 5);

        // It should be called multiple times
        expect(mockFormatter).toHaveBeenCalled();
        expect(mockFormatter.mock.calls.length).toBeGreaterThan(1);

        expect(result).toContain('SELECT 1;');
        expect(result).toContain('SELECT 2;');
        expect(result).toContain('SELECT 3;');
    });

    it('should bypass streaming for small files', () => {
        const sql = 'SELECT 1;';
        const mockFormatter = vi.fn((sql: string) => sql);

        const result = BlockStreamer.formatStream(sql, mockFormatter, {}, 1000);

        expect(mockFormatter).toHaveBeenCalledTimes(1);
        expect(result).toBe(sql);
    });
});
