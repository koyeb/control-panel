import clsx from 'clsx';

import { Spinner } from '@koyeb/design-system';
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
  unknown: statuses.canceled,
  pending: statuses.pending,
  running: statuses.inProgress,
  failed: statuses.error,
  completed: statuses.success,
  aborted: statuses.canceled,
};

export const runtimeStatusMap: Record<DeploymentStatus, ValueOf<typeof statuses>> = {
  pending: statuses.pending,
  provisioning: statuses.pending,
  scheduled: statuses.inProgress,
  canceling: statuses.inProgress,
  canceled: statuses.canceled,
  allocating: statuses.inProgress,
  starting: statuses.inProgress,
  healthy: statuses.success,
  degraded: statuses.warning,
  unhealthy: statuses.error,
  stopping: statuses.inProgress,
  stopped: statuses.canceled,
  erroring: statuses.inProgress,
  error: statuses.error,
  stashed: statuses.canceled,
  sleeping: statuses.success,
};
