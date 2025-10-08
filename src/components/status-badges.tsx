import { Badge, BadgeColor, Spinner } from '@koyeb/design-system';
import clsx from 'clsx';

import { SvgProps } from 'src/application/types';
import {
  IconCircleAlert,
  IconCircleCheck,
  IconCircleDashed,
  IconCircleDot,
  IconCircleOff,
  IconCircleX,
  IconMoon,
  IconTrash,
} from 'src/icons';
import { TranslateStatus } from 'src/intl/translate';
import {
  DeploymentStatus,
  InstanceStatus,
  ServiceStatus,
  VolumeSnapshotStatus,
  VolumeStatus,
} from 'src/model';
import { Extend } from 'src/utils/types';

type ResourceStatusProps<Status> = {
  ref?: React.Ref<React.ComponentRef<typeof Badge>>;
  icon?: boolean;
  status: Status;
  className?: string;
};

function createResourceStatus<Status extends string>(
  map: Record<Status, [React.ComponentType<{ className?: string }>, BadgeColor]>,
) {
  function Icon({ status, className, ...props }: Extend<{ status: Status }, SvgProps>) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const [Icon, color] = map[status] ?? unknownStatusBadge;

    return <Icon className={clsx(colorMap[color], className)} {...props} />;
  }

  function ResourceStatus({ ref, icon = true, status, className }: ResourceStatusProps<Status>) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const [, color] = map[status] ?? unknownStatusBadge;

    return (
      <Badge
        ref={ref}
        size={1}
        color={color}
        className={clsx('inline-flex flex-row items-center gap-1', className)}
      >
        {icon && <Icon status={status} className="size-4" />}
        <TranslateStatus status={status} />
      </Badge>
    );
  }

  return [Icon, ResourceStatus] as const;
}

const unknownStatusBadge = [IconCircleDot, 'blue'] as const;

const colorMap: Record<BadgeColor, string> = {
  blue: clsx('text-blue'),
  red: clsx('text-red'),
  green: clsx('text-green'),
  orange: clsx('text-orange'),
  gray: clsx('text-gray'),
};

export const [ServiceStatusIcon, ServiceStatusBadge] = createResourceStatus<ServiceStatus>({
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

export const [DeploymentStatusIcon, DeploymentStatusBadge] = createResourceStatus<DeploymentStatus>({
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

export const [InstanceStatusIcon, InstanceStatusBadge] = createResourceStatus<InstanceStatus>({
  ALLOCATING: [Spinner, 'blue'],
  STARTING: [Spinner, 'blue'],
  HEALTHY: [IconCircleCheck, 'green'],
  UNHEALTHY: [IconCircleAlert, 'red'],
  STOPPING: [Spinner, 'gray'],
  STOPPED: [IconCircleOff, 'gray'],
  ERROR: [IconCircleAlert, 'red'],
  SLEEPING: [IconMoon, 'gray'],
});

export const [VolumeStatusIcon, VolumeStatusBadge] = createResourceStatus<VolumeStatus>({
  INVALID: [IconCircleX, 'red'],
  ATTACHED: [IconCircleCheck, 'green'],
  DETACHED: [IconCircleCheck, 'blue'],
  DELETING: [Spinner, 'orange'],
  DELETED: [IconTrash, 'red'],
});

export const [VolumeSnapshotStatusIcon, VolumeSnapshotStatusBadge] =
  createResourceStatus<VolumeSnapshotStatus>({
    INVALID: [IconCircleX, 'red'],
    CREATING: [Spinner, 'gray'],
    AVAILABLE: [IconCircleCheck, 'green'],
    MIGRATING: [Spinner, 'blue'],
    DELETING: [Spinner, 'orange'],
    DELETED: [IconTrash, 'red'],
  });
