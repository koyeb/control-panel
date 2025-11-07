import { RegisteredRouter, ValidateLinkOptions, linkOptions } from '@tanstack/react-router';

import { Link, LinkButton } from 'src/components/link';
import { useSearchParams } from 'src/hooks/router';
import { IconDocker, IconGithub } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';

import { OneClickAppList } from './one-click-app-list';
import { ExtendedServiceType, ServiceTypeList } from './service-type-list';

const T = createTranslate('modules.serviceCreation.serviceType');

export function ServiceTypeStep() {
  const appId = useSearchParams().get('app_id');
  const serviceType = useSearchParams().get('service_type') ?? 'web';

  return (
    <div className="col divide-y rounded-md border sm:row sm:divide-x md:divide-y-0">
      <nav className="col gap-3 p-3 md:min-w-72 md:p-6">
        <ServiceTypeList serviceType={serviceType as ExtendedServiceType} />
        <hr />
        <OneClickAppList />
      </nav>

      <div className="p-3 md:p-6 md:pl-12">
        {inArray(serviceType, ['web', 'private', 'worker'] as const) && (
          <div className="col gap-4">
            <div className="col gap-2">
              <div className="text-base font-medium">
                <T id={`${serviceType}.title`} />
              </div>
              <div className="text-dim">
                <T id={`${serviceType}.description`} />
              </div>
            </div>

            <DeploymentSource />
          </div>
        )}

        {(serviceType === 'database' || serviceType === 'model') && (
          <div className="col gap-6">
            <div className="col gap-2">
              <div className="text-base font-medium">
                <T id={`${serviceType}.title`} />
              </div>
              <div className="text-dim">
                <T id={`${serviceType}.description`} />
              </div>
            </div>

            <LinkButton className="self-start" {...getCreateServiceUrl(serviceType, appId)}>
              <T id={`${serviceType}.button`} />
            </LinkButton>
          </div>
        )}
      </div>
    </div>
  );
}

function getCreateServiceUrl(serviceType: 'database' | 'model', appId: string | null) {
  return {
    database: linkOptions({
      to: '/database-services/new',
      search: { app_id: appId ?? undefined },
    }),
    model: linkOptions({
      to: '/services/deploy',
      search: { type: 'model', app_id: appId ?? undefined },
    }),
  }[serviceType];
}

function DeploymentSource() {
  const link = (source: 'git' | 'docker') => {
    return linkOptions({
      to: '/services/new',
      search: (prev) => ({
        ...prev,
        type: source,
        step: 'importProject' as const,
        ...(prev.service_type === 'private' && {
          service_type: 'web' as const,
          ports: '8000;tcp',
        }),
      }),
    });
  };

  return (
    <div className="col gap-4 lg:row">
      <DeploymentSourceOption
        Icon={IconGithub}
        title={<T id="deploymentSource.github.title" />}
        description={<T id="deploymentSource.github.description" />}
        link={link('git')}
      />

      <DeploymentSourceOption
        Icon={IconDocker}
        title={<T id="deploymentSource.docker.title" />}
        description={<T id="deploymentSource.docker.description" />}
        link={link('docker')}
      />
    </div>
  );
}

type DeploymentSourceOptionProps<Router extends RegisteredRouter, Options> = {
  Icon: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  description: React.ReactNode;
  link: ValidateLinkOptions<Router, Options>;
};

function DeploymentSourceOption<Router extends RegisteredRouter, Options>({
  Icon,
  title,
  description,
  link,
}: DeploymentSourceOptionProps<Router, Options>) {
  return (
    <Link className="row max-w-80 items-center gap-3 rounded-xl border p-3 text-start" {...link}>
      <div className="rounded-lg bg-muted p-3">
        <Icon className="size-10" />
      </div>
      <div>
        <div className="mb-1 font-medium">{title}</div>
        <div className="text-dim">{description}</div>
      </div>
    </Link>
  );
}
