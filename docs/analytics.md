# Event Tracking

[PostHog](https://posthog.com/) is used for event tracking and analytics. It's initialized in `src/application/posthog.tsx`.

## Initialization

`initPosthog()` creates the PostHog client at startup in `src/main.tsx`. If the environment variables are missing, postHog is gracefully disabled (the function returns `null`).

```ts
posthog.init(posthogKey, {
  api_host: posthogApiHost,
  ui_host: 'https://eu.posthog.com',
  capture_pageview: false,
  capture_pageleave: true,
  autocapture: false,
});
```

- **Auto-capture** is disabled — no automatic click or form tracking
- **Auto pageview** is disabled — page views are tracked manually (see below)
- **Page leave** is enabled — `$pageleave` events fire automatically

| Variable                | Purpose                        |
| ----------------------- | ------------------------------ |
| `VITE_POSTHOG_API_HOST` | PostHog API endpoint (proxied) |
| `VITE_POSTHOG_KEY`      | PostHog project API key        |

## Provider Architecture

PostHog is available at two levels:

1. **Router context** — the `posthog` instance is passed to TanStack Router's context, making it available in route loaders.
2. **React context** — a `PostHogProvider` wrapper (null-safe — renders children directly if PostHog is disabled) provides `usePostHog()` to components.

Direct imports from `posthog-js` and `posthog-js/react` are restricted via ESLint. All code should use the wrappers exported from `src/application/posthog.tsx`.

## Page view tracking

Since `capture_pageview` is disabled, page views are tracked manually via the `TrackPageViews` component, rendered in the router's `InnerWrap`:

```tsx
export function TrackPageViews() {
  const location = useLocation();
  const posthog = usePostHog();

  useEffect(() => {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
    });
  }, [location, posthog]);

  return null;
}
```

This fires a `$pageview` event on every SPA navigation.

## User identification

Users are identified in the `/_main` route's `beforeLoad` (after authentication):

```ts
posthog?.identify(user.id);

if (organization) {
  posthog?.group('segment_group', organization.id);
}
```

The group type `segment_group` associates all subsequent events with the current organization, allowing to configure feature flags based on organization properties. It's also updated when switching organizations (in `useSwitchOrganization`).

## Tracking custom events

The `useTrackEvent` hook returns a function to capture custom events:

```tsx
const trackEvent = useTrackEvent();

trackEvent('my_event', { some: 'payload' });
```

## Feature flags

Frontend feature flags are managed by PostHog, see [feature-flags.md](feature-flags.md) for details.
