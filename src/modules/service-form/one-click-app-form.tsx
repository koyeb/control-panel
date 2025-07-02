import { Button } from '@koyeb/design-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Fragment, useEffect, useRef, useState } from 'react';
import { UseFormReturn, useController, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  useDatacenters,
  useDatacentersQuery,
  useInstance,
  useInstances,
  useInstancesQuery,
  useRegions,
  useRegionsQuery,
} from 'src/api/hooks/catalog';
import { useGithubApp, useGithubAppQuery } from 'src/api/hooks/git';
import { useOrganization } from 'src/api/hooks/session';
import { useInstanceAvailabilities } from 'src/application/instance-region-availability';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { ControlledInput } from 'src/components/controlled';
import { LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useDeepCompareMemo } from 'src/hooks/lifecycle';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { Translate, createTranslate } from 'src/intl/translate';
import { BranchMetadata, RepositoryMetadata } from 'src/modules/deployment/metadata/build-metadata';
import { DockerImageMetadata } from 'src/modules/deployment/metadata/docker-metadata';
import {
  InstanceTypeMetadata,
  RegionsMetadata,
  ScalingMetadata,
} from 'src/modules/deployment/metadata/runtime-metadata';
import { InstanceSelector } from 'src/modules/instance-selector/instance-selector';
import { useInstanceSelector } from 'src/modules/instance-selector/instance-selector-state';
import { inArray } from 'src/utils/arrays';
import { assert } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';

import { useGetInstanceBadges } from '../instance-selector/instance-badges';
import { InstanceCategoryTabs } from '../instance-selector/instance-category-tabs';

import { QuotaIncreaseRequestDialog } from './components/quota-increase-request-dialog';
import { ServiceFormUpgradeDialog } from './components/service-form-upgrade-dialog';
import { ServiceCost, computeEstimatedCost } from './helpers/estimated-cost';
import { generateAppName } from './helpers/generate-app-name';
import { initializeServiceForm } from './helpers/initialize-service-form';
import { usePreSubmitServiceForm } from './helpers/pre-submit-service-form';
import { submitServiceForm } from './helpers/submit-service-form';
import { ServiceForm } from './service-form.types';

const T = createTranslate('modules.serviceForm.oneClickAppForm');

const schema = z.object({
  instance: z.string().nullable(),
  regions: z.string().array(),
  environmentVariables: z.array(z.object({ name: z.string(), value: z.string() })),
});

type OneClickAppFormType = z.infer<typeof schema>;
type OneClickAppForm = UseFormReturn<OneClickAppFormType>;

type OneClickAppFormProps = {
  onCostChanged: (cost?: ServiceCost) => void;
};

export function OneClickAppForm(props: OneClickAppFormProps) {
  const datacenters = useDatacentersQuery();
  const regions = useRegionsQuery();
  const instances = useInstancesQuery();
  const githubApp = useGithubAppQuery();

  if (datacenters.isPending || regions.isPending || instances.isPending || githubApp.isPending) {
    return <Loading />;
  }

  return <OneClickAppForm_ {...props} />;
}

function OneClickAppForm_({ onCostChanged }: OneClickAppFormProps) {
  const navigate = useNavigate();

  const params = useSearchParams();
  const datacenters = useDatacenters();
  const regions = useRegions();
  const instances = useInstances();
  const organization = useOrganization();
  const githubApp = useGithubApp();
  const queryClient = useQueryClient();

  const [serviceForm, setServiceForm] = useState<ServiceForm>();

  const form = useForm<OneClickAppFormType>({
    async defaultValues() {
      const values = await initializeServiceForm(
        params,
        datacenters,
        regions,
        instances,
        organization,
        githubApp,
        undefined,
        queryClient,
      );

      setServiceForm(values);

      return {
        instance: values.instance,
        regions: values.regions,
        environmentVariables: values.environmentVariables.filter((env) => env.name !== ''),
      };
    },
    resolver: useZodResolver(schema),
  });

  const mutation = useMutation({
    async mutationFn({ instance, regions, environmentVariables }: FormValues<typeof form>) {
      assert(serviceForm !== undefined);

      return submitServiceForm({
        ...serviceForm,
        appName: generateAppName(),
        instance,
        regions,
        environmentVariables: environmentVariables.map((env) => ({ ...env, regions: [] })),
      });
    },
    onError: (error) => notify.error(error.message),
    onSuccess({ serviceId }) {
      navigate({ to: routes.initialDeployment(serviceId) });
    },
  });

  const formRef = useRef<HTMLFormElement>(null);

  const [requiredPlan, preSubmit] = usePreSubmitServiceForm();

  useOnCostEstimationChanged(form, onCostChanged);

  if (!serviceForm) {
    return null;
  }

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleSubmit(form, (values) => {
          const instance = instances.find(hasProperty('id', values.instance));

          if (instance && preSubmit(instance)) {
            return mutation.mutateAsync(values);
          }
        })}
        className="col gap-6"
      >
        <OverviewSection serviceForm={serviceForm} form={form} />
        <InstanceSection serviceForm={serviceForm} form={form} />
        <EnvironmentVariablesSection form={form} />

        <div className="row justify-end gap-2">
          <LinkButton color="gray" href={routes.home()}>
            <Translate id="common.cancel" />
          </LinkButton>

          <Button type="submit" loading={form.formState.isSubmitting}>
            <T id="submitButton" />
          </Button>
        </div>
      </form>

      <QuotaIncreaseRequestDialog catalogInstanceId={form.watch('instance')} />
      <ServiceFormUpgradeDialog plan={requiredPlan} submitForm={() => formRef.current?.requestSubmit()} />
    </>
  );
}

function useOnCostEstimationChanged(form: OneClickAppForm, onChanged: (cost?: ServiceCost) => void) {
  const instance = useInstance(form.watch('instance'));
  const regions = useDeepCompareMemo(useRegions(form.watch('regions')));

  useEffect(() => {
    const cost = computeEstimatedCost(
      instance,
      regions.map((region) => region.id),
      {
        min: 1,
        max: 1,
        targets: null as never,
      },
    );

    onChanged(cost);
  }, [instance, regions, onChanged]);
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

  return (
    <Section title={<T id="overview" />}>
      <div className="divide-y rounded border">
        <div className="row flex-wrap gap-x-12 gap-y-4 p-3">
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

        <div className="row flex-wrap gap-x-12 gap-y-4 p-3">
          <InstanceTypeMetadata instanceType={form.watch('instance')} />
          <ScalingMetadata scaling={serviceForm.scaling} />
          <RegionsMetadata regions={form.watch('regions')} />
        </div>
      </div>
    </Section>
  );
}

function InstanceSection({ serviceForm, form }: { serviceForm: ServiceForm; form: OneClickAppForm }) {
  const instances = useInstances();
  const regions = useRegions();

  const instanceCtrl = useController({ control: form.control, name: 'instance' });
  const regionsCtrl = useController({ control: form.control, name: 'regions' });

  const selectedInstance = instances.find(hasProperty('id', instanceCtrl.field.value));
  const selectedRegions = regions.filter((region) => inArray(region.id, regionsCtrl.field.value));

  const availabilities = useInstanceAvailabilities({
    serviceType: serviceForm.serviceType,
    hasVolumes: serviceForm.volumes.length > 0,
  });

  const selector = useInstanceSelector({
    instances,
    regions,
    availabilities,
    selectedInstance: selectedInstance ?? null,
    selectedRegions,
    setSelectedInstance: (instance) => instanceCtrl.field.onChange(instance?.id ?? null),
    setSelectedRegions: (regions) => regionsCtrl.field.onChange(regions.map((region) => region.id)),
  });

  const getBadges = useGetInstanceBadges();

  return (
    <Section title={<T id="instance" />}>
      <InstanceCategoryTabs
        category={selector.instanceCategory}
        setCategory={selector.onInstanceCategorySelected}
      />

      <div className="mt-4 col max-h-96 scrollbar-thin gap-3 overflow-auto rounded-md border p-2 scrollbar-green">
        <InstanceSelector {...selector} getBadges={getBadges} />
      </div>
    </Section>
  );
}

function EnvironmentVariablesSection({ form }: { form: OneClickAppForm }) {
  const { fields } = useFieldArray({ control: form.control, name: 'environmentVariables' });

  if (fields.length === 0) {
    return null;
  }

  return (
    <Section title={<T id="environmentVariables" />}>
      <div className="grid grid-cols-2 gap-4">
        {fields.map((field, index) => (
          <Fragment key={field.id}>
            <ControlledInput
              control={form.control}
              name={`environmentVariables.${index}.name`}
              label={index === 0 && 'Key'}
              readOnly
            />

            <ControlledInput
              control={form.control}
              name={`environmentVariables.${index}.value`}
              label={index === 0 && 'Value'}
            />
          </Fragment>
        ))}
      </div>
    </Section>
  );
}
