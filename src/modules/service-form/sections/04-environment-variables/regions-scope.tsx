import { useController } from 'react-hook-form';

import { Checkbox, MultiSelect } from '@koyeb/design-system';
import { useRegions } from 'src/api/hooks/catalog';
import { CatalogRegion } from 'src/api/model';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { hasProperty } from 'src/utils/object';

import { ServiceForm } from '../../service-form.types';

type RegionsScopeProps = {
  index: number;
  label: React.ReactNode;
  className?: string;
};

export function RegionsScope({ index, label, className }: RegionsScopeProps) {
  const regions = useRegions().filter(hasProperty('status', 'available'));

  const { field } = useController<ServiceForm, `environmentVariables.${number}.regions`>({
    name: `environmentVariables.${index}.regions`,
  });

  return (
    <MultiSelect<CatalogRegion>
      ref={field.ref}
      onBlur={field.onBlur}
      disabled={field.disabled}
      label={label}
      items={regions}
      selectedItems={regions.filter((region) => field.value.includes(region.id))}
      onItemsSelected={(region) => field.onChange([...field.value, region.id])}
      onItemsUnselected={(region) => field.onChange(field.value.filter((value) => value !== region.id))}
      getKey={(region) => region.id}
      itemToString={(region) => region.displayName}
      renderItem={(region, selected) => (
        <div className="row items-center gap-2">
          <Checkbox checked={selected} readOnly className="pointer-events-none" />
          <RegionItem region={region} />
        </div>
      )}
      renderSelectedItems={(regions) => <SelectedRegions regions={regions} />}
      className={className}
    />
  );
}

function SelectedRegions({ regions }: { regions: CatalogRegion[] }) {
  if (regions.length === 0) {
    return 'All regions';
  }

  if (regions.length === 1) {
    return (
      <div className="row items-center gap-2">
        <RegionItem region={regions[0]} />
      </div>
    );
  }

  return (
    <div className="row items-center">
      {regions.map((region, index) => (
        <RegionFlag
          key={region.id}
          regionId={region.id}
          style={{ marginLeft: `${-index / 2}rem` }}
          className="size-5"
        />
      ))}
      <span className="ml-2">{regions.length} regions</span>
    </div>
  );
}

function RegionItem({ region }: { region?: CatalogRegion }) {
  return (
    <>
      <RegionFlag regionId={region?.id} className="size-5" />
      <RegionName regionId={region?.id} />
    </>
  );
}
