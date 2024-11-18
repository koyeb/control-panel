import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { Alert, Button } from '@koyeb/design-system';
import {
  useInstance,
  useInstances,
  useInstancesQuery,
  useModel,
  useModels,
  useRegion,
  useRegions,
  useRegionsQuery,
} from 'src/api/hooks/catalog';
import { useGithubAppQuery } from 'src/api/hooks/git';
import { AiModel, CatalogInstance } from 'src/api/model';
import { formatBytes } from 'src/application/memory';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { ControlledSelect } from 'src/components/controlled';
import { InstanceSelectorList } from 'src/components/instance-selector';
import { LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { Metadata } from 'src/components/metadata';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useNavigate } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { Translate } from 'src/intl/translate';
import { defined } from 'src/utils/assert';
import { getName, hasProperty } from 'src/utils/object';
import { slugify } from 'src/utils/strings';

import { RestrictedGpuDialog } from './components/restricted-gpu-dialog';
import { ServiceFormPaymentDialog } from './components/service-form-payment-dialog';
import { computeEstimatedCost, ServiceCost } from './helpers/estimated-cost';
import { defaultServiceForm } from './helpers/initialize-service-form';
import { usePreSubmitServiceForm } from './helpers/pre-submit-service-form';
import { submitServiceForm } from './helpers/submit-service-form';

const T = Translate.prefix('modelForm');

const schema = z.object({
  modelName: z.string(),
  instance: z.string(),
  region: z.string(),
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

  if (instances.isPending || regions.isPending || githubApp.isPending) {
    return <Loading />;
  }

  return <ModelForm_ {...props} />;
}

function ModelForm_({ model: initialModel, onCostChanged }: ModelFormProps) {
  const instances = useInstances();
  const models = useModels();
  const navigate = useNavigate();

  const form = useForm<ModelFormType>({
    defaultValues: getInitialValues(instances, initialModel),
    resolver: useZodResolver(schema),
  });

  const mutation = useMutation({
    async mutationFn({ modelName, instance, region }: FormValues<typeof form>) {
      const model = defined(models.find(hasProperty('name', modelName)));
      const serviceForm = defaultServiceForm();

      serviceForm.appName = slugify(model.name).slice(0, 23);
      serviceForm.serviceName = slugify(model.name);
      serviceForm.environmentVariables = [];

      serviceForm.instance.identifier = instance;
      serviceForm.regions = [region];

      serviceForm.source.type = 'docker';
      serviceForm.source.docker.image = model.dockerImage;

      return submitServiceForm(serviceForm);
    },
    onError: (error) => notify.error(error.message),
    onSuccess({ serviceId }) {
      navigate(routes.initialDeployment(serviceId));
    },
  });

  const model = useModel(form.watch('modelName'));

  const formRef = useRef<HTMLFormElement>(null);

  const [[requiredPlan, setRequiredPlan], [restrictedGpuDialogOpen, setRestrictedGpuDialogOpen], preSubmit] =
    usePreSubmitServiceForm();

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
        <InstanceSection form={form} />
        <RegionSection form={form} />

        <div className="row justify-end gap-2">
          <LinkButton color="gray" href={routes.home()}>
            <Translate id="common.cancel" />
          </LinkButton>

          <Button type="submit" loading={form.formState.isSubmitting}>
            <T id="submitButton" />
          </Button>
        </div>
      </form>

      <RestrictedGpuDialog
        open={restrictedGpuDialogOpen}
        onClose={() => setRestrictedGpuDialogOpen(false)}
        instanceIdentifier={form.watch('instance')}
      />

      <ServiceFormPaymentDialog
        requiredPlan={requiredPlan}
        onClose={() => setRequiredPlan(undefined)}
        submitForm={() => formRef.current?.requestSubmit()}
      />
    </>
  );
}

function useOnCostEstimationChanged(form: ModelForm, onChanged: (cost?: ServiceCost) => void) {
  const instance = useInstance(form.watch('instance'));
  const region = useRegion(form.watch('region'));

  useEffect(() => {
    const cost = computeEstimatedCost(instance, region ? [region.identifier] : [], {
      type: 'fixed',
      fixed: 1,
      autoscaling: null as never,
    });

    onChanged(cost);
  }, [instance, region, onChanged]);
}

function instanceBestFit(model?: AiModel) {
  return (instance: CatalogInstance): boolean => {
    if (instance.category !== 'gpu') {
      return false;
    }

    if (!model || !instance.vram) {
      return true;
    }

    return instance.vram >= model.min_vram;
  };
}

function getInitialValues(instances: CatalogInstance[], model?: AiModel): Partial<ModelFormType> {
  const instance = instances.find(instanceBestFit(model));

  return {
    modelName: model?.name,
    instance: instance?.identifier,
    region: instance?.regions?.[0] ?? 'fra',
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
  const region = useRegion(form.watch('region'));

  return (
    <Section title={<T id="overview.title" />}>
      <div className="divide-y rounded border">
        <div className="row gap-12 p-3">
          <Metadata label={<T id="overview.modelNameLabel" />} value={model?.name ?? '-'} />
          <Metadata label={<T id="overview.parametersLabel" />} value={model?.parameters ?? '-'} />
          <Metadata label={<T id="overview.inferenceEngineLabel" />} value={model?.engine ?? '-'} />
        </div>

        <div className="row gap-12 p-3">
          <Metadata label={<T id="overview.instanceTypeLabel" />} value={instance?.displayName} />
          <Metadata label={<T id="overview.scalingLabel" />} value={1} />
          <Metadata label={<T id="overview.regionLabel" />} value={region?.displayName} />
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
        name="modelName"
        items={models}
        getKey={getName}
        itemToString={getName}
        itemToValue={getName}
        renderItem={(model) => (
          <div className="row items-center gap-2">
            <div>{model.name}</div>
            <div className="text-xs text-dim">•</div>
            <div className="text-xs text-dim"> parameters: {model.parameters}</div>
          </div>
        )}
        onChangeEffect={(model) => {
          const instance = instances.find(instanceBestFit(model));

          if (instance) {
            form.setValue('instance', instance.identifier);
            form.setValue('region', instance.regions?.[0] ?? 'fra');
          }
        }}
      />
    </Section>
  );
}

function InstanceSection({ form }: { form: ModelForm }) {
  const model = useModel(form.watch('modelName'));
  const instance = useInstance(form.watch('instance'));
  const instances = useInstances();
  const bestFit = instances.find(instanceBestFit(model));

  return (
    <Section title={<T id="instance.title" />}>
      <InstanceSelectorList
        instances={instances
          .filter(hasProperty('regionCategory', 'koyeb'))
          .filter(hasProperty('category', 'gpu'))}
        selectedCategory="gpu"
        selectedInstance={instances.find(hasProperty('identifier', form.watch('instance'))) ?? null}
        onInstanceSelected={(instance) => {
          form.setValue('instance', instance.identifier);
          form.setValue('region', instance.regions?.[0] ?? 'fra');
        }}
        checkAvailability={() => [true]}
        bestFit={bestFit}
        minimumVRam={model?.min_vram}
      />

      <MinimumVRamAlerts model={model} instance={instance} bestFit={bestFit} />
    </Section>
  );
}

type MinimumVRamAlertsProps = {
  model?: AiModel;
  instance?: CatalogInstance;
  bestFit?: CatalogInstance;
};

function MinimumVRamAlerts({ model, instance, bestFit }: MinimumVRamAlertsProps) {
  if (instance?.vram && model && model.min_vram > instance.vram && bestFit !== undefined) {
    return (
      <Alert
        variant="warning"
        title={<T id="instance.notEnoughVRam.title" />}
        description={
          <T
            id="instance.notEnoughVRam.description"
            values={{ min: formatBytes(model.min_vram, { round: true }) }}
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

function RegionSection({ form }: { form: ModelForm }) {
  const availableRegions = useRegions().filter(hasProperty('status', 'available'));
  const instance = useInstance(form.watch('instance'));

  return (
    <Section title={<T id="region.title" />}>
      <ControlledSelect
        control={form.control}
        name="region"
        items={availableRegions.filter((region) =>
          instance?.regions ? instance.regions?.includes(region.identifier) : true,
        )}
        getKey={(region) => region.identifier}
        itemToString={(region) => region.displayName}
        itemToValue={(region) => region.identifier}
        renderItem={(region) => (
          <div className="row items-center gap-2">
            <RegionFlag identifier={region.identifier} className="size-6 rounded-full shadow-badge" />
            <RegionName identifier={region.identifier} />
          </div>
        )}
      />
    </Section>
  );
}
