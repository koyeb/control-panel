import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { VolumeSnapshot } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/controlled';
import { CloseDialogButton, Dialog, DialogFooter, DialogHeader } from 'src/components/dialog';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { Translate, createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.volumes.snapshotsList.editDialog');

const schema = z.object({
  name: z.string().min(2).max(63),
});

export function EditSnapshotDialog({ snapshot }: { snapshot: VolumeSnapshot }) {
  const t = T.useTranslate();
  const closeDialog = Dialog.useClose();

  const invalidate = useInvalidateApiQuery();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      name: snapshot.name,
    },
    resolver: useZodResolver(schema),
  });

  const mutation = useMutation({
    ...useApiMutationFn('updateSnapshot', ({ name }: FormValues<typeof form>) => ({
      path: { id: snapshot.id },
      body: { name },
    })),
    async onSuccess({ snapshot }) {
      await invalidate('listSnapshots');
      notify.success(t('successNotification', { name: snapshot!.name! }));
      closeDialog();
    },
    onError: useFormErrorHandler(form),
  });

  useEffect(() => {
    form.reset({ name: snapshot.name });
  }, [form, snapshot]);

  return (
    <Dialog
      id="EditSnapshot"
      context={{ snapshotId: snapshot.id }}
      onClosed={() => form.reset()}
      className="col w-full max-w-xl gap-4"
    >
      <DialogHeader title={<T id="title" />} />

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
            <Translate id="common.save" />
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
