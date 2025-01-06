import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Dialog } from '@koyeb/design-system';
import { Volume } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { ControlledInput } from 'src/components/controlled';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useNavigate } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate, Translate } from 'src/intl/translate';

const T = createTranslate('pages.volumes.createSnapshotDialog');

const schema = z.object({
  name: z.string().min(2).max(63),
});

type CreateSnapshotDialogProps = {
  open: boolean;
  onClose: () => void;
  volume: Volume;
};

export function CreateSnapshotDialog({ open, onClose, volume }: CreateSnapshotDialogProps) {
  const navigate = useNavigate();
  const invalidate = useInvalidateApiQuery();
  const t = T.useTranslate();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      name: '',
    },
    resolver: useZodResolver(schema, {
      name: t('nameLabel'),
    }),
  });

  const mutation = useMutation({
    ...useApiMutationFn('createSnapshot', ({ name }: FormValues<typeof form>) => ({
      body: {
        parent_volume_id: volume.id,
        name,
      },
    })),
    async onSuccess({ snapshot }) {
      await invalidate('listVolumes');
      notify.success(t('successNotification', { name: snapshot!.name! }));
      navigate(routes.volumes.snapshots());
      onClose();
    },
    onError: useFormErrorHandler(form),
  });

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      onClosed={() => form.reset()}
      title={<T id="title" />}
      description={<T id="description" />}
      width="lg"
    >
      <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col gap-4">
        <ControlledInput
          control={form.control}
          name="name"
          label={<T id="nameLabel" />}
          placeholder={t('namePlaceholder')}
        />

        <footer className="row mt-2 justify-end gap-2">
          <Button variant="ghost" color="gray" onClick={onClose}>
            <Translate id="common.cancel" />
          </Button>

          <Button type="submit" loading={form.formState.isSubmitting} autoFocus>
            <Translate id="common.create" />
          </Button>
        </footer>
      </form>
    </Dialog>
  );
}
