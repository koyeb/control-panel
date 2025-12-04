import { createFileRoute } from '@tanstack/react-router';

import { LogoLoading } from 'src/components/logo-loading';

export const Route = createFileRoute('/auth/signin')({
  component: LogoLoading,
  pendingMinMs: 0,
  pendingMs: 0,

  async loader({ location, context: { auth } }) {
    const next = location.state.next;

    await auth.signIn({
      state: next ? { next } : undefined,
    });
  },
});
