import { routes } from 'src/application/routes';
import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import { useForceThemeMode } from 'src/hooks/theme';
import { createTranslate } from 'src/intl/translate';

import { ExternalLink, Link } from '../link';

const T = createTranslate('components.errorBoundary.unhandledError');

type ErrorViewProps = {
  httpStatus?: number;
  message?: React.ReactNode;
  code?: string;
  expected?: boolean;
  onReset?: () => void;
};

export function ErrorView({ httpStatus, message, code, expected, onReset }: ErrorViewProps) {
  useForceThemeMode('dark');

  return (
    <div
      className="h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/static/images/backgrounds/black-hole.svg)' }}
    >
      <LogoKoyeb className="absolute m-6 h-8" />

      <main className="mx-auto col h-full max-w-4xl items-center justify-center gap-4 px-4 text-center leading-tight">
        {httpStatus && (
          <div className="font-semibold">
            <T id="httpStatus" values={{ httpStatus }} />
          </div>
        )}

        <div className="text-5xl font-semibold lg:text-7xl">
          <T id="title" />
        </div>

        <div className="text-xl font-semibold lg:text-3xl">{message}</div>

        {!expected && (
          <div className="my-6">
            <T
              id="statusLink"
              values={{
                link: (children) => (
                  <ExternalLink href="https://status.koyeb.com" className="text-link">
                    {children}
                  </ExternalLink>
                ),
              }}
            />
          </div>
        )}

        {code && (
          <div className="my-4 font-bold">
            <T id="code" values={{ code }} />
          </div>
        )}

        <div className="mt-6 self-center">
          <Link
            href={routes.home()}
            className="rounded-full bg-green px-6 py-3 font-medium hover:no-underline"
            onClick={onReset}
          >
            <T id="button" />
          </Link>
        </div>
      </main>
    </div>
  );
}
