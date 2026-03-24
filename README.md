[Website](https://www.koyeb.com) | [Repository](https://github.com/koyeb/control-panel)

[![Code quality](https://github.com/koyeb/control-panel/actions/workflows/code_quality.yml/badge.svg)](https://github.com/koyeb/control-panel/actions/workflows/code_quality.yml)

# Koyeb Control Panel

Source code of the Koyeb control panel, accessible at [app.koyeb.com](https://app.koyeb.com).

The control panel is a [React](https://react.dev) application powered by [TypeScript](https://typescriptlang.org), [Vite](https://vite.dev) and [Tailwind CSS](https://tailwindcss.com). It uses [TanStack Router](https://tanstack.com/router) for routing, [TanStack Query](https://tanstack.com/query) for data fetching, and [WorkOS AuthKit](https://workos.com/docs/user-management/authkit) for authentication.

## Getting started

Prerequisites:

- [Node.js](https://nodejs.org) (we recommend [nvm](https://github.com/nvm-sh/nvm) to manage versions)
- [pnpm](https://pnpm.io) (`npm i -g pnpm`)

```sh
pnpm install
pnpm run dev
```

The dev server starts on [localhost:8000](http://localhost:8000).

<details>
  <summary>Minimal `.env` file</summary>

```sh
VITE_ENVIRONMENT=development
PROXY_API_URL=https://app.koyeb.com
VITE_WORK_OS_API_HOST=auth.koyeb.com
VITE_WORK_OS_CLIENT_ID=client_01JZ7TR12M399YV1D6XFHXP1K6
```

</details>

## Scripts

| Script             | Description                                |
| ------------------ | ------------------------------------------ |
| `pnpm dev`         | Start the Vite dev server                  |
| `pnpm build`       | Production build                           |
| `pnpm preview`     | Preview the production build locally       |
| `pnpm test`        | Run unit tests (Vitest)                    |
| `pnpm e2e`         | Run end-to-end tests (Playwright)          |
| `pnpm lint`        | Run ESLint with type-checked rules         |
| `pnpm storybook`   | Start Storybook on port 6006               |
| `pnpm api-codegen` | Regenerate API types from the OpenAPI spec |

## Documentation

### Architecture

- [Application Structure](./docs/app-structure.md)
- [Core Libraries](./docs/libraries.md)
- [Entrypoint / App Initialization](./docs/app-entrypoint.md)
- [Config / Environment Variables](./docs/config.md)
- [Data Model](./docs/data-model.md)

### UI

- [Routing](./docs/routing.md)
- [Styles / Design System](./docs/styles.md)
- [Form Handling / Validation](./docs/forms.md)
- [Toast Notifications](./docs/toasts.md)
- [Translations](./docs/translations.md)
- [Storage](./docs/storage.md)

### Data

- [Authentication](./docs/authentication.md)
- [Queries](./docs/queries.md)
- [API Calls](./docs/api-calls.md)

### Integrations

- [WorkOS](./docs/workos.md)
- [Stripe](./docs/stripe.md)
- [GitHub App](./docs/github-app.md)
- [Discourse / Canny SSO](./docs/sso.md)
- [Seon](./docs/seon.md)

### Observability

- [Error Handling / Reporting](./docs/error-handling.md)
- [Analytics / Event Tracking](./docs/analytics.md)
- [Feature Flags](./docs/feature-flags.md)

### Tooling

- [Build / Vite Plugins](./docs/build.md)
- [Type Checking / Linting](./docs/linting.md)
- [Tests](./docs/tests.md)
- [Storybook](./docs/storybook.md)
- [CI / CD](./docs/ci-cd.md)

## License

[Apache 2.0](./LICENSE)
