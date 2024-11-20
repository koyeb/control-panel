import { useMutation } from '@tanstack/react-query';
import merge from 'lodash-es/merge';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
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
import { InstanceCategory } from 'src/api/model';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { ControlledSelect } from 'src/components/controlled';
import { InstanceSelector } from 'src/components/instance-selector';
import { LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { Translate } from 'src/intl/translate';
import { hasProperty } from 'src/utils/object';

import { BranchMetadata, RepositoryMetadata } from '../deployment/metadata/build-metadata';
import { DockerImageMetadata } from '../deployment/metadata/docker-metadata';
import {
  InstanceTypeMetadata,
  RegionsMetadata,
  ScalingMetadata,
} from '../deployment/metadata/runtime-metadata';

import { RestrictedGpuDialog } from './components/restricted-gpu-dialog';
import { ServiceFormPaymentDialog } from './components/service-form-payment-dialog';
import { computeEstimatedCost, ServiceCost } from './helpers/estimated-cost';
import { generateAppName } from './helpers/generate-app-name';
import { defaultServiceForm } from './helpers/initialize-service-form';
import { parseDeployParams } from './helpers/parse-deploy-params';
import { usePreSubmitServiceForm } from './helpers/pre-submit-service-form';
import { submitServiceForm } from './helpers/submit-service-form';
import { ServiceForm } from './service-form.types';

const T = Translate.prefix('oneClickAppForm');

const schema = z.object({
  instance: z.string(),
  region: z.string(),
  environmentVariables: z.array(z.object({ name: z.string(), value: z.string() })),
});

type OneClickAppFormType = z.infer<typeof schema>;
type OneClickAppForm = UseFormReturn<OneClickAppFormType>;

type OneClickAppFormProps = {
  onCostChanged: (cost?: ServiceCost) => void;
};

export function OneClickAppForm(props: OneClickAppFormProps) {
  const instances = useInstancesQuery();
  const regions = useRegionsQuery();
  const githubApp = useGithubAppQuery();

  if (instances.isPending || regions.isPending || githubApp.isPending) {
    return <Loading />;
  }

  return <OneClickAppForm_ {...props} />;
}

function OneClickAppForm_({ onCostChanged }: OneClickAppFormProps) {
  const searchParams = useSearchParams();
  const instances = useInstances();
  const regions = useRegions();
  const githubApp = useGithubApp();

  const serviceForm = useMemo(() => {
    return merge(
      defaultServiceForm(),
      parseDeployParams(searchParams, instances, regions, githubApp?.organizationName),
    );
  }, [searchParams, instances, regions, githubApp]);

  const navigate = useNavigate();

  const form = useForm<OneClickAppFormType>({
    defaultValues: {
      instance: 'nano',
      region: 'fra',
      environmentVariables: [],
    },
    resolver: useZodResolver(schema),
  });

  const mutation = useMutation({
    async mutationFn({ instance, region, environmentVariables }: FormValues<typeof form>) {
      serviceForm.appName = generateAppName();
      serviceForm.instance.identifier = instance;
      serviceForm.regions = [region];
      serviceForm.environmentVariables = environmentVariables;

      return submitServiceForm(serviceForm);
    },
    onError: (error) => notify.error(error.message),
    onSuccess({ serviceId }) {
      navigate(routes.initialDeployment(serviceId));
    },
  });

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
        <OverviewSection serviceForm={serviceForm} form={form} />
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

function useOnCostEstimationChanged(form: OneClickAppForm, onChanged: (cost?: ServiceCost) => void) {
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

function OverviewSection({ serviceForm, form }: { serviceForm: ServiceForm; form: OneClickAppForm }) {
  const { repositoryType, organizationRepository, publicRepository } = serviceForm.source.git;
  const { repositoryName, branch } =
    repositoryType === 'organization' ? organizationRepository : publicRepository;

  const repository = {
    repository: `github.com/${repositoryName}`,
    branch,
  };

  const scaling = {
    type: serviceForm.scaling.type,
    instances: serviceForm.scaling.fixed,
    min: serviceForm.scaling.autoscaling.min,
    max: serviceForm.scaling.autoscaling.max,
  };

  return (
    <Section title={<T id="overview" />}>
      <div className="divide-y rounded border">
        <div className="row gap-12 p-3">
          {serviceForm.source.type === 'git' && (
            <>
              <RepositoryMetadata {...repository} />
              <BranchMetadata {...repository} />
            </>
          )}

          {serviceForm.source.type === 'docker' && (
            <>
              <DockerImageMetadata image={serviceForm.source.docker.image} />
            </>
          )}
        </div>

        <div className="row gap-12 p-3">
          <InstanceTypeMetadata instanceType={form.watch('instance')} />
          <ScalingMetadata scaling={scaling} />
          <RegionsMetadata regions={[form.watch('region')]} />
        </div>
      </div>
    </Section>
  );
}

function InstanceSection({ form }: { form: OneClickAppForm }) {
  const instances = useInstances();
  const instance = useInstance(form.watch('instance'));
  const [category, setCategory] = useState<InstanceCategory>('standard');

  return (
    <Section title={<T id="instance" />}>
      <InstanceSelector
        instances={instances
          .filter(hasProperty('regionCategory', 'koyeb'))
          .filter(hasProperty('category', category))}
        selectedCategory={category}
        onCategorySelected={setCategory}
        selectedInstance={instance ?? null}
        onInstanceSelected={(instance) => {
          form.setValue('instance', instance.identifier);
          form.setValue('region', instance.regions?.[0] ?? 'fra');
        }}
        checkAvailability={() => [true]}
      />
    </Section>
  );
}

function RegionSection({ form }: { form: OneClickAppForm }) {
  const availableRegions = useRegions().filter(hasProperty('status', 'available'));
  const instance = useInstance(form.watch('instance'));

  return (
    <Section title={<T id="region" />}>
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
