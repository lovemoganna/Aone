# JSON Schema Cheat Sheet

## 1. Basic Types

- `string`, `number` (float), `integer`, `boolean`, `null`.
- `object`, `array`.

## 2. Object Constraints

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer", "minimum": 0 }
  },
  "required": ["name"],
  "additionalProperties": false
}
```

## 3. String Formats

- `format`: `date-time`, `email`, `hostname`, `ipv4`, `ipv6`, `uri`, `uuid`.
- `pattern`: Regex validation.
- `minLength` / `maxLength`.

## 4. Array Constraints

```json
{
  "type": "array",
  "items": { "type": "string" },
  "minItems": 1,
  "uniqueItems": true
}
```

## 5. Composition

- `allOf`: Must match all (AND).
- `anyOf`: Must match at least one (OR).
- `oneOf`: Must match exactly one (XOR).
- `not`: Must NOT match.
