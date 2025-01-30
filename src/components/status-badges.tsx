import clsx from 'clsx';
import { ComponentProps } from 'react';

import { Badge, BadgeColor, Spinner } from '@koyeb/design-system';
import { DeploymentStatus, InstanceStatus, ServiceStatus, Volume, VolumeSnapshot } from 'src/api/model';
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
import { TranslateEnum } from 'src/intl/translate';

type ResourceStatusProps<Status> = {
  ref?: React.Ref<React.ComponentRef<typeof Badge>>;
  status: Status;
  // todo: make enum required
  enum?: React.ComponentProps<typeof TranslateEnum>['enum'];
  className?: string;
};

function createResourceStatus<Status extends string>(
  map: Record<Status, [React.ComponentType<{ className?: string }>, BadgeColor]>,
) {
  return function ResourceStatus({ ref, status, enum: enumName, className }: ResourceStatusProps<Status>) {
    const [Icon, color] = map[status] ?? unknownStatusBadge;

    return (
      <Badge
        ref={ref}
        size={1}
        color={color}
        className={clsx('inline-flex flex-row items-center gap-1', className)}
      >
        <Icon className="size-4" />

        {enumName ? (
          <span>
            <TranslateEnum enum={enumName} value={status as ComponentProps<typeof TranslateEnum>['value']} />
          </span>
        ) : (
          <span className="capitalize">{status}</span>
        )}
      </Badge>
    );
  };
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

export const VolumeStatusBadge = createResourceStatus<Volume['status']>({
  PERSISTENT_VOLUME_STATUS_INVALID: [IconCircleX, 'red'],
  PERSISTENT_VOLUME_STATUS_ATTACHED: [IconCircleCheck, 'green'],
  PERSISTENT_VOLUME_STATUS_DETACHED: [IconCircleCheck, 'blue'],
  PERSISTENT_VOLUME_STATUS_DELETING: [Spinner, 'orange'],
  PERSISTENT_VOLUME_STATUS_DELETED: [IconTrash, 'red'],
});

export const VolumeSnapshotStatusBadge = createResourceStatus<VolumeSnapshot['status']>({
  SNAPSHOT_STATUS_INVALID: [IconCircleX, 'red'],
  SNAPSHOT_STATUS_CREATING: [Spinner, 'gray'],
  SNAPSHOT_STATUS_AVAILABLE: [IconCircleCheck, 'green'],
  SNAPSHOT_STATUS_MIGRATING: [Spinner, 'blue'],
  SNAPSHOT_STATUS_DELETING: [Spinner, 'orange'],
  SNAPSHOT_STATUS_DELETED: [IconTrash, 'red'],
});
