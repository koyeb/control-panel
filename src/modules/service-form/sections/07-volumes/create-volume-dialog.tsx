import { zodResolver } from '@hookform/resolvers/zod';
import { Button, DialogHeader, InputEnd } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { UseFormReturn, useForm } from 'react-hook-form';
import { z } from 'zod';

import { apiMutation, mapVolume, useInvalidateApiQuery } from 'src/api';
import { ControlledInput } from 'src/components/controlled';
import { CloseDialogButton, Dialog, DialogFooter, closeDialog } from 'src/components/dialog';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { Translate, createTranslate } from 'src/intl/translate';
import { Volume } from 'src/model';

import { ServiceForm } from '../../service-form.types';

const T = createTranslate('modules.serviceForm.volumes.createDialog');

const schema = z.object({
  name: z.string().min(2).max(63),
  size: z.number(),
});

export function CreateVolumeDialog({ form }: { form: UseFormReturn<ServiceForm> }) {
  return (
    <Dialog id="CreateVolume" className="col w-full max-w-xl gap-4">
      {({ index }) => (
        <>
          <DialogHeader title={<T id="title" />} />

          <p className="text-dim">
            <T id="description" />
          </p>

          <CreateVolumeForm
            regions={form.watch('regions')}
            onCreated={(volume) => {
              form.setValue(`volumes.${index}.volumeId`, volume.id);
              form.setValue(`volumes.${index}.name`, volume.name);
              form.setValue(`volumes.${index}.size`, volume.size);
              form.setValue(`volumes.${index}.mounted`, false);
            }}
          />
        </>
      )}
    </Dialog>
  );
}

type CreateVolumeFormProps = {
  regions: string[];
  onCreated: (volume: Volume) => void;
};

export function CreateVolumeForm({ regions, onCreated }: CreateVolumeFormProps) {
  const invalidate = useInvalidateApiQuery();
  const t = T.useTranslate();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      name: '',
      size: NaN,
    },
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    ...apiMutation('post /v1/volumes', ({ name, size }: FormValues<typeof form>) => ({
      body: {
        volume_type: 'PERSISTENT_VOLUME_BACKING_STORE_LOCAL_BLK' as const,
        name,
        max_size: size,
        region: regions[0],
      },
    })),
    async onSuccess({ volume }) {
      await invalidate('get /v1/volumes');
      onCreated(mapVolume(volume!));
      closeDialog();
    },
    onError: useFormErrorHandler(form, (error) => ({
      name: error.name,
      region: error.region,
      size: error.max_size,
    })),
  });

  return (
    <form className="col gap-4" onSubmit={handleSubmit(form, mutation.mutateAsync)}>
      <ControlledInput
        control={form.control}
        name="name"
        label={<T id="nameLabel" />}
        placeholder={t('namePlaceholder')}
      />

      <ControlledInput
        control={form.control}
        type="number"
        name="size"
        min={1}
        label={<T id="sizeLabel" />}
        placeholder={t('sizePlaceholder')}
        end={
          <InputEnd>
            <T id="sizeUnit" />
          </InputEnd>
        }
      />

      <DialogFooter>
        <CloseDialogButton>
          <Translate id="common.cancel" />
        </CloseDialogButton>

        <Button type="submit" loading={form.formState.isSubmitting}>
          <Translate id="common.create" />
        </Button>
      </DialogFooter>
    </form>
  );
}
