# Application Entrypoint & Initialization

The application initializes in `src/main.tsx` after running global side effects in `src/side-effects.ts`.

## Initialization Sequence

1. **Side Effects** (`src/side-effects.ts`) — Initializes Sentry and Intercom, handles Vite preload errors
2. **Fonts & Styles** — Loads Inter and JetBrains Mono fonts, imports global Tailwind CSS
3. **React Query** — Creates QueryClient with custom error handling: redirects on login errors, shows toasts on 5xx errors, retries up to 4 times
4. **Singleton Services** — Initializes Seon (fraud detection), PostHog (analytics), and translation function
5. **Router Setup** — Creates TanStack Router from `src/routes/`, passes context (`authKit`, `queryClient`, `posthog`, `translate`) to all routes
6. **Provider Stack** — Renders into `#root` with `AuthKitProvider` → `RouterProvider` → `PostHogProvider` → `IntlProvider` → `QueryClientProvider`
7. **Auth Guard** — Waits for WorkOS auth state to load before rendering, auto-injects access tokens into all API requests

## Key Points

- **Early error tracking** — Sentry initialized before React renders
- **Context without prop drilling** — Routes access auth, queries, analytics, i18n via typed router context
- **Auto-authenticated API calls** — AuthKit injects tokens into React Query's default request metadata
- **Automatic analytics** — Route changes tracked via `TrackPageViews` component
