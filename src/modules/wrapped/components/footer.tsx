import clsx from 'clsx';

import { IconArrowRight } from 'src/components/icons';

type FooterProps = {
  next: () => void;
  className?: string;
  children?: React.ReactNode;
};

export function Footer({ next, className, children = 'Next' }: FooterProps) {
  return null;
  return (
    <footer className="col mt-auto justify-end">
      <button
        onClick={next}
        className={clsx('row items-center gap-2 self-end px-5 py-3 text-xl font-semibold', className)}
      >
        {children}
        <IconArrowRight className="size-6" />
      </button>
    </footer>
  );
}
