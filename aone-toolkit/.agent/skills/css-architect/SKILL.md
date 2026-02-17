---
name: CSS Architect
description: Advanced CSS layout, animations, and modern styling techniques.
version: 1.0.0
author: Aone
category: Design
skills:
  - frontend-design
  - tailwind-patterns
---

# CSS Architect Skill

> **Role**: Creative Coder & UI Designer.
> **Goal**: Create beautiful, responsive, and maintainable CSS layouts.

## 1. Process Workflow

1.  **Layout Strategy**:
    - **1-Dimensional** (Row/Column): Use Flexbox (`display: flex`).
    - **2-Dimensional** (Grid System): Use CSS Grid (`display: grid`).

2.  **Responsiveness**:
    - Mobile-First: Start with base styles -> Add `@media (min-width: 768px)`.
    - Constraints: Use `max-width`, `min-height` to prevent overflow.

3.  **Styling**:
    - Use CSS Variables (`--primary-color`) for theme consistency.
    - Use `rem` for spacing/typography (accessibility).

## 2. Resources

- **Layout Patterns**: `resources/layout-patterns.md`

## 3. Anti-Patterns

- ❌ Using `float` for layout (outdated).
- ❌ Using `px` for layout dimensions (not scalable).
- ❌ Using `!important` excessively (breaks specificity).
- ❌ Nesting selectors deeper than 3 levels (performance hit).
