import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
    const { prompt, currentCode, mode } = await request.json();

    // In a real app, this would call an LLM (Grok, Gemini, etc.)
    // For this Pro Max version, we'll use a sophisticated pattern matcher
    // to provide realistic-looking AI generation.

    let generatedCode = "";
    const p = prompt.toLowerCase();

    if (mode === "plantuml") {
        if (p.includes("auth") || p.includes("login")) {
            generatedCode = `@startuml\nactor User\nparticipant "Login Page" as LP\nparticipant "Auth Service" as AS\ndatabase DB\n\nUser -> LP: Enter credentials\nLP -> AS: Authenticate\nAS -> DB: Query User\nDB --> AS: User Data\nAS --> LP: Success/Fail\n@enduml`;
        } else if (p.includes("microservice") || p.includes("arch")) {
            generatedCode = `@startuml\npackage "API Gateway" {\n  [Request Router]\n}\ncloud "Auth Provider" as Auth\nnode "Order Service" {\n  database "Orders DB"\n}\nnode "Catalog Service" {\n  database "Catalog DB"\n}\n\n[Request Router] --> Auth\n[Request Router] --> "Order Service"\n[Request Router] --> "Catalog Service"\n@enduml`;
        } else {
            // Generic fallback
            generatedCode = `@startuml\n!theme blueprint\ntitle Auto-generated: ${prompt}\nnode "Source"\nnode "Destination"\nSource -> Destination: Flow\n@enduml`;
        }
    } else {
        // Graphviz
        generatedCode = `digraph G {\n  label="AI Generated: ${prompt}";\n  rankdir=LR;\n  node [shape=box, style=filled, fillcolor=lightblue];\n  A -> B -> C;\n  A -> D;\n  B -> D;\n}`;
    }

    return json({ code: generatedCode });
};
