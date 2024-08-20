import clsx from 'clsx';

import { Spinner } from '@koyeb/design-system';

export function AuthenticateButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" className="authenticate-button relative">
      <div
        className={clsx(
          'col absolute inset-0 items-center justify-center opacity-0 transition-opacity duration-300',
          loading && 'opacity-100',
        )}
      >
        <Spinner className="size-4" />
      </div>

      <div className={clsx('transition-opacity duration-300', loading && 'opacity-0')}>{children}</div>
    </button>
  );
}
