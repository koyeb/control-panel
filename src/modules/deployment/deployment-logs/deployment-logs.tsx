import clsx from 'clsx';
import React, { useState } from 'react';

import { AccordionHeader, AccordionSection } from '@koyeb/design-system';
import {
  App,
  ComputeDeployment,
  DeploymentBuild,
  DeploymentBuildStatus,
  Instance,
  LogLine,
  Service,
} from 'src/api/model';
import { hasBuild } from 'src/application/service-functions';
import { IconCircleDashed } from 'src/components/icons';
import { useObserve } from 'src/hooks/lifecycle';
import { useLogs } from 'src/hooks/logs';
import { useNow } from 'src/hooks/timers';
import { createTranslate } from 'src/intl/translate';

import { BuildLogs } from './build-logs';
import { BuildSteps } from './build-steps';
import { buildStatusMap, runtimeStatusMap } from './deployment-status-icons';
import { Replicas } from './replicas';
import { RuntimeLogs } from './runtime-logs';

type DeploymentPhase = 'build' | 'runtime';

const T = createTranslate('modules.deployment.deploymentLogs');

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

  const [now] = useState(new Date());

  const buildExpanded = expanded === 'build';
  const buildLogs = useLogs(connectToBuildLogs(deployment, buildExpanded), {
    deploymentId: deployment.id,
    type: 'build',
    start: new Date(deployment.date),
    end: now,
  });

  const runtimeExpanded = expanded === 'runtime';
  const runtimeLogs = useLogs(connectToRuntimeLogs(deployment, runtimeExpanded), {
    deploymentId: deployment.id,
    type: 'runtime',
    start: new Date(deployment.date),
    end: now,
  });

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
          <div className="col gap-4 p-4">
            <BuildSteps deployment={deployment} />
            <BuildLogs app={app} service={service} deployment={deployment} logs={buildLogs} />
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
            logs={runtimeLogs}
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
  return deployment.buildSkipped || deployment.build !== undefined;
}

function canToggleRuntime(deployment: ComputeDeployment) {
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
      end={<BuildSectionHeaderEnd expanded={expanded} deployment={deployment} />}
    />
  );
}

type BuildSectionHeaderEndProps = {
  expanded: boolean;
  deployment: ComputeDeployment;
};

function BuildSectionHeaderEnd({ expanded, deployment }: BuildSectionHeaderEndProps) {
  const build = deployment.build;
  const status = getBuildStatus(deployment);
  const now = useNow();

  if (build === undefined) {
    return;
  }

  if (status === 'running' && expanded && build.startedAt !== null) {
    const duration = Math.floor((now.getTime() - new Date(build.startedAt).getTime()) / 1000);

    return (
      <div>
        <T id="build.duration" values={{ duration }} />
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div>
        <T id="build.completed" values={{ elapsed: elapsed(build) }} />
      </div>
    );
  }
}

function getBuildStatus(deployment: ComputeDeployment): DeploymentBuildStatus {
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
  if (startedAt === null || finishedAt === null) {
    return;
  }

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
    ? [IconCircleDashed, clsx('text-dim')]
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
