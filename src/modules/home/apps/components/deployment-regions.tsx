import { Badge, Tooltip } from '@koyeb/design-system';

import { useCatalogRegion } from 'src/api';
import { RegionFlag } from 'src/components/region-flag';
import { RegionsList } from 'src/components/regions-list';
import { Translate } from 'src/intl/translate';

type DeploymentRegionsProps = {
  regions: string[];
};

export function DeploymentRegions({ regions }: DeploymentRegionsProps) {
  const firstRegion = regions[0];
  const region = useCatalogRegion(firstRegion);

  if (firstRegion === undefined) {
    return null;
  }

  return (
    <div className="row items-center gap-2">
      <RegionFlag regionId={firstRegion} className="size-4" />

      {region?.name}

      {regions.length >= 2 && (
        <Tooltip content={<RegionsList regionIds={regions} />}>
          {(props) => (
            <Badge {...props} size={1}>
              <Translate id="common.plusCount" values={{ count: regions.length - 1 }} />
            </Badge>
          )}
        </Tooltip>
      )}
    </div>
  );
}
