# PLAN: Survival Platform Iteration

## Goal Description
Transform the current "Task Executor" architecture into a true "Conversation Orchestrator" where agents interact dynamically. Implement strict "Stuck Detection" and polish the UI to "Pro Max" standards.

## User Review Required
> [!IMPORTANT]
> This refactor changes `runMetaFlow` from a parallel executor to a sequential state machine. This might increase latency but dramatically improves conversation quality.

## Proposed Changes

### Logic Layer (`agentStore.svelte.ts`)
#### [MODIFY] `runMetaFlow`
- **Orchestrator Mode**: Instead of decomposing all tasks upfront, the orchestrator (or Decomposer) decides the **Next Best Agent** after each turn.
- **Loop**: Input -> Decomposer (Plan Next Step) -> Selected Agent (Execute) -> Decomposer (Check Goal Met?) -> Loop.

#### [NEW] `stuckDetection`
- Implement a hash check of the last 3 outputs.
- If repeated, force switch to `Closer` agent.

### UI/UX Layer (`components/`)
#### [MODIFY] `ChatArea.svelte`
- **Streaming**: Ensure the *active* agent's response streams token-by-token.
- **Dynamic Avatars**: Show the active agent prominently next to the typing indicator.

#### [MODIFY] `AgentSidebar.svelte`
- **Active State**: Highlight the currently speaking agent more vividly (e.g., ring animation).

## Verification Plan

### Automated Tests
- N/A (Manual verification primary)

### Manual Verification
1. **Flow Test**: Start "Relationship" scenario. Ensure agents take turns logically (Decomposer -> Calculator -> Closer) rather than all at once.
2. **Stuck Test**: Repeat the same input 3 times. Verify `Closer` intervenes.
3. **UI Test**: Verify streaming text appears with the correct agent avatar.
