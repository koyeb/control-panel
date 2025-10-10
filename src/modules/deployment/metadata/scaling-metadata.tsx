import { TooltipTitle } from '@koyeb/design-system';
import { Badge } from 'lucide-react';

import { useRegionsCatalog } from 'src/api';
import { Metadata } from 'src/components/metadata';
import { RegionFlag } from 'src/components/region-flag';
import { InfoTooltip } from 'src/components/tooltip';
import { IconLayers, IconMoon } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { DeploymentDefinition, Replica } from 'src/model';
import { unique } from 'src/utils/arrays';
import { hasProperty } from 'src/utils/object';

const T = createTranslate('modules.deployment.metadata.scaling');

type ScalingMetadataProps = {
  replicas?: Replica[];
  definition: DeploymentDefinition;
};

export function ScalingMetadata(props: ScalingMetadataProps) {
  return <Metadata label={<T id="label" />} value={<ScalingMetadataValue {...props} />} />;
}

export function ScalingMetadataValue({ replicas, definition }: ScalingMetadataProps) {
  const ScalingIcon = definition.scaling.min === 0 ? IconMoon : IconLayers;

  const scaling = {
    healthy: replicas?.filter((replica) => replica.status === 'HEALTHY').length,
    total: definition.scaling.max * definition.regions.length,
  };

  return (
    <div className="row min-w-0 items-center gap-2">
      <ScalingIcon className="size-3.5" />

      <div className="truncate">
        <T id="value" values={scaling} />
      </div>

      <InfoTooltip
        className="md:max-w-54"
        content={replicas && <ScalingTooltipContent replicas={replicas} />}
      />
    </div>
  );
}

function ScalingTooltipContent({ replicas }: { replicas: Replica[] }) {
  const regionIds = unique(replicas.map((replica) => replica.region));
  const regions = useRegionsCatalog(regionIds);

  const groups = new Map(
    regions.map((region) => [region, replicas.filter(hasProperty('region', region.id))]),
  );

  const scaling = (replicas: Replica[]) => ({
    healthy: replicas.filter(hasProperty('status', 'HEALTHY')).length,
    total: replicas.length,
  });

  return (
    <div className="col gap-3">
      <TooltipTitle title={<T id="tooltip.title" />} />

      <T id="tooltip.description" />

      {groups.size >= 2 &&
        Array.from(groups.entries()).map(([region, replicas]) => (
          <div key={region.id} className="row items-center gap-2">
            <RegionFlag regionId={region.id} className="size-4" />

            <div className="flex-1">{region.name}</div>

            <Badge color="gray" size={1}>
              <T id="tooltip.count" values={scaling(replicas)} />
            </Badge>
          </div>
        ))}
    </div>
  );
}
