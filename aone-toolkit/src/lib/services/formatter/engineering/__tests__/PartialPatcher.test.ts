import { describe, it, expect } from 'vitest';
import { PartialPatcher } from '../PartialPatcher';

describe('PartialPatcher', () => {
    it('should calculate minimal line-based patches', () => {
        const original = 'line1\nline2\nline3';
        const formatted = 'line1\nLINE2\nline3'; // change line 2

        const patches = PartialPatcher.calculatePatches(original, formatted);

        // Should have a removal and an addition for line 2
        expect(patches.length).toBeGreaterThan(0);

        // Apply patches to verify
        let result = original;
        // Sort patches descending by 'from' to apply without index shifting
        const sortedPatches = [...patches].sort((a, b) => b.from - a.from);

        for (const patch of sortedPatches) {
            result = result.substring(0, patch.from) + patch.insert + result.substring(patch.to);
        }

        expect(result).toBe(formatted);
    });

    it('should handle full replacement if necessary', () => {
        const original = 'A';
        const formatted = 'B';
        const patches = PartialPatcher.calculatePatches(original, formatted);
        expect(patches.some(p => p.insert === 'B')).toBe(true);
    });
});
