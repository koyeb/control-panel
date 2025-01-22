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
import { AnimatePresence, motion } from 'framer-motion';
import IconClose from 'lucide-static/icons/x.svg?react';
import { useEffect } from 'react';

import { useId } from '../utils/use-id';
import { usePrevious } from '../utils/use-previous';

const duration = 140;

type DialogProps = {
  isOpen: boolean;
  onClose?: () => void;
  onClosed?: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  overlayClassName?: string;
  className?: string;
  children: React.ReactNode;
};

/** @deprecated use Dialog2 instead */
export function Dialog({
  isOpen,
  onClose,
  onClosed,
  title,
  description,
  width,
  overlayClassName,
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
        className={clsx(
          'z-40 flex items-center justify-center bg-gradient-to-b from-gray/0 to-gray/15 p-2 backdrop-blur',
          overlayClassName,
        )}
        style={transitionStyles}
      >
        <FloatingFocusManager context={context}>
          <div
            ref={refs.setFloating}
            className={clsx(
              'max-h-full w-full overflow-y-auto rounded-lg bg-popover text-contrast-popover shadow-lg dark:border',
              {
                'max-w-sm': width === 'sm',
                'max-w-md': width === 'md',
                'max-w-lg': width === 'lg',
                'max-w-xl': width === 'xl',
                'max-w-2xl': width === '2xl',
                'max-w-3xl': width === '3xl',
                'max-w-4xl': width === '4xl',
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

const MotionFloatingOverlay = motion.create(FloatingOverlay);

type Dialog2Props = {
  open: boolean;
  onClose?: () => void;
  onClosed?: () => void;
  overlayClassName?: string;
  className?: string;
  children: React.ReactNode;
};

export function Dialog2({ open, onClose, onClosed, overlayClassName, className, children }: Dialog2Props) {
  const { refs, context } = useFloating({
    open: open,
    onOpenChange(open) {
      if (!open) {
        onClose?.();
      }
    },
  });

  const dismiss = useDismiss(context, { outsidePressEvent: 'mousedown' });
  const role = useRole(context, { role: 'dialog' });

  const { getFloatingProps } = useInteractions([dismiss, role]);

  return (
    <AnimatePresence onExitComplete={onClosed}>
      {open && (
        <FloatingPortal root={document.getElementById('root')}>
          <MotionFloatingOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration / 1000 }}
            lockScroll
            className={clsx(
              'z-40 flex items-center justify-center bg-black/5 p-2 backdrop-blur-md',
              overlayClassName,
            )}
          >
            <FloatingFocusManager context={context} initialFocus={-1}>
              <div
                ref={refs.setFloating}
                className={clsx(
                  'max-h-full overflow-y-auto rounded-lg bg-popover p-8 text-contrast-popover shadow-lg dark:border',
                  className,
                )}
                {...getFloatingProps()}
              >
                {children}
              </div>
            </FloatingFocusManager>
          </MotionFloatingOverlay>
        </FloatingPortal>
      )}
    </AnimatePresence>
  );
}

type DialogHeaderProps = {
  title: React.ReactNode;
  onClose?: () => void;
};

export function DialogHeader({ title, onClose }: DialogHeaderProps) {
  return (
    <header className="row items-center justify-between gap-4">
      <h2 className="text-2xl font-semibold">{title}</h2>

      <button type="button" className={clsx('focusable rounded', !onClose && 'hidden')} onClick={onClose}>
        <IconClose className="size-4" />
      </button>
    </header>
  );
}

export function DialogFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <footer className={clsx('row mt-2 items-center justify-end gap-2', className)}>{children}</footer>;
}
