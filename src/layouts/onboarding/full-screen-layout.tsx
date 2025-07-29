import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import { useSearchParams } from 'src/hooks/router';
import { useForceThemeMode } from 'src/hooks/theme';

import { SecondarySettings } from '../secondary/settings';
import { UserMenu } from '../secondary/user-menu';

export function FullScreenLayout({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();

  useForceThemeMode('light');

  if (params.has('settings')) {
    return <SecondarySettings />;
  }

  return (
    <div className="col h-screen p-3">
      <div className="dark relative col flex-1 items-center rounded-2xl bg-neutral/95 p-16">
        <div className="row justify-between self-stretch">
          <LogoKoyeb className="h-8 self-start" />
          <UserMenu />
        </div>

        {children}
      </div>
    </div>
  );
}
