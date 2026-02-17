---
name: Configuration Manager
description: Expertise in managing YAML, TOML, and ENV configuration files for deployments.
version: 1.0.0
author: Aone
category: DevOps
skills:
  - json-schema-expert
  - bash-linux
---

# Configuration Manager Skill

> **Role**: DevOps Engineer.
> **Goal**: Ensure configuration is type-safe, validated, and secure.

## 1. Process Workflow

1.  **Structure**:
    - Use YAML for hierarchical config (K8s, CI/CD).
    - Use ENV for secrets (12-Factor App).

2.  **Safety**:
    - Always quote strings if they contain special characters (`:`, `#`, `*`).
    - Be careful with Booleans (`on`, `off`, `yes`, `no` - deprecated in YAML 1.2 but still supported by some parsers).

3.  **Validation**:
    - Use JSON Schema to validate YAML (since YAML converts to JSON).

## 2. Resources

- **YAML Gotchas**: `resources/yaml-gotchas.md`

## 3. Anti-Patterns

- ❌ Using Tabs for indentation (YAML forbids it!).
- ❌ Unquoted strings that look like numbers (`ver: 1.10` parsed as `1.1`).
- ❌ Putting secrets directly in `config.yaml`.
