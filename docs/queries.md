# React Query

How [TanStack React Query](https://tanstack.com/query) is configured and used in this project.

## Query Client Configuration

The `QueryClient` is created in `src/main.tsx` with custom `QueryCache`, `MutationCache`, retry logic, and `throwOnError` behavior.

### Global Error Handling (QueryCache)

The `QueryCache.onError` handler runs for every failed query:

- **`LoginRequiredError`** → redirects to `/auth/signin`
- **403 on organization** → redirects to `/auth/signout` (session expired or revoked)
- **Token rejected** → redirects to `/settings` (organization deactivated)
- **404** → clears the query data to avoid rendering stale results
- **429** → shows a rate limit toast
- **5xx** → shows an error toast and reports to Sentry
- **Other errors** → reports to Sentry and shows a toast (unless `showError: false` in query meta)

The `MutationCache.onError` handler shows a toast for mutations that don't define their own `onError`.

### Retry Logic

- Retries up to 4 times for most errors
- Fails immediately on 4xx errors (no point retrying client errors)
- Retries once for `LoginRequiredError` (token refresh)

### `throwOnError`

Queries with 5xx errors throw to the nearest error boundary instead of returning the error in `query.error`. This shows the global error page for server failures.

## Polling (`refetchInterval`)

Many queries poll for fresh data using `refetchInterval: refetchInterval()`. The `refetchInterval()` helper returns a function that polls every **5 seconds** normally, or **30 seconds** when rate-limited (429). This is the primary mechanism for keeping the UI in sync with backend state (deployment status, instance health, etc.).

```tsx
useQuery({
  ...apiQuery('get /v1/services/{id}', { path: { id } }),
  refetchInterval: refetchInterval(),
});
```

## Infinite Queries

Paginated endpoints use `useInfiniteQuery` with offset-based pagination:

```tsx
useInfiniteQuery({
  queryKey: getApiQueryKey('get /v1/deployments', { query: { service_id: serviceId } }),
  queryFn: ({ pageParam }) =>
    api('get /v1/deployments', {
      query: { limit: '10', offset: String(10 * pageParam) },
    }),
  initialPageParam: 0,
  getNextPageParam: (lastPage, pages, lastPageParam) => {
    const next = lastPageParam + 1;
    return next * lastPage.limit! >= lastPage.count! ? undefined : next;
  },
  select: ({ pages }) => pages.flatMap((page) => page.deployments!.map(mapDeployment)),
});
```
