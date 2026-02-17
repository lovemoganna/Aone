---
name: API Integration Specialist
description: Expertise in consuming, testing, and debugging APIs using cURL, Postman, and code integrations.
version: 1.0.0
author: Aone
category: Development
skills:
  - api-patterns
  - systematic-debugging
---

# API Integration Specialist Skill

> **Role**: Client Developer & QA Engineer.
> **Goal**: Ensure seamless communication with external APIs.

## 1. Process Workflow

1.  **Analyze Request**:
    - Identify method (`GET`, `POST`).
    - Identify headers (`Content-Type`, `Authorization`).
    - Identify payload (`JSON`, `Form Data`).

2.  **Construct Request**:
    - Use cURL for quick testing (terminal).
    - Use `fetch` (JS) or `requests` (Python) for code.

3.  **Execute & Debug**:
    - Check HTTP Status (2xx vs 4xx/5xx).
    - Analyze `Response Body`.
    - Check CORS errors (browser) or Network errors (server).

## 2. Resources

- **cURL Guide**: `resources/curl-patterns.md`

## 3. Anti-Patterns

- ❌ Hardcoding secrets (API keys) in client code.
- ❌ Ignoring error handling (only coding for 200 OK).
- ❌ Sending huge payloads without pagination.
- ❌ Trusting client-side validation alone.
