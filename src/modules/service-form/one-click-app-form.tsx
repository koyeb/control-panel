import { AccordionHeader, AccordionSection, Badge } from '@koyeb/design-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Fragment, useEffect, useRef, useState } from 'react';
import {
  FormProvider,
  UseFormReturn,
  useController,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form';

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
import { useOrganization, useOrganizationQuotas, useOrganizationQuotasQuery } from 'src/api/hooks/session';
import { OneClickApp } from 'src/api/model';
import { useInstanceAvailabilities } from 'src/application/instance-region-availability';
import { formatBytes, parseBytes } from 'src/application/memory';
import { ControlledInput } from 'src/components/controlled';
import { Loading } from 'src/components/loading';
import { Metadata } from 'src/components/metadata';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { handleSubmit } from 'src/hooks/form';
import { useDeepCompareMemo } from 'src/hooks/lifecycle';
import { useNavigate } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { Translate, TranslateEnum, createTranslate } from 'src/intl/translate';
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
import { defined } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';

import { useGetInstanceBadges } from '../instance-selector/instance-badges';
import { InstanceCategoryTabs } from '../instance-selector/instance-category-tabs';

import { QuotaIncreaseRequestDialog } from './components/quota-increase-request-dialog';
import { ServiceFormUpgradeDialog } from './components/service-form-upgrade-dialog';
import { ServiceCost, computeEstimatedCost } from './helpers/estimated-cost';
import { initializeServiceForm } from './helpers/initialize-service-form';
import { usePreSubmitServiceForm } from './helpers/pre-submit-service-form';
import { serviceFormSchema } from './helpers/service-form.schema';
import { submitServiceForm } from './helpers/submit-service-form';
import { ServiceForm } from './service-form.types';
import { useWatchServiceForm } from './use-service-form';

const T = createTranslate('modules.serviceForm.oneClickAppForm');

type OneClickAppFormProps = {
  app: OneClickApp;
  onCostChanged: (cost?: ServiceCost) => void;
};

export function OneClickAppForm(props: OneClickAppFormProps) {
  const datacenters = useDatacentersQuery();
  const regions = useRegionsQuery();
  const instances = useInstancesQuery();
  const quotas = useOrganizationQuotasQuery();
  const githubApp = useGithubAppQuery();

  if (
    datacenters.isPending ||
    regions.isPending ||
    instances.isPending ||
    quotas.isPending ||
    githubApp.isPending
  ) {
    return <Loading />;
  }

  return <OneClickAppForm_ {...props} />;
}

function OneClickAppForm_({ app, onCostChanged }: OneClickAppFormProps) {
  const navigate = useNavigate();

  const datacenters = useDatacenters();
  const regions = useRegions();
  const instances = useInstances();
  const organization = useOrganization();
  const quotas = defined(useOrganizationQuotas());
  const githubApp = useGithubApp();
  const queryClient = useQueryClient();

  const form = useForm<ServiceForm>({
    defaultValues: () => {
      const { searchParams } = new URL(app.deployUrl);

      return initializeServiceForm(
        searchParams,
        datacenters,
        regions,
        instances,
        organization,
        quotas,
        githubApp,
        undefined,
        queryClient,
      );
    },
    resolver: useZodResolver(serviceFormSchema(organization, quotas)),
  });

  const mutation = useMutation({
    mutationKey: ['deployOneClickApp'],
    mutationFn: submitServiceForm,
    onSuccess({ serviceId }) {
      navigate({ to: '/services/new', search: { step: 'initialDeployment', serviceId } });
    },
  });

  const formRef = useRef<HTMLFormElement>(null);
  const [requiredPlan, preSubmit] = usePreSubmitServiceForm();

  useOnCostEstimationChanged(form, onCostChanged);

  if (form.formState.isLoading) {
    return <Loading />;
  }

  return (
    <FormProvider {...form}>
      <form
        ref={formRef}
        onSubmit={handleSubmit(form, (values) => {
          const instance = instances.find(hasProperty('id', values.instance));

          if (instance && preSubmit(instance)) {
            return mutation.mutateAsync(values);
          }
        })}
        id="one-click-app-form"
        className="col gap-6"
      >
        <OverviewSection />

        <div className="rounded-lg border">
          <EnvironmentVariablesSection />
          <InstanceSection />
        </div>

        <VolumesSection />
      </form>

      <QuotaIncreaseRequestDialog catalogInstanceId={form.watch('instance')} />
      <ServiceFormUpgradeDialog plan={requiredPlan} submitForm={() => formRef.current?.requestSubmit()} />
    </FormProvider>
  );
}

function useOnCostEstimationChanged(
  form: UseFormReturn<ServiceForm>,
  onChanged: (cost?: ServiceCost) => void,
) {
  const instance = useInstance(form.watch('instance'));
  const regions = useDeepCompareMemo(useRegions(form.watch('regions')));

  useEffect(() => {
    const cost = computeEstimatedCost(
      instance,
      regions.map((region) => region.id),
      { min: 1, max: 1 },
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

function OverviewSection() {
  const { watch } = useFormContext<ServiceForm>();
  const { repositoryName, branch } = watch(`source.git.${watch('source.git.repositoryType')}Repository`);

  const repository = {
    repository: `github.com/${repositoryName}`,
    branch,
  };

  return (
    <Section title={<T id="overview" />}>
      <div className="divide-y rounded bg-muted">
        <div className="row flex-wrap gap-x-12 gap-y-4 p-3">
          {watch('source.type') === 'git' && (
            <>
              <RepositoryMetadata {...repository} />
              <BranchMetadata {...repository} />
            </>
          )}

          {watch('source.type') === 'docker' && (
            <>
              <DockerImageMetadata image={watch('source.docker.image')} />
            </>
          )}
        </div>

        <div className="row flex-wrap gap-x-12 gap-y-4 p-3">
          <InstanceTypeMetadata instanceType={watch('instance')} />
          <ScalingMetadata scaling={watch('scaling')} />
          <RegionsMetadata regions={watch('regions')} />
        </div>
      </div>
    </Section>
  );
}

function EnvironmentVariablesSection() {
  const [optionalExpanded, setOptionalExpanded] = useState(false);

  const { watch } = useFormContext<ServiceForm>();

  const fieldArray = useFieldArray<ServiceForm, 'environmentVariables'>({ name: 'environmentVariables' });
  const fields = fieldArray.fields.filter((field) => field.name !== '');

  return (
    <section>
      <header className="row h-16 items-center px-3 py-2">
        <div className="font-medium">
          <T id="environmentVariables.title" />
        </div>
      </header>

      <div className="col gap-6 px-3 py-4">
        {fields.length === 0 && <T id="environmentVariables.empty" />}

        {fields.map((field, index) => (
          <Fragment key={field.id}>
            <ControlledInput
              label={watch(`environmentVariables.${index}.name`)}
              name={`environmentVariables.${index}.value`}
              helperText="Some description"
            />
          </Fragment>
        ))}

        <AccordionSection
          isExpanded={optionalExpanded}
          header={
            <AccordionHeader expanded={optionalExpanded} setExpanded={setOptionalExpanded}>
              <div className="text-xs font-medium">
                <T id="environmentVariables.optional" values={{ count: 1 }} />
              </div>
            </AccordionHeader>
          }
          className="rounded-md border bg-muted"
        >
          <div className="p-4">To do</div>
        </AccordionSection>
      </div>
    </section>
  );
}

function InstanceSection() {
  const [expanded, setExpanded] = useState(false);

  const { watch } = useFormContext<ServiceForm>();

  const instances = useInstances();
  const regions = useRegions();

  const instanceCtrl = useController<ServiceForm, 'instance'>({ name: 'instance' });
  const regionsCtrl = useController<ServiceForm, 'regions'>({ name: 'regions' });

  const selectedInstance = instances.find(hasProperty('id', instanceCtrl.field.value));
  const selectedRegions = regions.filter((region) => inArray(region.id, regionsCtrl.field.value));

  const availabilities = useInstanceAvailabilities({
    serviceType: watch('serviceType'),
    hasVolumes: watch('volumes').length > 0,
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
    <AccordionSection
      isExpanded={expanded}
      header={
        <AccordionHeader expanded={expanded} setExpanded={setExpanded}>
          <div className="col gap-1.5">
            <div className="font-medium">
              <T id="instance.title" />
            </div>

            {selectedInstance && (
              <div className="row items-center gap-4 text-xs text-dim">
                <Translate
                  id="common.instanceSpec"
                  values={{
                    cpu: selectedInstance.vcpuShares,
                    ram: selectedInstance.memory,
                    disk: selectedInstance.disk,
                  }}
                />

                <Badge color="green" size={1}>
                  <TranslateEnum enum="instanceCategory" value={selectedInstance.category} />
                </Badge>

                {selectedRegions.length > 0 && (
                  <span className="inline-flex flex-row items-center gap-2">
                    <RegionName regionId={selectedRegions[0]!.id} />
                    <RegionFlag regionId={selectedRegions[0]!.id} className="size-em" />
                    {selectedRegions.length > 1 && (
                      <Translate id="common.plusCount" values={{ count: selectedRegions.length - 1 }} />
                    )}
                  </span>
                )}
              </div>
            )}
          </div>
        </AccordionHeader>
      }
    >
      <div className="px-3 py-4">
        <InstanceCategoryTabs
          category={selector.instanceCategory}
          setCategory={selector.onInstanceCategorySelected}
        />
      </div>

      <div className="col max-h-[32rem] scrollbar-thin gap-3 overflow-auto px-3 scrollbar-green">
        <InstanceSelector {...selector} getBadges={getBadges} />
      </div>
    </AccordionSection>
  );
}

function VolumesSection() {
  const volumes = useWatchServiceForm('volumes');

  if (volumes.length === 0) {
    return null;
  }

  return (
    <Section title={<T id="volumes.title" />}>
      {volumes.map((volume, index) => (
        <div key={volume.name} className="divide-y rounded bg-muted">
          <div className="row flex-wrap gap-x-12 gap-y-4 p-3">
            <Metadata label={<T id="volumes.name" values={{ number: index + 1 }} />} value={volume.name} />

            <Metadata label={<T id="volumes.mountPath" />} value={volume.mountPath} />

            <Metadata
              label={<T id="volumes.size" />}
              value={formatBytes(parseBytes(volume.size + 'GB'), { decimal: true })}
            />
          </div>
        </div>
      ))}
    </Section>
  );
}
