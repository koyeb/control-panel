import { Field, FieldHelperText, FieldLabel, RadioInput } from '@koyeb/design-system';

import { useRegions } from 'src/api/hooks/catalog';
import { CatalogRegion } from 'src/api/model';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.volumes.create');

type RegionSelectorProps = {
  selected: string;
  onChange: (identifier: string) => void;
  error?: React.ReactNode;
};

export function RegionSelector({ selected, onChange, error }: RegionSelectorProps) {
  const regions = useRegions().filter((region) => region.volumesEnabled);

  return (
    <Field
      label={
        <FieldLabel>
          <T id="regions.label" />
        </FieldLabel>
      }
      helperText={<FieldHelperText invalid={Boolean(error)}>{error}</FieldHelperText>}
      className="gap-3!"
    >
      {(['continental', 'metropolitan'] as const).map((scope) => (
        <div key={scope} className="col gap-2">
          <div className="text-xs font-bold text-dim">
            <T id={`regions.${scope}`} />
          </div>

          <div className="grid max-w-3xl grid-cols-3 gap-4">
            {regions
              .filter((region) => region.scope === scope)
              .map((region) => (
                <RegionItem
                  key={region.id}
                  region={region}
                  selected={selected === region.id}
                  onSelected={() => onChange(region.id)}
                />
              ))}
          </div>
        </div>
      ))}
    </Field>
  );
}

type RegionItemProps = {
  region: CatalogRegion;
  selected: boolean;
  onSelected: () => void;
};

function RegionItem({ region, selected, onSelected }: RegionItemProps) {
  return (
    <label className="row cursor-pointer items-center gap-2 rounded-md border px-3 py-1">
      <RegionFlag regionId={region.id} className="size-5" />
      <RegionName regionId={region.id} className="flex-1" />
      <RadioInput type="radio" checked={selected} onChange={() => onSelected()} />
    </label>
  );
}
