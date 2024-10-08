import { useEffect } from 'react';

import { ServiceType } from 'src/api/model';
import { routes } from 'src/application/routes';
import { IconGithub } from 'src/components/icons';
import { LinkButton } from 'src/components/link';
import { useNavigate, useSearchParam } from 'src/hooks/router';
import IconDocker from 'src/icons/docker.svg?react';
import { Translate } from 'src/intl/translate';
import { SourceType } from 'src/modules/service-form/service-form.types';
import { inArray } from 'src/utils/arrays';

import { ExampleAppList } from './example-apps-list';
import { ServiceTypeList } from './service-type-list';

const T = Translate.prefix('serviceCreation.serviceType');

function isServiceType(value: unknown): value is ServiceType {
  return inArray(value, ['web', 'private', 'worker', 'database']);
}

type ServiceTypeStepProps = {
  onNext: () => void;
};

export function ServiceTypeStep({ onNext }: ServiceTypeStepProps) {
  const [appId] = useSearchParam('appId');
  const [serviceType, setServiceType] = useSearchParam('service_type');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isServiceType(serviceType)) {
      setServiceType('web');
    }
  }, [serviceType, setServiceType]);

  const handleNext = (source: SourceType) => {
    navigate((url) => {
      url.searchParams.set('type', source);

      if (serviceType === 'private') {
        url.searchParams.set('service_type', 'web');
        url.searchParams.set('ports', '8000;tcp');
      }
    });

    onNext();
  };

  return (
    <div className="col sm:row divide-y rounded-md border sm:divide-x md:divide-y-0">
      <nav className="col gap-3 p-3 md:min-w-72 md:p-6">
        <ServiceTypeList serviceType={serviceType} setServiceType={setServiceType} />
        <hr />
        <ExampleAppList />
      </nav>

      <div className="p-3 md:p-6 md:pl-12">
        {isServiceType(serviceType) && serviceType !== 'database' && (
          <div className="col gap-4">
            <div className="col gap-2">
              <div className="text-base font-medium">
                <T id={`${serviceType}.title`} />
              </div>
              <div className="text-dim">
                <T id={`${serviceType}.description`} />
              </div>
            </div>

            <DeploymentSource onNext={handleNext} />
          </div>
        )}

        {serviceType === 'database' && (
          <div className="col gap-6">
            <div className="col gap-2">
              <div className="text-base font-medium">
                <T id="database.title" />
              </div>
              <div className="text-dim">
                <T id="database.description" />
              </div>
            </div>

            <LinkButton className="self-start" href={createDatabaseServiceUrl(appId)}>
              <T id="database.button" />
            </LinkButton>
          </div>
        )}
      </div>
    </div>
  );
}

function createDatabaseServiceUrl(appId: string | null) {
  let url = routes.createDatabaseService();

  if (appId !== null) {
    url += `?${String(new URLSearchParams({ appId }))}`;
  }

  return url;
}

function DeploymentSource({ onNext }: { onNext: (source: SourceType) => void }) {
  return (
    <div className="col lg:row gap-4">
      <DeploymentSourceOption
        Icon={IconGithub}
        title={<T id="deploymentSource.github.title" />}
        description={<T id="deploymentSource.github.description" />}
        onClick={() => onNext('git')}
      />

      <DeploymentSourceOption
        Icon={IconDocker}
        title={<T id="deploymentSource.docker.title" />}
        description={<T id="deploymentSource.docker.description" />}
        onClick={() => onNext('docker')}
      />
    </div>
  );
}

type DeploymentSourceOptionProps = {
  Icon: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  description: React.ReactNode;
  onClick: () => void;
};

function DeploymentSourceOption({ Icon, title, description, onClick }: DeploymentSourceOptionProps) {
  return (
    <button
      type="button"
      className="row max-w-80 items-center gap-3 rounded-xl border p-3 text-start"
      onClick={onClick}
    >
      <div className="rounded-lg bg-muted p-3">
        <Icon className="size-10" />
      </div>
      <div>
        <div className="mb-1 font-medium">{title}</div>
        <div className="text-dim">{description}</div>
      </div>
    </button>
  );
}
