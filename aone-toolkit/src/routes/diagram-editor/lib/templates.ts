export type Template = {
    id: string;
    name: string;
    mode: 'plantuml' | 'graphviz';
    engine?: string;
    code: string;
    category?: string;
};

export const TEMPLATES: Template[] = [
    // --- STRUCTURE (Static) ---
    {
        id: 'puml-class',
        name: 'Class Diagram',
        mode: 'plantuml',
        category: 'UML: Structure',
        code: `@startuml
skinparam classAttributeIconSize 0

abstract class Animal {
    - name: String
    - age: int
    + {abstract} makeSound(): void
    + eat(): void
}

class Dog extends Animal {
    - breed: String
    + makeSound(): void
    + fetch(): void
}

class Cat extends Animal {
    - indoor: boolean
    + makeSound(): void
}

interface Trainable {
    + train(command: String): void
}

Dog ..|> Trainable

class Owner {
    - name: String
    + adopt(pet: Animal): void
}

Owner "1" o-- "*" Animal : owns

@enduml`
    },
    {
        id: 'puml-component',
        name: 'Component Diagram',
        mode: 'plantuml',
        category: 'UML: Structure',
        code: `@startuml
skinparam componentStyle uml2

package "Frontend" {
    [Web App] as WebApp
    [Mobile App] as MobileApp
}

package "API Layer" {
    [API Gateway] as Gateway
}

cloud "Microservices" {
    [User Service] as UserService
    [Order Service] as OrderService
}

database "Data Store" {
    [MySQL] as MySQL
    [Redis] as Redis
}

WebApp --> Gateway
MobileApp --> Gateway
Gateway --> UserService
Gateway --> OrderService
UserService --> MySQL
UserService --> Redis
OrderService --> MySQL

@enduml`
    },
    {
        id: 'puml-er',
        name: 'ER Diagram (Data)',
        mode: 'plantuml',
        category: 'System: Data',
        code: `@startuml
' ER Diagram
skinparam linetype ortho

entity "User" as user {
    * user_id : INT <<PK>>
    --
    * username : VARCHAR(50)
    * email : VARCHAR(100)
    created_at : DATETIME
}

entity "Order" as order {
    * order_id : INT <<PK>>
    --
    * user_id : INT <<FK>>
    * total_amount : DECIMAL
    * status : ENUM
}

entity "OrderItem" as order_item {
    * item_id : INT <<PK>>
    --
    * order_id : INT <<FK>>
    * product_id : INT <<FK>>
    * quantity : INT
}

entity "Product" as product {
    * product_id : INT <<PK>>
    --
    * name : VARCHAR(200)
    * price : DECIMAL
    * stock : INT
}

user ||--o{ order : "places"
order ||--|{ order_item : "contains"
order_item }|--|| product : "refers"

@enduml`
    },
    {
        id: 'puml-object',
        name: 'Object Diagram',
        mode: 'plantuml',
        category: 'UML: Structure',
        code: `@startuml
object "user1: User" as u1 {
    name = "Alice"
    email = "alice@example.com"
}

object "order123: Order" as o1 {
    id = 123
    amount = 99.99
    status = "PAID"
}

object "item1: Product" as p1 {
    name = "Headphones"
    price = 99.99
}

u1 -- o1 : places >
o1 -- p1 : contains >
@enduml`
    },

    // --- BEHAVIOR (Dynamic) ---
    {
        id: 'puml-sequence',
        name: 'Sequence Diagram',
        mode: 'plantuml',
        category: 'UML: Behavior',
        code: `@startuml
title User Authentication Flow
autonumber

actor User
participant "Frontend" as Frontend
participant "API Gateway" as Gateway
participant "Auth Service" as Auth
database "User DB" as DB

User -> Frontend: Enter Credentials
Frontend -> Gateway: POST /login
Gateway -> Auth: Validate Request
Auth -> DB: Query User
DB --> Auth: Return User Data
Auth -> Auth: Verify Password
Auth --> Gateway: Generate JWT
Gateway --> Frontend: Return Token
Frontend --> User: Login Success

@enduml`
    },
    {
        id: 'puml-activity',
        name: 'Activity Diagram',
        mode: 'plantuml',
        category: 'UML: Behavior',
        code: `@startuml
start
:Receive Order Request;

if (User Logged In?) then (Yes)
    :Fetch User Details;
else (No)
    :Redirect to Login;
    stop
endif

:Check Inventory;

if (Inventory Available?) then (Yes)
    fork
        :Lock Inventory;
    fork again
        :Calculate Price;
    end fork

    :Create Order;
    :Send Confirmation Email;
else (No)
    :Show Out of Stock Error;
endif

stop
@enduml`
    },
    {
        id: 'puml-state',
        name: 'State Diagram',
        mode: 'plantuml',
        category: 'UML: Behavior',
        code: `@startuml
[*] --> Pending

state "Pending" as Pending {
    [*] --> WaitingForPayment
    WaitingForPayment --> Processing : Payment Started
    Processing --> WaitingForPayment : Payment Failed
}

Pending --> Paid : Payment Success
Pending --> Cancelled : Timeout/Cancel

state "Paid" as Paid {
    [*] --> ReadyToShip
    ReadyToShip --> Shipped : Ship Item
}

Paid --> Completed : Confirm Receipt
Completed --> [*]
Cancelled --> [*]

@enduml`
    },
    {
        id: 'puml-usecase',
        name: 'Use Case Diagram',
        mode: 'plantuml',
        category: 'UML: Behavior',
        code: `@startuml
left to right direction
actor Customer
actor Admin

rectangle "E-commerce System" {
    usecase "Browse Products" as UC1
    usecase "Add to Cart" as UC2
    usecase "Checkout" as UC3
    usecase "Manage Inventory" as UC4
}

Customer --> UC1
Customer --> UC2
Customer --> UC3
Admin --> UC4
UC3 ..> UC2 : <<include>>
@enduml`
    },
    {
        id: 'puml-timing',
        name: 'Timing Diagram',
        mode: 'plantuml',
        category: 'UML: Behavior',
        code: `@startuml
robust "DNS Resolver" as DNS
robust "Web Server" as Web
concise "Client" as Client

@0
DNS is Idle
Web is Idle
Client is Idle

@+100
Client -> DNS : Resolve URL
DNS is Processing

@+200
DNS is Idle
Client -> Web : HTTP Request
Web is Processing

@+500
Web is Idle
Client is Processing
@enduml`
    },

    // --- STRATEGY & PROCESS ---
    {
        id: 'puml-mindmap',
        name: 'Project Mindmap',
        mode: 'plantuml',
        category: 'Business: Strategy',
        code: `@startmindmap
* Launch Product
** Planning
*** Market Research
*** Competitor Analysis
** Development
*** MVP Features
*** Testing
** Marketing
*** Social Media
*** Email Campaign
@endmindmap`
    },
    {
        id: 'puml-wbs',
        name: 'Work Breakdown (WBS)',
        mode: 'plantuml',
        category: 'Business: Strategy',
        code: `@startwbs
* Website Project
** Design
*** Layout
*** Assets
*** Color Palette
** Backend
*** API Design
*** Database Setup
** Frontend
*** Home Page
*** Login Page
*** Dashboard
** Deploy
*** CI/CD Pipeline
*** Domain Setup
@endwbs`
    },
    {
        id: 'puml-gantt',
        name: 'Gantt Chart',
        mode: 'plantuml',
        category: 'Business: Strategy',
        code: `@startgantt
[Project Planning] lasts 5 days
[Prototype Design] lasts 10 days
[Prototype Design] starts at [Project Planning]'s end
[Implementation] lasts 20 days
[Implementation] starts at [Prototype Design]'s end
[Testing] lasts 10 days
[Testing] starts at [Implementation]'s end
@endgantt`
    },
    {
        id: 'puml-swimlane',
        name: 'Swimlane Activity',
        mode: 'plantuml',
        category: 'Business: Strategy',
        code: `@startuml
|Customer|
start
:Place Order;
|#AntiqueWhite|Sales|
if (Order Accepted?) then (Yes)
  :Process Order;
  |Warehouse|
  :Pick Items;
  :Pack Items;
  |Logistics|
  :Ship Items;
else (No)
  |Sales|
  :Reject Order;
endif
|Customer|
:Receive Goods;
stop
@enduml`
    },
    {
        id: 'puml-value-stream',
        name: 'Value Stream Mapping',
        mode: 'plantuml',
        category: 'Business: Strategy',
        code: `@startuml
' Simple Value Stream using Process Shapes
:Raw Material;
-> Transport;
:Machining;
-> Inspect;
:Assembly;
-> Test;
:Finished Goods;
@enduml`
    },

    // --- INFRASTRUCTURE (Implementation) ---
    {
        id: 'puml-cloud',
        name: 'Cloud Architecture',
        mode: 'plantuml',
        category: 'System: Architecture',
        code: `@startuml
!define AWS https://raw.githubusercontent.com/awslabs/aws-icons-for-plantuml/v14.0/dist
!includeurl AWS/AWSCommon.puml
!includeurl AWS/Compute/EC2.puml
!includeurl AWS/Database/RDS.puml
!includeurl AWS/Networking/ElasticLoadBalancing.puml

ELB(lb, "Load Balancer", "web")
EC2(web1, "Web Server 1", "t3.micro")
EC2(web2, "Web Server 2", "t3.micro")
RDS(db, "Primary DB", "postgresql")

lb --> web1
lb --> web2
web1 --> db
web2 --> db
@enduml`
    },
    {
        id: 'puml-json',
        name: 'JSON Visualization',
        mode: 'plantuml',
        category: 'System: Architecture',
        code: `@startjson
{
  "project": "Aone Toolkit",
  "version": "1.0",
  "modules": [
    "Diagrams",
    "Tables",
    "JSON"
  ]
}
@endjson`
    },
    {
        id: 'puml-network',
        name: 'Network Diagram',
        mode: 'plantuml',
        category: 'System: Architecture',
        code: `@startuml
nwdiag {
  network dmz {
      address = "210.x.x.x/24"
      web01 [address = "210.x.x.1"];
      web02 [address = "210.x.x.2"];
  }
  network internal {
      address = "172.x.x.x/24";
      web01 [address = "172.x.x.1"];
      web02 [address = "172.x.x.2"];
      db01;
      db02;
  }
}
@enduml`
    },

    // --- SPECIALIZED (Advanced) ---
    {
        id: 'puml-salt',
        name: 'UI Wireframe (Salt)',
        mode: 'plantuml',
        category: 'System: Engineering',
        code: `@startsalt
{
  JustPlain Window
  [X] Checkbox 1
  [ ] Checkbox 2
  Radio buttons:
  ( ) Option 1
  (X) Option 2
  [ Cancle ] | [  OK   ]
}
@endsalt`
    },
    {
        id: 'puml-c4-context',
        name: 'C4 Context',
        mode: 'plantuml',
        category: 'System: Engineering',
        code: `@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml

Person(user, "User", "A user of our banking system.")
System(banking_system, "Internet Banking System", "Allows users to view information.")
System_Ext(mail_system, "E-mail System", "The internal Microsoft Exchange e-mail system.")
System_Ext(mainframe, "Mainframe Banking System", "Store all of the core banking information.")

Rel(user, banking_system, "Uses")
Rel(banking_system, mail_system, "Sends e-mails", "SMTP")
Rel(banking_system, mainframe, "Uses")
@enduml`
    },
    {
        id: 'puml-c4-container',
        name: 'C4 Container',
        mode: 'plantuml',
        category: 'System: Architecture',
        code: `@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

LAYOUT_TOP_DOWN()

Person(user, "User", "Uses the banking app")
System_Boundary(c1, "Banking System") {
    Container(web_app, "Web Application", "Java, Spring MVC", "Delivers the static content")
    Container(spa, "Single Page App", "JavaScript, Angular", "Provides functionality to user")
    Container(api, "API Application", "Java, Docker Container", "Provides Internet Banking functionality via API")
    ContainerDb(db, "Database", "Oracle 12c", "Stores user registration info")
}

System_Ext(email, "E-Mail System", "Internal Exchange system")

Rel(user, web_app, "Uses", "HTTPS")
Rel(user, spa, "Uses", "HTTPS")
Rel(web_app, spa, "Delivers")
Rel(spa, api, "Uses", "JSON/HTTPS")
Rel(api, db, "Reads/Writes", "JDBC")
Rel(api, email, "Sends e-mails", "SMTP")
@enduml`
    },
    {
        id: 'puml-c4-component',
        name: 'C4 Component',
        mode: 'plantuml',
        category: 'System: Architecture',
        code: `@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Component.puml

Container(spa, "Single Page App", "Angular")
ContainerDb(db, "Database", "Relational Database Schema")

Container_Boundary(api, "API Application") {
    Component(sign, "Sign In Controller", "MVC Rest Controler", "Allows users to sign in")
    Component(security, "Security Component", "Spring Bean", "Provides functionality related to sign in")
    Component(mbs, "Mainframe Banking Facade", "Spring Bean", "Facade")
    
    Rel(sign, security, "Uses")
    Rel(security, db, "Read & write to", "JDBC")
    Rel(sign, mbs, "Uses")
}

Rel(spa, sign, "Uses", "JSON/HTTPS")
@enduml`
    },
    {
        id: 'puml-archimate',
        name: 'Archimate Enterprise',
        mode: 'plantuml',
        category: 'System: Engineering',
        code: `@startuml
!include <archimate/Archimate>

archimate #Technology "VPN Server" as vpnServer <<technology-device>>
archimate #Technology "Firewall" as firewall <<technology-device>>
archimate #Technology "Local Network" as localNetwork <<technology-network>>

vpnServer -down- localNetwork
firewall -down- vpnServer
@enduml`
    },
    {
        id: 'puml-ditaa',
        name: 'ASCII Art (Ditaa)',
        mode: 'plantuml',
        category: 'System: Engineering',
        code: `@startditaa
+---------+   +-----+
|    cBLU |   |     |
|  Server |-->|  DB |
|    {s}  |   | cGRE|
+---------+   +-----+
@endditaa`
    },
    {
        id: 'puml-math',
        name: 'Math Formula',
        mode: 'plantuml',
        category: 'System: Engineering',
        code: `@startmath
f(t)=(a_0)/2 + sum_(n=1)^ooa_ncos((npi t)/L)+sum_(n=1)^oo b_nsin((npi t)/L)
@endmath`
    },

    // --- GRAPHVIZ ALGORITHMS ---
    {
        id: 'dot-struct',
        name: 'Data Structures',
        mode: 'graphviz',
        category: 'System: Data',
        code: `digraph structs {
    rankdir=LR;
    node [shape=record];
    struct1 [label="<f0> left|<f1> mid\\ dle|<f2> right"];
    struct2 [label="<f0> one|<f1> two"];
    struct3 [label="hello\\nworld |{ b |{c|<here> d|e}| f}| g | h"];
    struct1:f1 -> struct2:f0;
    struct1:f2 -> struct3:here;
}`
    },
    {
        id: 'dot-tree',
        name: 'Binary Tree',
        mode: 'graphviz',
        category: 'System: Data',
        code: `digraph Tree {
    node [shape=circle, style=filled, fillcolor="#e1f5fe"];
    10 -> 6;
    10 -> 14;
    6 -> 4;
    6 -> 8;
    14 -> 12;
    14 -> 16;
    
    null4 [shape=point]; 4 -> null4;
    null8 [shape=point]; 8 -> null8;
    null12 [shape=point]; 12 -> null12;
}`
    },
    {
        id: 'dot-fsm',
        name: 'Finite State Machine',
        mode: 'graphviz',
        category: 'System: Engineering',
        code: `digraph finite_state_machine {
	rankdir=LR;
	size="8,5"
	node [shape = doublecircle]; LR_0 LR_3 LR_4 LR_8;
	node [shape = circle];
	LR_0 -> LR_2 [ label = "SS(B)" ];
	LR_0 -> LR_1 [ label = "SS(S)" ];
	LR_1 -> LR_3 [ label = "S($end)" ];
	LR_2 -> LR_6 [ label = "SS(b)" ];
	LR_2 -> LR_5 [ label = "SS(a)" ];
	LR_2 -> LR_4 [ label = "S(A)" ];
    LR_5 -> LR_7 [ label = "S(b)" ];
    LR_5 -> LR_5 [ label = "S(a)" ];
}`
    },
    {
        id: 'dot-cluster',
        name: 'Complex Clusters',
        mode: 'graphviz',
        category: 'Graphviz: Features',
        code: `digraph G {
	fontname="Helvetica,Arial,sans-serif"
	node [fontname="Helvetica,Arial,sans-serif"]
	edge [fontname="Helvetica,Arial,sans-serif"]

	subgraph cluster_0 {
		style=filled;
		color=lightgrey;
		node [style=filled,color=white];
		a0 -> a1 -> a2 -> a3;
		label = "process #1";
	}

	subgraph cluster_1 {
		node [style=filled];
		b0 -> b1 -> b2 -> b3;
		label = "process #2";
		color=blue
	}
	start -> a0;
	start -> b0;
	a1 -> b3;
	b2 -> a3;
	a3 -> a0;
	a3 -> end;
	b3 -> end;

	start [shape=Mdiamond];
	end [shape=Msquare];
}`
    },
    {
        id: 'eng-twopi',
        name: 'Radial Layout (Twopi)',
        mode: 'graphviz',
        category: 'Graphviz: Layouts',
        code: `digraph G {
    layout=twopi;
    ranksep=3;
    ratio=auto;
    node [shape=circle];
    
    root -> a;
    root -> b;
    root -> c;
    
    a -> a1;
    a -> a2;
    b -> b1;
    b -> b2;
    c -> c1;
}`
    },

    // --- PATTERN: DESIGN (GoF) ---
    {
        id: 'pat-singleton',
        name: 'Singleton Pattern',
        mode: 'plantuml',
        category: 'Design: Patterns',
        code: `@startuml
title Singleton Pattern
class Singleton {
  - static instance: Singleton
  - constructor()
  + static getInstance(): Singleton
}
Singleton --> Singleton : instance
note right of Singleton::getInstance
  if (instance == null)
    instance = new Singleton()
  return instance
end note
@enduml`
    },
    {
        id: 'pat-observer',
        name: 'Observer Pattern',
        mode: 'plantuml',
        category: 'Design: Patterns',
        code: `@startuml
title Observer Pattern
interface Subject {
  + attach(observer: Observer)
  + detach(observer: Observer)
  + notify()
}

interface Observer {
  + update()
}

class ConcreteSubject {
  - state
  + getState()
  + setState()
}

class ConcreteObserver {
  - observerState
  + update()
}

Subject -> Observer : notifies >
ConcreteSubject --|> Subject
ConcreteObserver --|> Observer
ConcreteObserver --> ConcreteSubject : observes >
@enduml`
    },
    {
        id: 'pat-factory',
        name: 'Factory Method',
        mode: 'plantuml',
        category: 'Design: Patterns',
        code: `@startuml
title Factory Method Pattern
interface Product
class ConcreteProductA
class ConcreteProductB

interface Creator {
  + factoryMethod(): Product
}

class ConcreteCreatorA {
  + factoryMethod(): Product
}

class ConcreteCreatorB {
  + factoryMethod(): Product
}

ConcreteProductA ..|> Product
ConcreteProductB ..|> Product
ConcreteCreatorA ..|> Creator
ConcreteCreatorB ..|> Creator

ConcreteCreatorA ..> ConcreteProductA : creates >
ConcreteCreatorB ..> ConcreteProductB : creates >
@enduml`
    },
    {
        id: 'pat-strategy',
        name: 'Strategy Pattern',
        mode: 'plantuml',
        category: 'Design: Patterns',
        code: `@startuml
title Strategy Pattern

class Context {
  - strategy: Strategy
  + setStrategy(Strategy)
  + execute()
}

interface Strategy {
  + algorithm()
}

class ConcreteStrategyA {
  + algorithm()
}

class ConcreteStrategyB {
  + algorithm()
}

Context o-> Strategy
ConcreteStrategyA ..|> Strategy
ConcreteStrategyB ..|> Strategy
@enduml`
    },

    // --- PATTERN: SYSTEM (Microservices) ---
    {
        id: 'pat-saga',
        name: 'Saga Pattern (Orchestration)',
        mode: 'plantuml',
        category: 'System: Patterns',
        code: `@startuml
title Saga Pattern: Order Processing
autonumber

participant "Order Saga" as Saga
participant "Order Service" as Order
participant "Inventory Service" as Inv
participant "Payment Service" as Pay

Saga -> Order: Create Order (PENDING)
activate Order
Order --> Saga: Order Created
deactivate Order

Saga -> Inv: Reserve Stock
activate Inv
alt Stock Available
    Inv --> Saga: Reserved
else Stock Empty
    Inv --> Saga: Out of Stock
    Saga -> Order: Reject Order
end
deactivate Inv

Saga -> Pay: Process Payment
activate Pay
alt Payment Success
    Pay --> Saga: Success
    Saga -> Order: Approve Order
else Insufficient Funds
    Pay --> Saga: Failed
    Saga -> Inv: Release Stock
    Saga -> Order: Reject Order
end
deactivate Pay
@enduml`
    },
    {
        id: 'pat-saga-chor',
        name: 'Saga Pattern (Choreography)',
        mode: 'plantuml',
        category: 'System: Patterns',
        code: `@startuml
title Saga Pattern (Choreography - Event Driven)
autonumber

participant "Order Service" as Order
participant "Inventory Service" as Inv
participant "Payment Service" as Pay
queue "Message Broker" as Bus

Order -> Bus: Publish(OrderCreated)
activate Order
Bus -> Inv: Consume(OrderCreated)
deactivate Order

activate Inv
Inv -> Inv: Reserve Stock
alt Success
    Inv -> Bus: Publish(StockReserved)
else OutOfStock
    Inv -> Bus: Publish(StockFailed)
end
deactivate Inv

Bus -> Pay: Consume(StockReserved)
activate Pay
Pay -> Pay: Process Payment
alt Success
    Pay -> Bus: Publish(PaymentSuccess)
else Failed
    Pay -> Bus: Publish(PaymentFailed)
end
deactivate Pay

Bus -> Order: Consume(PaymentSuccess)
activate Order
Order -> Order: Approve Order
deactivate Order
@enduml`
    },
    {
        id: 'pat-sidecar',
        name: 'Pattern: Sidecar (K8s)',
        mode: 'plantuml',
        category: 'System: Patterns',
        code: `@startuml
title Sidecar Pattern (Kubernetes Pod)

node "Kubernetes Pod" {
    component "Main Container\n(Application)" as app
    component "Sidecar Container\n(Proxy / Log Agent)" as sidecar
    
    interface "Localhost" as local
    
    app -d-> local : HTTP/Logs
    local -u-> sidecar : Intercept
}

cloud "External Service" as ext
database "Log Aggregator" as logs

sidecar -> ext : Proxy Req
sidecar -> logs : Ship Logs
@enduml`
    },
    {
        id: 'pat-gateway',
        name: 'Pattern: API Gateway',
        mode: 'plantuml',
        category: 'System: Patterns',
        code: `@startuml
title API Gateway Pattern

actor Client
node "API Gateway" {
    component "Rate Limiter"
    component "Auth Filter"
    component "Router"
}

node "Services" {
    component "Product Service" as prod
    component "Order Service" as order
    component "User Service" as user
}

Client -> "API Gateway" : /api/v1/orders
"API Gateway" -> user : 1. Validate Token
"API Gateway" -> prod : 2. Get Product Info
"API Gateway" -> order : 3. Create Order
@enduml`
    },
    {
        id: 'pat-es',
        name: 'Pattern: Event Sourcing',
        mode: 'plantuml',
        category: 'System: Patterns',
        code: `@startuml
title Event Sourcing (Replay State)

database "Event Store" as Store
collections "Events" as Events
control "Projection" as Proj
database "Read Model" as Read
actor User

User -> Store: 1. Command(AddItem)
Store -> Events: 2. Append(ItemAdded)
Events -> Proj: 3. Subscribe
Proj -> Read: 4. Update View
User -> Read: 5. Query(Cart)

note right of Events
  Stream: Cart-123
  1. Created
  2. ItemAdded(A)
  3. ItemRemoved(A)
  4. ItemAdded(B)
end note
@enduml`
    },
    {
        id: 'pat-circuit',
        name: 'Circuit Breaker',
        mode: 'plantuml',
        category: 'System: Patterns',
        code: `@startuml
title Circuit Breaker State
state Closed {
    [*] --> Healthy
    Healthy --> FailureCount : Error
    FailureCount --> Healthy : Success
}

state Open {
    [*] --> TimerRunning
    TimerRunning --> HalfOpen : Timeout
}

state HalfOpen {
    [*] --> Probe
    Probe --> Closed : Success
    Probe --> Open : Error
}

Closed --> Open : Threshold Exceeded
@enduml`
    },
    {
        id: 'pat-cqrs',
        name: 'CQRS Pattern',
        mode: 'plantuml',
        category: 'System: Patterns',
        code: `@startuml
title CQRS Architecture

package "Command Side" {
    [Command API] as C_API
    [Command Handler] as Handler
    database "Write DB" as WriteDB
}

package "Query Side" {
    [Query API] as Q_API
    database "Read DB" as ReadDB
}

[Event Bus] as Bus

C_API -> Handler : Send Command
Handler -> WriteDB : Update State
Handler -> Bus : Publish Event
Bus -> ReadDB : Sync Data
Q_API -> ReadDB : Read Data
@enduml`
    },

    // --- PATTERN: PROCESS ---
    {
        id: 'pat-gitflow',
        name: 'Git Flow',
        mode: 'plantuml',
        category: 'Business: Process',
        code: `@startuml
title Git Flow
group Master
    start
    :v1.0 Tag;
end group

group Develop
    :Init Develop;
    split
        :Feature A;
    split again
        :Feature B;
    end split
    :Merge Features;
end group

group Release
    :Create Release 1.1;
    :Test & Fix;
end group

split
    :Merge to Master (v1.1);
split again
    :Merge to Develop;
end split

stop
@enduml`
    },
    {
        id: 'pat-kanban',
        name: 'Kanban Board',
        mode: 'plantuml',
        category: 'Business: Process',
        code: `@startsalt
{
  {+
    <b>To Do</b> | <b>In Progress</b> | <b>Done</b>
    {.
      [New Feature X]
      [Bug Fix Y]
    } | {
      [Refactor Z]
    } | {
      [Deploy v1.0]
      [Update Docs]
    }
  }
}
@endsalt`
    },
    {
        id: 'puml-event-storming',
        name: 'Event Storming',
        mode: 'plantuml',
        category: 'Business: Process',
        code: `@startuml
title Event Storming (Domain Model)

skinparam component {
  BackgroundColor<<Event>> Orange
  BackgroundColor<<Command>> LightBlue
  BackgroundColor<<Aggregate>> Yellow
}

package "Order Context" {
  [Create Order] <<Command>> as c1
  [Order Created] <<Event>> as e1
  [Check Credit] <<Command>> as c2
  [Credit Approved] <<Event>> as e2
  [Inventory Reserved] <<Event>> as e3
  
  note top of e1 : Sticky note style
}

c1 -> e1
e1 -> c2
c2 -> e2
e2 -> e3

legend right
  |<back:Orange>Event</back>| Domain Change |
  |<back:LightBlue>Command</back>| User Intent |
  |<back:Yellow>Aggregate</back>| Entity Boundary |
end legend
@enduml`
    },
    {
        id: 'puml-user-story-map',
        name: 'User Story Map',
        mode: 'plantuml',
        category: 'Business: Process',
        code: `@startuml
title User Story Map: E-commerce

skinparam rectangle {
    BackgroundColor White
    BorderColor Black
}

rectangle "Activity: Browse Product" as a1 {
    rectangle "Search" as search
    rectangle "Filter" as filter
}

rectangle "Activity: Purchase" as a2 {
    rectangle "Checkout" as checkout
    rectangle "Payment" as pay
}

rectangle "Release 1 (MVP)" as r1 #LightGreen {
    rectangle "Basic Search" as s1
    rectangle "Guest Checkout" as c1
}

rectangle "Release 2" as r2 #LightBlue {
    rectangle "Advanced Filter" as s2
    rectangle "Registered User" as c2
}

search -d-> s1
search -d-> s2
checkout -d-> c1
checkout -d-> c2
@enduml`
    },

    // --- PLANTUML: FEATURES (Power User) ---
    {
        id: 'feat-preproc',
        name: 'Preprocessor (Macros/Logic)',
        mode: 'plantuml',
        category: 'PlantUML: Features',
        code: `@startuml
!define DARK_MODE
!include <tupadr3/common>
!include <tupadr3/font-awesome-5/server>
!include <tupadr3/font-awesome-5/database>

!ifdef DARK_MODE
    skinparam backgroundColor #333
    skinparam arrowColor White
    skinparam nodeFontColor White
    skinparam nodeBorderColor White
!endif

!function $double($a)
!return $a + $a
!endfunction

title Preprocessor Logic ($double("Test"))

FA5_SERVER(web, "Web Server")
FA5_DATABASE(db, "Database")

web --> db
@enduml`
    },
    {
        id: 'feat-theme',
        name: 'Theming & Styling',
        mode: 'plantuml',
        category: 'PlantUML: Features',
        code: `@startuml
!theme spacelab
skinparam node {
    BackgroundColor<<highlight>> yellow
    BorderColor<<highlight>> red
}

node "Normal Node"
node "Important Node" <<highlight>>

cloud "Cloud" {
  [App]
}
@enduml`
    },
    {
        id: 'feat-yaml',
        name: 'YAML Visualization',
        mode: 'plantuml',
        category: 'PlantUML: DSLs',
        code: `@startyaml
# Highlight specific keys
#highlight "production"
environment:
  development:
    db: sqlite
    server: local
  production:
    db: postgres
    server: aws
    replicas: 5
@endyaml`
    },
    {
        id: 'feat-deploy',
        name: 'Deployment Diagram',
        mode: 'plantuml',
        category: 'PlantUML: DSLs',
        code: `@startuml
artifact "Web App" as app
node "App Server" {
    component "Tomcat"
    app ..> Tomcat : deploy
}

node "DB Server" {
    database "PostgreSQL"
}

Tomcat --> PostgreSQL
@enduml`
    },

    // --- GRAPHVIZ: ENGINES & ADVANCED ---
    {
        id: 'eng-neato',
        name: 'Engine: Neato (Physics)',
        mode: 'graphviz',
        engine: 'neato',
        category: 'Graphviz: Layouts',
        code: `graph G {
    layout=neato;
    overlap=false;
    splines=true;
    node [shape=circle, style=filled, fillcolor="#b3e5fc"];
    
    // Fully connected mesh
    a -- b; a -- c; a -- d; a -- e;
    b -- c; b -- d; b -- e;
    c -- d; c -- e;
    d -- e;
}`
    },
    {
        id: 'eng-patchwork',
        name: 'Engine: Patchwork (TreeMap)',
        mode: 'graphviz',
        engine: 'patchwork',
        category: 'Graphviz: Layouts',
        code: `digraph G {
    layout=patchwork;
    node [style=filled];
    
    subgraph cluster_regions {
        label="Sales by Region";
        
        node [fillcolor="#ffcdd2"] "North America" [area=50];
        node [fillcolor="#c8e6c9"] "Europe" [area=30];
        node [fillcolor="#bbdefb"] "Asia" [area=80];
    }
}`
    },
    {
        id: 'eng-fdp',
        name: 'Engine: FDP (Force-Directed)',
        mode: 'graphviz',
        engine: 'fdp',
        category: 'Graphviz: Layouts',
        code: `graph G {
    layout=fdp;
    node [shape=box, style=filled, fillcolor="#C5CAE9"];
    
    // Spring model with groups
    subgraph cluster_A {
        label="Group A";
        a1 -- a2 -- a3 -- a1;
    }
    
    subgraph cluster_B {
        label="Group B";
        b1 -- b2 -- b3 -- b4 -- b1;
    }
    
    a1 -- b1;
    a2 -- b2;
}`
    },
    {
        id: 'eng-sfdp',
        name: 'Engine: SFDP (Large Graphs)',
        mode: 'graphviz',
        engine: 'sfdp',
        category: 'Graphviz: Layouts',
        code: `graph G {
    layout=sfdp;
    overlap=false;
    node [shape=point, width=0.1];
    
    hub -- {n1 n2 n3 n4 n5 n6 n7 n8 n9 n10};
    n1 -- {n11 n12 n13};
    n2 -- {n21 n22 n23};
}`
    },
    {
        id: 'eng-sfdp-stress',
        name: 'Stress Test: SFDP (Large)',
        mode: 'graphviz',
        engine: 'sfdp',
        category: 'Graphviz: Layouts',
        code: `graph SFDP_Stress {
    layout=sfdp;
    // Optimize for speed
    overlap=prism;
    outputorder=edgesfirst;
    node [shape=point, width=0.1, color="#444444"];
    edge [color="#AAAAAA50", penwidth=0.5];

    // Hub 1
    root1 -- {a1 a2 a3 a4 a5 a6 a7 a8 a9 a10};
    a1 -- {b1 b2 b3 b4 b5};
    a2 -- {c1 c2 c3 c4 c5};
    
    // Hub 2
    root2 -- {x1 x2 x3 x4 x5 x6 x7 x8 x9 x10};
    x1 -- {y1 y2 y3};
    x2 -- {z1 z2 z3};
    
    // Bridge
    root1 -- root2 [penwidth=2, color=red];
    b3 -- y2;
    c5 -- z1;
}`
    },
    {
        id: 'eng-cheatsheet',
        name: 'Guide: Which Engine?',
        mode: 'graphviz',
        category: 'Graphviz: Layouts',
        code: `digraph EngineGuide {
    rankdir=LR;
    node [shape=note, style=filled, fillcolor="#FFF3E0", fontname="Arial"];
    edge [color="#555555"];
    
    Question [label="What is your\\nTopology?", shape=diamond, fillcolor="#B2EBF2", style=filled];
    
    Hierarchical [shape=box, label="Hierarchical\\n(Tree/Flow)"];
    Network [shape=box, label="Network\\n(Mesh/Connections)"];
    Ring [shape=box, label="Ring / Cycle"];
    Cluster [shape=box, label="Clusters / Groups"];
    
    Dot [label="DOT\\n(Standard)", fillcolor="#C8E6C9"];
    Neato [label="NEATO\\n(Small < 100)", fillcolor="#FFCCBC"];
    SFDP [label="SFDP\\n(Large > 100)", fillcolor="#FFCCBC"];
    Circo [label="CIRCO\\n(Circular)", fillcolor="#E1BEE7"];
    Osage [label="OSAGE\\n(Array/Box)", fillcolor="#BBDEFB"];
    FDP [label="FDP\\n(Force Cluster)", fillcolor="#BBDEFB"];

    Question -> Hierarchical;
    Question -> Network;
    Question -> Ring;
    Question -> Cluster;

    Hierarchical -> Dot [label="Use"];
    Network -> Neato [label="Small"];
    Network -> SFDP [label="Large"];
    Ring -> Circo [label="Use"];
    Cluster -> Osage [label="Packed"];
    Cluster -> FDP [label="Loose"];
    Cluster -> Dot [label="Structured"];
}`
    },
    {
        id: 'eng-cluster-comp',
        name: 'Comparison: Clusters',
        mode: 'graphviz',
        category: 'Graphviz: Layouts',
        code: `graph ClusterComp {
    // Try changing layout directly here to see differences:
    // layout=fdp   -> Clusters float like bubbles (Springs)
    // layout=osage -> Clusters packed like boxes (Arrays)
    // layout=dot   -> Clusters are regions (Hierarchy)
    layout=fdp; 
    
    node [shape=circle, style=filled, color=white];
    
    subgraph cluster_A {
        label="Cluster A";
        bgcolor="#E3F2FD";
        a1 -- a2 -- a3 -- a1;
    }
    
    subgraph cluster_B {
        label="Cluster B";
        bgcolor="#FCE4EC";
        b1 -- b2 -- b3;
    }
    
    // Cross-cluster link
    a2 -- b2 [penwidth=2];
}`
    },
    {
        id: 'eng-circo',
        name: 'Engine: Circo (Circular)',
        mode: 'graphviz',
        engine: 'circo',
        category: 'Graphviz: Layouts',
        code: `graph G {
    layout=circo;
    node [shape=doublecircle, color=orange];
    
    1 -- 2 -- 3 -- 4 -- 5 -- 6 -- 7 -- 1;
    
    1 -- 4;
    2 -- 5;
    3 -- 6;
}`
    },
    {
        id: 'eng-osage',
        name: 'Engine: Osage (Clustered)',
        mode: 'graphviz',
        engine: 'osage',
        category: 'Graphviz: Layouts',
        code: `graph G {
    layout=osage;
    node [shape=box, style=filled];
    
    subgraph cluster_0 {
        label="Section 1";
        node [fillcolor=lightblue];
        a b c d;
    }
    
    subgraph cluster_1 {
        label="Section 2";
        node [fillcolor=lightgreen];
        e f g h;
    }
}`
    },
    {
        id: 'eng-nop',
        name: 'Engine: Nop (Fixed Positions)',
        mode: 'graphviz',
        category: 'Graphviz: Layouts',
        code: `digraph G {
    layout=nop2;
    node [shape=circle];
    
    n1 [pos="0,0!"];
    n2 [pos="100,100!"];
    n3 [pos="200,0!"];
    
    n1 -> n2 -> n3 -> n1;
}`
    },
    {
        id: 'eng-html',
        name: 'HTML Labels',
        mode: 'graphviz',
        category: 'Graphviz: Features',
        code: `digraph structs {
    rankdir=LR;
    node [shape=plaintext];
    
    struct1 [label=<
<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0">
  <TR>
    <TD>left</TD>
    <TD PORT="f1">mid dle</TD>
    <TD PORT="f2">right</TD>
  </TR>
</TABLE>>];
    
    struct2 [label=<
<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0">
  <TR><TD PORT="f0">one</TD><TD>two</TD></TR>
</TABLE>>];
    
    struct1:f1 -> struct2:f0;
}`
    },
    {
        id: 'eng-gradient',
        name: 'Gradients & Colors',
        mode: 'graphviz',
        category: 'Graphviz: Features',
        code: `digraph G {
    bgcolor="transparent";
    node [style=filled, shape=circle];
    
    // Linear Gradient
    a [fillcolor="yellow:blue", label="Linear"];
    
    // Radial Gradient
    b [style="filled,radial", fillcolor="white:red", label="Radial"];
    
    a -> b;
}`
    },

    // --- ADDITIONAL: CLOUD & DATA ---
    {
        id: 'cloud-azure',
        name: 'Cloud: Azure',
        mode: 'plantuml',
        category: 'System: Architecture',
        code: `@startuml
!define AzurePuml https://raw.githubusercontent.com/plantuml-stdlib/Azure-PlantUML/master/dist
!includeurl AzurePuml/AzureCommon.puml
!includeurl AzurePuml/Databases/AzureSqlDatabase.puml
!includeurl AzurePuml/Compute/AzureFunction.puml

AzureFunction(f, "Process Data", "java")
AzureSqlDatabase(db, "Storage", "SQL")

f --> db
@enduml`
    },
    {
        id: 'cloud-k8s',
        name: 'Orchestration: Kubernetes',
        mode: 'plantuml',
        category: 'System: Architecture',
        code: `@startuml
!include <kubernetes/k8s-sprites-unlabeled-25pct>
package "Cluster" {
    component "<$node>\nNode" as node {
        component "<$pod>\nPod" as pod
    }
    component "<$service>\nService" as svc
}
pod --> svc
@enduml`
    },
    {
        id: 'data-chen',
        name: 'ER Diagram (Chen)',
        mode: 'graphviz',
        category: 'System: Data',
        code: `graph ER {
    layout=neato;
    node [shape=box]; Entity;
    node [shape=ellipse]; Attribute;
    node [shape=diamond,style=filled,color=lightgrey]; Relationship;
    
    Entity -- Relationship -- Attribute;
}`
    },
    {
        id: 'data-dfd',
        name: 'Data Flow Diagram',
        mode: 'graphviz',
        category: 'System: Data',
        code: `digraph DFD {
    rankdir=LR;
    node [shape=box, style=rounded]; Process;
    node [shape=parallelogram, style=filled, fillcolor=lightblue]; Input;
    node [shape=cylinder]; Store;
    
    Input -> Process;
    Process -> Store;
}`
    },
    {
        id: 'puml-board',
        name: 'Board (Dashboard)',
        mode: 'plantuml',
        category: 'Business: Strategy',
        code: `@startboard
C: Use Case
B: In Progress
D: Done

C -> B
B -> D
@endboard`
    },
    {
        id: 'puml-chron',
        name: 'Chronology (Timeline)',
        mode: 'plantuml',
        category: 'UML: Behavior',
        code: `@startchronology
print "Event 1"
-> "Event 2"
@endchronology`
    },

    // --- SPECIALIZED: SYNTAX & LOGIC ---
    {
        id: 'spec-ebnf',
        name: 'EBNF (Railroad Diagram)',
        mode: 'plantuml',
        category: 'System: Engineering',
        code: `}
@enduml`
    },
    {
        id: 'spec-regex',
        name: 'Regex / EBNF (Standard)',
        mode: 'plantuml',
        category: 'System: Engineering',
        code: `@startuml
ebnf
  digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
  variable = letter , { letter | digit | "_" } ;
  assignment = variable , "=" , ( number | variable ) , ";" ;
@enduml`
    },
    {
        id: 'spec-logic',
        name: 'Logic Gates (Hardware)',
        mode: 'graphviz',
        category: 'System: Engineering',
        code: `digraph logic {
    rankdir=LR;
    node [shape=record, height=1];
    
    // Inputs
    a [label="A", shape=none];
    b [label="B", shape=none];
    
    // Gates
    and [label="AND", shape=box, style=filled, fillcolor="#e0e0e0"];
    or [label="OR", shape=invtrapezium, style=filled, fillcolor="#e0e0e0"];
    
    // Connections
    a -> and;
    b -> and;
    and -> or;
}`
    },

    // --- VISUAL & LAYOUT ---
    {
        id: 'style-hand',
        name: 'Style: Handwritten (Sketch)',
        mode: 'plantuml',
        category: 'PlantUML: Features',
        code: `@startuml
skinparam handwritten true
skinparam backgroundColor #EEEBDC

actor User
participant "Sketchy App" as App
database "Rough DB" as DB

User -> App : Clicks button
App -> DB : Saves data
note right: This looks like\na napkin sketch
@enduml`
    },
    {
        id: 'layout-rank',
        name: 'Layout: Forced Ranking',
        mode: 'graphviz',
        category: 'Graphviz: Features',
        code: `digraph G {
    node [shape=box];
    
    // Define nodes
    Start;
    Process1; Process2;
    End;
    
    // Standard flow
    Start -> Process1 -> End;
    Start -> Process2 -> End;
    
    // FORCE Process1 and Process2 to be on same level
    { rank=same; Process1; Process2; }
}`
    },
    {
        id: 'eng-guide-dir',
        name: 'Guide: Connect & Layout (CN)',
        mode: 'graphviz',
        category: 'Graphviz: Features',
        code: `// ============================================================
// Graphviz Direction & Layout Guide (Cheat Sheet)
//
// 1. Global Direction: rankdir=TB, BT, LR, RL
// 2. Ports: node:n, node:se
// 3. Alignment: {rank=same; A; B}
// 4. Edge Direction: dir=both, back, none
// ============================================================

/*
// --- EXAMPLE 1: BASIC DIRECTION ---
digraph G {
    rankdir=TB;
    A -> B -> C;
}

// --- EXAMPLE 2: PORTS ---
digraph G {
    A:e -> B:w;
    A:s -> C:n;
}

// --- EXAMPLE 3: PORTS + RANK ---
digraph G {
    rankdir=LR;
    {rank=same; A; B}
    A:e -> B:w;
    C:s -> F:n;
}
*/

// ============================================================
// 8. COMBINED EXAMPLE: Z-Shape Layout
// ============================================================
digraph ZShape {
    rankdir=TB;
    node [shape=box, style="rounded,filled", fillcolor=white];
    
    // Row 1: Right
    {rank=same; A; B; C; D}
    A:e -> B:w;
    B:e -> C:w;
    C:e -> D:w;
    
    // Turn Down
    D:s -> H:n [color=red, label="Turn"];
    
    // Row 2: Left
    {rank=same; E; F; G; H}
    H:w -> G:e;
    G:w -> F:e;
    F:w -> E:e;
    
    // Turn Down
    E:s -> I:n [color=red, label="Turn"];
    
    // Row 3: Right
    {rank=same; I; J; K; L}
    I:e -> J:w;
    J:e -> K:w;
    K:e -> L:w;
}`
    },
    {
        id: 'data-crows',
        name: 'ERD: Crow\'s Foot',
        mode: 'graphviz',
        category: 'System: Data',
        code: `digraph ERD {
    graph [rankdir=LR, splines=ortho];
    node [shape=none, fontname="Arial"];
    
    User [label=<
    <table border="0" cellborder="1" cellspacing="0" cellpadding="4">
      <tr><td bgcolor="lightgrey"><b>User</b></td></tr>
      <tr><td align="left">PK: id</td></tr>
      <tr><td align="left">name</td></tr>
    </table>>];

    Order [label=<
    <table border="0" cellborder="1" cellspacing="0" cellpadding="4">
      <tr><td bgcolor="lightgrey"><b>Order</b></td></tr>
      <tr><td align="left">PK: id</td></tr>
      <tr><td align="left">FK: user_id</td></tr>
    </table>>];

    // Crow's foot notation
    User -> Order [dir=both, arrowtail=crow, arrowhead=none, label="places"];
}`
    },
    {
        id: 'beh-concurrent',
        name: 'State: Concurrent Regions',
        mode: 'plantuml',
        category: 'UML: Behavior',
        code: `@startuml
hide empty description
state "Car System" as Car {
    state "Engine" as Engine {
        [*] --> Idling
        Idling --> Running : Accelerate
        Running --> Idling : Brake
    }
    --
    state "Radio" as Radio {
        [*] --> Off
        Off --> FM : Power On
        FM --> AM : Switch Band
    }
}
@enduml`
    },

    // --- SPECIALIZED: SYSTEMS (SysML) ---
    {
        id: 'sysml-req',
        name: 'SysML Requirement',
        mode: 'plantuml',
        category: 'System: Engineering',
        code: `@startuml
sysml
package "Standard Requirements" {
    requirement "Performance" as R1 {
        id = "REQ-001"
        text = "The system shall respond in < 100ms."
    }
    
    requirement "Security" as R2 {
        id = "REQ-002"
        text = "All data must be encrypted."
        Risk = "High"
    }
}

element "Search Component" as C1

C1 -up-> R1 : satisfies
C1 -up-> R2 : satisfies
@enduml`
    },
    {
        id: 'sysml-block',
        name: 'SysML Block Definition',
        mode: 'plantuml',
        category: 'System: Engineering',
        code: `@startuml
sysml
block "Car" as car
block "Engine" as engine
block "Wheel" as wheel
block "Driver" as driver

car *-- "1" engine
car *-- "4" wheel
car o-- "1" driver : drives
@enduml`
    },

    // --- MANAGEMENT & ANALYSIS ---
    {
        id: 'mgmt-org',
        name: 'Organization Chart',
        mode: 'plantuml',
        category: 'Business: Strategy',
        code: `@startwbs
+ CEO
++ VP Engineering
+++ Architecture Team
+++ QA Team
++ VP Sales
+++ North America
+++ Europe
@endwbs`
    },
    {
        id: 'mgmt-pert',
        name: 'PERT Chart (Project)',
        mode: 'graphviz',
        category: 'Business: Strategy',
        code: `digraph PERT {
    rankdir=LR;
    node [shape=circle, style=filled, fillcolor=white, fixedsize=true, width=1];
    
    Start [label="Start", shape=Mdiamond];
    Finish [label="Finish", shape=Msquare];
    
    A [label="A\\n(3d)"];
    B [label="B\\n(4d)"];
    C [label="C\\n(2d)"];
    D [label="D\\n(5d)"];
    
    Start -> A;
    Start -> B;
    A -> C;
    B -> D;
    C -> Finish;
    D -> Finish;
    
    // Critical Path
    edge [color=red, penwidth=2];
    Start -> B -> D -> Finish;
}`
    },
    {
        id: 'mgmt-swot',
        name: 'SWOT Analysis',
        mode: 'plantuml',
        category: 'Business: Strategy',
        code: `@startsalt
{+
  <b>SWOT Analysis Matrix</b> | .
  . | .
  <b>Strengths</b> | <b>Weaknesses</b>
  * Innovative Tech | * Small Team
  * Agile Process | * Limited Budget
  . | .
  <b>Opportunities</b> | <b>Threats</b>
  * New Markets | * Competitors
  * AI Trends | * Regulation
}
@endsalt`
    },
    {
        id: 'anal-concept',
        name: 'Concept Map',
        mode: 'graphviz',
        category: 'Business: Strategy',
        code: `digraph ConceptMap {
    node [shape=oval, style=filled, fillcolor="#fff9c4"];
    edge [fontsize=10];
    
    "PlantUML" -> "Diagrams" [label="generates"];
    "Diagrams" -> "Visual Communication" [label="facilitates"];
    "Users" -> "PlantUML" [label="write code for"];
    "Users" -> "Visual Communication" [label="need"];
}`
    },
    {
        id: 'anal-tree',
        name: 'Directory / File Tree',
        mode: 'plantuml',
        category: 'System: Architecture',
        code: `@startsalt
{
{T
 + <&folder> src
 ++ <&folder> components
 +++ <&file> Button.svelte
 +++ <&file> Modal.svelte
 ++ <&folder> lib
 +++ <&file> utils.ts
 + <&file> package.json
 + <&file> README.md
}
}
@endsalt`
    },
    {
        id: 'beh-interact',
        name: 'Interaction Overview',
        mode: 'plantuml',
        category: 'UML: Behavior',
        code: `@startuml
title Interaction Overview

start
:Init Session;

if (Is Verified?) then (yes)
  :ref:
  <b>Sequence Diagram: </b>
  User -> API : Get Data
  API --> User : Data
  end ref;
else (no)
  :Show Error;
endif

stop
@enduml`
    },

    // --- ACTIVITY: MASTERY (MECE Control flow) ---
    {
        id: 'act-guide-arrows',
        name: 'Guide: Activity Arrows (CN)',
        mode: 'plantuml',
        category: 'UML: Behavior',
        code: `@startuml
title Activity Diagram Arrow Guide (活动图箭头指南)

' ============================================================
' 1. 基础箭头与标签 (Basic & Labels)
' ============================================================
:开始;
-> 默认向下;
:步骤 1;
-> 带有标签的箭头;
:步骤 2;

' ============================================================
' 2. 样式与颜色 (Styles & Colors)
' ============================================================
:步骤 3;
-[#blue]-> 蓝色箭头;
:步骤 4;
-[#red,dashed]-> 红色虚线;
:步骤 5;
-[#green,bold]-> 绿色加粗;
:步骤 6;

' ============================================================
' 3. 回退箭头 (Backward / Upward)
' ============================================================
' 在 repeat 循环中，可以使用 backward 关键字创建"向上"的箭头
repeat
  :主流程;
  backward :<color:red>修正/重试 (向上的逻辑)</color>;
  note right: backward 会自动反向绘制
repeat while (需重试?)

' ============================================================
' 4. 分支方向 (Branching / Sideways)
' ============================================================
' PlantUML 自动处理左右分支布局
if (检查?) then (通过)
  :向右/下流程;
else (拒绝)
  :向左/下流程;
  -[#gray,dotted]-> 终止;
  stop
endif

' ============================================================
' 5. 连接点 (Connectors / Jumps)
' ============================================================
' 当距离太远时，使用连接点代替长箭头
:生成长连接;
-> 跳转至 A;
(A)
detach

(A)
:从 A 处接续 (避免复杂连线交叉);

' ============================================================
' 6. 泳道 (Swimlanes / Grouping)
' ============================================================
' 泳道强制将节点按列排布
|#Pink|管理员|
:审批;
|#LightBlue|用户|
:查看结果;

stop
@enduml`
    },
    {
        id: 'act-loops',
        name: 'Activity: While/Repeat Loops',
        mode: 'plantuml',
        category: 'UML: Behavior',
        code: `@startuml
start
:Initialize System;

while (Data available?) is (yes)
  :Read Data Packet;
  :Process Packet;
endwhile (no)

repeat
  :Perform Health Check;
backward:Log minor error;
repeat while (System Stable?) is (no) not (yes)

stop
@enduml`
    },
    {
        id: 'act-flow-ctrl',
        name: 'Activity: Flow Control (Break/Jump)',
        mode: 'plantuml',
        category: 'UML: Behavior',
        code: `@startuml
start
:Start Batch Process;

if (Input Valid?) then (no)
  :Log Error;
  detach
endif

:Process Item;

if (Critical Failure?) then (yes)
  :Trigger Alarm;
  kill
endif

(A)
:Finalize;
detach

(A)
:Audit Log;
stop
@enduml`
    },
    {
        id: 'act-partition',
        name: 'Activity: Partitioning',
        mode: 'plantuml',
        category: 'UML: Behavior',
        code: `@startuml
partition "Initialization" {
    start
    :Load Config;
    :Init DB;
}

partition "Main Processing" #LightBlue {
    :Fetch Request;
    :Validate;
}

:Send Response;
stop
@enduml`
    },
    {
        id: 'dot-iso-flow',
        name: 'Flowchart: ISO Standard',
        mode: 'graphviz',
        category: 'UML: Behavior',
        code: `digraph G {
    node [fontname="Arial"];
    
    // ISO Shapes
    Start [shape=oval, label="Start"];
    Input [shape=parallelogram, label="Read Input"];
    Decision [shape=diamond, label="Is Valid?"];
    Process [shape=box, label="Process Data"];
    End [shape=oval, label="End"];
    
    Start -> Input;
    Input -> Decision;
    Decision -> Process [label="Yes"];
    Decision -> End [label="No"];
    Process -> End;
}`
    },
    {
        id: 'dot-swimlane',
        name: 'Flowchart: Swimlanes',
        mode: 'graphviz',
        category: 'UML: Behavior',
        code: `digraph G {
    rankdir=LR;
    node [shape=box];
    
    subgraph cluster_0 {
        label="User / Frontend";
        style=filled;
        color=lightgrey;
        Login; Submit;
    }
    
    subgraph cluster_1 {
        label="Backend / Server";
        style=filled;
        color=lightblue;
        Auth; Save;
    }
    
    Login -> Auth;
    Auth -> Submit;
    Submit -> Save;
}`
    },

    // --- REFERENCE: COMPLEX SYSTEMS (Real World) ---
    {
        id: 'ref-microservices',
        name: 'Ref: Microservices Trace',
        mode: 'plantuml',
        category: 'System: Architecture',
        code: `@startuml
title Distributed Tracing: Order Placement
autonumber
hide footbox
skinparam maxMessageSize 150

actor User
participant "Web App" as Web
participant "API Gateway" as Gate
participant "Order Svc" as Order
queue "Kafka\\nTopic: events" as Kafka
database "Redis\\nCache" as Cache
database "PostgreSQL\\nShards" as DB

User -> Web: Click "Buy Now"
activate Web
Web -> Gate: POST /orders
activate Gate

Gate -> Order: CreateOrder(Item, User)
activate Order

Order -> Cache: GET /stock/{id}
alt Cache Hit
    Cache --> Order: 200 OK (Qty: 5)
else Cache Miss
    Order -> DB: SELECT * FROM stock
    DB --> Order: Row(Qty: 5)
    Order -> Cache: SET /stock/{id}
end

Order -> DB: INSERT INTO orders
activate DB
DB --> Order: OrderID: 999
deactivate DB

Order -> Kafka: Publish(OrderCreated)
activate Kafka
Kafka --> Order: ACK
deactivate Kafka

Order --> Gate: 201 Created
deactivate Order

Gate --> Web: Success
deactivate Gate

Web --> User: Show Receipt
deactivate Web
@enduml`
    },
    {
        id: 'ref-ddd-aggregate',
        name: 'Ref: DDD Aggregate',
        mode: 'plantuml',
        category: 'UML: Structure',
        code: `@startuml
title DDD: Order Aggregate
skinparam groupInheritance 2

package "Domain Layer" {
    
    abstract class Entity<ID> {
        + id: ID
        + equals(): boolean
    }
    
    interface AggregateRoot
    
    class "Order" as Root <<Aggregate Root>> {
        - status: OrderStatus
        - items: List<OrderItem>
        + addItem(p: Product, q: int)
        + submit()
    }
    
    class "OrderItem" as Item <<Entity>> {
        - price: Money
        - quantity: int
    }
    
    class "Address" as VO <<Value Object>> {
        + street: String
        + city: String
        + zip: String
    }
    
    Root *-- "1..*" Item : contains
    Root *-- "1" VO : shipping
    Root --|> Entity
    Root ..|> AggregateRoot
}
@enduml`
    },
    {
        id: 'ref-tcp-state',
        name: 'Ref: TCP Lifecycle',
        mode: 'plantuml',
        category: 'UML: Behavior',
        code: `@startuml
title TCP Connection State Machine
hide empty description

[*] --> CLOSED

state "Active Open" as Active {
    CLOSED -> SYN_SENT : app: open\\nsend: SYN
    SYN_SENT -> ESTABLISHED : recv: SYN, ACK\\nsend: ACK
    SYN_SENT -> CLOSED : app: close
}

state "Passive Open" as Passive {
    CLOSED -> LISTEN : app: listen
    LISTEN -> SYN_RCVD : recv: SYN\\nsend: SYN, ACK
    SYN_RCVD -> ESTABLISHED : recv: ACK
}

state "Establishment" as Est {
    ESTABLISHED --> FIN_WAIT_1 : app: close\\nsend: FIN
    ESTABLISHED --> CLOSE_WAIT : recv: FIN\\nsend: ACK
}

state "Active Close" as AClose {
    FIN_WAIT_1 -> FIN_WAIT_2 : recv: ACK
    FIN_WAIT_2 -> TIME_WAIT : recv: FIN\\nsend: ACK
    FIN_WAIT_1 -> CLOSING : recv: FIN\\nsend: ACK
    CLOSING -> TIME_WAIT : recv: ACK
    TIME_WAIT --> CLOSED : wait 2MSL
}

state "Passive Close" as PClose {
    CLOSE_WAIT --> LAST_ACK : app: close\\nsend: FIN
    LAST_ACK --> CLOSED : recv: ACK
}
@enduml`
    },
    {
        id: 'ref-etl-pipeline',
        name: 'Ref: ETL Pipeline',
        mode: 'graphviz',
        category: 'System: Data',
        code: `digraph ETL {
    rankdir=LR;
    node [shape=box, style=rounded, fontname="Arial"];
    
    subgraph cluster_sources {
        label="Sources";
        style=dashed;
        CRM [shape=cylinder];
        Logs [shape=note];
        API [shape=component];
    }
    
    subgraph cluster_ingest {
        label="Ingestion Layer";
        bgcolor="#E1F5FE";
        Kafka [label="Kafka Topic", shape=parallelogram];
        S3_Raw [label="S3 (Raw)", shape=folder];
    }
    
    subgraph cluster_transform {
        label="Processing (Spark)";
        bgcolor="#E8F5E9";
        Clean [label="Data Cleaning"];
        Agg [label="Aggregation"];
        Enrich [label="Enrichment"];
    }
    
    subgraph cluster_serve {
        label="Serving";
        bgcolor="#FFF3E0";
        DW [label="Data Warehouse", shape=cylinder, style=filled, fillcolor=white];
        BI [label="Dashboard", shape=rect];
    }
    
    CRM -> Kafka;
    Logs -> Kafka;
    API -> Kafka;
    
    Kafka -> S3_Raw [label="Sink"];
    S3_Raw -> Clean [label="Batch"];
    Clean -> Enrich -> Agg;
    Agg -> DW [label="Load"];
    DW -> BI [label="Query"];
}`
    },
    {
        id: 'eng-db-sharding',
        name: 'DB Sharding Topology',
        mode: 'graphviz',
        category: 'System: Data',
        code: `graph Sharding {
    rankdir=TB;
    node [shape=box, style=filled, fillcolor="#F5F5F5"];
    
    // Application Layer
    App [label="Application Server", shape=component, fillcolor="#E1F5FE"];
    
    // Sharding Proxy
    Proxy [label="Sharding Proxy / Vitess", shape=diamond, fillcolor="#FFF9C4"];
    
    // Shards
    subgraph cluster_shard1 {
        label="Shard 1 (A-M)";
        color=blue;
        S1_Primary [label="Primary", fillcolor="#C8E6C9"];
        S1_Replica [label="Replica", style=dashed];
        S1_Primary -- S1_Replica [label="Replicate"];
    }
    
    subgraph cluster_shard2 {
        label="Shard 2 (N-Z)";
        color=red;
        S2_Primary [label="Primary", fillcolor="#C8E6C9"];
        S2_Replica [label="Replica", style=dashed];
        S2_Primary -- S2_Replica [label="Replicate"];
    }
    
    App -- Proxy;
    Proxy -- S1_Primary [label="Key: UserID"];
    Proxy -- S2_Primary [label="Key: UserID"];
}`
    },

    // --- SPECIALIZED: PROTOCOLS & PHYSICAL ---
    {
        id: 'sys-packet',
        name: 'Ref: Packet Protocol',
        mode: 'graphviz',
        category: 'System: Engineering',
        code: `digraph Packet {
    rankdir=LR;
    node [shape=record, fontname="Courier"];
    
    packet [label="{
        { <header> Header (32 bits) | <version> Ver | <type> Type | <len> Length } |
        { <src> Source IP (32 bits) } |
        { <dst> Dest IP (32 bits) } |
        { <payload> Payload (Variable Length...) } |
        { <crc> CRC (Checksum) }
    }"];
}`
    },
    {
        id: 'sys-rack',
        name: 'Ref: Rack Diagram',
        mode: 'plantuml',
        category: 'System: Architecture',
        code: `@startuml
title Physical Rack Layout
skinparam rectangle {
    BackgroundColor White
    BorderColor Black
}

rectangle "Rack A (42U)" {
    rectangle "Switch (Top)" as sw #LightBlue
    rectangle "Firewall" as fw #Pink
    
    rectangle "Server 1" as s1 {
        component "CPU"
        component "RAM"
    }
    
    rectangle "Server 2" as s2 {
        component "GPU"
    }
    
    rectangle "UPS (Bottom)" as ups #LightYellow
}

sw -- s1
sw -- s2
s1 -- fw
@enduml`
    },
    {
        id: 'uml-composite',
        name: 'UML: Composite Structure',
        mode: 'plantuml',
        category: 'UML: Structure',
        code: `@startuml
title Composite Structure with Ports
component "OrderService" {
    port "API" as p1
    port "DbConn" as p2
    
    component "Validator" as v
    component "Processor" as proc
    
    p1 -right-> v
    v -right-> proc
    proc -right-> p2
}

interface "HTTP" as http
http - p1
@enduml`
    },
    {
        id: 'dot-structs',
        name: 'Ref: Memory Structs',
        mode: 'graphviz',
        category: 'System: Engineering',
        code: `digraph Structs {
    rankdir=LR;
    node [shape=record];
    
    struct1 [label="<f0> left| <f1> middle| <f2> right"];
    struct2 [label="<f0> one| <f1> two"];
    struct3 [label="hello\\nworld |{ b |{c|<here> d|e}| f}| g | h"];
    
    struct1:f1 -> struct2:f0;
    struct1:f2 -> struct3:here;
}`
    }
];
