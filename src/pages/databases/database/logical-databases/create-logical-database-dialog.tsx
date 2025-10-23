import { zodResolver } from '@hookform/resolvers/zod';
import { Button, DialogFooter } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { updateDatabaseService } from 'src/application/service-functions';
import { CloseDialogButton, Dialog, DialogHeader, closeDialog } from 'src/components/dialog';
import { ControlledInput, ControlledSelect } from 'src/components/forms';
import { NoItems } from 'src/components/forms/helpers/no-items';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { Translate, createTranslate } from 'src/intl/translate';
import { DatabaseDeployment, Service } from 'src/model';
import { getName } from 'src/utils/object';

const T = createTranslate('pages.database.logicalDatabases.create');

const schema = z.object({
  name: z.string().min(1).max(63),
  owner: z.string(),
});

type CreateLogicalDatabaseDialogProps = {
  service: Service;
  deployment: DatabaseDeployment;
};

export function CreateLogicalDatabaseDialog({ service, deployment }: CreateLogicalDatabaseDialogProps) {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();

  const form = useForm({
    defaultValues: {
      name: '',
      owner: deployment.roles?.[0]?.name ?? '',
    },
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    async mutationFn({ name, owner }: FormValues<typeof form>) {
      await updateDatabaseService(service.id, (definition) => {
        definition.database!.neon_postgres!.databases?.push({ name, owner });
      });
    },
    async onSuccess(_, { name }) {
      await invalidate('get /v1/services/{id}', { path: { id: service.id } });
      notify.info(t('success', { name }));
      closeDialog();
    },
  });

  return (
    <Dialog id="CreateLogicalDatabase" onClosed={form.reset} className="col w-full max-w-xl gap-4">
      <DialogHeader title={<T id="title" />} />

      <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col gap-4">
        <ControlledInput control={form.control} name="name" label={<T id="nameLabel" />} />

        <ControlledSelect
          control={form.control}
          name="owner"
          label={<T id="ownerLabel" />}
          items={deployment.roles ?? []}
          getKey={getName}
          itemToString={getName}
          getValue={getName}
          renderItem={getName}
          renderNoItems={() => <NoItems message={<T id="noRoles" />} />}
        />

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
