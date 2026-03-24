# Error handling

## Sentry

Sentry is initialized in `src/application/sentry.ts`, called eagerly via `src/side-effects.ts` (imported at the top of `src/main.tsx`).

Session replays are not captured normally, but are always captured when an error occurs (`replaysOnErrorSampleRate: 1`). Network errors are ignored globally since they are not actionable.

Some errors are expected to be thrown, and have custom handling in `beforeSend`:

- `LoginRequiredError` — Dropped — expected during auth flows
- `ApiError` with status < 500: Dropped — client errors (4xx) are not reported

Any error can be reported to Sentry using the `reportError` helper function, a thin wrapper around `Sentry.captureException`. It accepts an optional `payload` for extra context.

## Route Error Boundaries

The root route (`src/routes/__root.tsx`) defines an `errorComponent` and a `notFoundComponent`, both rendered by `ErrorView` in `src/components/error-view.tsx`.

The router is also configured with `defaultOnCatch: reportError`, so every error caught by any TanStack Router error boundary is automatically reported to Sentry.

The route error boundary handles errors based on their type:

| Error type           | Behavior                                                 |
| -------------------- | -------------------------------------------------------- |
| `ApiError` 401       | Shows `<LogoLoading />` (waiting for auth redirect)      |
| Account locked (403) | Shows `<AccountLocked />` (identity verification prompt) |
| All other errors     | Shows `<ErrorView />` (fallback page with error details) |

`ErrorView` shows the HTTP status code, error message, a link to [status.koyeb.com](https://status.koyeb.com), and the API error code. Stack traces are only shown in development. A "Go to Dashboard" button resets the error boundary.

## `ApiError`

`ApiError` (in `src/api/api-error.ts`) is the error class for all API failures. It's thrown by the core `api()` fetch function when the response is not OK.

```ts
class ApiError extends Error {
  readonly response: Response;
  readonly body: { status: number; code: string; message: string };
  get status(): number;
}
```

If the API returns a body that doesn't match the expected `{ status, code, message }` schema, the constructor throws an `UnexpectedError` instead.

Rate-limited (429) responses get a synthetic body since these responses typically have no JSON body.

## `UnexpectedError`

`UnexpectedError` (in `src/application/errors.ts`) is used when any unexpected error happens, such as an unknown API error, or for unparseable WebSocket data. It carries a `details` record for extra context, attached to Sentry error reports.

## Query and Mutation Error Handling

The `QueryCache`'s `onError` handler (`src/main.tsx`) processes all query failures. Queries can set `meta: { showError: false }` to suppress the automatic error toast.

1. `AbortError` — ignored (cancelled requests)
2. `LoginRequiredError` — redirects to `/auth/signin` (see [authentication.md](authentication.md))
3. 403 on the organization query — redirects to `/auth/signout` (when a member was removed from an organization)
4. `"Token rejected"` — redirects to `/settings` (organization deactivated)
5. 404 — clears the query data to avoid rendering stale results
6. 429 — shows an error toast
7. 5xx and non-API errors — shows an error toast and reports to Sentry

The `MutationCache`'s `onError` handler (`src/main.tsx`) shows an error toast for failed mutations, as a default error handling behavior. If the mutation defines its own `onError` callback or sets `meta: { showError: false }`, the toast is not displayed and the mutation is expected to provide a custom error handling mechanism.

For form mutations, errors are handled by `useFormErrorHandler` which maps API validation errors to form fields. See [forms.md](forms.md#error-handling) for details.

### `throwOnError`

5xx errors are configured to throw to the nearest error boundary via the default `throwOnError` option:

```ts
function throwOnError(error: Error) {
  return ApiError.is(error) && error.status >= 500;
}
```

### Retry Logic

Retry behavior is set globally on the `QueryClient`:

- `LoginRequiredError` — retried once (to allow a silent token refresh)
- 4xx errors — never retried
- Other errors — retried up to 4 times

### Rate-Limit Backoff

The `refetchInterval` helper (`src/api/query.ts`) slows polling from 5 seconds to 30 seconds when a query is rate-limited (429). These values can be customized with optional parameters.

## Inline error display

`QueryError` (`src/components/query-error.tsx`) renders an inline error `Alert` when a query fails but the page should still render. It's typically used through the `QueryGuard` component:

```tsx
<QueryGuard query={serviceQuery}>{(service) => <ServiceDetails service={service} />}</QueryGuard>
```

`QueryGuard` shows a loading spinner while the query is pending, a `QueryError` if it failed, and renders the children with the data on success.
