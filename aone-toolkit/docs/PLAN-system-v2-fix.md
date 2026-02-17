# PLAN: V2 System Compliance & Fixes

## 1. Goal
Ensure the **Cognitive Decision Tool Platform (V2)** is fully implemented according to `multi-agnet-plus.md`, resolving all runtime errors and logic gaps.

## 2. Gap Analysis (MECE)

### 2.1 Runtime Stability (Critical)
- [x] **Issue**: `SkillService is not defined` in `agentStore.ts`.
- [ ] **Root Cause**: Missing import statement.
- [ ] **Impact**: All skill executions (Decompose, Matrix, etc.) fail silently or crash.

### 2.2 Cognitive Skill Engine (V2 Core)
- [ ] **Requirement**: 6 specific skills with strict Input/Output formats.
- [ ] **Status**: `SkillService.ts` definitions look correct, but execution linkage needs verification.
- [ ] **Gap**: Ensure `agentStore.ts` correctly passes `historyContext` and `goal` to `executeSkill`.

### 2.3 Agent Mindset Alignment (V2 Core)
- [ ] **Requirement**: Agents must act as "Mindsets" (e.g., "Decomposer"), not generic assistants.
- [ ] **Status**: `presetAgents` in `agentStore.ts` need to match V2 definitions (Colors, Icons, One-liners).
- [ ] **Gap**: Check if `presetAgents` data matches `2.3 Agent Definitions` in spec.

### 2.4 Strategy Governance (V2 Logic)
- [x] **Requirement**: Deterministic execution of approved strategy.
- [x] **Status**: Logic implemented in `runMetaFlow`.
- [ ] **Gap**: Verify smooth transition from "Strategy" -> "Skill 1" -> "Skill 2".

## 3. Implementation Steps

### Phase 1: Critical Fixes (Immediate)
1.  **Fix Import**: Add `import { SkillService } from "../services/SkillService";` to `src/lib/stores/agentStore.svelte.ts`.
2.  **Verify Call Site**: Ensure `SkillService.executeSkill` arguments match signature.

### Phase 2: Agent Data Synchronization
1.  **Update `presetAgents`**:
    *   **Decomposer**: Color `#FF6B35`, Icon `Prism` (or similar).
    *   **Calculator**: Color `#2EC4B6`, Icon `Scale`.
    *   **Pathfinder**: Color `#E8C547`, Icon `Compass`.
    *   **StressTester**: Color `#7B68EE`, Icon `Parachute`.
    *   **Closer**: Color `#20BF55`, Icon `Checkbox`.
2.  **Verify System Prompts**: ensure they enforce the "No Chicken Soup / No Judgment" rules.

### Phase 3: Skill Verification
1.  **Test Run**:
    *   Trigger "Money" scenario.
    *   Accept Strategy.
    *   Verify `SkillService` executes.
    *   Verify Output is Markdown (as defined in `SkillService.ts`).

## 4. Verification Checklist
- [ ] `SkillService` defined and callable.
- [ ] "Accept" button triggers first agent + skill.
- [ ] No infinite loop (Fixed previously).
- [ ] Agents use correct V2 colors/personas.
