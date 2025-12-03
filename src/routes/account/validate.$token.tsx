import { createFileRoute, redirect } from '@tanstack/react-router';

import { LogoLoading } from 'src/components/logo-loading';

export const Route = createFileRoute('/account/validate/$token')({
  pendingComponent: LogoLoading,
  pendingMinMs: 0,
  pendingMs: 0,

  async loader() {
    throw redirect({ to: '/', replace: true });
  },
});
