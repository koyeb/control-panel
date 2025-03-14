import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useController, useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { Alert, Button } from '@koyeb/design-system';
import {
  useDatacenters,
  useInstance,
  useInstances,
  useInstancesQuery,
  useModel,
  useModels,
  useModelsQuery,
  useRegions,
  useRegionsQuery,
} from 'src/api/hooks/catalog';
import { useGithubAppQuery } from 'src/api/hooks/git';
import { AiModel, CatalogInstance } from 'src/api/model';
import { getDefaultRegion } from 'src/application/default-region';
import { useInstanceAvailabilities } from 'src/application/instance-region-availability';
import { formatBytes } from 'src/application/memory';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { ControlledSelect } from 'src/components/controlled';
import { LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { Metadata } from 'src/components/metadata';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useDeepCompareMemo } from 'src/hooks/lifecycle';
import { useNavigate } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate, Translate } from 'src/intl/translate';
import { InstanceSelector } from 'src/modules/instance-selector/instance-selector';
import { inArray } from 'src/utils/arrays';
import { assert, defined } from 'src/utils/assert';
import { getName, hasProperty } from 'src/utils/object';
import { slugify } from 'src/utils/strings';

import { useGetInstanceBadges } from '../instance-selector/instance-badges';
import { useInstanceSelector } from '../instance-selector/instance-selector-state';

import { QuotaIncreaseRequestDialog } from './components/quota-increase-request-dialog';
import { ServiceFormUpgradeDialog } from './components/service-form-upgrade-dialog';
import { computeEstimatedCost, ServiceCost } from './helpers/estimated-cost';
import { defaultServiceForm } from './helpers/initialize-service-form';
import { usePreSubmitServiceForm } from './helpers/pre-submit-service-form';
import { submitServiceForm } from './helpers/submit-service-form';

const T = createTranslate('modules.serviceForm.modelForm');

const schema = z.object({
  modelSlug: z.string(),
  instance: z.string(),
  regions: z.string().array(),
});

type ModelFormType = z.infer<typeof schema>;
type ModelForm = UseFormReturn<ModelFormType>;

type ModelFormProps = {
  model?: AiModel;
  onCostChanged: (cost?: ServiceCost) => void;
};

export function ModelForm(props: ModelFormProps) {
  const instances = useInstancesQuery();
  const regions = useRegionsQuery();
  const githubApp = useGithubAppQuery();
  const models = useModelsQuery();

  if (instances.isPending || regions.isPending || githubApp.isPending || models.isPending) {
    return <Loading />;
  }

  return <ModelForm_ {...props} />;
}

function ModelForm_({ model: initialModel, onCostChanged }: ModelFormProps) {
  const instances = useInstances();
  const models = useModels();
  const navigate = useNavigate();
  const t = T.useTranslate();

  const form = useForm<ModelFormType>({
    defaultValues: useInitialValues(initialModel ?? defined(models[0])),
    resolver: useZodResolver(schema, {
      modelSlug: t('model.label'),
    }),
  });

  const mutation = useMutation({
    async mutationFn({ modelSlug, instance, regions }: FormValues<typeof form>) {
      const model = defined(models.find(hasProperty('slug', modelSlug)));
      const serviceForm = defaultServiceForm();

      serviceForm.appName = slugify(model.name.slice(0, 23));
      serviceForm.serviceName = slugify(model.name);
      serviceForm.environmentVariables = model.env ?? [];

      serviceForm.instance = instance;
      serviceForm.regions = regions;

      serviceForm.scaling.min = 0;

      serviceForm.source.type = 'docker';
      serviceForm.source.docker.image = model.dockerImage;

      assert(serviceForm.ports[0] !== undefined);
      serviceForm.ports[0].healthCheck.gracePeriod = 300;

      return submitServiceForm(serviceForm);
    },
    onError: (error) => notify.error(error.message),
    onSuccess({ serviceId }) {
      navigate(routes.initialDeployment(serviceId));
    },
  });

  const model = useModel(form.watch('modelSlug'));
  const formRef = useRef<HTMLFormElement>(null);

  const [requiredPlan, preSubmit] = usePreSubmitServiceForm();

  useOnCostEstimationChanged(form, onCostChanged);

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleSubmit(form, (values) => {
          const instance = instances.find(hasProperty('identifier', values.instance));

          if (instance && preSubmit(instance)) {
            return mutation.mutateAsync(values);
          }
        })}
        className="col gap-6"
      >
        <OverviewSection model={model} form={form} />
        {initialModel === undefined && <ModelSection form={form} />}
        <InstanceSection model={model} form={form} />

        <div className="row justify-end gap-2">
          <LinkButton color="gray" href={routes.home()}>
            <Translate id="common.cancel" />
          </LinkButton>

          <Button type="submit" loading={form.formState.isSubmitting}>
            <T id="submitButton" />
          </Button>
        </div>
      </form>

      <QuotaIncreaseRequestDialog instanceIdentifier={form.watch('instance')} />
      <ServiceFormUpgradeDialog plan={requiredPlan} submitForm={() => formRef.current?.requestSubmit()} />
    </>
  );
}

function useOnCostEstimationChanged(form: ModelForm, onChanged: (cost?: ServiceCost) => void) {
  const instance = useInstance(form.watch('instance'));
  const regions = useDeepCompareMemo(useRegions(form.watch('regions')));

  useEffect(() => {
    const cost = computeEstimatedCost(
      instance,
      regions.map((region) => region.identifier),
      {
        min: 0,
        max: 1,
        targets: null as never,
      },
    );

    onChanged(cost);
  }, [instance, regions, onChanged]);
}

function instanceBestFit(model?: AiModel) {
  return (instance: CatalogInstance): boolean => {
    if (instance.status !== 'available' || instance.category !== 'gpu') {
      return false;
    }

    if (!model || !instance.vram) {
      return true;
    }

    return instance.vram >= model.minVRam;
  };
}

function useInitialValues(model: AiModel): Partial<ModelFormType> {
  const queryClient = useQueryClient();
  const instances = useInstances();
  const datacenters = useDatacenters();
  const regions = useRegions();

  const instance = instances.find(instanceBestFit(model));
  const continentalRegions = regions.filter(hasProperty('scope', 'continental'));
  const defaultRegion = getDefaultRegion(queryClient, datacenters, continentalRegions, instance);

  return {
    modelSlug: model?.slug,
    instance: instance?.identifier,
    regions: [defaultRegion?.identifier ?? 'fra'],
  };
}

type SectionProps = {
  title: React.ReactNode;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <section>
      <div className="mb-2 text-sm font-medium">{title}</div>
      {children}
    </section>
  );
}

function OverviewSection({ model, form }: { model?: AiModel; form: ModelForm }) {
  const instance = useInstance(form.watch('instance'));
  const regions = useRegions(form.watch('regions'));

  return (
    <Section title={<T id="overview.title" />}>
      <div className="divide-y rounded border">
        {model && model.metadata.length > 0 && (
          <div className="row flex-wrap gap-x-12 gap-y-4 p-3">
            {model.metadata.map(({ name, value }, index) => (
              <Metadata key={index} label={name} value={value} />
            ))}
          </div>
        )}

        <div className="row flex-wrap gap-x-12 gap-y-4 p-3">
          <Metadata label={<T id="overview.instanceTypeLabel" />} value={instance?.displayName} />
          <Metadata label={<T id="overview.scalingLabel" />} value={<T id="overview.scalingValue" />} />
          <Metadata label={<T id="overview.regionLabel" />} value={regions[0]?.displayName} />
        </div>
      </div>
    </Section>
  );
}

function ModelSection({ form }: { form: ModelForm }) {
  const models = useModels();
  const instances = useInstances();

  return (
    <Section title={<T id="model.title" />}>
      <ControlledSelect
        control={form.control}
        name="modelSlug"
        items={models}
        getKey={(model) => model.slug}
        itemToString={getName}
        itemToValue={(model) => model.slug}
        renderItem={(model) => model.name}
        onChangeEffect={(model) => {
          const instance = instances.find(instanceBestFit(model));

          if (instance) {
            form.setValue('instance', instance.identifier);
            form.setValue('regions', [instance.regions?.[0] ?? 'fra']);
          }
        }}
      />
    </Section>
  );
}

function InstanceSection({ model, form }: { model?: AiModel; form: ModelForm }) {
  const availabilities = useInstanceAvailabilities();
  const instances = useInstances();
  const regions = useRegions();

  const bestFit = instances.find(instanceBestFit(model));

  const instanceCtrl = useController({ control: form.control, name: 'instance' });
  const regionsCtrl = useController({ control: form.control, name: 'regions' });

  const selectedInstance = instances.find(hasProperty('identifier', instanceCtrl.field.value));
  const selectedRegions = regions.filter((region) => inArray(region.identifier, regionsCtrl.field.value));

  const selector = useInstanceSelector({
    instances,
    regions,
    availabilities,
    selectedInstance: selectedInstance ?? null,
    selectedRegions,
    setSelectedInstance: (instance) => instanceCtrl.field.onChange(instance?.identifier ?? null),
    setSelectedRegions: (regions) => regionsCtrl.field.onChange(regions.map((region) => region.identifier)),
  });

  const getBadges = useGetInstanceBadges({
    bestFit,
    insufficientVRam: (instance) => Boolean(instance.vram && model && instance.vram < model.minVRam),
  });

  return (
    <Section title={<T id="instance.title" />}>
      <div className="col scrollbar-green scrollbar-thin max-h-96 gap-3 overflow-auto rounded-md border p-2">
        <InstanceSelector {...selector} getBadges={getBadges} />
      </div>

      <MinimumVRamAlerts model={model} instance={selectedInstance} bestFit={bestFit} />
    </Section>
  );
}

type MinimumVRamAlertsProps = {
  model?: AiModel;
  instance?: CatalogInstance;
  bestFit?: CatalogInstance;
};

function MinimumVRamAlerts({ model, instance, bestFit }: MinimumVRamAlertsProps) {
  if (instance?.vram && model && model.minVRam > instance.vram && bestFit !== undefined) {
    return (
      <Alert
        variant="warning"
        title={<T id="instance.notEnoughVRam.title" />}
        description={
          <T
            id="instance.notEnoughVRam.description"
            values={{ min: formatBytes(model.minVRam, { round: true }) }}
          />
        }
        className="mt-4"
      />
    );
  }

  if (model && bestFit === undefined) {
    return (
      <Alert
        variant="warning"
        title={<T id="instance.noBestFit.title" />}
        description={<T id="instance.noBestFit.description" />}
        className="mt-4"
      />
    );
  }

  return null;
}
