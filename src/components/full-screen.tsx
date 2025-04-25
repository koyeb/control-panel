import { FloatingOverlay, FloatingPortal } from '@floating-ui/react';
import clsx from 'clsx';

import { useShortcut } from 'src/hooks/shortcut';

type FullScreenProps = React.ComponentProps<'div'> & {
  enabled: boolean;
  exit: () => void;
};

export function FullScreen({ enabled, exit, className, ...props }: FullScreenProps) {
  useShortcut(['escape'], exit);

  if (!enabled) {
    return <div className={className} {...props} />;
  }

  return (
    <FloatingPortal root={document.getElementById('root')}>
      <FloatingOverlay lockScroll className={clsx('fixed inset-0 z-60 bg-neutral', className)} {...props} />
    </FloatingPortal>
  );
}
