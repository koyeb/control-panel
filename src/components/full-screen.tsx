import clsx from 'clsx';
import { forwardRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { useShortcut } from 'src/hooks/shortcut';

type FullScreenProps = React.HTMLAttributes<HTMLDivElement> & {
  enabled: boolean;
  exit: () => void;
};

export const FullScreen = forwardRef<HTMLDivElement, FullScreenProps>(function FullScreen(
  { enabled, exit, className, ...props },
  ref,
) {
  useShortcut(['escape'], exit);

  useEffect(() => {
    if (enabled) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [enabled]);

  if (!enabled) {
    return <div ref={ref} className={className} {...props} />;
  }

  return createPortal(
    <div ref={ref} className={clsx('fixed inset-0 z-50', className)} {...props} />,
    document.getElementById('root') ?? document.body,
  );
});
