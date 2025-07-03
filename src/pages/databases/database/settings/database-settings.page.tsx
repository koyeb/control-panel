import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { api } from 'src/api/api';
import { useDeployment, useService } from 'src/api/hooks/service';
import { isDatabaseDeployment } from 'src/api/mappers/deployment';
import { Service } from 'src/api/model';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { useAuth } from 'src/application/authentication';
import { notify } from 'src/application/notify';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { Dialog } from 'src/components/dialog';
import { SectionHeader } from 'src/components/section-header';
import { useNavigate, useRouteParam } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
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
  const navigate = useNavigate();
  const openDialog = Dialog.useOpen();

  const invalidate = useInvalidateApiQuery();
  const { token } = useAuth();

  const mutation = useMutation({
    async mutationFn() {
      await api.deleteService({
        token,
        path: { id: service.id },
      });

      const { services } = await api.listServices({
        token,
        query: { app_id: service.appId },
      });

      if (services?.length === 0) {
        await api.deleteApp({
          token,
          path: { id: service.appId },
        });
      }
    },
    async onSuccess() {
      await invalidate('listApps');
      await invalidate('listServices');
      navigate({ to: '/' });
      notify.info(t('delete.successNotification', { serviceName: service.name }));
    },
  });

  return (
    <section className="card">
      <div className="row items-center gap-4 p-3">
        <SectionHeader
          title={<T id="delete.title" />}
          description={<T id="delete.description" />}
          className="flex-1"
        />

        <Button
          color="red"
          loading={mutation.isPending}
          onClick={() => openDialog('ConfirmDeleteDatabaseService', { resourceId: service.id })}
        >
          <T id="delete.delete" />
        </Button>
      </div>

      <ConfirmationDialog
        id="ConfirmDeleteDatabaseService"
        resourceId={service.id}
        title={<T id="delete.confirmationDialog.title" />}
        description={<T id="delete.confirmationDialog.description" />}
        destructiveAction
        confirmationText={service.name}
        submitText={<T id="delete.confirmationDialog.confirm" />}
        onConfirm={() => mutation.mutateAsync()}
      />
    </section>
  );
}
