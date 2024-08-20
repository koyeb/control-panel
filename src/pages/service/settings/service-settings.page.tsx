import { useState } from 'react';

import { useService } from 'src/api/hooks/service';
import { routes } from 'src/application/routes';
import { ServiceEstimatedCost } from 'src/components/service-estimated-cost';
import { useNavigate, useRouteParam } from 'src/hooks/router';
import { ServiceCost } from 'src/modules/service-form/helpers/estimated-cost';
import { ServiceForm } from 'src/modules/service-form/service-form';
import { defined } from 'src/utils/assert';

import { DeleteServiceCard } from './components/delete-service-card';
import { PauseServiceCard } from './components/pause-service-card';

export function ServiceSettingsPage() {
  const navigate = useNavigate();

  const serviceId = useRouteParam('serviceId');
  const service = defined(useService(serviceId));

  const [cost, setCost] = useState<ServiceCost>();

  return (
    // eslint-disable-next-line tailwindcss/no-arbitrary-value
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_20rem]">
      <ServiceForm
        serviceId={serviceId}
        onSubmitted={(appId, serviceId, deploymentId) =>
          navigate(routes.service.overview(serviceId, deploymentId))
        }
        onCostChanged={setCost}
      />

      <div className="max-w-sm xl:w-full">
        <ServiceEstimatedCost cost={cost} />
      </div>

      <PauseServiceCard service={service} />
      <div className="hidden xl:block" />

      <DeleteServiceCard service={service} />
      <div className="hidden xl:block" />
    </div>
  );
}
