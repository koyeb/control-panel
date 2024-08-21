import clsx from 'clsx';

import { ThemeMode, useForceThemeMode } from 'src/hooks/theme';

import { FeaturesList } from './features-list';
import BGGridDark from './images/bg-grid-dark.svg';
import BGGridLight from './images/bg-grid-light.svg';
import { SecondaryLayoutHeader } from './secondary-layout-header';

type SecondaryLayoutTwoTonesProps = {
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
};

export function SecondaryLayoutTwoTones({
  className,
  contentClassName,
  children,
}: SecondaryLayoutTwoTonesProps) {
  useForceThemeMode(ThemeMode.light);

  return (
    <div className={clsx('secondary-layout col h-screen', className)}>
      <div className="row fixed inset-0 -z-10 flex-1">
        <div className="dark flex-1" style={{ backgroundImage: `url("${BGGridDark}")` }} />
        <div className="hidden flex-1 lg:block" style={{ backgroundImage: `url("${BGGridLight}")` }} />
      </div>

      <SecondaryLayoutHeader />

      <div className="row flex-1">
        <div className="col dark flex-1 items-center justify-center overflow-y-auto bg-transparent px-4">
          <div className={clsx('w-full max-w-xl', contentClassName)}>{children}</div>
        </div>

        <div className="lg:col hidden flex-1 items-center justify-center px-4">
          <FeaturesList />
        </div>
      </div>

      {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
      <div className="fixed bottom-0 right-0 -z-10 size-72 translate-x-6 translate-y-24 bg-green opacity-40 blur-[8rem] md:opacity-100" />
    </div>
  );
}
