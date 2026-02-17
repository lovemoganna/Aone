# Aone AI Skills System - Implementation Plan

> **Goal**: Replace ad-hoc prompting with a standardized, modular Skills System across all Aone modules.
> **Standard**: Based on `.agent/skills/template-skill/SKILL.md`.

## 1. Core Architecture: The "Hybrid Skill" Model

We are moving from "System Prompt Engineering" to "Skill Loading".
- **Old Way**: Huge system prompt with everything.
- **New Way**:
    1.  **Agent Logic**: Small core personality (e.g., "Software Engineer").
    2.  **Skill Modules**: Externally loaded markdown files + scripts.

### Skill Structure Standard (`.agent/skills/<skill-name>/`)

1.  **`SKILL.md` (Mandatory)**: The "Brain". Contains prompt instructions, role definition, and workflow.
2.  **`resources/` (Knowledge)**: Markdown files (guides, cheat sheets) the agent reads for context.
3.  **`scripts/` (Capabilities)**: Python/Node scripts the agent runs for verification/execution.

## 2. Implemented Skills (Pilot Phase)

We have successfully prototyped the system with:

| Skill Name | Role | Status | Use Case |
| :--- | :--- | :--- | :--- |
| **`feature-mining`** | Product Architect | ✅ Done | MECE analysis for roadmap planning. |
| **`plantuml-expert`** | Visualization Specialist | ✅ Done | Generates/Validates PlantUML. |
| **`graphviz-wizard`** | Graph Theorist | ✅ Done | Optimizes DOT layouts. |

## 3. Recommended Rollout (Next Modules)

We should build Skills for the following core modules:

### 3.1 Module: Project Planning (`project-planner`)
- **Skill**: `plan-architect`
- **Resources**: `project-breakdown-template.md`, `agile-methodology.md`.
- **Scripts**: `validate_plan_structure.py`.

### 3.2 Module: Frontend Engineering (`frontend-engineer`)
- **Skill**: `react-component-builder` / `svelte-expert`
- **Resources**: `accessibility-checklist.md`, `state-management-patterns.md`.
- **Scripts**: `lint_component.js`.

### 3.3 Module: Backend API (`backend-engineer`)
- **Skill**: `api-designer`
- **Resources**: `rest-api-standards.md`, `security-best-practices.md`.
- **Scripts**: `validate_openapi.py`.

## 4. Integration Strategy

To make the AI use these skills:

1.  **Discovery**: Agent scans `.agent/skills/` at startup.
2.  **Selection**: Agent matches user intent ("Plan a feature") to skill description ("Project planning...").
3.  **Loading**: Agent reads `SKILL.md` into context.
4.  **Execution**: Agent follows the workflow defined in `SKILL.md`.

## 5. Maintenance & Quality Control

- **Versioning**: Each `SKILL.md` has a `version: x.y.z` field.
- **Testing**: Run `scripts/` manually to ensure tools work.
- **Feedback Loop**: Agent updates `resources/` with new learnings (e.g., "Graphviz `neato` failed for large graph").

---

## Action Items

1.  [x] Create Standard Template (`template-skill`).
2.  [x] Pilot with `feature-mining` skill.
3.  [x] Pilot with `plantuml-expert` skill.
4.  [ ] **Next**: Implement `project-planner` skill (as referenced in `/plan` workflow).
