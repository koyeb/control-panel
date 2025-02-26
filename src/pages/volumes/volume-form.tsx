import { useMutation } from '@tanstack/react-query';
import { FieldValues, FormState, useForm } from 'react-hook-form';
import { z } from 'zod';

import { InputEnd } from '@koyeb/design-system';
import { api } from 'src/api/api';
import { useRegions } from 'src/api/hooks/catalog';
import { mapVolume } from 'src/api/mappers/volume';
import { Volume, VolumeSnapshot } from 'src/api/model';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { useToken } from 'src/application/token';
import { ControlledInput, ControlledSelect } from 'src/components/controlled';
import { FormValues, useFormErrorHandler } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate } from 'src/intl/translate';
import { hasProperty } from 'src/utils/object';

const T = createTranslate('pages.volumes.volumeForm');

const schema = z.object({
  name: z.string().min(2).max(63),
  region: z.string().min(1),
  size: z.number(),
});

function toGigaBytes(bytes: number | undefined) {
  if (bytes !== undefined) {
    return bytes / Math.pow(1000, 3);
  }
}

type VolumeFormProps = {
  snapshot?: VolumeSnapshot;
  volume?: Volume;
  onSubmitted: (volume: Volume) => void;
  renderFooter: (formState: FormState<FieldValues>) => React.ReactNode;
};

export function VolumeForm({ snapshot, volume, onSubmitted, renderFooter }: VolumeFormProps) {
  const { token } = useToken();
  const invalidate = useInvalidateApiQuery();
  const regions = useRegions().filter(hasProperty('hasVolumes', true));
  const t = T.useTranslate();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      name: volume?.name ?? '',
      region: snapshot?.region ?? volume?.region ?? '',
      size: toGigaBytes(snapshot?.size ?? volume?.size) ?? NaN,
    },
    resolver: useZodResolver(schema, {
      name: t('nameLabel'),
      region: t('regionLabel'),
      size: t('sizeLabel'),
    }),
  });

  const mutation = useMutation({
    async mutationFn({ name, region, size }: FormValues<typeof form>) {
      if (volume) {
        return api
          .updateVolume({
            token,
            path: { id: volume.id },
            body: { name },
          })
          .then(({ volume }) => mapVolume(volume!));
      } else {
        return api
          .createVolume({
            token,
            body: {
              volume_type: 'PERSISTENT_VOLUME_BACKING_STORE_LOCAL_BLK',
              snapshot_id: snapshot?.id,
              name,
              max_size: snapshot ? undefined : size,
              region,
            },
          })
          .then(({ volume }) => mapVolume(volume!));
      }
    },
    async onSuccess(createVolume) {
      await invalidate('listVolumes');
      notify.success(t(volume !== undefined ? 'editSuccess' : 'createSuccess', { name: createVolume.name }));
      onSubmitted(createVolume);
    },
    onError: useFormErrorHandler(form, (error) => ({
      name: error.name,
      region: error.region,
      size: error.max_size,
    })),
  });

  return (
    <form
      className="col gap-4"
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onSubmit={(event) => {
        event.stopPropagation();
        return form.handleSubmit((values) => mutation.mutateAsync(values))(event);
      }}
    >
      <ControlledInput
        control={form.control}
        name="name"
        label={<T id="nameLabel" />}
        placeholder={t('namePlaceholder')}
      />

      <ControlledSelect
        control={form.control}
        name="region"
        disabled={snapshot !== undefined || volume !== undefined}
        label={<T id="regionLabel" />}
        placeholder={t('regionPlaceholder')}
        items={regions}
        getKey={(region) => region.identifier}
        itemToString={(region) => region.displayName}
        itemToValue={(region) => region.identifier}
        renderItem={(region) => region.displayName}
        helperText={snapshot !== undefined && <T id="regionBoundedToSnapshot" />}
      />

      <ControlledInput
        control={form.control}
        name="size"
        type="number"
        disabled={snapshot !== undefined || volume !== undefined}
        label={<T id="sizeLabel" />}
        placeholder={t('sizePlaceholder')}
        end={
          <InputEnd>
            <T id="sizeUnit" />
          </InputEnd>
        }
      />

      {renderFooter(form.formState)}
    </form>
  );
}
