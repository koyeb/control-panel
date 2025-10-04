import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { updateDatabaseService } from 'src/application/service-functions';
import { ControlledInput } from 'src/components/controlled';
import { CloseDialogButton, Dialog, DialogFooter, DialogHeader, closeDialog } from 'src/components/dialog';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { Translate, createTranslate } from 'src/intl/translate';
import { Service } from 'src/model';
import { randomString } from 'src/utils/random';

const T = createTranslate('pages.database.roles.createDialog');

const schema = z.object({
  name: z.string().min(1).max(63),
});

export function CreateDatabaseRoleDialog({ service }: { service: Service }) {
  const t = T.useTranslate();

  const invalidate = useInvalidateApiQuery();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      name: '',
    },
    resolver: useZodResolver(schema),
  });

  const mutation = useMutation({
    async mutationFn({ name }: FormValues<typeof form>) {
      await updateDatabaseService(service.id, (definition) => {
        definition.database!.neon_postgres!.roles!.push({
          name,
          secret: databaseRoleSecret(service.name),
        });
      });
    },
    async onSuccess(_, { name }) {
      await invalidate('get /v1/services/{id}', { path: { id: service.id } });
      notify.info(t('successNotification', { name }));
      closeDialog();
    },
    onError: useFormErrorHandler(form, mapError),
  });

  return (
    <Dialog id="CreateDatabaseRole" onClosed={form.reset} className="col w-full max-w-xl gap-4">
      <DialogHeader title={<T id="title" />} />

      <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col gap-4">
        <ControlledInput control={form.control} name="name" label={<T id="nameLabel" />} />

        <DialogFooter>
          <CloseDialogButton>
            <Translate id="common.cancel" />
          </CloseDialogButton>

          <Button
            type="submit"
            disabled={Object.keys(form.formState.errors).length > 0}
            loading={form.formState.isSubmitting}
          >
            <Translate id="common.create" />
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function databaseRoleSecret(databaseServiceName: string) {
  return `${databaseServiceName}-${randomString()}`;
}

function mapError(fields: Record<string, string>) {
  const field = Object.keys(fields).find((field) => field.match(/neon_postgres.roles.(\d+).name$/));

  if (field) {
    return { name: fields[field] };
  }

  return {};
}
