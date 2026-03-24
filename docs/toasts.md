# Toast notifications

Toast notifications use [react-toastify](https://fkhadra.github.io/react-toastify/) with a custom `Notification` component from `@koyeb/design-system`.

## `notify`

The `notify` object in `src/application/notify.ts` is the main API. It exposes four methods:

```ts
import { notify } from 'src/application/notify';

notify.success('Service created');
notify.info('Deployment in progress');
notify.warning('Quota limit approaching');
notify.error('Something went wrong');
```

Each method accepts an optional second argument with `title` and `autoClose` (duration in ms, or `false` to disable):

```ts
notify.error('Payment failed', { title: 'Billing error', autoClose: false });
```

## Deduplication

Toasts are deduplicated by text content. If a toast with the same text is already visible, the call is ignored.

## Styling

react-toastify is themed via CSS custom properties in `src/styles.css`:

- Transparent background, no shadow, no padding (the `Notification` component handles its own styling)
- Width set to `--container-md`
- z-index: 60

## Automatic error toasts

The `QueryCache` and `MutationCache` in `src/main.tsx` automatically call `notify.error` for API errors (rate limits, 5xx, etc.). See [queries.md](queries.md) for details.
