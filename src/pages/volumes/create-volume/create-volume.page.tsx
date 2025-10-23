import { zodResolver } from '@hookform/resolvers/zod';
import { Button, InputEnd } from '@koyeb/design-system';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { apiMutation, apiQuery, useInvalidateApiQuery, useRegionsCatalog } from 'src/api';
import { notify } from 'src/application/notify';
import { DocumentTitle } from 'src/components/document-title';
import { ControlledInput } from 'src/components/forms';
import { LinkButton } from 'src/components/link';
import { Title } from 'src/components/title';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { Translate, createTranslate } from 'src/intl/translate';
import { RegionScope } from 'src/model';
import { RegionScopeTabs, RegionSelector } from 'src/modules/instance-selector/region-selector';
import { isDefined } from 'src/utils/generic';
import { hasProperty } from 'src/utils/object';

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

  const [scope, setScope] = useState<RegionScope>('continental');

  const regions = useRegionsCatalog()
    .filter((region) => !region.id.startsWith('aws-'))
    .filter(hasProperty('status', 'available'));

  const snapshotId = useSearchParams().get('snapshot');
  const fromSnapshot = snapshotId !== null;

  const snapshotQuery = useQuery({
    enabled: fromSnapshot,
    refetchInterval: false,
    experimental_prefetchInRender: true,
    ...apiQuery('get /v1/snapshots/{id}', { path: { id: snapshotId! } }),
  });

  const form = useForm({
    defaultValues: async () => {
      const { snapshot } = snapshotId ? await snapshotQuery.promise : {};

      return {
        name: '',
        region: snapshot?.region ?? 'eu',
        size: snapshot?.size ?? NaN,
      };
    },
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    ...apiMutation('post /v1/volumes', ({ name, size, region }: FormValues<typeof form>) => ({
      body: {
        volume_type: 'PERSISTENT_VOLUME_BACKING_STORE_LOCAL_BLK' as const,
        name,
        region,
        max_size: !snapshotId ? size : undefined,
        snapshot_id: snapshotId ?? undefined,
      },
    })),
    async onSuccess(result) {
      await invalidate('get /v1/volumes');
      await navigate({ to: '/volumes' });
      notify.success(t('created', { name: result.volume?.name }));
    },
    onError: useFormErrorHandler(form),
  });

  const onScopeChanged = (scope: RegionScope) => {
    setScope(scope);

    const region = regions.find(hasProperty('scope', scope));

    if (region) {
      form.setValue('region', region.id);
    }
  };

  return (
    <>
      <DocumentTitle title={t('title')} />

      <div className="col gap-2">
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
          render={({ field }) => (
            <div className="@container col max-w-3xl gap-4">
              <div className="row items-center justify-between">
                <div>
                  <T id="regions.label" />
                </div>
                <RegionScopeTabs scope={scope} onScopeChanged={onScopeChanged} />
              </div>

              <div className="text-dim">
                <T id={`regions.scopeDescriptions.${scope}`} />
              </div>

              <RegionSelector
                type="radio"
                regions={regions.filter(hasProperty('scope', scope))}
                selected={[regions.find(hasProperty('id', field.value))].filter(isDefined)}
                onSelected={(region) => field.onChange(region.id)}
              />
            </div>
          )}
        />

        <ControlledInput
          control={form.control}
          name="size"
          disabled={fromSnapshot}
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

        <div className="row items-center gap-4">
          <LinkButton color="gray" to="/volumes">
            <Translate id="common.back" />
          </LinkButton>

          <Button
            type="submit"
            loading={form.formState.isSubmitting}
            disabled={form.formState.submitCount > 0 && !form.formState.isValid}
          >
            <T id="submit" />
          </Button>

          <div className="text-dim">
            <T id="regions.warning" />
          </div>
        </div>
      </form>
    </>
  );
}
