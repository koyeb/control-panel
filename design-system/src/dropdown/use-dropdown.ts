import { flip, size } from '@floating-ui/react';

import { useFloating } from '../floating/use-floating';

export function useDropdown(open: boolean) {
  const { context, styles, setReference, setFloating } = useFloating({
    open,
    placement: 'bottom-start',
    middlewares: [
      flip(),
      size({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
          });
        },
      }),
    ],
  });

  return {
    open: context.open,
    placement: context.placement,
    styles,
    setReference,
    setFloating,
  };
}
