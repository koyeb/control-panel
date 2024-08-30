import { FloatingPortal, Middleware, Placement, Strategy, UseRoleProps } from '@floating-ui/react';

import { useFloating } from './use-floating';

type FloatingProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  strategy?: Strategy;
  placement?: Placement;
  middlewares?: Array<Middleware | false>;
  offset?: number;
  role?: UseRoleProps['role'];
  renderReference: (ref: React.RefCallback<Element>, props: Record<string, unknown>) => React.ReactNode;
  renderFloating: (ref: React.RefCallback<Element>, props: Record<string, unknown>) => React.ReactNode;
};

export function Floating({
  open,
  setOpen,
  strategy,
  placement,
  middlewares,
  offset,
  role,
  renderReference,
  renderFloating,
}: FloatingProps) {
  const { setReference, getReferenceProps, setFloating, getFloatingProps, isMounted, styles } = useFloating({
    open,
    setOpen,
    strategy,
    placement,
    middlewares,
    offset,
    interactions: {
      hover: { enabled: false },
      role: { role },
    },
  });

  return (
    <>
      {renderReference(setReference, getReferenceProps())}

      {isMounted && (
        <FloatingPortal>
          {renderFloating(setFloating, { style: styles, ...getFloatingProps() })}
        </FloatingPortal>
      )}
    </>
  );
}
