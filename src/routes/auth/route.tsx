import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { isAuthenticated } from 'src/application/authentication';

import { AuthenticationLayout } from 'src/layouts/authentication/authentication.layout';

export const Route = createFileRoute('/auth')({
  component: () => (
    <AuthenticationLayout>
      <Outlet />
    </AuthenticationLayout>
  ),

  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: '/', replace: true });
    }
  },
});
