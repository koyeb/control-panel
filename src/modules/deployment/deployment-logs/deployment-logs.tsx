import clsx from 'clsx';
import React, { useMemo, useState } from 'react';

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
import { hasBuild, isDeploymentRunning } from 'src/application/service-functions';
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
  return !hasBuild(deployment) || deployment.buildSkipped || deployment.build?.status === 'completed';
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
  const now = useMemo(() => new Date(), []);

  const end = useMemo(() => {
    if (deployment.build?.finishedAt) {
      return new Date(deployment.build.finishedAt);
    }

    return now;
  }, [now, deployment.build?.finishedAt]);

  const logs = useLogs(deployment.build?.status === 'running', {
    deploymentId: deployment.id,
    type: 'build',
    start: new Date(deployment.date),
    end,
  });

  return (
    <AccordionSection
      isExpanded={expanded}
      header={
        <BuildSectionHeader
          disabled={!canToggleBuild(deployment)}
          expanded={expanded}
          setExpanded={setExpanded}
          deployment={deployment}
          lines={[]}
        />
      }
    >
      <div className="divide-y border-t">
        <BuildSteps deployment={deployment} />
        <BuildLogs app={app} service={service} deployment={deployment} logs={logs} />
      </div>
    </AccordionSection>
  );
}

type BuildSectionHeaderProps = {
  disabled: boolean;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  deployment: ComputeDeployment;
  lines: LogLine[];
};

function BuildSectionHeader({ disabled, expanded, setExpanded, deployment, lines }: BuildSectionHeaderProps) {
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

type RuntimeSectionProps = {
  app: App;
  service: Service;
  deployment: ComputeDeployment;
  instances: Instance[];
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
};

function RuntimeSection({ app, service, deployment, instances, expanded, setExpanded }: RuntimeSectionProps) {
  const now = useMemo(() => new Date(), []);

  const end = useMemo(() => {
    if (deployment.terminatedAt) {
      return new Date(deployment.terminatedAt);
    }

    return now;
  }, [now, deployment.terminatedAt]);

  const logs = useLogs(isDeploymentRunning(deployment), {
    deploymentId: deployment.id,
    type: 'runtime',
    start: new Date(deployment.date),
    end,
  });

  return (
    <AccordionSection
      isExpanded={expanded}
      header={
        <RuntimeSectionHeader
          disabled={!canToggleRuntime(deployment)}
          expanded={expanded}
          setExpanded={setExpanded}
          deployment={deployment}
          lines={[]}
        />
      }
    >
      <div className="divide-y border-t">
        <RuntimeLogs app={app} service={service} deployment={deployment} instances={instances} logs={logs} />
        <Replicas deployment={deployment} />
      </div>
    </AccordionSection>
  );
}

type RuntimeSectionHeaderProps = {
  disabled: boolean;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  deployment: ComputeDeployment;
  lines: LogLine[];
};

function RuntimeSectionHeader({
  disabled,
  expanded,
  setExpanded,
  deployment,
  lines,
}: RuntimeSectionHeaderProps) {
  const notStarted =
    hasBuild(deployment) && !deployment.buildSkipped && deployment.build?.status !== 'completed';

  const [StatusIcon, statusColorClassName] = notStarted
    ? [IconCircleDashed, clsx('text-dim')]
    : runtimeStatusMap[deployment.status];

  return (
    <SectionHeader
      disabled={disabled}
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
  disabled: boolean;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  title: React.ReactNode;
  status: React.ReactNode;
  statusColorClassName: string;
  StatusIcon: React.ComponentType<{ className?: string }>;
  lastLogLine?: LogLine;
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
    <AccordionHeader expanded={expanded} setExpanded={setExpanded} className={clsx(disabled && 'opacity-50')}>
      <div className="font-medium">{title}</div>

      <div className="row ms-auto min-w-0 items-center gap-2 ps-4 text-xs">
        {end}

        {!expanded && lastLogLine !== undefined && (
          <div className="max-w-96 truncate font-mono text-dim">{lastLogLine.text}</div>
        )}

        <div className="row items-center gap-2">
          <div className={clsx('text-xs first-letter:capitalize', statusColorClassName)}>{status}</div>
          <StatusIcon className={clsx('size-5', statusColorClassName)} />
        </div>
      </div>
    </AccordionHeader>
  );
}
