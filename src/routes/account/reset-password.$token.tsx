import { createFileRoute } from '@tanstack/react-router';

import { ChangePasswordPage } from 'src/pages/account/change-password';

export const Route = createFileRoute('/account/reset-password/$token')({
  component: ChangePasswordPage,
});
