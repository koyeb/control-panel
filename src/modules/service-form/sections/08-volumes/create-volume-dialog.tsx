import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, InputEnd } from '@koyeb/design-system';
import { mapVolume } from 'src/api/mappers/volume';
import { Volume } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { withStopPropagation } from 'src/application/dom-events';
import { ControlledInput } from 'src/components/controlled';
import { CloseDialogButton, Dialog, DialogFooter, DialogHeader } from 'src/components/dialog';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate, Translate } from 'src/intl/translate';

import { useWatchServiceForm } from '../../use-service-form';

const T = createTranslate('modules.serviceForm.volumes.createDialog');

const schema = z.object({
  name: z.string().min(2).max(63),
  size: z.number(),
  mountPath: z.string().startsWith('/'),
});

type CreateVolumeDialogProps = {
  onCreated: (volume: Volume, mountPath: string) => void;
};

export function CreateVolumeDialog({ onCreated }: CreateVolumeDialogProps) {
  const regions = useWatchServiceForm('regions');
  const invalidate = useInvalidateApiQuery();
  const t = T.useTranslate();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      name: '',
      size: NaN,
      mountPath: '',
    },
    resolver: useZodResolver(schema, {
      name: t('nameLabel'),
      size: t('sizeLabel'),
      mountPath: t('mountPathLabel'),
    }),
  });

  const mutation = useMutation({
    ...useApiMutationFn('createVolume', ({ name, size }: FormValues<typeof form>) => ({
      body: {
        volume_type: 'PERSISTENT_VOLUME_BACKING_STORE_LOCAL_BLK' as const,
        name,
        max_size: size,
        region: regions[0],
      },
    })),
    async onSuccess({ volume }, { mountPath }) {
      await invalidate('listVolumes');
      onCreated(mapVolume(volume!), mountPath);
    },
    onError: useFormErrorHandler(form, (error) => ({
      name: error.name,
      region: error.region,
      size: error.max_size,
    })),
  });

  return (
    <Dialog id="CreateVolume" onClosed={() => form.reset()} className="col w-full max-w-xl gap-4">
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

        <ControlledInput control={form.control} name="mountPath" label={<T id="mountPathLabel" />} />

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
