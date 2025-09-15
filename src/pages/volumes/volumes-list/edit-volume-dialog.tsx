import { Button, DialogFooter } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import z from 'zod';

import { Volume } from 'src/api/model';
import { useApiMutationFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/controlled';
import { CloseDialogButton, Dialog, DialogHeader } from 'src/components/dialog';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { Translate, createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.volumes.list.editDialog');

export function EditVolumeDialog({ volume }: { volume: Volume }) {
  return (
    <Dialog id="EditVolume" context={{ volumeId: volume.id }} className="col w-full max-w-xl gap-4">
      <DialogHeader title={<T id="title" />} />

      <p className="text-dim">
        <T id="description" />
      </p>

      <EditVolumeForm volume={volume} />
    </Dialog>
  );
}

const schema = z.object({
  name: z.string().min(2).max(63),
});

function EditVolumeForm({ volume }: { volume: Volume }) {
  const t = T.useTranslate();
  const closeDialog = Dialog.useClose();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      name: volume.name,
    },
    resolver: useZodResolver(schema),
  });

  const mutation = useMutation({
    ...useApiMutationFn('updateVolume', ({ name }: FormValues<typeof form>) => ({
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
