import clsx from 'clsx';

import { ThemeMode, useForceThemeMode } from 'src/hooks/theme';

import BGGridDark from './images/bg-grid-dark.svg';
import { SecondaryLayoutHeader } from './secondary-layout-header';

export function SecondaryLayout({ className, children }: { className?: string; children: React.ReactNode }) {
  useForceThemeMode(ThemeMode.dark);

  return (
    <div
      className="col min-h-screen items-center justify-center"
      style={{ backgroundImage: `url("${BGGridDark}")` }}
    >
      <SecondaryLayoutHeader />

      <div className={clsx('w-full max-w-lg px-4', className)}>{children}</div>

      {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
      <div className="fixed bottom-0 right-0 size-72 translate-x-6 translate-y-24 bg-green opacity-40 blur-[6rem]" />
    </div>
  );
}
