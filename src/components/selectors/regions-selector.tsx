import clsx from 'clsx';

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
    regions: CatalogRegion[];
    value: CatalogRegion[];
    onChange: (regions: CatalogRegion[]) => void;
  }
>;

export function RegionsSelector({ label, regions, value, onChange, ...props }: RegionsSelectorProps) {
  return (
    <Select
      items={regions}
      select={{ stateReducer: multiSelectStateReducer }}
      value={null}
      onChange={(region) => onChange(arrayToggle(value, region))}
      renderValue={() => (
        <div className="row items-center gap-2">
          <RegionFlagsList regions={regions} value={value} />
          {label}
          <SelectedCountBadge selected={value.length} total={regions.length} />
        </div>
      )}
      menu={(context) => (
        <MultiSelectMenu
          context={context}
          items={regions}
          selected={value}
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
  value: CatalogRegion[];
};

function RegionFlagsList({ regions, value: value }: RegionFlagsListProps) {
  return (
    <div className="flex flex-row-reverse">
      {regions
        .slice()
        .reverse()
        .map((region) => (
          <RegionFlag
            key={region.id}
            regionId={region.id}
            className={clsx(
              '-ml-0.75 size-2.5 border border-neutral',
              !value.includes(region) && 'grayscale',
            )}
          />
        ))}
    </div>
  );
}
