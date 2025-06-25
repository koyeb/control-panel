import { routes } from 'src/application/routes';
import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import { ThemeMode, useForceThemeMode } from 'src/hooks/theme';
import { createTranslate } from 'src/intl/translate';

import { ExternalLink, Link } from '../link';

const T = createTranslate('components.errorBoundary.unhandledError');

export function ErrorLayout({ children }: { children: React.ReactNode }) {
  useForceThemeMode(ThemeMode.dark);

  return (
    <div
      className="col absolute inset-0 bg-cover bg-center bg-no-repeat px-4 py-8"
      style={{ backgroundImage: 'url("/public/black-hole.svg")' }}
    >
      <LogoKoyeb className="absolute m-6 h-8" />
      <main className="col mx-auto max-w-4xl flex-1 justify-center gap-8 text-center leading-tight">
        {children}
      </main>
    </div>
  );
}

type ErrorViewProps = {
  httpStatus?: number;
  message?: React.ReactNode;
  code?: string;
  expected?: boolean;
  onReset?: () => void;
};

export function ErrorView({ httpStatus, message, code, expected, onReset }: ErrorViewProps) {
  return (
    <ErrorLayout>
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
    </ErrorLayout>
  );
}
