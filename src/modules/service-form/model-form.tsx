import { useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { Alert, Button } from '@koyeb/design-system';
import {
  useInstance,
  useInstances,
  useInstancesQuery,
  useRegion,
  useRegions,
  useRegionsQuery,
} from 'src/api/hooks/catalog';
import { useGithubAppQuery } from 'src/api/hooks/git';
import { useOrganization, useOrganizationQuotas } from 'src/api/hooks/session';
import { AiModel, OrganizationPlan } from 'src/api/model';
import { useTrackEvent } from 'src/application/analytics';
import { formatBytes } from 'src/application/memory';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { ControlledSelect } from 'src/components/controlled';
import { InstanceSelectorList } from 'src/components/instance-selector';
import { LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { Metadata } from 'src/components/metadata';
import { PaymentDialog } from 'src/components/payment-form';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useNavigate } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { Translate } from 'src/intl/translate';
import { defined } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';
import { slugify } from 'src/utils/strings';

import { RestrictedGpuDialogOpen } from './components/restricted-gpu-dialog';
import { computeEstimatedCost, ServiceCost } from './helpers/estimated-cost';
import { defaultServiceForm } from './initialize-service-form';
import { submitServiceForm } from './submit-service-form';

const T = Translate.prefix('modelForm');

const schema = z.object({
  instance: z.string(),
  region: z.string(),
});

type ModelFormProps = {
  model: AiModel;
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

function ModelForm_({ model, onCostChanged }: ModelFormProps) {
  const availableRegions = useRegions().filter(hasProperty('status', 'available'));
  const instances = useInstances();
  const firstGpu = defined(instances.find(hasProperty('category', 'gpu')));
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      instance: firstGpu.identifier,
      region: firstGpu.regions?.[0] ?? 'fra',
    },
    resolver: useZodResolver(schema),
  });

  const mutation = useMutation({
    async mutationFn({ instance, region }: FormValues<typeof form>) {
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

  const instance = useInstance(form.watch('instance'));
  const region = useRegion(form.watch('region'));

  const formRef = useRef<HTMLFormElement>(null);

  const [requiredPlan, setRequiredPlan] = useState<OrganizationPlan>();
  const [restrictedGpuDialogOpen, setRestrictedGpuDialogOpen] = useState(false);

  const organization = useOrganization();
  const quotas = useOrganizationQuotas();
  const trackEvent = useTrackEvent();

  const onSubmit = async (values: FormValues<typeof form>) => {
    const instance = instances.find(hasProperty('identifier', values.instance));

    const isRestrictedGpu =
      instance?.category === 'gpu' &&
      quotas?.maxInstancesByType[instance.identifier] === 0 &&
      instance.status === 'restricted';

    if (instance?.category === 'gpu') {
      trackEvent('gpu_deployed', { gpu_id: instance.identifier });
    }

    if (instance?.plans !== undefined && !instance.plans.includes(organization.plan)) {
      setRequiredPlan(instance.plans[0] as OrganizationPlan);
    } else if (isRestrictedGpu) {
      setRestrictedGpuDialogOpen(true);
    } else {
      await mutation.mutateAsync(values);
    }
  };

  useEffect(() => {
    const cost = computeEstimatedCost(instance, region ? [region.identifier] : [], {
      type: 'fixed',
      fixed: 1,
      autoscaling: null as never,
    });

    onCostChanged(cost);
  }, [instance, region, onCostChanged]);

  const minimumVRam = model.min_vram;

  const bestFit = useMemo(() => {
    return instances.find((instance) => instance.vram !== undefined && instance.vram >= minimumVRam);
  }, [minimumVRam, instances]);

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit(form, onSubmit)} className="col gap-6">
        <Section title={<T id="overview.title" />}>
          <Overview model={model} form={form} />
        </Section>

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

          {instance?.vram && minimumVRam > instance.vram && bestFit !== undefined && (
            <Alert
              variant="warning"
              title={<T id="instance.notEnoughVRam.title" />}
              description={
                <T
                  id="instance.notEnoughVRam.description"
                  values={{ min: formatBytes(minimumVRam, { round: true }) }}
                />
              }
              className="mt-4"
            />
          )}

          {minimumVRam !== undefined && bestFit === undefined && (
            <Alert
              variant="warning"
              title={<T id="instance.noBestFit.title" />}
              description={<T id="instance.noBestFit.description" />}
              className="mt-4"
            />
          )}
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

        <div className="row justify-end gap-2 p-4">
          <LinkButton color="gray" href={routes.home()}>
            <Translate id="common.cancel" />
          </LinkButton>

          <Button type="submit" loading={form.formState.isSubmitting}>
            <T id="submitButton" />
          </Button>
        </div>
      </form>

      <RestrictedGpuDialogOpen
        open={restrictedGpuDialogOpen}
        onClose={() => setRestrictedGpuDialogOpen(false)}
        instanceIdentifier={firstGpu.identifier}
      />

      <PaymentDialog
        open={requiredPlan !== undefined}
        onClose={() => setRequiredPlan(undefined)}
        plan={requiredPlan}
        onPlanChanged={() => {
          setRequiredPlan(undefined);

          // re-render with new organization plan before submitting
          setTimeout(() => formRef.current?.requestSubmit(), 0);
        }}
        title={<T id="paymentDialog.title" />}
        description={
          <T
            id="paymentDialog.description"
            values={{
              plan: <span className="capitalize text-green">{requiredPlan}</span>,
              price: requiredPlan === 'starter' ? 0 : 79,
            }}
          />
        }
        submit={<T id="paymentDialog.submitButton" />}
      />
    </>
  );
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

function Overview({ model, form }: { model: AiModel; form: UseFormReturn<z.infer<typeof schema>> }) {
  const instance = useInstance(form.watch('instance'));
  const region = useRegion(form.watch('region'));

  return (
    <div className="divide-y rounded border">
      <div className="row gap-12 p-3">
        <Metadata label={<T id="overview.modelNameLabel" />} value={model.name} />
        <Metadata label={<T id="overview.parametersLabel" />} value={model.parameters} />
        <Metadata label={<T id="overview.inferenceEngineLabel" />} value={model.engine} />
      </div>

      <div className="row gap-12 p-3">
        <Metadata label={<T id="overview.instanceTypeLabel" />} value={instance?.displayName} />
        <Metadata label={<T id="overview.scalingLabel" />} value={1} />
        <Metadata label={<T id="overview.regionLabel" />} value={region?.displayName} />
      </div>
    </div>
  );
}
