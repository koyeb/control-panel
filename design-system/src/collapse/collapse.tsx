import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';

const hidden = { opacity: 0.5, height: 0 };
const visible = { opacity: 1, height: 'auto' };

type CollapseProps = {
  open: boolean;
  keepMounted?: boolean;
  children: React.ReactNode;
};

export function Collapse({ open, keepMounted, children }: CollapseProps) {
  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence initial={false}>
        {(open || keepMounted) && (
          <m.div
            initial={hidden}
            animate={open ? visible : hidden}
            exit={hidden}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            {children}
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
