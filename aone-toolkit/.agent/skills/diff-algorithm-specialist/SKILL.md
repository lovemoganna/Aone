---
name: Diff Algorithm Specialist
description: Expertise in computing and visualizing text differences using Myers algorithm and Unified Diff format.
version: 1.0.0
author: Aone
category: Engineering
skills:
  - clean-code
  - systematic-debugging
---

# Diff Specialist Skill

> **Role**: Code Analysis Engineer.
> **Goal**: Accurately detect and visualize changes between two text versions.

## 1. Process Workflow

1.  **Select Algorithm**:
    - **Line-by-Line (Myers)**: Standard `git diff`. Fastest.
    - **Character-Level**: Good for simple typos, noisy for code refactors.
    - **Semantic**: Language-aware diff (AST based).

2.  **Display Mode**:
    - **Unified**: Lines interleaved (`- old`, `+ new`).
    - **Split**: Side-by-side view.

3.  **Optimization**:
    - Ignore Whitespace (`-w`) if formatting changed.
    - Context Limits (`-U3`) to reduce noise.

## 2. Resources

- **Algorithms**: `resources/diff-algorithms.md`

## 3. Anti-Patterns

- ❌ Comparing binary files as text.
- ❌ Showing entire file when only 1 line changed (use context).
- ❌ Trusting client-side diff on huge files (performance freeze).
