import { Placement, Strategy, arrow, safePolygon } from '@floating-ui/react';
import { useRef } from 'react';

import { useFloating } from '../floating/use-floating';

const arrowSize = 6;
const gap = 6;

export type UseTooltipProps = {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  referenceElement?: HTMLElement | null;
  placement?: Placement;
  strategy?: Strategy;
  arrow?: boolean;
  allowHover?: boolean;
  offset?: number;
};

export function useTooltip({
  open,
  setOpen,
  referenceElement,
  placement = 'bottom',
  strategy,
  arrow: showArrow = true,
  allowHover = false,
  offset,
}: UseTooltipProps) {
  const arrowElement = useRef<SVGSVGElement>(null);

  const result = useFloating({
    open,
    setOpen,
    placement,
    strategy,
    referenceElement,
    offset: (showArrow ? arrowSize : 0) + (offset ?? gap),
    middlewares: [showArrow && arrow({ element: arrowElement })],
    interactions: {
      hover: {
        move: false,
        handleClose: allowHover ? safePolygon() : undefined,
      },
      role: {
        role: 'tooltip',
      },
    },
  });

  return {
    ...result,
    arrowSize,
    arrowElement,
  };
}
