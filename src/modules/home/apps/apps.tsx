import { Select } from '@koyeb/design-system';
import { useState } from 'react';

import { createTranslate } from 'src/intl/translate';
import { AppList, Service, ServiceType } from 'src/model';
import { identity } from 'src/utils/generic';
import { hasProperty } from 'src/utils/object';

import { AppItem } from './app-item';
import { EditAppDialog } from './components/edit-app-dialog';

const T = createTranslate('pages.home');

export function Apps({ apps, showFilters = false }: { apps: AppList; showFilters?: boolean }) {
  const [serviceType, setServiceType] = useState<ServiceType | 'all'>('all');

  return (
    <div className="col min-w-0 flex-1 gap-6">
      <Header
        showFilters={showFilters}
        services={Array.from(apps.services.values()).flat()}
        serviceType={serviceType}
        setServiceType={setServiceType}
      />

      {apps.apps.map((app) => {
        const services = apps.services
          .get(app.id)
          ?.filter((service) => serviceType === 'all' || service.type === serviceType);

        if (!services?.length) {
          return null;
        }

        return (
          <AppItem
            key={app.id}
            app={app}
            services={services}
            latestDeployments={apps.latestDeployments}
            activeDeployments={apps.activeDeployments}
            activeDeploymentsReplicas={apps.activeDeploymentsReplicas}
          />
        );
      })}

      <EditAppDialog />
    </div>
  );
}

type HeaderProps = {
  showFilters: boolean;
  services: Service[];
  serviceType: ServiceType | 'all';
  setServiceType: (type: ServiceType | 'all') => void;
};

function Header({ showFilters, services, serviceType, setServiceType }: HeaderProps) {
  const webServices = services.filter(hasProperty('type', 'web'));
  const workerServices = services.filter(hasProperty('type', 'worker'));
  const databaseServices = services.filter(hasProperty('type', 'database'));

  return (
    <header className="col gap-2 sm:row sm:items-center sm:gap-4">
      <span className="text-lg font-medium">
        <T id="services" />
      </span>

      <span className="text-dim">
        <T
          id="servicesSummary"
          values={{
            web: webServices.length,
            worker: workerServices.length,
            database: databaseServices.length,
          }}
        />
      </span>

      {showFilters && (
        <Select<ServiceType | 'all'>
          items={['all', 'web', 'worker', 'database']}
          selectedItem={serviceType}
          onSelectedItemChange={setServiceType}
          getKey={identity}
          itemToString={identity}
          renderItem={(type) => <T id={`serviceType.${type}`} />}
          className="w-full max-w-64 sm:ml-auto"
        />
      )}
    </header>
  );
}
