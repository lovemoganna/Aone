# SQL Standards

## 1. Naming Conventions

- **Tables**: Plural, `snake_case` (e.g., `users`, `order_items`).
- **Columns**: Singular, `snake_case` (e.g., `created_at`, `is_active`).
- **Keys**: `id` (PK), `user_id` (FK to users).

## 2. DataTypes (PostgreSQL Preference)

- **ID**: `UUID` or `BIGINT`.
- **Text**: `TEXT` (No arbitrary `VARCHAR(255)` unless constrained).
- **Time**: `TIMESTAMPTZ` (Always use timezone!).
- **JSON**: `JSONB` (Binary json for indexing support).

## 3. Constraints

- always use `NOT NULL` by default.
- use `DEFAULT` values carefully.
- define `PRIMARY KEY` explicitly.

## 4. Query Performance

- **Index**: Create `INDEX idx_users_email ON users(email);`
- **Join**: Prefer `INNER JOIN` over `LEFT JOIN` where possible (strict data).
- **Limit**: Always `LIMIT` results on user-facing queries.
