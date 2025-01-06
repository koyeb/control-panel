import { useController } from 'react-hook-form';

import { onKeyDownPositiveInteger } from 'src/application/restrict-keys';
import { ControlledInput } from 'src/components/controlled';
import { createTranslate } from 'src/intl/translate';

import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { handleScalingValueBlurred } from './handle-scaling-value-blurred';

const T = createTranslate('serviceForm.scaling');

export function FixedScalingConfiguration() {
  const instance = useWatchServiceForm('instance');
  const hasVolumes = useWatchServiceForm('volumes').filter((volume) => volume.name !== '').length > 0;

  const canChangeScaling = !hasVolumes && instance !== 'free';

  const { field } = useController<ServiceForm, 'scaling'>({ name: 'scaling' });

  const setValue = (value: number) => {
    field.onChange({ ...field.value, min: value, max: value });
  };

  return (
    <ControlledInput<ServiceForm, 'scaling.min'>
      name="scaling.min"
      type="number"
      label={<T id="scalingLabel" />}
      disabled={!canChangeScaling}
      onKeyDown={onKeyDownPositiveInteger}
      min={1}
      max={20}
      step={1}
      value={field.value.min}
      onChange={(event) => setValue(event.target.valueAsNumber)}
      onBlur={(event) => handleScalingValueBlurred(event, setValue)}
      inputBoxClassName="max-w-24"
    />
  );
}
