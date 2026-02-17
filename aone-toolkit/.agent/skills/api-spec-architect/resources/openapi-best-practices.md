# OpenAPI Best Practices

## 1. Resource Naming

- **Use Nouns**: `/users` (correct) vs `/getUsers` (incorrect).
- **Use Plural**: `/services` (correct) vs `/service` (incorrect).
- **Use Nested**: `/users/{id}/posts` (for relationships).

## 2. HTTP Verbs

- `GET`: Retrieve data (Safe, Idempotent).
- `POST`: Create data (Unsafe, Non-idempotent).
- `PUT`: Update/Replace (Idempotent).
- `PATCH`: Partial update (Idempotent).
- `DELETE`: Remove data (Idempotent).

## 3. Status Codes

- **200 OK**: Success (GET, PUT as update).
- **201 Created**: Success (POST create).
- **204 No Content**: Success (DELETE).
- **400 Bad Request**: Validation error.
- **401 Unauthorized**: Authentication missing.
- **403 Forbidden**: Permission denied.
- **404 Not Found**: Resource missing.
- **500 Internal Error**: Oops.

## 4. Components & Schemas

- **Reuse**: Define `User` schema once in `components/schemas` and reference it `$ref: '#/components/schemas/User'`.
- **Validation**: Use `required`, `minLength`, `pattern`, `enum`.
- **Examples**: Always provide examples for developers to see.

```yaml
components:
  schemas:
    User:
      type: object
      required:
        - id
        - username
      properties:
        id:
          type: string
          format: uuid
        username:
          type: string
          minLength: 3
```
