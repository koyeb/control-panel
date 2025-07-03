import { useCallback, useEffect } from 'react';

import { IconGithub } from 'src/components/icons';
import { Link, LinkButton, ValidateLinkOptions } from 'src/components/link';
import { useMount } from 'src/hooks/lifecycle';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import IconDocker from 'src/icons/docker.svg?react';
import { createTranslate } from 'src/intl/translate';
import { SourceType } from 'src/modules/service-form/service-form.types';
import { inArray } from 'src/utils/arrays';

import { OneClickAppList } from './one-click-app-list';
import { ExtendedServiceType, ServiceTypeList } from './service-type-list';

const T = createTranslate('modules.serviceCreation.serviceType');

function isServiceType(value: unknown): value is ExtendedServiceType {
  return inArray(value, ['web', 'private', 'worker', 'database', 'model']);
}

export function ServiceTypeStep() {
  const appId = useSearchParams().get('app_id');
  const serviceType = useSearchParams().get('service_type');
  const navigate = useNavigate();

  useMount(() => {
    navigate({
      search: (prev) => ({
        ...prev,
        type: null,
        service_type: null,
        ports: null,
      }),
    });
  });

  const setServiceType = useCallback(
    (type: string) => {
      navigate({ search: (prev) => ({ ...prev, service_type: type }) });
    },
    [navigate],
  );

  useEffect(() => {
    if (!isServiceType(serviceType)) {
      setServiceType('web');
    }
  }, [serviceType, setServiceType]);

  return (
    <div className="col divide-y rounded-md border sm:row sm:divide-x md:divide-y-0">
      <nav className="col gap-3 p-3 md:min-w-72 md:p-6">
        <ServiceTypeList serviceType={serviceType} setServiceType={setServiceType} />
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

            <LinkButton className="self-start" {...getCreateServiceUrl(serviceType, appId)}>
              <T id={`${serviceType}.button`} />
            </LinkButton>
          </div>
        )}
      </div>
    </div>
  );
}

function getCreateServiceUrl(serviceType: 'database' | 'model', appId: string | null): ValidateLinkOptions {
  if (serviceType === 'database') {
    return {
      to: '/database-services/new',
      search: { app_id: appId ?? undefined },
    };
  }

  if (serviceType === 'model') {
    return {
      to: '/services/deploy',
      search: { type: 'model', app_id: appId ?? undefined },
    };
  }

  throw new Error('Invalid service type');
}

function DeploymentSource() {
  const search = useSearchParams();

  const href = (source: SourceType) => {
    const params = new URLSearchParams(search);

    params.set('type', source);
    params.set('step', 'importProject');

    if (params.get('service_type') === 'private') {
      params.set('service_type', 'web');
      params.set('ports', '8000;tcp');
    }

    return '?' + params.toString();
  };
  return (
    <div className="col gap-4 lg:row">
      <DeploymentSourceOption
        Icon={IconGithub}
        title={<T id="deploymentSource.github.title" />}
        description={<T id="deploymentSource.github.description" />}
        href={href('git')}
      />

      <DeploymentSourceOption
        Icon={IconDocker}
        title={<T id="deploymentSource.docker.title" />}
        description={<T id="deploymentSource.docker.description" />}
        href={href('docker')}
      />
    </div>
  );
}

type DeploymentSourceOptionProps = {
  Icon: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  description: React.ReactNode;
  href: string;
};

function DeploymentSourceOption({ Icon, title, description, href }: DeploymentSourceOptionProps) {
  return (
    <Link className="row max-w-80 items-center gap-3 rounded-xl border p-3 text-start" to={href}>
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
