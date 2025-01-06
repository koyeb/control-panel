import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button, Dialog, Tooltip } from '@koyeb/design-system';
import { useDeployment } from 'src/api/hooks/service';
import { App, Service } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { hasBuild } from 'src/application/service-functions';
import { CliInfoTooltip, CliInfoButton } from 'src/components/cli-info';
import { ControlledCheckbox } from 'src/components/controlled';
import { IconArrowRight } from 'src/components/icons';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useNavigate, usePathname } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.service.layout');

export function RedeployButton({ app, service }: { app: App; service: Service }) {
  const latestDeployment = useDeployment(service.latestDeploymentId);
  const latestStashed = latestDeployment?.status === 'stashed';

  const pathname = usePathname();
  const navigate = useNavigate();

  const t = T.useTranslate();

  const [open, setOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      skipBuild: false,
      useCache: hasBuild(latestDeployment),
    },
  });

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...useApiMutationFn(
      'redeployService',
      ({ skipBuild: usePreviousBuild, useCache }: FormValues<typeof form>) => ({
        path: { id: service.id },
        body: { skip_build: usePreviousBuild, use_cache: useCache },
      }),
    ),
    async onSuccess({ deployment }) {
      await invalidate('listDeployments');
      setOpen(false);
      navigate(routes.service.overview(service.id, deployment!.id));
      notify.info(t('redeploying'));
    },
  });

  if (pathname === routes.service.settings(service.id) || service.status === 'paused') {
    return null;
  }

  return (
    <>
      <CliInfoButton
        button={
          <Button
            loading={form.formState.isSubmitting}
            onClick={() => setOpen(true)}
            className="self-stretch sm:self-start"
          >
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

      <Dialog
        isOpen={open}
        onClose={() => setOpen(false)}
        onClosed={form.reset}
        width="lg"
        title={<T id="redeployDialog.title" />}
        description={
          <T
            id={
              hasBuild(latestDeployment)
                ? 'redeployDialog.descriptionWithBuild'
                : 'redeployDialog.descriptionWithoutBuild'
            }
          />
        }
      >
        <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col gap-2">
          {hasBuild(latestDeployment) && (
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

                <Tooltip
                  content={latestStashed && <T id="redeployDialog.skipBuild.latestStashed" />}
                  className="z-40"
                >
                  {(props) => (
                    <div {...props}>
                      <Button
                        type="submit"
                        disabled={latestStashed}
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

                <Button type="submit" onClick={() => form.setValue('skipBuild', false)}>
                  <T id="redeployDialog.triggerBuild.cta" />
                  <IconArrowRight className="size-4" />
                </Button>
              </div>
            </>
          )}

          {!hasBuild(latestDeployment) && (
            <Button type="submit" loading={form.formState.isSubmitting} autoFocus className="self-end">
              <T id="redeployDialog.submitButton" />
            </Button>
          )}
        </form>
      </Dialog>
    </>
  );
}
