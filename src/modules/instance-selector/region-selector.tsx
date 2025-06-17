import {
  Alert,
  CheckboxInput,
  Collapse,
  RadioInput,
  TabButton,
  TabButtons,
  Tooltip,
} from '@koyeb/design-system';
import { useCatalogRegionAvailability } from 'src/api/hooks/catalog';
import { CatalogInstance, CatalogRegion, RegionScope } from 'src/api/model';
import { IconCircleGauge } from 'src/components/icons';
import { RegionFlag } from 'src/components/region-flag';
import { useRegionLatency } from 'src/hooks/region-latency';
import { createTranslate } from 'src/intl/translate';

import { CatalogAvailability as CatalogAvailabilityComponent } from './catalog-availability';

const T = createTranslate('components.instanceSelector');

const scopes: RegionScope[] = ['metropolitan', 'continental'];

type RegionSelectorProps = {
  expanded: boolean;
  regions: CatalogRegion[];
  selected: CatalogRegion[];
  onSelected: (selected: CatalogRegion) => void;
  scope: RegionScope | null;
  onScopeChanged: (scope: RegionScope) => void;
  instance: CatalogInstance;
  type: 'radio' | 'checkbox';
};

export function RegionSelector({
  expanded,
  regions,
  selected,
  onSelected,
  scope: currentScope,
  onScopeChanged,
  instance,
  type,
}: RegionSelectorProps) {
  return (
    <Collapse open={expanded}>
      <div className="col sm:row mb-3 mt-4 items-start justify-between gap-2 sm:items-center">
        <div className="text-dim">
          <T id="regions.label" />
        </div>

        {currentScope !== null && (
          <TabButtons size={1} className="w-full">
            {scopes.map((scope) => (
              <TabButton
                key={scope}
                size={1}
                selected={currentScope === scope}
                onClick={() => onScopeChanged(scope)}
              >
                <T id={`regionScope.${scope}`} />
              </TabButton>
            ))}
          </TabButtons>
        )}
      </div>

      <ul className="row flex-wrap justify-start gap-2">
        {regions.map((region) => (
          <li key={region.id} className="w-full sm:w-64">
            <RegionItem
              type={type}
              instance={instance}
              region={region}
              selected={selected.includes(region)}
              onSelected={() => onSelected(region)}
            />
          </li>
        ))}

        {/* todo: empty state */}
        {regions.length === 0 && <>No region available</>}
      </ul>

      {selected.length === 0 && (
        <Alert variant="error" description={<T id="regions.noRegionSelected" />} className="mt-4" />
      )}
    </Collapse>
  );
}

type RegionItemProps = {
  type: 'radio' | 'checkbox';
  instance: CatalogInstance;
  region: CatalogRegion;
  selected: boolean;
  onSelected: () => void;
};

function RegionItem({ type, region, selected, onSelected, instance }: RegionItemProps) {
  const availability = useCatalogRegionAvailability(instance.id, region.id);

  return (
    <label className="row cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 has-[:checked]:border-green">
      <RegionFlag regionId={region.id} className="size-6" />

      <div className="col flex-1 gap-1.5">
        <div className="leading-none">{region.name}</div>

        <div className="row gap-1 text-xs text-dim">
          <RegionLatency region={region} />

          {availability && (
            <>
              <div className="text-dim">{bullet}</div>
              <CatalogAvailabilityComponent availability={availability} />
            </>
          )}
        </div>
      </div>

      {type === 'radio' && <RadioInput checked={selected} onChange={onSelected} />}
      {type === 'checkbox' && <CheckboxInput checked={selected} onChange={onSelected} />}
    </label>
  );
}

const bullet = '•';

function RegionLatency({ region }: { region: CatalogRegion }) {
  const latency = useRegionLatency(region);

  if (!latency) {
    return null;
  }

  return (
    <Tooltip content={<T id="latencyTooltip" values={{ latency }} />}>
      {(props) => (
        <div {...props} className="row items-center gap-1">
          <IconCircleGauge className="size-4" />
          <T id="regions.latency" values={{ value: latency }} />
        </div>
      )}
    </Tooltip>
  );
}
