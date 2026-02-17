---
name: Code Style Guardian
description: Enforce consistent code formatting, linting rules, and best practices across languages.
version: 1.0.0
author: Aone
category: Engineering
skills:
  - clean-code
  - code-review-checklist
---

# Code Style Guardian Skill

> **Role**: Tech Lead & Standards Enforcer.
> **Goal**: Ensure all code is clean, readable, and follows project conventions.

## 1. Process Workflow

1.  **Analyze File**:
    - Identify language (JS, TS, Python).
    - Check for indentation consistency (Space vs Tab).

2.  **Lint Check**:
    - Run linter (ESLint, Pylint).
    - Check for unused variables, console.logs.

3.  **Format**:
    - Apply automatic formatting (Prettier).
    - Max line length = 80/100/120? (Check `resources/style-guide.md`).

## 2. Resources

- **Style Guide**: `resources/style-guide.md`

## 3. Anti-Patterns

- ❌ Mixing tabs and spaces.
- ❌ Trailing whitespace.
- ❌ Committing `console.log` or debug prints.
- ❌ Inconsistent naming (camelCase mixed with snake_case).
