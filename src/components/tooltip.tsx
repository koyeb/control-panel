import { Tooltip as BaseTooltip, Button } from '@koyeb/design-system';
import clsx from 'clsx';

import { IconInfo } from 'src/icons';
import { Translate } from 'src/intl/translate';
import { Extend } from 'src/utils/types';

type TooltipProps = Extend<
  React.ComponentProps<typeof BaseTooltip>,
  {
    content: React.ReactNode;
  }
>;

export function Tooltip({ className, content, ...props }: TooltipProps) {
  return (
    <BaseTooltip
      placement="top"
      className={clsx('md:text-xs', className)}
      root={document.getElementById('root')}
      content={content ? (props) => <TooltipContent content={content} {...props} /> : undefined}
      {...props}
    />
  );
}

function TooltipContent({ content, onClose }: { content: React.ReactNode; onClose: () => void }) {
  return (
    <>
      {content}

      <Button className="my-10 w-full sm:hidden" onClick={onClose}>
        <Translate id="common.close" />
      </Button>
    </>
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
