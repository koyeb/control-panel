import { useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useController, useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { Alert, Autocomplete, Button } from '@koyeb/design-system';
import {
  useInstance,
  useInstances,
  useInstancesQuery,
  useRegion,
  useRegionsQuery,
} from 'src/api/hooks/catalog';
import { useGithubAppQuery } from 'src/api/hooks/git';
import { useOrganization, useOrganizationQuotas } from 'src/api/hooks/session';
import { HuggingFaceModel, OrganizationPlan } from 'src/api/model';
import { useTrackEvent } from 'src/application/analytics';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { ControlledInput } from 'src/components/controlled';
import { InstanceSelectorList } from 'src/components/instance-selector';
import { LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { PaymentDialog } from 'src/components/payment-form';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useNavigate } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { Translate } from 'src/intl/translate';
import { defined } from 'src/utils/assert';
import { getId, hasProperty } from 'src/utils/object';
import { wait } from 'src/utils/promises';
import { slugify } from 'src/utils/strings';

import { RestrictedGpuDialogOpen } from './components/restricted-gpu-dialog';
import { computeEstimatedCost, ServiceCost } from './helpers/estimated-cost';
import { defaultServiceForm } from './initialize-service-form';
import { submitServiceForm } from './submit-service-form';

const T = Translate.prefix('modelForm');

const schema = z.object({
  modelName: z.string().min(1),
  huggingFaceToken: z.string(),
  instance: z.string().nullable(),
  region: z.string(),
});

const preBuiltModels: Record<string, string> = {
  'meta-llama/Llama-3.1-8B': 'koyeb/meta-llama-3.1-8b:latest',
  'NousResearch/Hermes-3-Llama-3.1-8B': 'koyeb/nousresearch-hermes-3-llama-3.1-8b:latest',
  'mistralai/Mistral-7B-Instruct-v0.3': 'koyeb/mistralai-mistral-7b-instruct-v0.3:latest',
  'google/gemma-2-9b-it': 'koyeb/google-gemma-2-9b-it:latest',
  'Qwen/Qwen2.5-7B-Instruct': 'koyeb/qwen-qwen2.5-7b-instruct:latest',
};

type ModelFormProps = {
  model?: HuggingFaceModel;
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
  const instances = useInstances();
  const firstGpu = defined(instances.find(hasProperty('category', 'gpu')));

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      modelName: model?.id ?? '',
      huggingFaceToken: '',
      instance: firstGpu.identifier,
      region: firstGpu.regions?.[0] ?? 'fra',
    },
    resolver: useZodResolver(schema),
  });

  const navigate = useNavigate();

  const mutation = useMutation({
    async mutationFn({
      modelName,
      huggingFaceToken,
      instance: instanceIdentifier,
      region: regionIdentifier,
    }: FormValues<typeof form>) {
      const serviceForm = defaultServiceForm();

      serviceForm.appName = slugify(modelName).slice(0, 23);
      serviceForm.serviceName = slugify(modelName);
      serviceForm.environmentVariables = [];

      const instance = defined(instances.find(hasProperty('identifier', instanceIdentifier)));
      serviceForm.instance.category = instance.category;
      serviceForm.instance.identifier = instance.identifier;
      serviceForm.regions = [regionIdentifier];

      if (modelName in preBuiltModels) {
        serviceForm.source.type = 'docker';
        serviceForm.source.docker.image = defined(preBuiltModels[modelName]);
      } else {
        serviceForm.source.type = 'git';
        serviceForm.source.git.repositoryType = 'public';
        serviceForm.source.git.publicRepository.repositoryName = 'koyeb/vllm';
        serviceForm.source.git.publicRepository.branch = 'main';
        serviceForm.builder.type = 'dockerfile';

        serviceForm.environmentVariables.push({ name: 'MODEL_NAME', value: modelName });

        if (huggingFaceToken !== '') {
          serviceForm.environmentVariables.push({ name: 'HF_TOKEN', value: huggingFaceToken });
        }
      }

      return submitServiceForm(serviceForm);
    },
    onError: (error) => notify.error(error.message),
    onSuccess({ serviceId }) {
      navigate(routes.initialDeployment(serviceId));
    },
  });

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

  const instance = useInstance(form.watch('instance'));
  const region = useRegion(form.watch('region'));

  useEffect(() => {
    const cost = computeEstimatedCost(instance, region ? [region.identifier] : [], {
      type: 'fixed',
      fixed: 1,
      autoscaling: defaultServiceForm().scaling.autoscaling,
    });

    onCostChanged(cost);
  }, [instance, region, onCostChanged]);

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit(form, onSubmit)} className="col gap-6">
        <Section title={<T id="model.title" />}>
          <ModelNameField form={form} />

          <ControlledInput
            control={form.control}
            label={<T id="model.huggingFaceTokenLabel" />}
            name="huggingFaceToken"
            className="max-w-lg"
          />
        </Section>

        <Section title={<T id="instance.title" />}>
          <div>
            <p>
              <T id="instance.line1" />
            </p>
            <p>
              <T id="instance.line2" />
            </p>
          </div>

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
          />
        </Section>

        <Section title={<T id="region.title" />}>
          <div className="row items-center gap-2">
            <RegionFlag identifier={form.watch('region')} className="size-6 rounded-full shadow-badge" />
            <RegionName identifier={form.watch('region')} />
          </div>
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
  className?: string;
  children: React.ReactNode;
};

function Section({ title, className, children }: SectionProps) {
  return (
    <section>
      <div className="mb-2 text-sm font-medium">{title}</div>
      <div className={clsx('col gap-4 rounded border p-3', className)}>{children}</div>
    </section>
  );
}

function ModelNameField({ form }: { form: UseFormReturn<z.infer<typeof schema>> }) {
  const [search, setSearch] = useState(form.watch('modelName'));

  const query = useQuery({
    queryKey: ['listHuggingFaceModels', search],
    refetchInterval: false,
    async queryFn({ signal }) {
      if (!(await wait(500, signal))) {
        return null;
      }

      const url = new URL('https://huggingface.co/api/models');

      url.searchParams.set('search', search);
      url.searchParams.set('limit', '10');

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch models from hugging face');
      }

      const body = (await response.json()) as HuggingFaceModel[];

      return body;
    },
  });

  const { field } = useController({ control: form.control, name: 'modelName' });

  if (query.error) {
    return <Alert variant="error" title={query.error.message} description={null} />;
  }

  return (
    <Autocomplete
      ref={field.ref}
      items={query.data ?? []}
      getKey={getId}
      itemToString={getId}
      label={<T id="model.modelNameLabel" />}
      helpTooltip={<T id="model.modelNameTooltip" />}
      placeholder="e.g. meta-llama/Llama-3.1-8B"
      renderItem={(model) => (
        <div className="col gap-1 py-1">
          <div className="font-medium">{model.id}</div>
          <div className="text-sm text-dim">
            <T id="model.modelNameMeta" values={{ likes: model.likes, downloads: model.downloads }} />
          </div>
        </div>
      )}
      renderNoItems={() => <T id="model.noResults" />}
      resetOnBlur={false}
      inputValue={search}
      onInputValueChange={(value) => {
        setSearch(value);
        field.onChange(value);
      }}
      onSelectedItemChange={(model) => field.onChange(model.id)}
      name={field.name}
      onBlur={field.onBlur}
      className="max-w-lg"
    />
  );
}
