# GitHub app installation flow

Here is an overview of the github app installation process.

1. The user clicks the "Install GitHub app" button
2. The control panel calls the API to retrieve a github URL and redirects to it
3. The user follows the process on github, and gets redirected to the control panel
4. The control panel calls the API to confirm the installation
5. The API indexes the repositories

## Retrieve the github redirect URL

To retrieve the github URL that will be used to redirect the user, the control panel calls the
`POST /v1/github/installation` API endpoint.

This endpoint accepts a `metadata` property, that will be preserved during the flow. It is used to store the current
URL, and redirect to it once the installation is done.

## Redirection from github

When the user has completed their part on github, they get redirected to the control panel's `/api/app/github/callback`
page with some query parameters:

- `setup_action`: `install`
- `state`: a json web token
- `code`: a string
- `installation_id`: a string

The `state`'s payload contains the `metadata` property.

## Confirm the installation

To confirm the installation, the control panel needs to call the `POST /v1/account/oauth` API endpoint with the 3 query
parameters (`installation_id`, `setup_action` and `state`) in the request's body.

## 2-step installation

If the user does not have the required permissions on github to install the app, this process ends up in a pending
installation request, which should be validated by an admin of their github organization.

In this case, the query parameters returned by github are:

- `setup_action`: `request`
- `code`: a string
- `state`: a json web token

When the installation is validated, the github admin is redirected to the github callback page, with the query
parameters:

- `setup_action`: `install`
- `code`: a string
- `installation_id`: a string

Note that as this happens asynchronously, the user who validates the installation might not be authenticated.
