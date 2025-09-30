import { Button, InputEnd } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm, useFormContext } from 'react-hook-form';
import { z } from 'zod';

import { apiMutation, mapVolume, useInvalidateApiQuery } from 'src/api';
import { withStopPropagation } from 'src/application/dom-events';
import { ControlledInput } from 'src/components/controlled';
import { CloseDialogButton, Dialog, DialogFooter, DialogHeader } from 'src/components/dialog';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { Translate, createTranslate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';

import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

const T = createTranslate('modules.serviceForm.volumes.createDialog');

const schema = z.object({
  name: z.string().min(2).max(63),
  size: z.number(),
});

export function CreateVolumeDialog() {
  const regions = useWatchServiceForm('regions');
  const invalidate = useInvalidateApiQuery();
  const { setValue } = useFormContext<ServiceForm>();
  const closeDialog = Dialog.useClose();
  const { index } = Dialog.useContext<{ index: number }>();
  const t = T.useTranslate();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      name: '',
      size: NaN,
    },
    resolver: useZodResolver(schema),
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
      const { id: volumeId, name, size } = mapVolume(volume!);

      await invalidate('get /v1/volumes');

      assert(index !== undefined);
      setValue(`volumes.${index}.volumeId`, volumeId);
      setValue(`volumes.${index}.name`, name);
      setValue(`volumes.${index}.size`, size);
      setValue(`volumes.${index}.mounted`, false);

      closeDialog();
    },
    onError: useFormErrorHandler(form, (error) => ({
      name: error.name,
      region: error.region,
      size: error.max_size,
    })),
  });

  return (
    <Dialog
      id="CreateVolume"
      context={{ index }}
      onClosed={() => form.reset()}
      className="col w-full max-w-xl gap-4"
    >
      <DialogHeader title={<T id="title" />} />

      <p className="text-dim">
        <T id="description" />
      </p>

      <form className="col gap-4" onSubmit={withStopPropagation(handleSubmit(form, mutation.mutateAsync))}>
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
    </Dialog>
  );
}
