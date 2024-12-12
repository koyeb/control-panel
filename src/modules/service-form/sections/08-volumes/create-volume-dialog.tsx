import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Dialog, InputEnd } from '@koyeb/design-system';
import { mapVolume } from 'src/api/mappers/volume';
import { Volume } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { withStopPropagation } from 'src/application/dom-events';
import { ControlledInput } from 'src/components/controlled';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { Translate } from 'src/intl/translate';

import { useWatchServiceForm } from '../../use-service-form';

const T = Translate.prefix('serviceForm.volumes.createDialog');

const schema = z.object({
  name: z.string().min(2).max(63),
  size: z.number(),
  mountPath: z.string().startsWith('/'),
});

type CreateVolumeDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (volume: Volume, mountPath: string) => void;
};

export function CreateVolumeDialog({ open, onClose, onCreated }: CreateVolumeDialogProps) {
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
    <Dialog
      isOpen={open}
      onClose={onClose}
      onClosed={() => form.reset()}
      title={<T id="title" />}
      description={<T id="description" />}
      width="lg"
    >
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
          label={<T id="sizeLabel" />}
          placeholder={t('sizePlaceholder')}
          end={
            <InputEnd>
              <T id="sizeUnit" />
            </InputEnd>
          }
        />

        <ControlledInput control={form.control} name="mountPath" label={<T id="mountPathLabel" />} />

        <footer className="row mt-2 justify-end gap-2">
          <Button variant="ghost" color="gray" onClick={onClose}>
            <Translate id="common.cancel" />
          </Button>

          <Button type="submit" loading={form.formState.isSubmitting} autoFocus>
            <Translate id="common.create" />
          </Button>
        </footer>
      </form>
    </Dialog>
  );
}
