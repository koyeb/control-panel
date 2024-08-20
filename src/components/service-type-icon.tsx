import clsx from 'clsx';
import IconCpu from 'lucide-static/icons/cpu.svg?react';
import IconDatabase from 'lucide-static/icons/database.svg?react';
import IconGlobeLock from 'lucide-static/icons/globe-lock.svg?react';
import IconSquareCode from 'lucide-static/icons/square-code.svg?react';
import IconWorkflow from 'lucide-static/icons/workflow.svg?react';

import { ServiceType } from 'src/api/model';

type ServiceTypeIconProps = {
  type: ServiceType | 'private' | 'batch';
  size?: 'small' | 'medium' | 'big';
};

export function ServiceTypeIcon({ type, size = 'big' }: ServiceTypeIconProps) {
  const { Icon, className } = {
    web: { Icon: IconSquareCode, className: clsx('bg-green text-contrast-green') },
    private: { Icon: IconGlobeLock, className: clsx('bg-red text-contrast-red') },
    worker: { Icon: IconCpu, className: clsx('bg-orange text-contrast-orange') },
    database: { Icon: IconDatabase, className: clsx('bg-blue text-contrast-blue') },
    batch: { Icon: IconWorkflow, className: clsx('bg-inverted text-inverted') },
  }[type];

  return (
    <span
      className={clsx(
        {
          'rounded-lg p-1.5': size === 'big',
          'rounded-md p-1': size === 'medium',
          'rounded p-0.5': size === 'small',
        },
        className,
      )}
    >
      <Icon
        className={clsx({
          'size-6': size === 'big',
          'size-4': size === 'medium',
          'size-3': size === 'small',
        })}
      />
    </span>
  );
}
