import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, DialogHeader } from '@koyeb/design-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useApi } from 'src/api';
import { notify } from 'src/application/notify';
import { CloseDialogButton, Dialog, DialogFooter, closeDialog } from 'src/components/dialog';
import { ControlledInput } from 'src/components/forms';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { Translate, createTranslate } from 'src/intl/translate';
import { App, AppDomain } from 'src/model';
import { assert } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';
import { isSlug } from 'src/utils/strings';

const T = createTranslate('pages.home.apps.edit');

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

export function EditAppDialog() {
  return (
    <Dialog id="EditApp" className="col w-full max-w-xl gap-4">
      {(app) => (
        <>
          <DialogHeader title={<T id="title" />} />
          <EditAppForm app={app} />
        </>
      )}
    </Dialog>
  );
}

function EditAppForm({ app }: { app: App }) {
  const t = T.useTranslate();

  const api = useApi();
  const queryClient = useQueryClient();

  const koyebDomain = app.domains.find(hasProperty('type', 'AUTOASSIGNED'));
  const [subdomain = '', domainSuffix] = splitDomain(koyebDomain);

  const form = useForm<z.infer<typeof editAppSchema>>({
    defaultValues: {
      name: app.name,
      subdomain,
    },
    resolver: zodResolver(editAppSchema),
  });

  const mutation = useMutation({
    async mutationFn(values: FormValues<typeof form>) {
      const promises: Promise<unknown>[] = [];

      if (values.name !== app.name) {
        promises.push(
          api('put /v1/apps/{id}', {
            path: { id: app.id },
            query: {},
            body: { name: values.name },
          }),
        );
      }

      if (koyebDomain && values.subdomain !== subdomain) {
        promises.push(
          api('patch /v1/domains/{id}', {
            path: { id: koyebDomain.id },
            query: {},
            body: { subdomain: values.subdomain },
          }),
        );
      }

      await Promise.all(promises);
    },
    async onSuccess(_, values) {
      await queryClient.invalidateQueries({ queryKey: ['listAppsFull'] });
      form.reset(values);
      notify.info(t('success'));
      closeDialog();
    },
    onError: useFormErrorHandler(form),
  });

  return (
    <form className="col gap-4" onSubmit={handleSubmit(form, mutation.mutateAsync)}>
      <Alert variant="warning" description={<T id="warning" />} />

      <ControlledInput control={form.control} name="name" label={<T id="appNameLabel" />} />

      <ControlledInput
        control={form.control}
        name="subdomain"
        label={<T id="appDomainLabel" />}
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
