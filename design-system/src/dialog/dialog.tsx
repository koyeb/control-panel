import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import IconClose from 'lucide-static/icons/x.svg?react';

const duration = 140;

const MotionFloatingOverlay = motion.create(FloatingOverlay);

type DialogProps = {
  open: boolean;
  onClose?: () => void;
  onClosed?: () => void;
  overlayClassName?: string;
  className?: string;
  children: React.ReactNode;
};

export function Dialog({ open, onClose, onClosed, overlayClassName, className, children }: DialogProps) {
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
