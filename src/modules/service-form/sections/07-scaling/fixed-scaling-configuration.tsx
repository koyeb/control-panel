import { onKeyDownPositiveInteger } from 'src/application/restrict-keys';
import { ControlledInput, ControlledSlider } from 'src/components/controlled';
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
        <ControlledSlider<ServiceForm, 'scaling.fixed'>
          name="scaling.fixed"
          label={<T id="scalingLabel" />}
          disabled={!canChangeScaling}
          min={1}
          max={20}
          step={1}
          marks
        />
      </div>

      <div className="col gap-4 sm:hidden">
        <span className="col-span-2 font-semibold">
          <T id="scalingLabel" />
        </span>

        <div className="row gap-4">
          <ControlledInput<ServiceForm, 'scaling.fixed'>
            name="scaling.fixed"
            type="number"
            className="max-w-20"
            disabled={!canChangeScaling}
            onKeyDown={onKeyDownPositiveInteger}
            min={1}
            max={20}
            step={1}
          />
        </div>
      </div>
    </>
  );
}
