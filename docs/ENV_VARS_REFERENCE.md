# Environment Variables Reference

Last Updated: 2026-03-18
Status: Production Configuration

The following environment variables reflect the current Auth.js v5, Next.js 16, and Upstash-backed implementation.

## Authentication (Auth.js v5)

| Variable                            | Required           | Description                                        |
| ----------------------------------- | ------------------ | -------------------------------------------------- |
| `AUTH_SECRET`                       | Yes                | Secret used to encrypt session cookies and tokens. |
| `AUTH_GOOGLE_ID`                    | If using Google    | Google OAuth Client ID.                            |
| `AUTH_GOOGLE_SECRET`                | If using Google    | Google OAuth Client Secret.                        |
| `AUTH_MICROSOFT_ENTRA_ID_ID`        | If using Microsoft | Microsoft Entra ID Application (Client) ID.        |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET`    | If using Microsoft | Microsoft Entra ID Client Secret.                  |
| `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID` | If using Microsoft | Tenant ID, or `common` for multi-tenant.           |

Notes:

- Auth.js v5 prefers the `AUTH_*` prefix.
- `NEXTAUTH_SECRET` is still accepted by the code as a backward-compatible fallback, but it is no longer the recommended name.
- `NEXTAUTH_URL` is not required by the current App Router setup. Host detection is derived from request headers.

## Access Control

| Variable          | Required | Description                                                      |
| ----------------- | -------- | ---------------------------------------------------------------- |
| `PRO_USER_IDS`    | No       | Comma-separated internal user IDs that should be treated as Pro. |
| `PRO_USER_EMAILS` | No       | Comma-separated email addresses that should be treated as Pro.   |

Notes:

- Pro access is server-managed only.
- Client-side settings can no longer elevate a user to Pro.

## Storage (Upstash Redis)

| Variable                   | Required          | Description                       |
| -------------------------- | ----------------- | --------------------------------- |
| `UPSTASH_REDIS_REST_URL`   | Yes in production | REST API URL for Upstash Redis.   |
| `UPSTASH_REDIS_REST_TOKEN` | Yes in production | REST API token for Upstash Redis. |

Notes:

- Redis is mandatory in production. The app intentionally throws during startup if these variables are missing in production.
- Local development and test environments can still fall back to in-memory storage.
- `REDIS_URL` may exist in Vercel, but the app does not use it.

## App and Integrations

| Variable                        | Required | Description                                                                |
| ------------------------------- | -------- | -------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`           | Yes      | Public app base URL used for canonical links and client-side integrations. |
| `NEWS_API_BASE_URL`             | Yes      | Base URL for the external news provider API.                               |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | Optional | Google AdSense Publisher ID. Only used when ads are enabled for the user.  |

## Deprecated / Removed

These variables are no longer part of the recommended configuration:

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `KV_URL`
- `KV_REST_API_READ_ONLY_TOKEN`
- `KV_REST_API_TOKEN`
- `KV_REST_API_URL`
