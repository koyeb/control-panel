import { AccordionSection } from '@koyeb/design-system';
import clsx from 'clsx';

import { IconChevronDown } from 'src/components/icons';
import { TextSkeleton } from 'src/components/skeleton';
import { createArray } from 'src/utils/arrays';

type ServiceFormSkeletonProps = {
  className?: string;
};

export function ServiceFormSkeleton({ className }: ServiceFormSkeletonProps) {
  return (
    <div className={clsx('rounded-lg border', className)}>
      {createArray(7, (index) => (
        <AccordionSection
          key={index}
          isExpanded={false}
          header={
            <header className="row items-center gap-6 px-5 py-2.5">
              <IconChevronDown className="size-5 text-icon" />

              <div className="col gap-1">
                <span className="text-xs text-dim">
                  <TextSkeleton width={12} />
                </span>
                <span className="font-medium">
                  <TextSkeleton width={5} />
                </span>
              </div>

              <div className="ms-auto">
                <TextSkeleton width={3} />
              </div>
            </header>
          }
        />
      ))}
    </div>
  );
}
