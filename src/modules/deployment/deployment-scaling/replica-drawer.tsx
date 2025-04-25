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
import { AnimatePresence, motion } from 'motion/react';

import { Button } from '@koyeb/design-system';
import { Replica } from 'src/api/model';
import { RegionFlag } from 'src/components/region-flag';
import { createTranslate, Translate } from 'src/intl/translate';

const T = createTranslate('modules.deployment.deploymentLogs.scaling.drawer');

const MotionFloatingOverlay = motion.create(FloatingOverlay);

type ReplicaDrawerProps = {
  open: boolean;
  onClose: () => void;
  replica: Replica;
};

export function ReplicaDrawer({ open, onClose, replica }: ReplicaDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} className="col gap-6 p-6">
      <div className="row items-center gap-2">
        <RegionFlag regionId={replica.region} className="size-5" />

        <div className="text-2xl font-medium">
          <T id="title" values={{ index: replica.index }} />
        </div>

        <Button color="gray" size={3} onClick={onClose} className="ms-auto">
          <Translate id="common.close" />
        </Button>
      </div>
    </Drawer>
  );
}

function useDrawer(open: boolean, onClose: () => void) {
  const floating = useFloating({
    open,
    onOpenChange: (open) => !open && onClose(),
  });

  const dismiss = useDismiss(floating.context, { outsidePressEvent: 'mousedown' });
  const role = useRole(floating.context, { role: 'dialog' });

  const { getFloatingProps } = useInteractions([dismiss, role]);

  return {
    floating,
    getFloatingProps,
  };
}

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactElement;
};

function Drawer({ open, onClose, className, children }: DrawerProps) {
  const drawer = useDrawer(open, onClose);
  const duration = 120;

  return (
    <FloatingPortal root={document.getElementById('root')}>
      <AnimatePresence>
        {open && (
          <MotionFloatingOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration / 1000 }}
            className="col z-40 items-center justify-center bg-neutral/50 backdrop-blur"
            lockScroll
          >
            <FloatingFocusManager context={drawer.floating.context}>
              <motion.div
                {...drawer.getFloatingProps()}
                ref={drawer.floating.refs.setFloating}
                initial={{ right: -160 }}
                animate={{ right: 0 }}
                exit={{ right: -160 }}
                transition={{ ease: 'easeOut' }}
                className={clsx('fixed inset-y-0 right-0 w-full max-w-4xl bg-neutral shadow-lg', className)}
              >
                {children}
              </motion.div>
            </FloatingFocusManager>
          </MotionFloatingOverlay>
        )}
      </AnimatePresence>
    </FloatingPortal>
  );
}
