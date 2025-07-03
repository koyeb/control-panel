import { Navigate, Outlet, createFileRoute } from '@tanstack/react-router';

import { AuthenticationLayout } from 'src/layouts/authentication/authentication.layout';

export const Route = createFileRoute('/auth')({
  component: () => (
    <AuthenticationLayout>
      <Outlet />
    </AuthenticationLayout>
  ),

  notFoundComponent: () => <Navigate from={Route.fullPath} to="/auth/signin" />,
});
