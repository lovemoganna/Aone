# Diff Algorithms Guide

## 1. Myers Algorithm (Standard)

- **Default**: Git, `diff` command.
- **Goals**: Minimal edit script (LCS).
- **Cons**: Can get confused by large block moves (shows delete+insert instead of move).

## 2. Patience Diff (Better for Code)

- **Method**: Finds unique matching lines first, then fills gaps.
- **Pros**: Matches "human intuition" better. Recommended for refactors.

## 3. Histogram Diff

- **Method**: Variation of Patience, faster for large files.
- **Git Config**: `git config diff.algorithm histogram` (Highly Recommended).

## 4. Visual Styles

- **Unified**:
  ```diff
  - const a = 1;
  + const a = 2;
  ```
- **Side-by-Side**: Useful for manual merging.
