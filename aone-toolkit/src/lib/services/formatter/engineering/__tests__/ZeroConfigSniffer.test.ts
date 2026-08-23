import { describe, it, expect } from 'vitest';
import { ZeroConfigSniffer } from '../ZeroConfigSniffer';

describe('ZeroConfigSniffer', () => {
    it('Feature 15: Should sniff 4-space indentation and UPPERCASE keywords', () => {
        const sql = `
SELECT id, name
FROM users
WHERE 
    status = 'active'
    AND age > 18;`;

        const options = ZeroConfigSniffer.sniff(sql);

        expect(options.tabWidth).toBe(4);
        expect(options.keywordCase).toBe('upper');
    });

    it('Feature 15: Should sniff 2-space indentation and lowercase keywords', () => {
        const sql = `
select id, name
from users
where 
  status = 'active'
  and age > 18;`;

        const options = ZeroConfigSniffer.sniff(sql);

        expect(options.tabWidth).toBe(2);
        expect(options.keywordCase).toBe('lower');
    });
});
