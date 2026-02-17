# Standard Code Style Guide

## 1. General Rules

- **Indentation**: 4 spaces (or 2 for XML/HTML/JSON if preferred, but be consistent within file).
- **Line Endings**: LF (Unix style).
- **Encoding**: UTF-8.
- **Trailing Whitespace**: Remove it.

## 2. Naming Conventions

- **Variables/Functions**: `camelCase` (e.g., `userProfile`, `checkAuth()`).
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`).
- **Classes/Types**: `PascalCase` (e.g., `UserService`, `UserInterface`).
- **Booleans**: Prefix with `is`, `has`, `should` (e.g., `isActive`).

## 3. Comments

- **Why, not What**: Don't explain syntax ("Loops 10 times"), explain logic ("Wait for API consistency").
- **TODOs**: Include owner if possible `// TODO(Alice): Refactor`.
