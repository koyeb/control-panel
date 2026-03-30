# Routing

## Overview

Routing uses [TanStack Router](https://tanstack.com/router) with file-based route discovery. Route files live in `src/routes/` and are automatically picked up by the `@tanstack/router-plugin/vite` plugin, which generates `src/route-tree.generated.ts`.

There is also a legacy `src/pages/` folder that contains page components from before TanStack Router. These components are imported by route files in `src/routes/`. The two folders should eventually be merged.

## Route Structure

```
src/routes/
├── __root.tsx                    # Root route (layout, error boundary, devtools)
├── auth/                         # Public routes (signin, signup, signout)
├── account/                      # Account routes (OAuth callbacks, invitations)
├── organization/                 # Organization routes (deactivation)
└── _main/                        # Authenticated app routes (pathless layout)
    ├── route.tsx                 # Main layout and loaders
    ├── index.tsx                 # Home page
    ├── services/                 # Services list, creation
    │   └── $serviceId/           # Service detail (overview, metrics, settings, console)
    ├── database-services/        # Database services
    │   └── $databaseServiceId/   # Database detail (roles, databases, settings)
    ├── settings/                 # Organization settings (billing, plans, API, registry)
    ├── user.settings/            # User settings (profile, API keys, organizations)
    ├── one-clicks/               # One-click app catalog and deploy
    ├── volumes/                  # Volumes and snapshots
    ├── activity.tsx              # Activity log
    ├── deploy.tsx                # Deploy from URL params
    ├── domains.tsx               # Custom domains
    ├── secrets.tsx               # Secrets management
    └── team.tsx                  # Team management
```

The `_main` prefix makes it a **pathless layout route**: it doesn't add a segment to the URL but wraps all child routes with a shared layout and loaders.

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

The main route (`_main/route.tsx`) adds `user`, `organization`, `projectId` and `posthog` to the context.

## Data Fetching in Loaders

`loader` runs after `beforeLoad` and prefetches data into the React Query cache using `ensureApiQueryData`. This ensures data is available immediately when the component renders, avoiding loading spinners on navigation. Loaders get called when a link is hovered, to preload the data of the target page.

```tsx
async loader({ context: { queryClient }, params }) {
  const ensureApiQueryData = createEnsureApiQueryData(queryClient);

  await ensureApiQueryData('get /v1/services/{id}', {
    path: { id: params.serviceId },
  });
}
```

Loaders use `Promise.all` to pre-fetch independent queries in parallel.

## Root Route

The root route (`__root.tsx`) provides:

- Global `ErrorComponent` and `NotFoundComponent` for error boundaries
- Closes open dialogs on navigation (`onBeforeNavigate`)
- Renders `NotificationContainer`, `ConfirmationDialog`, and devtools (Router + React Query)

## Breadcrumbs

Breadcrumbs are built from the router's matched route chain. Each route can set a `breadcrumb` function in its `beforeLoad` that returns a React component:

```tsx
// src/routes/_main/services/index.tsx
beforeLoad: () => ({
  breadcrumb: () => <CrumbLink to={Route.to} />,
}),
```

This is automatically handled by the `AppBreadcrumbs` component (`src/layouts/main/app-breadcrumbs.tsx`).

The label rendered by the `CrumbLink` component is automatically computed from the value of `Route.to`, using the values of `layouts.main.breadcrumbs` from the translations file (`src/intl/en.json`). These translations are not type safe.

## Code Splitting

The TanStack Router plugin is configured with `autoCodeSplitting: true`, which automatically code-splits each route into its own chunk. This means navigating to a route only loads the JavaScript needed for that route.
