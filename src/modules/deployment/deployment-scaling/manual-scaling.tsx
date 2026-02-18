import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { useController, useForm } from 'react-hook-form';

import { apiMutation, useInvalidateApiQuery, useService, useServiceScaling } from 'src/api';
import { notify } from 'src/application/notify';
import { SvgComponent } from 'src/application/types';
import { Input } from 'src/components/forms';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { IconMinus, IconPlus } from 'src/icons';
import { Translate, createTranslate } from 'src/intl/translate';
import { ComputeDeployment, ServiceStatus } from 'src/model';
import { inArray } from 'src/utils/arrays';

const T = createTranslate('modules.deployment.deploymentLogs.scaling.manualScaling');

type ManualScalingProps = {
  deployment: ComputeDeployment;
  defaultValue?: number;
  onChanged: () => void;
};

export function ManualScaling({ deployment, defaultValue, onChanged }: ManualScalingProps) {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();
  const { serviceId } = deployment;

  const setScalingMutation = useMutation({
    ...apiMutation('put /v1/services/{id}/scale', ({ instances }: FormValues<typeof form>) => ({
      path: { id: serviceId },
      body: { scalings: [{ instances }] },
    })),
    async onSuccess(_, { instances }) {
      await invalidate('get /v1/services/{id}/scale', { path: { id: serviceId } });
      form.resetField('instances', { defaultValue: instances });
      notify.success(<SavedNotification deployment={deployment} instances={instances} />);
      onChanged();
    },
  });

  const deleteScalingMutation = useMutation({
    ...apiMutation('delete /v1/services/{id}/scale', { path: { id: serviceId } }),
    async onSuccess() {
      await invalidate('get /v1/services/{id}/scale', { path: { id: serviceId } });
      form.resetField('instances', { defaultValue: 1 });
      notify.success(t('deleted'));
      onChanged();
    },
  });

  const form = useForm({
    defaultValues: { instances: defaultValue ?? 1 },
  });

  const { field } = useController({
    control: form.control,
    name: 'instances',
  });

  const onChange = (updater: (value: number) => number) => {
    field.onChange(Number.isNaN(field.value) ? 1 : updater(field.value));
  };

  const onCancel = () => {
    form.reset();
    onChanged();
  };

  const showButtons = form.formState.isDirty || defaultValue === undefined;

  return (
    <form
      onSubmit={handleSubmit(form, setScalingMutation.mutateAsync)}
      className="my-2 col justify-between gap-4 rounded-md bg-muted p-3 md:row"
    >
      <div className="col items-center gap-2 md:row">
        <label htmlFor={field.name}>
          <T id="label" />
        </label>

        <Input
          {...field}
          type="number"
          min={1}
          max={20}
          onChange={(event) => field.onChange(event.target.valueAsNumber)}
          className="md:max-w-fit"
          inputClassName="md:max-w-10 max-md:h-12 text-center px-0!"
          start={
            <InputButton
              Icon={IconMinus}
              disabled={field.value <= 1}
              onClick={() => onChange((value) => value - 1)}
              className="border-e"
            />
          }
          end={
            <InputButton
              Icon={IconPlus}
              type="button"
              disabled={field.value >= 20}
              onClick={() => onChange((value) => value + 1)}
              className="border-s"
            />
          }
        />

        <CurrentValueInfo serviceId={serviceId} value={field.value} />
      </div>

      {showButtons && (
        <div className="row items-center gap-2">
          <Button
            type="reset"
            color="gray"
            onClick={onCancel}
            className={clsx('flex-1', { invisible: !form.formState.isDirty })}
          >
            <Translate id="common.cancel" />
          </Button>
          <Button
            type="submit"
            disabled={!form.formState.isDirty}
            loading={form.formState.isSubmitting}
            className="flex-1"
          >
            <Translate id="common.apply" />
          </Button>
        </div>
      )}

      {!showButtons && (
        <Button
          variant="ghost"
          loading={deleteScalingMutation.isPending}
          onClick={() => deleteScalingMutation.mutate()}
        >
          <T id="delete" />
        </Button>
      )}
    </form>
  );
}

type InputButtonProps = React.ComponentProps<'button'> & {
  Icon: SvgComponent;
};

function InputButton({ Icon, className, ...props }: InputButtonProps) {
  return (
    <button type="button" className={clsx('px-4 disabled:text-dim md:px-2', className)} {...props}>
      <Icon className="size-4" />
    </button>
  );
}

function CurrentValueInfo({ serviceId, value }: { serviceId: string; value: number }) {
  const currentScaling = useServiceScaling(serviceId);
  const count = value - (currentScaling?.instances ?? 1);

  return (
    <div className={clsx('text-dim', { hidden: Number.isNaN(value) || count === 0 })}>
      <T id={count > 0 ? 'adding' : 'removing'} values={{ count: Math.abs(count) }} />
    </div>
  );
}

function SavedNotification({ deployment, instances }: { deployment: ComputeDeployment; instances: number }) {
  const service = useService(deployment.serviceId);

  const description = () => {
    if (deployment.status === 'SLEEPING') {
      return <T id="saved.description.wakeUp" />;
    }

    if (inArray<ServiceStatus>(service?.status, ['HEALTHY', 'DEGRADED', 'UNHEALTHY', 'STARTING'])) {
      return <T id="saved.description.immediate" />;
    }

    return <T id="saved.description.nextDeployment" />;
  };

  return (
    <>
      <strong className="mb-0.5">
        <T id="saved.title" values={{ instances }} />
      </strong>

      <div className="text-xs">{description()}</div>
    </>
  );
}
