# Tests

The project uses [Vitest](https://vitest.dev) for unit tests and [Playwright](https://playwright.dev) for end-to-end tests. The testing philosophy is pragmatic: test complex business logic, but don't test pure rendering. There are no React component render tests — all UI behavior testing is done at the E2E level with Playwright.

## Unit tests

Run with `pnpm test`. Vitest is configured inline in `vite.config.ts`. There are no setup files or coverage configuration. Mocks are automatically restored after each test via `restoreMocks: true`.

### What is tested

- **Utility functions** — every utility in `src/utils/` is tested since they are pure, easy to cover, and widely used.
- **Service form logic** — the most complex business logic in the app, with test files covering initialization, serialization, validation, parsing and mapping.
- **Domain logic** — business rules spread across the app (instance selector, github repository, service helper functions, etc.)
- **React hooks** — only when the hook contains significant logic worth testing in isolation

### Writing tests

Tests use `describe` / `it` (or `test`) blocks from Vitest. Most tests are pure function tests that call a function and assert the output:

```ts
import { describe, expect, test } from 'vitest';

describe('parseMemory', () => {
  test('parses megabytes', () => {
    expect(parseMemory('512MB')).toEqual({ value: 512, unit: 'MB' });
  });
});
```

Parameterized tests use `test.each`:

```ts
test.each([
  ['512MB', { value: 512, unit: 'MB' }],
  ['2GB', { value: 2048, unit: 'MB' }],
])('parseMemory(%s)', (input, expected) => {
  expect(parseMemory(input)).toEqual(expected);
});
```

### Type-level tests

Vitest's `expectTypeOf` is used to test that type-level utilities produce correct output types (no runtime assertions):

```ts
import { expectTypeOf } from 'vitest';

expectTypeOf<SnakeToCamelCase<'my_string'>>().toEqualTypeOf<'myString'>();
expectTypeOf<SnakeToCamelCase<'a_b_c'>>().toEqualTypeOf<'aBC'>();
```

### Mocking

- `vi.fn()` — Mocking callbacks and predicates
- `vi.mock('module', () => ({...}))` — Module-level mocking (used sparingly)
- `vi.stubEnv('KEY', 'value')` — Environment variable stubbing
- `vi.useFakeTimers()` / `vi.runAllTimers()` — Timer control

### Test data

Two factory systems allow to build test data from partial values:

- **`create.*`** in `src/utils/factories.ts` — domain model factories (`create.service()`, `create.instance()`, `create.computeDeployment()`, etc.) that return mapped domain objects
- **`createApi*`** in `src/api/fixtures.ts` — raw API response factories (`createApiOrganization()`, `createApiDeploymentDefinition()`, etc.) that return API-shaped data

Both use a shallow merge pattern where defaults can be overridden. Tests must declare all relevant properties, even if they match the default ones:

```ts
const deployment = create.computeDeployment({
  status: 'HEALTHY',
  definition: create.deploymentDefinition({ type: 'WEB' }),
});
```

### Components and hook tests

React components and hooks can be tested using `@testing-library/react`. When the system under test requires providers, they are passed as a wrapper:

```ts
const { result } = renderHook(() => useLogs(params), {
  wrapper: ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <Suspense>{children}</Suspense>
    </QueryClientProvider>
  ),
});
```

## End-to-end tests

Run with `pnpm e2e`. Playwright is configured in `playwright.config.ts` to run against a live environment (defaults to `https://staging.koyeb.com`). Only Chromium is enabled.

One-click app tests are separated from the rest via `grep` / `grepInvert` on the pattern `/one-click-apps/`, toggled by the `ONE_CLICK_APP` env var. These tests have extended timeouts (20 min per test, 6 hour global).

> **Note**: E2E tests may be outdated as the UI evolves — they run against staging and are not part of the standard CI pipeline (triggered manually or via a separate workflow).

### Test files

| File                             | Coverage                                                     |
| -------------------------------- | ------------------------------------------------------------ |
| `tests/authentication.spec.ts`   | Login, logout, redirects, GitHub SSO, organization switching |
| `tests/github-app.spec.ts`       | GitHub app install/uninstall flow                            |
| `tests/service-creation.spec.ts` | Creating services from GitHub and Docker sources             |
| `tests/service-form.spec.ts`     | Scaling form UI (instances, targets, volumes)                |
| `tests/one-click-apps.spec.ts`   | Deploying one-click apps and waiting for healthy status      |

### Utilities

`tests/test-utils.ts` provides helpers for E2E tests:

- `authenticate(page)` — injects an access token into localStorage (outdated with WorkOS)
- `authenticateOnGithub(context)` — full GitHub OAuth flow with TOTP
- `api(endpoint, params)` — typed REST API client with retry on 429
- `deleteAllApps()` — cleanup helper for teardown
- `catchNewPage(context, fn)` — captures a new browser window opened during an action
