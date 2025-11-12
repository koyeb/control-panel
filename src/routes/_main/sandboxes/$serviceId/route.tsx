import { Button, TabButtons } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router';

import { apiMutation, useService, useServiceQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { closeDialog, openDialog } from 'src/components/dialog';
import { TabButtonLink } from 'src/components/link';
import { QueryGuard } from 'src/components/query-error';
import { TextSkeleton } from 'src/components/skeleton';
import { Title } from 'src/components/title';
import { IconPause, IconPlay, IconTrash } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';

const T = createTranslate('pages.sandbox.details.navigation');

export const Route = createFileRoute('/_main/sandboxes/$serviceId')({
  component: SandboxLayout,

  beforeLoad: ({ params }) => ({
    breadcrumb: () => <Crumb serviceId={params.serviceId} />,
  }),
});

function Crumb({ serviceId }: { serviceId: string }) {
  const service = useService(serviceId);

  return (
    <CrumbLink to={Route.fullPath} params={{ serviceId }}>
      {service?.name ?? <TextSkeleton width={8} />}
    </CrumbLink>
  );
}

function SandboxLayout() {
  const { serviceId } = Route.useParams();
  const serviceQuery = useServiceQuery(serviceId);

  return (
    <QueryGuard query={serviceQuery}>
      {(service) => (
        <div className="col gap-8">
          <Title title={service.name} end={<Actions serviceId={serviceId} />} />

          <TabButtons>
            <TabButtonLink to="/sandboxes/$serviceId" params={{ serviceId }}>
              <T id="overview" />
            </TabButtonLink>

            <TabButtonLink to="/sandboxes/$serviceId/metrics" params={{ serviceId }}>
              <T id="metrics" />
            </TabButtonLink>

            <TabButtonLink to="/sandboxes/$serviceId/console" params={{ serviceId }}>
              <T id="console" />
            </TabButtonLink>
          </TabButtons>

          <Outlet />
        </div>
      )}
    </QueryGuard>
  );
}

function Actions({ serviceId }: { serviceId: string }) {
  const t = T.useTranslate();
  const navigate = useNavigate();

  const service = useService(serviceId);

  const pauseMutation = useMutation({
    ...apiMutation('post /v1/services/{id}/pause', (serviceId: string) => ({ path: { id: serviceId } })),
    onSuccess: () => {
      notify.info(t('actions.pause.success'));
      closeDialog();
    },
  });

  const resumeMutation = useMutation({
    ...apiMutation('post /v1/services/{id}/resume', (serviceId: string) => ({ path: { id: serviceId } })),
    onSuccess: () => {
      notify.info(t('actions.resume.success'));
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    ...apiMutation('delete /v1/services/{id}', (serviceId: string) => ({ path: { id: serviceId } })),
    onSuccess: async () => {
      notify.info(t('actions.delete.success'));
      closeDialog();
      await navigate({ to: '/' });
    },
  });

  return (
    <div className="row gap-4">
      {service?.status !== 'PAUSED' && (
        <Button
          color="gray"
          loading={service?.status === 'PAUSING'}
          onClick={() =>
            openDialog('Confirmation', {
              title: t('actions.pause.title'),
              description: t('actions.pause.description'),
              confirmationText: service?.name ?? '',
              submitText: t('actions.pause.confirm'),
              onConfirm: () => pauseMutation.mutateAsync(serviceId),
            })
          }
        >
          <IconPause className="size-4 fill-current stroke-none" />
          <T id="actions.pause.button" />
        </Button>
      )}

      {service?.status === 'PAUSED' && (
        <Button
          color="gray"
          loading={resumeMutation.isPending}
          onClick={() => resumeMutation.mutate(serviceId)}
        >
          <IconPlay className="size-4 fill-current stroke-none" />
          <T id="actions.resume.button" />
        </Button>
      )}

      <Button
        color="red"
        onClick={() =>
          openDialog('Confirmation', {
            title: t('actions.delete.title'),
            description: t('actions.delete.description'),
            destructiveAction: true,
            confirmationText: service?.name ?? '',
            submitText: t('actions.delete.confirm'),
            onConfirm: () => deleteMutation.mutateAsync(serviceId),
          })
        }
      >
        <IconTrash className="size-4" />
        <T id="actions.delete.button" />
      </Button>
    </div>
  );
}
