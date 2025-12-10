import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@workos-inc/authkit-react';
import { useEffect } from 'react';

import { LogoLoading } from 'src/components/logo-loading';

export const Route = createFileRoute('/_main/signout')({
  component: Component,
});

function Component() {
  const { signOut } = useAuth();

  useEffect(() => {
    signOut({
      navigate: true,
      returnTo: `${window.location.origin}/auth/signin`,
    });
  }, [signOut]);

  return <LogoLoading />;
}
