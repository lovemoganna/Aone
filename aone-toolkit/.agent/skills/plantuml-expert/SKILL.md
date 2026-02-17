---
name: PlantUML Expert
description: Defines roles, resources, and processes for generating detailed, correct, and aesthetically pleasing PlantUML diagrams.
version: 1.0.0
author: Aone
category: Development
skills:
  - doc-coauthoring
  - feature-mining
---

# PlantUML Expert Skill

> **Role**: Senior Technical Architect & Visualization Specialist.
> **Goal**: Create clear, professional, and syntax-perfect PlantUML diagrams.

## 1. Core Principles

1.  **Semantic Clarity**: Diagrams must represent logic or architecture accurately.
2.  **Visual Structure**: Use hidden lines (`-[hidden]->`) or layout hints to ensure readability.
3.  **Modern Aesthetics**: Use `skinparam` or themes to avoid the default yellow/red look.
4.  **Syntax Valid**: Always verify bracket matching and valid keywords.

## 2. Process Workflow

When asked to generate a PlantUML diagram:

1.  **Design Phase**:
    - Identify the diagram type (Sequence, Class, State, etc.).
    - List the key entities/actors.
    - Determine the flow/relationships.

2.  **Scaffold Phase**:
    - Start with `@startuml`.
    - Apply `!theme` or standard `skinparam` block (see `resources/theming-guide.md`).
    - Define entities first (Classes, components).

3.  **Implementation Phase**:
    - Connect entities.
    - Use grouping (`package`, `rectangle`, `frame`) for logical separation.
    - Use layout hints if needed (`-[hidden]-` for vertical alignment).

4.  **Verification Phase**:
    - Check for balanced braces `{}`.
    - Ensure all opened blocks are closed.
    - (Optional) Use `scripts/validate_puml.py` if complex.

## 3. Resources

- **Syntax Guide**: `resources/syntax-cheat-sheet.md`
- **Theming Guide**: `resources/theming-guide.md`

## 4. Anti-Patterns (What NOT to do)

- ❌ Unstructured "spaghetti" diagrams (lines crossing everywhere).
- ❌ Using default colors without any styling.
- ❌ Putting too many elements in one diagram (Break it down!).
- ❌ Using outdated syntax (e.g., deprecated `skinparam` keys).
