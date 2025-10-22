import clsx from 'clsx';

import { AppStatus, DomainStatus, InstanceStatus, ServiceStatus } from 'src/model';
import { Extend } from 'src/utils/types';

type StatusDotProps<Status extends string> = Extend<
  React.ComponentProps<'span'>,
  {
    status: Status;
  }
>;

function createStatusDotComponent<Status extends string>(colors: Record<Status, string>) {
  return function StatusDot({ status, className, ...props }: StatusDotProps<Status>) {
    return <span className={clsx('inline-block rounded-full', colors[status], className)} {...props} />;
  };
}

export const AppStatusDot = createStatusDotComponent<AppStatus>({
  STARTING: clsx('animate-pulse bg-blue'),
  HEALTHY: clsx('bg-green'),
  DEGRADED: clsx('bg-orange'),
  UNHEALTHY: clsx('bg-red'),
  DELETING: clsx('animate-pulse bg-inverted'),
  DELETED: clsx('bg-inverted'),
  PAUSING: clsx('animate-pulse bg-inverted'),
  PAUSED: clsx('bg-inverted'),
  RESUMING: clsx('animate-pulse bg-blue'),
});

export const ServiceStatusDot = createStatusDotComponent<ServiceStatus>({
  STARTING: clsx('animate-pulse bg-blue'),
  HEALTHY: clsx('bg-green'),
  DEGRADED: clsx('bg-orange'),
  UNHEALTHY: clsx('bg-red'),
  DELETING: clsx('animate-pulse bg-inverted'),
  DELETED: clsx('bg-inverted'),
  PAUSING: clsx('animate-pulse bg-inverted'),
  PAUSED: clsx('bg-inverted'),
  RESUMING: clsx('animate-pulse bg-blue'),
});

export const InstanceStatusDot = createStatusDotComponent<InstanceStatus>({
  ALLOCATING: clsx('animate-pulse bg-green'),
  STARTING: clsx('animate-pulse bg-green'),
  HEALTHY: clsx('bg-green'),
  UNHEALTHY: clsx('bg-red'),
  STOPPING: clsx('animate-pulse bg-gray'),
  STOPPED: clsx('bg-gray'),
  ERROR: clsx('bg-red'),
  SLEEPING: clsx('animate-pulse bg-gray'),
});

export const DomainStatusDot = createStatusDotComponent<DomainStatus>({
  PENDING: clsx('animate-pulse bg-blue'),
  ACTIVE: clsx('bg-green'),
  ERROR: clsx('bg-red'),
  DELETING: clsx('animate-pulse bg-gray'),
  DELETED: clsx('bg-gray'),
});
