# PLAN: Multi-Agent System V2 Upgrade

This plan outlines the steps to upgrade the `multi-agent` system to strictly adhere to the `docs/multi-agnet-plus.md` V2 specification, transforming it from a general chatbot platform to a structured "Cognitive Decision Tool Platform".

## 1. Goal
- **Strict V2 Compliance**: Ensure all 5 Agents and 6 Skills match the V2 definition exactly.
- **Identity Shift**: Remove "Role Play" features (Persona Generation) in favor of "Cognitive Tools".
- **Visual Polish**: Align UI with the specified V2 color palette and "Card" metaphor.

## 2. Gap Analysis

| Feature | Current State | V2 Requirement | Action |
| :--- | :--- | :--- | :--- |
| **Agents** | 5 Presets defined in `agentStore` | 5 Specific Agents (Decomposer, Calculator, etc.) with specific IDs and Colors | **Verify & Polish** colors/prompts. |
| **Skills** | 6 Skills defined in `SkillService` | 6 Specific Skills (Decompose, Decision Matrix, etc.) with Markdown Output | **Verify** formatting instructions. |
| **Prompts** | Partial V2 in `SURVIVAL_PROMPTS` | Precise "Core Framework", "Style", "Prohibitions" text | **Update** syntax to match V2 Doc exactly. |
| **Custom Agents** | Supported (`PersonaGenerator`) | Not mentioned in V2 (Platform is "The 5 Weapons") | **Deprecate** `PersonaGenerator` & `customAgents`. |
| **UI Colors** | Tailwind classes `v2-*` exist | Hex codes: #FF6B35, #2EC4B6, etc. | **Verify** usage in Components. |

## 3. Implementation Tasks

### Phase 1: Cognitive Core (The Brain)
- [ ] **Strict Prompt Alignment**: Update `src/lib/constants/survivalPrompts.ts` found in `multi-agnet-plus.md`. Ensure "Prohibited Behaviors" and "Cognitive Frameworks" are copied verbatim.
- [ ] **Skill Refinement**: Update `src/lib/services/SkillService.ts` to ensure the `inputPrompt` forces the exact Markdown output format (Tables, Lists) described in V2.

### Phase 2: Visual Identity (The Body)
- [ ] **Icon & Color Audit**:
    - Verify `AgentSidebar.svelte` uses `agent.color` and `agent.avatar`.
    - Verify `MessageBubble.svelte` renders the V2 icons correctly.
- [ ] **UI Text Update**:
    - Change "Multi-Agent Orchestration" title to **"Cognitive Decision Tools"** (or V2 naming).
    - Update empty state / helper text to reflect "Tools" not "Chat".

### Phase 3: Cleanup (The Soul)
- [ ] **Deprecate Legacy Features**:
    - Remove `PersonaGenerator.ts` (if confirmed unused by V2).
    - Remove "Custom Agent" creation UI from `AgentSidebar` if it conflicts with the "Fixed Toolset" philosophy.

## 4. Verification Plan

### Automated/Manual Tests
1.  **System Prompt Check**: Verify `agent_decomposer` prompt contains "My job is to turn a mess into a numbered list".
2.  **Scenario Test (The "Decomposition" Flow)**:
    - Input: "I am overwhelmed by work and family."
    - Expected: `agent_decomposer` activates `skill_decompose`.
    - Output: A Markdown list of sub-problems (Emergency/Control tags).
3.  **UI Check**:
    - Decomposer avatar is Orange (#FF6B35).
    - Calculator avatar is Teal (#2EC4B6).
    - Markdown tables in `decision_matrix` render correctly.

## 5. Execution Order
1.  Refactor `SURVIVAL_PROMPTS.ts` (Strict copy-paste from Doc).
2.  Refactor `SkillService.ts` (Strict output format check).
3.  Deprecate `PersonaGenerator.ts` & Cleanup `agentStore` (Remove custom agent logic if strict).
4.  Update UI text and styling.
