import { useState } from 'react';

import { routes } from 'src/application/routes';
import { DocumentTitle } from 'src/components/document-title';
import { ServiceEstimatedCost } from 'src/components/service-estimated-cost';
import { useNavigate, useSearchParam } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';
import { ServiceCost } from 'src/modules/service-form/helpers/estimated-cost';
import { ServiceForm } from 'src/modules/service-form/service-form';

import { DeployExampleApp } from './deploy-example-app';

const T = Translate.prefix('pages.deploy');

export function DeployPage() {
  const [exampleApp] = useSearchParam('example_app');

  if (exampleApp) {
    return <DeployExampleApp />;
  }

  return <DeployServiceForm />;
}

export function DeployServiceForm() {
  const t = T.useTranslate();
  const navigate = useNavigate();

  const [appId] = useSearchParam('appId');
  const [serviceId] = useSearchParam('serviceId');

  const [cost, setCost] = useState<ServiceCost>();

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
          onSubmitted={(appId, serviceId) => navigate(routes.initialDeployment(serviceId))}
          onCostChanged={setCost}
        />

        <div className="shrink-0 xl:basis-80">
          <ServiceEstimatedCost cost={cost} />
        </div>
      </div>
    </div>
  );
}
