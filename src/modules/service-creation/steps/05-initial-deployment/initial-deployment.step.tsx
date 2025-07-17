import { useAppQuery, useDeploymentQuery, useInstancesQuery, useServiceQuery } from 'src/api/hooks/service';
import { isComputeDeployment } from 'src/api/mappers/deployment';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { DeploymentInfo } from 'src/modules/deployment/deployment-info/deployment-info';
import { DeploymentLogs } from 'src/modules/deployment/deployment-logs/deployment-logs';
import { assert } from 'src/utils/assert';

import { DeploymentStatusDetails } from './components/deployment-status-details';

export function InitialDeploymentStep({ serviceId }: { serviceId: string }) {
  const serviceQuery = useServiceQuery(serviceId);
  const appQuery = useAppQuery(serviceQuery.data?.appId);
  const deploymentQuery = useDeploymentQuery(serviceQuery.data?.latestDeploymentId);
  const instancesQuery = useInstancesQuery({ deploymentId: serviceQuery.data?.latestDeploymentId });

  if (serviceQuery.isPending || appQuery.isPending || deploymentQuery.isPending || instancesQuery.isPending) {
    return <Loading />;
  }

  if (appQuery.isError) {
    return <QueryError error={appQuery.error} />;
  }

  if (serviceQuery.isError) {
    return <QueryError error={serviceQuery.error} />;
  }

  if (deploymentQuery.isError) {
    return <QueryError error={deploymentQuery.error} />;
  }

  if (instancesQuery.isError) {
    return <QueryError error={instancesQuery.error} />;
  }

  const app = appQuery.data;
  const service = serviceQuery.data;
  const deployment = deploymentQuery.data;
  const { instances } = instancesQuery.data;

  assert(isComputeDeployment(deployment));

  return (
    <div className="col gap-8 xl:row">
      <div className="col min-w-0 flex-1 gap-8">
        <DeploymentInfo app={app} service={service} deployment={deployment} />
        <DeploymentLogs app={app} service={service} deployment={deployment} instances={instances} />
      </div>

      <div className="basis-80">
        <DeploymentStatusDetails app={app} service={service} deployment={deployment} />
      </div>
    </div>
  );
}
