import { Navigate, Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { AuthenticationLayout } from 'src/layouts/authentication/authentication.layout';

export const Route = createFileRoute('/auth')({
  component: () => (
    <AuthenticationLayout>
      <Outlet />
    </AuthenticationLayout>
  ),

  notFoundComponent: () => <Navigate from={Route.fullPath} to="/auth/signin" />,

  validateSearch: z.object({
    next: z.string().optional(),
  }),

  beforeLoad({ search, context }) {
    if (context.auth.token !== null) {
      throw redirect({ to: search.next ?? '/' });
    }
  },
});
