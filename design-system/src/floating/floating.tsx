import {
  FloatingPortal,
  Middleware,
  Placement,
  safePolygon,
  Strategy,
  UseRoleProps,
} from '@floating-ui/react';

import { useFloating } from './use-floating';

type FloatingProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  strategy?: Strategy;
  placement?: Placement;
  middlewares?: Array<Middleware | false>;
  offset?: number;
  hover?: boolean;
  role?: UseRoleProps['role'];
  renderReference: (props: Record<string, unknown>) => React.ReactNode;
  renderFloating: (props: Record<string, unknown>) => React.ReactNode;
};

export function Floating({
  open,
  setOpen,
  strategy,
  placement,
  middlewares,
  offset,
  hover,
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
      hover: {
        enabled: hover ?? false,
        handleClose: safePolygon(),
      },
      role: {
        role,
      },
    },
  });

  return (
    <>
      {renderReference(getReferenceProps({ ref: setReference }))}

      {isMounted && (
        <FloatingPortal>
          {renderFloating(getFloatingProps({ ref: setFloating, style: styles }))}
        </FloatingPortal>
      )}
    </>
  );
}
