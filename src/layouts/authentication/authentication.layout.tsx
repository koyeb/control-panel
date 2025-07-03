import { lazy } from 'react';

import { Link } from 'src/components/link';
import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import { useForceThemeMode } from 'src/hooks/theme';

type AuthenticationLayoutProps = {
  slides?: boolean;
  children: React.ReactNode;
};

const Slides = lazy(() => import('./slides'));

export function AuthenticationLayout({ slides = true, children }: AuthenticationLayoutProps) {
  useForceThemeMode('light');

  return (
    <div className="row min-h-screen bg-muted">
      <div className="col flex-1 justify-between p-4 lg:p-16">
        <Link to="/auth/signin" className="self-start">
          <LogoKoyeb className="h-8" />
        </Link>

        {children}
      </div>

      {slides && (
        <div className="m-2 hidden max-w-3xl min-w-[36rem] flex-1 lg:block">
          <Slides />
        </div>
      )}
    </div>
  );
}
