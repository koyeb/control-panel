import { lazy, useEffect } from 'react';

import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import { createTranslate } from 'src/intl/translate';

import { Slides } from './slides';

const Customers = lazy(() => import('./customers'));

const T = createTranslate('layouts.authentication');

export function AuthenticationLayout({ children }: { children: React.ReactNode }) {
  useForceLightMode();

  return (
    <div className="row h-screen bg-[#F2F2F2]">
      <div className="col flex-1 justify-between p-16">
        <div>
          <LogoKoyeb className="h-8" />
        </div>

        {children}

        <div className="col items-center gap-3 text-[#6B6965]">
          <div className="text-xs font-medium">
            <T id="argumentumAdPopulum" />
          </div>
          <div className="row max-w-md flex-wrap justify-evenly gap-x-4 gap-y-3">
            <Customers />
          </div>
        </div>
      </div>

      {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
      <div className="m-2 w-[44rem]">
        <Slides />
      </div>
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
