import clsx from 'clsx';

import { Badge } from '@koyeb/design-system';
import { IconSparkles } from 'src/components/icons';
import { Translate } from 'src/intl/translate';

export function BadgeNew({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <Badge size={1} color="green" className={clsx('inline-flex flex-row items-center gap-1', className)}>
      <IconSparkles className="inline-block size-4 align-middle" />
      {children ?? <Translate id="common.new" />}
    </Badge>
  );
}
