import { zodResolver } from '@hookform/resolvers/zod';
import { AccordionHeader, AccordionSection, Alert, Badge, FieldHelperText } from '@koyeb/design-system';
import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import merge from 'lodash-es/merge';
import { useEffect, useRef, useState } from 'react';
import {
  Controller,
  FormProvider,
  UseFormReturn,
  useController,
  useForm,
  useFormContext,
} from 'react-hook-form';
import z from 'zod';

import {
  createEnsureApiQueryData,
  mapGithubApp,
  mapVolume,
  useApi,
  useCatalogInstance,
  useInstancesCatalog,
  useRegionsCatalog,
} from 'src/api';
import { useInstanceAvailabilities } from 'src/application/instance-region-availability';
import { formatBytes, parseBytes } from 'src/application/memory';
import { Checkbox, ControlledInput, ControlledSelect } from 'src/components/forms';
import { ExternalLink } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { Metadata } from 'src/components/metadata';
import { fetchGithubRepository } from 'src/components/public-github-repository-input/github-api';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { handleSubmit } from 'src/hooks/form';
import { useDeepCompareMemo } from 'src/hooks/lifecycle';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { Translate, TranslateEnum, createTranslate } from 'src/intl/translate';
import { EnvironmentVariable, OneClickApp, OneClickAppEnv, OneClickAppMetadata, Volume } from 'src/model';
import { InstanceSelector } from 'src/modules/instance-selector/instance-selector';
import { useInstanceSelector } from 'src/modules/instance-selector/instance-selector-state';
import { inArray } from 'src/utils/arrays';
import { hasProperty } from 'src/utils/object';

import { InstanceMetadata, RegionsMetadata } from '../deployment/metadata';
import { useGetInstanceBadges } from '../instance-selector/instance-badges';
import { InstanceCategoryTabs } from '../instance-selector/instance-category-tabs';

import { deploymentDefinitionToServiceForm } from './helpers/deployment-to-service-form';
import { ServiceCost, computeEstimatedCost } from './helpers/estimated-cost';
import { generateAppName } from './helpers/generate-app-name';
import { defaultServiceForm } from './helpers/initialize-service-form';
import { usePreSubmitServiceForm } from './helpers/pre-submit-service-form';
import { submitServiceForm } from './helpers/submit-service-form';
import { Scaling, ServiceForm } from './service-form.types';

const T = createTranslate('modules.serviceForm.oneClickAppForm');

type OneClickAppForm = {
  instance: string | null;
  regions: string[];
  environmentVariables: EnvironmentVariable[];
};

type OneClickAppFormProps = {
  app: OneClickApp;
  onCostChanged: (cost?: ServiceCost) => void;
};

export function OneClickAppForm({ app, onCostChanged }: OneClickAppFormProps) {
  const api = useApi();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const navigate = useNavigate();

  const instances = useInstancesCatalog();

  const serviceFormRef = useRef(defaultServiceForm());
  const serviceForm = serviceFormRef.current;

  const form = useForm<OneClickAppForm>({
    defaultValues: () => initialize(app, serviceFormRef.current, searchParams, queryClient),
    resolver: zodResolver(createSchema(app)),
  });

  const mutation = useMutation({
    mutationKey: ['deployOneClickApp'],
    mutationFn: (values: OneClickAppForm) => submitServiceForm(api, merge(serviceForm, values)),
    async onSuccess({ serviceId }) {
      await navigate({ to: '/services/new', search: { step: 'initialDeployment', serviceId } });
    },
  });

  const formRef = useRef<HTMLFormElement>(null);
  const preSubmit = usePreSubmitServiceForm(formRef.current);

  useOnCostEstimationChanged(form, serviceForm, onCostChanged);

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
        <OverviewSection app={app} serviceForm={serviceForm} />

        <div className="rounded-lg border">
          <EnvironmentVariablesSection app={app} />
          <InstanceSection serviceForm={serviceForm} />
        </div>

        <VolumesSection serviceForm={serviceForm} />
      </form>
    </FormProvider>
  );
}

async function initialize(
  app: OneClickApp,
  serviceForm: ServiceForm,
  searchParams: URLSearchParams,
  queryClient: QueryClient,
) {
  const api = createEnsureApiQueryData(queryClient);

  const githubApp = await api('get /v1/github/installation', {})
    .then(mapGithubApp)
    .catch(() => null);

  const volumes = await api('get /v1/volumes', { query: { limit: '100' } }).then(({ volumes }) =>
    volumes!.map(mapVolume),
  );

  merge(
    serviceForm,
    deploymentDefinitionToServiceForm(app.deploymentDefinition, githubApp?.organizationName, []),
    {
      meta: { appId: searchParams.get('app_id') },
      appName: generateAppName(),
      volumes: app.volumes?.map((volume) => ({
        name: findAvailableVolumeName(volumes, volume.name),
        size: volume.size,
        mountPath: volume.path,
        mounted: false,
      })),
    },
  );

  serviceForm.environmentVariables = [];

  const git = serviceForm.source.git;

  if (git.repositoryType === 'public' && git.publicRepository.repositoryName !== null) {
    const repository = await fetchGithubRepository(git.publicRepository.repositoryName).catch(() => null);

    if (repository) {
      git.publicRepository.url = repository.url;
      git.publicRepository.branch ??= repository.defaultBranch;
    }
  }

  return {
    instance: serviceForm.instance,
    regions: serviceForm.regions,
    environmentVariables: app.env.map((env) => ({
      name: env.name,
      value: String(env.default ?? ''),
      regions: [],
    })),
  };
}

function findAvailableVolumeName(volumes: Volume[], baseName: string, i = 0): string {
  const name = i === 0 ? baseName : `${baseName}-${i}`;

  if (volumes.some(hasProperty('name', name))) {
    return findAvailableVolumeName(volumes, baseName, i + 1);
  }

  return name;
}

function createSchema(app: OneClickApp): z.ZodType<OneClickAppForm, OneClickAppForm> {
  return z.object({
    instance: z.string(),
    regions: z.array(z.string()).min(1),
    environmentVariables: z.array(createEnvironmentVariableSchema(app.env)),
  });
}

function createEnvironmentVariableSchema(env: OneClickAppEnv[]) {
  return z.object({ name: z.string(), value: z.string(), regions: z.tuple([]) }).superRefine((value, ctx) => {
    const definition = env.find(hasProperty('name', value.name));

    if (definition?.type === 'number') {
      const number = Number(value.value);

      if (Number.isNaN(number)) {
        return;
      }

      if (definition.min !== undefined && number < definition.min) {
        ctx.addIssue({ code: 'too_small', origin: 'number', minimum: definition.min });
      }

      if (definition.max !== undefined && number > definition.max) {
        ctx.addIssue({ code: 'too_big', origin: 'number', maximum: definition.max });
      }
    }
  });
}

function useOnCostEstimationChanged(
  form: UseFormReturn<OneClickAppForm>,
  serviceForm: ServiceForm | undefined,
  onChanged: (cost?: ServiceCost) => void,
) {
  const instance = useCatalogInstance(form.watch('instance'));
  const regions = useDeepCompareMemo(useRegionsCatalog(form.watch('regions')));

  useEffect(() => {
    if (serviceForm === undefined) {
      return;
    }

    const cost = computeEstimatedCost(
      instance,
      regions.map((region) => region.id),
      serviceForm.scaling,
    );

    onChanged(cost);
  }, [instance, regions, serviceForm, onChanged]);
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

function OverviewSection({ app, serviceForm }: { app: OneClickApp; serviceForm: ServiceForm }) {
  const { watch } = useFormContext<OneClickAppForm>();

  const value = ({ value, href }: OneClickAppMetadata) => {
    if (href) {
      return (
        <ExternalLink href={href} className="text-link" title={String(value)}>
          {value}
        </ExternalLink>
      );
    }

    return <span title={String(value)}>{value}</span>;
  };

  return (
    <Section title={<T id="metadata.title" />}>
      <div className="divide-y rounded-sm bg-muted">
        <dl className="row flex-wrap gap-3 p-3">
          {app.metadata.map((metadata, index) => (
            <Metadata
              key={index}
              label={metadata.name}
              value={value(metadata)}
              className="w-40 [&>dd]:truncate"
            />
          ))}
        </dl>

        <dl className="row flex-wrap gap-3 p-3 [&>div]:w-40">
          <InstanceMetadata instance={watch('instance')} />
          <ScalingMetadata scaling={serviceForm.scaling} />
          <RegionsMetadata regions={watch('regions')} />
        </dl>
      </div>
    </Section>
  );
}

function ScalingMetadata({ scaling }: { scaling: Scaling }) {
  return (
    <Metadata
      label={<T id="metadata.scaling.label" />}
      value={
        scaling.min === scaling.max ? (
          <T id="metadata.scaling.valueFixed" values={{ instances: scaling.min }} />
        ) : (
          <T id="metadata.scaling.valueAutoscaling" values={{ min: scaling.min, max: scaling.max }} />
        )
      }
    />
  );
}

function EnvironmentVariablesSection({ app }: { app: OneClickApp }) {
  const [optionalExpanded, setOptionalExpanded] = useState(false);

  const { watch } = useFormContext<OneClickAppForm>();
  const env = watch('environmentVariables');
  const index = (name: string) => env.findIndex(hasProperty('name', name));

  const advanced = app.env.filter(hasProperty('advanced', true));

  if (env.length === 0) {
    return null;
  }

  return (
    <section>
      <header className="row items-center px-3 pt-2 pb-1">
        <div className="font-medium">
          <T id="environmentVariables.title" />
        </div>
      </header>

      <div className="col gap-6 px-3 pt-1 pb-3">
        {app.env.filter(hasProperty('advanced', false)).map((env) => (
          <EnvironmentVariableField key={env.name} index={index(env.name)} env={env} />
        ))}

        {advanced.length > 0 && (
          <AccordionSection
            isExpanded={optionalExpanded}
            header={
              <AccordionHeader expanded={optionalExpanded} setExpanded={setOptionalExpanded}>
                <div className="text-xs font-medium">
                  <T id="environmentVariables.advanced" values={{ count: advanced.length }} />
                </div>
              </AccordionHeader>
            }
            className="rounded-md border bg-muted"
          >
            <div className="col gap-6 px-3 pt-1 pb-3">
              {advanced.map((env) => (
                <EnvironmentVariableField key={env.name} index={index(env.name)} env={env} />
              ))}
            </div>
          </AccordionSection>
        )}
      </div>
    </section>
  );
}

function EnvironmentVariableField({ index, env }: { index: number; env: OneClickAppEnv }) {
  if (env.type === 'boolean') {
    const { trueValue = 'true', falseValue = 'false' } = env;

    return (
      <Controller
        name={`environmentVariables.${index}.value`}
        render={({ field, fieldState }) => (
          <div className="col gap-2">
            <Checkbox
              label={env.label}
              required={env.required}
              checked={field.value === trueValue}
              onChange={(event) => field.onChange(event.target.checked ? trueValue : falseValue)}
            />
            <FieldHelperText invalid={fieldState.invalid}>
              {fieldState.error?.message ?? env.description}
            </FieldHelperText>
          </div>
        )}
      />
    );
  }

  if (env.type === 'select') {
    return (
      <ControlledSelect
        name={`environmentVariables.${index}.value`}
        helperText={env.description}
        label={env.label}
        items={env.options}
        getKey={({ label }) => label}
        itemToString={({ label }) => label}
        getValue={({ value }) => value}
        renderItem={({ label }) => label}
      />
    );
  }

  return (
    <ControlledInput
      name={`environmentVariables.${index}.value`}
      type="string"
      label={env.label}
      helperText={env.description}
      required={env.required}
    />
  );
}

function InstanceSection({ serviceForm }: { serviceForm: ServiceForm }) {
  const [expanded, setExpanded] = useState(false);

  const instances = useInstancesCatalog();
  const regions = useRegionsCatalog();

  const instanceCtrl = useController<ServiceForm, 'instance'>({ name: 'instance' });
  const regionsCtrl = useController<ServiceForm, 'regions'>({ name: 'regions' });

  const selectedInstance = instances.find(hasProperty('id', instanceCtrl.field.value));
  const selectedRegions = regions.filter((region) => inArray(region.id, regionsCtrl.field.value));

  const serviceType = serviceForm.serviceType;
  const hasVolumes = serviceForm.volumes.length > 0;

  const availabilities = useInstanceAvailabilities({ serviceType, hasVolumes });

  const selector = useInstanceSelector({
    instances,
    regions,
    availabilities,
    selectedInstance: selectedInstance ?? null,
    selectedRegions,
    singleRegion: hasVolumes,
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
      <div className="col gap-4 px-3 py-4">
        {hasVolumes && <Alert variant="info" description={<T id="singleRegionWithVolumes" />} />}

        <InstanceCategoryTabs
          category={selector.instanceCategory}
          setCategory={selector.onInstanceCategorySelected}
        />
      </div>

      <div className="col max-h-128 scrollbar-thin gap-3 overflow-auto px-3 pb-3 scrollbar-green">
        <InstanceSelector {...selector} getBadges={getBadges} />
      </div>
    </AccordionSection>
  );
}

function VolumesSection({ serviceForm }: { serviceForm: ServiceForm }) {
  const volumes = serviceForm.volumes;

  if (volumes.length === 0) {
    return null;
  }

  return (
    <Section title={<T id="volumes.title" />}>
      {volumes.map((volume) => (
        <div key={volume.name} className="divide-y rounded-sm bg-muted">
          <div className="row flex-wrap gap-x-12 gap-y-4 p-3">
            <Metadata label={<T id="volumes.name" />} value={volume.name} />

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
