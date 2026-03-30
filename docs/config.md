# Configuration

Configuration is managed in `src/application/config.ts`. The `getConfig(key)` function is the single access point for all config values.

All values come from environment variables. When possible, they should allow not being defined, to gracefully disable dependent features.

## Environment variables

| Key                  | Env var                      | Used by                           |
| -------------------- | ---------------------------- | --------------------------------- |
| `environment`        | `VITE_ENVIRONMENT`           | Sentry, PostHog, Seon, robots.txt |
| `version`            | `VITE_APP_VERSION`           | Sentry release, version.txt       |
| `apiBaseUrl`         | `VITE_API_URL`               | API client (`src/api/query.ts`)   |
| `websiteUrl`         | `VITE_WEBSITE_URL`           | One-click apps catalog            |
| `pageContextBaseUrl` | `VITE_PAGE_CONTEXT_BASE_URL` | External tooling                  |
| `recaptchaClientKey` | `VITE_RECAPTCHA_CLIENT_KEY`  | reCAPTCHA                         |
| `posthogApiHost`     | `VITE_POSTHOG_API_HOST`      | PostHog analytics                 |
| `posthogKey`         | `VITE_POSTHOG_KEY`           | PostHog analytics                 |
| `stripePublicKey`    | `VITE_STRIPE_PUBLIC_KEY`     | Stripe payments                   |
| `mapboxToken`        | `VITE_MAPBOX_TOKEN`          | Address autocomplete              |
| `intercomAppId`      | `VITE_INTERCOM_APP_ID`       | Intercom support widget           |
| `workOsApiHost`      | `VITE_WORK_OS_API_HOST`      | WorkOS AuthKit                    |
| `workOsClientId`     | `VITE_WORK_OS_CLIENT_ID`     | WorkOS AuthKit                    |
| `sentryDsn`          | `VITE_SENTRY_DSN`            | Sentry error tracking             |

> **Note**: Changing values in the `.env` file require to restart the dev server.

## Build-time usage

In `vite.config.ts`, two env vars are also used at build time:

- `VITE_ENVIRONMENT` — generates `robots.txt` (disallow all except in production)
- `VITE_APP_VERSION` — written to `version.txt` and set as the Sentry release name

## localStorage override

For convenience, values can be overridden by setting a JSON object in `localStorage` under the key `config`. Its content should be a partial object mapping config keys to the override.

Any issue parsing the local overrides are silently ignored.
