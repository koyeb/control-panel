import { createFileRoute } from '@tanstack/react-router';

import { ResetPasswordPage } from 'src/pages/authentication/reset-password.page';

export const Route = createFileRoute('/auth/reset-password')({
  component: ResetPasswordPage,
});
