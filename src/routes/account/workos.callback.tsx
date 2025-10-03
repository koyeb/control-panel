import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { LogoLoading } from 'src/components/logo-loading';
import { urlToLinkOptions } from 'src/hooks/router';

export const Route = createFileRoute('/account/workos/callback')({
  pendingComponent: LogoLoading,
  pendingMinMs: 0,
  pendingMs: 0,

  validateSearch: z.object({
    code: z.string().optional(),
    state: z.string().optional(),
  }),

  async loader({ context: { authKit } }) {
    throw redirect(urlToLinkOptions(authKit.next ?? '/'));
  },
});
