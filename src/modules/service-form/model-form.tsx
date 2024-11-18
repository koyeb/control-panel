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
  const availableRegions = useRegions().filter(hasProperty('status', 'available'));
  const instances = useInstances();
  const models = useModels();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof schema>>({
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
  const instance = useInstance(form.watch('instance'));
  const region = useRegion(form.watch('region'));

  const formRef = useRef<HTMLFormElement>(null);

  const [[requiredPlan, setRequiredPlan], [restrictedGpuDialogOpen, setRestrictedGpuDialogOpen], preSubmit] =
    usePreSubmitServiceForm();

  useEffect(() => {
    const cost = computeEstimatedCost(instance, region ? [region.identifier] : [], {
      type: 'fixed',
      fixed: 1,
      autoscaling: null as never,
    });

    onCostChanged(cost);
  }, [instance, region, onCostChanged]);

  const minimumVRam = model?.min_vram ?? 0;
  const bestFit = useInstanceBestFit();

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleSubmit(form, (values) => {
          if (instance && preSubmit(instance)) {
            return mutation.mutateAsync(values);
          }
        })}
        className="col gap-6"
      >
        <Section title={<T id="overview.title" />}>
          <Overview model={model} form={form} />
        </Section>

        {initialModel === undefined && (
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
            />
          </Section>
        )}

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
            minimumVRam={minimumVRam}
          />

          <MinimumVRamAlerts model={model} instance={instance} bestFit={bestFit} />
        </Section>

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
        instanceIdentifier={instance?.identifier ?? ''}
      />

      <ServiceFormPaymentDialog
        requiredPlan={requiredPlan}
        onClose={() => setRequiredPlan(undefined)}
        submitForm={() => formRef.current?.requestSubmit()}
      />
    </>
  );
}

function getInitialValues(instances: CatalogInstance[], model?: AiModel): Partial<z.infer<typeof schema>> {
  const instance = instances.find((instance) => {
    if (instance.category !== 'gpu') {
      return false;
    }

    if (!model || !instance.vram) {
      return true;
    }

    return instance.vram >= model.min_vram;
  });

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

function Overview({ model, form }: { model?: AiModel; form: UseFormReturn<z.infer<typeof schema>> }) {
  const instance = useInstance(form.watch('instance'));
  const region = useRegion(form.watch('region'));

  return (
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
  );
}

function useInstanceBestFit(model?: AiModel) {
  const instances = useInstances().filter(hasProperty('category', 'gpu'));

  if (!model?.min_vram) {
    return instances[0];
  }

  return instances.find((instance) => instance.vram !== undefined && instance.vram >= model.min_vram);
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
