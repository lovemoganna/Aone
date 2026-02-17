
import plantumlEncoder from 'plantuml-encoder';

async function testTemplate(name: string, code: string) {
    console.log(`\n--- Testing: ${name} ---`);
    const encoded = plantumlEncoder.encode(code);
    const url = `https://www.plantuml.com/plantuml/svg/${encoded}`;

    try {
        const res = await fetch(url, { method: 'HEAD' });
        console.log(`Status: ${res.status} ${res.statusText}`);
        if (res.ok) {
            console.log("✅ SUCCESS");
        } else {
            console.log("❌ FAILED");
            // If failed, try to fetch the body to see the error message
            const fullRes = await fetch(url);
            const body = await fullRes.text();
            console.log("Error Preview:", body.substring(0, 200));
        }
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

async function run() {
    // Test the Activity Diagram Arrow Guide (Chinese)
    const arrowGuide = `@startuml
title Activity Diagram Arrow Guide

' ============================================================
' 1. Basic Arrows
' ============================================================
:Start;
-> Default arrow;
:Step 1;
-> With label;
:Step 2;

' ============================================================
' 2. Styles
' ============================================================
:Step 3;
-[#blue]-> Blue arrow;
:Step 4;
-[#red,dashed]-> Red dashed;
:Step 5;

stop
@enduml`;

    await testTemplate("Activity Arrow Guide (Simplified)", arrowGuide);

    // Test a simple activity diagram
    const simpleActivity = `@startuml
start
:First Step;
-> Go to next;
:Second Step;
stop
@enduml`;

    await testTemplate("Simple Activity", simpleActivity);

    // Test with Chinese characters - this is what failed before
    const chineseActivity = `@startuml
start
:开始;
-> 默认向下;
:步骤 1;
stop
@enduml`;

    await testTemplate("Activity with Chinese", chineseActivity);
}

run();
