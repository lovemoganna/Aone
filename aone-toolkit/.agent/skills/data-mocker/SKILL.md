---
name: Data Mocker
description: Expertise in generating realistic mock data (JSON/CSV) for testing and development.
version: 1.0.0
author: Aone
category: QA
skills:
  - json-schema-expert
---

# Data Mocker Skill

> **Role**: Test Data Engineer.
> **Goal**: Generate realistic, statistically varied datasets.

## 1. Process Workflow

1.  **Analyze Schema**:
    - Identify field type (Name, Address, Date).
    - Identify required variety (Corner cases: nulls, long strings).

2.  **Generate Strategy**:
    - **Faker.js / Faker (Python)**: Use library methods (`faker.name()`, `faker.email()`).
    - **Custom Logic**: Generate dependent data (Start Date < End Date).

3.  **Format Output**:
    - Ensure strict JSON compliance.
    - Pretty print for readability, Minify for size.

## 2. Resources

- **Faker Patterns**: `resources/faker-patterns.md`

## 3. Anti-Patterns

- ❌ Using "Test User 1", "Test User 2" (unrealistic).
- ❌ Generating PII (Personally Identifiable Information) that looks real but isn't mocked (e.g., real phone numbers). Ensure it's scoped to mock ranges (555-xxxx).
- ❌ Generating perfectly clean data (misses edge cases).
