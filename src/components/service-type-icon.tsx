import clsx from 'clsx';

import {
  IconBox,
  IconCpu,
  IconDatabase,
  IconGlobeLock,
  IconPackage,
  IconSquareCode,
  IconWorkflow,
} from 'src/icons';
import { ServiceType } from 'src/model';

type ServiceTypeIconProps = {
  type: ServiceType | 'sandbox' | 'private' | 'batch' | 'model';
  size?: 1 | 2 | 3 | 4;
};

export function ServiceTypeIcon({ type, size = 3 }: ServiceTypeIconProps) {
  const { Icon, className } = {
    web: { Icon: IconSquareCode, className: clsx('bg-green text-zinc-50') },
    private: { Icon: IconGlobeLock, className: clsx('bg-red text-zinc-50') },
    worker: { Icon: IconCpu, className: clsx('bg-orange text-zinc-50') },
    sandbox: { Icon: IconBox, className: clsx('bg-purple text-zinc-50') },
    database: { Icon: IconDatabase, className: clsx('bg-blue text-zinc-50') },
    batch: { Icon: IconWorkflow, className: clsx('bg-inverted text-neutral') },
    model: { Icon: IconPackage, className: clsx('bg-inverted text-neutral') },
  }[type];

  return (
    <span
      className={clsx(
        {
          'rounded-lg p-1.5': size === 4,
          'rounded-md p-1': size === 3,
          'rounded-sm p-0.5': size === 2,
          'rounded-xs p-px': size === 1,
        },
        className,
      )}
    >
      <Icon
        className={clsx({
          'size-6': size === 4,
          'size-4': size === 3,
          'size-3': size === 2,
          'size-2.5': size === 1,
        })}
      />
    </span>
  );
}
