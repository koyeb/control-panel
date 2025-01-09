import clsx from 'clsx';
import { forwardRef } from 'react';

import { Badge, BadgeColor, Spinner } from '@koyeb/design-system';
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

type ResourceStatusProps<Status> = {
  status: Status;
  className?: string;
};

function createResourceStatus<Status extends string>(
  map: Record<Status, [React.ComponentType<{ className?: string }>, BadgeColor]>,
) {
  function ResourceStatus(
    { status, className }: ResourceStatusProps<Status>,
    ref: React.ForwardedRef<HTMLSpanElement>,
  ) {
    const [Icon, color] = map[status] ?? unknownStatusBadge;

    return (
      <Badge
        ref={ref}
        size={1}
        color={color}
        className={clsx('inline-flex flex-row items-center gap-1', className)}
      >
        <Icon className="size-4" />
        <span className="capitalize">{status}</span>
      </Badge>
    );
  }

  return forwardRef(ResourceStatus);
}

const unknownStatusBadge = [IconCircleDot, 'blue'] as const;

export const ServiceStatusBadge = createResourceStatus<ServiceStatus>({
  starting: [Spinner, 'gray'],
  healthy: [IconCircleCheck, 'green'],
  degraded: [IconCircleAlert, 'orange'],
  unhealthy: [IconCircleAlert, 'red'],
  deleting: [Spinner, 'gray'],
  deleted: [IconCircleOff, 'gray'],
  pausing: [Spinner, 'gray'],
  paused: [IconCircleOff, 'gray'],
  resuming: [Spinner, 'gray'],
});

export const DeploymentStatusBadge = createResourceStatus<DeploymentStatus>({
  pending: [IconCircleDashed, 'gray'],
  provisioning: [Spinner, 'blue'],
  scheduled: [IconCircleCheck, 'blue'],
  canceling: [Spinner, 'gray'],
  canceled: [IconCircleOff, 'gray'],
  allocating: [Spinner, 'blue'],
  starting: [Spinner, 'blue'],
  healthy: [IconCircleCheck, 'green'],
  degraded: [IconCircleAlert, 'orange'],
  unhealthy: [IconCircleAlert, 'red'],
  stopping: [Spinner, 'gray'],
  stopped: [IconCircleOff, 'gray'],
  erroring: [Spinner, 'red'],
  error: [IconCircleAlert, 'red'],
  stashed: [IconCircleOff, 'gray'],
  sleeping: [IconMoon, 'gray'],
});

export const InstanceStatusBadge = createResourceStatus<InstanceStatus>({
  allocating: [Spinner, 'blue'],
  starting: [Spinner, 'blue'],
  healthy: [IconCircleCheck, 'green'],
  unhealthy: [IconCircleAlert, 'red'],
  stopping: [Spinner, 'gray'],
  stopped: [IconCircleOff, 'gray'],
  error: [IconCircleAlert, 'red'],
  sleeping: [IconMoon, 'gray'],
});

export const VolumeStatusBadge = createResourceStatus<VolumeStatus>({
  invalid: [IconCircleX, 'red'],
  attached: [IconCircleCheck, 'green'],
  detached: [IconCircleCheck, 'blue'],
  deleting: [Spinner, 'orange'],
  deleted: [IconTrash, 'red'],
});

export const VolumeSnapshotStatusBadge = createResourceStatus<VolumeSnapshotStatus>({
  invalid: [IconCircleX, 'red'],
  creating: [Spinner, 'gray'],
  available: [IconCircleCheck, 'green'],
  migrating: [Spinner, 'blue'],
  deleting: [Spinner, 'orange'],
  deleted: [IconTrash, 'red'],
});
