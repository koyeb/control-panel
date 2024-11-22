import { useFormContext, useFormState } from 'react-hook-form';

import { InputEnd, Slider, Tooltip } from '@koyeb/design-system';
import { onKeyDownPositiveInteger } from 'src/application/restrict-keys';
import { ControlledInput, ControlledSelectBox } from 'src/components/controlled';
import {
  IconAlarmClockCheck,
  IconClock,
  IconCpu,
  IconListMinus,
  IconPanelsLeftBottom,
  IconTimer,
} from 'src/components/icons';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { Translate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';

import { defaultServiceForm } from '../../helpers/initialize-service-form';
import { Scaling, ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

const T = Translate.prefix('serviceForm.scaling.autoscalingSettings');

const targets: Array<keyof Scaling['targets']> = [
  'cpu',
  'memory',
  'requests',
  'concurrentRequests',
  'responseTime',
];

export function AutoScalingConfiguration() {
  const { setValue, trigger, resetField } = useFormContext<ServiceForm>();

  const hasVolumes = useWatchServiceForm('volumes').filter((volume) => volume.name !== '').length > 0;
  const instance = useWatchServiceForm('instance');
  const scaling = useWatchServiceForm('scaling');

  const canChangeScaling = instance !== 'free' && !hasVolumes;

  const scaleToZero = useFeatureFlag('scale-to-zero');
  const scaleToZeroIdleDelay = useFeatureFlag('scale-to-zero-idle-delay');

  return (
    <>
      <div className="hidden sm:block">
        <Slider
          disabled={!canChangeScaling}
          label={<Translate id="serviceForm.scaling.scalingLabel" />}
          min={scaleToZero ? 0 : 1}
          max={20}
          step={1}
          value={[scaling.min, scaling.max]}
          onChange={([min, max]) => {
            setValue('scaling.min', min);
            setValue('scaling.max', max);

            if (min === 0 && max === 1) {
              for (const target of targets) {
                setValue(`scaling.targets.${target}.enabled`, false);
              }

              void trigger('scaling');
            } else if (scaling.max === 1 && max > 1) {
              resetField('scaling.targets', {
                defaultValue: defaultServiceForm().scaling.targets,
              });
            }
          }}
          marks
        />
      </div>

      <div className="col gap-4 sm:hidden">
        <RangeInputMobile />
      </div>

      {scaleToZeroIdleDelay && scaling.min === 0 && (
        <ScalingTarget target="sleepIdleDelay" Icon={IconClock} min={1} max={1e9} />
      )}

      <ScalingTarget target="requests" Icon={IconTimer} min={1} max={1e9} />
      <ScalingTarget target="cpu" Icon={IconCpu} min={1} max={100} />
      <ScalingTarget target="memory" Icon={IconPanelsLeftBottom} min={1} max={100} />
      <ScalingTarget target="concurrentRequests" Icon={IconListMinus} min={1} max={1e9} />
      <ScalingTarget target="responseTime" Icon={IconAlarmClockCheck} min={1} max={1e9} />
    </>
  );
}

function RangeInputMobile() {
  const instance = useWatchServiceForm('instance');
  const canChangeScaling = instance !== 'free';

  const scaleToZero = useFeatureFlag('scale-to-zero');

  return (
    <>
      <span className="col-span-2 font-semibold">
        <Translate id="serviceForm.scaling.scalingLabel" />
      </span>

      <div className="row gap-4">
        <ControlledInput<ServiceForm, 'scaling.min'>
          name="scaling.min"
          type="number"
          className="max-w-20"
          label={<T id="min" />}
          disabled={!canChangeScaling}
          onKeyDown={onKeyDownPositiveInteger}
          min={scaleToZero ? 0 : 1}
          max={20}
          step={1}
        />

        <ControlledInput<ServiceForm, 'scaling.max'>
          name="scaling.max"
          type="number"
          className="max-w-20"
          label={<T id="max" />}
          disabled={!canChangeScaling}
          onKeyDown={onKeyDownPositiveInteger}
          min={scaleToZero ? 0 : 1}
          max={20}
          step={1}
        />
      </div>
    </>
  );
}

type ScalingTargetProps = {
  target: keyof Scaling['targets'];
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
          <ControlledSelectBox<ServiceForm, `scaling.targets.${keyof Scaling['targets']}.enabled`>
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
            <div className="col sm:row flex-1 gap-4 p-3 sm:items-center">
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

  if (target === 'sleepIdleDelay' && min === 0) {
    return undefined;
  }

  if (min === 0 && max === 1) {
    return <T id="criteriaNotAvailableWhenMax1" />;
  }

  if (isWebTarget(target) && serviceType === 'worker') {
    return <T id="criterionNotAvailableWorker" />;
  }
}

function isWebTarget(target: keyof Scaling['targets']) {
  return inArray(target, ['requests', 'concurrentRequests', 'responseTime']);
}

type TargetDescriptionProps = {
  target: keyof Scaling['targets'];
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
