# PLAN-prompt-hub-migration

> **Goal**: Migrate the single-file `PromptHub.html` prototype to a robust, component-based SvelteKit application within `src/routes/prompt-hub`.

## 🏗️ Architecture

### Data Model (`lib/types.ts` & `stores/promptStore.ts`)
- **Prompt**: `{ id, title, content, description, tags: string[], favorite: boolean, createdAt, updatedAt, usageCount }`
- **Tag**: `{ id, name, parentId, level }`
- **State Persistence**: `localStorage` (key: `prompthub_data`) via Svelte Stores (`$state` or `writable` with sync).

### Component Split
```
src/routes/prompt-hub/
├── +page.svelte            # Layout Container (Sidebar + Main Content)
├── components/
│   ├── Sidebar.svelte      # Left Sidebar
│   ├── TagTree.svelte      # Recursive Tag Navigation
│   ├── PromptList.svelte   # Grid/List View Container
│   ├── PromptCard.svelte   # Individual Prompt Card (Grid Item)
│   ├── PromptRow.svelte    # Compact List Item
│   ├── PromptToolbar.svelte# Search, Filter, Sort, View Toggle
│   ├── PromptPreview.svelte# Right Panel (Quick Preview)
│   └── modals/
│       ├── PromptEditorModal.svelte # Add/Edit Prompt (Tabs: Edit/Preview)
│       ├── TagModal.svelte          # Add/Edit Tags
│       ├── VariableModal.svelte     # Template Variable Filling
│       └── ExportImportModal.svelte # Data Management
```

## 📋 Task Breakdown

### Phase 1: Foundation (Stores & Types)
- [ ] Define `Prompt` and `Tag` interfaces
- [ ] Create `promptStore.ts` using Svelte 5 `$state` or Svelte 4 `stores`
- [ ] Implement LocalStorage synchronization
- [ ] Implement basic CRUD actions (add, update, delete, toggleFavorite)

### Phase 2: Core UI Components
- [ ] **Sidebar**: Search input + Quick Filters + `TagTree`
- [ ] **Main Area**: `PromptToolbar` (Search/Sort UI)
- [ ] **List View**: `PromptList` rendering dummy data then store data
- [ ] **PromptCard**: Styling (Glassmorphism + Tailwind) to match original

### Phase 3: Editors & Interaction
- [ ] **PromptEditorModal**: Form with Markdown editor (textarea)
- [ ] Markdown Preview Integration (`marked` library)
- [ ] Tag Management in Editor (Tag Selection)

### Phase 4: Advanced Features
- [ ] **Template Engine**: Regex parsing for `{{variable}}`
- [ ] **VariableModal**: Dynamic input generation for variables
- [ ] **Export/Import**: JSON logic from original file
- [ ] **Sidebar Logic**: Filtering prompts by tag

### Phase 5: Polish & UI/UX Pro Max
- [ ] Dark Mode support (check global theme compatibility)
- [ ] Transitions (Svelte transitions)
- [ ] Responsive Layout (Mobile drawer for sidebar)
- [ ] Keyboard Shortcuts (using `svelte:window`)

## 🛡️ Verification
- [ ] **Data Consistency**: Refresh page -> Data remains.
- [ ] **Import/Export**: Export JSON -> Clear Data -> Import JSON -> Data restored.
- [ ] **Template**: Create prompt with `{{topic}}` -> Use -> Variable input appears.
