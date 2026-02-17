# PLAN-agent-orchestration

## Goal
Transform the hardcoded 5-agent system into a dynamic **Agent Orchestration Platform** where users can create, edit, and select abstract persona agents for their sessions.

## Architecture

### 1. Data Layer Modification (`agentStore.ts`)
- [ ] Add `customAgents` array to `AgentStore`.
- [ ] Add CRUD methods: `createAgent(agent)`, `updateAgent(id, updates)`, `deleteAgent(id)`.
- [ ] Persist `customAgents` to `localStorage` (key: `custom_agents_v1`).
- [ ] Update `agents` getter to combine `presetAgents` + `customAgents`.

### 2. Orchestration Logic (`agentStore.ts` & `metaPrompts.ts`)
- [ ] Update `runMetaFlow` to construct the `Available Agents` list dynamically based on the *current session's active agents*.
- [ ] Modify `metaPrompts.nextSpeakerSelection` to accept a `{roster}` variable instead of hardcoded names.

### 3. UI - The Agent Studio (`/routes/agent-studio`)
- [ ] **AgentBuilder**: A "Pro" form with:
    - Name & Role
    - System Prompt (The "Brain")
    - Color Picker (Tailwind palette)
    - Icon Selector (Lucide icons)
- [ ] **AgentGrid**: A masonry/grid view of all agents.

### 4. UI - The Lobby (`/routes/multi-agent/lobby`)
- [ ] **Squad Selector**: A "Character Select" screen before the chat starts.
- [ ] Users pick 3-5 agents to form their "Council".
- [ ] "Start Session" button initializes the chat with *only* selected agents.

## Implementation Steps

### Phase 1: Core Logic (Dynamic Registry)
1.  Modify `Agent` interface if needed (add `isCustom` flag).
2.  Implement CRUD in `AgentStore`.
3.  Verify persistence.

### Phase 2: The Agent Studio (Creation UI)
1.  Create `/agent-studio` route.
2.  Build `AgentCard` (Interactive, flip for details).
3.  Build `AgentForm` (Creation/Editing).

### Phase 3: Dynamic Orchestrator
1.  Refactor `runMetaFlow` to map `activeAgentIds` to actual prompts.
2.  Test with a custom agent (e.g., "The Joker" or "Steve Jobs").

### Phase 4: Integration (Lobby)
1.  Update `Layout` to link to Studio.
2.  Replace default "Start" with "Lobby" flow.

## Verification Checklist
- [ ] Can I create a new agent "Batman"? (UI check)
- [ ] Does "Batman" persist after refresh? (Storage check)
- [ ] Can I select "Batman" in a new session? (Lobby check)
- [ ] Does the AI specificially call "Batman" when relevant? (Orchestrator check)
