import { lazy, useEffect } from 'react';

import { routes } from 'src/application/routes';
import { Link } from 'src/components/link';
import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import { createTranslate } from 'src/intl/translate';

import { Slides } from './slides';

const Customers = lazy(() => import('./customers'));

const T = createTranslate('layouts.authentication');

type AuthenticationLayoutProps = {
  slides?: boolean;
  children: React.ReactNode;
};

export function AuthenticationLayout({ slides = true, children }: AuthenticationLayoutProps) {
  useForceLightMode();

  return (
    <div className="row min-h-screen bg-[#F2F2F2]">
      <div className="col flex-1 justify-between p-4 lg:p-16">
        <Link href={routes.signIn()} className="self-start">
          <LogoKoyeb className="h-8" />
        </Link>

        <div className="col flex-1 justify-center py-8">{children}</div>

        <div className="lg:col hidden items-center gap-3 text-[#6B6965]">
          <div className="text-xs font-medium">
            <T id="argumentumAdPopulum" />
          </div>
          <div className="row max-w-lg flex-wrap justify-evenly gap-x-4 gap-y-3">
            <Customers />
          </div>
        </div>
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
