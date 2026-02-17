# Aone AI Skill Specification Standard

> **Goal**: Establish a unified, reusable standard for defining AI Skills in the Aone project.
> **Location**: `.agent/skills/<skill-name>/SKILL.md`

Each skill directory MUST contain a `SKILL.md` file following this structure. This ensures the AI Agent can reliably "load" the skill and understand its capabilities, boundaries, and execution path.

---

## 1. Metadata (Frontmatter)

```yaml
---
name: [Skill Name, e.g., "PlantUML Expert"]
description: [One-line summary of what this skill does]
version: 1.0.0
author: [Author/Team]
category: [Development | Design | Architecture | QA]
tags: [tag1, tag2]
---
```

## 2. Role Definition

> **Role**: [Job Title Persona, e.g., "Senior Frontend Engineer"]
> **Goal**: [Clear, measurable objective, e.g., "Implement pixel-perfect UI components"]

Define *who* the AI becomes. This sets the tone, vocabulary, and priority of the agent.

## 3. Context & Knowledge (The "Why")

List necessary context or reference files the AI should read *before* acting.

- **Required Readings**: `resources/syntax-guide.md`
- **Configuration**: `resources/config.json`

## 4. Process Workflow (The "How")

A step-by-step Standard Operating Procedure (SOP). Use numbered lists.

1.  **Step 1: Input Analysis**
    - [Specific constraint to check]
2.  **Step 2: Execution**
    - [Specific tool to use]
    - [Formatting rule to follow]
3.  **Step 3: Self-Correction**
    - [Validation logic]

## 5. Constraints & Anti-Patterns (The "No")

Explicitly state what the AI must NOT do. This is often more important than what it *should* do.

- ❌ Do not use [Deprecated Library].
- ❌ Do not overwrite [Critical File].
- ⚠️ Warning: [Edge case].

## 6. Output Specification

Define exactly what the output looks like.

- **Format**: [Markdown | Code | JSON]
- **Location**: [Relative Path]
- **Example**:
  ```typescript
  // Example code structure
  ```

## 7. Execution Scripts (Optional)

List available CLI tools the agent can use to verify its work.

- `python scripts/validate.py`: Checks syntax.
- `npm run test:skill`: Runs specific tests.
