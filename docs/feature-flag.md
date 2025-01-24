# Feature flags

The control panel uses feature flag to display things differently depending on conditions based on the state
of the current user or organization.

## Flags configuration

We leverage PostHog to create and manage feature flags. Once the page loads, the posthog client is
initialized, which calls an internal posthog URL (`/decide`) returning the configuration for the current user.
This configuration contains the value of the feature flags, that can then be accessed from the code.

Feature flags can be based on any property of a user or organization that is synchronized with PostHog. When a
feature has a backend feature flag (stored in the organization), we create a feature flag in posthog based on
the backend flag.

## Usage

To retrieve the value of a feature flag, use the `useFeatureFlag` hook.

```ts
const enabled = useFeatureFlag('my-feature');
```

To render different components based on the value of a flag, use the `FeatureFlag` component.

```tsx
<FeatureFlag flag="my-feature" fallback={<>Flag is disabled</>}>
  <>Flag is enabled</>
</FeatureFlag>
```

> To avoid unnecessary complexity, flags names are just string, not template literal union.

## Overriding flags

It's possible to override the value of a flag locally, using the local storage. The local storage item name
should be `feature-flags`, and its value is a `Record<string, boolean>`, the key being the name of the
flag.
