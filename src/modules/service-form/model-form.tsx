import { useMutation } from '@tanstack/react-query';
import { merge } from 'lodash-es';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@koyeb/design-system';
import {
  useInstance,
  useInstances,
  useInstancesQuery,
  useRegion,
  useRegions,
  useRegionsQuery,
} from 'src/api/hooks/catalog';
import { useGithubApp, useGithubAppQuery } from 'src/api/hooks/git';
import { useOrganization, useOrganizationQuotas } from 'src/api/hooks/session';
import { EnvironmentVariable, OrganizationPlan } from 'src/api/model';
import { AiModel } from 'src/application/ai-models-catalog';
import { useTrackEvent } from 'src/application/analytics';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { ControlledInput } from 'src/components/controlled';
import { LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { PaymentDialog } from 'src/components/payment-form';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { Translate } from 'src/intl/translate';
import { slugify } from 'src/utils/strings';

import { EstimatedCost } from './components/estimated-cost';
import { RestrictedGpuDialogOpen } from './components/restricted-gpu-dialog';
import { parseDeployParams } from './helpers/parse-deploy-params';
import { defaultServiceForm } from './initialize-service-form';
import { submitServiceForm } from './submit-service-form';

const T = Translate.prefix('serviceForm');

const schema = z.object({
  modelName: z.string().min(1),
  huggingFaceToken: z.string(),
});

export function ModelForm({ model }: { model?: AiModel }) {
  const instances = useInstancesQuery();
  const regions = useRegionsQuery();
  const githubApp = useGithubAppQuery();

  if (instances.isPending || regions.isPending || githubApp.isPending) {
    return <Loading />;
  }

  return <ModelForm_ model={model} />;
}

function ModelForm_({ model }: { model?: AiModel }) {
  const searchParams = useSearchParams();
  const instances = useInstances();
  const regions = useRegions();
  const githubApp = useGithubApp();

  const serviceForm = useMemo(() => {
    const values = merge(
      defaultServiceForm(),
      parseDeployParams(searchParams, instances, regions, githubApp?.organizationName),
    );

    if (values.source.type === 'git') {
      values.source.git.publicRepository.url = `https://github.com/${values.source.git.publicRepository.repositoryName}`;
    }

    return values;
  }, [githubApp, instances, regions, searchParams]);

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      modelName: model?.name ?? '',
      huggingFaceToken: '',
    },
    resolver: useZodResolver(schema),
  });

  const navigate = useNavigate();

  const mutation = useMutation({
    async mutationFn({ modelName, huggingFaceToken }: FormValues<typeof form>) {
      const environmentVariables: EnvironmentVariable[] = [];

      environmentVariables.push({
        name: 'MODEL_NAME',
        value: modelName,
      });

      if (huggingFaceToken !== '') {
        environmentVariables.push({
          name: 'HF_TOKEN',
          value: huggingFaceToken,
        });
      }

      return submitServiceForm({
        ...serviceForm,
        appName: slugify(modelName),
        serviceName: slugify(modelName),
        environmentVariables,
      });
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

  const instance = useInstance(serviceForm.instance.identifier);
  const region = useRegion(instance?.regions?.[0]);

  const onSubmit = async (values: FormValues<typeof form>) => {
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

  return (
    <>
      <form
        ref={formRef}
        className="mx-auto max-w-3xl divide-y rounded-xl border"
        onSubmit={handleSubmit(form, onSubmit)}
      >
        <Section title="Model">
          <ControlledInput control={form.control} label="Model name" name="modelName" className="max-w-lg" />

          {model === undefined && (
            <ControlledInput
              control={form.control}
              label="Hugging Face token"
              name="huggingFaceToken"
              className="max-w-lg"
            />
          )}
        </Section>

        <Section title="Instance">
          <div>Instance: {instance?.displayName}</div>
          <div>Region: {region?.displayName}</div>
          <div>Scaling: {serviceForm.scaling.fixed}</div>
        </Section>

        <Section title="Estimated cost">
          <EstimatedCost form={serviceForm} />
        </Section>

        <div className="row justify-end gap-2 p-4">
          <LinkButton color="gray" href={routes.home()}>
            <Translate id="common.cancel" />
          </LinkButton>

          <Button type="submit" loading={form.formState.isSubmitting}>
            Deploy
          </Button>
        </div>
      </form>

      <RestrictedGpuDialogOpen
        open={restrictedGpuDialogOpen}
        onClose={() => setRestrictedGpuDialogOpen(false)}
        instanceIdentifier={instance!.identifier}
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

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="col gap-3 p-4">
      <div className="font-medium">{title}</div>
      {children}
    </section>
  );
}
