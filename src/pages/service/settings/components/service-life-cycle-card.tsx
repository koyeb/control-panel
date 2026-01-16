import { zodResolver } from '@hookform/resolvers/zod';
import { Badge, Button, Input, InputEnd } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { addSeconds, differenceInSeconds } from 'date-fns';
import { UseFormReturn, useController, useForm } from 'react-hook-form';
import { FormattedDate } from 'react-intl';
import z from 'zod';

import { apiMutation, mapService, useComputeDeployment, useOrganizationQuotas } from 'src/api';
import { notify } from 'src/application/notify';
import { onKeyDownPositiveInteger } from 'src/application/restrict-keys';
import { scaleToZeroValues } from 'src/application/service-functions';
import { Checkbox } from 'src/components/forms';
import { handleSubmit, useFormErrorHandler, useFormHasDefaultValues } from 'src/hooks/form';
import { useNow } from 'src/hooks/timers';
import { IconTriangleAlert } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { ComputeDeployment, OrganizationQuotas, Service } from 'src/model';
import { formatDateInTimeZones } from 'src/utils/date';

const T = createTranslate('pages.service.settings.lifeCycle');
const Translate = createTranslate('common');

function schema(service: Service, now: Date, { lifeCycle }: OrganizationQuotas) {
  const deleteAfterCreateMin = toRelative(service, now, lifeCycle?.deleteAfterCreateMin) ?? 0;
  const deleteAfterCreateMax = toRelative(service, now, lifeCycle?.deleteAfterCreateMax) ?? Infinity;

  const deleteAfterSleepMin = lifeCycle?.deleteAfterSleepMin ?? 0;
  const deleteAfterSleepMax = lifeCycle?.deleteAfterSleepMax ?? Infinity;

  return z.object({
    deleteAfterCreate: z
      .union([z.nan(), z.number().min(deleteAfterCreateMin).max(deleteAfterCreateMax)])
      .nullable(),
    deleteAfterSleep: z
      .union([z.nan(), z.number().min(deleteAfterSleepMin).max(deleteAfterSleepMax)])
      .nullable(),
  });
}

type FormType = z.infer<ReturnType<typeof schema>>;

type ServiceLifeCycleCardProps = {
  service: Service;
};

export function ServiceLifeCycleCard({ service }: ServiceLifeCycleCardProps) {
  const t = T.useTranslate();

  const deployment = useComputeDeployment(service.latestDeploymentId);
  const quotas = useOrganizationQuotas();
  const now = useNow();

  const form = useForm<FormType>({
    defaultValues: defaultValues(service, now),
    mode: 'onChange',
    resolver: zodResolver(schema(service, now, quotas)),
  });

  const canSubmit = !useFormHasDefaultValues(form) && form.formState.isValid;

  const mutation = useMutation({
    ...apiMutation('patch /v1/services/{id}', (values: FormType) => ({
      path: { id: service.id },
      body: {
        definition: deployment?.definitionApi,
        life_cycle: {
          delete_after_create: toAbsolute(service, now, values.deleteAfterCreate ?? undefined) || undefined,
          delete_after_sleep: values.deleteAfterSleep || undefined,
        },
      },
    })),
    onError: useFormErrorHandler(form, (error) => ({
      deleteAfterSleep: error['life_cycle.delete_after_sleep'],
      deleteAfterCreate: error['life_cycle.delete_after_create'],
    })),
    onSuccess: ({ service }) => {
      form.reset(defaultValues(mapService(service!), now));
      notify.success(t('saved'));
    },
  });

  const deleteAfterCreate = form.watch('deleteAfterCreate');
  const deleteAfterSleep = form.watch('deleteAfterSleep');

  const { idlePeriod, lightToDeepPeriod } = scaleToZeroValues(deployment);

  const deletionBeforeScaleToZero =
    idlePeriod !== undefined && deleteAfterCreate !== null && deleteAfterCreate < idlePeriod;

  const deletionBeforeDeepSleep =
    lightToDeepPeriod !== undefined && deleteAfterSleep !== null && deleteAfterSleep < lightToDeepPeriod;

  return (
    <section className="col-start-1 card">
      <div className="col gap-4 p-3">
        <div className="col gap-2">
          <strong>
            <T id="title" />
          </strong>

          <p className="text-dim">
            <T id="description" />
          </p>
        </div>

        <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col gap-4">
          <div className="col gap-3">
            <DeleteAfterCreate form={form} warning={deletionBeforeScaleToZero} />
            <DeleteAfterSleep form={form} deployment={deployment} warning={deletionBeforeDeepSleep} />
          </div>

          <div className="row items-center gap-4">
            <Button type="submit" disabled={!canSubmit} loading={mutation.isPending}>
              <Translate id="save" />
            </Button>
          </div>
        </form>
      </div>

      <Footer
        deletionBeforeScaleToZero={deletionBeforeScaleToZero}
        deletionBeforeDeepSleep={deletionBeforeDeepSleep}
      />
    </section>
  );
}

function defaultValues(service: Service, now: Date): FormType {
  return {
    deleteAfterCreate: toRelative(service, now, service.lifeCycle?.deleteAfterCreate) ?? null,
    deleteAfterSleep: service.lifeCycle?.deleteAfterSleep || null,
  };
}

function toRelative(service: Service, now: Date, value: number | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const target = addSeconds(service.createdAt, value);
  const seconds = differenceInSeconds(target, now);

  if (seconds < 0) {
    return 0;
  }

  return seconds;
}

function toAbsolute(service: Service, now: Date, value: number | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const target = addSeconds(now, value);
  const seconds = differenceInSeconds(target, service.createdAt);

  return seconds + 1;
}

type DeleteAfterCreateProps = {
  form: UseFormReturn<FormType>;
  warning: boolean;
};

function DeleteAfterCreate({ form, warning }: DeleteAfterCreateProps) {
  const t = T.useTranslate();
  const now = useNow();

  const { field, fieldState } = useController({ control: form.control, name: 'deleteAfterCreate' });
  const deletionDate = formatDateInTimeZones(addSeconds(now, field.value ?? 0));

  return (
    <div className="row items-center gap-2">
      <label className="row items-center gap-2 whitespace-nowrap not-has-disabled:cursor-pointer">
        <Checkbox
          checked={field.value !== null}
          onChange={(event) => field.onChange(event.target.checked ? NaN : null)}
        />
        <T id="deleteAfterCreate.label" />
      </label>

      <Input
        ref={field.ref}
        value={Number.isNaN(field.value) ? '' : (field.value ?? '')}
        onChange={(event) => field.onChange(event.target.valueAsNumber)}
        disabled={field.value === null}
        type="number"
        onKeyDown={onKeyDownPositiveInteger}
        placeholder={t('deleteAfterCreate.placeholder')}
        invalid={fieldState.invalid}
        end={
          <InputEnd>
            <T id="deleteAfterCreate.unit" />
          </InputEnd>
        }
        root={{ className: clsx('max-w-24', { 'border-orange outline-orange': warning }) }}
      />

      {fieldState.error && <div className="text-red">{fieldState.error.message}</div>}

      {!fieldState.error && Number.isFinite(field.value) && (
        <span className="text-dim">
          <T
            id="deleteAfterCreate.info"
            values={{
              badge: (children) => <Badge size={1}>{children}</Badge>,
              offset: deletionDate.utcOffset,
              date: <FormattedDate value={deletionDate.local()} dateStyle="medium" />,
              time: <FormattedDate value={deletionDate.local()} timeStyle="medium" />,
            }}
          />
        </span>
      )}
    </div>
  );
}

type DeleteAfterSleepProps = {
  form: UseFormReturn<FormType>;
  deployment?: ComputeDeployment;
  warning: boolean;
};

function DeleteAfterSleep({ form, deployment, warning }: DeleteAfterSleepProps) {
  const t = T.useTranslate();
  const hasScaleToZero = deployment?.definition.scaling.min === 0;

  const { field, fieldState } = useController({ control: form.control, name: 'deleteAfterSleep' });

  if (deployment?.definition.type === 'worker') {
    return null;
  }

  return (
    <div className="row items-center gap-2">
      <label className="row items-center gap-2 whitespace-nowrap not-has-disabled:cursor-pointer">
        <Checkbox
          checked={field.value !== null}
          onChange={(event) => form.setValue('deleteAfterSleep', event.target.checked ? NaN : null)}
          disabled={!field.value && !hasScaleToZero}
        />
        <T id="deleteAfterSleep.label" />
      </label>

      <Input
        ref={field.ref}
        value={Number.isNaN(field.value) ? '' : (field.value ?? '')}
        onChange={(event) => field.onChange(event.target.valueAsNumber)}
        disabled={field.value === null}
        onKeyDown={onKeyDownPositiveInteger}
        type="number"
        placeholder={t('deleteAfterSleep.placeholder')}
        invalid={fieldState.invalid}
        end={
          <InputEnd>
            <T id="deleteAfterSleep.unit" />
          </InputEnd>
        }
        root={{ className: clsx('max-w-24', { 'border-orange outline-orange': warning }) }}
      />

      <span>
        <T id="deleteAfterSleep.info" />
      </span>

      {fieldState.error && <div className="text-red">{fieldState.error.message}</div>}
    </div>
  );
}

type FooterProps = {
  deletionBeforeScaleToZero: boolean;
  deletionBeforeDeepSleep: boolean;
};

function Footer({ deletionBeforeScaleToZero, deletionBeforeDeepSleep }: FooterProps) {
  if (!deletionBeforeScaleToZero && !deletionBeforeDeepSleep) {
    return null;
  }

  return (
    <footer className="col! items-start! justify-start! gap-2 text-xs text-dim">
      {deletionBeforeScaleToZero && (
        <div className="row gap-2">
          <IconTriangleAlert className="size-4 text-orange" />
          <T id="deletionBeforeScaleToZero" />
        </div>
      )}

      {deletionBeforeDeepSleep && (
        <div className="row gap-2">
          <IconTriangleAlert className="size-4 text-orange" />
          <T id="deletionBeforeDeepSleep" />
        </div>
      )}
    </footer>
  );
}
