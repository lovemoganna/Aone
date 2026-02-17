# Diagram Editor - Feature Mining (20+ MECE)

> **Goal**: Uncover high-value, previously unrecognized features for the Diagram Editor module.
> **Method**: MECE Layered Analysis.
> **Context**: Current editor supports basic PlantUML/Graphviz rendering with recently added coordinate persistence (F-01) and double-click navigation (F-03).

## 1. Domain: Interaction & Manipulation (Immediate User Control)

### F-01: Visual Layout Persistence (Extended) - [IMPLEMENTED]
- **Problem**: Dragging nodes only persists temporarily in memory. (Note: Implemented basic version, but full engine support for PlantUML/Mermaid is missing).
- **Core Value**: Enables "Human-in-the-Loop" layout refinement.

### F-02: Smart Pan & Zoom State Restoration
- **Problem**: Refreshing the page or switching tabs resets zoom/pan to (0,0), losing context.
- **Solution**: Persist `pan` and `scale` per-document in `localStorage`.
- **Value**: Reduces friction when switching between code/preview tasks.

### F-03: Double-Click Code Navigation - [IMPLEMENTED]
- **Problem**: Finding the definition of "service_A" in 500 lines of code is slow.
- **Value**: Instant context switching.

### F-04: Drag-to-Connect Visual Editor
- **Problem**: Typing `A -> B` repeatedly is tedious for sketch phases.
- **Solution**: Shift+Drag from Node A to Node B in preview appends connection syntax to code.
- **Value**: Hybrid "Visual + Code" workflow speeds up initial drafting by 3x.
- **Why Missed**: Focus was purely on "Code-to-Diagram", not "Diagram-to-Code".

### F-05: Context-Aware Snippet Injection (Drag & Drop)
- **Problem**: Snippet modal disconnects user from canvas context.
- **Solution**: Drag a "Database" icon from sidebar onto a specific *Group/Package* in the diagram to inject code *inside* that block.
- **Value**: Semantic-aware editing.

## 2. Domain: Data &IO (Files, Export, Integration)

### F-06: High-Resolution Export Strategy (PNG/PDF)
- **Problem**: Browser screenshots are low-DPI. `svg` export is good but not always compatible.
- **Solution**: Use `canvas` scaling (2x/4x) or `jspdf` to generate print-ready artifacts.
- **Value**: Professional reporting/presentation usage.

### F-07: Local File System Sync (File System Access API)
- **Problem**: Copy-pasting code into VS Code/IntelliJ is manual labor.
- **Solution**: Use `window.showSaveFilePicker()` to directly save `.puml` files to disk.
- **Value**: Turns the web app into a desktop-class IDE tool.

### F-08: Structural Diff View (Code-to-Diagram Diff)
- **Problem**: `git diff` shows text changes, but logic changes are hard to visualize.
- **Solution**: Parse `Old` vs `New` ASTs and highlight *graph* differences (e.g., deleted edge = red dashed line).
- **Value**: Code review super-power for architects.

### F-09: Live Share (CRDT-based Collaboration)
- **Problem**: Pair programming usually means screensharing, which is passive for one dev.
- **Solution**: Integrate Y.js to bind `diagramStore.code` to a WebSocket room.
- **Value**: Real-time collaborative architecture design.

### F-10: Bulk Export / Project Compile
- **Problem**: Need to export 5 diagrams for a slide deck.
- **Solution**: "Export All Open Tabs" zip download.
- **Value**: Workflow automation.

## 3. Domain: Intelligence & Automation (AI, Linter, Refactor)

### F-11: Rule-Based Linter & Quick Fixes
- **Problem**: "Syntax Error on line 5" is vague. Logical errors (e.g., circular dependency in DAG) are silent.
- **Solution**: Graph analysis engine (using `graphlib`) to detect cycles, orphans, or duplicate edges. Provide "Remove Cycle" button.
- **Value**: Prevents logical architecture bugs before implementation.

### F-12: Natural Language Refactoring Engine
- **Problem**: "Rename 'User' to 'Customer' everywhere" is risky with regex.
- **Solution**: LLM-driven refactor command: "/refactor rename User to Customer" handles labels, aliases, and comments.
- **Value**: Safe, semantic refactoring.

### F-13: Smart Autocomplete (Context-Aware)
- **Problem**: Standard autocomplete just lists keywords.
- **Solution**: If inside `package "Payment"`, prioritize autocompleting related classes/interfaces from that domain.
- **Value**: Reduces cognitive load.

### F-14: Architecture Explanation Generator
- **Problem**: Sharing a diagram often requires explaining it verbally.
- **Solution**: Generative AI summarizes the *flow* and *intent* of the diagram into a text description.
- **Value**: Documentation auto-generation.

### F-15: Auto-Layout Optimization Suggestions
- **Problem**: Graphviz/PlantUML layout is deterministic but often sub-optimal (e.g., wide graphs).
- **Solution**: Heuristic analyzer suggests: "Your graph is too wide. Try `rankdir=TB`?" or "Too many crossing edges, try Grouping?".
- **Value**: Teaches users best practices effectively.

## 4. Domain: Engineering & Customization (The "Platform")

### F-16: Customizable Theme Editor (GUI)
- **Problem**: Editing `skinparam` requires memorizing obscure syntax.
- **Solution**: Visual form (Color Picker, Font Dropdown) that *generates* the `skinparam` block at the top of the file.
- **Value**: Democratizes "pretty diagrams" for non-experts.

### F-17: Performance Mode (Large Graph Virtualization)
- **Problem**: Rendering 500+ nodes crashes the DOM/SVG renderer.
- **Solution**: Switch to Canvas rendering or only render visible viewport nodes (virtualization) for large graphs.
- **Value**: Enterprise scalability.

### F-18: Multi-Language Parsing Foundation (Mermaid Support)
- **Problem**: Locked into PlantUML/Graphviz.
- **Solution**: Abstract the parser interface to accept Mermaid.js adapter.
- **Value**: Broadens user base significantly.

### F-19: Minimap Viewport Indicator
- **Problem**: Panning a large diagram blindly is disorienting.
- **Solution**: Add a "lens" rectangle to the Minimap showing the current viewport.
- **Value**: Improved navigation UX.

### F-20: Node Grouping UI (Visual Refactor)
- **Problem**: Grouping nodes requires typing `package { ... }` and moving lines manually.
- **Solution**: Select multiple nodes -> Right Click -> "Group". Editor wraps them in a package block.
- **Value**: Rapid reorganization of thoughts.

---

## Self-Correction & Validation

1.  **Overlap w/ Existing?**:
    - F-03 (Double Click) is implemented but listed for completeness of the "Interaction" domain.
    - F-01 (Persistence) is implemented but basic; "Drag-to-Connect" (F-04) is the logical next step (Interaction -> Transformation).
2.  **Feasibility**:
    - F-09 (Live Share) is complex but uses established libraries (Y.js).
    - F-12 (NL Refactoring) requires LLM integration (already present in Aone).
    - F-17 (Virtualization) is standard frontend engineering.
3.  **Value**:
    - "High-Res Export" (F-06) is a top user request for any diagram tool.
    - "Theme Editor" (F-16) solves the #1 complaint about PlantUML (ugliness).
