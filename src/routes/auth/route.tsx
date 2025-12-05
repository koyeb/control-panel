import { Navigate, Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { getToken } from 'src/application/token';
import { AuthenticationLayout } from 'src/layouts/authentication/authentication.layout';

export const Route = createFileRoute('/auth')({
  component: function () {
    return (
      <AuthenticationLayout>
        <Outlet />
      </AuthenticationLayout>
    );
  },

  notFoundComponent: () => <Navigate from={Route.fullPath} to="/auth/signin" />,

  validateSearch: z.object({
    next: z.string().optional(),
  }),

  async beforeLoad({ search }) {
    const token = await getToken();

    if (token !== null) {
      throw redirect({ to: search.next ?? '/' });
    }
  },
});
