import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
  useTransitionStatus,
  useTransitionStyles,
} from '@floating-ui/react';
import clsx from 'clsx';
import IconClose from 'lucide-static/icons/x.svg?react';
import { useEffect } from 'react';

import { useId } from '../utils/use-id';
import { usePrevious } from '../utils/use-previous';

const duration = 120;

type DialogProps = {
  isOpen: boolean;
  onClose?: () => void;
  onClosed?: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  children: React.ReactNode;
};

export function Dialog({
  isOpen,
  onClose,
  onClosed,
  title,
  description,
  width,
  className,
  children,
}: DialogProps) {
  const { refs, context } = useFloating({
    open: isOpen,
    onOpenChange(open) {
      if (!open) {
        onClose?.();
      }
    },
  });

  const dismiss = useDismiss(context, { outsidePressEvent: 'mousedown' });
  const role = useRole(context, { role: 'dialog' });

  const { getFloatingProps } = useInteractions([dismiss, role]);

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration,
    open: { opacity: 1 },
    close: { opacity: 0 },
  });

  const titleId = useId();
  const descriptionId = useId();

  const { status } = useTransitionStatus(context);
  const prevStatus = usePrevious(status);

  useEffect(() => {
    if (status === 'unmounted' && prevStatus === 'close') {
      onClosed?.();
    }
  }, [status, prevStatus, onClosed]);

  if (!isMounted) {
    return null;
  }

  return (
    <FloatingPortal>
      <FloatingOverlay
        lockScroll
        className="flex items-center justify-center bg-gradient-to-b from-gray/0 to-gray/15 p-2 backdrop-blur"
        style={transitionStyles}
      >
        <FloatingFocusManager context={context}>
          <div
            ref={refs.setFloating}
            className={clsx(
              'max-h-full w-full overflow-y-auto rounded-lg bg-popover text-contrast-popover shadow-lg',
              {
                'max-w-sm': width === 'sm',
                'max-w-md': width === 'md',
                'max-w-lg': width === 'lg',
                'max-w-xl': width === 'xl',
                'max-w-2xl': width === '2xl',
              },
            )}
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            {...getFloatingProps()}
          >
            {title && (
              <header className="row items-start justify-between gap-4 p-6 pb-4">
                <div className="col gap-2">
                  <h2 className="text-lg font-semibold" id={titleId}>
                    {title}
                  </h2>

                  {description && (
                    <p className="text-dim" id={descriptionId}>
                      {description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  className={clsx('focusable rounded', !onClose && 'hidden')}
                  onClick={onClose}
                >
                  <IconClose className="icon" />
                </button>
              </header>
            )}

            <div className={clsx('px-6 pb-4', className)}>{children}</div>
          </div>
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  );
}
