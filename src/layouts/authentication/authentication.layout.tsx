import { lazy } from 'react';

import LogoKoyeb from 'src/components/logo-koyeb.svg?react';

import { Slides } from './slides';

const Customers = lazy(() => import('./customers'));

export function AuthenticationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="row h-screen bg-[#F2F2F2]">
      <div className="col flex-1 justify-between p-16">
        <div>
          <LogoKoyeb className="h-8" />
        </div>

        {children}

        <div className="col items-center gap-3 text-[#6B6965]">
          <div className="text-xs font-medium">Trusted by the most ambitious teams</div>
          <div className="row max-w-md flex-wrap justify-evenly gap-x-4 gap-y-3">
            <Customers />
          </div>
        </div>
      </div>

      {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
      <div className="m-4 w-[44rem]">
        <Slides />
      </div>
    </div>
  );
}
