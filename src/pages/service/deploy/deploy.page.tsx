import { useState } from 'react';

import { DeployToKoyebButton } from 'src/components/deploy-to-koyeb-button';
import { DocumentTitle } from 'src/components/document-title';
import { ServiceEstimatedCost } from 'src/components/service-estimated-cost';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { ServiceCost } from 'src/modules/service-form/helpers/estimated-cost';
import { ServiceForm } from 'src/modules/service-form/service-form';

import { DeployModel } from './deploy-model';
import { DeployOneClickApp } from './deploy-one-click-app';

const T = createTranslate('pages.deploy');

export function DeployPage() {
  const params = useSearchParams();
  const oneClickApp = params.get('one_click_app');
  const type = params.get('type');

  if (oneClickApp) {
    return <DeployOneClickApp />;
  }

  if (type === 'model') {
    return <DeployModel />;
  }

  return <DeployServiceForm />;
}

function DeployServiceForm() {
  const t = T.useTranslate();

  const serviceId = useSearchParams().get('serviceId');
  const navigate = useNavigate();

  const [cost, setCost] = useState<ServiceCost>();
  const [deployUrl, setDeployUrl] = useState<string>();

  return (
    <div className="col gap-6">
      <DocumentTitle title={t('documentTitle')} />

      <h1 className="typo-heading">
        <T id="title" />
      </h1>

      <div className="col gap-8 xl:row">
        <ServiceForm
          serviceId={serviceId ?? undefined}
          className="grow"
          onDeployed={(appId, serviceId) =>
            navigate({ to: '/services/new', search: { step: 'initialDeployment', serviceId } })
          }
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
