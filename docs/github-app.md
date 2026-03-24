# GitHub App Installation Flow

Overview of the GitHub app installation process.

1. The user clicks the "Install GitHub app" button
2. The control panel calls the API to retrieve a GitHub URL and redirects to it
3. The user follows the process on GitHub and gets redirected to the control panel
4. The control panel calls the API to confirm the installation
5. The API indexes the repositories

## Retrieve the GitHub Redirect URL

To retrieve the GitHub URL that will be used to redirect the user, the control panel calls the
`POST /v1/github/installation` API endpoint.

This endpoint accepts a `metadata` property, that will be preserved during the flow. It is used to store the current
URL, and redirect to it once the installation is done.

## Redirection from GitHub

When the user has completed their part on GitHub, they get redirected to the control panel's `/account/oauth/github/callback`
page with some query parameters:

- `setup_action` — `install`
- `state` — a JSON web token
- `code` — a string
- `installation_id` — a string

The `state` JWT payload contains:

- `metadata` — The URL to redirect back to after the flow (default: `/`)
- `organization_id` — The Koyeb organization ID
- `action` — The action that triggered the flow

## Confirm the Installation

To confirm the installation, the control panel calls the `POST /v1/account/oauth` API endpoint with the query
parameters (`installation_id`, `setup_action`, `code`, and `state`) in the request body.

After confirmation, the user is redirected back to the URL stored in `metadata`.

## 2-Step Installation

If the user does not have the required permissions on GitHub to install the app, this process ends up in a pending
installation request, which should be validated by an admin of their GitHub organization.

In this case, the query parameters returned by GitHub are:

- `setup_action` — `request`
- `code` — a string
- `state` — a JSON web token

The user is redirected back with `githubAppInstallationRequested: true` in the router state, so the UI can show a "pending approval" message.

When the installation is validated by the admin, GitHub redirects to the callback page with:

- `setup_action` — `install`
- `code` — a string
- `installation_id` — a string

Note that as this happens asynchronously, the admin who validates the installation might not be authenticated. In this case, the `state` parameter is absent, and the control panel shows a confirmation page instead of redirecting.

## Route File

- `src/routes/account/oauth.github.callback.tsx`
