import { Link, useSearch } from '@tanstack/react-router';

import { routes } from 'src/application/routes';
import { IconGithub } from 'src/components/icons';
import { LinkButton } from 'src/components/link';
import IconDocker from 'src/icons/docker.svg?react';
import { createTranslate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';
import { snakeToCamelDeep } from 'src/utils/object';

import { OneClickAppList } from './one-click-app-list';
import { ExtendedServiceType, ServiceTypeList } from './service-type-list';

const T = createTranslate('modules.serviceCreation.serviceType');

function isServiceType(value: unknown): value is ExtendedServiceType {
  return inArray(value, ['web', 'private', 'worker', 'database', 'model']);
}

export function ServiceTypeStep() {
  const { appId, serviceType } = snakeToCamelDeep(useSearch({ from: '/_main/services/new' }));

  return (
    <div className="col sm:row divide-y rounded-md border sm:divide-x md:divide-y-0">
      <nav className="col gap-3 p-3 md:min-w-72 md:p-6">
        <ServiceTypeList />
        <hr />
        <OneClickAppList />
      </nav>

      <div className="p-3 md:p-6 md:pl-12">
        {isServiceType(serviceType) && serviceType !== 'database' && serviceType !== 'model' && (
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

            <LinkButton className="self-start" href={getCreateServiceUrl(serviceType, appId)}>
              <T id={`${serviceType}.button`} />
            </LinkButton>
          </div>
        )}
      </div>
    </div>
  );
}

function getCreateServiceUrl(serviceType: ExtendedServiceType, appId: string | undefined) {
  let url = '';

  if (serviceType === 'database') {
    url = routes.createDatabaseService();
  }

  if (serviceType === 'model') {
    url = routes.deploy();
    url += `?${new URLSearchParams({ type: 'model' }).toString()}`;
  }

  if (appId) {
    url += `?${String(new URLSearchParams({ app_id: appId }))}`;
  }

  return url;
}

function DeploymentSource() {
  return (
    <div className="col lg:row gap-4">
      <DeploymentSourceOption
        source="git"
        Icon={IconGithub}
        title={<T id="deploymentSource.github.title" />}
        description={<T id="deploymentSource.github.description" />}
      />

      <DeploymentSourceOption
        source="docker"
        Icon={IconDocker}
        title={<T id="deploymentSource.docker.title" />}
        description={<T id="deploymentSource.docker.description" />}
      />
    </div>
  );
}

type DeploymentSourceOptionProps = {
  source: 'git' | 'docker';
  Icon: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  description: React.ReactNode;
};

function DeploymentSourceOption({ source, Icon, title, description }: DeploymentSourceOptionProps) {
  const { serviceType } = snakeToCamelDeep(useSearch({ from: '/_main/services/new' }));

  return (
    <Link
      from="/services/new"
      search={(prev) => ({
        ...prev,
        step: 'importProject',
        type: source,
        ...(serviceType === 'private' && { service_type: 'web', ports: ['8000;tcp'] }),
      })}
      className="row max-w-80 items-center gap-3 rounded-xl border p-3 text-start"
    >
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
