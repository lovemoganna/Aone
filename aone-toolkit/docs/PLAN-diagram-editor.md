# Plan: Diagram Editor Migration

## 1. Goal
Migrate the single-file `Plantuml_Dot_graphviz_editor.html` into a fully integrated SvelteKit module within `aone-toolkit`.

## 2. Architecture & Tech Stack
- **Route**: `/diagram-editor`
- **Store**: Svelte 5 Reactive Store (`lib/diagramStore.svelte.ts`)
- **Editor**: CodeMirror 6 (using existing project dependencies)
- **Rendering**:
  - **PlantUML**: Client-side encoding (using `pako`) -> `plantuml.com` API.
  - **Graphviz**: Client-side rendering (using `@viz-js/viz`).

## 3. Component Breakdown

### A. Layout (`+page.svelte`)
- **Responsibility**: Manages the Grid Layout (`Header`, `Editor`, `Preview`).
- **Features**: Responsive Resizable Split Pane (Manual implementation or component).

### B. Header (`components/Header.svelte`)
- **Features**: 
  - Logo / Title
  - Mode Switcher (PlantUML / Graphviz)
  - Toolbar Actions (Export, Settings, Help, Snippets)
  - Theme Toggle

### C. Editor Panel (`components/Editor.svelte`)
- **Responsibility**: Code editing.
- **Features**:
  - CodeMirror 6 instance.
  - Line numbers, wrapping.
  - Integration with Store for `code` binding.
  - Keyboard shortcuts (`Ctrl+Enter` to Render).
  - Search/Replace UI (Integrated or separate).

### D. Preview Panel (`components/Preview.svelte`)
- **Responsibility**: Display SVG.
- **Features**:
  - `innerHTML` rendering of SVG.
  - Pan & Zoom logic (Mouse wheel, Drag).
  - Export utilities (SVG/PNG download).
  - Loading State overlay.

### E. Modals (`components/modals/*.svelte`)
- `SettingsModal.svelte`: Font size, theme.
- `SnippetModal.svelte`: Load/Save snippets (Local storage or In-memory).
- `HelpModal.svelte`: Syntax reference.

## 4. State Management (`lib/store.svelte.ts`)
New `DiagramStore` class:
- **State**:
  - `code`: string
  - `mode`: 'plantuml' | 'graphviz'
  - `svg`: string
  - `scale`: number
  - `pan`: {x, y}
  - `isRendering`: boolean
- **Actions**:
  - `render()`: Async function dispatching to services.
  - `encodePlantUML()`: Helper.
  - `exportImage()`: Helper.

## 5. Dependencies
New packages required:
- `pako` (for PlantUML compression)
- `@viz-js/viz` (for Graphviz)

## 6. Implementation Steps
1. **Setup**: Install dependencies. Create route directory.
2. **Services**: Implement `renderService.ts` (Viz.js setup, Pako encoding).
3. **Store**: Create `DiagramStore`.
4. **Components**: Build dumb components (`Header`, `Preview`).
5. **Editor**: Integrate CodeMirror 6.
6. **Integration**: Wire up `+page.svelte` and ensure rendering works.
7. **Refinement**: Migrate Snippets and Theme logic.

## 7. Verification
- Verify PlantUML rendering (Network request).
- Verify Graphviz rendering (WebWorker/WASM).
- Check Pan/Zoom performance.
- Test Export function.
