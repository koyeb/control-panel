import { Alert, Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import {
  apiMutation,
  useCatalogInstance,
  useCatalogInstanceRegionsAvailability,
  useComputeDeployment,
  useInvalidateApiQuery,
} from 'src/api';
import { notify } from 'src/application/notify';
import { hasBuild } from 'src/application/service-functions';
import { ControlledCheckbox } from 'src/components/controlled';
import { Dialog, DialogHeader, closeDialog } from 'src/components/dialog';
import { Tooltip } from 'src/components/tooltip';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useNavigate } from 'src/hooks/router';
import { IconArrowRight } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { Service } from 'src/model';

const T = createTranslate('pages.service.layout.redeployServiceDialog');

export function RedeployServiceDialog() {
  return (
    <Dialog id="RedeployService" className="col w-full max-w-xl gap-4">
      {(service) => <DialogContent service={service} />}
    </Dialog>
  );
}

export function DialogContent({ service }: { service: Service }) {
  const t = T.useTranslate();
  const navigate = useNavigate();
  const invalidate = useInvalidateApiQuery();

  const latestDeployment = useComputeDeployment(service.latestDeploymentId);
  const latestStashed = latestDeployment?.status === 'STASHED';

  const availability = useCatalogInstanceRegionsAvailability(
    latestDeployment?.definition.instanceType,
    latestDeployment?.definition.regions,
  );

  const instance = useCatalogInstance(latestDeployment?.definition.instanceType);

  const form = useForm({
    defaultValues: {
      skipBuild: false,
      useCache: hasBuild(latestDeployment),
    },
  });

  const redeploy = useMutation({
    ...apiMutation('post /v1/services/{id}/redeploy', ({ skipBuild, useCache }: FormValues<typeof form>) => ({
      path: { id: service.id },
      body: { skip_build: skipBuild, use_cache: useCache },
    })),
    async onSuccess({ deployment }) {
      await invalidate('get /v1/deployments');

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
    <>
      <DialogHeader title={<T id="title" />} />

      <p className="text-dim">
        <T id={wasBuilt ? 'descriptionWithBuild' : 'descriptionWithoutBuild'} />
      </p>

      {availability === 'low' && (
        <Alert
          variant="info"
          title={<T id="lowCapacity.title" values={{ instance: instance?.displayName }} />}
          description={<T id="lowCapacity.description" />}
        />
      )}

      <form onSubmit={handleSubmit(form, redeploy.mutateAsync)} className="col gap-2">
        {wasBuilt && (
          <>
            <div className="col items-start gap-4 rounded-md border p-3">
              <div className="col gap-1">
                <div className="font-medium">
                  <T id="skipBuild.title" />
                </div>

                <div className="text-xs text-dim">
                  <T id="skipBuild.description" />
                </div>
              </div>

              <Tooltip
                forceDesktop
                content={latestStashed && <T id="skipBuild.latestStashed" />}
                trigger={(props) => (
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
                      <T id="skipBuild.cta" />
                      <IconArrowRight className="size-4" />
                    </Button>
                  </div>
                )}
              />
            </div>

            <div className="col items-start gap-4 rounded-md border p-3">
              <div className="col gap-1">
                <div className="font-medium">
                  <T id="triggerBuild.title" />
                </div>

                <div className="text-xs text-dim">
                  <T id="triggerBuild.description" />
                </div>
              </div>

              <ControlledCheckbox
                control={form.control}
                name="useCache"
                label={<T id="triggerBuild.useCache" />}
              />

              <Button
                type="submit"
                loading={form.formState.isSubmitting && !form.watch('skipBuild')}
                onClick={() => form.setValue('skipBuild', false)}
              >
                <T id="triggerBuild.cta" />
                <IconArrowRight className="size-4" />
              </Button>
            </div>
          </>
        )}

        {!wasBuilt && (
          <Button type="submit" loading={form.formState.isSubmitting} autoFocus className="self-end">
            <T id="submitButton" />
          </Button>
        )}
      </form>
    </>
  );
}
