import { Badge, Tooltip } from '@koyeb/design-system';
import { useRegion } from 'src/api/hooks/catalog';
import { RegionFlag } from 'src/components/region-flag';
import { RegionsList } from 'src/components/regions-list';
import { Translate } from 'src/intl/translate';

type DeploymentRegionsProps = {
  regions: string[];
};

export function DeploymentRegions({ regions }: DeploymentRegionsProps) {
  const firstRegion = regions[0];
  const region = useRegion(firstRegion);

  if (firstRegion === undefined) {
    return null;
  }

  return (
    <div className="row items-center gap-2">
      <RegionFlag identifier={firstRegion} className="size-4 rounded-full shadow-badge" />

      {region?.displayName}

      {regions.length >= 2 && (
        <Tooltip content={<RegionsList identifiers={regions} />}>
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
