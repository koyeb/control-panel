# Authentication

WorkOS [AuthKit](https://www.authkit.com/) is used to handle authentication, including the sign in / sign up flows, authenticated API calls, organization switching and invitations management. See [workos.md](workos.md) for AuthKit initialization and WorkOS widgets.

## Authentication flows

The control panel has 3 routes dedicated to AuthKit:

- `/auth/signin` 
- `/auth/signup` 
- `/auth/signout`

These routes call AuthKit methods, which handle the corresponding authentication flows internally. If a WorkOS authentication page is accessed while being authenticated, the browser redirects back to the control panel.

The authentication pages themselves are managed by WorkOS, and can be [customized through the dashboard](https://dashboard.workos.com/branding).

When the user is not logged in, any call to `getAccessToken` throws a `LoginRequiredError`. When this happens inside a query (and it should always be the case), the query client's `onError` handler (`src/main.tsx`) triggers a redirection to the `/auth/signin` page.

> **Warning**: If a user falls in a state where they are correctly authenticated in the WorkOS authentication page, but AuthKit does not see them as authenticated, a redirection loop will happen between WorkOS and the control panel.

### Preserving the current URL after authentication

If a `next` query parameter is passed to the `/auth/signin` page, it is forwarded to the AuthKit `signIn` method's `state` parameter, which is preserved throughout the whole authentication flow:

After the user completes the flow from the hosted WorkOS pages, they are redirected to the control panel, where AuthKit calls the provider's `onRedirectCallback` function. The `next` parameter can be retrieved from the state, and the control panel redirects to it (or to `/` if not set).

> **Note**: The redirection is triggered using `window.location.href` rather than using the router, because the provider is outside the router.

### Logout

Logout calls `authKit.signOut()`. There are two ways it is triggered:

**User-initiated** — the sign-out button is in the user menu (present in `src/layouts/main/user-menu.tsx`, `src/layouts/onboarding/onboarding-layout.tsx` and `src/layouts/secondary/user-menu.tsx`).

**Automatic** — the `/auth/signout` route is navigated to programmatically. It calls `signOut()` in `beforeLoad` and then awaits a never-resolving promise to prevent further rendering:

### Sign out when the session is revoked

If a session gets revoked (e.g when a user is removed from an organization), the current access token stays valid until it's refreshed (as JWTs are immutable).

To avoid users using their valid access token from a revoked session, the session validity is checked in WorkOS from the `get /v1/account/organization` endpoint. If this endpoint returns a 403, the control panel navigates to `/auth/signout`, to trigger a logout.

## Refreshing the access token

Access tokens are short-lived (5 minutes by default), and they need to be refreshed periodically. This is fully handled by AuthKit — the token is refreshed automatically 10 seconds before it expires.

If a query throws a `LoginRequiredError`, it is retried once before triggering a redirect.

## Route protection

There is no explicit auth guard middleware. Protection relies on the route structure and error handling:

1. All authenticated pages live under the `/_main` pathless layout. Its `beforeLoad` makes authenticated API calls (`get /v1/account/profile`, `get /v1/account/organization`).
2. If the user isn't authenticated, `getAccessToken()` throws `LoginRequiredError`, which is caught by the `QueryCache` and triggers a redirect to `/auth/signin`.
3. Public routes (`/auth/*`, `/account/*`) are outside `/_main`, so they don't require authentication.

## Authenticated API calls

The API expects a valid WorkOS access token in `Authorization` headers. To include this token in every API call, the `apiQuery` and `apiMutation` functions (declared in `src/api/query.ts`) call the `getAccessToken` function attached to the query client's metadata.

> **Warning**: If a query or mutation needs to override the `meta` param, it should also include the `getAccessToken` function.

Some queries do not use `apiQuery` and implement a custom `queryKey` and `queryFn` (same goes for mutations). In this case, the `useApi` hook (`src/api/index.ts`) returns a function to perform an API call, which includes the access token automatically.

API calls performed in route loaders use `queryClient.ensureQueryData`, which leverages `apiQuery`, so the access token is automatically provided.

Calls to API streams (WebSockets) do _not_ automatically include the access token — it needs to be retrieved and passed manually.

## Organization switching

Switching organization is done using the `useSwitchOrganization` hook declared in `src/api/hooks/session.ts`. This hook returns a mutation wrapping an async call to AuthKit's `switchToOrganization` method.

The hook's `onSuccess` callback triggers:

- Fetch the new organization (using `fetchQuery` rather than `ensureQueryData` because the query key did not change)
- Fetch the new organization's default project and store its ID in local storage
- Invalidate the query client, including the WorkOS widget's cache

Switching can also be triggered via URL parameter — navigating with `?organization-id=<externalId>` triggers a switch in `_main/route.tsx`'s `beforeLoad`.

## SSO for third-party services

The control panel acts as an SSO provider for Canny and Discourse. See [sso.md](sso.md) for details.
