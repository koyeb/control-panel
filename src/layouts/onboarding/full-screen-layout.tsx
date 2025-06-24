import { useUserUnsafe } from 'src/api/hooks/session';
import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import { useSearchParams } from 'src/hooks/router';
import { ThemeMode, useForceThemeMode } from 'src/hooks/theme';

import { useLoaderData } from '@tanstack/react-router';
import { SecondarySettings } from '../secondary/settings';
import { UserMenu } from '../secondary/user-menu';

export function FullScreenLayout({ children }: { children: React.ReactNode }) {
  const { locked } = useLoaderData({ from: '/_main' });
  const params = useSearchParams();
  const user = useUserUnsafe();

  const isAuthenticated = user !== undefined || locked;

  useForceThemeMode(ThemeMode.light);

  if (params.has('settings')) {
    return <SecondarySettings />;
  }

  return (
    <div className="col h-screen p-3">
      <div className="col dark relative flex-1 items-center rounded-2xl bg-neutral/95 p-16">
        <div className="row justify-between self-stretch">
          <LogoKoyeb className="h-8 self-start" />
          {isAuthenticated && <UserMenu />}
        </div>

        {children}
      </div>
    </div>
  );
}
