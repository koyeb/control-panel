import { useState } from 'react';

import { DeployToKoyebButton } from 'src/components/deploy-to-koyeb-button';
import { ServiceEstimatedCost } from 'src/components/service-estimated-cost';
import { useNavigate } from 'src/hooks/router';
import { ServiceCost } from 'src/modules/service-form/helpers/estimated-cost';
import { ServiceForm } from 'src/modules/service-form/service-form';

import { Tips } from './tips';

export function ReviewStep() {
  const [cost, setCost] = useState<ServiceCost>();
  const [deployUrl, setDeployUrl] = useState<string>();
  const navigate = useNavigate();

  return (
    <div className="col gap-8 xl:row">
      <ServiceForm
        className="grow"
        onDeployed={(appId, serviceId) =>
          navigate({ to: '/services/new', search: { step: 'initialDeployment', serviceId } })
        }
        onCostChanged={setCost}
        onDeployUrlChanged={setDeployUrl}
      />

      <div className="col max-w-sm shrink-0 gap-8 xl:basis-80">
        <Tips />
        <ServiceEstimatedCost cost={cost} />
        <DeployToKoyebButton deployUrl={deployUrl} />
      </div>
    </div>
  );
}
