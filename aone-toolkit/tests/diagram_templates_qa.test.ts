import { describe, it, expect } from 'vitest';
import { TEMPLATES } from '../src/routes/diagram-editor/lib/templates';
import { renderGraphviz } from '../src/routes/diagram-editor/lib/graphviz';
import { encodePlantUML } from '../src/routes/diagram-editor/lib/plantuml';
import { sanitizeSvg } from '../src/routes/diagram-editor/lib/sanitize';
import { validateDiagram } from '../src/routes/diagram-editor/lib/validation';

describe('Diagram Editor Templates Loop QA Inspection', () => {
    it('should have unique IDs across all templates and cover all categories', () => {
        const ids = TEMPLATES.map(t => t.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
        expect(TEMPLATES.length).toBeGreaterThanOrEqual(100);

        const categories = new Set(TEMPLATES.map(t => t.category));
        expect(categories.size).toBeGreaterThanOrEqual(10);
    });

    it('should validate all PlantUML templates successfully', () => {
        const pumlTemplates = TEMPLATES.filter(t => t.mode === 'plantuml');
        expect(pumlTemplates.length).toBeGreaterThan(0);

        for (const t of pumlTemplates) {
            expect(t.code).toBeTruthy();
            const validation = validateDiagram(t.code, 'plantuml');
            expect(validation.isValid, `PlantUML template [${t.id}: ${t.name}] should be valid: ${validation.errors.map(e => e.message).join(', ')}`).toBe(true);

            // Verify plantuml encoder can encode without throw
            const encoded = encodePlantUML(t.code);
            expect(encoded).toBeTruthy();
            expect(encoded.length).toBeGreaterThan(5);
        }
    });

    it('should render all Graphviz DOT templates successfully via @viz-js/viz', async () => {
        const dotTemplates = TEMPLATES.filter(t => t.mode === 'graphviz');
        expect(dotTemplates.length).toBeGreaterThan(0);

        for (const t of dotTemplates) {
            expect(t.code).toBeTruthy();
            const validation = validateDiagram(t.code, 'graphviz');
            expect(validation.isValid, `Graphviz template [${t.id}: ${t.name}] should be valid: ${validation.errors.map(e => e.message).join(', ')}`).toBe(true);

            // Execute local Graphviz rendering
            const svg = await renderGraphviz(t.code, t.engine || 'dot');
            expect(svg, `Graphviz template [${t.id}] failed to produce SVG`).toContain('<svg');

            // Verify sanitizeSvg does not corrupt SVG
            const clean = sanitizeSvg(svg);
            expect(clean).toContain('<svg');
        }
    });
});
