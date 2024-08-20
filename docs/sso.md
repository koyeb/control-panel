# Single sign-on

Koyeb users can sign in to some third party websites using SSO. Currently, this is possible for:

- Canny (feedback.koyeb.com)
- Discourse (community.koyeb.com)

When users want to log in, they click a button that redirected them to the control panel, where they can
authenticate (if needed). Once they're logged in, the control panel redirects back to where they came from,
and they are authenticated.

## Process

When users click the "Log in" button on the third party website, they are redirected to the control panel on
the `/auth/sso/...` page, with some query parameters.

If they are not authenticated, the control panel redirects to `/auth/signin` with a `next` query parameter,
containing the current URL. After they authenticate, the control panel redirects back to the SSO page and the
flow resumes.

The control panel calls an API endpoint, which returns a token. This token is then used to redirect back to
the third party website, and the user will be authenticated there.

## Canny

- Control panel URL: `/auth/sso/canny`
- Initial query parameters: `companyID` and `redirect`
- API endpoint: `POST /v1/sso/canny`
- API endpoint body: none
- API endpoint response: `token`
- Redirect URL: `https://canny.io/api/redirects/sso`
- Redirect query parameters: `companyID` and `redirect` (from the initial params) and `ssoToken` (from the API)

## Discourse

- Control panel URL: `/auth/sso/discourse`
- Initial query parameters: `sso` and `sig`
- API endpoint: `POST /v1/sso/discourse`
- API endpoint body: `payload=sso` and `sig=sig`
- API endpoint response: `sso` and `sig` (same names, that's pretty confusing)
- Redirect URL: `https://community.koyeb.com/session/sso_login`
- Redirect query parameters: `sso` and `sig` (from the API)

> Note: don't use URLSearchParams to redirect to discourse, as `sso` is already url encoded
