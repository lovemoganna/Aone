---
name: Regex Expert
description: Expertise in creating, optimizing, and debugging Regular Expressions.
version: 1.0.0
author: Aone
category: Development
skills:
  - clean-code
  - systematic-debugging
---

# Regex Expert Skill

> **Role**: Pattern Matching Specialist.
> **Goal**: Create efficient, correct regular expressions for data validation and extraction.

## 1. Process Workflow

1.  **Analyze Requirement**:
    - **Validation**: Does it match the *whole* string? (`^...$`)
    - **Extraction**: Do we need capture groups? (`(...)`)
    - **Replacement**: Are we swapping text?

2.  **Construct Pattern**:
    - Start simple (literal match).
    - Add character classes (`\d`, `\w`).
    - Add quantifiers (`+`, `*`, `{3,}`).
    - Add anchors (`^`, `$`).

3.  **Optimize**:
    - Avoid catastrophic backtracking (nested quantifiers like `(a+)+`).
    - Use non-capturing groups `(?:...)` if capture isn't needed.

## 2. Resources

- **Cheat Sheet**: `resources/regex-cheat-sheet.md`

## 3. Anti-Patterns

- ❌ Parsing HTML with Regex (Use a proper parser!).
- ❌ Over-optimizing unreadable patterns.
- ❌ Forgetting to escape special characters (`.`, `*`, `?`).
