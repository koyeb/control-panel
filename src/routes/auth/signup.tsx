import { createFileRoute } from '@tanstack/react-router';

import { LogoLoading } from 'src/components/logo-loading';

export const Route = createFileRoute('/auth/signup')({
  pendingComponent: LogoLoading,
  pendingMinMs: 0,
  pendingMs: 0,

  async loader({ context: { authKit } }) {
    await authKit.signUp();
  },
});
