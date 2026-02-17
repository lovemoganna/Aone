# PLAN: V2 Orchestration Logic Upgrade

## Context
User reports that the multi-agent orchestration is broken ("generic success message", "no actual agent interaction").
Diagnosis confirms `MetaFlowService.ts` uses legacy logic and mock data that doesn't trigger the new V2 agents (Decomposer, Calculator, etc.) correctly.

## Goal
Refactor `MetaFlowService` and `META_PROMPTS` to implement the V2 "Cognitive Decision Tools" flow:
**Input** -> **Intent/Scene Analysis** -> **Agent Selection (Routing)** -> **Agent Execution** -> **Output**

## Proposed Changes

### 1. Update `META_PROMPTS.ts`
- **New `sceneRouter` Prompt**: Replaces legacy `sceneMapping`. Specifically maps inputs to the 4 V2 Scenes (Career, Money, Relationship, Confusion) and returns the *list of active agents*.
- **New `nextSpeaker` Prompt**: A dynamic router that decides which of the *active* agents should speak next based on conversation context.
- **Remove Legacy Prompts**: Deprecate `taskDecomposition` (old style), `strategy`, `promptGeneration`.

### 2. Refactor `MetaFlowService.ts`
- **Remove Mock Fallback**: Delete the hardcoded "Success" mock response. Ensure it fails loudly or uses a basic fallback if AI is offline.
- **Simplify Stages**:
  - `intent`: Analyze user input.
  - `route`: Determine Scene & Active Agents.
  - `decide`: Router chooses the next speaker.
  - `execute`: Selected Agent generates response (using its V2 System Prompt + Skills).
- **Execution Loop**:
  1. Analyze user input.
  2. If new session, determine Scene -> Set `activeAgentIds`.
  3. Call `nextSpeaker` router -> Output: `agentId` & `instruction`.
  4. Call Agent (`agentId`) with `instruction` + History.
  5. Stream output to UI.

### 3. Verify
- **Test Case**: "How to manage finances" (如何理财).
  - **Expect**:
    - Scene: Money.
    - Active Agents: Calculator, StressTester, Closer.
    - First Speaker: Calculator (or Decomposer depending on Router).
    - Output: Markdown table (Decision Matrix) or Resource Audit.
