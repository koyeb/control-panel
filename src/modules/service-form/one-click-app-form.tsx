import { AccordionHeader, AccordionSection, Badge, Checkbox, FieldHelperText } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import merge from 'lodash-es/merge';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Controller,
  FormProvider,
  UseFormReturn,
  useController,
  useForm,
  useFormContext,
} from 'react-hook-form';
import { z } from 'zod';

import { useInstance, useInstances, useRegions } from 'src/api/hooks/catalog';
import { useGithubApp } from 'src/api/hooks/git';
import { EnvironmentVariable, OneClickApp, OneClickAppEnv, OneClickAppMetadata } from 'src/api/model';
import { useInstanceAvailabilities } from 'src/application/instance-region-availability';
import { formatBytes, parseBytes } from 'src/application/memory';
import { tooBig, tooSmall } from 'src/application/zod';
import { ControlledInput, ControlledSelect } from 'src/components/controlled';
import { ExternalLink } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { Metadata } from 'src/components/metadata';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { handleSubmit } from 'src/hooks/form';
import { useDeepCompareMemo } from 'src/hooks/lifecycle';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { Translate, TranslateEnum, createTranslate } from 'src/intl/translate';
import {
  InstanceTypeMetadata,
  RegionsMetadata,
  ScalingMetadata,
} from 'src/modules/deployment/metadata/runtime-metadata';
import { InstanceSelector } from 'src/modules/instance-selector/instance-selector';
import { useInstanceSelector } from 'src/modules/instance-selector/instance-selector-state';
import { inArray } from 'src/utils/arrays';
import { hasProperty } from 'src/utils/object';

import { useGetInstanceBadges } from '../instance-selector/instance-badges';
import { InstanceCategoryTabs } from '../instance-selector/instance-category-tabs';

import { QuotaIncreaseRequestDialog } from './components/quota-increase-request-dialog';
import { ServiceFormUpgradeDialog } from './components/service-form-upgrade-dialog';
import { deploymentDefinitionToServiceForm } from './helpers/deployment-to-service-form';
import { ServiceCost, computeEstimatedCost } from './helpers/estimated-cost';
import { defaultServiceForm } from './helpers/initialize-service-form';
import { usePreSubmitServiceForm } from './helpers/pre-submit-service-form';
import { submitServiceForm } from './helpers/submit-service-form';
import { ServiceForm } from './service-form.types';

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
  const navigate = useNavigate();

  const searchParams = useSearchParams();
  const appId = searchParams.get('app_id');

  const instances = useInstances();
  const githubApp = useGithubApp();

  const serviceForm = useMemo(() => {
    return merge(
      { ...defaultServiceForm(), environmentVariables: [] },
      deploymentDefinitionToServiceForm(app.deploymentDefinition, githubApp?.organizationName, []),
      {
        meta: { appId },
        appName: app.slug,
        volumes: app.templateDefinition?.volumes?.map((volume) => ({
          name: volume.name,
          size: volume.size,
          mountPath: volume.path,
          mounted: false,
        })),
      },
    );
  }, [app, githubApp, appId]);

  const form = useForm<OneClickAppForm>({
    defaultValues: {
      instance: serviceForm.instance,
      regions: serviceForm.regions,
      environmentVariables: app.templateEnv.map((env) => ({
        name: env.name,
        value: String(env.default ?? ''),
        regions: [],
      })),
    },
    resolver: useZodResolver(createSchema(app)),
  });

  const mutation = useMutation({
    mutationKey: ['deployOneClickApp'],
    mutationFn: (values: OneClickAppForm) => submitServiceForm(merge(serviceForm, values)),
    async onSuccess({ serviceId }) {
      await navigate({ to: '/services/new', search: { step: 'initialDeployment', serviceId } });
    },
  });

  const formRef = useRef<HTMLFormElement>(null);
  const [requiredPlan, preSubmit] = usePreSubmitServiceForm();

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

      <QuotaIncreaseRequestDialog catalogInstanceId={form.watch('instance')} />
      <ServiceFormUpgradeDialog plan={requiredPlan} submitForm={() => formRef.current?.requestSubmit()} />
    </FormProvider>
  );
}

function createSchema(app: OneClickApp): z.ZodType<OneClickAppForm> {
  return z.object({
    instance: z.string(),
    regions: z.array(z.string()).min(1),
    environmentVariables: z.array(createEnvironmentVariableSchema(app.templateEnv)),
  });
}

function createEnvironmentVariableSchema(env: OneClickAppEnv[]): z.ZodType<EnvironmentVariable> {
  return z.object({ name: z.string(), value: z.string(), regions: z.tuple([]) }).superRefine((value, ctx) => {
    const definition = env.find(hasProperty('name', value.name));

    if (definition?.type === 'number') {
      const number = Number(value.value);

      if (Number.isNaN(number)) {
        return;
      }

      if (definition.min !== undefined && number < definition.min) {
        ctx.addIssue(tooSmall('value', definition.min));
      }

      if (definition.max !== undefined && number > definition.max) {
        ctx.addIssue(tooBig('value', definition.max));
      }
    }
  });
}

function useOnCostEstimationChanged(
  form: UseFormReturn<OneClickAppForm>,
  serviceForm: ServiceForm | undefined,
  onChanged: (cost?: ServiceCost) => void,
) {
  const instance = useInstance(form.watch('instance'));
  const regions = useDeepCompareMemo(useRegions(form.watch('regions')));

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
    <Section title={<T id="overview" />}>
      <div className="divide-y rounded bg-muted">
        <dl className="row flex-wrap gap-3 p-3">
          {app.templateMetadata?.map((metadata, index) => (
            <Metadata
              key={index}
              label={metadata.name}
              value={value(metadata)}
              className="w-40 [&>dd]:truncate"
            />
          ))}
        </dl>

        <dl className="row flex-wrap gap-3 p-3 [&>div]:w-40">
          <InstanceTypeMetadata instanceType={watch('instance')} />
          <ScalingMetadata scaling={serviceForm.scaling} />
          <RegionsMetadata regions={watch('regions')} />
        </dl>
      </div>
    </Section>
  );
}

function EnvironmentVariablesSection({ app }: { app: OneClickApp }) {
  const [optionalExpanded, setOptionalExpanded] = useState(false);

  const { watch } = useFormContext<OneClickAppForm>();
  const env = watch('environmentVariables');
  const index = (name: string) => env.findIndex(hasProperty('name', name));

  const required = app.templateEnv.filter(hasProperty('required', true));
  const optional = app.templateEnv.filter(hasProperty('required', false));

  if (required.length === 0 && optional.length === 0) {
    return null;
  }

  return (
    <section>
      <header className="row h-16 items-center px-3 py-2">
        <div className="font-medium">
          <T id="environmentVariables.title" />
        </div>
      </header>

      <div className="col gap-6 px-3 py-4">
        {required.map((env) => (
          <EnvironmentVariableField key={env.name} index={index(env.name)} env={env} />
        ))}

        {optional.length > 0 && (
          <AccordionSection
            isExpanded={optionalExpanded}
            header={
              <AccordionHeader expanded={optionalExpanded} setExpanded={setOptionalExpanded}>
                <div className="text-xs font-medium">
                  <T id="environmentVariables.optional" values={{ count: optional.length }} />
                </div>
              </AccordionHeader>
            }
            className="rounded-md border bg-muted"
          >
            <div className="col gap-6 p-4">
              {optional.map((env) => (
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
        itemToValue={({ value }) => value}
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

  const instances = useInstances();
  const regions = useRegions();

  const instanceCtrl = useController<ServiceForm, 'instance'>({ name: 'instance' });
  const regionsCtrl = useController<ServiceForm, 'regions'>({ name: 'regions' });

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

      <div className="col max-h-[32rem] scrollbar-thin gap-3 overflow-auto px-3 pb-3 scrollbar-green">
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
