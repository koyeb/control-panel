import { useDeployment } from 'src/api/hooks/service';
import { isComputeDeployment } from 'src/api/mappers/deployment';
import { App, Service } from 'src/api/model';
import { FormattedDistanceToNow } from 'src/intl/formatted';

import { DeploymentInfo } from './components/deployment-info';
import { DeploymentTrigger } from './components/deployment-trigger';
import { ServiceName } from './components/service-name';
import { ServiceUrl } from './components/service-url';

type ServiceItemProps = {
  app: App;
  service: Service;
};

export function ServiceItem({ app, service }: ServiceItemProps) {
  const deployment = useDeployment(service.latestDeploymentId);

  return (
    <div className="card">
      {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
      <div className="grid grid-cols-1 items-center gap-4 p-4 sm:grid-cols-[10rem_1fr_10rem] lg:grid-cols-[14rem_1fr_12rem]">
        <ServiceName service={service} />
        <ServiceUrl app={app} service={service} deployment={deployment} />
        <DeploymentInfo deployment={deployment} />
      </div>

      <footer className="row h-6 min-w-0 items-center gap-4 !py-0">
        {isComputeDeployment(deployment) && (
          <>
            <DeploymentTrigger trigger={deployment.trigger} />
            <span className="text-nowrap text-xs text-dim">
              <FormattedDistanceToNow value={deployment.date} />
            </span>
          </>
        )}
      </footer>
    </div>
  );
}
