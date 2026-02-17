# Regex Cheat Sheet

## 1. Character Classes

- `.`: Any character (except newline).
- `\d`: Digit (`[0-9]`). `\D`: Not Digit.
- `\w`: Word char (`[a-zA-Z0-9_]`). `\W`: Non-word.
- `\s`: Whitespace. `\S`: Non-whitespace.

## 2. Quantifiers

- `*`: 0 or more.
- `+`: 1 or more.
- `?`: 0 or 1.
- `{3}`: Exactly 3.
- `{3,}`: 3 or more.
- `{3,5}`: Between 3 and 5.

## 3. Anchors

- `^`: Start of line/string.
- `$`: End of line/string.
- `\b`: Word boundary.

## 4. Groups

- `(...)`: Capture group.
- `(?:...)`: Non-capturing group.
- `(?=...)`: Positive Lookahead.
- `(?!...)`: Negative Lookahead.

## 5. Common Patterns

- **Email**: `^[\w\.-]+@[\w\.-]+\.\w+$` (Basic)
- **URL**: `^https?://[\w\.-]+(?:/.*)?$`
- **Date (YYYY-MM-DD)**: `^\d{4}-\d{2}-\d{2}$`
