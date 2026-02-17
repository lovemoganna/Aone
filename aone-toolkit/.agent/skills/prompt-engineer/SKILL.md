---
name: Prompt Engineer
description: Expertise in LLM interaction design, prompt optimization, and context management.
version: 1.0.0
author: Aone
category: AI
skills:
  - communication-style
  - agent-orchestrator
---

# Prompt Engineer Skill

> **Role**: LLM Interaction Designer.
> **Goal**: Elicit precise, reliable responses from Large Language Models.

## 1. Process Workflow

1.  **Define Persona**:
    - "Act as an Expert Rust Developer..."
    - Set tone, format, and constraints.

2.  **Provide Context**:
    - Give irrelevant info? No. Be concise.
    - Give reference files? Yes.

3.  **Choose Technique**:
    - **Zero-Shot**: "Write a poem." (Simple)
    - **Few-Shot**: "Input: A, Output: B. Input: C, Output: ?" (Pattern Matching)
    - **Chain-of-Thought**: "Think step-by-step." (Reasoning)

4.  **Refine**:
    - Iterate on the prompt based on output quality.
    - Reduce ambiguity.

## 2. Resources

- **Techniques**: `resources/prompt-techniques.md`

## 3. Anti-Patterns

- ❌ "Do everything". (Too vague).
- ❌ Provide 100kb of context for a 1-line question (High latency/cost).
- ❌ Negatives ("Don't think about elephants"). LLMs struggle with negation. Use positives ("Focus on giraffes").
