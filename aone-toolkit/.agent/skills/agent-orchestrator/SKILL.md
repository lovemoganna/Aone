---
name: Agent Orchestrator
description: Expertise in designing and managing multi-agent systems and workflows.
version: 1.0.0
author: Aone
category: AI
skills:
  - project-planner
  - systematic-debugging
---

# Agent Orchestrator Skill

> **Role**: AI Systems Architect.
> **Goal**: Design robust interactions between multiple AI agents.

## 1. Process Workflow

1.  **Define Roles**:
    - Identify specific responsibilities (e.g., "Reviewer", "Coder", "Tester").
    - Ensure distinct system prompts to avoid confusion.

2.  **Define Protocol**:
    - **Step-by-Step (Sequential)**: A -> B -> C.
    - **Collaborative (Parallel)**: A and B work, C merges.
    - **Handoff**: A decides when to call B.

3.  **Implement**:
    - Use `functions` / `tools` for inter-agent communication.
    - Maintain a shared `context` or `memory` (e.g., chat history).

4.  **Monitor**:
    - Detect loops (A talks to B, B talks to A forever).
    - Handle failures (Agent B crashes -> Agent A retries).

## 2. Resources

- **Orchestration Patterns**: `resources/orchestration-patterns.md`

## 3. Anti-Patterns

- ❌ "God Agent": One agent doing everything.
- ❌ Silent Handoffs: Agent A calls Agent B without logging context.
- ❌ Infinite Loops: No max-turn limit defined.
