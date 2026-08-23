
import { describe, test, expect } from 'vitest';
import { findDefinitions, extractProperties } from './parser';
import { injectColor, injectLabel, injectShape } from './modifier';

const plantUmlCode = `
@startuml
class User {
  +name: string
}
class "Order" as ord #red
component [Database]
rectangle System
User -> Order
@enduml
`;

describe('diagram-editor parser & modifier', () => {
    test('PlantUML modifier color injection', () => {
        const pColor1 = injectColor(plantUmlCode, 'User', '#blue', 'plantuml');
        expect(pColor1).toContain('class User #blue {');

        const pColor2 = injectColor(plantUmlCode, 'Order', '#green', 'plantuml');
        expect(pColor2).toContain('Order #green');
    });

    test('PlantUML parser & modifier advanced features', () => {
        const plantUmlAdv = `
class Foo "My Label"
class "My Alias Label" as Bar
component [Comp Label] as C1
database DB
`;

        const pAdvDefs = findDefinitions(plantUmlAdv, 'plantuml');
        const fooProps = extractProperties(pAdvDefs.get('Foo')!.raw, 'plantuml');
        expect(fooProps.label).toBe("My Label");

        const barProps = extractProperties(pAdvDefs.get('Bar')!.raw, 'plantuml');
        expect(barProps.label).toBe("My Alias Label");

        const c1Props = extractProperties(pAdvDefs.get('C1')!.raw, 'plantuml');
        expect(c1Props.label).toBe("Comp Label");

        const dbDef = pAdvDefs.get('DB');
        expect(dbDef!.type).toBe('database');

        const pLabel1 = injectLabel(plantUmlAdv, 'Foo', 'New Label', 'plantuml');
        expect(pLabel1).toContain('class Foo "New Label"');

        const pLabel2 = injectLabel(plantUmlAdv, 'Bar', 'New Alias', 'plantuml');
        expect(pLabel2).toContain('class "New Alias" as Bar');

        const pShape1 = injectShape(plantUmlAdv, 'DB', 'cloud', 'plantuml');
        expect(pShape1).toContain('cloud DB');
    });

    test('Graphviz modifier features', () => {
        const gAdv = `
A [label="Old Label", shape=box];
`;
        const gLabel = injectLabel(gAdv, 'A', 'New G Label', 'graphviz');
        expect(gLabel).toContain('label="New G Label"');

        const gShape = injectShape(gAdv, 'A', 'circle', 'graphviz');
        expect(gShape).toContain('shape=circle');
    });
});


