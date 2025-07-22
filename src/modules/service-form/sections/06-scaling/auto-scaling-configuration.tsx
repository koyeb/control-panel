import { InputEnd, Slider, Tooltip } from '@koyeb/design-system';
import { useController, useFormContext, useFormState } from 'react-hook-form';

import { useInstance } from 'src/api/hooks/catalog';
import { useOrganization } from 'src/api/hooks/session';
import { onKeyDownPositiveInteger } from 'src/application/restrict-keys';
import { ControlledInput, ControlledSelectBox } from 'src/components/controlled';
import { ExternalLink } from 'src/components/link';
import { FeatureFlag, useFeatureFlag } from 'src/hooks/feature-flag';
import {
  IconAlarmClockCheck,
  IconClock,
  IconCpu,
  IconListMinus,
  IconMoon,
  IconPanelsLeftBottom,
  IconTimer,
} from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';

import { Scaling, ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { handleScalingValueBlurred } from './handle-scaling-value-blurred';

const T = createTranslate('modules.serviceForm.scaling.autoscalingSettings');

export function AutoScalingConfiguration() {
  const organization = useOrganization();
  const { watch } = useFormContext<ServiceForm>();

  if (watch('instance') === 'free') {
    return <ScalingValues />;
  }

  const showSleepIdleDelay =
    ['startup', 'pro', 'scale', 'enterprise', 'internal'].includes(organization.plan) &&
    watch('scaling.min') === 0;

  return (
    <>
      <div className="col gap-6">
        <p>
          <T id="description" />
        </p>

        <ScalingValues />
        <ScaleToZeroPreview />

        {showSleepIdleDelay && <SleepIdleDelay />}

        <p>
          <T id="enableAutoscaling" />
        </p>
      </div>

      <ScalingTarget target="requests" Icon={IconTimer} min={1} max={1e9} />
      <ScalingTarget target="cpu" Icon={IconCpu} min={1} max={100} />
      <ScalingTarget target="memory" Icon={IconPanelsLeftBottom} min={1} max={100} />
      <ScalingTarget target="concurrentRequests" Icon={IconListMinus} min={1} max={1e9} />
      <ScalingTarget target="responseTime" Icon={IconAlarmClockCheck} min={1} max={1e9} />
    </>
  );
}

function ScalingValues() {
  const form = useFormContext<ServiceForm>();

  const min = useMinScaling();
  const max = useMaxScaling();

  const instance = useInstance(form.watch('instance'));
  const canChangeScaling = instance?.id !== 'free';

  const { field: minField } = useController<ServiceForm, 'scaling.min'>({ name: 'scaling.min' });
  const { field: maxField } = useController<ServiceForm, 'scaling.max'>({ name: 'scaling.max' });

  const setScalingValue = (field: 'min' | 'max') => {
    return (value: number) => form.setValue(`scaling.${field}`, value, { shouldValidate: true });
  };

  return (
    <div className="row gap-8">
      <ControlledInput<ServiceForm, 'scaling.min'>
        name="scaling.min"
        type="number"
        label={<T id="min" />}
        disabled={!canChangeScaling}
        onKeyDown={onKeyDownPositiveInteger}
        min={min}
        max={max}
        step={1}
        onBlur={(event) => handleScalingValueBlurred(event, setScalingValue('min'))}
        className="w-24"
      />

      <Slider
        min={min}
        max={max}
        tickSize={2}
        disabled={instance?.id === 'free'}
        renderTick={(value) => <Tick value={value} />}
        value={[minField.value, maxField.value]}
        onChange={([min, max]) => {
          if (max === 0) {
            return;
          }

          if (min !== minField.value) {
            minField.onChange(min);
          }

          if (max !== maxField.value) {
            maxField.onChange(max);
          }
        }}
        className="mt-10 !hidden w-full max-w-md md:!flex"
      />

      <ControlledInput<ServiceForm, 'scaling.max'>
        name="scaling.max"
        type="number"
        label={<T id="max" />}
        disabled={!canChangeScaling}
        onKeyDown={onKeyDownPositiveInteger}
        min={Math.max(min, 1)}
        max={max}
        step={1}
        onBlur={(event) => handleScalingValueBlurred(event, setScalingValue('max'))}
        className="w-24"
      />
    </div>
  );
}

function useMinScaling() {
  const { watch } = useFormContext<ServiceForm>();

  const instance = useInstance(watch('instance'));
  const scaleToZero = useFeatureFlag('scale-to-zero');
  const hasPublicPort = watch('ports').some((port) => port.public);

  if (instance?.id === 'free') {
    return 0;
  }

  if (scaleToZero && watch('serviceType') === 'web' && hasPublicPort) {
    return 0;
  }

  return 1;
}

function useMaxScaling() {
  const { watch } = useFormContext<ServiceForm>();
  const hasVolumes = watch('volumes').filter((volume) => volume.name !== '').length > 0;

  if (hasVolumes) {
    return 1;
  }

  return 20;
}

function Tick({ value }: { value: number }) {
  if (value === 0) {
    return <IconMoon className="mt-0.5 size-4" />;
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mt-1 size-3">
      <line x1="12" y1="0" x2="12" y2="24" />
    </svg>
  );
}

function ScaleToZeroPreview() {
  const min = useWatchServiceForm('scaling.min');

  if (min > 0) {
    return null;
  }

  return (
    <p className="rounded-md border p-4">
      <T
        id="scaleToZeroPreview"
        values={{
          announcement: (children) => (
            <ExternalLink
              openInNewTab
              href="https://koyeb.com/blog/scale-to-zero-optimize-gpu-and-cpu-workloads"
              className="underline"
            >
              {children}
            </ExternalLink>
          ),
          feedback: (children) => (
            <ExternalLink openInNewTab href="https://community.koyeb.com" className="underline">
              {children}
            </ExternalLink>
          ),
        }}
      />
    </p>
  );
}

function SleepIdleDelay() {
  const { errors } = useFormState<ServiceForm>();
  const error =
    errors.scaling?.targets?.sleepIdleDelay?.deepSleepValue?.message ??
    errors.scaling?.targets?.sleepIdleDelay?.lightSleepValue?.message;

  return (
    <div className="relative row rounded-lg border">
      <div className="col flex-1 gap-4 p-3 sm:row sm:items-center">
        <div className="col flex-1 gap-1">
          <div className="row items-center gap-1 font-semibold">
            <IconClock className="icon" />
            <T id={`sleepIdleDelayLabel`} />
          </div>

          <div className="text-xs text-dim">
            {error ? <span className="text-red">{error}</span> : <T id="sleepIdleDelayDescription" />}
          </div>
        </div>

        <FeatureFlag feature="light-sleep">
          <ControlledInput
            name="scaling.targets.sleepIdleDelay.lightSleepValue"
            error={false}
            type="number"
            onKeyDown={onKeyDownPositiveInteger}
            label={<T id="lightSleepLabel" />}
            end={
              <InputEnd>
                <T id="sleepIdleDelayUnit" />
              </InputEnd>
            }
            className="max-w-24 self-center"
            min={60}
            max={60 * 60}
            step={1}
          />
        </FeatureFlag>

        <ControlledInput
          name="scaling.targets.sleepIdleDelay.deepSleepValue"
          error={false}
          type="number"
          label={
            <FeatureFlag feature="light-sleep">
              <T id="deepSleepLabel" />
            </FeatureFlag>
          }
          onKeyDown={onKeyDownPositiveInteger}
          end={
            <InputEnd>
              <T id="sleepIdleDelayUnit" />
            </InputEnd>
          }
          className="max-w-24 self-center"
          min={5 * 60}
          max={7 * 24 * 60 * 60}
          step={1}
        />
      </div>
    </div>
  );
}

type ScalingTargetProps = {
  target: Exclude<keyof Scaling['targets'], 'sleepIdleDelay'>;
  Icon: React.ComponentType<{ className?: string }>;
  min?: number;
  max?: number;
};

function ScalingTarget({ target: targetName, Icon, min, max }: ScalingTargetProps) {
  const { resetField, trigger } = useFormContext<ServiceForm>();
  const target = useWatchServiceForm(`scaling.targets.${targetName}`);
  const disabledReason = useTargetDisabledReason(targetName);

  return (
    <Tooltip content={disabledReason}>
      {(props) => (
        <div {...props}>
          <ControlledSelectBox<ServiceForm, `scaling.targets.${typeof targetName}.enabled`>
            name={`scaling.targets.${targetName}.enabled`}
            type="checkbox"
            title={null}
            description={null}
            disabled={disabledReason !== undefined}
            onChangeEffect={(event) => {
              if (!event.target.checked) {
                resetField(`scaling.targets.${targetName}.value`);
                void trigger(`scaling.targets.${targetName}.value`);
              }
            }}
          >
            <div className="col flex-1 gap-4 p-3 sm:row sm:items-center">
              <div className="col flex-1 gap-1">
                <div className="row items-center gap-1 font-semibold">
                  <Icon className="icon" />
                  <T id={`${targetName}Label`} />
                </div>

                <div className="text-xs text-dim">
                  <TargetDescription target={targetName} />
                </div>
              </div>

              <ControlledInput
                name={`scaling.targets.${targetName}.value`}
                error={false}
                type="number"
                disabled={!target.enabled}
                onKeyDown={onKeyDownPositiveInteger}
                end={
                  <InputEnd>
                    <T id={`${targetName}Unit`} />
                  </InputEnd>
                }
                className="max-w-24 self-center"
                min={min}
                max={max}
                step={1}
              />
            </div>
          </ControlledSelectBox>
        </div>
      )}
    </Tooltip>
  );
}

function useTargetDisabledReason(target: keyof Scaling['targets']): React.ReactNode | undefined {
  const serviceType = useWatchServiceForm('serviceType');
  const min = useWatchServiceForm('scaling.min');
  const max = useWatchServiceForm('scaling.max');

  if (min === 0 && max === 1) {
    return <T id="criteriaNotAvailableWhenMax1" />;
  }

  if (min === max) {
    return <T id="criteriaNotAvailableWithFixedScaling" />;
  }

  if (isWebTarget(target) && serviceType === 'worker') {
    return <T id="criterionNotAvailableWorker" />;
  }
}

function isWebTarget(target: keyof Scaling['targets']) {
  return inArray(target, ['requests', 'concurrentRequests', 'responseTime']);
}

type TargetDescriptionProps = {
  target: Exclude<keyof Scaling['targets'], 'sleepIdleDelay'>;
};

function TargetDescription({ target }: TargetDescriptionProps) {
  const { errors } = useFormState<ServiceForm>();
  const error = errors.scaling?.targets?.[target]?.value?.message;
  let value = useWatchServiceForm(`scaling.targets.${target}.value`);

  if (target === 'cpu' || target === 'memory') {
    value /= 100;
  }

  if (error) {
    return <span className="text-red">{error}</span>;
  }

  return <T id={`${target}Description`} values={{ value }} />;
}
