import { describe, it, expect } from 'vitest';
import { SanitizeExporter } from '../SanitizeExporter';

describe('SanitizeExporter', () => {
    it('Feature 14: Should aggressively drop comments and expand names for Slack export', () => {
        const sensitiveSql = `
-- Proprietary trading algorithm DB table
SELECT 
    user_action_transaction_history.amount, -- highly confidential
    id
FROM user_action_transaction_history
/* BIG BLOCK 
   OF SECRETS 
*/
WHERE id = 1;`;

        const exported = SanitizeExporter.exportSanitized(sensitiveSql, { useAliasInference: true });

        // Assert comments are completely gone
        expect(exported).not.toContain('Proprietary');
        expect(exported).not.toContain('confidential');
        expect(exported).not.toContain('SECRETS');

        // Assert that the alias inferencer was applied and format is compact
        expect(exported).toContain('uath.amount');
        expect(exported).toContain('FROM\n  user_action_transaction_history AS uath');

        // Assert compactness (no double new lines)
        expect(exported).not.toContain('\n\n\n');
    });
});
