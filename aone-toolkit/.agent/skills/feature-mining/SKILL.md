---
name: Feature Miner
description: MECE-based, deep contextual analysis for feature discovery and roadmap planning.
version: 1.0.0
author: Aone
category: Analysis
skills:
  - brainstorming
  - architecture
---

# Feature Mining Skill

> **Role**: Principal Product Architect.
> **Goal**: Uncover hidden technical and user value by analyzing gaps in the current implementation.

## 1. Context & Setup

Before creating any feature list:
1.  **Read the Codebase**: Understand what *already works*.
    - Files: `src/routes/diagram-editor/lib/parser.ts`, `src/routes/diagram-editor/lib/store.svelte.ts`.
    - Knowledge: Existing AI features (Heuristic Engine), PlantUML support.
2.  **Apply MECE Principle**: (Mutually Exclusive, Collectively Exhaustive).
    - Features must not overlap.
    - Combined, they must cover 100% of the opportunity space.

## 2. Process Workflow

### Step 1: Context Mapping (Current State)
- List current capabilities (e.g., "Basic PlantUML rendering").
- Identify limitations (e.g., "No custom themes", "Slow on large diagrams").
- Map user journey: Create -> Modify -> Share -> Export.

### Step 2: MECE Brainstorming (The "Grid")
Fill the following matrix:

| Layer | Functional (User sees) | Engineering (User feels) | Operational (Dev maintains) |
| :--- | :--- | :--- | :--- |
| **Data** | Multi-file linking | Incremental parsing | Schema validation |
| **Visual** | Custom themes | Canvas virtualization | Snapshot testing |
| **Interaction** | Drag-drop | Undo/Redo history | Keyboard shortcuts |
| **Intelligence** | Auto-fix | Linter | Usage analytics |
| **IO** | Export PDF | CRDT sync | CLI integration |

### Step 3: Feasibility Filtering
- **Discard**: Features that require rewriting the core engine (unless critical).
- **Discard**: Features with <5% user utility.
- **Prioritize**: Low effort, high impact.

### Step 4: Specification (The Output)
For each selected feature, write:
- **Title**: Action-oriented name.
- **Core Problem**: Why it matters.
- **Solution**: Technical approach.
- **Value**: ROI.

## 3. Constraints & Anti-Patterns

- ❌ "Add AI": Vague. Use "Add AI alignment suggestions".
- ❌ "Refactor Code": Not a feature. Use "Modularize Parser for Plugin Support".
- ❌ Duplicates: Check if existing feature covers 80% of use case.
- ❌ Fancy but useless: e.g., "3D View" for a 2D diagram tool.

## 4. Output Format

```markdown
### F-01: [Feature Name]
- **Problem**: ...
- **Solution**: ...
- **Value**: ...
- **Effort**: Low/Med/High
```
