import clsx from 'clsx';
import { useEffect, useState } from 'react';

import { Spinner } from '@koyeb/design-system';

const debounce = 300;

type LoadingProps = {
  className?: string;
  children?: React.ReactNode;
};

export function Loading({ className, children }: LoadingProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShow(true);
    }, debounce);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  if (children) {
    return <>{show ? children : null}</>;
  }

  return (
    <div className={clsx('row min-h-32 items-center justify-center', className)}>
      {show ? <Spinner className="size-6" /> : null}
    </div>
  );
}
