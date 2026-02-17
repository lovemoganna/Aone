# HTTP Headers Reference

## 1. Authentication

- **Authorization**: `Bearer <token>` / `Basic <base64>`
- **X-API-Key**: Custom key header.

## 2. Content Negotiation

- **Content-Type**: Sent data format.
  - `application/json` (REST)
  - `application/x-www-form-urlencoded` (Forms)
  - `multipart/form-data` (Uploads)
- **Accept**: Desired response format.
  - `application/json`
  - `text/html`
  - `*/*`

## 3. Caching & Performance

- **Cache-Control**: `no-cache`, `no-store`, `max-age=3600`.
- **User-Agent**: Client identifier.
- **Accept-Encoding**: `gzip`, `deflate`, `br` (Compression).

## 4. CORS (Browser)

- **Access-Control-Allow-Origin**: `*` or specific domain.
- **Access-Control-Allow-Methods**: `GET, POST, OPTIONS`.

## 5. Security

- **Strict-Transport-Security**: Force HTTPS.
- **Content-Security-Policy**: Prevent XSS.
