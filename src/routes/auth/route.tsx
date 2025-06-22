import { createFileRoute, Outlet } from '@tanstack/react-router';

import { AuthenticationLayout } from 'src/layouts/authentication/authentication.layout';

export const Route = createFileRoute('/auth')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AuthenticationLayout>
      <Outlet />
    </AuthenticationLayout>
  );
}
