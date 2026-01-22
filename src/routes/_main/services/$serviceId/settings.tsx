import { createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';

import { useService } from 'src/api';
import { notify } from 'src/application/notify';
import { DeployToKoyebButton } from 'src/components/deploy-to-koyeb-button';
import { ServiceEstimatedCost } from 'src/components/service-estimated-cost';
import { FeatureFlag } from 'src/hooks/feature-flag';
import { useNavigate, useRouteParam } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import {
  ServiceForm,
  ServiceFormSkeleton,
  useDeployUrl,
  useEstimatedCost,
  useServiceForm,
} from 'src/modules/service-form';
import {
  DeleteServiceCard,
  DuplicateServiceCard,
  PauseServiceCard,
  ServiceLifeCycleCard,
} from 'src/modules/service-settings';
import { defined } from 'src/utils/assert';

export const Route = createFileRoute('/_main/services/$serviceId/settings')({
  component: ServiceSettingsPage,

  beforeLoad: ({ params }) => ({
    breadcrumb: () => <CrumbLink to={Route.fullPath} params={params} />,
  }),
});

const T = createTranslate('pages.service.settings');

function ServiceSettingsPage() {
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
