import { useQuery } from '@tanstack/react-query';

import { isComputeDeployment, mapDeployment } from 'src/api/mappers/deployment';
import { App, Service } from 'src/api/model';
import { useApiQueryFn } from 'src/api/use-api';

import { DeploymentInfo } from './components/deployment-info';
import { DeploymentTrigger } from './components/deployment-trigger';
import { ServiceName } from './components/service-name';
import { ServiceUrl } from './components/service-url';

type ServiceItemProps = {
  app: App;
  service: Service;
};

export function ServiceItem({ app, service }: ServiceItemProps) {
  const { data: deployment } = useQuery({
    ...useApiQueryFn('getDeployment', {
      path: { id: service.latestDeploymentId },
    }),
    select: mapDeployment,
  });

  return (
    <div className="card">
      {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
      <div className="grid grid-cols-1 items-center gap-4 p-4 sm:grid-cols-[10rem_1fr_10rem] lg:grid-cols-[14rem_1fr_12rem]">
        <ServiceName service={service} />
        <ServiceUrl app={app} service={service} deployment={deployment} />
        <DeploymentInfo deployment={deployment} />
      </div>

      <footer className="row h-6 min-w-0 items-center !py-0">
        {isComputeDeployment(deployment) && <DeploymentTrigger trigger={deployment.trigger} />}
      </footer>
    </div>
  );
}
