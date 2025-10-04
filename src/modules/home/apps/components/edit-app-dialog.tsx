import { Alert, Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { getApi, useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/controlled';
import {
  CloseDialogButton,
  Dialog,
  DialogFooter,
  DialogHeader,
  closeDialog,
  useDialogContext,
} from 'src/components/dialog';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { Translate, createTranslate } from 'src/intl/translate';
import { AppDomain } from 'src/model';
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
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();
  const app = useDialogContext('EditApp');

  const koyebDomain = app?.domains.find(hasProperty('type', 'AUTOASSIGNED'));
  const [subdomain = '', domainSuffix] = splitDomain(koyebDomain);

  const form = useForm<z.infer<typeof editAppSchema>>({
    defaultValues: {
      name: '',
      subdomain: '',
    },
    resolver: useZodResolver(editAppSchema),
  });

  useEffect(() => {
    form.reset({ name: app?.name ?? '', subdomain });
  }, [form, app, subdomain]);

  const mutation = useMutation({
    async mutationFn(values: FormValues<typeof form>) {
      const api = getApi();
      const promises: Promise<unknown>[] = [];

      assert(app !== undefined);

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
      await invalidate('get /v1/apps');
      form.reset(values);
      notify.info(t('success'));
      closeDialog();
    },
    onError: useFormErrorHandler(form),
  });

  return (
    <Dialog id="EditApp" onClosed={form.reset} className="col w-full max-w-xl gap-4">
      <DialogHeader title={<T id="title" />} />

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
