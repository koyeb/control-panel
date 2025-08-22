import { Suspense } from 'react';

import { DeployToKoyebButton } from 'src/components/deploy-to-koyeb-button';
import { ServiceEstimatedCost } from 'src/components/service-estimated-cost';
import { useNavigate } from 'src/hooks/router';
import {
  ServiceForm,
  ServiceFormSkeleton,
  useDeployUrl,
  useEstimatedCost,
  useServiceForm,
} from 'src/modules/service-form';

import { Tips } from './tips';

export function ReviewStep() {
  return (
    <Suspense
      fallback={
        <div className="col gap-8 lg:row">
          <ServiceFormSkeleton className="grow" />
          <div className="col w-full max-w-xs gap-8" />
        </div>
      }
    >
      <ServiceFormWrapper />
    </Suspense>
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
          navigate({ to: '/services/new', search: { step: 'initialDeployment', serviceId } })
        }
        onBack={() =>
          navigate({ to: '/services/new', search: (prev) => ({ ...prev, step: 'instanceRegions' }) })
        }
        className="grow"
      />

      <div className="col w-full max-w-xs gap-8">
        <Tips />
        <ServiceEstimatedCost cost={cost} />
        <DeployToKoyebButton deployUrl={deployUrl} />
      </div>
    </div>
  );
}
