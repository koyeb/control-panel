import { Controller } from 'react-hook-form';

import { SelectBox } from '@koyeb/design-system';
import { useInstance } from 'src/api/hooks/catalog';
import { CatalogRegion } from 'src/api/model';
import { useRegionAvailability } from 'src/application/instance-region-availability';
import { RegionFlag } from 'src/components/region-flag';
import { RegionLatency } from 'src/components/region-latency';

import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

type RegionItemProps = {
  region: CatalogRegion;
  classes?: Record<string, string>;
};

export function RegionItem({ region, classes }: RegionItemProps) {
  const selectedInstance = useInstance(useWatchServiceForm('instance'));
  const hasVolumes = useWatchServiceForm('volumes').filter((volume) => volume.name !== '').length > 0;
  const [isAvailable] = useRegionAvailability(region.identifier, { instance: selectedInstance ?? undefined });

  return (
    <Controller<ServiceForm, 'regions'>
      name="regions"
      render={({ field: { onChange, value, ...field } }) => (
        <SelectBox
          {...field}
          type="checkbox"
          value={region.identifier}
          disabled={!isAvailable || hasVolumes}
          icon={<RegionFlag identifier={region.identifier} className="size-5" />}
          title={region.displayName}
          description={<RegionLatency region={region} />}
          checked={value.includes(region.identifier)}
          onChange={(event) => {
            if (selectedInstance?.identifier === 'free') {
              onChange([event.target.value]);
              return;
            }

            const values = value.slice();

            if (event.target.checked) {
              values.push(region.identifier);
            } else {
              values.splice(values.indexOf(region.identifier), 1);
            }

            onChange(values);
          }}
          onBlur={field.onBlur}
          classes={classes}
        />
      )}
    />
  );
}
