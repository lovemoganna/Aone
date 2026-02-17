# Encoding & Identifier Formats

## 1. Base64 (`SGVsbG8=`)
- **Use**: Binary data in text (Images, JWTs).
- **Padding**: `=` usually means alignment.
- **URL Safe**: Replace `+` with `-` and `/` with `_`.

## 2. Hex / Base16 (`48656c6c6f`)
- **Use**: Colors (`#FF0000`), Hashes (SHA-256).
- **Format**: 0-9, A-F.

## 3. URL Encoding (`%20`)
- **Use**: Passing data in Query Params.
- **Reserved**: `&`, `?`, `=`, `/`.

## 4. UUID / ULID (`123e4567-e89b...`)
- **Use**: Database Primary Keys.
- **v4**: Random (most common).
- **v7**: Time-ordered (better for DB indexing).

## 5. JWT (JSON Web Token)
- **Structure**: `Head.Body.Signature`.
- **Payload**: Base64 encoded JSON. **Not Encrypted!** (Readable by anyone).
