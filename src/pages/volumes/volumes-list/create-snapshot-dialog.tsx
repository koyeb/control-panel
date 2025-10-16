import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { apiMutation, useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/controlled';
import { CloseDialogButton, Dialog, DialogFooter, DialogHeader, closeDialog } from 'src/components/dialog';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { Translate, createTranslate } from 'src/intl/translate';
import { Volume } from 'src/model';

const T = createTranslate('pages.volumes.createSnapshot');

const schema = z.object({
  name: z.string().min(2).max(63),
});

export function CreateSnapshotDialog() {
  return (
    <Dialog id="CreateSnapshotFromVolume" className="col w-full max-w-xl gap-4">
      {(volume) => (
        <>
          <DialogHeader title={<T id="title" />} />

          <div className="text-dim">
            <T id="description" />
          </div>

          <CreateSnapshotForm volume={volume} />
        </>
      )}
    </Dialog>
  );
}

function CreateSnapshotForm({ volume }: { volume: Volume }) {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();

  const form = useForm({
    defaultValues: {
      name: '',
    },
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    ...apiMutation('post /v1/snapshots', ({ name }: FormValues<typeof form>) => ({
      body: {
        parent_volume_id: volume.id,
        name,
      },
    })),
    async onSuccess({ snapshot }) {
      await Promise.all([invalidate('get /v1/volumes'), invalidate('get /v1/snapshots')]);
      notify.success(t('success', { name: snapshot!.name! }));
      closeDialog();
    },
    onError: useFormErrorHandler(form),
  });

  return (
    <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col gap-4">
      <ControlledInput
        control={form.control}
        name="name"
        label={<T id="nameLabel" />}
        placeholder={t('namePlaceholder')}
      />

      <DialogFooter>
        <CloseDialogButton>
          <Translate id="common.cancel" />
        </CloseDialogButton>

        <Button type="submit" loading={form.formState.isSubmitting} autoFocus>
          <Translate id="common.create" />
        </Button>
      </DialogFooter>
    </form>
  );
}
