import clsx from 'clsx';
import IconSparkles from 'lucide-static/icons/sparkles.svg?react';

import { Badge } from '@koyeb/design-system';
import { Translate } from 'src/intl/translate';

export function BadgeNew({ className }: { className?: string }) {
  return (
    <Badge size={1} color="green" className={clsx('inline-flex flex-row items-center gap-1', className)}>
      <IconSparkles className="inline-block size-4 align-middle" />
      <Translate id="common.new" />
    </Badge>
  );
}
