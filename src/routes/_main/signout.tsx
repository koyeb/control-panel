import { createFileRoute } from '@tanstack/react-router';

import { LogoLoading } from 'src/components/logo-loading';

export const Route = createFileRoute('/_main/signout')({
  pendingComponent: LogoLoading,
  pendingMinMs: 0,
  pendingMs: 0,

  loader({ context: { authKit } }) {
    authKit.signOut({ navigate: true });
  },
});
