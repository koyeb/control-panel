# Routing

## Overview

Routing uses [TanStack Router](https://tanstack.com/router) with file-based route discovery. Route files live in `src/routes/` and are automatically picked up by the `@tanstack/router-plugin/vite` plugin, which generates `src/route-tree.generated.ts`.

There is also a legacy `src/pages/` folder that contains page components from before the TanStack Router migration. These components are imported by route files in `src/routes/`. The two folders should eventually be merged.

## Route Structure

```
src/routes/
├── __root.tsx                          # Root route (layout, error boundary, devtools)
├── auth/                               # Public routes (signin, signup, signout)
├── account/                            # Account routes (OAuth callbacks, invitations)
├── organization/                       # Organization routes (deactivation)
└── _main/                              # Authenticated app routes (pathless layout)
    ├── route.tsx                        # Main layout with beforeLoad (auth, org, project)
    ├── index.tsx                        # Home page
    ├── services/                        # Services list, creation
    │   └── $serviceId/                  # Service detail (overview, metrics, settings, console)
    ├── database-services/               # Database services
    │   └── $databaseServiceId/          # Database detail (roles, databases, settings)
    ├── volumes/                         # Volumes and snapshots
    ├── domains.tsx                      # Custom domains
    ├── secrets.tsx                      # Secrets management
    ├── settings/                        # Organization settings (billing, plans, API, registry)
    ├── user.settings/                   # User settings (profile, API keys, organizations)
    ├── one-clicks/                      # One-click app catalog and deploy
    ├── deploy.tsx                       # Deploy from URL params
    ├── activity.tsx                     # Activity log
    └── team.tsx                         # Team management
```

The `_main` prefix makes it a **pathless layout route**: it doesn't add a segment to the URL but wraps all child routes with a shared layout and loader.

## Router Context

The root route defines a typed context that is available to all routes:

```tsx
type RouterContext = {
  queryClient: QueryClient; // React Query client for data fetching
  seon: SeonAdapter; // Fraud detection
  authKit: AuthKit; // WorkOS authentication
  posthog: PostHog | null; // Analytics
  translate: TranslateFn; // i18n translation function
  breadcrumb?: () => ReactNode; // Breadcrumb component for the current route
};
```

Routes can extend the context in `beforeLoad` to pass additional data to child routes. For example, `_main/route.tsx` adds `user`, `organization`, and `projectId` to the context.

## Data Fetching in Loaders (`loader`)

`loader` runs after `beforeLoad` and prefetches data into the React Query cache using `ensureApiQueryData`. This ensures data is available immediately when the component renders, avoiding loading spinners on navigation.

```tsx
async loader({ context: { queryClient }, params }) {
  const ensureApiQueryData = createEnsureApiQueryData(queryClient);

  await ensureApiQueryData('get /v1/services/{id}', {
    path: { id: params.serviceId },
  });
}
```

Loaders use `Promise.all` to fetch independent data in parallel.

## Main Route Loader (`_main/route.tsx`)

The `_main` route is the entry point for all authenticated pages. Its `beforeLoad` and `loader` handle the core app initialization:

**`beforeLoad` (blocking):**

1. Handles organization switching if `?organization-id=` is present
2. Fetches user profile and organization in parallel
3. Resolves the current project ID (from local storage or organization default, with 404 fallback)
4. Identifies the user in PostHog analytics
5. Returns `user`, `organization`, `projectId`, and `posthog` to the router context

**`loader` (non-blocking child rendering):**

1. Initializes Seon fraud detection
2. Preloads datacenter latencies (production only)
3. Fetches catalog data (regions, instances)
4. If the organization is active, fetches: organization summary, quotas, subscription, member list, project list

**Component rendering:**
The component checks for special states before rendering the main layout:

1. **Account locked** → Shows `AccountLocked` page
2. **Trial ended** → Shows `TrialEnded` page
3. **Onboarding incomplete** → Shows `OnboardingPage`
4. Otherwise → Renders `MainLayout` with `<Outlet />`

## Search Params Validation

Routes can validate and type search params using Zod schemas via `validateSearch`:

```tsx
import { z } from 'zod';

export const Route = createFileRoute('/_main/services/')({
  validateSearch: z.object({
    page: z.number().optional(),
  }),
});
```

Validated search params are accessible in the component via `useSearch()` with full type safety. The `deployParamsSchema` (in `src/application/deploy-params-schema.ts`) is a shared schema used across multiple routes for deployment-related query parameters.

## Code Splitting

The TanStack Router plugin is configured with `autoCodeSplitting: true`, which automatically code-splits each route into its own chunk. This means navigating to a route only loads the JavaScript needed for that route.

## Breadcrumbs

Breadcrumbs are built from the router's matched route chain. Each route can set a `breadcrumb` function in its `beforeLoad` that returns a React component:

```tsx
// src/routes/_main/services/index.tsx
beforeLoad: () => ({
  breadcrumb: () => <CrumbLink to={Route.to} />,
}),
```

The `AppBreadcrumbs` component in `src/layouts/main/app-breadcrumbs.tsx` collects all breadcrumb functions from the current route matches via `useRouterState`, deduplicates them, and renders them separated by chevron icons with a home link at the start.

The label rendered by the `CrumbLink` component is automatically computed from the value of `Route.to`, using the values of `layouts.main.breadcrumbs` from the translations file (`src/intl/en.json`). Keep in mind that these translations are not typesafe.

## Root Route

The root route (`__root.tsx`) provides:

- Global `ErrorComponent` and `NotFoundComponent` for error boundaries
- Closes open dialogs on navigation (`onBeforeNavigate`)
- Renders `NotificationContainer`, `ConfirmationDialog`, and devtools (Router + React Query)
