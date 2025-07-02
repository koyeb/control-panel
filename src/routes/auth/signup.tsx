import { createFileRoute } from '@tanstack/react-router';

import { SignUpPage } from 'src/pages/authentication/sign-up.page';

export const Route = createFileRoute('/auth/signup')({
  component: SignUpPage,
});
