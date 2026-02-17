# PLAN-skills-creation.md

> **Goal**: Create two high-quality AI skills (`plantuml-expert`, `graphviz-wizard`) with comprehensive references and utility scripts.
> **Mode**: Option B (Visual Engineering Suite)

## 1. Skill: PlantUML Expert (`.agent/skills/plantuml-expert/`)

### 1.1 Core Definition (`SKILL.md`)
- **Role**: Senior UML Architect & C4 Model Specialist.
- **Goal**: Generate syntactically correct, aesthetically pleasing, and structurally sound UML diagrams.
- **Process**: Design -> Scaffold -> Refine -> Validate.

### 1.2 Resources (`resources/`)
- `syntax-cheat-sheet.md`: Quick ref for Sequence, Class, State, Activity, and Mindmap.
- `c4-model-guide.md`: Standard patterns for C4 Context, Container, and Component diagrams.
- `theming-guide.md`: Best practices for `skinparam`, colors, and fonts (avoiding default "yellow/red" look).

### 1.3 Scripts (`scripts/`)
- `validate_puml.py`:
  - Checks for balanced brackets `{}`.
  - Verifies `@startuml`/`@enduml` tags.
  - Detects common syntax errors.
- `generate_url.py`:
  - Compresses code (deflate + base64) to generate a valid `plantuml.com` link for previewing. (Crucial for agent self-verification).

## 2. Skill: Graphviz Wizard (`.agent/skills/graphviz-wizard/`)

### 2.1 Core Definition (`SKILL.md`)
- **Role**: Data Visualization & Graph Theory Specialist.
- **Goal**: Create clear, optimized directed/undirected graphs using DOT language.
- **Process**: Structure Data -> Choose Layout -> Style Attributes.

### 2.2 Resources (`resources/`)
- `layout-engines.md`: Guide on when to use `dot` (hierarchical), `neato` (spring), `fdp`, `twopi`.
- `attributes-ref.md`: High-value attributes for Nodes (`shape`, `style`), Edges (`dir`, `arrowhead`), and Graphs (`rankdir`, `splines`).
- `node-shapes.md`: Visual catalog of available shapes.

### 2.3 Scripts (`scripts/`)
- `lint_dot.py`:
  - Validates basic DOT syntax.
  - Checks for directed (`->`) vs undirected (`--`) consistency.
- `optimize_attrs.py`:
  - Suggests global attributes to reduce verbosity (e.g., `node [fontname="Arial"]`).

## 3. Implementation Steps (Execution Phase)

1.  **Scaffold Directories**: Create folders in `.agent/skills/`.
2.  **Author SKILL.md**: Write the prompt engineering protocols for both skills.
3.  **Compile Resources**: aggregate knowledge into markdown files.
4.  **Develop Scripts**: Write Python scripts for validation and URL generation.
5.  **Register**: Update `APPLICATION_KNOWLEDGE.md` or System Prompt to include new skills.

## 4. Verification

- [ ] Run `python .agent/skills/plantuml-expert/scripts/validate_puml.py test.puml` -> Success.
- [ ] Run `python .agent/skills/graphviz-wizard/scripts/lint_dot.py test.dot` -> Success.
- [ ] Review `SKILL.md` ensures it follows the Standard Template.
