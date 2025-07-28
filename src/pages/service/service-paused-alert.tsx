import { Alert, Button, DialogHeader, Tooltip } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { useCatalogInstanceRegionsAvailability, useInstance } from 'src/api/hooks/catalog';
import { useComputeDeployment } from 'src/api/hooks/service';
import { Service } from 'src/api/model';
import { useApiMutationFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { hasBuild } from 'src/application/service-functions';
import { ControlledCheckbox } from 'src/components/controlled';
import { Dialog } from 'src/components/dialog';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useNavigate } from 'src/hooks/router';
import { IconArrowRight } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.service.layout.servicePaused');

export function ServicePausedAlert({ service }: { service: Service }) {
  const openDialog = Dialog.useOpen();

  if (service.status !== 'PAUSED') {
    return null;
  }

  return (
    <>
      <Alert
        variant="info"
        title={<T id="title" />}
        description={<T id={service.type === 'worker' ? 'descriptionWorker' : 'description'} />}
      >
        <Button
          color="blue"
          onClick={() => openDialog('ResumeService', { resourceId: service.id })}
          className="ml-auto self-center"
        >
          <T id="resume" />
        </Button>
      </Alert>

      <ResumeServiceDialog service={service} />
    </>
  );
}

type ResumeDialogProps = {
  service: Service;
};

export function ResumeServiceDialog({ service }: ResumeDialogProps) {
  const navigate = useNavigate();
  const t = T.useTranslate();
  const closeDialog = Dialog.useClose();

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
      useCache: false,
    },
  });

  const resume = useMutation({
    ...useApiMutationFn('resumeService', ({ skipBuild, useCache }: FormValues<typeof form>) => ({
      path: { id: service.id },
      query: { skip_build: skipBuild, use_cache: useCache },
    })),
    onSuccess: async () => {
      closeDialog();
      await navigate({ to: '/services/$serviceId', params: { serviceId: service.id } });
      notify.info(t('resuming'));
    },
  });

  const wasBuilt = hasBuild(latestDeployment) && service.lastProvisionedDeploymentId !== undefined;

  return (
    <Dialog
      id="ResumeService"
      context={{ resourceId: service.id }}
      onClosed={form.reset}
      className="col w-full max-w-xl gap-4"
    >
      <DialogHeader title={<T id="resumeDialog.title" />} />

      <p className="text-dim">
        <T id={wasBuilt ? 'resumeDialog.descriptionWithBuild' : 'resumeDialog.descriptionWithoutBuild'} />
      </p>

      {availability === 'low' && (
        <Alert
          variant="info"
          title={<T id="resumeDialog.lowCapacity.title" values={{ instance: instance?.displayName }} />}
          description={<T id="resumeDialog.lowCapacity.description" />}
        />
      )}

      <form onSubmit={handleSubmit(form, resume.mutateAsync)} className="col gap-2">
        {wasBuilt && (
          <>
            <div className="col items-start gap-4 rounded-md border p-3">
              <div className="col gap-1">
                <div className="font-medium">
                  <T id="resumeDialog.skipBuild.title" />
                </div>

                <div className="text-xs text-dim">
                  <T id="resumeDialog.skipBuild.description" />
                </div>
              </div>

              <Tooltip content={latestStashed && <T id="resumeDialog.skipBuild.latestStashed" />}>
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
                      <T id="resumeDialog.skipBuild.cta" />
                      <IconArrowRight className="size-4" />
                    </Button>
                  </div>
                )}
              </Tooltip>
            </div>

            <div className="col items-start gap-4 rounded-md border p-3">
              <div className="col gap-1">
                <div className="font-medium">
                  <T id="resumeDialog.triggerBuild.title" />
                </div>

                <div className="text-xs text-dim">
                  <T id="resumeDialog.triggerBuild.description" />
                </div>
              </div>

              <ControlledCheckbox
                control={form.control}
                name="useCache"
                label={<T id="resumeDialog.triggerBuild.useCache" />}
              />

              <Button
                type="submit"
                loading={form.formState.isSubmitting && !form.watch('skipBuild')}
                onClick={() => form.setValue('skipBuild', false)}
              >
                <T id="resumeDialog.triggerBuild.cta" />
                <IconArrowRight className="size-4" />
              </Button>
            </div>
          </>
        )}

        {!wasBuilt && (
          <Button type="submit" loading={form.formState.isSubmitting} autoFocus className="self-end">
            <T id="resumeDialog.submitButton" />
          </Button>
        )}
      </form>
    </Dialog>
  );
}
