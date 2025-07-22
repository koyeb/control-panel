import clsx from 'clsx';

import { ServiceType } from 'src/api/model';
import { IconCpu, IconDatabase, IconGlobeLock, IconPackage, IconSquareCode, IconWorkflow } from 'src/icons';

type ServiceTypeIconProps = {
  type: ServiceType | 'private' | 'batch' | 'model';
  size?: 'small' | 'medium' | 'big';
};

export function ServiceTypeIcon({ type, size = 'big' }: ServiceTypeIconProps) {
  const { Icon, className } = {
    web: { Icon: IconSquareCode, className: clsx('bg-green text-zinc-50') },
    private: { Icon: IconGlobeLock, className: clsx('bg-red text-zinc-50') },
    worker: { Icon: IconCpu, className: clsx('bg-orange text-zinc-50') },
    database: { Icon: IconDatabase, className: clsx('bg-blue text-zinc-50') },
    batch: { Icon: IconWorkflow, className: clsx('bg-inverted text-neutral') },
    model: { Icon: IconPackage, className: clsx('bg-inverted text-neutral') },
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
