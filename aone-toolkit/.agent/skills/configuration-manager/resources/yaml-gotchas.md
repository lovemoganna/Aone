# YAML Gotchas & Best Practices

## 1. The "Norway Problem" (YAML 1.1)

In YAML 1.1, the string `no` is parsed as a boolean `false`.

```yaml
# Problematic
countries:
  - gb
  - no # Parses as false!
  - se

# Solution: Always quote
countries:
  - 'gb'
  - 'no'
  - 'se'
```

## 2. Unquoted Version Numbers

```yaml
# Problematic
version: 1.10 # Parsed as number 1.1

# Solution: Always quote versions
version: "1.10"
```

## 3. Indentation: NO TABS

YAML strictly forbids tabs. Use 2 or 4 spaces consistently.

## 4. Multi-line Strings

- `|`: Literal (keeps newlines).
- `>`: Folded (replaces newlines with spaces).

```yaml
description: |
  This is a
  multi-line string.
```

## 5. Boolean Variants

In YAML 1.1, the following are all booleans:
- `y`, `Y`, `yes`, `Yes`, `YES`
- `n`, `N`, `no`, `No`, `NO`
- `true`, `false`, `on`, `off`

**Recommendation**: Use `true` or `false` only, and quote anything else that might be ambiguous.
