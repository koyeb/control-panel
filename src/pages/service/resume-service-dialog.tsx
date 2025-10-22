import { Alert, Button, DialogHeader } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import {
  apiMutation,
  useCatalogInstance,
  useCatalogInstanceRegionsAvailability,
  useComputeDeployment,
} from 'src/api';
import { notify } from 'src/application/notify';
import { hasBuild } from 'src/application/service-functions';
import { Dialog, closeDialog } from 'src/components/dialog';
import { ControlledCheckbox } from 'src/components/forms';
import { Tooltip } from 'src/components/tooltip';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useNavigate } from 'src/hooks/router';
import { IconArrowRight } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { Service } from 'src/model';

const T = createTranslate('pages.service.layout.resumeServiceDialog');

export function ResumeServiceDialog() {
  return (
    <Dialog id="ResumeService" className="col w-full max-w-xl gap-4">
      {(service) => <DialogContent service={service} />}
    </Dialog>
  );
}

function DialogContent({ service }: { service: Service }) {
  const navigate = useNavigate();
  const t = T.useTranslate();

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
      useCache: false,
    },
  });

  useEffect(() => {
    form.reset({ skipBuild: false, useCache: false });
  }, [form, service]);

  const resume = useMutation({
    ...apiMutation('post /v1/services/{id}/resume', ({ skipBuild, useCache }: FormValues<typeof form>) => ({
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

      <form onSubmit={handleSubmit(form, resume.mutateAsync)} className="col gap-2">
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
