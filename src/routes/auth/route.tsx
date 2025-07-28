import { Navigate, Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { container } from 'src/application/container';
import { AuthenticationLayout } from 'src/layouts/authentication/authentication.layout';
import { TOKENS } from 'src/tokens';

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

  beforeLoad({ search }) {
    const auth = container.resolve(TOKENS.authentication);

    if (auth.token !== null) {
      throw redirect({ to: search.next ?? '/' });
    }
  },
});
