import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Dialog } from '@koyeb/design-system';
import { Service } from 'src/api/model';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { updateDatabaseService } from 'src/application/service-functions';
import { ControlledInput } from 'src/components/controlled';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { Translate } from 'src/intl/translate';
import { randomString } from 'src/utils/random';

const T = Translate.prefix('pages.database.roles.createDialog');

const schema = z.object({
  name: z.string().min(1).max(63),
});

type CreateDatabaseRoleDialogProps = {
  open: boolean;
  onClose: () => void;
  service: Service;
};

export function CreateDatabaseRoleDialog({ open, onClose, service }: CreateDatabaseRoleDialogProps) {
  const invalidate = useInvalidateApiQuery();
  const t = T.useTranslate();

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
      await invalidate('getService', { path: { id: service.id } });
      notify.info(t('successNotification', { name }));
      onClose();
    },
    onError: useFormErrorHandler(form, mapError),
  });

  return (
    <Dialog isOpen={open} onClose={onClose} onClosed={form.reset} title={<T id="title" />} width="lg">
      <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col gap-4">
        <ControlledInput control={form.control} name="name" label={<T id="nameLabel" />} />

        <footer className="row justify-end gap-4">
          <Button variant="ghost" color="gray" onClick={onClose}>
            <Translate id="common.cancel" />
          </Button>

          <Button
            type="submit"
            disabled={Object.keys(form.formState.errors).length > 0}
            loading={form.formState.isSubmitting}
          >
            <Translate id="common.create" />
          </Button>
        </footer>
      </form>
    </Dialog>
  );
}

function databaseRoleSecret(databaseServiceName: string) {
  return `${databaseServiceName}-${randomString()}`;
}

function mapError(fields: Record<string, string>) {
  const field = Object.keys(fields).find((field) => field.match(/neon_postgres.roles.\d.name$/));

  if (field) {
    return { name: fields[field] };
  }

  return {};
}
