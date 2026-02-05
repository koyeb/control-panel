import clsx from 'clsx';

import { useRegionsCatalog } from 'src/api';
import { IconCheck } from 'src/icons';
import { CatalogRegion } from 'src/model';
import { arrayToggle } from 'src/utils/arrays';
import { getId } from 'src/utils/object';
import { Extend } from 'src/utils/types';

import { MultiSelectMenu, Select, SelectedCountBadge, multiSelectStateReducer } from '../forms';
import { RegionFlag } from '../region-flag';
import { RegionName } from '../region-name';

type RegionsSelectorProps = Extend<
  Omit<React.ComponentProps<typeof Select<CatalogRegion>>, 'items'>,
  {
    label?: React.ReactNode;
    regions: string[];
    value: string[];
    onChange: (regions: string[]) => void;
  }
>;

export function RegionsSelector({ label, regions, value, onChange, ...props }: RegionsSelectorProps) {
  const catalogRegions = useRegionsCatalog(regions);

  return (
    <Select
      items={catalogRegions}
      select={{ stateReducer: multiSelectStateReducer }}
      value={null}
      onChange={(region) => onChange(arrayToggle(value, region.id))}
      renderValue={() => (
        <div className="row items-center gap-2">
          <RegionFlagsList regions={catalogRegions} value={value} />
          {label}
          <SelectedCountBadge selected={value.length} total={regions.length} />
        </div>
      )}
      menu={(context) => (
        <MultiSelectMenu
          context={context}
          items={catalogRegions}
          selected={catalogRegions.filter((region) => value.includes(region.id))}
          getKey={getId}
          onClearAll={() => onChange([])}
          onSelectAll={() => onChange(regions)}
          renderItem={(region, selected) => (
            <div className="row w-full min-w-56 items-center gap-2 px-3 py-1.5">
              <div className="row flex-1 items-center gap-2">
                <RegionFlag regionId={region.id} className="size-4" />
                <RegionName regionId={region.id} />
              </div>

              {selected && (
                <div>
                  <IconCheck className="size-4 text-green" />
                </div>
              )}
            </div>
          )}
        />
      )}
      {...props}
    />
  );
}

type RegionFlagsListProps = {
  regions: CatalogRegion[];
  value: string[];
};

function RegionFlagsList({ regions, value }: RegionFlagsListProps) {
  return (
    <div className="flex flex-row-reverse">
      {regions
        .slice()
        .reverse()
        .map((region) => (
          <div key={region.id} className="-ml-0.75">
            <RegionFlag
              regionId={region.id}
              className={clsx('size-2.5 border border-neutral', !value.includes(region.id) && 'grayscale')}
            />
          </div>
        ))}
    </div>
  );
}
