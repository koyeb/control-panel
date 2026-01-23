import { Collapse, TooltipTitle } from '@koyeb/design-system';
import clsx from 'clsx';
import { useState } from 'react';

import { isComputeDeployment, isDatabaseDeployment, useDeploymentScaling } from 'src/api';
import { getServiceLink, getServiceUrls } from 'src/application/service-functions';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { ExternalLink, Link } from 'src/components/link';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { DeploymentStatusBadge, ServiceStatusBadge, ServiceStatusIcon } from 'src/components/status-badges';
import { Tooltip } from 'src/components/tooltip';
import {
  IconArchive,
  IconArrowRight,
  IconChevronDown,
  IconClock,
  IconDatabase,
  IconDocker,
  IconGitBranch,
  IconGitCommitHorizontal,
  IconGithub,
} from 'src/icons';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { TranslateEnum, createTranslate } from 'src/intl/translate';
import { App, ComputeDeployment, DatabaseDeployment, Deployment, Service } from 'src/model';
import {
  InstanceMetadataValue,
  RegionsMetadataValue,
  ScalingMetadataValue,
} from 'src/modules/deployment/metadata';
import { inArray } from 'src/utils/arrays';
import { assert } from 'src/utils/assert';
import { ellipsis, shortId } from 'src/utils/strings';

const T = createTranslate('pages.home.service');

type ServiceItemProps = {
  app: App;
  service: Service;
  activeDeployment?: Deployment;
  latestDeployment: Deployment;
};

export function ServiceItem(props: ServiceItemProps) {
  return (
    <div className="@container rounded-md border">
      <div
        className={clsx(
          'grid h-17 items-center gap-4 px-4 @max-2xl:h-auto @max-2xl:py-4 @2xl:px-3 @2xl:text-xs',
          'grid-cols-1',
          '@2xl:grid-cols-[14rem_6rem_7rem_9rem]',
          '@3xl:grid-cols-[14rem_6rem_7rem_9rem_auto]',
          '@4xl:grid-cols-[18rem_7.5rem_10rem_9rem_auto]',
          '@6xl:grid-cols-[24rem_7.5rem_10rem_9rem_auto]',
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
  );
}

function ServiceInfo(props: ServiceItemProps) {
  const { service } = props;

  return (
    <div>
      <Link {...getServiceLink(service)} className="row items-center gap-2">
        <Tooltip
          className="col gap-3"
          trigger={(props) => (
            <div {...props}>
              <ServiceStatusIcon status={service.status} className="size-4" />
            </div>
          )}
          content={
            <>
              <TooltipTitle title={<T id="status" />} />
              <ServiceStatusBadge status={service.status} icon={false} />
            </>
          }
        />

        <div className="truncate text-sm font-medium">{service.name}</div>

        <div className="hidden text-dim @2xl:block">/</div>

        <div className="ms-auto row items-center gap-1 whitespace-nowrap text-dim @2xl:ms-0">
          <ServiceTypeIcon size={1} type={service.type} />
          <TranslateEnum enum="serviceType" value={service.type} />
        </div>
      </Link>

      <ServiceUrl {...props} />
    </div>
  );
}

function ServiceUrl({ app, service, activeDeployment }: ServiceItemProps) {
  const urls = getServiceUrls(app, service, activeDeployment);
  const firstUrl = urls.find((url) => url.externalUrl !== undefined) ?? urls[0];
  const url = firstUrl?.externalUrl ?? firstUrl?.internalUrl;

  if (!url) {
    return null;
  }

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      className="mt-4 row min-w-0 items-center gap-2 @2xl:mt-2"
    >
      <ExternalLink href={`https://${url}`} className="truncate font-medium">
        {url}
      </ExternalLink>

      <div className="leading-0">
        <CopyIconButton text={url} className="size-3.5" />
      </div>
    </div>
  );
}

function DeploymentInfo({ latestDeployment, activeDeployment }: ServiceItemProps) {
  if (isComputeDeployment(latestDeployment)) {
    assert(activeDeployment === undefined || isComputeDeployment(activeDeployment));

    return <ComputeDeploymentInfo latestDeployment={latestDeployment} activeDeployment={activeDeployment} />;
  }

  if (isDatabaseDeployment(latestDeployment)) {
    return <DatabaseDeploymentInfo deployment={latestDeployment} />;
  }

  return null;
}

function ComputeDeploymentInfo({
  latestDeployment,
  activeDeployment,
}: {
  latestDeployment: ComputeDeployment;
  activeDeployment?: ComputeDeployment;
}) {
  const replicas = useDeploymentScaling(activeDeployment?.id);

  const definition = activeDeployment?.definition ?? latestDeployment.definition;
  const sleeping = activeDeployment?.status === 'SLEEPING';

  return (
    <>
      <div>
        <InstanceMetadataValue instance={definition.instanceType} />
      </div>

      <div>
        <RegionsMetadataValue regions={definition.regions} />
      </div>

      <div>{replicas !== undefined && <ScalingMetadataValue replicas={replicas} sleeping={sleeping} />}</div>
    </>
  );
}

function DatabaseDeploymentInfo({ deployment }: { deployment: DatabaseDeployment }) {
  return (
    <>
      <div>
        <InstanceMetadataValue instance={deployment.instance} />
      </div>

      <div>
        <RegionsMetadataValue regions={[deployment.region]} />
      </div>

      <div />
    </>
  );
}

function ServiceAdditionalInfo({ activeDeployment }: ServiceItemProps) {
  if (isComputeDeployment(activeDeployment)) {
    const source = activeDeployment.definition.source;

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

  if (isDatabaseDeployment(activeDeployment)) {
    return (
      <div className="hidden min-w-0 items-center justify-end gap-1 @3xl:row">
        <div>
          <IconDatabase className="size-3" />
        </div>

        <div className="truncate">
          <T id="postgresVersion" values={{ version: activeDeployment.postgresVersion }} />
        </div>
      </div>
    );
  }

  return null;
}

function ServiceFooter({ latestDeployment }: { latestDeployment?: Deployment }) {
  if (isComputeDeployment(latestDeployment)) {
    return <ComputeServiceFooter deployment={latestDeployment} />;
  }

  if (isDatabaseDeployment(latestDeployment)) {
    return <DatabaseServiceFooter deployment={latestDeployment} />;
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

  if (inArray(trigger?.type, ['initial', 'redeploy', 'resume'] as const)) {
    return (
      <div className="truncate text-dim">
        <T id={`deploymentTrigger.${trigger.type}`} />
      </div>
    );
  }

  if (!trigger) {
    return null;
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
