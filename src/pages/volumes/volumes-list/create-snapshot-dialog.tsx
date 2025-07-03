import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Volume } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/controlled';
import { CloseDialogButton, Dialog, DialogFooter, DialogHeader } from 'src/components/dialog';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useNavigate } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { Translate, createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.volumes.createSnapshotDialog');

const schema = z.object({
  name: z.string().min(2).max(63),
});

export function CreateSnapshotDialog({ volume }: { volume: Volume }) {
  const t = T.useTranslate();
  const closeDialog = Dialog.useClose();

  const navigate = useNavigate();
  const invalidate = useInvalidateApiQuery();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      name: '',
    },
    resolver: useZodResolver(schema),
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
      navigate({ to: '/volumes/snapshots' });
      closeDialog();
    },
    onError: useFormErrorHandler(form),
  });

  return (
    <Dialog
      id="CreateSnapshotFromVolume"
      context={{ volumeId: volume.id }}
      onClosed={() => form.reset()}
      className="col w-full max-w-xl gap-4"
    >
      <DialogHeader title={<T id="title" />} />

      <div className="text-dim">
        <T id="description" />
      </div>

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
    </Dialog>
  );
}
