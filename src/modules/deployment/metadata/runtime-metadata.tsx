import { Badge } from '@koyeb/design-system';

import { useCatalogInstance, useRegionsCatalog, useVolumes } from 'src/api';
import { Metadata } from 'src/components/metadata';
import { RegionFlag } from 'src/components/region-flag';
import { RegionsList } from 'src/components/regions-list';
import { Tooltip } from 'src/components/tooltip';
import { Translate, createTranslate } from 'src/intl/translate';
import { DeploymentDefinition, EnvironmentVariable, type Scaling } from 'src/model';
import { hasProperty } from 'src/utils/object';

const T = createTranslate('modules.deployment.deploymentInfo');

export function InstanceTypeMetadata({ instanceType }: { instanceType: string | null }) {
  const instance = useCatalogInstance(instanceType);

  return <Metadata label={<T id="instanceTypeLabel" />} value={instance?.displayName} />;
}

export function ScalingMetadata({ scaling }: { scaling: Scaling }) {
  const value = () => {
    if (scaling.min === scaling.max) {
      return <T id="fixedScalingValue" values={{ instances: scaling.min }} />;
    }

    return <T id="autoScalingValue" values={{ min: scaling.min, max: scaling.max }} />;
  };

  return <Metadata label={<T id="scalingLabel" />} value={value()} />;
}

export function RegionsMetadata({ regions }: { regions: string[] }) {
  const [firstRegion, ...otherRegions] = regions;
  const catalogRegions = useRegionsCatalog();

  if (!firstRegion) {
    return null;
  }

  const catalogRegion = catalogRegions.find(hasProperty('id', firstRegion));

  return (
    <Metadata
      label={<T id="regionsLabel" />}
      value={
        <div className="row items-center gap-2">
          <RegionFlag regionId={firstRegion} className="size-4" />

          {catalogRegion?.name}

          {otherRegions.length > 0 && (
            <Tooltip
              content={<RegionsList regionIds={otherRegions} />}
              trigger={(props) => (
                <Badge size={1} {...props}>
                  <Translate id="common.plusCount" values={{ count: otherRegions.length }} />
                </Badge>
              )}
            />
          )}
        </div>
      }
    />
  );
}

export function EnvironmentMetadata({ definition }: { definition: DeploymentDefinition }) {
  const { environmentVariables, files } = definition;

  const content = () => {
    if (environmentVariables.length === 0) {
      return null;
    }

    return (
      <div className="whitespace-nowrap">
        {environmentVariables.map(formatEnvironmentVariable).map((line, index) => (
          <div key={index} className="truncate">
            {line}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Metadata
      label={<T id="environmentLabel" />}
      value={
        <Tooltip
          allowHover
          content={content()}
          className="max-w-md"
          trigger={(props) => (
            <span {...props}>
              <T
                id="environmentValue"
                values={{ variables: environmentVariables.length, files: files.length }}
              />
            </span>
          )}
        />
      }
    />
  );
}

function formatEnvironmentVariable({ name, value }: EnvironmentVariable) {
  return `${name}=${value}`;
}

export function VolumesMetadata({ definition }: { definition: DeploymentDefinition }) {
  const { volumes: attachedVolumes } = definition;
  const volumes = useVolumes();

  const content = () => {
    if (attachedVolumes.length === 0) {
      return null;
    }

    return (
      <div className="whitespace-nowrap">
        {attachedVolumes.map(({ volumeId, mountPath }) => (
          <div key={volumeId} className="truncate">
            <T
              id="attachedVolume"
              values={{
                volumeName: volumes?.find(hasProperty('id', volumeId))?.name,
                mountPath,
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <Metadata
      label={<T id="volumesLabel" />}
      value={
        <Tooltip
          allowHover
          content={content()}
          className="max-w-md"
          trigger={(props) => (
            <span {...props}>
              <T id="volumesValue" values={{ count: attachedVolumes.length }} />
            </span>
          )}
        />
      }
    />
  );
}
