# PROJ-010: Diagram Editor Interaction POC (Interaction & Navigation)

> **Status**: APPROVED
> **Goal**: Implement F-01 (Visual Layout Persistence) and F-03 (Double-Click Navigation) to validate the "Feature Mining" workflow.

## 1. 🏗️ Phase 1: Visual Layout Persistence (F-01)
*Goal: Allow users to drag Graphviz nodes and save their positions to code.*

- [ ] **Step 1.1: Parser Update (`parser.ts`)**
    - Update `extractProperties` to read `pos="x,y!"`.
    - Create `injectPosition` function to write `pos="x,y!"` (handling existing attributes).
- [ ] **Step 1.2: Store Update (`store.svelte.ts`)**
    - Add `updateNodePosition(id, x, y)` method.
    - Logic: Convert screen coordinates to Graphviz coordinates (requires scale/pan awareness).
- [ ] **Step 1.3: UI Event Handling (`Preview` / `Inspector`)**
    - Capture `dragend` event on SVG nodes.
    - Call `store.updateNodePosition`.

## 2. ⚡ Phase 2: Double-Click Navigation (F-03)
*Goal: Double-clicking a node jumps to its definition in the code editor.*

- [ ] **Step 2.1: Editor API Exposure (`Editor.svelte`)**
    - Export `scrollToLine(line: number)` function.
    - Bind this function to `diagramStore` context or event bus.
- [ ] **Step 2.2: Event Listener (`Preview`)**
    - Add `dblclick` listener to SVG nodes.
    - On click: Get `id` -> `store.definitions.get(id).line` -> Call `scrollToLine`.

## 3. 🧪 Phase 3: Verification
- [ ] **Test F-01**: Drag a node -> Code updates with `pos="..."` -> Reload -> Node stays.
- [ ] **Test F-03**: Double-click "User" node -> Editor scrolls to "class User".
