import { Field, FieldHelperText, FieldLabel, RadioInput } from '@koyeb/design-system';
import clsx from 'clsx';

import { useRegions } from 'src/api/hooks/catalog';
import { CatalogRegion } from 'src/api/model';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.volumes.create');

type RegionSelectorProps = {
  field: React.ComponentProps<'input'> & { onChange: (regionId: string) => void };
  error?: React.ReactNode;
};

export function RegionSelector({ field, error }: RegionSelectorProps) {
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

          <div className="row max-w-4xl flex-wrap gap-4">
            {regions
              .filter((region) => region.scope === scope)
              .map((region) => (
                <RegionItem key={region.id} region={region} {...field} />
              ))}
          </div>
        </div>
      ))}
    </Field>
  );
}

type RegionItemProps = RegionSelectorProps['field'] & {
  region: CatalogRegion;
};

function RegionItem({ region, ...field }: RegionItemProps) {
  return (
    <label
      className={clsx(
        'row w-64 cursor-pointer items-center gap-2 rounded-md border px-3 py-1',
        'has-disabled:pointer-events-none has-disabled:bg-muted has-disabled:text-dim',
      )}
    >
      <RegionFlag regionId={region.id} className="size-5" />
      <RegionName regionId={region.id} className="flex-1" />
      <RadioInput {...field} checked={field.value === region.id} onChange={() => field.onChange(region.id)} />
    </label>
  );
}
