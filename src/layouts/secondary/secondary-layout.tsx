import clsx from 'clsx';

import { useSearchParams } from 'src/hooks/router';

import { SecondaryLayoutHeader } from './secondary-layout-header';
import { SecondarySettings } from './settings';

export function SecondaryLayout({ className, children }: { className?: string; children: React.ReactNode }) {
  const params = useSearchParams();

  return (
    <div className="col min-h-screen">
      <BackgroundTexture />
      <SecondaryLayoutHeader background />

      {params.has('settings') ? (
        <SecondarySettings />
      ) : (
        <div className={clsx('col flex-1 items-center px-4 py-8 lg:py-32', className)}>{children}</div>
      )}
    </div>
  );
}

function BackgroundTexture() {
  return (
    <div
      // eslint-disable-next-line tailwindcss/no-arbitrary-value
      className="pointer-events-none fixed bottom-0 right-0 size-[92rem] translate-x-1/2 translate-y-1/2 bg-repeat opacity-10 md:opacity-40"
      style={{
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(grid)}"`,
        maskImage: 'radial-gradient(circle at center, black 0, transparent 65%)',
      }}
    />
  );
}

const grid = `
<svg width="128" height="128" viewBox="0 0 64 64" stroke="#999" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M 0 0 V 64 H 64" />
</svg>
`;
