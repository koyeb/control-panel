import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@workos-inc/authkit-react';
import { useEffect } from 'react';

import { LogoLoading } from 'src/components/logo-loading';

export const Route = createFileRoute('/auth/signout')({
  component: Component,
});

function Component() {
  const { signOut, signIn } = useAuth();

  useEffect(() => {
    void Promise.resolve()
      .then(() => signOut({ navigate: false }))
      .then(() => signIn({}));
  }, [signOut, signIn]);

  return <LogoLoading />;
}
