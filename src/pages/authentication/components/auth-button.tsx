import { Spinner } from '@koyeb/design-system';
import clsx from 'clsx';

import { Extend } from 'src/utils/types';

export function AuthButton({
  loading,
  className,
  children,
  ...props
}: Extend<React.ComponentProps<'button'>, { loading?: boolean }>) {
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex flex-row items-center justify-center gap-2',
        'rounded-md px-4 py-2 transition-colors',
        'font-medium text-white dark:text-black',
        'bg-black dark:bg-white',
        'hover:bg-black/85 dark:hover:bg-white/85',
        'disabled:bg-gray/70 dark:disabled:bg-white/70',
        'outline-offset-2 outline-blue focus-visible:outline-2',
        className,
      )}
      {...props}
    >
      {loading ? <Spinner className="size-5" /> : children}
    </button>
  );
}
