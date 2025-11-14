import { ErrorComponentProps } from '@tanstack/react-router';

import { ApiError } from 'src/api';
import { getConfig } from 'src/application/config';
import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import { useForceThemeMode } from 'src/hooks/theme';
import { createTranslate } from 'src/intl/translate';
import { AccountLocked } from 'src/modules/account/account-locked';

import { ExternalLink, Link } from './link';
import { LogoLoading } from './logo-loading';

const T = createTranslate('pages');

export function ErrorComponent({ error, reset, info }: ErrorComponentProps) {
  const { code, status } = ApiError.is(error) ? error.body : {};

  if (ApiError.is(error, 401)) {
    return <LogoLoading />;
  }

  if (ApiError.isAccountLockedError(error)) {
    return <AccountLocked />;
  }

  return (
    <ErrorView
      code={code}
      httpStatus={status}
      message={error.message}
      onReset={reset}
      stack={error.stack}
      componentStack={info?.componentStack}
    />
  );
}

export function NotFoundComponent() {
  return (
    <ErrorView
      title={<T id="notFound.title" />}
      message={<T id="notFound.message" />}
      httpStatus={404}
      expected
    />
  );
}

type ErrorViewProps = {
  httpStatus?: number;
  title?: React.ReactNode;
  message?: React.ReactNode;
  code?: string;
  expected?: boolean;
  stack?: string;
  componentStack?: string;
  onReset?: () => void;
};

export function ErrorView({
  httpStatus,
  title,
  message,
  code,
  expected,
  stack,
  componentStack,
  onReset,
}: ErrorViewProps) {
  const environment = getConfig('environment');

  useForceThemeMode('dark');

  return (
    <div
      className="h-screen overflow-auto bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/black-hole.svg)' }}
    >
      <LogoKoyeb className="absolute m-6 h-8" />

      <main className="mx-auto col min-h-full max-w-4xl items-center justify-center gap-6 px-4 py-8 text-center leading-tight">
        {httpStatus && (
          <div className="font-semibold">
            <T id="error.httpStatus" values={{ httpStatus }} />
          </div>
        )}

        <div className="text-5xl font-semibold lg:text-7xl">{title ?? <T id="error.title" />}</div>

        <div className="text-xl font-semibold lg:text-2xl">{message}</div>

        {!expected && (
          <div className="my-6">
            <T
              id="error.statusLink"
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
            <T id="error.code" values={{ code }} />
          </div>
        )}

        {environment === 'development' && (
          <div className="col gap-4 text-left">
            <pre className="text-xs">{stack}</pre>
            <pre className="text-xs">{componentStack}</pre>
          </div>
        )}

        <div className="mt-6 self-center">
          <Link
            to="/"
            state={{ clearCache: true }}
            className="rounded-full bg-green px-6 py-3 font-medium hover:no-underline"
            onClick={onReset}
          >
            <T id="error.button" />
          </Link>
        </div>
      </main>
    </div>
  );
}
