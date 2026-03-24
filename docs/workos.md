# WorkOS

WorkOS is the identity provider used by the control panel. It handles authentication (through [AuthKit](https://www.authkit.com/)) and provides UI components (through [widgets](#workos-widgets)).

## AuthKit initialization

AuthKit is an SDK wrapping part of the WorkOS system, regarding authentication. It's integrated into the control panel using the [@workos-inc/authkit-react](https://www.npmjs.com/package/@workos-inc/authkit-react) package.

AuthKit does not support TanStack Router directly — it only supports it through TanStack Start. A custom adapter was implemented, with some caveats that are explained in this document and in [authentication.md](authentication.md).

As AuthKit must be initialized while rendering the routes, it must be provided outside the router. A custom provider is declared in `src/application/authkit.tsx`, wrapping the base provider from authkit-react:

```tsx
<AuthKitProvider queryClient={queryClient}>
  {(authKit) => <RouterProvider router={router} context={{ authKit }} />}
</AuthKitProvider>
```

````

Configuration is read from environment variables via `src/application/config.ts`:

| Variable                 | Purpose                                              |
| ------------------------ | ---------------------------------------------------- |
| `VITE_WORK_OS_CLIENT_ID` | WorkOS application client ID                         |
| `VITE_WORK_OS_API_HOST`  | WorkOS API hostname                                  |
| `VITE_ENVIRONMENT`       | Controls `devMode` flag (enabled outside production) |

The redirect URI is set to `${window.location.origin}/account/workos/callback`.

The client is injected into the [router's context](https://tanstack.com/router/latest/docs/guide/router-context#how-about-using-react-contexthooks), making it available to all routes.

> **Warning**: An `async beforeLoad` is needed in the root route (`src/routes/__root.tsx`), even if it's empty. This is most likely due to the need for the `AuthKitGuard` workaround.

## AuthKitGuard

`AuthKitGuard` (in `src/application/authkit.tsx`) sits inside the provider and serves two purposes:

1. **Blocks rendering while auth state is loading** — returns `null` until the WorkOS SDK has initialized.
2. **Injects `getAccessToken` into React Query** — sets it as default `meta` on all queries and mutations, so every API call is automatically authenticated without manual token passing.

```tsx
useEffect(() => {
  const meta = { getAccessToken: authKit.getAccessToken };
  const options = queryClient.getDefaultOptions();

  queryClient.setDefaultOptions({
    ...options,
    queries: { ...options.queries, meta },
    mutations: { ...options.mutations, meta },
  });
});
```

The authentication pages themselves are managed by WorkOS, and they can be [customized through the dashboard](https://dashboard.workos.com/branding).

## WorkOS widgets

The [@workos-inc/widgets](https://www.npmjs.com/package/@workos-inc/widgets) package exposes components wrapping some WorkOS related functionalities. The control panel uses the `UserProfile`, `UserSecurity` and `UsersManagement` widgets.

These components are wrapped inside a `WorkOSWidgetsProvider` component (`src/components/workos-widgets-provider.tsx`), providing the `getAccessToken` function and some theme customization.

> **Warning**: These components require loading CSS from radix-ui and custom styles from WorkOS. To avoid (or at least minimize) styling issues, the `WorkOSWidgetsProvider` is excluded from the main bundle using code splitting.

Custom CSS to better integrate the WorkOS widget components is in `src/workos.css`. The WorkOS team recommends targeting elements using class names, but this is fragile and can break if they change the classes (which did happen).

The `UsersManagement` widget shows a button to send invitations. As some plans do not offer multiple seats, this button is hidden with custom styles, injected conditionally.
````
