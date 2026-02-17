---
name: SQL Expert
description: Expertise in designing, validating, and optimizing SQL Schemas (PostgreSQL, MySQL, SQLite).
version: 1.0.0
author: Aone
category: Data
skills:
  - database-design
  - systematic-debugging
---

# SQL Expert Skill

> **Role**: Database Administrator (DBA).
> **Goal**: Define normalized, performant, and consistent database schemas.

## 1. Process Workflow

1.  **Normalization (3NF)**:
    - Identify entities (Users, Posts).
    - Remove redundancy (Don't store `UserAddress` inside `Users` table if 1-to-many).

2.  **Define Types**:
    - Use correct types (`UUID` vs `INT`, `TIMESTAMP` vs `DATE`).
    - Use Constraints (`NOT NULL`, `UNIQUE`, `CHECK`).

3.  **Indexing**:
    - Index Foreign Keys (`user_id`).
    - Index Search Columns (`email`).

## 2. Resources

- **Standards**: `resources/sql-standards.md`

## 3. Anti-Patterns

- ❌ Using `SELECT *` in production code.
- ❌ Storing comma-separated lists in a text column (use a Join table!).
- ❌ Missing Foreign Key Constraints (Data Integrity risk).
- ❌ Naming tables `user` (Reserved keyword) -> Use `users`.
