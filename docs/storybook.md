# Storybook

The project uses [Storybook](https://storybook.js.org) 10 with the Vite framework (`@storybook/react-vite`). Storybook is used sporadically, for components that benefit from isolated development — complex interactive widgets, form controls, layout variations. Not every component has a story.

## Scripts

- `pnpm storybook` — `storybook dev --ci -p 6006`
- `pnpm build-storybook` — `storybook build`

## Configuration

### `.storybook/main.ts`

```ts
export default {
  stories: ['../src/**/*.stories.tsx'],
  addons: ['@vueless/storybook-dark-mode'],
  framework: '@storybook/react-vite',
} satisfies StorybookConfig;
```

The only addon is `@vueless/storybook-dark-mode`, which toggles a class on `<html>` for dark mode. Storybook 10 bundles essentials (controls, actions, viewport) by default.

### `.storybook/preview.tsx`

Two global decorators wrap every story:

1. **IntlProvider** — provides react-intl translations so stories can render translated text
2. **className wrapper** — if a story sets `parameters.className`, it's wrapped in a `<div>` with that class (useful for constraining width or adding borders)

The preview also imports `src/styles.css` and the Inter font, to render stories with production styling.

## Conventions

### Meta and exports

All story files use CSF3 with a default `Meta` export typed with `satisfies Meta`. Individual stories are named exports. Most use function components as stories:

```tsx
import type { Meta, StoryFn } from '@storybook/react-vite';

export default {
  title: 'modules/InstanceSelector',
} satisfies Meta;

export const instanceSelector: StoryFn = () => {
  const [selectedInstance, setSelectedInstance] = useState<string>();
  // ...
  return <InstanceSelector ... />;
};
```

### Mock data

Stories use the `create.*` factory functions from `src/utils/factories` to build realistic data structures, and API fixtures from `src/api/fixtures.ts` for catalog data:

```tsx
const deployment = create.computeDeployment({
  status: 'HEALTHY',
  definition: create.deploymentDefinition({ ... }),
});
```

### Parameters

Stories set `parameters.className` to constrain layout in the Storybook canvas:

```tsx
export default {
  title: 'components/Logs',
  parameters: { className: 'max-w-4xl' },
} satisfies Meta;
```
