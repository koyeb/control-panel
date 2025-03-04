import { cva } from 'class-variance-authority';

import { Spinner } from '@koyeb/design-system';
import { Extend } from 'src/utils/types';

export function AuthButton({
  loading,
  className,
  children,
  ...props
}: Extend<React.ComponentProps<'button'>, { loading?: boolean }>) {
  return (
    <button type="button" className={AuthButton.class({ className })} {...props}>
      {loading ? <Spinner className="size-5" /> : children}
    </button>
  );
}

AuthButton.class = cva([
  'inline-flex flex-row items-center justify-center gap-2',
  'rounded-md px-4 py-2 transition-colors',
  'font-medium text-white dark:text-[#09090B]',
  'bg-[#09090B] dark:bg-white',
  'hover:bg-[#27272A] dark:hover:bg-[#D4D4D8]',
  'disabled:bg-[#71717A] dark:disabled:bg-[#3F3F46]',
  'outline-offset-2 outline-blue focus-visible:outline-2',
]);
