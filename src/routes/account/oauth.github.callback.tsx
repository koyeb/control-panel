import { createFileRoute } from '@tanstack/react-router';

import { GithubOauthCallbackPage } from 'src/pages/account/github-oauth-callback';

export const Route = createFileRoute('/account/oauth/github/callback')({
  component: GithubOauthCallbackPage,
});
