import { useState } from 'react';

import { routes } from 'src/application/routes';
import { DeployToKoyebButton } from 'src/components/deploy-to-koyeb-button';
import { DocumentTitle } from 'src/components/document-title';
import { ServiceEstimatedCost } from 'src/components/service-estimated-cost';
import { useNavigate, useSearchParam } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';
import { ServiceCost } from 'src/modules/service-form/helpers/estimated-cost';
import { ServiceForm } from 'src/modules/service-form/service-form';

import { DeployExampleApp } from './deploy-example-app';
import { DeployModel } from './deploy-model';

const T = Translate.prefix('pages.deploy');

export function DeployPage() {
  const [exampleApp] = useSearchParam('example_app');
  const [type] = useSearchParam('type');

  if (exampleApp) {
    return <DeployExampleApp />;
  }

  if (type === 'model') {
    return <DeployModel />;
  }

  return <DeployServiceForm />;
}

export function DeployServiceForm() {
  const t = T.useTranslate();
  const navigate = useNavigate();

  const [appId] = useSearchParam('appId');
  const [serviceId] = useSearchParam('serviceId');

  const [cost, setCost] = useState<ServiceCost>();
  const [deployUrl, setDeployUrl] = useState<string>();

  return (
    <div className="col gap-6">
      <DocumentTitle title={t('documentTitle')} />

      <h1 className="typo-heading">
        <T id="title" />
      </h1>

      <div className="col xl:row gap-8">
        <ServiceForm
          appId={appId ?? undefined}
          serviceId={serviceId ?? undefined}
          className="grow"
          onDeployed={(appId, serviceId) => navigate(routes.initialDeployment(serviceId))}
          onCostChanged={setCost}
          onDeployUrlChanged={setDeployUrl}
        />

        <div className="col shrink-0 gap-8 xl:basis-80">
          <ServiceEstimatedCost cost={cost} />
          <DeployToKoyebButton deployUrl={deployUrl} />
        </div>
      </div>
    </div>
  );
}
