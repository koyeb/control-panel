import { Alert, Button, Tooltip } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { useCatalogInstanceRegionsAvailability, useInstance } from 'src/api/hooks/catalog';
import { useComputeDeployment } from 'src/api/hooks/service';
import { Service } from 'src/api/model';
import { useApiMutationFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { hasBuild } from 'src/application/service-functions';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { Dialog, DialogHeader } from 'src/components/dialog';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useNavigate } from 'src/hooks/router';
import { IconArrowRight } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.service.settings.pauseService');

type PauseServiceCardProps = {
  service: Service;
};

export function PauseServiceCard({ service }: PauseServiceCardProps) {
  const navigate = useNavigate();
  const t = T.useTranslate();
  const openDialog = Dialog.useOpen();
  const closeDialog = Dialog.useClose();

  const pause = useMutation({
    ...useApiMutationFn('pauseService', {
      path: { id: service.id },
    }),
    onSuccess: () => {
      closeDialog();
      navigate({ to: '/services/$serviceId', params: { serviceId: service.id } });
      notify.info(t('pausing'));
    },
  });

  return (
    <div className="col-start-1 card row items-center gap-4 p-3">
      <div className="col flex-1 gap-2">
        <strong>
          <T id="title" />
        </strong>

        <p className="text-dim">
          <T id="description" />
        </p>
      </div>

      <div className="ml-auto row gap-4">
        <Button
          color="gray"
          onClick={() => openDialog('ResumeService', { resourceId: service.id })}
          disabled={service.status !== 'PAUSED'}
        >
          <T id="resume" />
        </Button>

        <Button
          color="orange"
          onClick={() => openDialog('ConfirmPauseService', { resourceId: service.id })}
          disabled={service.status === 'PAUSING' || service.status === 'PAUSED'}
        >
          <T id="pause" />
        </Button>
      </div>

      <ConfirmationDialog
        id="ConfirmPauseService"
        resourceId={service.id}
        title={<T id="confirmationDialog.title" />}
        description={<T id="confirmationDialog.description" />}
        confirmationText={service.name}
        submitText={<T id="confirmationDialog.confirm" />}
        onConfirm={pause.mutateAsync}
      />

      <ResumeServiceDialog service={service} />
    </div>
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
    },
  });

  const resume = useMutation({
    ...useApiMutationFn('resumeService', ({ skipBuild }: FormValues<typeof form>) => ({
      path: { id: service.id },
      query: { skip_build: skipBuild },
    })),
    onSuccess: () => {
      closeDialog();
      navigate({ to: '/services/$serviceId', params: { serviceId: service.id } });
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
                      onClick={() => form.setValue('skipBuild', true)}
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
