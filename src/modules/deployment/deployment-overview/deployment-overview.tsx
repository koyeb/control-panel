import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { TranslateEnum, createTranslate } from 'src/intl/translate';
import { App, ComputeDeployment, Service } from 'src/model';

import { DeploymentDefinition } from './deployment-definition';
import { ExternalUrl } from './external-url';
import { InternalUrl } from './internal-url';
import { ServiceLifecycle } from './service-lifecycle';
import { TcpProxyUrl } from './tcp-proxy-url';

const T = createTranslate('modules.deployment.deploymentOverview');

type DeploymentInfoProps = {
  app: App;
  service: Service;
  deployment: ComputeDeployment;
};

export function DeploymentOverview({ app, service, deployment }: DeploymentInfoProps) {
  const { type } = deployment.definition;

  return (
    <section className="col gap-4 rounded-md border p-3">
      <header className="col gap-3">
        <div className="row items-center gap-4">
          <div className="text-base font-medium">
            <T id="overview" />
          </div>

          <div className="ml-auto row items-center gap-2 font-medium">
            <TranslateEnum enum="serviceType" value={type} />
            <ServiceTypeIcon type={type} />
          </div>
        </div>

        {type !== 'worker' && (
          <div className="row flex-wrap gap-x-16 gap-y-4">
            <ExternalUrl app={app} service={service} deployment={deployment} />
            <InternalUrl app={app} service={service} deployment={deployment} />
            <TcpProxyUrl app={app} service={service} deployment={deployment} />
          </div>
        )}
      </header>

      <ServiceLifecycle service={service} />

      {(service.type !== 'worker' || service.lifeCycle.deleteAfterCreate) && (
        <div className="font-medium">
          <T id="deploymentDefinition" />
        </div>
      )}

      <DeploymentDefinition service={service} deployment={deployment} />
    </section>
  );
}
