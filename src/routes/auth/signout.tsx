import { createFileRoute } from '@tanstack/react-router';

import { LogoLoading } from 'src/components/logo-loading';

export const Route = createFileRoute('/auth/signout')({
  component: LogoLoading,
  pendingMinMs: 0,
  pendingMs: 0,

  loader({ context: { auth } }) {
    auth.signOut({ navigate: true });
  },
});
