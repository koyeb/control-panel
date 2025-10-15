import { isComputeDeployment } from 'src/api';
import { FormattedDistanceToNow } from 'src/intl/formatted';

import { DeploymentInfo } from './components/deployment-info';
import { DeploymentTrigger } from './components/deployment-trigger';
import { ServiceName } from './components/service-name';
import { ServiceUrl } from './components/service-url';
import { ServiceItemProps } from './service-item';

export function ServiceItemOld({ app, service, latestDeployment: deployment }: ServiceItemProps) {
  return (
    <div className="card">
      <div className="grid grid-cols-1 items-center gap-4 p-4 sm:grid-cols-[10rem_1fr_10rem] lg:grid-cols-[14rem_1fr_12rem]">
        <ServiceName service={service} />
        <ServiceUrl app={app} service={service} deployment={deployment} />
        <DeploymentInfo deployment={deployment} />
      </div>

      <footer className="row h-6 min-w-0 items-center gap-4 !py-0">
        {isComputeDeployment(deployment) && (
          <>
            <DeploymentTrigger trigger={deployment.trigger} />
            <span className="text-xs text-nowrap text-dim">
              <FormattedDistanceToNow value={deployment.date} />
            </span>
          </>
        )}
      </footer>
    </div>
  );
}
