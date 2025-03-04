import { lazy, useEffect } from 'react';

import { routes } from 'src/application/routes';
import { Link } from 'src/components/link';
import LogoKoyeb from 'src/components/logo-koyeb.svg?react';

type AuthenticationLayoutProps = {
  slides?: boolean;
  children: React.ReactNode;
};

const Slides = lazy(() => import('./slides'));

export function AuthenticationLayout({ slides = true, children }: AuthenticationLayoutProps) {
  useForceLightMode();

  return (
    <div className="row min-h-screen bg-[#F2F2F2]">
      <div className="col flex-1 justify-between p-4 lg:p-16">
        <Link href={routes.signIn()} className="self-start">
          <LogoKoyeb className="h-8" />
        </Link>

        {children}
      </div>

      {slides && (
        // eslint-disable-next-line tailwindcss/no-arbitrary-value
        <div className="m-2 hidden min-w-[36rem] max-w-3xl flex-1 lg:block">
          <Slides />
        </div>
      )}
    </div>
  );
}

function useForceLightMode() {
  useEffect(() => {
    const html = document.documentElement;

    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      return () => html.classList.add('dark');
    }
  }, []);
}
