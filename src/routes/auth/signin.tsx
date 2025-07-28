import { createFileRoute } from '@tanstack/react-router';

import { SignInPage } from 'src/pages/authentication/sign-in.page';

export const Route = createFileRoute('/auth/signin')({
  component: SignInPage,
});
