# GitHub app installation flow

Here is what happens when a user installs the github app. Here is an overview of the process:

1. The user clicks the "Install GitHub app" button
2. The control panel calls the API to retrieve a github URL
3. The control panel redirects to that URL
4. The user follows the process on github
5. github redirects to the control panel
6. The control panel calls the API to confirm the installation
7. The API indexes the repositories

Let's dive into what the control panel's needs to do.

## Retrieve the github redirect URL

To retrieve the github URL that will be used to redirect the user, the control panel calls the
`POST /v1/github/installation` API endpoint.

This endpoint accepts a `metadata` property, that will be preserved during the whole flow. We can use it to
store the current URL and redirect the user back to the current page once the installation is done.

The endpoint returns an `url` property, this is the github URL to redirect to.

## Redirection from github

When the user has completed the part on github, they get redirected to the control panel's
`/api/app/github/callback` page with some query parameters:

- `installation_id`: a string
- `setup_action`: a string
- `state`: a json web token

The `state` token can be decoded to retrieve it's payload, which contains the `metadata` property. It can be
used to redirect the user to the page where the installation started.

## Confirm the installation

To confirm the installation, the control panel needs to call the `POST /v1/github/installation/callback`
API endpoint with the 3 query parameters (`installation_id`, `setup_action` and `state`) in the request's
body.
