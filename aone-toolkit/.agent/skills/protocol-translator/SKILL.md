---
name: Protocol Translator
description: Expertise in translating HTTP requests between different formats (cURL, Python, JS, Go).
version: 1.0.0
author: Aone
category: Engineering
skills:
  - api-integration-specialist
---

# Protocol Translator Skill

> **Role**: Network Plumbing Engineer.
> **Goal**: Accurately translate HTTP requests across languages without losing headers or payload structure.

## 1. Process Workflow

1.  **Parse Input**:
    - Identify HTTP Method (`GET`, `POST`, `PUT`, `DELETE`).
    - Extract Target URL (`scheme://host/path?query`).
    - Collect Headers (`Authorization`, `Content-Type`).
    - Capture Body (`--data-raw`, `-d`).

2.  **Map to Target**:
    - **Python**: Use `requests` library.
    - **JavaScript**: Use `fetch()` API (Node 18+) or `axios`.
    - **Go**: Use `http.NewRequest`.

3.  **Generate Code**:
    - Ensure correct escaping of quotes.
    - Handle query string encoding properly.

## 2. Resources

- **Header Reference**: `resources/http-headers-ref.md`

## 3. Anti-Patterns

- ❌ Losing complex query parameters in translation.
- ❌ Hardcoding auth tokens in generated code (add comment `// Replace <TOKEN>`).
- ❌ Ignoring `--compressed` (Gzip handling).
- ❌ Using outdated libraries (e.g., Python `urllib2`).
