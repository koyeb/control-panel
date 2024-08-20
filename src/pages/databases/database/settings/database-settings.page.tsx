import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { Button } from '@koyeb/design-system';
import { api } from 'src/api/api';
import { useDeployment, useService } from 'src/api/hooks/service';
import { isDatabaseDeployment } from 'src/api/mappers/deployment';
import { Service } from 'src/api/model';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { useAccessToken } from 'src/application/token';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { SectionHeader } from 'src/components/section-header';
import { useNavigate, useRouteParam } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';
import { DatabaseEstimatedCost } from 'src/modules/database-form/database-estimated-cost';
import { DatabaseForm } from 'src/modules/database-form/database-form';
import { assert } from 'src/utils/assert';

const T = Translate.prefix('pages.database.settings');

export function DatabaseSettingsPage() {
  const service = useService(useRouteParam('databaseServiceId'));
  const deployment = useDeployment(service?.latestDeploymentId);
  const [cost, setCost] = useState<number>();

  assert(service !== undefined);
  assert(isDatabaseDeployment(deployment));

  return (
    // eslint-disable-next-line tailwindcss/no-arbitrary-value
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
  const invalidate = useInvalidateApiQuery();
  const { token } = useAccessToken();
  const navigate = useNavigate();
  const t = T.useTranslate();

  const [dialogOpen, setDialogOpen] = useState(false);

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
      navigate(routes.home());
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

        <Button color="red" loading={mutation.isPending} onClick={() => setDialogOpen(true)}>
          <T id="delete.delete" />
        </Button>
      </div>

      <ConfirmationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
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
