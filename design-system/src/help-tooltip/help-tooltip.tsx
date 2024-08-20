import clsx from 'clsx';
import IconHelp from 'lucide-static/icons/circle-help.svg?react';
import IconInfo from 'lucide-static/icons/info.svg?react';

import { Tooltip } from '../tooltip/tooltip';

type HelpProps = {
  icon?: 'help' | 'info';
  className?: string;
  children: React.ReactNode;
};

export function HelpTooltip({ icon = 'help', className, children }: HelpProps) {
  const Icon = icon === 'help' ? IconHelp : IconInfo;

  return (
    <Tooltip content={children}>
      {(props) => <Icon {...props} className={clsx('icon inline-block !size-4', className)} />}
    </Tooltip>
  );
}
