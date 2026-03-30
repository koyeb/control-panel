# API Calls

How API calls are made, typed, and organized in this project.

## Architecture

```
src/api/
├── api.generated.d.ts   # Generated types from OpenAPI spec
├── api-types.ts         # Friendly type aliases for generated schemas
├── api.ts               # Low-level fetch client
├── api-error.ts         # ApiError class
├── query.ts             # React Query adapters
├── index.ts             # Re-exports, top level APIs
├── hooks/               # Domain-specific query hooks
└── mappers/             # API response → domain model transformers
```

## Generated Types

TypeScript types are generated from the Koyeb OpenAPI spec into `src/api/api.generated.d.ts`. Regenerate with:

```
pnpm api-codegen
```

The `API` namespace in `src/api/api-types.ts` re-exports schema types with friendly names:

```tsx
export namespace API {
  export type Service = components['schemas']['Service'];
  export type Deployment = components['schemas']['Deployment'];
}
```

## HTTP Client (`src/api/api.ts`)

The `api()` function takes a typed endpoint string and typed params:

```tsx
await api('get /v1/services/{id}', { path: { id } }, { token, baseUrl, signal });
await api('post /v1/services', { body: { ... } });
```

It's written with as little dependency as possible, to avoid coupling to third party tools or libraries.

- Endpoint strings like `'get /v1/services/{id}'` are fully typed — TypeScript infers the correct params and response types
- Path params are interpolated, query params are appended, body is JSON-serialized
- Auth token sent as `Authorization: Bearer <token>`
- Non-OK responses throw `ApiError`
- `apiStream()` opens WebSocket connections for streaming endpoints (logs, web terminal)

## Authentication

Auth tokens are injected automatically. `AuthKitProvider` sets `getAccessToken` in React Query's default `meta`, so all queries and mutations receive a fresh token without manual wiring. The `useApi()` hook provides an authenticated `api` function for use outside of React Query.

## Query Helpers (`src/api/query.ts`)

These bridge the HTTP client with React Query:

- **`apiQuery(endpoint, params)`** — Returns `{ queryKey, queryFn }` for `useQuery`. The query key is `[endpoint, params]`, enabling automatic deduplication and caching.
- **`apiMutation(endpoint, params)`** — Returns `{ mutationKey, mutationFn }` for `useMutation`. Params can be static or a function of mutation variables.
- **`createEnsureApiQueryData(queryClient)`** — For route loaders: fetches if not cached, returns cached otherwise.
- **`useInvalidateApiQuery()`** — Invalidates cached queries by endpoint and optional partial params.

## Making Queries

### Using `apiQuery` directly

For queries used in a single place, use `apiQuery` directly with `useQuery`:

```tsx
const { data } = useQuery({
  ...apiQuery('get /v1/domains', {
    query: { limit: '100' },
  }),
  select: ({ domains }) => domains!.map(mapDomain),
});
```

### Using domain hooks

For queries used in many places, domain hooks in `src/api/hooks/` wrap `apiQuery` with the correct params, mappers, and options. Convention:

- `use<Entity>Query(id)` — Returns the full React Query result (`data`, `error`, `isPending`, etc.)
- `use<Entity>(id)` — Returns just `.data` for convenience

```tsx
// In a component
const service = useService(serviceId);
```

## Making Mutations

Use `apiMutation` with `useMutation`:

```tsx
const mutation = useMutation({
  ...apiMutation('post /v1/services', (definition) => ({
    body: { definition },
  })),
  async onSuccess() {
    await invalidate('get /v1/services');
    notify.info('Service created');
  },
});
```

## Mappers (`src/api/mappers/`)

API responses use snake_case with all optional fields. Mapper functions transform them into camelCase domain models with required fields:

```tsx
export function mapService(service: API.Service): Service {
  return {
    ...snakeToCamelDeep(requiredDeep(service)),
    type: lowerCase(service.type as 'WEB' | 'WORKER'),
  };
}
```

## Cache Invalidation

Use `useInvalidateApiQuery()` to invalidate cached queries after mutations:

```tsx
const invalidate = useInvalidateApiQuery();

// Invalidate all services queries
await invalidate('get /v1/services');

// Invalidate a specific service
await invalidate('get /v1/services/{id}', { path: { id: serviceId } });
```

## ApiError (`src/api/api-error.ts`)

`ApiError` wraps failed API responses:

- `error.status` — HTTP status code
- `error.body` — Parsed `{ status, code, message }`
- `ApiError.is(error, status?)` — Type guard

## Prefetching in Route Loaders

Route loaders use `createEnsureApiQueryData` to prefetch data before the component renders:

```tsx
async loader({ context: { queryClient }, params }) {
  const api = createEnsureApiQueryData(queryClient);

  await api('get /v1/services/{id}', {
    path: { id: params.serviceId },
  });
}
```

This populates the React Query cache so `useServiceQuery(serviceId)` returns data immediately on mount, without a loading state.
