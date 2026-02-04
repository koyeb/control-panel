import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { addSeconds, differenceInSeconds } from 'date-fns';
import { useForm } from 'react-hook-form';

import { API, apiMutation, mapService, useInvalidateApiQuery, useOrganizationQuotas } from 'src/api';
import { handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useNow } from 'src/hooks/timers';
import { Translate } from 'src/intl/translate';
import { Service } from 'src/model';
import { TimeUnit } from 'src/utils/date';

import { DeleteAfterCreate } from './delete-after-create';
import { DeleteAfterSleep } from './delete-after-sleep';
import { FooterInfo } from './footer-info';
import { serviceLifecycleSchema } from './service-lifecycle-schema';

export type ServiceLifecycleFormType = {
  deleteAfterCreate: {
    enabled: boolean;
    value: number;
    unit: TimeUnit;
  };
  deleteAfterSleep: {
    enabled: boolean;
    value: number;
    unit: TimeUnit;
  };
};

export function ServiceLifecycleForm({ service }: { service: Service }) {
  const quotas = useOrganizationQuotas();
  const now = useNow();

  const form = useForm<ServiceLifecycleFormType>({
    mode: 'onChange',
    defaultValues: defaultValues(service),
    resolver: zodResolver(serviceLifecycleSchema(now, service, quotas)),
  });

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...apiMutation('patch /v1/services/{id}', (values: ServiceLifecycleFormType) => ({
      path: { id: service.id },
      body: {
        life_cycle: getLifecycleValue(service, now, values),
      },
    })),
    async onSuccess({ service }) {
      await invalidate('get /v1/services/{id}', { path: { id: service!.id! } });
      form.reset(defaultValues(mapService(service!)));
    },
    onError: useFormErrorHandler(form, (error) => ({
      'deleteAfterCreate.value': error['life_cycle.delete_after_create'],
      'deleteAfterSleep.value': error['life_cycle.delete_after_sleep'],
    })),
  });

  return (
    <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col gap-4">
      <DeleteAfterCreate form={form} />
      {service.type !== 'worker' && <DeleteAfterSleep form={form} />}

      <div className="row items-center gap-4">
        <Button type="submit" disabled={!form.formState.isDirty} loading={form.formState.isSubmitting}>
          <Translate id="common.save" />
        </Button>

        <FooterInfo service={service} />
      </div>
    </form>
  );
}

function defaultValues(service: Service): ServiceLifecycleFormType {
  return {
    deleteAfterCreate: {
      enabled: service.lifeCycle.deleteAfterCreate !== undefined,
      value: NaN,
      unit: 'seconds',
    },
    deleteAfterSleep: {
      enabled: service.lifeCycle.deleteAfterSleep !== undefined,
      value: NaN,
      unit: 'seconds',
    },
  };
}

function getLifecycleValue(
  service: Service,
  now: Date,
  values: ServiceLifecycleFormType,
): API.Service['life_cycle'] {
  const toAbsolute = (seconds: number) => {
    return differenceInSeconds(addSeconds(now, seconds), service.createdAt);
  };

  const deleteAfterCreate = () => {
    const { enabled, value, unit } = values.deleteAfterCreate;

    if (!enabled) {
      return 0;
    }

    if (Number.isNaN(value)) {
      return undefined;
    }

    return toAbsolute(getSeconds(value, unit));
  };

  const deleteAfterSleep = () => {
    const { enabled, value, unit } = values.deleteAfterSleep;

    if (!enabled) {
      return 0;
    }

    if (Number.isNaN(value)) {
      return undefined;
    }

    return getSeconds(value, unit);
  };

  return {
    delete_after_create: deleteAfterCreate(),
    delete_after_sleep: deleteAfterSleep(),
  };
}

function getSeconds(value: number, unit: TimeUnit): number {
  const factor = {
    seconds: 1,
    minutes: 60,
    hours: 60 * 60,
    days: 60 * 60 * 24,
  }[unit];

  return value * factor;
}
