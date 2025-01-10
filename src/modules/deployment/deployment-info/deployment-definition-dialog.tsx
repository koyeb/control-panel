import clsx from 'clsx';
import { useMemo, useState } from 'react';

import { Json, TabButton, TabButtons } from '@koyeb/design-system';
import { useInstance } from 'src/api/hooks/catalog';
import type {
  BuildpackBuilder,
  ComputeDeployment,
  DeploymentDefinition,
  DockerDeploymentSource,
  DockerfileBuilder,
  EnvironmentVariable,
  GitDeploymentSource,
  Scaling,
} from 'src/api/model';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { Dialog, DialogHeader } from 'src/components/dialog';
import { IconGithub, IconPackage } from 'src/components/icons';
import { ExternalLink } from 'src/components/link';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { useThemeModeOrPreferred } from 'src/hooks/theme';
import IconDocker from 'src/icons/docker.svg?react';
import { createTranslate, Translate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';

const T = createTranslate('modules.deployment.deploymentInfo.definitionDialog');

type DeploymentDefinitionDialogProps = {
  deployment: ComputeDeployment;
};

export function DeploymentDefinitionDialog({ deployment }: DeploymentDefinitionDialogProps) {
  const [tab, setTab] = useState<'json' | 'parsed'>('json');

  return (
    <Dialog id="DeploymentDefinition" className="col w-full max-w-4xl gap-4">
      <DialogHeader title={<T id="title" />} />

      <TabButtons>
        <TabButton selected={tab === 'json'} onClick={() => setTab('json')}>
          <T id="json" />
        </TabButton>
        <TabButton selected={tab === 'parsed'} onClick={() => setTab('parsed')}>
          <T id="parsed" />
        </TabButton>
      </TabButtons>

      {tab === 'json' && <DeploymentJson definition={deployment.definitionApi} />}
      {tab === 'parsed' && <DeploymentParsed deployment={deployment} />}
    </Dialog>
  );
}

function DeploymentJson({ definition }: { definition: object }) {
  const theme = useThemeModeOrPreferred();

  return (
    <div className="relative">
      <Json
        theme={theme}
        value={definition}
        // eslint-disable-next-line tailwindcss/no-arbitrary-value
        className="scrollbar-green max-h-[32rem] overflow-auto rounded-md bg-muted p-2 dark:bg-neutral"
      />

      <CopyIconButton text={JSON.stringify(definition)} className="text-icon absolute end-6 top-4 size-4" />
    </div>
  );
}

function DeploymentParsed({ deployment: { definition } }: { deployment: ComputeDeployment }) {
  return (
    <div className="col md:row gap-6">
      <div className="col min-w-0 flex-1 gap-6">
        <General definition={definition} />
        <Source definition={definition} />
      </div>
      <div className="col min-w-0 flex-1 gap-6">
        <Instances definition={definition} />
        <Ports definition={definition} />
        <EnvironmentVariables definition={definition} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded border">
      <div className="p-4 font-medium">{title}</div>
      <div className="col gap-3 px-4 pb-4">{children}</div>
    </div>
  );
}

type DataProps = {
  name: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

function Data({ name, className, children }: DataProps) {
  if (!children) {
    return null;
  }

  return (
    <div className={clsx('row items-center gap-2', className)}>
      <span className="text-dim">{name}</span>
      {children}
    </div>
  );
}

function General({ definition }: { definition: DeploymentDefinition }) {
  return (
    <Section title={<T id="general.title" />}>
      <Data name={<T id="general.nameLabel" />}>
        <div className="truncate">{definition.name}</div>
      </Data>

      <hr />

      <Data name={<T id="general.typeLabel" />}>
        <ServiceTypeIcon type={definition.type} size="medium" />
        <Translate id={`common.serviceType.${definition.type}`} />
      </Data>

      <Data name={<T id="general.strategyLabel" />}>
        <Translate id={`common.deploymentStrategy.${definition.strategy}`} />
      </Data>
    </Section>
  );
}

function Source({ definition }: { definition: DeploymentDefinition }) {
  const { source, builder } = definition;

  return (
    <Section title={<T id="source.title" />}>
      {source.type === 'git' && <Git source={source} builder={builder} privileged={definition.privileged} />}
      {source.type === 'docker' && <Docker source={source} privileged={definition.privileged} />}
    </Section>
  );
}

type GitProps = {
  source: GitDeploymentSource;
  builder?: BuildpackBuilder | DockerfileBuilder;
  privileged?: boolean;
};

function Git({ source, builder, privileged }: GitProps) {
  assert(builder !== undefined);

  return (
    <>
      <IconGithub className="icon" />

      <Data name={<T id="source.git.repositoryLabel" />}>
        <ExternalLink href={`https://github.com/${source.repository}`}>{source.repository}</ExternalLink>
      </Data>

      <Data name={<T id="source.git.branchLabel" />}>{source.branch}</Data>

      <hr />

      {builder.type === 'buildpack' && <BuildpackOptions builder={builder} />}
      {builder.type === 'dockerfile' && <DockerfileOptions builder={builder} />}

      <hr />

      <Data name={<T id="source.git.autodeployLabel" />}>{String(source.autoDeploy)}</Data>
      <Data name={<T id="source.git.privilegedLabel" />}>{String(privileged)}</Data>
    </>
  );
}

function Docker({ source, privileged }: { source: DockerDeploymentSource; privileged?: boolean }) {
  return (
    <>
      <IconDocker className="icon" />

      <Data name={<T id="source.docker.imageLabel" />}>{source.image}</Data>

      <Data name={<T id="source.docker.entrypointLabel" />} className="font-mono">
        {source.entrypoint}
      </Data>

      <Data name={<T id="source.docker.commandLabel" />} className="font-mono">
        {source.command}
      </Data>

      <Data name={<T id="source.docker.argumentsLabel" />} className="font-mono">
        {source.arguments}
      </Data>

      <Data name={<T id="source.docker.privilegedLabel" />}>{String(privileged)}</Data>
    </>
  );
}

function BuildpackOptions({ builder }: { builder: BuildpackBuilder }) {
  return (
    <>
      <Data name={<T id="source.git.builderTypeLabel" />}>
        <div className="row gap-2">
          <IconPackage className="icon" />
          <T id="source.git.buildpack" />
        </div>
      </Data>

      <Data name={<T id="source.git.buildCommandLabel" />} className="font-mono">
        {builder.buildCommand}
      </Data>

      <Data name={<T id="source.git.runCommandLabel" />} className="font-mono">
        {builder.runCommand}
      </Data>
    </>
  );
}

function DockerfileOptions({ builder }: { builder: DockerfileBuilder }) {
  return (
    <>
      <Data name={<T id="source.git.builderTypeLabel" />}>
        <div className="row gap-2">
          <IconDocker className="icon" />
          <T id="source.git.dockerfileLabel" />
        </div>
      </Data>

      <Data name={<T id="source.git.dockerfileLabel" />}>{builder.dockerfile}</Data>
      <Data name={<T id="source.git.entrypointLabel" />}>{builder.entrypoint}</Data>
      <Data name={<T id="source.git.commandLabel" />}>{builder.command}</Data>
      <Data name={<T id="source.git.argumentsLabel" />}>{builder.arguments}</Data>
      <Data name={<T id="source.git.targetLabel" />}>{builder.target}</Data>
    </>
  );
}

function Instances({ definition }: { definition: DeploymentDefinition }) {
  const instance = useInstance(definition.instanceType);

  return (
    <Section title={<T id="instances.title" />}>
      <Data name={<T id="instances.typeLabel" />}>
        {instance?.displayName}
        <div className="text-dim">
          <Translate
            id="common.instanceSpec"
            values={{ cpu: instance?.cpu, ram: instance?.ram, disk: instance?.disk }}
          />
        </div>
      </Data>

      <Data name={<T id="instances.scalingLabel" />}>
        <Scaling scaling={definition.scaling} />
      </Data>

      <hr />

      <Data name={<T id="instances.regionsLabel" />}>
        <div className="row flex-wrap gap-4">
          {definition.regions.map((identifier) => (
            <div key={identifier} className="row items-center gap-2">
              <RegionFlag identifier={identifier} className="size-4 rounded-full shadow-badge" />
              <RegionName identifier={identifier} />
            </div>
          ))}
        </div>
      </Data>
    </Section>
  );
}

function Scaling({ scaling }: { scaling: Scaling }) {
  if (scaling.min === scaling.max) {
    return <>{scaling.min}</>;
  }

  return <T id="instances.autoscaling" values={{ min: scaling.min, max: scaling.max }} />;
}

function Ports({ definition }: { definition: DeploymentDefinition }) {
  if (definition.type === 'worker') {
    return null;
  }

  return (
    <Section title={<T id="ports.title" />}>
      <ul>
        {definition.ports.map((port, index) => (
          <li key={index}>
            {port.path && (
              <T
                id="ports.publicPort"
                values={{ portNumber: port.portNumber, path: port.path, protocol: port.protocol }}
              />
            )}

            {!port.path && <T id="ports.privatePort" values={{ portNumber: port.portNumber }} />}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function EnvironmentVariables({ definition }: { definition: DeploymentDefinition }) {
  const variables = definition.environmentVariables;
  const envString = useMemo(() => getEnvString(variables), [variables]);

  return (
    <Section
      title={
        <>
          <T id="environmentVariables.title" />
          <CopyIconButton text={envString} className="text-icon ml-2 size-em align-middle" />
        </>
      }
    >
      {variables.map(formatEnvironmentVariable).map((line, index) => (
        <div key={index} className="truncate">
          {line}
        </div>
      ))}

      {variables.length === 0 && (
        <div className="text-center font-medium text-dim">
          <T id="environmentVariables.noVariables" />
        </div>
      )}
    </Section>
  );
}

function formatEnvironmentVariable({ name, value }: EnvironmentVariable) {
  return `${name}=${value}`;
}

function getEnvString(environmentVariables: EnvironmentVariable[]): string {
  return environmentVariables.map(formatEnvironmentVariable).join('\n');
}
