import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import {
  apiMutation,
  isDatabaseDeployment,
  useApi,
  useDeployment,
  useInvalidateApiQuery,
  useService,
} from 'src/api';
import { notify } from 'src/application/notify';
import { openDialog } from 'src/components/dialog';
import { SectionHeader } from 'src/components/section-header';
import { useNavigate, useRouteParam } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { Service } from 'src/model';
import { DatabaseEstimatedCost } from 'src/modules/database-form/database-estimated-cost';
import { DatabaseForm } from 'src/modules/database-form/database-form';
import { assert } from 'src/utils/assert';

const T = createTranslate('pages.database.settings');

export function DatabaseSettingsPage() {
  const databaseServiceId = useRouteParam('databaseServiceId');
  const service = useService(databaseServiceId);
  const deployment = useDeployment(service?.latestDeploymentId);

  const [cost, setCost] = useState<number>();

  if (!service || !deployment) {
    return null;
  }

  assert(isDatabaseDeployment(deployment));

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_20rem]">
      <DatabaseForm deployment={deployment} onCostChanged={setCost} />

      <div className="max-w-sm xl:w-full">
        <DatabaseEstimatedCost cost={cost} />
      </div>

      <DeleteDatabaseService service={service} />
      <div className="hidden xl:block" />
    </div>
  );
}

function DeleteDatabaseService({ service }: { service: Service }) {
  const t = T.useTranslate();

  const api = useApi();
  const invalidate = useInvalidateApiQuery();
  const navigate = useNavigate();

  const deleteAppMutation = useMutation({
    ...apiMutation('delete /v1/apps/{id}', (appId: string) => ({
      path: { id: appId },
    })),
  });

  const deleteServiceMutation = useMutation({
    ...apiMutation('delete /v1/services/{id}', (service: Service) => ({
      path: { id: service.id },
    })),
    async onSuccess() {
      const { services } = await api('get /v1/services', {
        query: { app_id: service.appId },
      });

      if (services?.length === 0) {
        await deleteAppMutation.mutateAsync(service.appId);
      }

      await Promise.all([invalidate('get /v1/apps'), invalidate('get /v1/services')]);

      notify.info(t('delete.confirmation.success', { serviceName: service.name }));
      await navigate({ to: '/services' });
    },
  });

  const onDelete = () => {
    openDialog('Confirmation', {
      title: t('delete.confirmation.title'),
      description: t('delete.confirmation.description'),
      destructiveAction: true,
      confirmationText: service.name,
      submitText: t('delete.confirmation.confirm'),
      onConfirm: () => deleteServiceMutation.mutateAsync(service),
    });
  };

  return (
    <section className="card">
      <div className="row items-center gap-4 p-3">
        <SectionHeader
          title={<T id="delete.title" />}
          description={<T id="delete.description" />}
          className="flex-1"
        />

        <Button color="red" loading={deleteServiceMutation.isPending} onClick={onDelete}>
          <T id="delete.delete" />
        </Button>
      </div>
    </section>
  );
}
