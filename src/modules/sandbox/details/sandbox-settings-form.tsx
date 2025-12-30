import { zodResolver } from '@hookform/resolvers/zod';
import { Button, InputEnd } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useIntl } from 'react-intl';
import z from 'zod';

import { API, apiMutation, getApi, useOrganizationQuotas } from 'src/api';
import { BaseServiceFormSection } from 'src/components/base-service-form-section';
import { OverridableInput } from 'src/components/overridable-input';
import { handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { Translate, createTranslate } from 'src/intl/translate';
import { OrganizationQuotas } from 'src/model';
import { formatSecondsDuration } from 'src/utils/date';

const T = createTranslate('pages.sandbox.details.settings');

type FormType = z.infer<ReturnType<typeof schema>>;

function schema(quotas: OrganizationQuotas) {
  return z.object({
    lifeCycle: z.object({
      deleteAfterCreate: z.union([
        z.nan(),
        z.null(),
        z.number().min(quotas.deleteAfterCreateMin).max(quotas.deleteAfterCreateMax),
      ]),
      deleteAfterSleep: z.union([
        z.nan(),
        z.null(),
        z.number().min(quotas.deleteAfterSleepMin).max(quotas.deleteAfterSleepMax),
      ]),
    }),
  });
}

export function SandboxSettingsForm({ serviceId }: { serviceId: string }) {
  const navigate = useNavigate();

  const quotas = useOrganizationQuotas();
  const apiDeploymentDefinition = useRef<API.DeploymentDefinition>(null);

  const form = useForm<FormType>({
    defaultValues: async () => {
      const [values, definition] = await initializeForm(serviceId);

      apiDeploymentDefinition.current = definition;

      return values;
    },
    resolver: zodResolver(schema(quotas)),
  });

  const updateServiceMutation = useMutation({
    ...apiMutation('put /v1/services/{id}', (form: FormType) => ({
      path: { id: serviceId },
      body: {
        definition: apiDeploymentDefinition.current!,
        life_cycle: {
          delete_after_create: form.lifeCycle.deleteAfterCreate || undefined,
          delete_after_sleep: form.lifeCycle.deleteAfterSleep || undefined,
        },
      },
    })),
    onError: useFormErrorHandler(form, (error) => ({
      'lifeCycle.deleteAfterCreate': error['life_cycle.delete_after_create'],
      'lifeCycle.deleteAfterSleep': error['life_cycle.delete_after_sleep'],
    })),
    onSuccess() {
      navigate({ to: '/sandboxes/$serviceId', params: { serviceId } });
    },
  });

  if (form.formState.isLoading) {
    return null;
  }

  return (
    <FormProvider {...form}>
      <form className="col gap-8" onSubmit={handleSubmit(form, updateServiceMutation.mutateAsync)}>
        <div className="rounded-lg border">
          <LifeCycleSection />
        </div>

        <Button type="submit" loading={form.formState.isSubmitting} className="self-start">
          <Translate id="common.save" />
        </Button>
      </form>
    </FormProvider>
  );
}

async function initializeForm(serviceId: string): Promise<[FormType, API.DeploymentDefinition]> {
  const api = getApi();

  const service = await api('get /v1/services/{id}', {
    path: { id: serviceId },
  });

  const deployment = await api('get /v1/deployments/{id}', {
    path: { id: service.service!.latest_deployment_id! },
  });

  return [
    {
      lifeCycle: {
        deleteAfterCreate: service.service!.life_cycle?.delete_after_create || null,
        deleteAfterSleep: service.service!.life_cycle?.delete_after_sleep || null,
      },
    },
    deployment.deployment!.definition!,
  ];
}

function LifeCycleSection() {
  const [expanded, setExpanded] = useState(false);
  const t = T.useTranslate();

  return (
    <BaseServiceFormSection
      title={<T id="lifeCycle.title" />}
      action={<T id="lifeCycle.action" />}
      summary={<Summary />}
      expanded={expanded}
      onExpand={() => setExpanded(!expanded)}
      className="col gaps"
    >
      <OverridableInput<FormType, 'lifeCycle.deleteAfterCreate'>
        name="lifeCycle.deleteAfterCreate"
        type="number"
        label={<T id="lifeCycle.deleteAfterCreate.label" />}
        tooltip={<T id="lifeCycle.deleteAfterCreate.tooltip" />}
        placeholder={t('lifeCycle.deleteAfterCreate.placeholder')}
        end={
          <InputEnd>
            <T id="lifeCycle.deleteAfterCreate.unit" />
          </InputEnd>
        }
        className="max-w-xs"
      />

      <OverridableInput<FormType, 'lifeCycle.deleteAfterSleep'>
        name="lifeCycle.deleteAfterSleep"
        type="number"
        label={<T id="lifeCycle.deleteAfterSleep.label" />}
        tooltip={<T id="lifeCycle.deleteAfterSleep.tooltip" />}
        placeholder={t('lifeCycle.deleteAfterSleep.placeholder')}
        end={
          <InputEnd>
            <T id="lifeCycle.deleteAfterSleep.unit" />
          </InputEnd>
        }
        className="max-w-xs"
      />
    </BaseServiceFormSection>
  );
}

function Summary() {
  const intl = useIntl();
  const lifeCycle = useWatch<FormType, 'lifeCycle'>({ name: 'lifeCycle' });

  if (lifeCycle.deleteAfterCreate === null && lifeCycle.deleteAfterSleep === null) {
    return <T id="lifeCycle.summary.default" />;
  }

  const deleteAfter = lifeCycle.deleteAfterCreate !== null && (
    <T
      key="deleteAfter"
      id="lifeCycle.summary.deleteAfter"
      values={{ deleteAfter: formatSecondsDuration(lifeCycle.deleteAfterCreate) }}
    />
  );

  const deleteAfterSleep = lifeCycle.deleteAfterSleep !== null && (
    <T
      key="deleteAfterSleep"
      id="lifeCycle.summary.deleteAfterSleep"
      values={{ deleteAfterSleep: formatSecondsDuration(lifeCycle.deleteAfterSleep) }}
    />
  );

  return (
    <T
      id="lifeCycle.summary.custom"
      values={{ details: intl.formatList([deleteAfter, deleteAfterSleep].filter(Boolean), { type: 'unit' }) }}
    />
  );
}
