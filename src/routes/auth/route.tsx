import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { isAuthenticated } from 'src/application/authentication';

import { AuthenticationLayout } from 'src/layouts/authentication/authentication.layout';
import { z } from 'zod';

export const Route = createFileRoute('/auth')({
  component: () => (
    <AuthenticationLayout>
      <Outlet />
    </AuthenticationLayout>
  ),

  validateSearch: z.object({
    next: z.string().optional(),
  }),

  beforeLoad: ({ search }) => {
    if (isAuthenticated()) {
      throw redirect({ to: search.next ?? '/', replace: true });
    }
  },
});
