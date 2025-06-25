import clsx from 'clsx';
import { useEffect } from 'react';

import { routes } from 'src/application/routes';
import { IconGithub, IconPackage } from 'src/components/icons';
import { Link, LinkButton } from 'src/components/link';
import { useMount } from 'src/hooks/lifecycle';
import { useNavigate, useSearchParam, useSearchParams } from 'src/hooks/router';
import IconDocker from 'src/icons/docker.svg?react';
import { createTranslate } from 'src/intl/translate';
import { BuilderType, SourceType } from 'src/modules/service-form/service-form.types';
import { inArray } from 'src/utils/arrays';

import { OneClickAppList } from './one-click-app-list';
import { ExtendedServiceType, ServiceTypeList } from './service-type-list';

const T = createTranslate('modules.serviceCreation.serviceType');

function isServiceType(value: unknown): value is ExtendedServiceType {
  return inArray(value, ['web', 'private', 'worker', 'database', 'model']);
}

export function ServiceTypeStep() {
  const searchParams = useSearchParams();
  const [serviceType, setServiceType] = useSearchParam('service_type');
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

      <div className="col gap-8 p-3 md:p-6 md:pl-12">
        {isServiceType(serviceType) && (
          <Section
            title={<T id={`${serviceType}.title`} />}
            description={<T id={`${serviceType}.description`} />}
          >
            {(serviceType === 'database' || serviceType === 'model') && (
              <LinkButton
                className="self-start"
                href={getCreateServiceUrl(serviceType, searchParams.get('app_id'))}
              >
                <T id={`${serviceType}.button`} />
              </LinkButton>
            )}

            {serviceType !== 'database' && serviceType !== 'model' && <DeploymentSource />}
          </Section>
        )}

        {searchParams.get('type') === 'git' && (
          <Section title={<T id="builder.title" />} description={<T id="builder.description" />}>
            <Builder />
          </Section>
        )}
      </div>
    </div>
  );
}

type SectionProps = {
  title: React.ReactNode;
  description: React.ReactNode;
  children: React.ReactNode;
};

function Section({ title, description, children }: SectionProps) {
  return (
    <section className="col gap-4">
      <header className="col gap-2">
        <div className="text-base font-medium">{title}</div>
        <div className="text-dim">{description}</div>
      </header>

      {children}
    </section>
  );
}

function getCreateServiceUrl(serviceType: ExtendedServiceType, appId: string | null) {
  let url = '';

  if (serviceType === 'database') {
    url = routes.createDatabaseService();
  }

  if (serviceType === 'model') {
    url = routes.deploy();
    url += `?${new URLSearchParams({ type: 'model' }).toString()}`;
  }

  if (appId !== null) {
    url += `?${String(new URLSearchParams({ app_id: appId }))}`;
  }

  return url;
}

function DeploymentSource() {
  const searchParams = useSearchParams();

  const href = (source: SourceType) => {
    const result = new URLSearchParams(searchParams);

    result.set('type', source);

    if (source === 'docker') {
      result.set('step', 'importProject');

      if (result.get('service_type') === 'private') {
        result.set('service_type', 'web');
        result.set('ports', '8000;tcp');
      }
    }

    return '?' + result.toString();
  };
  return (
    <div className="col lg:row gap-4">
      <Option
        Icon={IconGithub}
        title={<T id="deploymentSource.github.title" />}
        description={<T id="deploymentSource.github.description" />}
        selected={searchParams.get('type') === 'git'}
        href={href('git')}
      />

      <Option
        Icon={IconDocker}
        title={<T id="deploymentSource.docker.title" />}
        description={<T id="deploymentSource.docker.description" />}
        href={href('docker')}
      />
    </div>
  );
}

function Builder() {
  const searchParams = useSearchParams();

  const href = (builder: BuilderType) => {
    const result = new URLSearchParams(searchParams);

    result.set('builder', builder);
    result.set('step', 'importProject');

    if (result.get('service_type') === 'private') {
      result.set('service_type', 'web');
      result.set('ports', '8000;tcp');
    }

    return '?' + result.toString();
  };

  return (
    <div className="col lg:row gap-4">
      <Option
        Icon={IconPackage}
        title={<T id="builder.buildpack.title" />}
        description={<T id="builder.buildpack.description" />}
        href={href('buildpack')}
      />

      <Option
        Icon={IconDocker}
        title={<T id="builder.dockerfile.title" />}
        description={<T id="builder.dockerfile.description" />}
        href={href('dockerfile')}
      />
    </div>
  );
}

type OptionProps = {
  Icon: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  description: React.ReactNode;
  href: string;
  selected?: boolean;
};

function Option({ Icon, title, description, href, selected }: OptionProps) {
  return (
    <Link
      className={clsx(
        'row max-w-80 items-start gap-3 rounded-xl border p-3 text-start',
        selected && 'border-green',
      )}
      href={href}
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
