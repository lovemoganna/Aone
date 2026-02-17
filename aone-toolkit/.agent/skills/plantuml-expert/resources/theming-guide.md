# PlantUML Theming Guide

Avoid using the default "yellow sticky note" theme.
Ensure diagrams look clean, modern, and aligned with company brand (if applicable).

## 1. Quick Themes (Best for rapid prototypes)

Use built-in themes for consistent styling.

```plantuml
@startuml
!theme spacelab  // Professional, blue/grey
// Option: !theme united
// Option: !theme plain
actor User
participant "App Service" as App
User -> App: Login
@enduml
```

## 2. Advanced C4 Styling (`skinparam`)

For custom branding or precise control.

```plantuml
@startuml
' Global Settings
skinparam monochrome false
skinparam hand/sketching false
skinparam shadowing false
skinparam defaultFontName "Helvetica"
skinparam defaultFontSize 14

' Node Specifics
skinparam node {
    BackgroundColor #FEFECE
    BorderColor #A80036
    FontName "Courier"
}

skinparam arrow {
    Color #444444
    FontColor #444444
    FontSize 12
}

' Use Rectangles for layout containers
skinparam rectangle {
    BackgroundColor #EEEEEE
    BorderColor #CCCCCC
    StereotypeFontColor #AAAAAA
}
@enduml
```

## 3. Hidden Lines for Layout

Crucial for avoiding overlapping lines.

- `-[hidden]-`: Standard invisible link.
- `-[hidden]down-`: Forces target below (if default layout fails).
- `-[hidden]right-`: Forces target to right.

Example:
```plantuml
User -[hidden]-> Dashboard : User is always above Dashboard
Login -[hidden]right- Signup : Signup is strictly to right of Login
```

## 4. Brand Colors

If you need specific hex codes:

| Role | Hex | Description |
| :--- | :--- | :--- |
| Primary | `#0d6efd` | Main Action/Entity |
| Secondary | `#6c757d` | Supporting/Background |
| Success | `#198754` | Valid Flow/Okay State |
| Danger | `#dc3545` | Error/Critical Path |
| Warning | `#ffc107` | Caution/Optional |
