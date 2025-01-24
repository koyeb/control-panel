# Analytics

PostHog and Sentry are used to gather analytics on the usage of the product and report errors.

## User identification

Users are identified automatically after authenticating, both in PostHog and Sentry.

## Events

Page views are tracked automatically. To track custom events on posthog, use the `useTrackEvent` hook.

```tsx
const track = useTrackEvent();

// ...

<button onClick={() => track('my_event', { some: 'payload' })} />;
```

## Error reporting

Uncaught errors are reported to Sentry. It's also possible to report errors manually, using the `reportError`
function (a custom implementation, not to be confused with the built-in
[`window.reportError`](https://developer.mozilla.org/en-US/docs/Web/API/Window/reportError) function).
