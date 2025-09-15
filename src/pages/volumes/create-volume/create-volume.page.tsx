import { Button, InputEnd } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/controlled';
import { DocumentTitle } from 'src/components/document-title';
import { LinkButton } from 'src/components/link';
import { Title } from 'src/components/title';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useNavigate } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { Translate, createTranslate } from 'src/intl/translate';

import { RegionSelector } from './region-selector';

const T = createTranslate('pages.volumes.create');

const schema = z.object({
  name: z.string().min(2).max(63),
  region: z.string().min(1),
  size: z.number().int().min(1),
});

export function CreateVolumePage() {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      name: '',
      region: '',
      size: NaN,
    },
    resolver: useZodResolver(schema, (error) => {
      if (error.path[0] === 'region' && error.code === 'too_small') {
        return t('regions.required');
      }
    }),
  });

  const mutation = useMutation({
    ...useApiMutationFn('createVolume', ({ name, size, region }: FormValues<typeof form>) => ({
      body: {
        volume_type: 'PERSISTENT_VOLUME_BACKING_STORE_LOCAL_BLK',
        name,
        max_size: size,
        region,
      },
    })),
    async onSuccess(result) {
      await invalidate('listVolumes');
      await navigate({ to: '/volumes' });
      notify.success(t('created', { name: result.volume?.name }));
    },
  });

  return (
    <>
      <DocumentTitle title={t('title')} />

      <div className="mb-8 col gap-2">
        <Title title={<T id="title" />} />
        <p className="text-dim">
          <T id="description" />
        </p>
      </div>

      <form className="col gap-8" onSubmit={handleSubmit(form, mutation.mutateAsync)}>
        <ControlledInput
          control={form.control}
          name="name"
          label={<T id="name.label" />}
          placeholder={t('name.placeholder')}
          className="max-w-xs"
        />

        <Controller
          control={form.control}
          name="region"
          render={({ field, fieldState }) => (
            <RegionSelector
              selected={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />

        <ControlledInput
          control={form.control}
          name="size"
          type="number"
          label={<T id="size.label" />}
          placeholder={t('size.placeholder')}
          end={
            <InputEnd className="text-dim">
              <T id="size.unit" />
            </InputEnd>
          }
          className="max-w-xs"
        />

        <div className="row gap-4">
          <LinkButton color="gray" to="/volumes">
            <Translate id="common.back" />
          </LinkButton>
          <Button type="submit" loading={form.formState.isSubmitting}>
            <T id="submit" />
          </Button>
        </div>
      </form>
    </>
  );
}
