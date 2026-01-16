import { Suspense } from 'react';

import { useService } from 'src/api';
import { notify } from 'src/application/notify';
import { DeployToKoyebButton } from 'src/components/deploy-to-koyeb-button';
import { ServiceEstimatedCost } from 'src/components/service-estimated-cost';
import { FeatureFlag } from 'src/hooks/feature-flag';
import { useNavigate, useRouteParam } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import {
  ServiceForm,
  ServiceFormSkeleton,
  useDeployUrl,
  useEstimatedCost,
  useServiceForm,
} from 'src/modules/service-form';
import { defined } from 'src/utils/assert';

import { DeleteServiceCard } from './components/delete-service-card';
import { DuplicateServiceCard } from './components/duplicate-service-card';
import { PauseServiceCard } from './components/pause-service-card';
import { ServiceLifeCycleCard } from './components/service-life-cycle-card';

const T = createTranslate('pages.service.settings');

export function ServiceSettingsPage() {
  const serviceId = useRouteParam('serviceId');
  const service = defined(useService(serviceId));

  return (
    <div className="grid auto-rows-min grid-cols-1 items-start gap-8 xl:grid-cols-[1fr_20rem]">
      <Suspense fallback={<ServiceFormSkeleton />}>
        <ServiceFormWrapper serviceId={serviceId} />
      </Suspense>

      <FeatureFlag feature="service-lifecycle">
        <ServiceLifeCycleCard service={service} />
      </FeatureFlag>

      <PauseServiceCard service={service} />
      <DuplicateServiceCard service={service} />
      <DeleteServiceCard service={service} />
    </div>
  );
}

function ServiceFormWrapper({ serviceId }: { serviceId: string }) {
  const t = T.useTranslate();
  const navigate = useNavigate();

  const form = useServiceForm(serviceId);
  const cost = useEstimatedCost(form.watch());
  const deployUrl = useDeployUrl(form);

  return (
    <>
      <ServiceForm
        form={form}
        onDeployed={(appId, serviceId, deploymentId) =>
          void navigate({
            to: '/services/$serviceId',
            params: { serviceId },
            search: { deploymentId },
          })
        }
        onSaved={() => notify.info(t('saved'))}
      />

      <div className="col max-w-sm gap-8">
        <ServiceEstimatedCost cost={cost} />
        <DeployToKoyebButton deployUrl={deployUrl} />
      </div>
    </>
  );
}
