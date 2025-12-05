import { Navigate, createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { LogoLoading } from 'src/components/logo-loading';
import { wait } from 'src/utils/promises';

export const Route = createFileRoute('/account/workos/callback')({
  pendingComponent: LogoLoading,
  pendingMinMs: 0,
  pendingMs: 0,

  component() {
    return <Navigate to="/" />;
  },

  validateSearch: z.object({
    code: z.string().optional(),
    state: z.string().optional(),
  }),

  async loader() {
    // authkit should redirect from onRedirectCallback
    await wait(5_000);
  },
});
