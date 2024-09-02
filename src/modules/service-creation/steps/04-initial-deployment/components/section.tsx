import clsx from 'clsx';

import { Collapse, Spinner } from '@koyeb/design-system';
import { DeploymentBuildStatus, DeploymentStatus } from 'src/api/model';
import { IconChevronDown, IconCircleCheck, IconCircleDashed, IconCircleX } from 'src/components/icons';

type SectionProps = {
  title: React.ReactNode;
  description: React.ReactNode;
  children: React.ReactNode;
};

export function Section({ title, description, children }: SectionProps) {
  return (
    <section className="rounded-lg border">
      <header className="col gap-2 px-4 pb-6 pt-4">
        <span className="text-base font-medium">{title}</span>
        <span className="text-dim">{description}</span>
      </header>

      {children}
    </section>
  );
}

type SubSectionProps = {
  status: 'created' | DeploymentBuildStatus | DeploymentStatus;
  title: React.ReactNode;
  header?: React.ReactNode;
  expanded: boolean;
  toggleExpanded?: () => void;
  className?: string;
  children: React.ReactNode;
};

export function SubSection({
  status,
  title,
  header,
  expanded,
  toggleExpanded,
  className,
  children,
}: SubSectionProps) {
  const { Icon, className: colorClassName } = statusMap[status];

  return (
    <>
      <div
        // eslint-disable-next-line tailwindcss/no-arbitrary-value
        className={clsx(
          'grid grid-cols-[1fr_auto] items-center gap-4 border-t px-4 py-6 md:grid-cols-[auto_1fr_auto]',
          toggleExpanded !== undefined && 'cursor-pointer',
          toggleExpanded === undefined && 'opacity-50',
        )}
        onClick={toggleExpanded}
      >
        <div className="row items-center gap-2">
          <div>
            <IconChevronDown className={clsx('icon', expanded && 'rotate-180')} />
          </div>

          <div className="col gap-2">
            <div className="font-medium">{title}</div>
            <div className={clsx('capitalize', colorClassName)}>{status}</div>
          </div>
        </div>

        <div className="md:order-2">
          <Icon className={clsx('size-icon', colorClassName)} />
        </div>

        <div className="col-span-2 min-w-0 md:col-span-1">{header}</div>
      </div>

      <Collapse isExpanded={expanded}>
        <div className={clsx('mx-4 mb-6', className)}>{children}</div>
      </Collapse>
    </>
  );
}

const success = { Icon: IconCircleCheck, className: 'text-green' };
const pending = { Icon: IconCircleDashed, className: 'text-dim' };
const running = { Icon: Spinner, className: 'text-green' };
const error = { Icon: IconCircleX, className: 'text-red' };
const canceled = { Icon: IconCircleX, className: 'text-gray' };

const statusMap = {
  created: success,
  pending: pending,
  running: running,
  completed: success,
  failed: error,
  aborted: canceled,
  unknown: canceled,
  provisioning: pending,
  scheduled: running,
  canceling: canceled,
  canceled: canceled,
  allocating: running,
  starting: running,
  healthy: success,
  degraded: error,
  unhealthy: error,
  stopping: canceled,
  stopped: canceled,
  erroring: error,
  error: error,
  stashed: pending,
};
