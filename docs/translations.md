# Translations

The app uses [react-intl](https://formatjs.io/docs/react-intl/) for internationalization. Only English is supported. All translations live in `src/intl/en.json`.

## Translation file

`src/intl/en.json` is a nested JSON object. Keys use dot-separated paths when flattened (e.g. `common.cancel`, `pages.sandbox.list.noSandboxes.step1.title`). The `IntlProvider` in `src/intl/translation-provider.tsx` flattens the object at startup and passes it to react-intl.

Messages support ICU syntax for interpolation (`{name}`), plurals (`{count, plural, =1 {item} other {items}}`), and rich text tags (`<strong>bold</strong>`).

## Local translation component

Some file create a local `T` component scoped to a key prefix using `createTranslate`:

```tsx
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.sandbox.list.noSandboxes');
```

`T` is then used as a React component. The `id` prop is relative to the prefix:

```tsx
<T id="step1.title" />
<T id="step1.line1" values={{ language }} />
```

These resolve to `pages.sandbox.list.noSandboxes.step1.title` and `pages.sandbox.list.noSandboxes.step1.line1`.

When a plain string is needed (e.g. for an attribute or a variable), use `T.useTranslate()`:

```tsx
const t = T.useTranslate();
const label = t('name'); // returns a string
```

## Common rich text tags

`createTranslate` registers shared rich text values available in all messages without passing them explicitly:

- `<br>` — line break
- `<strong>` — bold
- `<code>` — inline code
- `<dim>` — muted text (`text-dim`)
- `<upgrade>` — link to `/settings/plans`

## `Translate` component and `useTranslate` hook

For one-off translations without a prefix, use the `Translate` component or `useTranslate` hook from `src/intl/translate`:

```tsx
import { Translate, useTranslate } from 'src/intl/translate';

<Translate id="common.cancel" />;

const translate = useTranslate();
translate('common.cancel'); // string
```

These require fully qualified keys.

## `TranslateEnum`

Enums are translated via dedicated keys under the `enums` namespace in `en.json`:

```tsx
<TranslateEnum enum="instanceCategory" value="gpu" />
// resolves to enums.instanceCategory.gpu → "GPU"
```

## Formatting components

`src/intl/formatted.tsx` provides formatting components built on react-intl:

- `FormattedPrice` — formats cents as USD (`$1.23`)
- `FormattedDistanceToNow` — relative time with tooltip showing absolute UTC and local time

## Translations in route loaders

A translation function is passed to the router's context, mainly to show notifications in loaders.

```tsx
async loader({ context: { translate } }) {
  notify.success(translate('modules.account.deactivateOrganization.deactivating'));
}
```
