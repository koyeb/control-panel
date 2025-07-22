import { Alert, Button, ButtonMenuItem, MenuItem } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { api } from 'src/api/api';
import { App, AppDomain } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ActionsMenu } from 'src/components/actions-menu';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { ControlledInput } from 'src/components/controlled';
import { CloseDialogButton, Dialog, DialogFooter, DialogHeader } from 'src/components/dialog';
import { LinkMenuItem } from 'src/components/link';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { IconEllipsis } from 'src/icons';
import { Translate, createTranslate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';
import { isSlug } from 'src/utils/strings';

const T = createTranslate('pages.home');

export function AppActions({ app }: { app: App }) {
  const openDialog = Dialog.useOpen();

  return (
    <>
      <ActionsMenu Icon={IconEllipsis}>
        {(withClose, onClose) => (
          <>
            <MenuItem className="text-dim hover:!bg-inherit">
              <T id="appActions.label" />
            </MenuItem>

            <LinkMenuItem to="/services/new" search={{ app_id: app.id }} onClick={onClose}>
              <T id="appActions.addService" />
            </LinkMenuItem>

            <LinkMenuItem to="/domains" onClick={onClose}>
              <T id="appActions.addDomain" />
            </LinkMenuItem>

            <ButtonMenuItem onClick={withClose(() => openDialog('EditApp', { appId: app.id }))}>
              <T id="appActions.edit" />
            </ButtonMenuItem>

            <ButtonMenuItem onClick={withClose(() => openDialog('ConfirmPauseApp', { resourceId: app.id }))}>
              <T id="appActions.pauseServices" />
            </ButtonMenuItem>

            <ButtonMenuItem onClick={withClose(() => openDialog('ConfirmDeleteApp', { resourceId: app.id }))}>
              <T id="appActions.deleteApp" />
            </ButtonMenuItem>
          </>
        )}
      </ActionsMenu>

      <EditAppDialog app={app} />
      <PauseAppConfirmationDialog app={app} />
      <DeleteAppConfirmationDialog app={app} />
    </>
  );
}

const editAppSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .refine(isSlug, { params: { refinement: 'isSlug' } }),
  subdomain: z
    .string()
    .trim()
    .min(3)
    .max(63)
    .refine(isSlug, { params: { refinement: 'isSlug' } }),
});

function EditAppDialog({ app }: { app: App }) {
  const t = T.useTranslate();
  const closeDialog = Dialog.useClose();

  const invalidate = useInvalidateApiQuery();

  const koyebDomain = app.domains.find(hasProperty('type', 'AUTOASSIGNED'));
  const [subdomain = '', domainSuffix] = splitDomain(koyebDomain);

  const form = useForm<z.infer<typeof editAppSchema>>({
    defaultValues: {
      name: app.name,
      subdomain,
    },
    resolver: useZodResolver(editAppSchema),
  });

  const mutation = useMutation({
    async mutationFn(values: FormValues<typeof form>) {
      const promises: Promise<unknown>[] = [];

      if (values.name !== app.name) {
        promises.push(
          api.renameApp({
            path: { id: app.id },
            query: {},
            body: { name: values.name },
          }),
        );
      }

      if (koyebDomain && values.subdomain !== subdomain) {
        promises.push(
          api.editDomain({
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
      closeDialog();
    },
    onError: useFormErrorHandler(form),
  });

  return (
    <Dialog
      id="EditApp"
      context={{ appId: app.id }}
      onClosed={form.reset}
      className="col w-full max-w-xl gap-4"
    >
      <DialogHeader title={<T id="editAppDialog.title" />} />

      <form className="col gap-4" onSubmit={handleSubmit(form, mutation.mutateAsync)}>
        <Alert variant="warning" description={<T id="appActions.editAppNameWarning" />} />

        <ControlledInput control={form.control} name="name" label={<T id="editAppDialog.appNameLabel" />} />

        <ControlledInput
          control={form.control}
          name="subdomain"
          label={<T id="editAppDialog.appDomainLabel" />}
          end={<div className="row items-center px-2 text-dim">{domainSuffix}</div>}
        />

        <DialogFooter>
          <CloseDialogButton>
            <Translate id="common.cancel" />
          </CloseDialogButton>

          <Button
            type="submit"
            loading={form.formState.isSubmitting}
            disabled={Object.keys(form.formState.errors).length > 0}
          >
            <Translate id="common.save" />
          </Button>
        </DialogFooter>
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

function PauseAppConfirmationDialog({ app }: { app: App }) {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();
  const closeDialog = Dialog.useClose();

  const { mutateAsync: pauseApp } = useMutation({
    ...useApiMutationFn('pauseApp', {
      path: { id: app.id },
    }),
    onSuccess() {
      void invalidate('listApps');
      notify.info(t('pauseAppConfirmationDialog.successNotification'));
      closeDialog();
    },
  });

  return (
    <ConfirmationDialog
      id="ConfirmPauseApp"
      resourceId={app.id}
      title={<T id="pauseAppConfirmationDialog.title" />}
      description={<T id="pauseAppConfirmationDialog.description" />}
      confirmationText={app.name}
      submitText={<T id="pauseAppConfirmationDialog.confirm" />}
      onConfirm={pauseApp}
    />
  );
}

function DeleteAppConfirmationDialog({ app }: { app: App }) {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();
  const closeDialog = Dialog.useClose();

  const { mutateAsync: deleteApp } = useMutation({
    ...useApiMutationFn('deleteApp', {
      path: { id: app.id },
    }),
    onSuccess() {
      void invalidate('listApps');
      notify.info(t('deleteAppConfirmationDialog.successNotification'));
      closeDialog();
    },
  });

  return (
    <ConfirmationDialog
      id="ConfirmDeleteApp"
      resourceId={app.id}
      title={<T id="deleteAppConfirmationDialog.title" />}
      description={<T id="deleteAppConfirmationDialog.description" />}
      destructiveAction
      confirmationText={app.name}
      submitText={<T id="deleteAppConfirmationDialog.confirm" />}
      onConfirm={deleteApp}
    />
  );
}
