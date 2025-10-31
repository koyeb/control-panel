import { AccordionHeader, AccordionSection } from '@koyeb/design-system';
import clsx from 'clsx';
import React, { useState } from 'react';

import { hasBuild } from 'src/application/service-functions';
import { BuildLogs, RuntimeLogs } from 'src/components/logs';
import { useObserve } from 'src/hooks/lifecycle';
import { useNow } from 'src/hooks/timers';
import { IconCircleDashed } from 'src/icons';
import { TranslateStatus, createTranslate } from 'src/intl/translate';
import {
  App,
  ComputeDeployment,
  DeploymentBuild,
  DeploymentBuildStatus,
  DeploymentStatus,
  Instance,
  LogLine,
  Service,
} from 'src/model';

import { DeploymentScaling } from '../deployment-scaling/deployment-scaling';

import { BuildSteps } from './build-steps';
import { buildStatusMap, runtimeStatusMap } from './deployment-status-icons';

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

  return (
    <div className="rounded-md border">
      {hasBuild(deployment) && (
        <BuildSection
          app={app}
          service={service}
          deployment={deployment}
          expanded={expanded === 'build'}
          setExpanded={(expanded) => setExpanded(expanded ? 'build' : null)}
        />
      )}

      <RuntimeSection
        app={app}
        service={service}
        deployment={deployment}
        instances={instances}
        expanded={expanded === 'runtime'}
        setExpanded={(expanded) => setExpanded(expanded ? 'runtime' : null)}
      />
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
  return !hasBuild(deployment) || deployment.buildSkipped || deployment.build?.status === 'COMPLETED';
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

type BuildSectionProps = {
  app: App;
  service: Service;
  deployment: ComputeDeployment;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
};

function BuildSection({ app, service, deployment, expanded, setExpanded }: BuildSectionProps) {
  const [lastLogLine, setLastLogLine] = useState<LogLine>();

  return (
    <AccordionSection
      keepMounted
      isExpanded={expanded}
      header={
        <BuildSectionHeader
          disabled={!canToggleBuild(deployment)}
          expanded={expanded}
          setExpanded={setExpanded}
          deployment={deployment}
          lastLogLine={lastLogLine}
        />
      }
    >
      <div className="divide-y border-t">
        <BuildSteps deployment={deployment} />
        <BuildLogs app={app} service={service} deployment={deployment} onLastLineChanged={setLastLogLine} />
      </div>
    </AccordionSection>
  );
}

type BuildSectionHeaderProps = {
  disabled: boolean;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  deployment: ComputeDeployment;
  lastLogLine?: LogLine;
};

function BuildSectionHeader({
  disabled,
  expanded,
  setExpanded,
  deployment,
  lastLogLine,
}: BuildSectionHeaderProps) {
  const status = getBuildStatus(deployment);
  const [StatusIcon, statusColorClassName] = buildStatusMap[status];

  return (
    <SectionHeader
      disabled={disabled}
      expanded={expanded}
      setExpanded={setExpanded}
      title={<T id="build.title" />}
      status={status}
      StatusIcon={StatusIcon}
      statusColorClassName={statusColorClassName}
      lastLogLine={status === 'RUNNING' && lastLogLine}
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

  if (status === 'RUNNING' && expanded && build.startedAt !== null) {
    const duration = Math.floor((now.getTime() - new Date(build.startedAt).getTime()) / 1000);

    return (
      <div>
        <T id="build.duration" values={{ duration }} />
      </div>
    );
  }

  if (status === 'COMPLETED') {
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
      return 'COMPLETED';
    }

    if (deployment.status == 'PENDING') {
      return 'PENDING';
    }

    if (deployment.status == 'CANCELED') {
      return 'ABORTED';
    }

    return 'UNKNOWN';
  }

  return build.status;
}

function elapsed({ startedAt, finishedAt }: DeploymentBuild) {
  if (startedAt === null || finishedAt === null) {
    return;
  }

  return (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000;
}

type RuntimeSectionProps = {
  app: App;
  service: Service;
  deployment: ComputeDeployment;
  instances: Instance[];
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
};

function RuntimeSection({ app, service, deployment, instances, expanded, setExpanded }: RuntimeSectionProps) {
  const [lastLogLine, setLastLogLine] = useState<LogLine>();

  return (
    <AccordionSection
      keepMounted
      isExpanded={expanded}
      header={
        <RuntimeSectionHeader
          disabled={!canToggleRuntime(deployment)}
          expanded={expanded}
          setExpanded={setExpanded}
          deployment={deployment}
          lastLogLine={lastLogLine}
        />
      }
    >
      <div className="border-t">
        <RuntimeLogs
          app={app}
          service={service}
          deployment={deployment}
          instances={instances}
          onLastLineChanged={setLastLogLine}
        />

        <DeploymentScaling deployment={deployment} />
      </div>
    </AccordionSection>
  );
}

type RuntimeSectionHeaderProps = {
  disabled: boolean;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  deployment: ComputeDeployment;
  lastLogLine?: LogLine;
};

function RuntimeSectionHeader({
  disabled,
  expanded,
  setExpanded,
  deployment,
  lastLogLine,
}: RuntimeSectionHeaderProps) {
  const notStarted =
    hasBuild(deployment) && !deployment.buildSkipped && deployment.build?.status !== 'COMPLETED';

  const [StatusIcon, statusColorClassName] = notStarted
    ? [IconCircleDashed, clsx('text-dim')]
    : runtimeStatusMap[deployment.status];

  return (
    <SectionHeader
      disabled={disabled}
      expanded={expanded}
      setExpanded={setExpanded}
      title={<T id="runtime.title" />}
      status={notStarted ? 'notStarted' : deployment.status}
      StatusIcon={StatusIcon}
      statusColorClassName={statusColorClassName}
      lastLogLine={deployment.status === 'STARTING' && lastLogLine}
    />
  );
}

type SectionHeaderProps = {
  disabled: boolean;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  title: React.ReactNode;
  status: DeploymentBuildStatus | DeploymentStatus | 'notStarted';
  statusColorClassName: string;
  StatusIcon: React.ComponentType<{ className?: string }>;
  lastLogLine?: LogLine | false;
  end?: React.ReactNode;
};

function SectionHeader({
  disabled,
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
      setExpanded={setExpanded}
      className={clsx(disabled && 'pointer-events-none opacity-50')}
    >
      <div className="font-medium">{title}</div>

      <div className="ms-auto row min-w-0 items-center gap-2 ps-4 text-xs">
        {end}

        {!expanded && lastLogLine && (
          <div className="max-w-96 truncate font-mono text-dim">{lastLogLine.text}</div>
        )}

        <div className="row items-center gap-2">
          <div className={clsx('text-xs', statusColorClassName)}>
            {status === 'notStarted' ? <T id="runtime.notStarted" /> : <TranslateStatus status={status} />}
          </div>
          <StatusIcon className={clsx('size-5', statusColorClassName)} />
        </div>
      </div>
    </AccordionHeader>
  );
}
