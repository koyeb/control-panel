import { Badge, Collapse } from '@koyeb/design-system';
import { TooltipTitle } from '@koyeb/design-system/next';
import clsx from 'clsx';
import { useState } from 'react';

import {
  isComputeDeployment,
  isDatabaseDeployment,
  useCatalogInstance,
  useCatalogRegion,
  useDeploymentScaling,
  useRegionsCatalog,
} from 'src/api';
import { formatBytes } from 'src/application/memory';
import { getServiceLink, getServiceUrls } from 'src/application/service-functions';
import { SvgComponent } from 'src/application/types';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { ExternalLink, Link } from 'src/components/link';
import { RegionFlag } from 'src/components/region-flag';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { DeploymentStatusBadge, ServiceStatusIcon } from 'src/components/status-badges';
import { InfoTooltip, Tooltip } from 'src/components/tooltip';
import { FeatureFlag } from 'src/hooks/feature-flag';
import {
  IconArchive,
  IconArrowRight,
  IconChevronDown,
  IconClock,
  IconCpu,
  IconDatabase,
  IconDocker,
  IconGitBranch,
  IconGitCommitHorizontal,
  IconGithub,
  IconLayers,
  IconMemoryStick,
  IconMicrochip,
  IconMoon,
  IconRadioReceiver,
} from 'src/icons';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { Translate, TranslateEnum, createTranslate } from 'src/intl/translate';
import {
  App,
  CatalogInstance,
  ComputeDeployment,
  DatabaseDeployment,
  Deployment,
  DeploymentDefinition,
  Replica,
  Service,
} from 'src/model';
import { inArray, unique } from 'src/utils/arrays';
import { hasProperty } from 'src/utils/object';
import { capitalize, ellipsis, shortId } from 'src/utils/strings';

import { ServiceItemOld } from './service-item-old';

const T = createTranslate('pages.home.service');

export type ServiceItemProps = {
  app: App;
  service: Service;
  deployment: Deployment;
};

export function ServiceItem(props: ServiceItemProps) {
  return (
    <FeatureFlag feature="new-services-list" fallback={<ServiceItemOld {...props} />}>
      <div className="@container rounded-md border">
        <div
          className={clsx(
            'grid gap-4 p-4 @2xl:p-3 @2xl:text-xs',
            'grid-cols-1',
            '@2xl:grid-cols-[14rem_6rem_7rem_9rem]',
            '@3xl:grid-cols-[14rem_6rem_7rem_9rem_auto]',
            '@4xl:grid-cols-[18rem_7.5rem_10rem_9rem_auto]',
            '@6xl:grid-cols-[24rem_7.5rem_10rem_9rem_auto]',
            props.service.type === 'worker' && 'py-6!',
          )}
        >
          <ServiceInfo {...props} />
          <DeploymentInfo {...props} />
          <ServiceAdditionalInfo {...props} />
        </div>

        <div className="rounded-b-md border-t border-muted bg-muted/50 p-4 @2xl:px-3 @2xl:py-2 @2xl:text-xs">
          <ServiceFooter {...props} />
        </div>
      </div>
    </FeatureFlag>
  );
}

function ServiceInfo(props: { app: App; service: Service; deployment: Deployment }) {
  const { service } = props;

  return (
    <div>
      <div className="row items-center gap-2">
        <div>
          <ServiceStatusIcon status={service.status} className="size-4" />
        </div>

        <Link {...getServiceLink(service)} className="truncate text-sm font-medium">
          {service.name}
        </Link>

        <div className="hidden text-dim @2xl:block">/</div>

        <div className="ms-auto row items-center gap-1 whitespace-nowrap text-dim @2xl:ms-0">
          <ServiceTypeIcon size={1} type={service.type} />
          <TranslateEnum enum="serviceType" value={service.type} />
        </div>
      </div>

      <ServiceUrl {...props} />
    </div>
  );
}

function ServiceUrl({ app, service, deployment }: { app: App; service: Service; deployment: Deployment }) {
  const urls = getServiceUrls(app, service, deployment);
  const firstUrl = urls.find((url) => url.externalUrl !== undefined) ?? urls[0];
  const url = firstUrl?.externalUrl ?? firstUrl?.internalUrl;

  if (!url) {
    return null;
  }

  return (
    <div className="mt-4 row min-w-0 items-center gap-2 @2xl:mt-2">
      <ExternalLink href={`https://${url}`} className="truncate font-medium">
        {url}
      </ExternalLink>

      <div>
        <CopyIconButton text={url} className="size-3.5" />
      </div>
    </div>
  );
}

function DeploymentInfo({ deployment }: { deployment: Deployment }) {
  if (isComputeDeployment(deployment)) {
    return <ComputeDeploymentInfo deployment={deployment} />;
  }

  if (isDatabaseDeployment(deployment)) {
    return <DatabaseDeploymentInfo deployment={deployment} />;
  }

  return null;
}

function ComputeDeploymentInfo({ deployment }: { deployment: ComputeDeployment }) {
  const definition = deployment.definition;
  const instance = useCatalogInstance(definition.instanceType);
  const replicas = useDeploymentScaling(deployment.id);

  return (
    <>
      <Instance instance={instance} />
      <Regions regions={definition.regions} />
      <Scaling replicas={replicas} definition={definition} />
    </>
  );
}

function DatabaseDeploymentInfo({ deployment }: { deployment: DatabaseDeployment }) {
  const instance = useCatalogInstance(deployment.instance);

  return (
    <>
      <Instance instance={instance} />
      <Regions regions={[deployment.region]} />
      <div />
    </>
  );
}

function Instance({ instance }: { instance?: CatalogInstance }) {
  return (
    <div className="row items-center gap-2">
      <div className="row min-w-0 items-center gap-1">
        <div>
          <IconCpu strokeWidth={1} className="size-4" />
        </div>
        <div className="truncate">{instance?.displayName}</div>
      </div>

      <InfoTooltip
        className="md:min-w-42"
        content={instance && <InstanceTooltipContent instance={instance} />}
      />
    </div>
  );
}

function Regions({ regions }: { regions: string[] }) {
  const firstRegion = useCatalogRegion(regions[0]);

  return (
    <div className="row min-w-0 items-center gap-2">
      <RegionFlag regionId={firstRegion?.id} className="size-3" />

      <div className="truncate">{firstRegion?.name}</div>

      {regions.length >= 2 && (
        <Tooltip
          allowHover
          trigger={(props) => (
            <Badge color="gray" size={1} className="text-default!" {...props}>
              <Translate id="common.plusCount" values={{ count: 2 }} />
            </Badge>
          )}
          content={<RegionsTooltipContent regions={regions} />}
          className="md:min-w-36"
        />
      )}
    </div>
  );
}

function Scaling({ replicas, definition }: { replicas?: Replica[]; definition: DeploymentDefinition }) {
  const ScalingIcon = definition.scaling.min === 0 ? IconMoon : IconLayers;

  const scaling = {
    healthy: replicas?.filter((replica) => replica.status === 'HEALTHY').length,
    total: definition.scaling.max * definition.regions.length,
  };

  return (
    <div className="row min-w-0 items-center gap-2">
      <ScalingIcon className="size-3.5" />

      <div className="truncate">
        <T id="scaling" values={scaling} />
      </div>

      <InfoTooltip
        className="md:max-w-54"
        content={replicas && <ScalingTooltipContent replicas={replicas} />}
      />
    </div>
  );
}

function ServiceAdditionalInfo({ deployment }: { deployment: Deployment }) {
  if (isComputeDeployment(deployment)) {
    const source = deployment.definition.source;

    const Icon = {
      docker: IconDocker,
      git: IconGithub,
      archive: IconArchive,
    }[source.type];

    return (
      <div className="hidden min-w-0 items-center justify-end gap-1 @3xl:row">
        <div>
          <Icon className="size-3" />
        </div>

        {source.type === 'git' && (
          <ExternalLink href={`https://${source.repository}`} className="truncate">
            {source.repository.replace('github.com/', '')}
          </ExternalLink>
        )}

        {source.type === 'docker' && <div className="truncate">{source.image}</div>}

        {source.type === 'archive' && shortId(source.archiveId)}
      </div>
    );
  }

  if (isDatabaseDeployment(deployment)) {
    return (
      <div className="hidden min-w-0 items-center justify-end gap-1 @3xl:row">
        <div>
          <IconDatabase className="size-3" />
        </div>

        <div className="truncate">
          <T id="postgresVersion" values={{ version: deployment.postgresVersion }} />
        </div>
      </div>
    );
  }

  return null;
}

function ServiceFooter({ deployment }: { deployment: Deployment }) {
  if (isComputeDeployment(deployment)) {
    return <ComputeServiceFooter deployment={deployment} />;
  }

  if (isDatabaseDeployment(deployment)) {
    return <DatabaseServiceFooter deployment={deployment} />;
  }

  return null;
}

function ComputeServiceFooter({ deployment }: { deployment: ComputeDeployment }) {
  const [open, setOpen] = useState(false);

  const status = (
    <div className="row items-center gap-2 @max-2xl:mb-2">
      <div>
        <IconClock className="size-em text-dim" />
      </div>

      <div className="whitespace-nowrap text-dim">
        <T id="latestDeployment" />
      </div>

      <div>
        <IconArrowRight className="size-em text-dim" />
      </div>

      <DeploymentStatusBadge icon={false} status={deployment.status} className="rounded-full!" />
    </div>
  );

  const trigger = (
    <>
      <div className="@2xl:hidden">
        <Collapse open={open} className="col gap-2">
          <DeploymentTrigger deployment={deployment} />
        </Collapse>
      </div>

      <div className="row min-w-0 flex-1 items-center gap-2 @max-2xl:hidden">
        <DeploymentTrigger deployment={deployment} />
      </div>
    </>
  );

  const date = (
    <div className={clsx('min-w-24', { '@max-2xl:mt-2': open })}>
      <FormattedDistanceToNow value={deployment.date} className="block font-medium text-dim @2xl:text-end" />
    </div>
  );

  return (
    <div className="row items-center gap-2 overflow-hidden">
      <div className="flex-1 overflow-hidden @2xl:row @2xl:items-center @2xl:gap-2">
        {status}
        {trigger}
        {date}
      </div>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={clsx('@2xl:hidden', { '-scale-y-100': open })}
      >
        <IconChevronDown className="size-5" />
      </button>
    </div>
  );
}

function DatabaseServiceFooter({ deployment }: { deployment: Deployment }) {
  return (
    <div className="row items-center gap-2">
      <div>
        <IconClock className="size-em text-dim" />
      </div>

      <div className="whitespace-nowrap text-dim">
        <T id="latestDeployment" />
      </div>

      <div className={clsx('ms-auto min-w-24', { '@max-4xl:mt-2': open })}>
        <FormattedDistanceToNow value={deployment.date} className="block text-end font-medium text-dim" />
      </div>
    </div>
  );
}

function DeploymentTrigger({ deployment }: { deployment: ComputeDeployment }) {
  const trigger = deployment.trigger;

  if (!trigger) {
    return null;
  }

  if (inArray(trigger?.type, ['initial', 'redeploy', 'resume'] as const)) {
    return (
      <div className="truncate text-dim">
        <T id={`deploymentTrigger.${trigger.type}`} />
      </div>
    );
  }

  const branch = (
    <ExternalLink
      openInNewTab
      href={`https://${trigger.repository}/tree/${trigger.branch}`}
      className="row items-center gap-1 font-medium"
    >
      <div>
        <IconGitBranch className="size-4" />
      </div>
      {ellipsis(trigger.branch, 38)}
    </ExternalLink>
  );

  const author = (
    <ExternalLink openInNewTab href={trigger.commit.author.url} className="row items-center gap-1">
      <img src={trigger.commit.author.avatar} className="size-4 rounded-full" />
      <div>{trigger.commit.author.name}</div>
    </ExternalLink>
  );

  return (
    <>
      {trigger.commit.sha && (
        <ExternalLink
          openInNewTab
          href={`https://${trigger.repository}/commit/${trigger.commit.sha}`}
          className="row min-w-0 items-center gap-2"
        >
          <div>
            <IconGitCommitHorizontal className="size-4" />
          </div>
          <div className="font-medium">#{shortId(trigger.commit.sha)}</div>
          <div className="truncate text-dim">{trigger.commit.message}</div>
        </ExternalLink>
      )}

      <div className="row min-w-fit items-center gap-2 @2xl:@max-3xl:hidden">
        <T id="deploymentTrigger.git" values={{ branch, author }} />
      </div>
    </>
  );
}

function InstanceTooltipContent({ instance }: { instance: CatalogInstance }) {
  return (
    <div className="col gap-3">
      <TooltipTitle
        title={<T id="instanceTooltip.title" values={{ category: capitalize(instance.category) }} />}
      />

      <div className="font-bold">{instance.displayName}</div>

      <InstanceSpecValue
        Icon={IconCpu}
        value={<T id="instanceTooltip.cpu" values={{ value: instance.vcpuShares }} />}
      />

      <InstanceSpecValue
        Icon={IconMemoryStick}
        value={<T id="instanceTooltip.ram" values={{ value: instance.memory }} />}
      />

      {instance.vram !== undefined && (
        <InstanceSpecValue
          Icon={IconMicrochip}
          value={
            <T
              id="instanceTooltip.vram"
              values={{ value: formatBytes(instance.vram, { round: true, decimal: true }) }}
            />
          }
        />
      )}

      <InstanceSpecValue
        Icon={IconRadioReceiver}
        value={<T id="instanceTooltip.disk" values={{ value: instance.disk }} />}
      />
    </div>
  );
}

function InstanceSpecValue({ Icon, value }: { Icon: SvgComponent; value: React.ReactNode }) {
  return (
    <div className="row items-center gap-2">
      <div>
        <Icon strokeWidth={1} className="size-4" />
      </div>
      {value}
    </div>
  );
}

function RegionsTooltipContent({ regions: regionIds }: { regions: string[] }) {
  const regions = useRegionsCatalog(regionIds);

  return (
    <div className="col gap-3">
      <TooltipTitle title={<T id="regionsTooltip.title" />} />

      {regions.map((region) => (
        <div key={region.id} className="row items-center gap-2">
          <RegionFlag regionId={region.id} className="size-4" />
          <div>{region.name}</div>
        </div>
      ))}
    </div>
  );
}

function ScalingTooltipContent({ replicas }: { replicas: Replica[] }) {
  const regionIds = unique(replicas.map((replica) => replica.region));
  const regions = useRegionsCatalog(regionIds);

  const groups = new Map(
    regions.map((region) => [region, replicas.filter(hasProperty('region', region.id))]),
  );

  const scaling = (replicas: Replica[]) => ({
    healthy: replicas.filter(hasProperty('status', 'HEALTHY')).length,
    total: replicas.length,
  });

  return (
    <div className="col gap-3">
      <TooltipTitle title={<T id="scalingTooltip.title" />} />

      <T id="scalingTooltip.description" />

      {groups.size >= 2 &&
        Array.from(groups.entries()).map(([region, replicas]) => (
          <div key={region.id} className="row items-center gap-2">
            <RegionFlag regionId={region.id} className="size-4" />

            <div className="flex-1">{region.name}</div>

            <Badge color="gray" size={1}>
              <T id="scalingTooltip.count" values={scaling(replicas)} />
            </Badge>
          </div>
        ))}
    </div>
  );
}
