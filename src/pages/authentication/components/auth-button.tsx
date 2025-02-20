import clsx from 'clsx';

import { Spinner } from '@koyeb/design-system';
import { Extend } from 'src/utils/types';

export function AuthButton({
  loading,
  className,
  children,
  ...props
}: Extend<React.ComponentProps<'button'>, { loading: boolean }>) {
  return (
    <button
      className={clsx(
        'row w-full items-center justify-center gap-2 rounded-md bg-[#1A1917] px-4 py-2 font-medium text-white disabled:bg-[#1A1917]/50',
        className,
      )}
      {...props}
    >
      {loading ? <Spinner className="size-5" /> : children}
    </button>
  );
}
