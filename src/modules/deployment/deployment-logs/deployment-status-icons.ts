import { Spinner } from '@koyeb/design-system';
import clsx from 'clsx';

import { DeploymentBuildStatus, DeploymentStatus } from 'src/api/model';
import { IconCircleAlert, IconCircleCheck, IconCircleDashed, IconCircleX } from 'src/components/icons';
import { ValueOf } from 'src/utils/types';

const statuses = {
  pending: [IconCircleDashed, clsx('text-dim')],
  inProgress: [Spinner, clsx('text-gray')],
  warning: [IconCircleAlert, clsx('text-orange')],
  error: [IconCircleX, clsx('text-red')],
  success: [IconCircleCheck, clsx('text-green')],
  canceled: [IconCircleX, clsx('text-gray')],
} satisfies Record<string, [React.ComponentType<{ className?: string }>, string]>;

export const buildStatusMap: Record<DeploymentBuildStatus, ValueOf<typeof statuses>> = {
  UNKNOWN: statuses.canceled,
  PENDING: statuses.pending,
  RUNNING: statuses.inProgress,
  FAILED: statuses.error,
  COMPLETED: statuses.success,
  ABORTED: statuses.canceled,
};

export const runtimeStatusMap: Record<DeploymentStatus, ValueOf<typeof statuses>> = {
  PENDING: statuses.pending,
  PROVISIONING: statuses.pending,
  SCHEDULED: statuses.inProgress,
  CANCELING: statuses.inProgress,
  CANCELED: statuses.canceled,
  ALLOCATING: statuses.inProgress,
  STARTING: statuses.inProgress,
  HEALTHY: statuses.success,
  DEGRADED: statuses.warning,
  UNHEALTHY: statuses.error,
  STOPPING: statuses.inProgress,
  STOPPED: statuses.canceled,
  ERRORING: statuses.inProgress,
  ERROR: statuses.error,
  STASHED: statuses.canceled,
  SLEEPING: statuses.success,
};
