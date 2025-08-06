import { Slider } from '@koyeb/design-system';
import { useFormContext } from 'react-hook-form';

import { ControlledInput } from 'src/components/controlled';
import { IconMoon } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

import { ServiceForm } from '../../service-form.types';

const T = createTranslate('modules.serviceForm.scaling');

type ScalingValuesProps = {
  disabled: boolean;
  type: 'fixed' | 'autoscaling';
  onChanged: (min: number, max: number) => void;
};

export function ScalingValues({ disabled, type, onChanged }: ScalingValuesProps) {
  return (
    <div className="row gap-6">
      {type === 'fixed' && <FixedScaling disabled={disabled} onChanged={onChanged} />}
      {type === 'autoscaling' && <AutoScaling disabled={disabled} onChanged={onChanged} />}
    </div>
  );
}

type FixedScalingProps = {
  disabled: boolean;
  onChanged: ScalingValuesProps['onChanged'];
};

function FixedScaling({ disabled, onChanged }: FixedScalingProps) {
  const { watch, setValue } = useFormContext<ServiceForm>();
  const max = watch('scaling.max');

  return (
    <>
      <ControlledInput<ServiceForm>
        name="scaling.max"
        type="number"
        label={<T id="fixedLabel" />}
        disabled={disabled}
        min={1}
        max={20}
        onChangeEffect={(event) => {
          const value = event.target.valueAsNumber;

          setValue('scaling.min', value);
          onChanged(value, value);
        }}
        className="w-34"
      />

      <Slider
        disabled={disabled}
        min={1}
        max={20}
        tickSize={2}
        renderTick={(value) => <Tick value={value} />}
        value={[max]}
        onChange={(values) => {
          const [value] = values as [number];

          if (value > 0) {
            setValue('scaling.min', value);
            setValue('scaling.max', value);
            onChanged(value, value);
          }
        }}
        className="hidden flex-1 pt-10 sm:flex"
      />

      <div className="w-20" />
    </>
  );
}

type AutoScalingProps = {
  disabled: boolean;
  onChanged: ScalingValuesProps['onChanged'];
};

function AutoScaling({ disabled, onChanged }: AutoScalingProps) {
  const { watch, setValue } = useFormContext<ServiceForm>();

  const min = watch('scaling.min');
  const max = watch('scaling.max');

  const minMin = watch('serviceType') === 'worker' ? 1 : 0;
  const minMax = max;

  const maxMin = Math.max(1, min);
  const maxMax = 20;

  return (
    <>
      <ControlledInput<ServiceForm>
        name="scaling.min"
        type="number"
        label={<T id="min" />}
        disabled={disabled}
        min={minMin}
        max={minMax}
        onChangeEffect={(event) => onChanged(event.target.valueAsNumber, max)}
        className="w-20"
      />

      <Slider
        disabled={disabled}
        min={minMin}
        max={maxMax}
        connector
        tickSize={2}
        renderTick={(value) => <Tick value={value} />}
        value={[min, max]}
        onChange={(values) => {
          const [min, max] = values as [number, number];

          if (min > 0 || max > 0) {
            setValue('scaling.min', min);
            setValue('scaling.max', max);
            onChanged(min, max);
          }
        }}
        className="hidden flex-1 pt-10 sm:flex"
      />

      <ControlledInput<ServiceForm>
        name="scaling.max"
        type="number"
        label={<T id="max" />}
        disabled={disabled}
        min={maxMin}
        max={maxMax}
        onChangeEffect={(event) => onChanged(min, event.target.valueAsNumber)}
        className="w-20"
      />
    </>
  );
}

function Tick({ value }: { value: number }) {
  if (value === 0) {
    return <IconMoon className="mt-0.5 size-4" />;
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mt-1 h-3">
      <line x1="12" y1="0" x2="12" y2="24" />
    </svg>
  );
}
