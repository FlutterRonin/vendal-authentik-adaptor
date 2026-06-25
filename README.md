# vendal-authentik-adaptor

A lightweight Node.js bridge that connects [Authentik's SMS Authenticator stage](https://docs.goauthentik.io/add-secure-apps/flows-stages/stages/authenticator_sms/) to the [Vendel](https://github.com/JimScope/vendel) self-hosted SMS gateway.

## Why this exists

Authentik's Generic SMS provider and Vendel are incompatible out of the box:

|               | Authentik sends                    | Vendel expects              |
| ------------- | ---------------------------------- | --------------------------- |
| **Auth**      | `Authorization: Basic` or `Bearer` | `X-API-Key` header          |
| **Recipient** | `"To": "+123..."`                  | `"recipients": ["+123..."]` |
| **Message**   | `"Body": "token"`                  | `"body": "token"`           |

This adaptor sits between them, translating both.

```
Authentik  →  vendal-authentik-adaptor  →  Vendel
  POST /send                               POST /api/sms/send
  Basic auth        translate              X-API-Key auth
  From/To/Body   ─────────────────►    recipients[]/body
```

## Setup

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

| Variable           | Description                                                 |
| ------------------ | ----------------------------------------------------------- |
| `PORT`             | Port to listen on (default: `3000`)                         |
| `ADAPTOR_PASSWORD` | Password Authentik uses to authenticate with this adaptor   |
| `VENDEL_URL`       | Base URL of your Vendel instance, e.g. `http://vendel:8090` |
| `VENDEL_API_KEY`   | Your Vendel API key (starts with `vk_`)                     |
| `SMS_APP_NAME`     | App name shown at the start of the SMS message              |
| `SMS_APP_HASH`     | 11-character Android SMS Retriever hash (see below)         |

### 2. Run with Docker Compose

Add the adaptor to your existing stack. Make sure it shares the same Docker network as Authentik:

```bash
docker compose up -d
```

### 3. Configure Authentik

In your Authentik SMS Authenticator Setup stage:

| Field                | Value                                       |
| -------------------- | ------------------------------------------- |
| **Provider**         | Generic                                     |
| **External API URL** | `http://vendal-authentik-adaptor:3000/send` |
| **Auth Type**        | HTTP Basic                                  |
| **Username**         | anything (e.g. `authentik`)                 |
| **Password**         | your `ADAPTOR_PASSWORD` value               |

### 4. Test

```bash
curl -X POST http://localhost:3000/send \
  -u "authentik:your_adaptor_password" \
  -H "Content-Type: application/json" \
  -d '{"From": "+1111111111", "To": "+85512345678", "Body": "123456"}'
```

Expected response:

```json
{ "message_ids": ["abc123"], "status": "accepted" }
```

## SMS message format

The adaptor wraps the OTP in a message compatible with the [Android SMS Retriever API](https://developers.google.com/identity/sms-retriever/verify), enabling automatic code autofill in apps that use [`sms_autofill`](https://pub.dev/packages/sms_autofill) or similar packages.

The delivered SMS looks like:

```
One Digital: Your verification code is 123456
FA+9qCX9VSu
```

Rules enforced by the Android SMS Retriever API:
- Under 140 bytes
- Contains the one-time code
- Ends with the 11-character app hash on the last line

### Getting your app hash

In your Flutter app, call `SmsAutoFill().getAppSignature` once to retrieve the hash tied to your app's signing certificate:

```dart
final hash = await SmsAutoFill().getAppSignature;
print(hash); // e.g. "FA+9qCX9VSu"
```

Set the printed value as `SMS_APP_HASH` in your `.env`. Use the signing key that matches your production build (release keystore, not debug).

## Health check

```
GET /health  →  { "status": "ok" }
```

## Local development

```bash
cp .env.example .env   # fill in values
npm install
npm run dev            # uses --watch for auto-restart
```
