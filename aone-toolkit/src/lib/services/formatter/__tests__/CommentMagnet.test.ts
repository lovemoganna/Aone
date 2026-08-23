import { describe, it, expect } from 'vitest';
import { CommentMagnet } from '../CommentMagnet';

describe('CommentMagnet', () => {
    it('Feature 04: Comment flowing/magnetic alignment', () => {
        const sql = `
SELECT 
    id, -- The user ID
    -- The user name
    name,
    age -- Age parameter
FROM users; -- Target table`;

        const ctx = CommentMagnet.extractComments(sql);

        expect(ctx.comments.length).toBe(4);
        expect(ctx.comments[0].text).toBe('-- The user ID');
        expect(ctx.sqlWithoutComments).not.toContain('-- The user ID');

        // Ensure standard formatting doesn't obliterate the placeholders
        const restored = CommentMagnet.restoreComments(ctx.sqlWithoutComments, ctx);

        expect(restored).toContain('-- The user ID');
        expect(restored).toContain('-- The user name');
    });
});
