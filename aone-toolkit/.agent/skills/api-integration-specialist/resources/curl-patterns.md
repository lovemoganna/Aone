# cURL Integration Patterns

## 1. Basic GET

```bash
curl -X GET "https://api.example.com/users"
```

## 2. POST with JSON

```bash
curl -X POST "https://api.example.com/users" \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "role": "admin"}'
```

## 3. Authenticated Request

```bash
curl -X GET "https://api.example.com/secure" \
  -H "Authorization: Bearer <your-token>"
```

## 4. Verbose Output (Debugging)

Add `-v` or `-i`.

```bash
curl -v https://api.example.com/debug
# Shows request headers (User-Agent, Host) and full response (Status, Headers, Body)
```

## 5. Saving Output

- `-o file.json`: Save to file.
- `-O`: Save remote file with remote name.

```bash
curl -o response.json https://api.example.com/data
```
