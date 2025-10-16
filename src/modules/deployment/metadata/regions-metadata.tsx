import { Badge, TooltipTitle } from '@koyeb/design-system';

import { useCatalogRegion, useRegionsCatalog } from 'src/api';
import { Metadata } from 'src/components/metadata';
import { RegionFlag } from 'src/components/region-flag';
import { Tooltip } from 'src/components/tooltip';
import { Translate, createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.deployment.metadata.regions');

type RegionsMetadataProps = {
  regions: string[];
};

export function RegionsMetadata(props: RegionsMetadataProps) {
  return <Metadata label={<T id="label" />} value={<RegionsMetadataValue {...props} />} />;
}

export function RegionsMetadataValue({ regions }: RegionsMetadataProps) {
  const firstRegion = useCatalogRegion(regions[0]);

  return (
    <Tooltip
      allowHover
      className="md:min-w-36"
      content={regions.length >= 2 && <RegionsTooltipContent regions={regions} />}
      trigger={(props) => (
        <div {...props} className="inline-flex min-w-0 flex-row items-center gap-2">
          <RegionFlag regionId={firstRegion?.id} className="size-3" />

          <div className="truncate">{firstRegion?.name}</div>

          {regions.length >= 2 && (
            <Badge color="gray" size={1} className="text-default!" {...props}>
              <Translate id="common.plusCount" values={{ count: 2 }} />
            </Badge>
          )}
        </div>
      )}
    />
  );
}

function RegionsTooltipContent({ regions: regionIds }: { regions: string[] }) {
  const regions = useRegionsCatalog(regionIds);

  return (
    <div className="col gap-3">
      <TooltipTitle title={<T id="tooltip.title" />} />

      {regions.map((region) => (
        <div key={region.id} className="row items-center gap-2">
          <RegionFlag regionId={region.id} className="size-4" />
          <div>{region.name}</div>
        </div>
      ))}
    </div>
  );
}
