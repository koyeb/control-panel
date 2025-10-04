import { Button, DialogFooter } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import z from 'zod';

import { apiMutation } from 'src/api';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/controlled';
import { CloseDialogButton, Dialog, DialogHeader, closeDialog } from 'src/components/dialog';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { Translate, createTranslate } from 'src/intl/translate';
import { Volume } from 'src/model';

const T = createTranslate('pages.volumes.volumesList.editDialog');

export function EditVolumeDialog() {
  return (
    <Dialog id="EditVolume" className="col w-full max-w-xl gap-4">
      {(volume) => (
        <>
          <DialogHeader title={<T id="title" />} />

          <p className="text-dim">
            <T id="description" />
          </p>

          <EditVolumeForm volume={volume} />
        </>
      )}
    </Dialog>
  );
}

const schema = z.object({
  name: z.string().min(2).max(63),
});

function EditVolumeForm({ volume }: { volume: Volume }) {
  const t = T.useTranslate();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      name: volume.name,
    },
    resolver: useZodResolver(schema),
  });

  const mutation = useMutation({
    ...apiMutation('post /v1/volumes/{id}', ({ name }: FormValues<typeof form>) => ({
      path: { id: volume.id },
      body: { name },
    })),
    onSuccess(result) {
      notify.success(t('updated', { name: result.volume?.name }));
      closeDialog();
    },
  });

  return (
    <form className="col gap-4" onSubmit={handleSubmit(form, mutation.mutateAsync)}>
      <ControlledInput
        control={form.control}
        name="name"
        label={<T id="name.label" />}
        placeholder={t('name.placeholder')}
      />

      <DialogFooter>
        <CloseDialogButton>
          <Translate id="common.cancel" />
        </CloseDialogButton>

        <Button type="submit" loading={form.formState.isSubmitting} autoFocus>
          <Translate id="common.save" />
        </Button>
      </DialogFooter>
    </form>
  );
}
