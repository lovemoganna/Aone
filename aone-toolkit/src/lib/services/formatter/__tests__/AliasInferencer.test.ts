import { describe, it, expect } from 'vitest';
import { AliasInferencer } from '../AliasInferencer';

describe('AliasInferencer', () => {
    it('Feature 05: Auto alias generation for long table names', () => {
        const sql = `
SELECT 
    user_action_transaction_history.amount,
    user_action_transaction_history.status
FROM user_action_transaction_history
JOIN system_configuration_parameters ON
    system_configuration_parameters.id = user_action_transaction_history.config_id
WHERE user_action_transaction_history.amount > 100;`;

        const result = AliasInferencer.applyAliases(sql);

        // user_action_transaction_history (uath)
        // system_configuration_parameters (scp)

        expect(result).toContain('uath.amount');
        expect(result).toContain('uath.status');
        expect(result).toContain('scp.id');
        expect(result).toContain('FROM user_action_transaction_history AS uath');
        expect(result).toContain('JOIN system_configuration_parameters AS scp');
    });

    it('Feature 05: Frequency-Based Import Sorcery - should sort ES6 destructured imports based on frequency', () => {
        const code = `
import { rarelyUsed, heavilyUsed, moderatelyUsed as mUsed } from 'some-lib';

function doSomething() {
    heavilyUsed(); heavilyUsed(); heavilyUsed();
    mUsed(); mUsed();
    // rarelyUsed is never called
}
        `;

        const result = AliasInferencer.sortImportsByUsage(code);
        // heavilyUsed (3), mUsed (2), rarelyUsed (0)
        expect(result).toContain("import { heavilyUsed, moderatelyUsed as mUsed, rarelyUsed } from 'some-lib';");
    });
});
