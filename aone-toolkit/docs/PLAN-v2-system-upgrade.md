# PLAN: Systematic V2 System Upgrade

## 1. Goal
Achieve **100% Compliance** with `multi-agnet-plus.md` (V2 Cognitive Decision Tool Platform).
Transform the system from a "Chatbot" to a "Cognitive Tool Library".

## 2. Gap Analysis & Tasks

### Phase 1: Mindset & Identity (The "Soul")
- [ ] **Agent Redefinition**: Update `agentStore.ts` `presetAgents` to strictly match V2 specs.
    - [ ] `Decomposer`: Agent ID, Name, Role, Color (#FF6B35), Description, Traits.
    - [ ] `Calculator`: Agent ID, Name, Role, Color (#2EC4B6), Description, Traits.
    - [ ] `Pathfinder`: Agent ID, Name, Role, Color (#E8C547), Description, Traits.
    - [ ] `StressTester`: Agent ID, Name, Role, Color (#7B68EE), Description, Traits.
    - [ ] `Closer`: Agent ID, Name, Role, Color (#20BF55), Description, Traits.
- [ ] **System Prompts**: Verify `SURVIVAL_PROMPTS.ts` enforces "No Chicken Soup" rule and binds specific Skills.

### Phase 2: Cognitive Engine (The "Brain")
- [ ] **Skill Connection**: Ensure `SkillService` is correctly imported and invoked in `agentStore.ts` (Done, but execute verify).
- [ ] **Skill Definitions**: Audit `SkillService.ts` against V2 doc.
    - [ ] `decompose`: Input/Output strict Markdown format.
    - [ ] `decision_matrix`: Input/Output strict Markdown format.
    - [ ] `stress_test`: Input/Output strict Markdown format.
    - [ ] `resource_audit`: Input/Output strict Markdown format.
    - [ ] `reframe`: Input/Output strict Markdown format.
    - [ ] `action_list`: Input/Output strict Markdown format.

### Phase 3: Visual & UX (The "Body")
- [ ] **UI Colors**: Update Tailwind classes in `AgentCard.svelte` / `MessageBubble.svelte` to match the specific Hex codes via dynamic styles or config.
- [ ] **Icons**: Ensure `lucide-svelte` icons match the V2 spec (Prism, Scale, Compass, Parachute, Checkbox).
- [ ] **Layout**: Verify "Full Screen Drag & Drop" metaphor (or closest approximation in current UI).

### Phase 4: Workflow Governance (The "Law")
- [ ] **Deterministic Loop**: Verify `runMetaFlow` strictly follows Strategy Plan (Step 1 -> 2 -> 3).
- [ ] **Infinite Loop Prevention**: Verify `governanceState` retention logic.

## 3. Execution Sequence

1.  **Backend/Logic**: Fix Agent Definitions & Skill bindings (`agentStore.ts`, `SURVIVAL_PROMPTS.ts`). [x]
2.  **Frontend/UI**: Update Colors & Icons to match V2 Identity. [x]
3.  **Verification**: Run "Money" and "Career" scenarios to verify end-to-end flow. [ ]

## 4. Verification Criteria
- [x] **Visual**: Decomposer is Orange (#FF6B35), Calculator is Teal (#2EC4B6).
- [ ] **Behavior**: "Accept" triggers automatic execution of the plan.
- [ ] **Output**: Skills output structured Markdown (Tables, Lists), not conversational text.
