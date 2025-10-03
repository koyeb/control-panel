import { Alert, CheckboxInput, RadioInput, TabButton, TabButtons, Tooltip } from '@koyeb/design-system';

import { useCatalogRegionAvailability } from 'src/api';
import { RegionFlag } from 'src/components/region-flag';
import { useRegionLatency } from 'src/hooks/region-latency';
import { IconCircleGauge } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { CatalogInstance, CatalogRegion, RegionScope } from 'src/model';

import { CatalogAvailability as CatalogAvailabilityComponent } from './catalog-availability';

const T = createTranslate('components.instanceSelector');

const scopes: RegionScope[] = ['metropolitan', 'continental'];

type RegionSelectorProps = {
  regions: CatalogRegion[];
  selected: CatalogRegion[];
  onSelected: (selected: CatalogRegion) => void;

  instance?: CatalogInstance;
  type: 'radio' | 'checkbox';
  showLatency?: boolean;
  showAvailability?: boolean;
};

export function RegionSelector({
  regions,
  selected,
  onSelected,
  instance,
  type,
  showLatency,
  showAvailability,
}: RegionSelectorProps) {
  return (
    <>
      <ul className="grid grid-cols-1 gap-2 @md:grid-cols-2 @2xl:grid-cols-3">
        {regions.map((region) => (
          <li key={region.id}>
            <RegionItem
              type={type}
              showLatency={showLatency}
              showAvailability={showAvailability}
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
    </>
  );
}

type RegionScopeTabsProps = {
  scope: RegionScope | null;
  onScopeChanged: (scope: RegionScope) => void;
};

export function RegionScopeTabs({ scope: currentScope, onScopeChanged }: RegionScopeTabsProps) {
  if (currentScope === null) {
    return null;
  }

  return (
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
  );
}

type RegionItemProps = {
  type: 'radio' | 'checkbox';
  showLatency?: boolean;
  showAvailability?: boolean;
  instance?: CatalogInstance;
  region: CatalogRegion;
  selected: boolean;
  onSelected: () => void;
};

function RegionItem({
  type,
  showLatency,
  showAvailability,
  region,
  selected,
  onSelected,
  instance,
}: RegionItemProps) {
  const availability = useCatalogRegionAvailability(instance?.id, region.id);

  return (
    <label className="row cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 -outline-offset-2 has-focus-visible:outline has-[:checked]:border-green">
      <RegionFlag regionId={region.id} className="size-6" />

      <div className="col flex-1 gap-1.5">
        <div className="leading-none">{region.name}</div>

        {showLatency && showAvailability && (
          <div className="row gap-1 text-xs text-dim">
            {showLatency && <RegionLatency region={region} />}

            {availability && (
              <>
                <div className="text-dim">{bullet}</div>
                <CatalogAvailabilityComponent availability={availability} />
              </>
            )}
          </div>
        )}
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
