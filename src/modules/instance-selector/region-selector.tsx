import { CheckboxInput, Collapse, TabButton, TabButtons } from '@koyeb/design-system';
import { CatalogRegion, RegionScope } from 'src/api/model';
import { RegionFlag } from 'src/components/region-flag';
import { useRegionLatency } from 'src/hooks/region-latency';
import { createTranslate } from 'src/intl/translate';
import { unique } from 'src/utils/arrays';

const T = createTranslate('components.instanceSelector.new');

type RegionSelectorProps = {
  expanded: boolean;
  regions: CatalogRegion[];
  selected: CatalogRegion[];
  onSelected: (selected: CatalogRegion[]) => void;
  scope: RegionScope;
  onScopeChanged: (scope: RegionScope) => void;
};

export function RegionSelector({
  expanded,
  regions,
  selected,
  onSelected,
  scope: currentScope,
  onScopeChanged,
}: RegionSelectorProps) {
  const regionsInScope = regions.filter((region) => region.scope === currentScope);
  const uniqueScopes = unique(regions.map((region) => region.scope));

  const toggleRegion = (region: CatalogRegion) => {
    const index = selected.indexOf(region);

    if (index === -1) {
      onSelected([...selected, region]);
    } else {
      onSelected(selected.filter((r) => r !== region));
    }
  };

  return (
    <Collapse open={expanded}>
      <div className="row mb-2 mt-4 items-center justify-between">
        <div className="text-dim">
          <T id="regions.label" />
        </div>

        {uniqueScopes.length > 1 && (
          <TabButtons size={1} className="w-full">
            {uniqueScopes.map((scope) => (
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

      <ul className="row flex-wrap justify-start gap-4">
        {regionsInScope.map((region) => (
          <li key={region.identifier} className="w-56">
            <RegionItem
              region={region}
              selected={selected.includes(region)}
              onSelected={() => toggleRegion(region)}
            />
          </li>
        ))}

        {/* todo: empty state */}
        {regionsInScope.length === 0 && <>No region available</>}
      </ul>
    </Collapse>
  );
}

type RegionItemProps = {
  region: CatalogRegion;
  selected: boolean;
  onSelected: () => void;
};

function RegionItem({ region, selected, onSelected }: RegionItemProps) {
  const latency = useRegionLatency(region);

  return (
    <label className="row cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 has-[:checked]:border-green">
      <RegionFlag identifier={region.identifier} className="size-6" />

      <div className="flex-1">
        <div className="leading-none">{region.displayName}</div>

        {latency !== null && (
          <div className="mt-1 text-xs leading-none text-dim">
            {latency === undefined && <T id="regions.checkingLatency" />}
            {latency !== undefined && <T id="regions.latency" values={{ value: latency }} />}
          </div>
        )}
      </div>

      <CheckboxInput checked={selected} onChange={onSelected} />
    </label>
  );
}
