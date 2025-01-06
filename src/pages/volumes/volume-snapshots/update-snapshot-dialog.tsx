import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Dialog } from '@koyeb/design-system';
import { VolumeSnapshot } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { ControlledInput } from 'src/components/controlled';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useNavigate } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate, Translate } from 'src/intl/translate';

const T = createTranslate('pages.volumeSnapshots.updateSnapshot');

const schema = z.object({
  name: z.string().min(2).max(63),
});

type UpdateSnapshotDialogProps = {
  open: boolean;
  onClose: () => void;
  snapshot: VolumeSnapshot;
};

export function UpdateSnapshotDialog({ open, onClose, snapshot }: UpdateSnapshotDialogProps) {
  const navigate = useNavigate();
  const invalidate = useInvalidateApiQuery();
  const t = T.useTranslate();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      name: snapshot.name,
    },
    resolver: useZodResolver(schema, {
      name: t('nameLabel'),
    }),
  });

  const mutation = useMutation({
    ...useApiMutationFn('updateSnapshot', ({ name }: FormValues<typeof form>) => ({
      path: { id: snapshot.id },
      body: { name },
    })),
    async onSuccess({ snapshot }) {
      await invalidate('listSnapshots');
      notify.success(t('successNotification', { name: snapshot!.name! }));
      navigate(routes.volumes.snapshots());
      onClose();
    },
    onError: useFormErrorHandler(form),
  });

  useEffect(() => {
    form.reset({ name: snapshot.name });
  }, [form, snapshot]);

  return (
    <Dialog isOpen={open} onClose={onClose} onClosed={() => form.reset()} title={<T id="title" />} width="lg">
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
            <Translate id="common.save" />
          </Button>
        </footer>
      </form>
    </Dialog>
  );
}
