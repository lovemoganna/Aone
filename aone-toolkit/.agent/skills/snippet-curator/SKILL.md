---
name: Snippet Curator
description: Expertise in managing, organizing, and documenting reusable code snippets.
version: 1.0.0
author: Aone
category: Engineering
skills:
  - doc-coauthoring
  - clean-code
---

# Snippet Curator Skill

> **Role**: Knowledge Manager & DevRel.
> **Goal**: Maintain a library of high-quality, reusable, and well-documented code blocks.

## 1. Process Workflow

1.  **Analyze Intention**:
    - **Language**: JS, Python, SQL?
    - **Purpose**: Helper function? Config template? API wrapper?

2.  **Enhance**:
    - Add **Comments** explaining *why* it works.
    - Add **Type Annotations** (strongly recommended).
    - Ensure **Self-Containment** (minimize external dependencies).

3.  **Tagging**:
    - Categorize by: `#util`, `#hook`, `#pattern`.

## 2. Resources

- **Documentation Guide**: `resources/documentation-best-practices.md`

## 3. Anti-Patterns

- ❌ "Magic Code": Snippet relies on global variables not shown.
- ❌ Outdated Syntax: e.g., using `var` in ES6+ snippets.
- ❌ Missing Imports: Function calls library without `import` statement.
