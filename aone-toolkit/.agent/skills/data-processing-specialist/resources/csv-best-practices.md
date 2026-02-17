# CSV Best Practices (RFC 4180)

## 1. Delimiters

- **Standard**: Comma `,`.
- **Alternative**: Tab `\t` (Good for free text).
- **Rule**: If a field contains the delimiter, enclose in `"quotes"`.

## 2. Quoting

- **Example**: `1, "Apple, Red", $1.00`.
- **Escaping**: If field has quotes, double them. `"She said ""Hello"""`.

## 3. Headers

- Always include a header row.
- Use `snake_case` for headers (`first_name` not `First Name`) for easier coding.

## 4. Encoding

- ALWAYS encode as **UTF-8**.
- Avoid BOM (Byte Order Mark) if possible (`EF BB BF`).
