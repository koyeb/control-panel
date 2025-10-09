import { Button, useBreakpoint } from '@koyeb/design-system';
import { TooltipDesktop, TooltipMobile } from '@koyeb/design-system/next';
import clsx from 'clsx';

import { IconInfo } from 'src/icons';
import { Translate } from 'src/intl/translate';

export function Tooltip({
  mobile = true,
  className,
  ...props
}: React.ComponentProps<typeof TooltipDesktop> & { mobile?: boolean }) {
  const isMobile = !useBreakpoint('sm');
  const Element = mobile && isMobile ? TooltipMobile : TooltipDesktop;

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

export function InfoTooltip({ className, ...props }: Omit<React.ComponentProps<typeof Tooltip>, 'trigger'>) {
  return (
    <Tooltip
      {...props}
      allowHover
      className={clsx('max-w-lg', className)}
      trigger={(props) => (
        <div {...props}>
          <IconInfo className="size-3.5 text-dim" />
        </div>
      )}
    />
  );
}
