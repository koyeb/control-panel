# Feature flags

The control panel uses feature flags to display things differently depending on conditions based on the state of the current user or organization. Flags are managed through [PostHog](analytics.md) and resolved as booleans.

## Flags configuration

PostHog is used to create and manage feature flags. Once the page loads, the PostHog client calls its `/decide` endpoint, which returns the flag configuration for the current user. Flags are `undefined` until this callback fires, and then resolve to `boolean` values.

Feature flags can be based on any property of a user or organization that is synchronized with PostHog. When a feature has a backend feature flag (stored in the organization), a corresponding feature flag is often created in PostHog based on the backend flag.

## Usage

All exports are in `src/hooks/feature-flag.ts`.

To retrieve the value of a feature flag, use the `useFeatureFlag` hook:

```ts
const enabled = useFeatureFlag('my-feature');
```

To render different components based on the value of a flag, use the `FeatureFlag` component:

```tsx
<FeatureFlag feature="my-feature" fallback={<>Flag is disabled</>}>
  <>Flag is enabled</>
</FeatureFlag>
```

The `useFeatureFlags` hook exposes the full flags API:

```ts
const flags = useFeatureFlags();

flags.listFlags(); // all PostHog flag names
flags.getValue('my-feature'); // [localOverride?, posthogValue?]
flags.isEnabled('my-feature'); // resolved boolean (local ?? posthog)
```

> To avoid unnecessary complexity, flag names are plain strings, not a template literal union type.

## Overriding flags

Local overrides take priority over PostHog values. The resolution order is: `localStorage` value ?? PostHog value.

Overrides can be set by calling `openDialog('FeatureFlags')` from the browser console. This opens a dialog listing all PostHog flags with enable/disable/reset buttons per flag, and bulk enable/disable/reset actions.
