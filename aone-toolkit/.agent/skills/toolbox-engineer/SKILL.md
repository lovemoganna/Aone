---
name: Toolbox Engineer
description: Expertise in creating and using developer utilities (UUID, Base64, JWT, etc.).
version: 1.0.0
author: Aone
category: Engineering
skills:
  - security-auditor
---

# Toolbox Engineer Skill

> **Role**: Generalist Developer.
> **Goal**: Provide reliable, local-first utilities for common developer tasks without sending data to external servers.

## 1. Process Workflow

1.  **Identify Need**:
    - **Encoding**: Data conversion (Hex <-> Base64).
    - **Parsing**: Token inspection (JWT, URL params).
    - **Generation**: Random identifiers (UUID v4, ULID).

2.  **Select Tool**:
    - `atob()` / `btoa()` for Base64.
    - `crypto.randomUUID()` for UUIDs.
    - `JSON.parse()` for JSON beautify.

3.  **Execute**:
    - Ensure input sanitization (strip whitespace).
    - Handle invalid inputs gracefully (try-catch decoding).

## 2. Resources

- **Encoding Formats**: `resources/encoding-formats.md`

## 3. Anti-Patterns

- ❌ Sending JWTs or API keys to online "decoders" (Security Risk!).
- ❌ Using `Math.random()` for cryptographic UUIDs.
- ❌ Confusing URL Encoding (`%20`) with HTML Entities (`&nbsp;`).
