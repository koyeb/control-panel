import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert, Button, ButtonMenuItem, Dialog, MenuItem } from '@koyeb/design-system';
import { api } from 'src/api/api';
import { App, AppDomain } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { useAccessToken } from 'src/application/token';
import { ActionsMenu } from 'src/components/actions-menu';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { ControlledInput } from 'src/components/controlled';
import { IconEllipsis } from 'src/components/icons';
import { Link } from 'src/components/link';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { Translate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';
import { isSlug } from 'src/utils/strings';

const T = Translate.prefix('pages.home');

export function AppActions({ app }: { app: App }) {
  const [openDialog, setOpenDialog] = useState<'edit' | 'pause' | 'delete'>();

  return (
    <>
      <ActionsMenu Icon={IconEllipsis}>
        {(withClose, onClose) => (
          <>
            <MenuItem className="text-dim hover:bg-inherit">
              <T id="appActions.label" />
            </MenuItem>

            <MenuItem element={Link} href={`${routes.createService()}?appId=${app.id}`} onClick={onClose}>
              <T id="appActions.addService" />
            </MenuItem>

            <MenuItem element={Link} href={routes.domains()} onClick={onClose}>
              <T id="appActions.addDomain" />
            </MenuItem>

            <ButtonMenuItem onClick={withClose(() => setOpenDialog('edit'))}>
              <T id="appActions.edit" />
            </ButtonMenuItem>

            <ButtonMenuItem onClick={withClose(() => setOpenDialog('pause'))}>
              <T id="appActions.pauseServices" />
            </ButtonMenuItem>

            <ButtonMenuItem onClick={withClose(() => setOpenDialog('delete'))}>
              <T id="appActions.deleteApp" />
            </ButtonMenuItem>
          </>
        )}
      </ActionsMenu>

      <EditAppDialog app={app} open={openDialog === 'edit'} onClose={() => setOpenDialog(undefined)} />

      <PauseAppConfirmationDialog
        app={app}
        open={openDialog === 'pause'}
        onClose={() => setOpenDialog(undefined)}
      />

      <DeleteAppConfirmationDialog
        app={app}
        open={openDialog === 'delete'}
        onClose={() => setOpenDialog(undefined)}
      />
    </>
  );
}

const editAppSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3)
    .max(23)
    .refine(isSlug, { params: { refinement: 'isSlug' } }),
  subdomain: z
    .string()
    .trim()
    .min(3)
    .max(63)
    .refine(isSlug, { params: { refinement: 'isSlug' } }),
});

type EditAppDialogProps = {
  app: App;
  open: boolean;
  onClose: () => void;
};

function EditAppDialog({ app, open, onClose }: EditAppDialogProps) {
  const t = T.useTranslate();
  const { token } = useAccessToken();
  const invalidate = useInvalidateApiQuery();

  const koyebDomain = app.domains.find(hasProperty('type', 'autoassigned'));
  const [subdomain = '', domainSuffix] = splitDomain(koyebDomain);

  const form = useForm<z.infer<typeof editAppSchema>>({
    defaultValues: {
      name: app.name,
      subdomain,
    },
    resolver: useZodResolver(editAppSchema, {
      name: t('editAppDialog.appNameLabel'),
    }),
  });

  const mutation = useMutation({
    async mutationFn(values: FormValues<typeof form>) {
      const promises: Promise<unknown>[] = [];

      if (values.name !== app.name) {
        promises.push(
          api.renameApp({
            token,
            path: { id: app.id },
            query: {},
            body: { name: values.name },
          }),
        );
      }

      if (koyebDomain && values.subdomain !== subdomain) {
        promises.push(
          api.editDomain({
            token,
            path: { id: koyebDomain.id },
            query: {},
            body: { subdomain: values.subdomain },
          }),
        );
      }

      await Promise.all(promises);
    },
    async onSuccess(_, values) {
      await invalidate('listApps');
      form.reset(values);
      notify.info(t('editAppDialog.successNotification'));
      onClose();
    },
    onError: useFormErrorHandler(form),
  });

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      onClosed={form.reset}
      title={<T id="editAppDialog.title" />}
      width="lg"
    >
      <form className="col gap-4" onSubmit={handleSubmit(form, mutation.mutateAsync)}>
        <Alert variant="warning" description={<T id="appActions.editAppNameWarning" />} />

        <ControlledInput control={form.control} name="name" label={<T id="editAppDialog.appNameLabel" />} />

        <ControlledInput
          control={form.control}
          name="subdomain"
          label={<T id="editAppDialog.appDomainLabel" />}
          end={<div className="row items-center px-2 text-dim">{domainSuffix}</div>}
        />

        <footer className="row mt-2 justify-end gap-2">
          <Button variant="ghost" color="gray" onClick={onClose}>
            <Translate id="common.cancel" />
          </Button>

          <Button
            type="submit"
            loading={form.formState.isSubmitting}
            disabled={Object.keys(form.formState.errors).length > 0}
          >
            <Translate id="common.save" />
          </Button>
        </footer>
      </form>
    </Dialog>
  );
}

function splitDomain(domain: AppDomain | undefined): [string, string] {
  const index = domain?.name.indexOf('.');

  if (index === undefined) {
    return ['', ''];
  }

  assert(domain !== undefined);

  return [domain.name.substring(0, index), domain.name.substring(index)];
}

type ConfirmationDialogProps = {
  app: App;
  open: boolean;
  onClose: () => void;
};

function PauseAppConfirmationDialog({ app, open, onClose }: ConfirmationDialogProps) {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();

  const { mutateAsync: pauseApp } = useMutation({
    ...useApiMutationFn('pauseApp', {
      path: { id: app.id },
    }),
    onSuccess() {
      void invalidate('listApps');
      notify.info(t('pauseAppConfirmationDialog.successNotification'));
      onClose();
    },
  });

  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      title={<T id="pauseAppConfirmationDialog.title" />}
      description={<T id="pauseAppConfirmationDialog.description" />}
      confirmationText={app.name}
      submitText={<T id="pauseAppConfirmationDialog.confirm" />}
      onConfirm={pauseApp}
    />
  );
}

function DeleteAppConfirmationDialog({ app, open, onClose }: ConfirmationDialogProps) {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();

  const { mutateAsync: deleteApp } = useMutation({
    ...useApiMutationFn('deleteApp', {
      path: { id: app.id },
    }),
    onSuccess() {
      void invalidate('listApps');
      notify.info(t('deleteAppConfirmationDialog.successNotification'));
      onClose();
    },
  });

  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      title={<T id="deleteAppConfirmationDialog.title" />}
      description={<T id="deleteAppConfirmationDialog.description" />}
      destructiveAction
      confirmationText={app.name}
      submitText={<T id="deleteAppConfirmationDialog.confirm" />}
      onConfirm={deleteApp}
    />
  );
}
