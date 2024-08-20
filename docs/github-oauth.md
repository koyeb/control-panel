# GitHub authentication

User can link their Koyeb account to a github account in order to authenticate using
[github oauth](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authenticating-to-the-rest-api-with-an-oauth-app).

## OAuth flow

Here is what happens when a user clicks starts the OAuth flow.

1. The control panel calls the API to retrieve a list of OAuth providers (as of today, there is only GitHub)
2. The control panel redirects to the github URL returned by the API
3. If the github oauth app isn't installed, the user has to give permission to do so, otherwise the flow
   continues seamlessly
4. Github redirects to the control panel's `/account/oauth/github/callback` page
5. The control panel calls the API to complete the flow

When github redirects to the control panel, it sets two query parameters: `code` and `state`. `code` is a
string, and `state` is expected to be a json web token.

These values are then sent to the API in the last step, and the API returns the access token.

## OAuth actions

There are three different type of OAuth actions:

- `signin`: the user authenticates to an existing Koyeb account
- `signup`: the user creates a new Koyeb account and authenticates to it
- `register`: the user is already authenticated and links a github account to their Koyeb account

The action is passed to the initial API call on step 1, using the `action` query parameter.

The `signin` and `signup` actions are initiated from the authentication pages. The `register` action is
initiated from the user's account settings page, under the "Your Connected Accounts" section.

## Redirection after authenticated

When the user tries to access a page without being authenticated and signs in with github, they are redirected
to that page if the oauth flow succeeds.

To do this, the control panel sends a `metadata` parameter to the first API call (step 1), containing
encoded value of the target url. This value is kept during the whole process and stored in the `state`
parameter's payload.

Once authenticated, the control panel can decode the state's payload and redirects to the decoded value of the
`metadata` property, if present.

## Error handling

When there was an error during the authorization of the OAuth app, GitHub redirects to the callback page with
an `error_description` query parameter instead of `code` and `state`. The control panel then redirects to the
sign in page and shows the parameter's value in a toast.

If the user tries to sign in but does not have a Koyeb account, API call on step 5 fails with a validation
error where the description is `not found`.

If the user tries to sign up but already have a Koyeb account,
the API call fails with a validation error where the description s `Email: '{email}' already used` (yes, the
capitalization isn't consistent. Disturbing, huh?)

If the user tries to authenticate with an email that is not whitelisted (on staging), the API call fails with
the error message `This OAuth2 account is not authorized to sign up`.

## Unlinking the GitHub OAuth app

The only way to unlink a OAuth app from a Koyeb account is to delete the account and re-create it.
