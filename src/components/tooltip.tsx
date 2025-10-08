import { Button, useBreakpoint } from '@koyeb/design-system';
import { TooltipDesktop, TooltipMobile } from '@koyeb/design-system/next';
import clsx from 'clsx';

import { Translate } from 'src/intl/translate';

export function Tooltip({ className, ...props }: React.ComponentProps<typeof TooltipDesktop>) {
  const isMobile = !useBreakpoint('sm');
  const Element = isMobile ? TooltipMobile : TooltipDesktop;

  return (
    <Element
      placement="top"
      className={clsx('md:text-xs', className)}
      root={document.getElementById('root') ?? undefined}
      closeButton={(onClick) => (
        <Button className="mt-10 w-full" onClick={onClick}>
          <Translate id="common.close" />
        </Button>
      )}
      {...props}
    />
  );
}
