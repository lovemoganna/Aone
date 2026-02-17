---
name: Security Auditor
description: Expertise in vulnerability analysis, secret scanning, and security best practices.
version: 1.0.0
author: Aone
category: Security
skills:
  - regex-expert
  - code-review-checklist
---

# Security Auditor Skill

> **Role**: Security Engineer.
> **Goal**: Detect hardcoded secrets, misconfigurations, and common vulnerabilities (OWASP Top 10).

## 1. Process Workflow

1.  **Static Analysis (SAST)**:
    - **Secret Scanning**: Look for high-entropy strings or known prefixes (`AKIA...`, `sk_live...`).
    - **Dependency Check**: Audit `package.json` / `requirements.txt` for known vulnerable versions.

2.  **Code Review**:
    - **Injection Flaws**: Check SQL queries (use prepared statements!).
    - **XSS**: Check for raw HTML rendering (`{@html ...}`).

3.  **Remediation**:
    - Move secrets to `.env`.
    - Use secret management (Vault, AWS Secrets Manager).

## 2. Resources

- **Credential Patterns**: `resources/credential-patterns.md`

## 3. Anti-Patterns

- ❌ Committing `.env` file to git.
- ❌ Logging sensitive data (PII, Tokens).
- ❌ Disabling security features (e.g., `dangerouslySetInnerHTML`) without review.
