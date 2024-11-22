import { Controller } from 'react-hook-form';

import { Slider } from '@koyeb/design-system';
import { onKeyDownPositiveInteger } from 'src/application/restrict-keys';
import { ControlledInput } from 'src/components/controlled';
import { Translate } from 'src/intl/translate';

import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

const T = Translate.prefix('serviceForm.scaling');

export function FixedScalingConfiguration() {
  const instance = useWatchServiceForm('instance');
  const hasVolumes = useWatchServiceForm('volumes').filter((volume) => volume.name !== '').length > 0;

  const canChangeScaling = !hasVolumes && instance !== 'free';

  return (
    <>
      <div className="hidden sm:block">
        <Controller<ServiceForm, 'scaling'>
          name="scaling"
          render={({ field }) => (
            <Slider
              label={<T id="scalingLabel" />}
              disabled={!canChangeScaling}
              min={1}
              max={20}
              step={1}
              marks
              value={field.value.min}
              onChange={(value) => field.onChange({ ...field.value, min: value, max: value })}
            />
          )}
        />
      </div>

      <div className="col gap-4 sm:hidden">
        <span className="col-span-2 font-semibold">
          <T id="scalingLabel" />
        </span>

        <div className="row gap-4">
          <Controller<ServiceForm, 'scaling'>
            name="scaling"
            render={({ field }) => (
              <ControlledInput<ServiceForm, 'scaling.min'>
                name="scaling.min"
                type="number"
                className="max-w-20"
                disabled={!canChangeScaling}
                onKeyDown={onKeyDownPositiveInteger}
                min={1}
                max={20}
                step={1}
                value={field.value.min}
                onChange={(value) => field.onChange({ ...field.value, min: value, max: value })}
              />
            )}
          />
        </div>
      </div>
    </>
  );
}
