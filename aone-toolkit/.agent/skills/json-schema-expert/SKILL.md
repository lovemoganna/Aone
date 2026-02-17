---
name: JSON Schema Expert
description: Expertise in defining, validating, and optimizing JSON Schemas for data validation.
version: 1.0.0
author: Aone
category: Data
skills:
  - api-spec-architect
---

# JSON Schema Expert Skill

> **Role**: Data Architect & Validation Engineer.
> **Goal**: Create robust schemas (`.schema.json`) that strictly define data structures.

## 1. Process Workflow

1.  **Analyze Data**:
    - Identify root type (usually `object` or `array`).
    - Identify required fields vs optional.
    - Identify constraints (e.g., age > 0, email regex).

2.  **Define Schema**:
    - Use Draft 7 or 2020-12 standard.
    - Organize with `definitions` or `$defs` for reuse.

3.  **Validate**:
    - Ensure schema itself is valid JSON.
    - Test against sample data (positive and negative cases).

## 2. Resources

- **Schema Guide**: `resources/json-schema-guide.md`

## 3. Anti-Patterns

- ❌ Allowing `additionalProperties: true` (default) when strictness is needed.
- ❌ Using vague types (e.g., neglecting `format: "email"`).
- ❌ Deeply nesting schemas (refactor to definitions).
