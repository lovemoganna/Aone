---
name: Data Processing Specialist
description: Expertise in cleaning, transforming, and validating tabular data (CSV, TSV, Excel).
version: 1.0.0
author: Aone
category: Data
skills:
  - json-schema-expert
  - python-patterns
---

# Data Processing Specialist Skill

> **Role**: Data Quality Engineer.
> **Goal**: Ensure tabular data is clean, consistent, and machine-readable.

## 1. Process Workflow

1.  **Ingestion**:
    - **Encoding**: Is it UTF-8 or Latin-1? (Check BOM).
    - **Delimiter**: Comma `,`, Tab `\t`, or Semicolon `;`?

2.  **Validation**:
    - **Header Row**: Does row 1 contain labels?
    - **Shape**: Do all rows have N columns?
    - **Types**: Is 'Age' always numeric?

3.  **Cleaning**:
    - Trim whitespace (`" John "` -> `"John"`).
    - Null handling (`NULL`, `N/A`, `-` -> standardized empty).

## 2. Resources

- **CSV Best Practices**: `resources/csv-best-practices.md`

## 3. Anti-Patterns

- ❌ Using commas inside CSV fields without quotes (`"New York, NY"`).
- ❌ Mixing date formats (`MM/DD/YYYY` vs `YYYY-MM-DD`).
- ❌ Assuming Excel exports are valid CSVs (often not).
