import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { LogoLoading } from 'src/components/logo-loading';

export const Route = createFileRoute('/auth/signin')({
  pendingComponent: LogoLoading,
  pendingMinMs: 0,
  pendingMs: 0,

  validateSearch: z.object({
    email: z.string().optional(),
    next: z.string().optional(),
  }),

  loaderDeps({ search }) {
    return search;
  },

  async loader({ deps, context: { authKit } }) {
    await authKit.signIn({
      loginHint: deps.email,
      state: deps.next ? { next: deps.next } : undefined,
    });
  },
});
