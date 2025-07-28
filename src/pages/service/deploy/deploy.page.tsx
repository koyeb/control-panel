import { Suspense } from 'react';

import { DeployToKoyebButton } from 'src/components/deploy-to-koyeb-button';
import { DocumentTitle } from 'src/components/document-title';
import { ServiceEstimatedCost } from 'src/components/service-estimated-cost';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import {
  ServiceForm,
  ServiceFormSkeleton,
  useDeployUrl,
  useEstimatedCost,
  useServiceForm,
} from 'src/modules/service-form';

import { DeployModel } from './deploy-model';

const T = createTranslate('pages.deploy');

export function DeployPage() {
  const params = useSearchParams();
  const type = params.get('type');
  const serviceId = params.get('serviceId');

  if (type === 'model') {
    return <DeployModel />;
  }

  return <DeployServiceForm serviceId={serviceId ?? undefined} />;
}

function DeployServiceForm({ serviceId }: { serviceId?: string }) {
  const t = T.useTranslate();

  return (
    <div className="col gap-6">
      <DocumentTitle title={t('documentTitle')} />

      <h1 className="typo-heading">
        <T id="title" />
      </h1>

      <Suspense
        fallback={
          <div className="col gap-8 lg:row">
            <ServiceFormSkeleton className="grow" />
            <div className="col w-full max-w-xs gap-8" />
          </div>
        }
      >
        <ServiceFormWrapper serviceId={serviceId} />
      </Suspense>
    </div>
  );
}

function ServiceFormWrapper({ serviceId }: { serviceId?: string }) {
  const navigate = useNavigate();

  const form = useServiceForm(serviceId);
  const cost = useEstimatedCost(form.watch());
  const deployUrl = useDeployUrl(form);

  return (
    <div className="col gap-8 lg:row">
      <ServiceForm
        form={form}
        onDeployed={(appId, serviceId) =>
          void navigate({ to: '/services/new', search: { step: 'initialDeployment', serviceId } })
        }
        className="grow"
      />

      <div className="col w-full max-w-xs gap-8">
        <ServiceEstimatedCost cost={cost} />
        <DeployToKoyebButton deployUrl={deployUrl} />
      </div>
    </div>
  );
}
