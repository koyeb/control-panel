import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useFieldArray, useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@koyeb/design-system';
import {
  useDatacenters,
  useDatacentersQuery,
  useInstance,
  useInstances,
  useInstancesQuery,
  useRegion,
  useRegions,
  useRegionsQuery,
} from 'src/api/hooks/catalog';
import { useGithubApp, useGithubAppQuery } from 'src/api/hooks/git';
import { useOrganization } from 'src/api/hooks/session';
import { useInstanceAvailabilities } from 'src/application/instance-region-availability';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { ControlledInput, ControlledSelect } from 'src/components/controlled';
import { InstanceSelector } from 'src/components/instance-selector';
import { LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate, Translate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';

import { BranchMetadata, RepositoryMetadata } from '../deployment/metadata/build-metadata';
import { DockerImageMetadata } from '../deployment/metadata/docker-metadata';
import {
  InstanceTypeMetadata,
  RegionsMetadata,
  ScalingMetadata,
} from '../deployment/metadata/runtime-metadata';

import { QuotaIncreaseRequestDialog } from './components/quota-increase-request-dialog';
import { ServiceFormUpgradeDialog } from './components/service-form-upgrade-dialog';
import { computeEstimatedCost, ServiceCost } from './helpers/estimated-cost';
import { generateAppName } from './helpers/generate-app-name';
import { initializeServiceForm } from './helpers/initialize-service-form';
import { usePreSubmitServiceForm } from './helpers/pre-submit-service-form';
import { submitServiceForm } from './helpers/submit-service-form';
import { ServiceForm } from './service-form.types';

const T = createTranslate('modules.serviceForm.oneClickAppForm');

const schema = z.object({
  instance: z.string().nullable(),
  region: z.string(),
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
        region: values.regions[0]!,
        environmentVariables: values.environmentVariables,
      };
    },
    resolver: useZodResolver(schema),
  });

  const mutation = useMutation({
    async mutationFn({ instance, region, environmentVariables }: FormValues<typeof form>) {
      assert(serviceForm !== undefined);

      return submitServiceForm({
        ...serviceForm,
        appName: generateAppName(),
        instance,
        regions: [region],
        environmentVariables: environmentVariables.map((env) => ({ ...env, regions: [] })),
      });
    },
    onError: (error) => notify.error(error.message),
    onSuccess({ serviceId }) {
      navigate(routes.initialDeployment(serviceId));
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
          const instance = instances.find(hasProperty('identifier', values.instance));

          if (instance && preSubmit(instance)) {
            return mutation.mutateAsync(values);
          }
        })}
        className="col gap-6"
      >
        <OverviewSection serviceForm={serviceForm} form={form} />
        <InstanceSection serviceForm={serviceForm} form={form} />
        <RegionSection form={form} />
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

      <QuotaIncreaseRequestDialog instanceIdentifier={form.watch('instance')} />
      <ServiceFormUpgradeDialog plan={requiredPlan} submitForm={() => formRef.current?.requestSubmit()} />
    </>
  );
}

function useOnCostEstimationChanged(form: OneClickAppForm, onChanged: (cost?: ServiceCost) => void) {
  const instance = useInstance(form.watch('instance'));
  const region = useRegion(form.watch('region'));

  useEffect(() => {
    const cost = computeEstimatedCost(instance, region ? [region.identifier] : [], {
      min: 1,
      max: 1,
      targets: null as never,
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
          <RegionsMetadata regions={[form.watch('region')]} />
        </div>
      </div>
    </Section>
  );
}

function InstanceSection({ serviceForm, form }: { serviceForm: ServiceForm; form: OneClickAppForm }) {
  const instances = useInstances();
  const instance = useInstance(form.watch('instance'));

  const availabilities = useInstanceAvailabilities({
    serviceType: serviceForm.serviceType,
    hasVolumes: serviceForm.volumes.length > 0,
  });

  return (
    <Section title={<T id="instance" />}>
      <InstanceSelector
        instances={instances.filter(hasProperty('regionCategory', 'koyeb'))}
        selectedInstance={instance ?? null}
        onInstanceSelected={(instance) => {
          form.setValue('instance', instance?.identifier ?? null);
          form.setValue('region', instance?.regions?.[0] ?? 'fra');
        }}
        checkAvailability={(instance) => availabilities[instance] ?? [false, 'instanceNotFound']}
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
            <RegionFlag identifier={region.identifier} className="size-6" />
            <RegionName identifier={region.identifier} />
          </div>
        )}
      />
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
