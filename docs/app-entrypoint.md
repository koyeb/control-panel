# Application Entrypoint & Initialization

The application starts in `src/main.tsx`, which runs global side effects, creates singleton instances, and mounts the React app to the `#root` DOM element.

## Side effects

### `src/side-effects.ts` (imported first)

- Initializes **Sentry** error reporting
- Initializes **Intercom** chat widget
- Polyfills `globalThis` for environments where it's missing
- Handles **Vite preload errors** by reloading the page (prevents stale-chunk failures after deploys)
- Patches `Node.prototype.removeChild` and `Node.prototype.insertBefore` to suppress a [known React DOM issue](https://github.com/facebook/react/issues/11538) where browser extensions modify the DOM tree

### `index.html` inline script

Runs a synchronous script (before React mounts) to set the current theme mode to the document element (`<html>`) as soon as possible.

## Singleton instances

Created once in `src/main.tsx` and shared via the router context:

- **`queryClient`** — React Query client with custom caches and error handling ([queries docs](./queries.md))
- **`seon`** — Seon adapter
- **`posthog`** — PostHog analytics client
- **`translate`** — i18n translation function

## Router configuration

The TanStack Router is created with:

- **`defaultPreload: 'intent'`** — preloads route data on hover/focus
- **`defaultPreloadStaleTime: 0`** — always re-fetches on preload
- **`scrollRestoration: true`** — restores scroll position on navigation
- **`defaultOnCatch: reportError`** — reports uncaught route errors to Sentry
- **Search params** parsed/stringified with `query-string` (not the default URLSearchParams)

## Main `_main` route

`src/routes/_main/route.tsx` is a **pathless layout route** that wraps all authenticated pages.

### `beforeLoad` (blocking — children don't render until complete)

1. Handles **organization switching** if `?organization-id=` is present (switches via AuthKit, then redirects to strip the param)
2. Fetches **user profile** and **organization** in parallel
3. Resolves the **current project ID**: reads from local storage, falls back to the organization's default project, and recovers from a 404 by resetting to the default
4. Identifies the user in third party tools
5. Returns `user`, `organization`, `projectId`, and `posthog` to the router context

### `loader` (non-blocking — children can render while loading)

1. Initializes **Seon** (send seon-fp)
2. Preloads **datacenter latencies** (only in production)
3. Fetches **catalog data**: regions and instances
4. If the organization is active, also fetches related resources

### Component rendering

The component checks for special states in priority order before rendering the normal layout:

1. **Account locked** → `AccountLocked` page
2. **Trial ended** → `TrialEnded` page
3. **Onboarding incomplete** → `OnboardingPage` (with the current onboarding step)
4. **Normal** → `MainLayout` with `<Outlet />`
