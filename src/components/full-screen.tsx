import clsx from 'clsx';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { useShortcut } from 'src/hooks/shortcut';

type FullScreenProps = React.ComponentProps<'div'> & {
  enabled: boolean;
  exit: () => void;
};

export function FullScreen({ enabled, exit, className, ...props }: FullScreenProps) {
  useShortcut(['escape'], exit);

  useEffect(() => {
    if (enabled) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [enabled]);

  if (!enabled) {
    return <div className={className} {...props} />;
  }

  return createPortal(
    <div className={clsx('fixed inset-0 z-50 bg-neutral', className)} {...props} />,
    document.getElementById('root') ?? document.body,
  );
}
