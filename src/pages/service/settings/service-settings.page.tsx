import { useState } from 'react';

import { useService } from 'src/api/hooks/service';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { DeployToKoyebButton } from 'src/components/deploy-to-koyeb-button';
import { ServiceEstimatedCost } from 'src/components/service-estimated-cost';
import { useNavigate, useRouteParam } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';
import { ServiceCost } from 'src/modules/service-form/helpers/estimated-cost';
import { ServiceForm } from 'src/modules/service-form/service-form';
import { defined } from 'src/utils/assert';

import { DeleteServiceCard } from './components/delete-service-card';
import { PauseServiceCard } from './components/pause-service-card';

const T = Translate.prefix('pages.service.settings');

export function ServiceSettingsPage() {
  const navigate = useNavigate();
  const t = T.useTranslate();

  const serviceId = useRouteParam('serviceId');
  const service = defined(useService(serviceId));

  const [cost, setCost] = useState<ServiceCost>();
  const [deployUrl, setDeployUrl] = useState<string>();

  return (
    // eslint-disable-next-line tailwindcss/no-arbitrary-value
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_20rem]">
      <ServiceForm
        serviceId={serviceId}
        onDeployed={(appId, serviceId, deploymentId) =>
          navigate(routes.service.overview(serviceId, deploymentId))
        }
        onSaved={() => notify.info(t('saved'))}
        onCostChanged={setCost}
        onDeployUrlChanged={setDeployUrl}
      />

      <div className="col max-w-sm gap-8 xl:w-full">
        <ServiceEstimatedCost cost={cost} />
        <DeployToKoyebButton deployUrl={deployUrl} />
      </div>

      <PauseServiceCard service={service} />
      <div className="hidden xl:block" />

      <DeleteServiceCard service={service} />
      <div className="hidden xl:block" />
    </div>
  );
}
