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
};

export function ScalingValues({ disabled, type }: ScalingValuesProps) {
  return (
    <div className="row gap-6">
      {type === 'fixed' && <FixedScaling disabled={disabled} />}
      {type === 'autoscaling' && <AutoScaling disabled={disabled} />}
    </div>
  );
}

function FixedScaling({ disabled }: { disabled: boolean }) {
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
        onChangeEffect={(event) => setValue('scaling.min', event.target.valueAsNumber)}
        className="w-34"
      />

      <Slider
        disabled={disabled}
        min={0}
        max={20}
        tickSize={2}
        renderTick={(value) => <Tick value={value} />}
        value={[max]}
        onChange={(values) => {
          const [value] = values as [number];

          if (value > 0) {
            setValue('scaling.min', value);
            setValue('scaling.max', value);
          }
        }}
        className="hidden flex-1 pt-10 sm:block"
      />

      <div className="w-20" />
    </>
  );
}

function AutoScaling({ disabled }: { disabled: boolean }) {
  const { watch, setValue } = useFormContext<ServiceForm>();

  const min = watch('scaling.min');
  const max = watch('scaling.max');

  return (
    <>
      <ControlledInput<ServiceForm>
        name="scaling.min"
        type="number"
        label={<T id="min" />}
        disabled={disabled}
        min={0}
        max={max}
        className="w-20"
      />

      <Slider
        disabled={disabled}
        min={0}
        max={20}
        connector
        tickSize={2}
        renderTick={(value) => <Tick value={value} />}
        value={[min, max]}
        onChange={(values) => {
          const [min, max] = values as [number, number];

          if (min > 0 || max > 0) {
            setValue('scaling.min', min);
            setValue('scaling.max', max);
          }
        }}
        className="hidden flex-1 pt-10 sm:block"
      />

      <ControlledInput<ServiceForm>
        name="scaling.max"
        type="number"
        label={<T id="max" />}
        disabled={disabled}
        min={Math.max(1, min)}
        max={20}
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
