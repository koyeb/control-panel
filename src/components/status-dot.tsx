import clsx from 'clsx';

import { AppStatus, DomainStatus, InstanceStatus, ServiceStatus } from 'src/api/model';

type StatusDotProps<Status extends string> = {
  status: Status;
  className?: string;
};

function createStatusDotComponent<Status extends string>(colors: Record<Status, string>) {
  return function StatusDot({ status, className }: StatusDotProps<Status>) {
    return <span className={clsx('inline-block rounded-full', colors[status], className)} />;
  };
}

export const AppStatusDot = createStatusDotComponent<AppStatus>({
  starting: clsx('animate-pulse bg-blue'),
  healthy: clsx('bg-green'),
  degraded: clsx('bg-orange'),
  unhealthy: clsx('bg-red'),
  deleting: clsx('animate-pulse bg-inverted'),
  deleted: clsx('bg-inverted'),
  pausing: clsx('animate-pulse bg-inverted'),
  paused: clsx('bg-inverted'),
  resuming: clsx('animate-pulse bg-blue'),
});

export const ServiceStatusDot = createStatusDotComponent<ServiceStatus>({
  starting: clsx('animate-pulse bg-blue'),
  healthy: clsx('bg-green'),
  degraded: clsx('bg-orange'),
  unhealthy: clsx('bg-red'),
  deleting: clsx('animate-pulse bg-inverted'),
  deleted: clsx('bg-inverted'),
  pausing: clsx('animate-pulse bg-inverted'),
  paused: clsx('bg-inverted'),
  resuming: clsx('animate-pulse bg-blue'),
});

export const InstanceStatusDot = createStatusDotComponent<InstanceStatus>({
  allocating: clsx('animate-pulse bg-green'),
  starting: clsx('animate-pulse bg-green'),
  healthy: clsx('bg-green'),
  unhealthy: clsx('bg-red'),
  stopping: clsx('animate-pulse bg-gray'),
  stopped: clsx('bg-gray'),
  error: clsx('bg-red'),
  sleeping: clsx('animate-pulse bg-gray'),
});

export const DomainStatusDot = createStatusDotComponent<DomainStatus>({
  pending: clsx('animate-pulse bg-blue'),
  active: clsx('bg-green'),
  error: clsx('bg-red'),
  deleting: clsx('animate-pulse bg-gray'),
  deleted: clsx('bg-gray'),
});
