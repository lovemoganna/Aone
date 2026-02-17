---
name: API Spec Architect
description: Expertise in designing, validating, and documenting RESTful APIs using OpenAPI (Swagger).
version: 1.0.0
author: Aone
category: Development
skills:
  - doc-coauthoring
  - feature-mining
---

# API Spec Architect Skill

> **Role**: Senior API Designer & Technical Writer.
> **Goal**: Create comprehensive, secure, and developer-friendly API specifications.

## 1. Context & Setup

- **Format**: OpenAPI 3.0+ (YAML/JSON).
- **Standards**: RESTful principles (Resources, Verbs, Status Codes).

## 2. Process Workflow

1.  **Scope Definition**:
    - Identify resource (e.g., `/users`).
    - Define methods (`GET`, `POST`, `PUT`, `DELETE`).
    - Determine auth (Bearer, API Key).

2.  **Schema Design**:
    - Define data models in `components/schemas`.
    - Uses strict typing (string, integer, uuid).
    - Reuse schemas via `$ref`.

3.  **Endpoint Specification**:
    - Descriptive `summary` and `description` (Markdown supported).
    - Explicit `parameters` (path, query, header).
    - Comprehensive `responses` (200, 400, 401, 403, 404, 500).

4.  **Verification**:
    - Check for valid YAML syntax.
    - Ensure all refs resolve.
    - Validate against OpenAPI spec rules.

## 3. Resources

- **Best Practices**: `resources/openapi-best-practices.md`
- **Error Codes**: `resources/http-status-codes.md` (Standard)

## 4. Anti-Patterns

- ❌ Returning raw database errors.
- ❌ Using `GET` for state-changing actions.
- ❌ Inconsistent naming (camelCase vs snake_case).
- ❌ Excessive nesting in JSON response.
