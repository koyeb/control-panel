import { isApiError } from 'src/api/api-errors';
import { useUserQuery } from 'src/api/hooks/session';
import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import { useSearchParams } from 'src/hooks/router';
import { ThemeMode, useForceThemeMode } from 'src/hooks/theme';

import { SecondarySettings } from '../secondary/settings';
import { UserMenu } from '../secondary/user-menu';

export function FullScreenLayout({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const userQuery = useUserQuery();

  const accountLocked = userQuery.isError && isApiError(userQuery.error) && userQuery.error.status === 403;
  const isAuthenticated = userQuery.isSuccess || accountLocked;

  useForceThemeMode(ThemeMode.light);

  if (params.has('settings')) {
    return <SecondarySettings />;
  }

  return (
    <div className="col h-screen p-3">
      <div className="dark relative col flex-1 items-center rounded-2xl bg-neutral/95 p-16">
        <div className="row justify-between self-stretch">
          <LogoKoyeb className="h-8 self-start" />
          {isAuthenticated && <UserMenu />}
        </div>

        {children}
      </div>
    </div>
  );
}
