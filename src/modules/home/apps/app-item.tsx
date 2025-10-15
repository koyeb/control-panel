import { InfoTooltip } from 'src/components/tooltip';
import { createTranslate } from 'src/intl/translate';
import { App, Deployment, Replica, Service } from 'src/model';

import { AppActions } from './components/app-actions';
import { ServiceItem } from './service-item';

const T = createTranslate('pages.home');

type AppItemProps = {
  app: App;
  services: Service[];
  latestDeployments: Map<string, Deployment>;
  activeDeployments: Map<string, Deployment>;
  activeDeploymentsReplicas: Map<string, Replica[]>;
};

export function AppItem({
  app,
  services,
  latestDeployments,
  activeDeployments,
  activeDeploymentsReplicas,
}: AppItemProps) {
  return (
    <div className="col gap-2">
      <AppHeader app={app} />

      <div className="col gap-4">
        {services.map((service) => (
          <ServiceItem
            key={service.id}
            app={app}
            service={service}
            latestDeployment={latestDeployments.get(service.id)!}
            activeDeployment={activeDeployments.get(service.id)}
            activeDeploymentReplicas={activeDeploymentsReplicas.get(service.id)}
          />
        ))}

        {services.length === 0 && <NoServicesFallback />}
      </div>
    </div>
  );
}

function AppHeader({ app }: { app: App }) {
  return (
    <div className="row items-center gap-4">
      <div className="row items-center gap-2">
        <span className="font-medium">{app.name}</span>
        <InfoTooltip content={<T id="appTooltip" />} />
      </div>

      <AppActions app={app} />
    </div>
  );
}

function NoServicesFallback() {
  return (
    <div className="col gap-4 text-dim">
      <T id="noServices" />
    </div>
  );
}
