import { useEffect } from 'react';
import { UseFormReturn, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { DatabaseDeployment } from 'src/api/model';
import { useZodResolver } from 'src/hooks/validation';
import { hasProperty } from 'src/utils/object';

import { databaseInstances } from './database-instance-types';
import { DatabaseServiceForm, DatabaseServiceFormSection } from './database-service-form.types';

const schema = z.object({
  meta: z.object({
    appId: z.string().nullable(),
    databaseServiceId: z.string().nullable(),
    expandedSection: z.string().nullable(),
    allowFreeInstanceIfAlreadyUsed: z.boolean(),
  }),
  engine: z.object({ version: z.number() }),
  region: z.string(),
  instance: z.string(),
  defaultRole: z.string().min(1).max(63),
  serviceName: z.string().min(1).max(64),
});

type UseDatabaseServiceFormProps = {
  appId?: string;
  deployment?: DatabaseDeployment;
  onCostChanged: (cost: number) => void;
};

export function useDatabaseServiceForm({ appId, deployment, onCostChanged }: UseDatabaseServiceFormProps) {
  const form = useForm<DatabaseServiceForm>({
    defaultValues: getDefaultValues(appId, deployment),
    resolver: useZodResolver(schema),
  });

  useExpandFirstSectionInError(form);
  useWatchEstimatedCost(form, onCostChanged);

  return form;
}

function getDefaultValues(appId?: string, deployment?: DatabaseDeployment): DatabaseServiceForm {
  return {
    meta: {
      appId: appId ?? null,
      databaseServiceId: deployment?.serviceId ?? null,
      expandedSection: null,
      allowFreeInstanceIfAlreadyUsed: deployment?.instance === 'free',
    },
    engine: {
      version: 17,
    },
    instance: deployment?.instance ?? 'small',
    region: deployment?.region ?? 'fra',
    defaultRole: 'koyeb-adm',
    serviceName: deployment?.name ?? 'database',
  };
}

function useExpandFirstSectionInError(form: UseFormReturn<DatabaseServiceForm>) {
  useEffect(() => {
    const errors = form.formState.errors;
    const expandedSection = form.getValues('meta.expandedSection');

    const sections = ['engine', 'region', 'instance', 'defaultRole', 'serviceName'] as const;
    const sectionsInError = sections.filter((section) => errors[section] !== undefined);

    const firstSectionInError = sectionsInError[0];

    if (firstSectionInError === undefined) {
      return;
    }

    if (!sectionsInError.includes(expandedSection as DatabaseServiceFormSection)) {
      form.setValue('meta.expandedSection', firstSectionInError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.formState.submitCount]);
}

function useWatchEstimatedCost(form: UseFormReturn<DatabaseServiceForm>, onChange: (cost: number) => void) {
  const catalogInstanceId = useWatch<DatabaseServiceForm, 'instance'>({
    control: form.control,
    name: 'instance',
  });

  useEffect(() => {
    const instance = databaseInstances.find(hasProperty('id', catalogInstanceId));

    if (instance) {
      onChange(instance.priceMonthly * 100);
    }
  }, [catalogInstanceId, onChange]);
}
