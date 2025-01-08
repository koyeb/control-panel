import { useController, useWatch } from 'react-hook-form';

import { SelectBox, useBreakpoint } from '@koyeb/design-system';
import { useRegion, useRegions } from 'src/api/hooks/catalog';
import { CatalogRegion } from 'src/api/model';
import { RegionFlag } from 'src/components/region-flag';
import { RegionLatency } from 'src/components/region-latency';
import { RegionsMap } from 'src/components/regions-map/regions-map';
import { useRegionLatency } from 'src/hooks/region-latency';
import { createTranslate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';

import { DatabaseServiceFormSection } from '../components/database-service-form-section';
import { DatabaseServiceForm } from '../database-service-form.types';

const T = createTranslate('modules.databaseForm.region');

const neonRegions = ['fra', 'was', 'sin'];

export function RegionSection() {
  const regions = useRegions().filter((region) => neonRegions.includes(region.identifier));
  const isDesktop = useBreakpoint('xl');

  return (
    <DatabaseServiceFormSection
      section="region"
      title={<SectionTitle />}
      expandedTitle={<T id="expandedTitle" />}
      shortcut={2}
      description={<T id="description" />}
    >
      {isDesktop && (
        <RegionsMap
          regions={regions}
          renderRegion={(region) => (
            <RegionItem
              region={region}
              classes={{
                content: 'col gap-1 rounded-r-lg p-2',
                title: '!p-0',
                description: '!p-0',
              }}
            />
          )}
        />
      )}

      {!isDesktop && <RegionsList regions={regions} />}
    </DatabaseServiceFormSection>
  );
}

function SectionTitle() {
  const regionIdentifier = useWatch<DatabaseServiceForm, 'region'>({ name: 'region' });
  const region = useRegion(regionIdentifier);
  const latency = useRegionLatency(region);

  assert(region !== undefined);

  return (
    <div className="row items-center gap-1">
      <RegionFlag identifier={region.identifier} className="me-1 size-5" />

      <div>{region.displayName}</div>

      {latency && (
        <div className="font-normal text-dim">
          (<RegionLatency region={region} />)
        </div>
      )}
    </div>
  );
}

function RegionsList({ regions }: { regions: CatalogRegion[] }) {
  return (
    <div className="gaps grid grid-cols-1 md:grid-cols-2">
      {regions.map((region) => (
        <RegionItem key={region.identifier} region={region} />
      ))}
    </div>
  );
}

type RegionItemProps = {
  region: CatalogRegion;
  classes?: Record<string, string>;
};

function RegionItem({ region, classes }: RegionItemProps) {
  const {
    field: { value, onChange, ...field },
  } = useController<DatabaseServiceForm, 'region'>({ name: 'region' });

  return (
    <SelectBox
      type="radio"
      title={
        <div className="row items-center gap-1">
          <RegionFlag identifier={region.identifier} className="size-5" />
          {region.displayName}
        </div>
      }
      description={
        <div className="whitespace-nowrap">
          <RegionLatency region={region} />
        </div>
      }
      classes={classes}
      value={region.identifier}
      checked={value === region.identifier}
      onChange={() => onChange(region.identifier)}
      {...field}
    />
  );
}
