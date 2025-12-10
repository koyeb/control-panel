import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import { useSearchParams } from 'src/hooks/router';
import { useForceThemeMode } from 'src/hooks/theme';

import { SecondarySettings } from '../secondary/settings';
import { UserMenu } from '../secondary/user-menu';

import Background from './background.svg?react';

export function FullScreenLayout({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();

  useForceThemeMode('light');

  if (params.has('settings')) {
    return <SecondarySettings />;
  }

  return (
    <div className="relative col min-h-screen p-4">
      <div className="absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
        <Background className="size-full min-w-lg" />
      </div>

      <div className="row justify-between">
        <LogoKoyeb className="h-8 self-start" />
        <UserMenu />
      </div>

      <div className="col flex-1 items-center justify-center">{children}</div>
    </div>
  );
}
