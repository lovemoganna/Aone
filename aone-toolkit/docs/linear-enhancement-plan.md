# Diagram Editor - Linear-Style Enhancement Plan

> **Vision**: Transform the Diagram Editor into a high-performance, keyboard-first, architect-grade utility. Inspired by Linear's focus on speed, polish, and system depth.

---

## 🏗️ Architectural Layering (MECE)

All enhancements are built upon the existing Svelte 5 + CodeMirror 6 architecture.

1.  **Interaction Layer**: Keyboard-first UI, Command Palette, Snapshots.
2.  **Intelligence Layer**: Real-time Python-powered linting, AI-assisted refactoring.
3.  **Visualization Layer**: Optimized rendering, Themes, Minimap.
4.  **IO Layer**: Local file sync, High-res export.

---

## 📈 Roadmap & Milestones

### Milestone 1: Command & Control (Speed & Navigation)
*Target: "0ms friction for power users"*

- [ ] **Linear-Style Command Palette**: Enrich the existing palette with categories (Actions, Themes, Snippets, Layouts).
- [ ] **Keyboard Shortcut System**: Universal shortcuts for Toggle Sidebar ( `Cmd+\` ), Force Render ( `Cmd+S` ), Toggle Minimap ( `Cmd+M` ).
- [ ] **Minimap Viewport Indicator**: Visual feedback in the minimap showing current zoom/pan area.
- [ ] **Workspace State Persistence**: Save zoom, pan, and active tab in `localStorage`.

### Milestone 2: The "Guardian" (Real-time Quality)
*Target: "Error-free architecture"*

- [ ] **Integrated Linting Service**: Background execution of `validate_puml.py` and `lint_dot.py` on every change.
- [ ] **In-Editor Error Highlighting**: Map script errors back to CodeMirror line decorations (Gutter icons/Underlines).
- [ ] **Auto-Fixer Suggestions**: "Click to fix balanced braces" or "Convert -> to -- for Graph".

### Milestone 3: Deep Customization (Visual Context)
*Target: "Presentation-ready artifacts"*

- [ ] **Dynamic Theme Engine**: GUI-based generator for `skinparam` and `!theme`.
- [ ] **Snippet Intelligence**: Drag-and-drop snippets from the hub directly into specific line numbers in the editor.
- [ ] **Focus Mode**: Isolate specific nodes and their 1-hop path visually.

---

## 🛠️ Implementation Strategy (The Linear Way)

1.  **No Placeholders**: Every feature must include a validation script.
2.  **Performance First**: Use debounced rendering and off-thread linting (where possible).
3.  **Atomic Commits**: Small, testable changes following the `feature-miner` principles.

---

## 🏁 Verification Protocol

- [ ] **Lint**: `lint_runner.py` must pass for all Svelte/TS files.
- [ ] **UX Audit**: `ux_audit.py` to ensure adherence to design tokens.
- [ ] **Skill Alignment**: Verify that PlantUML generation follows `theming-guide.md`.
