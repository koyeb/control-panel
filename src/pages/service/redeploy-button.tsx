import { Alert, Button, Tooltip } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
// eslint-disable-next-line no-restricted-imports
import { useRoute } from 'wouter';

import { useCatalogInstanceRegionsAvailability, useInstance } from 'src/api/hooks/catalog';
import { useComputeDeployment } from 'src/api/hooks/service';
import { App, Service } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { hasBuild } from 'src/application/service-functions';
import { CliInfoButton, CliInfoTooltip } from 'src/components/cli-info';
import { ControlledCheckbox } from 'src/components/controlled';
import { Dialog, DialogHeader } from 'src/components/dialog';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useNavigate } from 'src/hooks/router';
import { IconArrowRight } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.service.layout');

export function RedeployButton({ app, service }: { app: App; service: Service }) {
  const openDialog = Dialog.useOpen();
  const [isServiceSettings] = useRoute(`/services/${service.id}/settings`);

  if (isServiceSettings || service.status === 'PAUSED') {
    return null;
  }

  return (
    <>
      <CliInfoButton
        button={
          <Button onClick={() => openDialog('Redeploy')} className="self-stretch sm:self-start">
            <T id="redeploy" />
          </Button>
        }
        tooltip={
          <CliInfoTooltip
            title={<T id="redeployCli.title" />}
            description={<T id="redeployCli.description" />}
            command={`koyeb service redeploy ${app.name}/${service.name}`}
          />
        }
      />

      <RedeployDialog id="Redeploy" service={service} />
    </>
  );
}

type RedeployDialogProps = {
  id: string;
  context?: Record<string, unknown>;
  service: Service;
};

function RedeployDialog({ id, context, service }: RedeployDialogProps) {
  const t = T.useTranslate();
  const closeDialog = Dialog.useClose();
  const navigate = useNavigate();
  const invalidate = useInvalidateApiQuery();

  const latestDeployment = useComputeDeployment(service.latestDeploymentId);
  const latestStashed = latestDeployment?.status === 'STASHED';

  const availability = useCatalogInstanceRegionsAvailability(
    latestDeployment?.definition.instanceType,
    latestDeployment?.definition.regions,
  );

  const instance = useInstance(latestDeployment?.definition.instanceType);

  const form = useForm({
    defaultValues: {
      skipBuild: false,
      useCache: hasBuild(latestDeployment),
    },
  });

  const redeploy = useMutation({
    ...useApiMutationFn('redeployService', ({ skipBuild, useCache }: FormValues<typeof form>) => ({
      path: { id: service.id },
      body: { skip_build: skipBuild, use_cache: useCache },
    })),
    async onSuccess({ deployment }) {
      await invalidate('listDeployments');

      closeDialog();

      await navigate({
        to: '/services/$serviceId',
        params: { serviceId: service.id },
        search: { deploymentId: deployment?.id },
      });

      notify.info(t('redeploying'));
    },
  });

  const wasBuilt = hasBuild(latestDeployment) && service.lastProvisionedDeploymentId !== undefined;

  return (
    <Dialog id={id} context={context} onClosed={form.reset} className="col w-full max-w-xl gap-4">
      <DialogHeader title={<T id="redeployDialog.title" />} />

      <p className="text-dim">
        <T id={wasBuilt ? 'redeployDialog.descriptionWithBuild' : 'redeployDialog.descriptionWithoutBuild'} />
      </p>

      {availability === 'low' && (
        <Alert
          variant="info"
          title={<T id="redeployDialog.lowCapacity.title" values={{ instance: instance?.displayName }} />}
          description={<T id="redeployDialog.lowCapacity.description" />}
        />
      )}

      <form onSubmit={handleSubmit(form, redeploy.mutateAsync)} className="col gap-2">
        {wasBuilt && (
          <>
            <div className="col items-start gap-4 rounded-md border p-3">
              <div className="col gap-1">
                <div className="font-medium">
                  <T id="redeployDialog.skipBuild.title" />
                </div>

                <div className="text-xs text-dim">
                  <T id="redeployDialog.skipBuild.description" />
                </div>
              </div>

              <Tooltip content={latestStashed && <T id="redeployDialog.skipBuild.latestStashed" />}>
                {(props) => (
                  <div {...props}>
                    <Button
                      type="submit"
                      disabled={latestStashed}
                      loading={form.formState.isSubmitting && form.watch('skipBuild')}
                      onClick={() => {
                        form.setValue('useCache', false);
                        form.setValue('skipBuild', true);
                      }}
                    >
                      <T id="redeployDialog.skipBuild.cta" />
                      <IconArrowRight className="size-4" />
                    </Button>
                  </div>
                )}
              </Tooltip>
            </div>

            <div className="col items-start gap-4 rounded-md border p-3">
              <div className="col gap-1">
                <div className="font-medium">
                  <T id="redeployDialog.triggerBuild.title" />
                </div>

                <div className="text-xs text-dim">
                  <T id="redeployDialog.triggerBuild.description" />
                </div>
              </div>

              <ControlledCheckbox
                control={form.control}
                name="useCache"
                label={<T id="redeployDialog.triggerBuild.useCache" />}
              />

              <Button
                type="submit"
                loading={form.formState.isSubmitting && !form.watch('skipBuild')}
                onClick={() => form.setValue('skipBuild', false)}
              >
                <T id="redeployDialog.triggerBuild.cta" />
                <IconArrowRight className="size-4" />
              </Button>
            </div>
          </>
        )}

        {!wasBuilt && (
          <Button type="submit" loading={form.formState.isSubmitting} autoFocus className="self-end">
            <T id="redeployDialog.submitButton" />
          </Button>
        )}
      </form>
    </Dialog>
  );
}
