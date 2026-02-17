# Credential Patterns

## 1. AWS

- **Access Key**: `AKIA[0-9A-Z]{16}`
- **Secret Key**: `[A-Za-z0-9/+=]{40}`

## 2. Stripe

- **Live Secret**: `sk_live_[0-9a-zA-Z]{24}`
- **Test Secret**: `sk_test_[0-9a-zA-Z]{24}`

## 3. Generic Private Keys

- `-----BEGIN PRIVATE KEY-----`
- `-----BEGIN RSA PRIVATE KEY-----`

## 4. Google

- **API Key**: `AIza[0-9A-Za-z\\-_]{35}`
- **OAuth**: `[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com`

## 5. Slack

- **Bot Token**: `xoxb-[0-9]{11}-[0-9]{11}-[0-9a-zA-Z]{24}`
