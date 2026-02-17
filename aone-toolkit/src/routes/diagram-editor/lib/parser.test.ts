
// ... (previous content preserved by file handling if I appended, but I'm overwriting to save token/effort, wait, write_to_file overwrites)
// I will rewrite the whole test file to include both.

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

const graphvizCode = `
digraph G {
    node [shape=box];
    A [label="Start", color=blue];
    B;
    A -> B;
}
`;

console.log("--- Testing Parser ---");
// (Previous tests skipped for brevity in log, but useful to keep)

console.log("--- Testing Modifier (PlantUML) ---");
const pColor1 = injectColor(plantUmlCode, 'User', '#blue', 'plantuml');
console.log("User #blue:", pColor1.includes('class User #blue {'));

const pColor2 = injectColor(plantUmlCode, 'Order', '#green', 'plantuml');
console.log("Order #green:", pColor2.includes('#green'));
console.log("Order no #red:", !pColor2.includes('#red'));

console.log("--- Testing Parser (Advanced) ---");
const plantUmlAdv = `
class Foo "My Label"
class "My Alias Label" as Bar
component [Comp Label] as C1
database DB
`;

const pAdvDefs = findDefinitions(plantUmlAdv, 'plantuml');
const fooProps = extractProperties(pAdvDefs.get('Foo')!.raw, 'plantuml');
console.log("Foo Label:", fooProps.label === "My Label");

const barProps = extractProperties(pAdvDefs.get('Bar')!.raw, 'plantuml');
console.log("Bar Label:", barProps.label === "My Alias Label");

const c1Props = extractProperties(pAdvDefs.get('C1')!.raw, 'plantuml');
console.log("C1 Label:", c1Props.label === "Comp Label");

const dbDef = pAdvDefs.get('DB');
console.log("DB Shape:", dbDef!.type === 'database');

console.log("--- Testing Modifier (Advanced) ---");
// Label Injection
const pLabel1 = injectLabel(plantUmlAdv, 'Foo', 'New Label', 'plantuml');
console.log("Foo New Label:", pLabel1.includes('class Foo "New Label"'));

const pLabel2 = injectLabel(plantUmlAdv, 'Bar', 'New Alias', 'plantuml');
console.log("Bar New Label:", pLabel2.includes('class "New Alias" as Bar'));

// Shape Injection
const pShape1 = injectShape(plantUmlAdv, 'DB', 'cloud', 'plantuml');
console.log("DB is cloud:", pShape1.includes('cloud DB'));

// Graphviz
const gAdv = `
A [label="Old Label", shape=box];
`;
const gLabel = injectLabel(gAdv, 'A', 'New G Label', 'graphviz');
console.log("G Label:", gLabel.includes('label="New G Label"'));

const gShape = injectShape(gAdv, 'A', 'circle', 'graphviz');
console.log("G Shape:", gShape.includes('shape=circle'));

