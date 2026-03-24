# Forms

Forms use [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation.

## Form Controls

Form controls (form fields) are divided into three layers:

1. **Base form control** — a standalone component living in the design system
2. **Wrapped form control** — a base component wrapped with an optional label and error message
3. **React Hook Form adapter** — an adapter component for RHF (controlled)

These components (excluding the base ones) live in `src/components/forms/`. React Hook Form adapters leverage `useController`, auto-wiring `field.value`, `field.onChange`, `fieldState.invalid`, and `fieldState.error.message`. They also expose an `onChangeEffect` prop for convenience, allowing to add side-effects to change events.

Available form controls:

- `Input`
- `TextArea`
- `Checkbox`
- `Switch`
- `Radio`
- `Slider`
- `Select`
- `Combobox`
- `SelectBox`

Usage examples are available in storybook.

### Select and Combobox

`Select` and `Combobox` are built on [downshift](https://www.downshift-js.com/) (`useSelect`, `useCombobox`). Their RHF adapter variants accept a `getValue` function to map item objects to form values.

### Number Inputs

Inputs of type number uses `NaN` to internally when the input's value is an empty string. Upon submission, required inputs treat `NaN` values as if they had no value, showing a consistent error message.

## Validation

Validation uses **Zod schemas** connected through `zodResolver` from `@hookform/resolvers`:

```tsx
const schema = z.object({
  organizationName: z.string().min(1),
});

const form = useForm({
  defaultValues: { organizationName: '' },
  resolver: zodResolver(schema),
});
```

`configureZod` in `src/application/validation.ts` sets translated error messages for common Zod issues (`required`, `too_small`, `too_big`, `invalid_format`, etc.). These apply to all forms automatically.

Most forms use the default `mode: 'onSubmit'` — validation runs on submit only. The service form uses `mode: 'onChange'` to validate on every field change.

## Form Submission

A custom `handleSubmit` wrapper is defined in `src/hooks/form.ts`. It wraps React Hook Form's `handleSubmit` and catches async errors to avoid reporting them to Sentry:

```tsx
<form onSubmit={handleSubmit(form, mutation.mutateAsync)}>
```

All forms submit through API mutations. The typical pattern:

```tsx
const invalidate = useInvalidateApiQuery();

const mutation = useMutation({
  ...apiMutation('put /v1/organizations/{id}/name', (values) => ({
    path: { id: organization.id },
    body: { name: values.name },
  })),
  async onSuccess(_, values) {
    await invalidate('/v1/organizations/{id}');
    form.reset(values);
    notify.success('Organization name updated');
  },
});
```

## Error Handling

The `useFormErrorHandler` hook (`src/hooks/form.ts`) handles API errors from mutations to update errors in RHF.

API validation errors have a `fields` property, parsed in `ApiError` (`src/api/api-error.ts`):

```json
{
  "code": "invalid_argument",
  "fields": [
    {
      "field": "name",
      "description": "The name should not be empty"
    }
  ]
}
```

When an API mutation returns an error matching this format, it's mapped to RHF using calls to `setError()` on the form. The `useFormErrorHandler` function accepts an optional parameter to map API errors to form values, using dot notation.

```tsx
useMutation({
  ...apiMutation('put /v1/organizations/{id}/name', (values) => ({
    path: { id: organization.id },
    body: { name: values.name },
  })),
  onError: useFormErrorHandler(form),
});

useMutation({
  ...apiMutation('patch /v1/organizations/{id}', (values) => ({
    path: { id: organization.id },
    body: {
      address1: values.address.line1,
      city: values.address.city,
    },
  })),
  onError: useFormErrorHandler(form, (error) => ({
    'address.line1': error.address1,
    'address.city': error.city,
  })),
});
```

Non-API errors or errors not matching a validation error shows a toast notification.
