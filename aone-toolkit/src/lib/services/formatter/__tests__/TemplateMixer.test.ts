import { describe, it, expect } from 'vitest';
import { TemplateMixer } from '../TemplateMixer';

describe('TemplateMixer', () => {
    it('Feature 03: Template tags mixed formatting - should extract and restore tags', () => {
        const sql = `
SELECT * FROM users
WHERE 1 = 1
<if test="name != null">
    AND name = #{name}
</if>
{% if age_limit %}
    AND age > {{ age_limit }}
{% endif %}`;

        const extracted = TemplateMixer.extractTemplates(sql);

        // Assert templates are replaced by UUIDs
        expect(extracted).not.toContain('<if test="name != null">');
        expect(extracted).not.toContain('{% if age_limit %}');
        expect(extracted).toMatch(/__TPL_[0-9a-f]+__/);

        // Simulate format process adding spaces
        const formattedExtracted = extracted + '   ';

        const restored = TemplateMixer.restoreTemplates(formattedExtracted);

        // Assert templates are back
        expect(restored).toContain('<if test="name != null">');
        expect(restored).toContain('{% if age_limit %}');
    });

    it('Feature 3: Nested DSL Recursor - should recursively format tagged templates', () => {
        const tsCode = `
const query = sql\`
select id from users
where active=1
\`;
        `;

        // Mock formatter callback
        const mockFormatter = (text: string, lang: string) => {
            if (lang === 'sql') return text.trim().toUpperCase() + '\n    ';
            return text;
        };

        const result = TemplateMixer.processNestedDSLs(tsCode, mockFormatter);

        expect(result).toMatch(/sql`\s*\nSELECT ID FROM USERS\s*\nWHERE ACTIVE=1\s*\n\s*`/);
    });
});
