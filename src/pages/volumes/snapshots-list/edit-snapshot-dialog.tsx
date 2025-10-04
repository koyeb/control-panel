import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { apiMutation, useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/controlled';
import { CloseDialogButton, Dialog, DialogFooter, DialogHeader, closeDialog } from 'src/components/dialog';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { Translate, createTranslate } from 'src/intl/translate';
import { VolumeSnapshot } from 'src/model';

const T = createTranslate('pages.snapshots.edit');

const schema = z.object({
  name: z.string().min(2).max(63),
});

export function EditSnapshotDialog() {
  return (
    <Dialog id="EditSnapshot" className="col w-full max-w-xl gap-4">
      {(snapshot) => (
        <>
          <DialogHeader title={<T id="title" />} />
          <EditSnapshotForm snapshot={snapshot} />
        </>
      )}
    </Dialog>
  );
}

function EditSnapshotForm({ snapshot }: { snapshot: VolumeSnapshot }) {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      name: snapshot.name,
    },
    resolver: useZodResolver(schema),
  });

  const mutation = useMutation({
    ...apiMutation('post /v1/snapshots/{id}', ({ name }: FormValues<typeof form>) => ({
      path: { id: snapshot.id },
      body: { name },
    })),
    async onSuccess({ snapshot }) {
      await invalidate('get /v1/snapshots');
      notify.success(t('success', { name: snapshot!.name! }));
      closeDialog();
    },
    onError: useFormErrorHandler(form),
  });

  return (
    <>
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
    </>
  );
}
