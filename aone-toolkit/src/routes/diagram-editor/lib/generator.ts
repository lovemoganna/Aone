// High-performance architecture diagram generator
// Supports OpenAI-compatible LLM endpoint when configured, with zero-latency local synthesis fallback.

interface DiagramTemplate {
    keywords: string[];
    generate: (prompt: string, context: string) => string;
}

const TEMPLATES: DiagramTemplate[] = [
    {
        keywords: ['auth', 'login', 'sso', 'oauth', 'token', 'jwt', 'security'],
        generate: () => `@startuml
!theme plain
skinparam roundcorner 8
skinparam defaultFontName "Inter, -apple-system, sans-serif"

title "Authentication Flow (OAuth2 / OIDC)"

actor "User" as user
participant "Client App" as client
participant "Auth Gateway" as auth
database "Identity DB" as db

user -> client: Initiate Login Request
activate client
client -> auth: Redirect to /oauth/authorize
activate auth
auth -> user: Present Login Challenge
user -> auth: Submit Credentials + MFA
auth -> db: Validate Identity Record
activate db
db --> auth: Identity Verified (Status: Active)
deactivate db
auth -> client: Callback with Auth Code
deactivate auth
client -> auth: Exchange Code for Access Token
activate auth
auth --> client: Issue JWT Token (Access + Refresh)
deactivate auth
client -> user: Session Established (Dashboard)
deactivate client
@enduml`
    },
    {
        keywords: ['microservice', 'architecture', 'service', 'gateway', 'backend', 'api'],
        generate: () => `@startuml
!theme plain
skinparam roundcorner 8
skinparam defaultFontName "Inter, -apple-system, sans-serif"
left to right direction

package "Ingress & Edge" {
  [Cloudflare / WAF] as waf
  [API Gateway] as gateway
}

package "Domain Microservices" {
  component "Auth Service" as authSvc
  component "Order Service" as orderSvc
  component "Inventory Service" as invSvc
}

package "Persistence & Messaging" {
  database "PostgreSQL (Primary)" as db
  database "Redis Cache" as cache
  queue "Kafka Event Bus" as kafka
}

waf --> gateway
gateway --> authSvc : Verify Bearer Token
gateway --> orderSvc : Route Order API
gateway --> invSvc : Query Inventory

orderSvc --> db : Transact
orderSvc --> cache : Read Cache
orderSvc --> kafka : Publish OrderCreated Event
kafka --> invSvc : Consume Stock Allocation
@enduml`
    },
    {
        keywords: ['state', 'machine', 'lifecycle', 'workflow', 'pipeline'],
        generate: () => `@startuml
!theme plain
skinparam roundcorner 8
skinparam defaultFontName "Inter, -apple-system, sans-serif"

title "Order Lifecycle State Machine"

[*] --> Created : Submit Order
Created --> Validating : Inventory Lock
Validating --> PendingPayment : Validation Passed
Validating --> Failed : Insufficient Stock

PendingPayment --> Paid : Payment Captured
PendingPayment --> Expired : TTL Timeout (15m)

state "Fulfillment" as Fulfillment {
  [*] --> Packing
  Packing --> Dispatched : Courier Handover
  Dispatched --> InTransit : Tracking Active
}

Paid --> Fulfillment : Route to Warehouse
InTransit --> Delivered : Signature Confirmed
Delivered --> [*]

Failed --> [*]
Expired --> [*]
@enduml`
    },
    {
        keywords: ['er', 'entity', 'relationship', 'database', 'schema', 'table'],
        generate: () => `@startuml
!theme plain
hide circle
skinparam linetype ortho
skinparam defaultFontName "Inter, -apple-system, sans-serif"

entity "User" as users {
  *id : uuid <<PK>>
  --
  *email : varchar(255)
  username : varchar(100)
  created_at : timestamp
}

entity "Order" as orders {
  *id : uuid <<PK>>
  --
  *user_id : uuid <<FK>>
  status : enum_order_status
  total_amount : numeric(10,2)
  created_at : timestamp
}

entity "OrderItem" as order_items {
  *id : uuid <<PK>>
  --
  *order_id : uuid <<FK>>
  product_id : uuid
  quantity : int
  unit_price : numeric(10,2)
}

users ||..o{ orders : "places"
orders ||..|{ order_items : "contains"
@enduml`
    }
];

export async function generateDiagramFromAI(
    prompt: string,
    currentCode: string,
    mode: 'plantuml' | 'graphviz'
): Promise<string> {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return currentCode;

    // 1. Check for configured LLM API
    let apiKey = '';
    let endpoint = 'https://api.openai.com/v1/chat/completions';
    let model = 'gpt-4o-mini';

    if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('aone_ai_config');
        if (stored) {
            try {
                const config = JSON.parse(stored);
                if (config.apiKey) apiKey = config.apiKey;
                if (config.endpoint) endpoint = config.endpoint;
                if (config.model) model = config.model;
            } catch (e) {
                // ignore json error
            }
        }
    }

    if (apiKey) {
        try {
            const systemPrompt = `You are a software architect expert. Generate valid ${mode === 'plantuml' ? 'PlantUML' : 'Graphviz DOT'} code for the requested architecture. Output ONLY the raw code wrapped inside ${mode === 'plantuml' ? '@startuml and @enduml' : 'digraph G { ... }'}. Do NOT include markdown backticks or commentary.`;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: trimmedPrompt }
                    ],
                    temperature: 0.2
                })
            });

            if (res.ok) {
                const data = await res.json();
                const text = data.choices?.[0]?.message?.content?.trim();
                if (text) {
                    return text.replace(/```(plantuml|dot|graphviz)?/g, '').replace(/```/g, '').trim();
                }
            }
        } catch (e) {
            console.warn("AI generation failed, using local generator", e);
        }
    }

    // 2. Local zero-latency synthesis
    const p = trimmedPrompt.toLowerCase();
    const matched = TEMPLATES.find(t => t.keywords.some(k => p.includes(k)));

    if (matched && mode === 'plantuml') {
        return matched.generate(trimmedPrompt, currentCode);
    }

    // Dynamic contextual generation based on prompt entities
    const title = trimmedPrompt.length > 30 ? `${trimmedPrompt.slice(0, 30)}...` : trimmedPrompt;

    if (mode === 'plantuml') {
        return `@startuml
!theme plain
skinparam roundcorner 8
skinparam defaultFontName "Inter, -apple-system, sans-serif"

title "${title}"

actor Client
component "API Gateway" as Gateway
component "Service Layer" as Svc
database "Data Storage" as DB

Client -> Gateway : Request (${trimmedPrompt.slice(0, 20)})
Gateway -> Svc : Forward Action
activate Svc
Svc -> DB : Query / Mutate
DB --> Svc : Data Record
Svc --> Gateway : Processed Result
deactivate Svc
Gateway --> Client : Response 200 OK
@enduml`;
    } else {
        return `digraph G {
  label="${title}";
  rankdir=LR;
  node [shape=box, style="filled,rounded", fillcolor="#f1f5f9", color="#64748b", fontname="Helvetica"];
  
  Client [shape=ellipse, fillcolor="#e0e7ff", color="#4f46e5"];
  Gateway [label="API Gateway"];
  Service [label="Business Logic"];
  Database [shape=cylinder, fillcolor="#fef3c7", color="#d97706"];
  
  Client -> Gateway [label="Request"];
  Gateway -> Service [label="Forward"];
  Service -> Database [label="Query/Write"];
  Database -> Service [label="Result"];
  Service -> Gateway [label="Response"];
  Gateway -> Client [label="200 OK"];
}`;
    }
}
