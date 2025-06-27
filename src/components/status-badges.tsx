import { Badge, BadgeColor, Spinner } from '@koyeb/design-system';
import clsx from 'clsx';

import {
  DeploymentStatus,
  InstanceStatus,
  ServiceStatus,
  VolumeSnapshotStatus,
  VolumeStatus,
} from 'src/api/model';
import {
  IconCircleAlert,
  IconCircleCheck,
  IconCircleDashed,
  IconCircleDot,
  IconCircleOff,
  IconCircleX,
  IconMoon,
  IconTrash,
} from 'src/components/icons';
import { TranslateStatus } from 'src/intl/translate';

type ResourceStatusProps<Status> = {
  ref?: React.Ref<React.ComponentRef<typeof Badge>>;
  status: Status;
  className?: string;
};

function createResourceStatus<Status extends string>(
  map: Record<Status, [React.ComponentType<{ className?: string }>, BadgeColor]>,
) {
  return function ResourceStatus({ ref, status, className }: ResourceStatusProps<Status>) {
    const [Icon, color] = map[status] ?? unknownStatusBadge;

    return (
      <Badge
        ref={ref}
        size={1}
        color={color}
        className={clsx('inline-flex flex-row items-center gap-1', className)}
      >
        <Icon className="size-4" />
        <TranslateStatus status={status} />
      </Badge>
    );
  };
}

const unknownStatusBadge = [IconCircleDot, 'blue'] as const;

export const ServiceStatusBadge = createResourceStatus<ServiceStatus>({
  STARTING: [Spinner, 'gray'],
  HEALTHY: [IconCircleCheck, 'green'],
  DEGRADED: [IconCircleAlert, 'orange'],
  UNHEALTHY: [IconCircleAlert, 'red'],
  DELETING: [Spinner, 'gray'],
  DELETED: [IconCircleOff, 'gray'],
  PAUSING: [Spinner, 'gray'],
  PAUSED: [IconCircleOff, 'gray'],
  RESUMING: [Spinner, 'gray'],
});

export const DeploymentStatusBadge = createResourceStatus<DeploymentStatus>({
  PENDING: [IconCircleDashed, 'gray'],
  PROVISIONING: [Spinner, 'blue'],
  SCHEDULED: [IconCircleCheck, 'blue'],
  CANCELING: [Spinner, 'gray'],
  CANCELED: [IconCircleOff, 'gray'],
  ALLOCATING: [Spinner, 'blue'],
  STARTING: [Spinner, 'blue'],
  HEALTHY: [IconCircleCheck, 'green'],
  DEGRADED: [IconCircleAlert, 'orange'],
  UNHEALTHY: [IconCircleAlert, 'red'],
  STOPPING: [Spinner, 'gray'],
  STOPPED: [IconCircleOff, 'gray'],
  ERRORING: [Spinner, 'red'],
  ERROR: [IconCircleAlert, 'red'],
  STASHED: [IconCircleOff, 'gray'],
  SLEEPING: [IconMoon, 'gray'],
});

export const InstanceStatusBadge = createResourceStatus<InstanceStatus>({
  ALLOCATING: [Spinner, 'blue'],
  STARTING: [Spinner, 'blue'],
  HEALTHY: [IconCircleCheck, 'green'],
  UNHEALTHY: [IconCircleAlert, 'red'],
  STOPPING: [Spinner, 'gray'],
  STOPPED: [IconCircleOff, 'gray'],
  ERROR: [IconCircleAlert, 'red'],
  SLEEPING: [IconMoon, 'gray'],
});

export const VolumeStatusBadge = createResourceStatus<VolumeStatus>({
  INVALID: [IconCircleX, 'red'],
  ATTACHED: [IconCircleCheck, 'green'],
  DETACHED: [IconCircleCheck, 'blue'],
  DELETING: [Spinner, 'orange'],
  DELETED: [IconTrash, 'red'],
});

export const VolumeSnapshotStatusBadge = createResourceStatus<VolumeSnapshotStatus>({
  INVALID: [IconCircleX, 'red'],
  CREATING: [Spinner, 'gray'],
  AVAILABLE: [IconCircleCheck, 'green'],
  MIGRATING: [Spinner, 'blue'],
  DELETING: [Spinner, 'orange'],
  DELETED: [IconTrash, 'red'],
});
