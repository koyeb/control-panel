import clsx from 'clsx';
import IconCircleAlert from 'lucide-static/icons/circle-alert.svg?react';
import IconCircleCheck from 'lucide-static/icons/circle-check.svg?react';
import IconCircleDashed from 'lucide-static/icons/circle-dashed.svg?react';
import IconCircleX from 'lucide-static/icons/circle-x.svg?react';
import React, { useState } from 'react';

import { AccordionHeader, AccordionSection, Spinner } from '@koyeb/design-system';
import {
  App,
  ComputeDeployment,
  DeploymentBuild,
  DeploymentBuildStatus,
  DeploymentStatus,
  Instance,
  LogLine,
  Service,
} from 'src/api/model';
import { hasBuild } from 'src/application/service-functions';
import { useObserve } from 'src/hooks/lifecycle';
import { useLogs } from 'src/hooks/logs';
import { Translate } from 'src/intl/translate';

import { BuildLogs } from './build-logs';
import { Replicas } from './replicas';
import { RuntimeLogs } from './runtime-logs';

type DeploymentPhase = 'build' | 'runtime';

const T = Translate.prefix('deploymentLogs');

type DeploymentLogsProps = {
  app: App;
  service: Service;
  deployment: ComputeDeployment;
  instances: Instance[];
};

export function DeploymentLogs({ app, service, deployment, instances }: DeploymentLogsProps) {
  const [expanded, setExpanded] = useState(() => getInitialPhase(deployment));

  useAutoExpandSection(setExpanded, deployment);

  const toggleExpanded = (phase: DeploymentPhase) => {
    if (phase === expanded) {
      setExpanded(null);
    } else {
      setExpanded(phase);
    }
  };

  const buildExpanded = expanded === 'build';
  const buildLogs = useLogs(deployment.id, 'build', connectToBuildLogs(deployment, buildExpanded));

  const runtimeExpanded = expanded === 'runtime';
  const runtimeLogs = useLogs(deployment.id, 'runtime', connectToRuntimeLogs(deployment, runtimeExpanded));

  return (
    <div className="rounded-md border">
      {hasBuild(deployment) && (
        <AccordionSection
          isExpanded={buildExpanded}
          header={
            <BuildSectionHeader
              expanded={buildExpanded}
              setExpanded={canToggleBuild(deployment) && (() => toggleExpanded('build'))}
              deployment={deployment}
              lines={buildLogs.lines}
            />
          }
        >
          <div className="p-4">
            <BuildLogs app={app} service={service} deployment={deployment} {...buildLogs} />
          </div>
        </AccordionSection>
      )}

      <AccordionSection
        isExpanded={runtimeExpanded}
        header={
          <RuntimeSectionHeader
            expanded={runtimeExpanded}
            setExpanded={canToggleRuntime(deployment) && (() => toggleExpanded('runtime'))}
            deployment={deployment}
            lines={runtimeLogs.lines}
          />
        }
      >
        <div className="col gap-4 p-4">
          <RuntimeLogs
            app={app}
            service={service}
            deployment={deployment}
            instances={instances}
            {...runtimeLogs}
          />
          {instances.length > 0 && <Replicas instances={instances} />}
        </div>
      </AccordionSection>
    </div>
  );
}

function getInitialPhase(deployment: ComputeDeployment): DeploymentPhase | null {
  if (canToggleBuild(deployment) && !canToggleRuntime(deployment)) {
    return 'build';
  }

  if (canToggleRuntime(deployment)) {
    return 'runtime';
  }

  return null;
}

function canToggleBuild(deployment: ComputeDeployment) {
  if (deployment.status === 'canceled') {
    return false;
  }

  return deployment.buildSkipped || deployment.build !== undefined;
}

function canToggleRuntime(deployment: ComputeDeployment) {
  if (deployment.status === 'canceled') {
    return false;
  }

  return !hasBuild(deployment) || deployment.buildSkipped || deployment.build?.status === 'completed';
}

function connectToBuildLogs(deployment: ComputeDeployment, expanded: boolean) {
  if (!hasBuild(deployment)) {
    return false;
  }

  return expanded || deployment.build?.status === 'running';
}

function connectToRuntimeLogs(deployment: ComputeDeployment, expanded: boolean) {
  return expanded || deployment.status === 'starting';
}

function useAutoExpandSection(set: (values: DeploymentPhase | null) => void, deployment: ComputeDeployment) {
  useObserve(
    [canToggleBuild(deployment), canToggleRuntime(deployment)] as const,
    ([canToggleBuild, canToggleRuntime]) => {
      if (!canToggleBuild && !canToggleRuntime) {
        set(null);
      }

      if (canToggleBuild && !canToggleRuntime) {
        set('build');
      }

      if (canToggleRuntime) {
        set('runtime');
      }
    },
  );
}

type BuildSectionHeaderProps = {
  expanded: boolean;
  setExpanded: ((expanded: boolean) => void) | false;
  deployment: ComputeDeployment;
  lines: LogLine[];
};

function BuildSectionHeader({ expanded, setExpanded, deployment, lines }: BuildSectionHeaderProps) {
  const build = deployment.build;
  const status = getBuildStatus(deployment);
  const [StatusIcon, statusColorClassName] = buildStatusMap[status];

  return (
    <SectionHeader
      expanded={expanded}
      setExpanded={setExpanded}
      title={<T id="build.title" />}
      status={status}
      StatusIcon={StatusIcon}
      statusColorClassName={statusColorClassName}
      lastLogLine={status === 'running' ? lines[lines.length - 1] : undefined}
      end={
        status === 'completed' &&
        build !== undefined && (
          <div>
            <T id="build.completed" values={{ elapsed: elapsed(build) }} />
          </div>
        )
      }
    />
  );
}

function getBuildStatus(deployment: ComputeDeployment): DeploymentBuildStatus | 'pending' {
  const { build } = deployment;

  if (build === undefined) {
    if (deployment.buildSkipped) {
      return 'completed';
    }

    if (deployment.status == 'pending') {
      return 'pending';
    }

    if (deployment.status == 'canceled') {
      return 'aborted';
    }

    return 'unknown';
  }

  return build.status;
}

function elapsed({ startedAt, finishedAt }: DeploymentBuild) {
  return (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000;
}

type RuntimeSectionHeaderProps = {
  expanded: boolean;
  setExpanded: ((expanded: boolean) => void) | false;
  deployment: ComputeDeployment;
  lines: LogLine[];
};

function RuntimeSectionHeader({ expanded, setExpanded, deployment, lines }: RuntimeSectionHeaderProps) {
  const notStarted =
    hasBuild(deployment) && !deployment.buildSkipped && deployment.build?.status !== 'completed';

  const [StatusIcon, statusColorClassName] = notStarted
    ? statuses.pending
    : runtimeStatusMap[deployment.status];

  return (
    <SectionHeader
      expanded={expanded}
      setExpanded={setExpanded}
      title={<T id="runtime.title" />}
      status={notStarted ? <T id="runtime.notStarted" /> : deployment.status}
      StatusIcon={StatusIcon}
      statusColorClassName={statusColorClassName}
      lastLogLine={deployment.status === 'starting' ? lines[lines.length - 1] : undefined}
    />
  );
}

type SectionHeaderProps = {
  expanded: boolean;
  setExpanded: ((expanded: boolean) => void) | false;
  title: React.ReactNode;
  status: React.ReactNode;
  statusColorClassName: string;
  StatusIcon: React.ComponentType<{ className?: string }>;
  lastLogLine?: LogLine;
  end?: React.ReactNode;
};

function SectionHeader({
  expanded,
  setExpanded,
  title,
  status,
  statusColorClassName,
  StatusIcon,
  lastLogLine,
  end,
}: SectionHeaderProps) {
  return (
    <AccordionHeader
      expanded={expanded}
      setExpanded={setExpanded || undefined}
      className={clsx(setExpanded === false && 'opacity-50')}
    >
      <div className="col gap-1">
        <div className="font-medium">{title}</div>
        <div className={clsx('text-xs first-letter:capitalize', statusColorClassName)}>{status}</div>
      </div>

      <div className="row ms-auto min-w-0 items-center gap-2 ps-4 text-xs">
        {end}

        {!expanded && lastLogLine !== undefined && (
          <div className="max-w-96 truncate font-mono text-dim">{lastLogLine.text}</div>
        )}

        <StatusIcon className={clsx('size-5', statusColorClassName)} />
      </div>
    </AccordionHeader>
  );
}

const statuses = {
  pending: [IconCircleDashed, clsx('text-dim')],
  inProgress: [Spinner, clsx('text-gray')],
  warning: [IconCircleAlert, clsx('text-orange')],
  error: [IconCircleX, clsx('text-red')],
  success: [IconCircleCheck, clsx('text-green')],
  canceled: [IconCircleX, clsx('text-gray')],
} satisfies Record<string, [React.ComponentType<{ className?: string }>, string]>;

type ValuesOf<T> = T[keyof T];

const buildStatusMap: Record<DeploymentBuildStatus | 'pending', ValuesOf<typeof statuses>> = {
  unknown: statuses.canceled,
  pending: statuses.pending,
  running: statuses.inProgress,
  failed: statuses.error,
  completed: statuses.success,
  aborted: statuses.canceled,
};

const runtimeStatusMap: Record<DeploymentStatus, ValuesOf<typeof statuses>> = {
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
};
